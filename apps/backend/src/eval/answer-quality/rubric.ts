// Answer-quality rubric (REQ-187).
//
// Four axes, each scored 0-2 against the gold case's published worked
// solution. Only Correctness becomes the run's headline figure; the other
// three are diagnostic -- they explain why a score moved, they never define
// it. No axis is ever combined into a single weighted composite: a weighted
// score hides which axis moved and invites tuning the weights instead of the
// product (REQ-187 constraint).
//
// The rubric text carries a revision identifier, recorded in every run
// artifact (REQ-186, REQ-189). Axes are added or changed only by amending
// REQ-187 and bumping this revision, so a score change and a rubric change
// are never confused.

export type RubricAxisId = "correctness" | "grounding" | "calibration" | "readability";

export type RubricAxis = {
  id: RubricAxisId;
  title: string;
  /** The exact 0/1/2 definitions sent to the judge, verbatim. */
  levels: { 0: string; 1: string; 2: string };
};

/**
 * The exact axis order the judge is asked to score in, and the exact order
 * every consumer (the artifact writer, the headline-count reducer) reads
 * scores back in. Correctness first: it's the only axis that becomes the
 * headline figure.
 */
export const RUBRIC_AXES: readonly RubricAxis[] = [
  {
    id: "correctness",
    title: "Correctness",
    levels: {
      0: "Reaches a different outcome than the published worked solution.",
      1: "Partially right, or right with a material error or omission.",
      2: "Reaches the same outcome as the published worked solution."
    }
  },
  {
    id: "grounding",
    title: "Grounding",
    levels: {
      0: "Neither uses the attached supplemental rule excerpts nor names the gold rule id.",
      1: "Uses the attached excerpts without naming the rule, or names it without using it.",
      2: "The answer's reasoning uses the supplemental rule excerpts the prompt actually attached and names the gold rule id."
    }
  },
  {
    id: "calibration",
    title: "Calibration",
    levels: {
      0: "Refuses a question the reference answers, or states a firm answer the reference does not support.",
      1: "Over-hedged, or mildly overconfident relative to the reference.",
      2: "As definite as the published solution is, and no more."
    }
  },
  {
    id: "readability",
    title: "Readability",
    levels: {
      0: "Unusable at a table as written.",
      1: "Correct but needs re-reading.",
      2: "A player at a table can act on it as written."
    }
  }
] as const;

export const RUBRIC_AXIS_IDS: readonly RubricAxisId[] = RUBRIC_AXES.map((axis) => axis.id);

/**
 * Bumped only when an axis definition changes (REQ-187). Two runs are
 * comparable only when their judge model AND rubric revision match
 * (REQ-186, REQ-189).
 */
export const RUBRIC_REVISION = "2026-09-07.1";

/** Renders the rubric as the exact text sent to the judge (REQ-186 layer 2). */
export function formatRubricForJudge(): string {
  const lines = [`Answer-quality rubric (revision ${RUBRIC_REVISION}). Score each axis 0, 1, or 2:`, ""];
  for (const axis of RUBRIC_AXES) {
    lines.push(`${axis.title}:`);
    lines.push(`  0 - ${axis.levels[0]}`);
    lines.push(`  1 - ${axis.levels[1]}`);
    lines.push(`  2 - ${axis.levels[2]}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

export type AxisScores = Record<RubricAxisId, 0 | 1 | 2>;

/**
 * The run's single headline figure (REQ-187): the count of gold cases
 * scoring Correctness 2, out of the total. No other axis ever produces a
 * headline number, and no axis is ever folded into a weighted composite.
 */
export function countFullyCorrect(scoresByCase: readonly AxisScores[]): number {
  return scoresByCase.filter((scores) => scores.correctness === 2).length;
}
