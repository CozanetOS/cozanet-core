import { CEO } from "../CEO/ceo";

export interface PlanStep {
  id: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
}

export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
  status: "pending" | "executing" | "completed" | "failed";
}

export interface PlanResult {
  planId: string;
  success: boolean;
  stepsExecuted: PlanStep[];
}

export class PlanningEngine {
  public readonly id = "planning";

  constructor() {
    CEO.getInstance().registerEngine({
      id: this.id,
      name: "Planning Engine",
      description: "Generates and orchestrates execution plans for complex goals.",
      handler: async (payload: any) => {
        if (payload.goal) {
          const plan = this.createPlan(payload.goal);
          if (payload.execute) {
            return await this.executePlan(plan);
          }
          return plan;
        }
        return { error: "Invalid planning payload" };
      }
    });
  }

  public createPlan(goal: string): Plan {
    // Generate a simple step-by-step plan based on the goal
    const planId = "pln_" + Math.random().toString(36).substring(2, 11);
    const steps: PlanStep[] = [
      { id: "step_1", description: `Analyze resources for goal: "${goal}"`, status: "pending" },
      { id: "step_2", description: `Formulate action steps for execution`, status: "pending" },
      { id: "step_3", description: `Evaluate outcomes and report results`, status: "pending" }
    ];
    return {
      id: planId,
      goal,
      steps,
      status: "pending"
    };
  }

  public async executePlan(plan: Plan): Promise<PlanResult> {
    plan.status = "executing";
    const executed: PlanStep[] = [];

    for (const step of plan.steps) {
      step.status = "running";
      // Simulate execution time
      await new Promise((resolve) => setTimeout(resolve, 50));
      step.status = "completed";
      executed.push({ ...step });
    }

    plan.status = "completed";
    return {
      planId: plan.id,
      success: true,
      stepsExecuted: executed
    };
  }
}
