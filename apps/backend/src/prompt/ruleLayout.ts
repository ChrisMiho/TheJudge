import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatGameRulesSection, type GameRulesTopic } from "../gameRules.js";
import { compareRuleIds, type GameRulesRuleIndexEntry, type RetrievedGameRule } from "../gameRulesRetrieval.js";

/**
 * The rules sections of a prompt, laid out the way a judge reads them (REQ-239, REQ-240, REQ-244):
 * the selected excerpts in rule-book order, grouped under the rule book's own titles, each rule id
 * printed once; a lead-in rule delivered with its list; a sub-rule that cannot stand alone preceded
 * by its parent's lead-in sentence; "see rule X" pointers carrying what they point at.
 */

/** REQ-240: all list items added to one prompt's search excerpts share this many characters. */
export const LIST_ITEM_CHAR_BUDGET = 12000;
/** REQ-244: at most this many "see rule X" pointers are resolved per prompt. */
export const MAX_RESOLVED_POINTERS = 10;
/** REQ-244: each attached first sentence is capped at this many characters. */
export const POINTER_SENTENCE_MAX_CHARS = 250;

export type RuleLayoutStats = {
  /** REQ-240: list items added after a delivered lead-in, and their characters. */
  listItemsAdded: number;
  listItemChars: number;
  /** REQ-240: lead-ins whose list did not fit the budget (the omitted-range line fired). */
  listOverflows: number;
  /** REQ-239: sub-rules that got their parent's lead-in sentence. */
  leadInSentencesAdded: number;
  /** REQ-244: pointers found in delivered rules whose target is not in the prompt, and how many were resolved. */
  pointersFound: number;
  pointersResolved: number;
};

export type PromptRuleSections = {
  gameRulesSection: string;
  supplementalRulesSection: string;
  stats: RuleLayoutStats;
};

export type RuleLayoutInput = {
  topics: readonly GameRulesTopic[];
  supplementalRules: readonly RetrievedGameRule[];
  /** The committed rule index; without it lists, lead-in sentences and pointers are not added. */
  ruleIndex?: readonly GameRulesRuleIndexEntry[];
  /** Rule-book part titles keyed by part digit; defaults to the committed `gameRulesBookMeta.json`. */
  partTitles?: Readonly<Record<string, string>>;
};

let defaultPartTitlesCache: Record<string, string> | null = null;

/** The rule book's part titles from the committed `gameRulesBookMeta.json` (REQ-179). */
export function defaultPartTitles(): Record<string, string> {
  if (defaultPartTitlesCache) return defaultPartTitlesCache;
  const path = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/gameRulesBookMeta.json");
  let titles: Record<string, string> = {};
  if (existsSync(path)) {
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8")) as { partTitles?: Record<string, string> };
      titles = parsed.partTitles ?? {};
    } catch {
      titles = {};
    }
  }
  defaultPartTitlesCache = titles;
  return titles;
}

/** A rule's text without its trailing "Example:" lines. */
function ruleBody(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\s*Example/.test(line))
    .join(" ")
    .trim();
}

/** REQ-240: a lead-in ends in a colon, or in "following exception(s)." or "following rules.". */
export function isLeadIn(text: string): boolean {
  const body = ruleBody(text);
  return /:$/.test(body) || /following (?:exceptions?|rules)\.$/.test(body);
}

/** The rule text without its leading rule number. */
function withoutRuleNumber(text: string): string {
  return text.replace(/^\d{3}(?:\.\d+)?[a-z]{0,2}\.?\s+/, "");
}

const SENTENCE_BREAK = /(?<=[.!?:])[”")]*\s+(?=[A-Z“"(])/;

/** The last sentence of a rule's text (its lead-in sentence). */
export function lastSentence(text: string): string {
  const sentences = withoutRuleNumber(ruleBody(text)).split(SENTENCE_BREAK);
  return sentences[sentences.length - 1]!.trim();
}

/** The first sentence of a rule's text, capped at `POINTER_SENTENCE_MAX_CHARS`. */
export function firstSentence(text: string): string {
  const first = withoutRuleNumber(ruleBody(text)).split(SENTENCE_BREAK)[0]!.trim();
  return first.length > POINTER_SENTENCE_MAX_CHARS ? `${first.slice(0, POINTER_SENTENCE_MAX_CHARS - 1).trimEnd()}…` : first;
}

const LETTERS_SUFFIX = /[a-z]{1,2}$/;

/** The rule id a lettered piece sits under ("514.3a" -> "514.3"), or null for an unlettered rule. */
function parentIdOf(ruleId: string): string | null {
  return LETTERS_SUFFIX.test(ruleId) && /\d[a-z]{1,2}$/.test(ruleId) ? ruleId.replace(LETTERS_SUFFIX, "") : null;
}

const STANDS_ALONE_OPENING = /^(?:First|Second|Third|Fourth|Fifth|At this point)\b/;

type Index = {
  byId: Map<string, GameRulesRuleIndexEntry>;
  itemsOf: Map<string, GameRulesRuleIndexEntry[]>;
  sectionTitles: Map<string, string>;
  keywordTitles: Map<string, string>;
};

