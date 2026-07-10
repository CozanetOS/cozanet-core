import { CEO } from "../CEO/ceo";
import { IdentityEngine } from "../Identity/identity";
import { PlanningEngine } from "../Planning/planning";
import { ReasoningEngine } from "../Reasoning/reasoning";
import { DecisionEngine } from "../Decision/decision";

export async function boot(): Promise<void> {
  const ceo = CEO.getInstance();
  
  // 1. Boot CEO
  await ceo.boot();

  // 2. Instantiate and register engines
  new IdentityEngine();
  new PlanningEngine();
  new ReasoningEngine();
  new DecisionEngine();

  // 3. Broadcast boot completed
  ceo.broadcastEvent({
    id: "boot_" + Math.random().toString(36).substring(2, 11),
    type: "SYSTEM_BOOT_COMPLETE",
    source: "BOOTLOADER",
    payload: { message: "All core engines initialized and registered with CEO." },
    timestamp: Date.now()
  });
}
