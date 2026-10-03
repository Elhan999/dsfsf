import type { Express } from 'express';
import { createApp } from './src/app';

/** Vercel entry point: the app runs as a serverless function, so there is no listener and no WebSocket server. */
const app: Express = createApp();

export default app;
