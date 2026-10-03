import { WebSocket } from 'ws';

/**
 * In-memory registry of live sockets. Services use it to push events;
 * it has no knowledge of the database so it can be imported from anywhere.
 */
export interface ClientState {
  userId: number;
  name: string;
  avatar: string | null;
  /** Projects the user belongs to (for presence fan-out). */
  memberOf: Set<number>;
  /** Project rooms the socket has joined (for chat + typing). */
  rooms: Set<number>;
}

const clients = new Map<WebSocket, ClientState>();

export type ServerEvent = { type: string; [key: string]: unknown };

function send(socket: WebSocket, event: ServerEvent) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
}

export const hub = {
  add(socket: WebSocket, state: ClientState) {
    clients.set(socket, state);
  },
  remove(socket: WebSocket) {
    clients.delete(socket);
  },
  get(socket: WebSocket) {
    return clients.get(socket);
  },
  send,

  isOnline(userId: number): boolean {
    for (const state of clients.values()) if (state.userId === userId) return true;
    return false;
  },

  onlineUserIds(): Set<number> {
    return new Set([...clients.values()].map((s) => s.userId));
  },

  isInRoom(userId: number, projectId: number): boolean {
    for (const state of clients.values()) {
      if (state.userId === userId && state.rooms.has(projectId)) return true;
    }
    return false;
  },

  sendToUser(userId: number, event: ServerEvent) {
    for (const [socket, state] of clients) if (state.userId === userId) send(socket, event);
  },

  /** Sends to every socket that has joined the project room. */
  broadcastToRoom(projectId: number, event: ServerEvent, exceptSocket?: WebSocket) {
    for (const [socket, state] of clients) {
      if (socket !== exceptSocket && state.rooms.has(projectId)) send(socket, event);
    }
  },

  /** Sends to every connected user who shares at least one project with the given set. */
  broadcastToTeammates(userId: number, projectIds: Set<number>, event: ServerEvent) {
    for (const [socket, state] of clients) {
      if (state.userId === userId) continue;
      for (const id of projectIds) {
        if (state.memberOf.has(id)) {
          send(socket, event);
          break;
        }
      }
    }
  },

  /** Keeps socket state in sync when membership changes over REST. */
  addMembership(userId: number, projectId: number) {
    for (const state of clients.values()) if (state.userId === userId) state.memberOf.add(projectId);
  },

  removeMembership(userId: number, projectId: number) {
    for (const [socket, state] of clients) {
      if (state.userId !== userId) continue;
      state.memberOf.delete(projectId);
      if (state.rooms.delete(projectId)) send(socket, { type: 'removed_from_project', projectId });
    }
  },
};
