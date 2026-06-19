export const CHARS_PER_TOKEN_ESTIMATE = 4;

export function estimateTokensFromChars(charCount: number): number {
  return Math.ceil(charCount / CHARS_PER_TOKEN_ESTIMATE);
}

export function getAnswerSizeDiagnostics(answer: string) {
  const answerChars = answer.length;
  return {
    answerChars,
    estimatedAnswerTokens: estimateTokensFromChars(answerChars),
    charsPerTokenEstimate: CHARS_PER_TOKEN_ESTIMATE
  };
}
