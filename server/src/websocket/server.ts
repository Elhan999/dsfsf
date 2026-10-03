import { IncomingMessage, Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { z } from 'zod';
import { queryOne } from '../db/pool';
import { messagesService } from '../services/messages.service';
import { projectsService } from '../services/projects.service';
import { AppError } from '../utils/errors';
import { config } from '../utils/config';
import { verifyAccessToken } from '../utils/tokens';
import { messageContent } from '../validators/messages.validators';
import { ClientState, hub } from './hub';

/**
 * Connection URLs:
 *   ws://host/ws?token=<accessToken>                     – notifications + presence
 *   ws://host/ws/project/:projectId?token=<accessToken>  – same, and auto-joins the project room
 * Browsers can't set headers on WebSocket requests, so the short-lived access token goes in the query.
 */
const clientEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('join_project'), projectId: z.number().int().positive() }),
  z.object({ type: z.literal('leave_project'), projectId: z.number().int().positive() }),
  z.object({ type: z.literal('send_message'), projectId: z.number().int().positive(), content: messageContent }),
  z.object({ type: z.literal('typing_start'), projectId: z.number().int().positive() }),
  z.object({ type: z.literal('typing_stop'), projectId: z.number().int().positive() }),
  z.object({ type: z.literal('ping') }),
]);

const PATH = /^\/ws(?:\/project\/(\d+))?\/?$/;

function sendError(socket: WebSocket, message: string, extra: Record<string, unknown> = {}) {
  hub.send(socket, { type: 'error', message, ...extra });
}

async function joinRoom(socket: WebSocket, state: ClientState, projectId: number) {
  if (!(await projectsService.isMember(projectId, state.userId))) {
    return sendError(socket, 'You are not a member of this project.', { projectId });
  }
  state.rooms.add(projectId);
  state.memberOf.add(projectId);
  const members = await projectsService.getMembers(projectId);
  hub.send(socket, {
    type: 'joined_project',
    projectId,
    onlineUserIds: members.filter((m) => m.user.isOnline).map((m) => m.user.id),
  });
}

async function initConnection(
  socket: WebSocket,
  userId: number,
  initialProjectId: number | null,
): Promise<ClientState | null> {
  const user = await queryOne<{ name: string; avatar: string | null }>('SELECT name, avatar FROM users WHERE id = $1', [
    userId,
  ]);
  if (!user) {
    socket.close(4401, 'Unknown user');
    return null;
  }
  const wasOnline = hub.isOnline(userId);
  const state: ClientState = {
    userId,
    name: user.name,
    avatar: user.avatar,
    memberOf: new Set(await projectsService.memberProjectIds(userId)),
    rooms: new Set(),
  };
  if (socket.readyState !== WebSocket.OPEN) return null;
  hub.add(socket, state);
  hub.send(socket, { type: 'connected', userId });
  if (!wasOnline) hub.broadcastToTeammates(userId, state.memberOf, { type: 'user_online', userId });
  if (initialProjectId) await joinRoom(socket, state, initialProjectId);
  return state;
}

async function handleEvent(socket: WebSocket, state: ClientState, event: z.infer<typeof clientEvent>) {
  const user = { id: state.userId, name: state.name };
  switch (event.type) {
    case 'ping':
      return hub.send(socket, { type: 'pong' });
    case 'join_project':
      return joinRoom(socket, state, event.projectId);
    case 'leave_project':
      state.rooms.delete(event.projectId);
      return hub.broadcastToRoom(event.projectId, { type: 'typing_stop', projectId: event.projectId, user });
    case 'send_message':
      // messagesService re-checks membership and broadcasts new_message to the room.
      await messagesService.send(event.projectId, state.userId, event.content);
      return;
    case 'typing_start':
    case 'typing_stop':
      if (!state.rooms.has(event.projectId)) return;
      return hub.broadcastToRoom(event.projectId, { type: event.type, projectId: event.projectId, user }, socket);
  }
}

export function attachWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const match = PATH.exec(url.pathname);
    const origin = req.headers.origin;
    if (!match || (origin && origin !== config.clientUrl)) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      return socket.destroy();
    }
    let userId: number;
    try {
      userId = verifyAccessToken(url.searchParams.get('token') ?? '').sub;
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      return socket.destroy();
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, userId, match[1] ? Number(match[1]) : null);
    });
  });

  wss.on('connection', (socket: WebSocket, userId: number, initialProjectId: number | null) => {
    // Listeners are attached synchronously so events sent right after `open` are not lost;
    // they wait for the connection state to finish loading.
    const ready = initConnection(socket, userId, initialProjectId).catch((error) => {
      console.error(error);
      socket.close(1011, 'Initialization failed');
      return null;
    });

    let alive = true;
    socket.on('pong', () => (alive = true));
    const heartbeat = setInterval(() => {
      if (!alive) return socket.terminate();
      alive = false;
      socket.ping();
    }, 30_000);

    socket.on('message', async (raw) => {
      const state = await ready;
      if (!state) return;
      let event: z.infer<typeof clientEvent>;
      try {
        event = clientEvent.parse(JSON.parse(raw.toString()));
      } catch {
        return sendError(socket, 'Invalid event.');
      }
      try {
        await handleEvent(socket, state, event);
      } catch (error) {
        sendError(socket, error instanceof AppError ? error.message : 'Something went wrong.', {
          event: event.type,
          ...('projectId' in event && { projectId: event.projectId }),
        });
        if (!(error instanceof AppError)) console.error(error);
      }
    });

    socket.on('close', async () => {
      clearInterval(heartbeat);
      const state = await ready;
      hub.remove(socket);
      if (!state) return;
      const user = { id: userId, name: state.name };
      for (const projectId of state.rooms) hub.broadcastToRoom(projectId, { type: 'typing_stop', projectId, user });
      if (!hub.isOnline(userId)) hub.broadcastToTeammates(userId, state.memberOf, { type: 'user_offline', userId });
    });
  });

  return wss;
}
