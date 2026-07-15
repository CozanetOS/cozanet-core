export interface CEOResponse {
  success: boolean;
  engineId: string;
  result: any;
  timestamp: number;
}

export interface SystemEvent {
  id: string;
  type: string;
  source: string;
  payload: any;
  timestamp: number;
}

export interface EngineRegistration {
  id: string;
  name: string;
  description: string;
  handler: (payload: any) => Promise<any>;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  memoryUsed: boolean;
  timestamp: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
