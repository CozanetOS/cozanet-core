/**
 * CozanetOS LLM Provider
 * Tries providers in order: Groq → OpenAI → xAI
 * Set env vars: GROQ_API_KEY, OPENAI_API_KEY, XAI_API_KEY
 * Falls back automatically if a provider fails.
 */

import { LLMMessage } from '../CEO/types.js';

interface LLMResult {
  content: string;
  provider: string;
  model: string;
}

async function callGroq(messages: LLMMessage[]): Promise<LLMResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('No GROQ_API_KEY');

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) throw new Error(`Groq error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json() as any;
  return { content: data.choices[0].message.content, provider: 'groq', model: 'llama-3.3-70b-versatile' };
}

async function callOpenAI(messages: LLMMessage[]): Promise<LLMResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('No OPENAI_API_KEY');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) throw new Error(`OpenAI error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json() as any;
  return { content: data.choices[0].message.content, provider: 'openai', model: 'gpt-4o-mini' };
}

async function callXAI(messages: LLMMessage[]): Promise<LLMResult> {
  const apiKey = process.env.XAI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) throw new Error('No XAI_API_KEY');

  const resp = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) throw new Error(`xAI error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json() as any;
  return { content: data.choices[0].message.content, provider: 'xai', model: 'grok-3-mini' };
}

/**
 * Call the best available LLM provider.
 * Order: Groq (free, fast) → OpenAI → xAI
 */
export async function callLLM(messages: LLMMessage[]): Promise<LLMResult> {
  const providers = [callGroq, callOpenAI, callXAI];
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return await provider(messages);
    } catch (err: any) {
      errors.push(err.message);
      continue;
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join('\n')}`);
}

/**
 * Stream LLM response (for streaming API endpoints).
 * Returns an async generator of content chunks.
 */
export async function* streamLLM(messages: LLMMessage[]): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.XAI_API_KEY || process.env.LLM_API_KEY;
  const isGroq = !!process.env.GROQ_API_KEY;
  const isOpenAI = !isGroq && !!process.env.OPENAI_API_KEY;

  const url = isGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : isOpenAI
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.x.ai/v1/chat/completions';

  const model = isGroq ? 'llama-3.3-70b-versatile' : isOpenAI ? 'gpt-4o-mini' : 'grok-3-mini';

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 2048, temperature: 0.7, stream: true }),
  });

  if (!resp.ok || !resp.body) throw new Error(`LLM stream error: ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch { /* skip malformed chunks */ }
    }
  }
}
