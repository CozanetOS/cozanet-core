import { CEO } from "../CEO/ceo";

export interface UserIdentity {
  id: string;
  name: string;
  created_at: number;
}

export interface Personality {
  name: string;
  tone: string;
  traits: string[];
}

export class IdentityEngine {
  public readonly id = "identity";
  private personality: Personality = {
    name: "CozanetOS Core Assistant",
    tone: "helpful, technical, precise",
    traits: ["resourceful", "proactive", "logical"]
  };
  private identities: Map<string, UserIdentity> = new Map();

  constructor() {
    // Register itself with the CEO
    CEO.getInstance().registerEngine({
      id: this.id,
      name: "Identity Engine",
      description: "Manages user identities and system agent personalities.",
      handler: async (payload: any) => {
        if (payload.action === "register") {
          return this.register(payload.name);
        }
        if (payload.action === "get_personality") {
          return this.getPersonality();
        }
        if (payload.action === "set_personality") {
          this.setPersonality(payload.personality);
          return { success: true };
        }
        return { error: "Unknown identity action" };
      }
    });
  }

  public register(name: string): UserIdentity {
    const id = "usr_" + Math.random().toString(36).substring(2, 11);
    const identity: UserIdentity = {
      id,
      name,
      created_at: Date.now()
    };
    this.identities.set(id, identity);
    return identity;
  }

  public getPersonality(): Personality {
    return this.personality;
  }

  public setPersonality(p: Personality): void {
    this.personality = p;
  }
}
