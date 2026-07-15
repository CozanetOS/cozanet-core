/**
 * CozanetOS CEO Engine
 *
 * Flow:
 *   User message
 *     ↓
 *   Load conversation history from memory
 *     ↓
 *   Check if memory has relevant answer
 *     ├── Yes → respond using memory context
 *     └── No  → call LLM → save response → save to memory
 *     ↓
 *   Return response (streaming or full)
 */

import { callLLM, streamLLM } from '../LLM/provider.js';
import { CEOResponse, ChatRequest, LLMMessage, EngineRegistration, SystemEvent } from './types.js';

// Memory system — imported lazily to allow env setup before DB init
let memorySystem: any = null;

async function getMemory() {
  if (!memorySystem) {
    const { createMemorySystem } = await import('@cozanet/memory');
    memorySystem = createMemorySystem();
  }
  return memorySystem;
}

const SYSTEM_PROMPT = `You are Cozanet OS — a next-generation AI-native operating system assistant.
You are intelligent, helpful, and concise. You have persistent memory and can recall past conversations.
When you have relevant memory, reference it naturally. Be direct and clear.
Current date: ${new Date().toISOString().split('T')[0]}`;

export class CEO {
  private static instance: CEO;
  private engines: Map<string, EngineRegistration> = new Map();
  private listeners: ((event: SystemEvent) => void)[] = [];

  private constructor() {}

  public static getInstance(): CEO {
    if (!CEO.instance) CEO.instance = new CEO();
    return CEO.instance;
  }

  /**
   * Process a chat message with full memory integration.
   * Returns a complete response string.
   */
  public async chat(request: ChatRequest): Promise<{ reply: string; memoryUsed: boolean }> {
    const { message, sessionId } = request;
    const memory = await getMemory();

    // 1. Save user message to conversation history
    memory.conversation.saveMessage(sessionId, 'user', message);

    // 2. Load conversation history for context
    const history = memory.conversation.getLLMContext(sessionId, 20);

    // 3. Check long-term memory for relevant facts
    const relevantMemory = await memory.retrieval.query(message, sessionId);
    let memoryContext = '';
    let memoryUsed = false;

    if (relevantMemory.length > 0) {
      memoryUsed = true;
      const facts = relevantMemory.slice(0, 3).map((r: any) => {
        const content = typeof r.content === 'string' ? r.content : JSON.stringify(r.content);
        return `- ${content}`;
      }).join('\n');
      memoryContext = `\n\nRelevant memory:\n${facts}`;
    }

    // 4. Build LLM messages
    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT + memoryContext },
      ...history.slice(-18) as LLMMessage[], // keep last 18 turns
    ];

    // 5. Call LLM
    const result = await callLLM(messages);
    const reply = result.content;

    // 6. Save assistant response to conversation history
    memory.conversation.saveMessage(sessionId, 'assistant', reply);

    // 7. Save important facts to long-term memory
    // (simple heuristic: if message is longer than 20 chars, it might be worth remembering)
    if (message.length > 20) {
      memory.longTerm.store({
        type: 'conversation',
        content: `User said: "${message}" — I replied: "${reply.slice(0, 200)}"`,
        tags: ['conversation', sessionId],
        sessionId,
      });
    }

    return { reply, memoryUsed };
  }

  /**
   * Stream a chat response chunk by chunk.
   * Saves the full assembled response to memory when done.
   */
  public async *chatStream(request: ChatRequest): AsyncGenerator<string> {
    const { message, sessionId } = request;
    const memory = await getMemory();

    memory.conversation.saveMessage(sessionId, 'user', message);
    const history = memory.conversation.getLLMContext(sessionId, 20);

    const relevantMemory = await memory.retrieval.query(message, sessionId);
    let memoryContext = '';

    if (relevantMemory.length > 0) {
      const facts = relevantMemory.slice(0, 3).map((r: any) => {
        const content = typeof r.content === 'string' ? r.content : JSON.stringify(r.content);
        return `- ${content}`;
      }).join('\n');
      memoryContext = `\n\nRelevant memory:\n${facts}`;
    }

    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT + memoryContext },
      ...history.slice(-18) as LLMMessage[],
    ];

    let fullReply = '';

    for await (const chunk of streamLLM(messages)) {
      fullReply += chunk;
      yield chunk;
    }

    // Save complete response to memory
    memory.conversation.saveMessage(sessionId, 'assistant', fullReply);

    if (message.length > 20) {
      memory.longTerm.store({
        type: 'conversation',
        content: `User: "${message}" → Assistant: "${fullReply.slice(0, 200)}"`,
        tags: ['conversation', sessionId],
        sessionId,
      });
    }
  }

  public async processIntent(intent: string): Promise<CEOResponse> {
    const result = await this.chat({ message: intent, sessionId: 'system' });
    return { success: true, engineId: 'ceo', result: result.reply, timestamp: Date.now() };
  }

  public registerEngine(registration: EngineRegistration): void {
    this.engines.set(registration.id, registration);
  }

  public broadcastEvent(event: SystemEvent): void {
    for (const listener of this.listeners) {
      try { listener(event); } catch (err) { console.error('Event listener error:', err); }
    }
  }

  public addEventListener(listener: (event: SystemEvent) => void): void {
    this.listeners.push(listener);
  }
}
