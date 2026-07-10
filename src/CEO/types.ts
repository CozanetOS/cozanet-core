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
