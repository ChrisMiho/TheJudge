// REQ-234: the fixed concept map. General phrase-to-concept rules, one per common card templating, that
// turn a card's wording into rule-book concept terms for System 3's search. The first 77 entries were
// ported verbatim from the `right-rules-in-order` intake appendix (every pattern and every term); the 78th
// (type-setting wording) and the 79th to 84th (six card-wording entries, `concept-map-wording-entries`) are
// owner-reviewed additions. This module is the only copy. Entries stay general, never one per test case, and
// no model ever produces search terms at request time. Any change to this table is a separate,
// owner-reviewed edit. A term is words existing entries already use or a rule-book section title copied
// word for word.
//
// Each entry is [pattern, terms]: the pattern runs on the card's oracle text lower-cased, with curly
// apostrophes turned into "'" and the card's own name (each face of a "//" name) replaced by "~"; every
// matching entry adds its terms. TYPE_MAP runs the same way on the lower-cased type line.
//
// An entry marked { searchOnly: true } (the 79th to 84th) adds its terms to live search but not to the search
// model's training questions: `scripts/export-rule-search-training.mjs` turns it off before it builds them, so a
// retrain cannot learn to ignore its words. Measured: about +18 deciding rules on three models trained without
// the six; no gain on three trained with them (probe-rule-search-noise-and-misses, 2026-10-13).

import { foldApostrophes } from "./gameRulesStemmer.js";

export type ConceptEntry = readonly [pattern: RegExp, terms: string, options?: { readonly searchOnly: true }];
const SEARCH_ONLY = { searchOnly: true } as const;

