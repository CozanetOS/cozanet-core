import { CEOResponse, SystemEvent, EngineRegistration } from "./types";

export class CEO {
  private static instance: CEO;
  private engines: Map<string, EngineRegistration> = new Map();
  private listeners: ((event: SystemEvent) => void)[] = [];

  private constructor() {}

  public static getInstance(): CEO {
    if (!CEO.instance) {
      CEO.instance = new CEO();
    }
    return CEO.instance;
  }

  public async boot(): Promise<void> {
    this.broadcastEvent({
      id: Math.random().toString(36).substring(2, 11),
      type: "SYSTEM_BOOT_INIT",
      source: "CEO",
      payload: { message: "CEO Orchestration Engine is booting up." },
      timestamp: Date.now()
    });
  }

  public registerEngine(registration: EngineRegistration): void {
    this.engines.set(registration.id, registration);
    this.broadcastEvent({
      id: Math.random().toString(36).substring(2, 11),
      type: "ENGINE_REGISTERED",
      source: "CEO",
      payload: { engineId: registration.id, name: registration.name },
      timestamp: Date.now()
    });
  }

  public async processIntent(intent: string): Promise<CEOResponse> {
    // Simple mock intent parser routing to reasoning, planning, identity, or decision
    let targetEngineId = "reasoning";
    let payload: any = { question: intent, context: "User intent processing" };

    const lowerIntent = intent.toLowerCase();
    if (lowerIntent.includes("plan") || lowerIntent.includes("schedule") || lowerIntent.includes("steps")) {
      targetEngineId = "planning";
      payload = { goal: intent };
    } else if (lowerIntent.includes("who are you") || lowerIntent.includes("identity") || lowerIntent.includes("personality")) {
      targetEngineId = "identity";
      payload = { action: "get_personality" };
    } else if (lowerIntent.includes("choose") || lowerIntent.includes("decide") || lowerIntent.includes("option")) {
      targetEngineId = "decision";
      payload = { options: ["Option A", "Option B"], context: intent };
    }

    try {
      const result = await this.routeToEngine(targetEngineId, payload);
      return {
        success: true,
        engineId: targetEngineId,
        result,
        timestamp: Date.now()
      };
    } catch (error: any) {
      return {
        success: false,
        engineId: targetEngineId,
        result: { error: error.message || error },
        timestamp: Date.now()
      };
    }
  }

  public async routeToEngine(engineId: string, payload: any): Promise<any> {
    const engine = this.engines.get(engineId);
    if (!engine) {
      throw new Error(`Engine with ID "${engineId}" is not registered.`);
    }
    return await engine.handler(payload);
  }

  public broadcastEvent(event: SystemEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in event listener:", err);
      }
    }
  }

  public addEventListener(listener: (event: SystemEvent) => void): void {
    this.listeners.push(listener);
  }
}