const indexCache = new WeakMap<readonly GameRulesRuleIndexEntry[], Index>();

function indexOf(ruleIndex: readonly GameRulesRuleIndexEntry[]): Index {
  const cached = indexCache.get(ruleIndex);
  if (cached) return cached;
  const byId = new Map(ruleIndex.map((entry) => [entry.ruleId, entry]));
  const itemsOf = new Map<string, GameRulesRuleIndexEntry[]>();
  const sectionTitles = new Map<string, string>();
  const keywordTitles = new Map<string, string>();
  for (const entry of ruleIndex) {
    const parent = parentIdOf(entry.ruleId);
    if (parent) {
      const list = itemsOf.get(parent) ?? [];
      list.push(entry);
      itemsOf.set(parent, list);
    }
    const section = entry.ruleId.split(".")[0]!;
    if (!sectionTitles.has(section) && entry.sectionTitle) sectionTitles.set(section, entry.sectionTitle);
    if (entry.keywordTitle && parent) keywordTitles.set(parent, entry.keywordTitle);
  }
  for (const list of itemsOf.values()) list.sort((a, b) => compareRuleIds(a.ruleId, b.ruleId));
  const built = { byId, itemsOf, sectionTitles, keywordTitles };
  indexCache.set(ruleIndex, built);
  return built;
}

/** A rule's text as printed: it already opens with its own number, which is printed once. */
function printedText(ruleId: string, text: string): string {
  return text.startsWith(ruleId) ? text : `${ruleId}. ${text}`;
}

type PointerState = { found: number; resolved: number };

const RULE_POINTER =
  /\b([Ss]ee (?:also )?rules? )(\d{3}(?:\.\d+[a-z]{0,2})?(?:(?:, and |, or |, | and\/or | and | or )\d{3}(?:\.\d+[a-z]{0,2})?)*)/g;
