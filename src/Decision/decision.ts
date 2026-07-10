import { CEO } from "../CEO/ceo";

export interface DecisionResult {
  chosenOption: string;
  confidence: number;
  reasoning: string;
}

export class DecisionEngine {
  public readonly id = "decision";

  constructor() {
    CEO.getInstance().registerEngine({
      id: this.id,
      name: "Decision Engine",
      description: "Analyzes multiple choices and selects the optimal path.",
      handler: async (payload: any) => {
        return await this.decide(payload.options || [], payload.context || "");
      }
    });
  }

  public async decide(options: string[], context: string): Promise<DecisionResult> {
    if (options.length === 0) {
      throw new Error("Cannot decide with empty options list.");
    }

    // A simple programmatic or fallback decision helper.
    // In production, this can route to the ReasoningEngine or run a utility/heuristic model.
    const chosenOption = options[0]; // Simple selection strategy
    return {
      chosenOption,
      confidence: 0.95,
      reasoning: `Decided on '${chosenOption}' based on prioritised ordering under context: "${context}"`
    };
  }
}
