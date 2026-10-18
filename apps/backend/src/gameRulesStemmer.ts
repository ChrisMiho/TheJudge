// REQ-233: the one word-matching implementation for rule search.
//
// A Porter (1980) stemmer and the tokenizer that uses it. The same module serves three callers, so
// the query side, the rule side and the model-training export can never drift apart: the rule-index
// build (`scripts/build-game-rules.mjs`, which writes each rule's `searchText` as these tokens), the
// backend's scoring (`gameRulesRetrieval.ts`), and the training export (`scripts/`).
//
// Self-contained on purpose: no imports and erasable types only, so Node can load it straight from a
// plain `.mjs` build script without a TypeScript step. No npm dependency.

/** Words too common to carry meaning. Unchanged from the scorer before REQ-233. */
const SEARCH_STOP_WORDS: ReadonlySet<string> = new Set([
  "and", "are", "can", "card", "cards", "does", "for", "from",
  "has", "have", "how", "one", "that", "the", "this", "what",
  "when", "will", "with"
]);

const STEP_2: Record<string, string> = {
  ational: "ate", tional: "tion", enci: "ence", anci: "ance", izer: "ize", bli: "ble", alli: "al",
  entli: "ent", eli: "e", ousli: "ous", ization: "ize", ation: "ate", ator: "ate", alism: "al",
  iveness: "ive", fulness: "ful", ousness: "ous", aliti: "al", iviti: "ive", biliti: "ble", logi: "log"
};
const STEP_3: Record<string, string> = {
  icate: "ic", ative: "", alize: "al", iciti: "ic", ical: "ic", ful: "", ness: ""
};
const CONSONANT = "[^aeiou]";
const VOWEL = "[aeiouy]";
const CONSONANTS = `${CONSONANT}[^aeiouy]*`;
const VOWELS = `${VOWEL}[aeiou]*`;
const M_GREATER_0 = new RegExp(`^(${CONSONANTS})?${VOWELS}${CONSONANTS}`);
const M_EQUALS_1 = new RegExp(`^(${CONSONANTS})?${VOWELS}${CONSONANTS}(${VOWELS})?$`);
const M_GREATER_1 = new RegExp(`^(${CONSONANTS})?${VOWELS}${CONSONANTS}${VOWELS}${CONSONANTS}`);
const HAS_VOWEL = new RegExp(`^(${CONSONANTS})?${VOWEL}`);
const CONSONANT_VOWEL_CONSONANT = new RegExp(`^${CONSONANTS}${VOWEL}[^aeiouwxy]$`);

/** The Porter stemming algorithm on one lower-case word. Words shorter than three letters are returned as they are. */
export function porterStem(input: string): string {
  let word = input;
  if (word.length < 3) return word;
  let match: RegExpExecArray | null;
  const startsWithY = word[0] === "y";
  if (startsWithY) word = `Y${word.slice(1)}`;

  // Step 1a: plurals
  if ((match = /^(.+?)(ss|i)es$/.exec(word))) word = match[1]! + match[2]!;
  else if ((match = /^(.+?)([^s])s$/.exec(word))) word = match[1]! + match[2]!;

  // Step 1b: -eed, -ed, -ing
  if ((match = /^(.+?)eed$/.exec(word))) {
    if (M_GREATER_0.test(match[1]!)) word = word.slice(0, -1);
  } else if ((match = /^(.+?)(ed|ing)$/.exec(word))) {
    const stem = match[1]!;
    if (HAS_VOWEL.test(stem)) {
      word = stem;
      if (/(at|bl|iz)$/.test(word)) word += "e";
      else if (/([^aeiouylsz])\1$/.test(word)) word = word.slice(0, -1);
      else if (CONSONANT_VOWEL_CONSONANT.test(word)) word += "e";
    }
  }

  // Step 1c: y -> i
  if ((match = /^(.+?)y$/.exec(word)) && HAS_VOWEL.test(match[1]!)) word = `${match[1]!}i`;

  // Step 2
  if (
    (match = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/.exec(word)) &&
    M_GREATER_0.test(match[1]!)
  ) {
    word = match[1]! + STEP_2[match[2]!];
  }

  // Step 3
  if ((match = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/.exec(word)) && M_GREATER_0.test(match[1]!)) {
    word = match[1]! + STEP_3[match[2]!];
  }

  // Step 4
  if ((match = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/.exec(word))) {
    if (M_GREATER_1.test(match[1]!)) word = match[1]!;
  } else if ((match = /^(.+?)(s|t)(ion)$/.exec(word))) {
    if (M_GREATER_1.test(match[1]! + match[2]!)) word = match[1]! + match[2]!;
  }

  // Step 5
  if ((match = /^(.+?)e$/.exec(word))) {
    const stem = match[1]!;
    if (M_GREATER_1.test(stem) || (M_EQUALS_1.test(stem) && !CONSONANT_VOWEL_CONSONANT.test(stem))) word = stem;
  }
  if (/ll$/.test(word) && M_GREATER_1.test(word)) word = word.slice(0, -1);

  if (startsWithY) word = `y${word.slice(1)}`;
  return word;
}

// U+2028 / U+2029 (line and paragraph separators) and no-break spaces read as spaces.
const SPACE_LIKE = new RegExp("[\\u2028\\u2029\\u00a0]", "g");

/**
 * Folds the curly apostrophes U+2018 and U+2019 to a straight `'`, so "don’t" and "don't" compare equal.
 * The one apostrophe fold for rule search; it lives here because this module has no imports.
 */
export function foldApostrophes(value: string): string {
  return value.replace(/[\u2018\u2019]/g, "'");
}

/** A negative contraction ("can't", "doesn't") or "it's": kept whole, never cut at the apostrophe. */
const WHOLE_CONTRACTION = /^(?:[a-z]+n't|it's)$/;

/**
 * REQ-233: the tokens of a text, the same way on the query side and the rule side.
 *
 * - U+2028, U+2029 and no-break spaces count as spaces; curly apostrophes become `'`.
 * - A trailing sentence period is dropped; a dotted rule id (`514.3a`) keeps its dots.
 * - "can't" and "it's" (and every other negative contraction) stay whole; any other apostrophe cuts the word.
 * - A word of letters only is Porter-stemmed; a token with a digit, a dot or an apostrophe is not.
 * - Tokens shorter than three characters and stop words (before or after stemming) are dropped.
 */
export function tokenizeSearchText(value: string): string[] {
  const text = foldApostrophes(value.replace(SPACE_LIKE, " ")).toLowerCase();
  const tokens: string[] = [];
  for (const match of text.matchAll(/[a-z0-9][a-z0-9.']*/g)) {
    const raw = match[0].replace(/[.']+$/, "");
    const pieces = WHOLE_CONTRACTION.test(raw) ? [raw] : raw.split("'");
    for (const piece of pieces) {
      const token = piece.replace(/^\.+|\.+$/g, "");
      if (token.length < 3 || SEARCH_STOP_WORDS.has(token)) continue;
      const stemmed = /^[a-z]+$/.test(token) ? porterStem(token) : token;
      if (stemmed.length < 3 || SEARCH_STOP_WORDS.has(stemmed)) continue;
      tokens.push(stemmed);
    }
  }
  return tokens;
}
