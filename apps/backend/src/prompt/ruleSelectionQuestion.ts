import { normalizeQuestion } from "./normalization.js";
import type { AskAiRequest, PromptContext } from "../types/index.js";

/**
 * REQ-246: the one decision about which question the rules choices read.
 *
 * A follow-up is any request that carries `conversationHistory` (REQ-027). Its first turn is the
 * conversation's opening question, exactly as it was first sent, so on a follow-up every rules choice
 * that reads "the player's question" reads that turn instead of the follow-up text: System 3's search
 * query (its word half and its embedded text), In-Depth's question-word topic triggers (REQ-242) and
 * Quick Lookup's named turn steps (REQ-238). The cards and the game context are already frozen for the
 * conversation, so a follow-up's rules are the opening question's rules. A request without history
 * reads its own question, which keeps every opening request's prompt unchanged.
 *
 * It reads the request's own history, never the truncated copy the prompt prints, so no history budget
 * can drop the opening turn. The follow-up text still reaches the prompt as `QUESTION`, and the combo
 * section (REQ-094) still reads it; neither goes through here.
 */
export function ruleSelectionQuestion(request: Pick<AskAiRequest, "question" | "conversationHistory">): string {
  const opening = request.conversationHistory?.[0];
  return opening ? opening.content : request.question;
}

/**
 * The same decision for an In-Depth request, in the form its context holds a question: whitespace
 * normalised, with the context's own question (which carries the empty-question fallback) standing in
 * when the chosen question is blank. A request without history gets back exactly `context.finalQuestion`.
 */
export function gameRuleSelectionQuestion(
  request: Pick<AskAiRequest, "question" | "conversationHistory">,
  context: Pick<PromptContext, "finalQuestion">
): string {
  return normalizeQuestion(ruleSelectionQuestion(request)) || context.finalQuestion;
}
