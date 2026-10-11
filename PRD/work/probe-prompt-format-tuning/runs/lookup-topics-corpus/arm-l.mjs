// Arm L (probe only, no product edit): a Quick Lookup request also gets the battlefield topics when an attached
// card is a permanent card, and the stack topics when an attached card is an instant or sorcery.
// Seam: prepareLookupPromptInput filters options.gameRulesTopics by a set built from the exported
// ALWAYS_ON_TOPIC_IDS array at call time. We extend that array for the duration of ONE synchronous
// preparePromptInput call and restore it in `finally`, so every other step (retrieval, curated-rule
// de-duplication, assembly) is the production code.
import { pathToFileURL } from "node:url";

const REPO = "/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft";
const imp = (rel) => import(pathToFileURL(`${REPO}/${rel}`).href);
const sel = await imp("apps/backend/src/gameRulesTopicSelection.ts");
const arms = await imp("scripts/lib/diagnostic-arms.mjs");
const { formatGameRulesSection } = await imp("apps/backend/src/gameRules.ts");

export const PERMANENT_TYPE = /\b(artifact|creature|enchantment|land|planeswalker|battle)\b/i;
export const SPELL_TYPE = /\b(instant|sorcery)\b/i;

// Derive the production zone-topic sets from selectGameRulesTopics itself (they are module-private).
function zoneTopicIds(allTopics, { battlefield, stack }) {
  const item = { oracleText: "" };
  const context = {
    orderedStack: stack ? [item] : [],
    populatedZones: battlefield ? [{ zoneId: "battlefield", items: [item] }] : [],
    gameContext: { turnPhase: "main_1" }
  };
  const ids = sel.selectGameRulesTopics(context, allTopics).map((t) => t.id);
  return ids.filter((id) => !sel.ALWAYS_ON_TOPIC_IDS.includes(id));
}

export function makeArmL(allTopics) {
  const BATTLEFIELD = zoneTopicIds(allTopics, { battlefield: true, stack: false });
  const STACK = zoneTopicIds(allTopics, { battlefield: false, stack: true });
  if (BATTLEFIELD.length !== 6 || STACK.length !== 5) throw new Error(`unexpected zone topic sets ${BATTLEFIELD} | ${STACK}`);

  function gate(cards) {
    const typeLines = (cards ?? []).map((c) => c.typeLine ?? "");
    const battlefield = typeLines.some((t) => PERMANENT_TYPE.test(t));
    const stack = typeLines.some((t) => SPELL_TYPE.test(t));
    const extraIds = [...(battlefield ? BATTLEFIELD : []), ...(stack ? STACK : [])];
    return { battlefield, stack, extraIds };
  }

  function prepareWithExtra(preparePromptInput, request, options, extraIds) {
    const alwaysOn = sel.ALWAYS_ON_TOPIC_IDS;
    const n = alwaysOn.length;
    alwaysOn.push(...extraIds);
    try {
      return preparePromptInput(request, options);
    } finally {
      alwaysOn.length = n;
    }
  }

  // Compares the base and arm-L prompts. Everything but the GAME RULES section and the excerpt section must be
  // byte-identical; base topic blocks must all survive; excerpt changes are reported (curated-rule de-dup).
  function diff(basePrompt, armPrompt, basePrepared, armPrepared, extraIds) {
    const a = arms.parseLookupPrompt(basePrompt);
    const b = arms.parseLookupPrompt(armPrompt);
    if (arms.renderOriginal(a) !== basePrompt || arms.renderOriginal(b) !== armPrompt) throw new Error("parse round trip");
    const strip = (p) => JSON.stringify({ head: p.head, cards: p.cards, rulings: p.rulings, raw: Object.fromEntries(Object.entries(p.rawSections).filter(([h]) => h !== "GAME RULES (reference)" && h !== "ADDITIONAL RELEVANT RULE EXCERPTS")) });
    const sectionsA = a.sections.filter((h) => h !== "ADDITIONAL RELEVANT RULE EXCERPTS");
    const sectionsB = b.sections.filter((h) => h !== "ADDITIONAL RELEVANT RULE EXCERPTS");
    if (strip(a) !== strip(b) || JSON.stringify(sectionsA) !== JSON.stringify(sectionsB)) throw new Error("arm L changed a section other than GAME RULES / excerpts");
    const baseTopicIds = basePrepared.enrichmentDebug.curatedGameRules.topicIds;
    const armTopicIds = armPrepared.enrichmentDebug.curatedGameRules.topicIds;
    const expected = [...new Set([...baseTopicIds, ...extraIds])];
    if (expected.length !== armTopicIds.length || expected.some((id) => !armTopicIds.includes(id))) throw new Error(`topic ids ${armTopicIds} != expected ${expected}`);
    // The GAME RULES section must be exactly the production formatter over the expected topic list (loaded order).
    const fmt = (ids) => formatGameRulesSection(allTopics.filter((t) => ids.includes(t.id)));
    if (fmt(baseTopicIds) !== a.rawSections["GAME RULES (reference)"]) throw new Error("base GAME RULES section is not the formatter output");
    if (fmt(expected) !== b.rawSections["GAME RULES (reference)"]) throw new Error("arm L GAME RULES section is not the formatter output");
    for (const t of allTopics.filter((t) => baseTopicIds.includes(t.id))) if (!b.rawSections["GAME RULES (reference)"].includes(`${t.title}\n${t.excerpt}`)) throw new Error("a base topic is missing in arm L");
    const exA = a.excerpts?.blocks ?? [];
    const exB = b.excerpts?.blocks ?? [];
    const idOf = (blk) => /^(\d+\.\d+[a-z]*)\. /.exec(blk)[1];
    const removed = exA.filter((x) => !exB.includes(x)).map(idOf);
    const added = exB.filter((x) => !exA.includes(x)).map(idOf);
    // A removed excerpt must now be carried by an added curated topic (de-dup), never simply lost.
    const carriedB = arms.carriedRuleIds(b);
    const lost = removed.filter((id) => !carriedB.has(id));
    // Not an error: excluding newly-curated rules renormalises the hybrid scores (min-max per query), so the
    // production retrieval can reshuffle the excerpt list. Recorded, not hidden.
    const addedTopicChars = b.rawSections["GAME RULES (reference)"].length - a.rawSections["GAME RULES (reference)"].length;
    return {
      addedTopicIds: armTopicIds.filter((id) => !baseTopicIds.includes(id)),
      addedTopicChars,
      addedPromptChars: armPrompt.length - basePrompt.length,
      excerptsChanged: removed.length > 0 || added.length > 0,
      excerptsRemovedNowInTopics: removed.filter((id) => carriedB.has(id)),
      excerptsLostFromPrompt: lost,
      excerptsBackfilled: added
    };
  }

  return { BATTLEFIELD, STACK, gate, prepareWithExtra, diff };
}
