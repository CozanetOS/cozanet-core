import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// ── In-memory session store (works on Vercel serverless) ──────────────────────
// Each session stores full conversation history
const sessions = new Map<string, Array<{role: string; content: string; timestamp: number}>>();

function getSession(sessionId: string) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId)!;
}

// ── LLM call via Groq ─────────────────────────────────────────────────────────
async function callGroq(messages: Array<{role: string; content: string}>, stream = false) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      stream,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq API error ${resp.status}: ${err}`);
  }

  return resp;
}

const SYSTEM_PROMPT = `You are CozanetOS — an AI-native operating system assistant. 
You are intelligent, helpful, and concise. You have access to the conversation history and use it to provide contextual, personalized responses.
Keep responses clear and direct.`;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cozanet-core', timestamp: Date.now(), sessions: sessions.size });
});

// ─── Chat (full response) ────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !sessionId) return res.status(400).json({ error: 'message and sessionId required' });

  const history = getSession(sessionId);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  try {
    const resp = await callGroq(messages, false);
    const data = await resp.json() as any;
    const reply = data.choices[0].message.content;

    history.push({ role: 'user', content: message, timestamp: Date.now() });
    history.push({ role: 'assistant', content: reply, timestamp: Date.now() });

    res.json({ reply, sessionId, memoryUsed: history.length > 2, timestamp: Date.now() });
  } catch (err: any) {
    console.error('[CEO] Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Chat Stream (SSE) ───────────────────────────────────────────────────────
app.post('/api/chat/stream', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !sessionId) return res.status(400).json({ error: 'message and sessionId required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const history = getSession(sessionId);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  let fullReply = '';

  try {
    const resp = await callGroq(messages, true);
    const reader = resp.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            fullReply += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          }
        } catch { /* skip malformed */ }
      }
    }

    history.push({ role: 'user', content: message, timestamp: Date.now() });
    history.push({ role: 'assistant', content: fullReply, timestamp: Date.now() });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('[CEO] Stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ─── History ─────────────────────────────────────────────────────────────────
app.get('/api/history/:sessionId', (req, res) => {
  const history = getSession(req.params.sessionId);
  res.json({ sessionId: req.params.sessionId, messages: history.map((m, i) => ({ id: String(i), ...m })) });
});

app.delete('/api/history/:sessionId', (req, res) => {
  sessions.delete(req.params.sessionId);
  res.json({ success: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 CozanetOS Core API running on port ${PORT}`);
});

export default app;
