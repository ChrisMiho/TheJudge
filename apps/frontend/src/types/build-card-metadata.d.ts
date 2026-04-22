declare module "*.mjs" {
  export function shouldIncludeCard(card: unknown): boolean;
  export function choosePreferredCard(existingCard: unknown, candidateCard: unknown): unknown;
  export function transformCards(cards: unknown[]): unknown;
}
