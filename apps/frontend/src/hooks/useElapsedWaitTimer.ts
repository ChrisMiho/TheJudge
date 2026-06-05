import { useEffect, useRef, useState } from "react";
import { selectStage, WAIT_STAGES, type WaitStage } from "../lib/askAiWaitStages";

export function useElapsedWaitTimer(isSubmitting: boolean): { elapsed: number; stage: WaitStage } {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSubmitting) {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isSubmitting]);

  const stage = selectStage(elapsed, WAIT_STAGES);
  return { elapsed, stage };
}