const SECTION_POINTER = /\b([Ss]ee (?:also )?sections? )(\d)\b/g;
const TITLE_FOLLOWS = /^,\s*[“"]/;

/** REQ-244: what a pointer to `target` carries -- a rule's first sentence, or a section's or keyword rule's title. */
function pointerContent(target: string, index: Index): string | null {
  const entry = index.byId.get(target);
  if (entry) return firstSentence(entry.text);
  if (/^\d{3}$/.test(target)) return index.sectionTitles.get(target) ?? null;
  return index.keywordTitles.get(target) ?? null;
}

/**
 * REQ-244: "see rule X" pointers whose target is not in the prompt carry the target's first sentence
 * (a rule) or title (a section or keyword rule), in brackets, verbatim. At most ten per prompt, in the
 * order they appear; a pointer whose title the text already gives is left alone.
 */
function resolvePointers(text: string, delivered: ReadonlySet<string>, index: Index, partTitles: Readonly<Record<string, string>>, state: PointerState): string {
  let out = text.replace(RULE_POINTER, (_whole, lead: string, list: string, offset: number) => {
    const after = text.slice(offset + lead.length + list.length);
    const parts = list.split(/(, and |, or |, | and\/or | and | or )/);
    let rebuilt = lead;
    parts.forEach((part, i) => {
      if (i % 2 === 1) {
        rebuilt += part;
        return;
      }
      rebuilt += part;
      const isLast = i === parts.length - 1;
      if (delivered.has(part) || (isLast && TITLE_FOLLOWS.test(after))) return;
      const content = pointerContent(part, index);
      if (content === null) return;
      state.found += 1;
      if (state.resolved >= MAX_RESOLVED_POINTERS) return;
      state.resolved += 1;
      rebuilt += ` [${content}]`;
    });
    return rebuilt;
  });
  out = out.replace(SECTION_POINTER, (whole: string, lead: string, digit: string, offset: number) => {
    const after = out.slice(offset + whole.length);
    const title = partTitles[digit];
    if (!title || TITLE_FOLLOWS.test(after)) return whole;
    state.found += 1;
    if (state.resolved >= MAX_RESOLVED_POINTERS) return whole;
    state.resolved += 1;
    return `${lead}${digit} [${title}]`;
  });
  return out;
}

type Piece = { rule: RetrievedGameRule; leadIn: string | null; overflowLine: string | null };

/**
 * Lays out a prompt's two rules sections. The curated topics keep their order (stable `id`); their
 * rules print in rule-book order (the build sorts each topic's rule numbers, REQ-239). The search
 * excerpts are sorted into rule-book order, grouped by three-digit section under "<part title> ›
 * <section title>", with list items and lead-in sentences added.
 */
export function layoutPromptRuleSections(input: RuleLayoutInput): PromptRuleSections {
  const stats: RuleLayoutStats = { listItemsAdded: 0, listItemChars: 0, listOverflows: 0, leadInSentencesAdded: 0, pointersFound: 0, pointersResolved: 0 };
  const partTitles = input.partTitles ?? defaultPartTitles();
  const index = input.ruleIndex && input.ruleIndex.length > 0 ? indexOf(input.ruleIndex) : null;

  const curatedIds = new Set(input.topics.flatMap((topic) => topic.ruleNumbers));
  const selected = new Map<string, RetrievedGameRule>();
  for (const rule of input.supplementalRules) if (!selected.has(rule.ruleId)) selected.set(rule.ruleId, rule);

  // REQ-240: a delivered lead-in brings the items of its list that are not already delivered, from a
  // shared budget; a list that does not fit is never cut -- one line names the omitted range.
  const overflowLines = new Map<string, string>();
  const listItems = new Map<string, RetrievedGameRule>();
  if (index) {
    let used = 0;
    const leadIns = [...selected.keys(), ...[...curatedIds].filter((id) => !selected.has(id))].sort(compareRuleIds);
    for (const leadId of leadIns) {
      const entry = index.byId.get(leadId);
      if (!entry || !isLeadIn(entry.text)) continue;
      const items = (index.itemsOf.get(leadId) ?? []).filter(
        (item) => !curatedIds.has(item.ruleId) && !selected.has(item.ruleId) && !listItems.has(item.ruleId)
      );
      if (items.length === 0) continue;
      const chars = items.reduce((sum, item) => sum + item.text.length, 0);
      if (used + chars > LIST_ITEM_CHAR_BUDGET) {
        stats.listOverflows += 1;
        overflowLines.set(leadId, `[List items ${items[0]!.ruleId} to ${items[items.length - 1]!.ruleId} are not shown here: the list is too long for this prompt.]`);
        continue;
      }
      used += chars;
      for (const item of items) {
        listItems.set(item.ruleId, { ruleId: item.ruleId, sectionTitle: item.sectionTitle, text: item.text, score: 0 });
        stats.listItemsAdded += 1;
        stats.listItemChars += item.text.length;
      }
    }
  }

  const all = new Map<string, RetrievedGameRule>([...selected, ...listItems]);
  const delivered = new Set<string>([...curatedIds, ...all.keys()]);
  const ordered = [...all.values()].sort((a, b) => compareRuleIds(a.ruleId, b.ruleId));

  // REQ-239: a sub-rule whose parent is not in the prompt, and that cannot stand alone, gets its parent's lead-in sentence once.
  // The sentence is printed once per parent, above the first delivered sibling, so rule-book order holds.
  const parentsNeeded = new Set<string>();
  if (index) {
    for (const rule of ordered) {
      const parentId = parentIdOf(rule.ruleId);
      if (!parentId || delivered.has(parentId)) continue;
      const parent = index.byId.get(parentId);
      if (!parent) continue;
      const body = withoutRuleNumber(ruleBody(rule.text));
      if (isLeadIn(parent.text) || STANDS_ALONE_OPENING.test(body) || /\bthis rule\b/.test(body)) parentsNeeded.add(parentId);
    }
  }
  const leadInShownFor = new Set<string>();
  const pieces: Piece[] = ordered.map((rule) => {
    let leadIn: string | null = null;
    const parentId = parentIdOf(rule.ruleId);
    if (index && parentId && parentsNeeded.has(parentId) && !leadInShownFor.has(parentId)) {
      leadIn = `${parentId} … ${lastSentence(index.byId.get(parentId)!.text)}`;
      leadInShownFor.add(parentId);
      stats.leadInSentencesAdded += 1;
    }
    return { rule, leadIn, overflowLine: overflowLines.get(rule.ruleId) ?? null };
  });

  // REQ-244: curated topics come first in the prompt, then the excerpts.
  const pointerState: PointerState = { found: 0, resolved: 0 };
  const resolvedTopics = index
    ? input.topics.map((topic) => ({ ...topic, excerpt: resolvePointers(topic.excerpt, delivered, index, partTitles, pointerState) }))
    : [...input.topics];

  const groups: string[] = [];
  let currentSection: string | null = null;
  let currentLabel = "";
  let currentLines: string[] = [];
  const flush = () => {
    if (currentLines.length > 0) groups.push([currentLabel, currentLines.join("\n\n")].filter(Boolean).join("\n"));
    currentLines = [];
  };
  for (const { rule, leadIn, overflowLine } of pieces) {
    const section = rule.ruleId.split(".")[0]!;
    if (section !== currentSection) {
      flush();
      currentSection = section;
      const part = partTitles[section.charAt(0)];
      const title = rule.sectionTitle || index?.sectionTitles.get(section) || "";
      currentLabel = part && title ? `${part} › ${title}` : part || title;
    }
    let text = printedText(rule.ruleId, rule.text);
    if (index) text = resolvePointers(text, delivered, index, partTitles, pointerState);
    const lines = [leadIn, text, overflowLine].filter((line): line is string => line !== null);
    currentLines.push(lines.join("\n"));
  }
  flush();
  stats.pointersFound = pointerState.found;
  stats.pointersResolved = pointerState.resolved;

  const supplementalRulesSection =
    groups.length === 0
      ? ""
      : ["ADDITIONAL RELEVANT RULE EXCERPTS", groups.join("\n\n")].join("\n");
  return { gameRulesSection: formatGameRulesSection(resolvedTopics), supplementalRulesSection, stats };
}