const EVERGREEN = "(?:flying|first strike|double strike|deathtouch|haste|hexproof|indestructible|lifelink|menace|reach|trample|vigilance|defender|shroud|protection|ward|flash)";
// Type-setting templating (owner-reviewed 2026-10-12): "in addition to its other types", or a subject followed by
// is/are and a card type, subtype or basic land type ("Nonbasic lands are Mountains", "is an artifact creature").
// The subject may not carry conditional or targeting wording (if, that, target, when, unless, where, equal), "except" wording,
// counter-subject wording ("each +1/+1 counter on a creature you control is also a Food"), "as long as", or text in parentheses (reminder text).
const TYPE_WORDS = "(?:artifacts?|creatures?|enchantments?|lands?|planeswalkers?|battles?|instants?|sorcery|sorceries|kindred|tribal|plains|islands?|swamps?|mountains?|forests?|auras?|equipment|vehicles?|sagas?|treasures?|clues?|foods?)";
const TYPE_SETTING = new RegExp(
  `in addition to (?:its|their|his or her) other (?:land )?types|(?:^|[.,\\n]\\s*)(?<!\\bas long as [^.\\n]*)(?<!\\([^)]*)(?:(?!\\b(?:if|that|target|when|whenever|unless|where|equal|except|counters?)\\b|as long as)[^.\\n,;()])*?\\b(?:is|are) (?:an? )?(?:[a-z-]+ ){0,2}${TYPE_WORDS}\\b`
);
export const CONCEPT_MAP: readonly ConceptEntry[] = [
  [/at the beginning of [^.]*?upkeep/, "upkeep step triggered ability"],
  [/at the beginning of [^.]*?draw step/, "draw step triggered ability"],
  [/at the beginning of [^.]*?(?:end step|end of turn)/, "end step triggered ability"],
  [/at the beginning of [^.]*?combat/, "beginning of combat step triggered ability"],
  [/at the beginning of [^.]*?main phase/, "main phase triggered ability"],
  [/at the beginning of (?:the |your |its controller's |that player's |each player's )?next|at end of combat|at the beginning of the end step|until your next turn/, "delayed triggered ability"],
  [/cleanup step/, "cleanup step"],
  [/until end of turn|this turn/, "cleanup step until end of turn effects end"],
  [/\bskips? (?:your |their |that player's |his or her |the |each )?(?:next )?(?:[\w-]+ )?(?:step|phase|turn)/, "skip step skipped replacement effect"],
  [/extra turn|additional turn/, "extra turns"],
  [/additional (?:combat|main|beginning|end)? ?(?:phase|step)/, "additional phase combat"],
  [/(?:doesn't|don't|do not) untap|untap during/, "untap step untap"],
  [/end the turn/, "ending the turn"],
  [/maximum hand size/, "maximum hand size cleanup"],
  [/\bwhenever\b|\bwhen\b/, "triggered ability trigger event"],
  [/\bwhen(?:ever)? [^.]*?\benters\b/, "enters battlefield triggered ability"],
  [/\bwhen(?:ever)? [^.]*?(?:\bdies\b|put into a graveyard from the battlefield|leaves the battlefield)/, "leaves-the-battlefield abilities look back in time dies"],
  [/\bwhenever [^.]*?\bdiscards?\b/, "discard triggered ability"],
  [/\bdiscards?\b/, "discard hand"],
  [/\bwhenever [^.]*?\bcasts?\b/, "cast triggered ability spell"],
  [/\bwhenever [^.]*?\bdraws?\b|if [^.]*would draw/, "draw card drawing"],
  [/\bdraws? (?:a|an|two|three|x|that many|\w+) cards?/, "draw card"],
  [/\binstead\b/, "replacement effect instead"],
  [/\bif [^.]*?\bwould\b/, "replacement effect"],
  [/\bas [^.]*?\benters\b|enters (?:the battlefield )?(?:tapped|with)|enters as/, "replacement effect enters battlefield"],
  [/twice that many|double the|that much damage plus/, "replacement effect"],
  [/\bprevent\b/, "prevention effect prevent damage"],
  [/can't be prevented/, "damage prevented"],
  [/the next time/, "prevention replacement next time"],
  [/\bbecomes? (?:an? )?(?:[\w-]+ )*?(?:creature|artifact|land|enchantment|planeswalker)\b/, "type-changing effects layer continuous effect"],
  [TYPE_SETTING, "type-changing effects layer continuous effect"],
  [/\bgets? [+-]\d+\/[+-]\d+|\bgets? [+-]x\/[+-]x/, "power toughness layer 7c continuous effect"],
  [/base power and toughness|power and toughness are each equal|power is equal to|toughness is equal to/, "characteristic-defining set base power toughness layer 7b"],
  [/\bswitch [^.]*power and toughness/, "switch power toughness layer 7d"],
  [/\blose all abilities|\bloses all abilities/, "ability-removing effects layer"],
  [new RegExp(`\\b(?:gains?|has|have) [^.]*?${EVERGREEN}`), "ability-adding effects layer"],
  [/gains? control|exchange control|you control enchanted/, "control-changing effects layer"],
  [/\bis (?:white|blue|black|red|green|colorless)\b|becomes? (?:the color|white|blue|black|red|green|colorless)|color of your choice/, "color-changing effects layer"],
  [/\bfor as long as|\bas long as\b/, "continuous effect duration static ability"],
  [/until [^.]*leaves the battlefield/, "duration effect leaves the battlefield"],
  [/copy target (?:instant|sorcery|spell|activated|triggered)|copy (?:it|that spell|that ability)|copies? of (?:that|target) spell/, "copy spell copying objects stack"],
  [/\bcop(?:y|ies)\b/, "copy copiable values copying objects"],
  [/face down|\bmorph\b|\bmanifest\b|\bdisguise\b|\bcloak\b/, "face-down permanents"],
  [/\btransform|daybound|nightbound/, "transform double-faced"],
  [/without paying (?:its|their|that card's|the) mana cost/, "without paying mana cost alternative cost casting"],
  [/costs? (?:\{[^}]+\})+ (?:less|more)|costs? (?:\w+ )?(?:less|more) to (?:cast|activate)/, "cost increase reduction total cost"],
  [/as an additional cost/, "additional cost"],
  [/\{x\}/, "value of x"],
  [/\b(?:cast|play) [^.]*?from (?:your |a |their |its owner's |the top of )?(?:graveyard|exile|library|hand)/, "cast from zone permission"],
  [/can't cast|can't be cast|can't play/, "casting restriction cast spells"],
  [/as a sorcery|any time you could cast a sorcery/, "sorcery timing main phase stack empty"],
  [/as though (?:it|they) had flash|any time you could cast an instant/, "timing instant flash priority"],
  [/counter target|counter that|counter it/, "countered spell counter"],
  [/can't be countered/, "countered"],
  [/choose (?:one|two|three|one or more|one or both|any number)/, "modal spell modes"],
  [/spend (?:this )?mana|as though it were mana|mana of any type/, "spend mana"],
  [/\badd (?:\{|one|two|three|x |that much|an amount)/, "mana ability mana pool"],
  [/\{t\}(?:,|:)/, "tap symbol activated ability summoning sickness"],
  [/activate (?:only|this ability only)/, "activated ability restriction"],
  [/\bpay (?:\d+|x|that much|half) life/, "pay life cost"],
  [/can't block|can't be blocked|can block only|blocked except|can't attack/, "blocking restrictions attack restrictions"],
  [/attacks? each (?:combat|turn) if able|must be blocked|blocks each (?:combat|turn) if able/, "attack block requirements"],
  [/deals combat damage to (?:a player|an opponent|a planeswalker|one or more)/, "combat damage step triggered ability"],
  [/becomes blocked|\bblocks\b/, "declare blockers step blocked creature"],
  [/remove [^.]*from combat/, "removed from combat"],
  [/return [^.]*to the battlefield|exile [^.]*then return/, "zone change new object"],
  [/exile [^.]*until/, "exiled until linked ability duration"],
  [/\bshuffle/, "shuffle library"],
  [/search (?:your|their|target player's|its owner's) library/, "search library"],
  [/create [^.]*\btokens?\b/, "token create"],
  [/[+-]1\/[+-]1 counters?/, "+1/+1 counters -1/-1 counters state-based action"],
  [/\bcounters? on\b|\bput (?:a|an|one|two|three|x|that many) [\w/+-]+ counters?/, "counters placed"],
  [/lethal damage|damage marked|damage dealt to it this turn/, "lethal damage marked state-based action"],
  [/\bregenerate/, "regeneration shield"],
  [/can't lose the game|win the game|loses? the game/, "losing the game winning state-based action"],
  [/\bloyalty\b/, "loyalty abilities planeswalker"],
  [/lore counter|\bchapter\b/, "saga lore counters chapter"],
  [/play (?:an additional|additional|two additional) lands?|play lands? from/, "play land special action"],
  // 79th to 84th: owner-reviewed card-wording entries (concept-map-wording-entries), search-only. Reminder text in parentheses is skipped where noted.
  [/(?<!\([^)]*)(?:\bwhenever\b|\bwhen\b|\bat the beginning of\b)/, "handling triggered abilities", SEARCH_ONLY],
  [/rather than pay(?:ing)? [^.]*?mana cost/, "alternative cost casting", SEARCH_ONLY],
  [/(?<!\([^)]*)(?:\bbecomes? (?:an? )?(?:(?!(?:blocked|target|the target|tapped|untapped|day|night|equal|attached)\b)[\w-]+ )*?(?:creature|artifact|land|enchantment|planeswalker)\b|gains? control|exchange control|\blose all abilities|\bloses all abilities|in addition to (?:its|their) other)/, "interaction of continuous effects", SEARCH_ONLY],
  [/(?<!\([^)]*)\bgets? -(?:\d+|x)\/-(?:[1-9]\d*|x)\b/, "toughness state-based action", SEARCH_ONLY],
  [/(?:^|\n)[^"\n:]*\bsacrifice (?:~|this (?:creature|artifact|enchantment|permanent|land))[^"\n:]*:/, "activated ability cost", SEARCH_ONLY],
  [/as an additional cost to cast|(?:^|\n)choose (?:one|two|three|one or more|one or both|any number)\b|rather than pay(?:ing)? [^.]*?mana cost/, "casting spells", SEARCH_ONLY]
];
export const TYPE_MAP: readonly ConceptEntry[] = [
  [/\blegendary\b/, "legend rule"],
  [/\baura\b/, "aura attached enchant state-based action"],
  [/\bequipment\b/, "equipment attached equip"],
  [/\bsaga\b/, "saga lore counters chapter"],
  [/\bplaneswalker\b/, "loyalty abilities planeswalker"]
];

export type ConceptCard = { name?: string; oracleText?: string; typeLine?: string };

let searchOnlyEntriesOn = true;

/**
 * REQ-234 / REQ-236: turns the search-only entries off for the rest of the process. Only the training export
 * calls this, before it builds any question; live search never does.
 */
export function turnOffSearchOnlyEntriesForTraining(): void {
  searchOnlyEntriesOn = false;
}

/** The de-duplicated concept terms for one card (REQ-234). */
export function conceptTermsForCard(card: ConceptCard): string[] {
  let text = foldApostrophes((card.oracleText ?? "").toLowerCase());
  if (card.name) {
    for (const part of card.name.toLowerCase().split(" // ")) {
      if (part) text = text.split(part).join("~");
    }
  }
  const terms: string[] = [];
  for (const [pattern, entryTerms, options] of CONCEPT_MAP) {
    if (options?.searchOnly && !searchOnlyEntriesOn) continue;
    if (pattern.test(text)) terms.push(entryTerms);
  }
  const typeLine = (card.typeLine ?? "").toLowerCase();
  for (const [pattern, entryTerms] of TYPE_MAP) if (pattern.test(typeLine)) terms.push(entryTerms);
  return [...new Set(terms)];
}

/** The de-duplicated concept terms for a request's cards, in first-seen order. */
export function conceptTermsForCards(cards: readonly ConceptCard[]): string[] {
  return [...new Set(cards.flatMap((card) => conceptTermsForCard(card)))];
}
