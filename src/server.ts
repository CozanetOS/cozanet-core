/**
 * CozanetOS Core API Server
 *
 * Endpoints:
 *   POST /api/chat         — Full response
 *   POST /api/chat/stream  — Streaming response (SSE)
 *   GET  /api/history/:sessionId — Conversation history
 *   DELETE /api/history/:sessionId — Clear session
 *   GET  /api/health       — Health check
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { CEO } from './CEO/ceo.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ─── Health ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cozanet-core', timestamp: Date.now() });
});

// ─── Chat (full response) ────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const ceo = CEO.getInstance();
    const { reply, memoryUsed } = await ceo.chat({ message, sessionId });
    res.json({ reply, sessionId, memoryUsed, timestamp: Date.now() });
  } catch (err: any) {
    console.error('[CEO] Chat error:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// ─── Chat Stream (SSE) ───────────────────────────────────────────────────────
app.post('/api/chat/stream', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message and sessionId are required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const ceo = CEO.getInstance();

    for await (const chunk of ceo.chatStream({ message, sessionId })) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('[CEO] Stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ─── Conversation History ────────────────────────────────────────────────────
app.get('/api/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const { createMemorySystem } = await import('@cozanet/memory');
    const memory = createMemorySystem();
    const history = memory.conversation.getHistory(sessionId, 100);
    res.json({ sessionId, messages: history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Clear Session ───────────────────────────────────────────────────────────
app.delete('/api/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const { createMemorySystem } = await import('@cozanet/memory');
    const memory = createMemorySystem();
    memory.conversation.clearSession(sessionId);
    res.json({ success: true, sessionId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Boot ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 CozanetOS Core API running on port ${PORT}`);
  console.log(`📡 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`🌊 Stream endpoint: POST http://localhost:${PORT}/api/chat/stream`);
});

export default app;
