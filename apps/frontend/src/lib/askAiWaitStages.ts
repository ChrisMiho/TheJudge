export type WaitStage = {
  threshold: number;
  message: string;
  variant: "calm" | "curious" | "absurd";
};

export const WAIT_STAGES: readonly WaitStage[] = [
  { threshold: 0, message: "Consulting the stack…", variant: "calm" },
  { threshold: 3, message: "Priority is passing to the LLM.", variant: "calm" },
  { threshold: 8, message: "The judge is reading every layer. Twice.", variant: "curious" },
  { threshold: 15, message: "Still waiting? The servers are scrying 1.", variant: "curious" },
  { threshold: 25, message: "At this point we’re basically in a MUD subgame.", variant: "absurd" },
  { threshold: 40, message: "If this were F6, we’d have resolved by now.", variant: "absurd" }
] as const;

export function selectStage(elapsedSeconds: number, stages: readonly WaitStage[]): WaitStage {
  let result = stages[0];
  for (const stage of stages) {
    if (stage.threshold <= elapsedSeconds) {
      result = stage;
    }
  }
  return result;
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
