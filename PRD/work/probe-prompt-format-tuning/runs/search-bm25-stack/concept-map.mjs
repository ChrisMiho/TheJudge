// Phrase -> rule-concept map (free, local probe; not product code).
// Built from general card wording and the Comprehensive Rules' own vocabulary (section titles and
// rule wording such as "triggered abilities", "replacement effects", "cleanup step", "layer 4"),
// never from practice-suite questions. Each entry: [pattern on lower-cased card text with the card's
// own name replaced by "~", concept terms added to the search]. Kept general: one entry per common
// templating, not one per test case.
const EVERGREEN = "(?:flying|first strike|double strike|deathtouch|haste|hexproof|indestructible|lifelink|menace|reach|trample|vigilance|defender|shroud|protection|ward|flash)";
export const CONCEPT_MAP = [
  // --- turn structure and triggers tied to steps
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
  // --- triggered abilities
  [/\bwhenever\b|\bwhen\b/, "triggered ability trigger event"],
  [/\bwhen(?:ever)? [^.]*?\benters\b/, "enters battlefield triggered ability"],
  [/\bwhen(?:ever)? [^.]*?(?:\bdies\b|put into a graveyard from the battlefield|leaves the battlefield)/, "leaves-the-battlefield abilities look back in time dies"],
  [/\bwhenever [^.]*?\bdiscards?\b/, "discard triggered ability"],
  [/\bdiscards?\b/, "discard hand"],
  [/\bwhenever [^.]*?\bcasts?\b/, "cast triggered ability spell"],
  [/\bwhenever [^.]*?\bdraws?\b|if [^.]*would draw/, "draw card drawing"],
  [/\bdraws? (?:a|an|two|three|x|that many|\w+) cards?/, "draw card"],
  // --- replacement and prevention
  [/\binstead\b/, "replacement effect instead"],
  [/\bif [^.]*?\bwould\b/, "replacement effect"],
  [/\bas [^.]*?\benters\b|enters (?:the battlefield )?(?:tapped|with)|enters as/, "replacement effect enters battlefield"],
  [/twice that many|double the|that much damage plus/, "replacement effect"],
  [/\bprevent\b/, "prevention effect prevent damage"],
  [/can't be prevented/, "damage prevented"],
  [/the next time/, "prevention replacement next time"],
  // --- continuous effects and layers
  [/\bbecomes? (?:an? )?(?:[\w-]+ )*?(?:creature|artifact|land|enchantment|planeswalker)\b/, "type-changing effects layer continuous effect"],
  [/\bgets? [+-]\d+\/[+-]\d+|\bgets? [+-]x\/[+-]x/, "power toughness layer 7c continuous effect"],
  [/base power and toughness|power and toughness are each equal|power is equal to|toughness is equal to/, "characteristic-defining set base power toughness layer 7b"],
  [/\bswitch [^.]*power and toughness/, "switch power toughness layer 7d"],
  [/\blose all abilities|\bloses all abilities/, "ability-removing effects layer"],
  [new RegExp(`\\b(?:gains?|has|have) [^.]*?${EVERGREEN}`), "ability-adding effects layer"],
  [/gains? control|exchange control|you control enchanted/, "control-changing effects layer"],
  [/\bis (?:white|blue|black|red|green|colorless)\b|becomes? (?:the color|white|blue|black|red|green|colorless)|color of your choice/, "color-changing effects layer"],
  [/\bfor as long as|\bas long as\b/, "continuous effect duration static ability"],
  [/until [^.]*leaves the battlefield/, "duration effect leaves the battlefield"],
  // --- copying, face-down, double-faced
  [/copy target (?:instant|sorcery|spell|activated|triggered)|copy (?:it|that spell|that ability)|copies? of (?:that|target) spell/, "copy spell copying objects stack"],
  [/\bcop(?:y|ies)\b/, "copy copiable values copying objects"],
  [/face down|\bmorph\b|\bmanifest\b|\bdisguise\b|\bcloak\b/, "face-down permanents"],
  [/\btransform|daybound|nightbound/, "transform double-faced"],
  // --- casting, costs, timing
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
  // --- combat
  [/can't block|can't be blocked|can block only|blocked except|can't attack/, "blocking restrictions attack restrictions"],
  [/attacks? each (?:combat|turn) if able|must be blocked|blocks each (?:combat|turn) if able/, "attack block requirements"],
  [/deals combat damage to (?:a player|an opponent|a planeswalker|one or more)/, "combat damage step triggered ability"],
  [/becomes blocked|\bblocks\b/, "declare blockers step blocked creature"],
  [/remove [^.]*from combat/, "removed from combat"],
  // --- zones and objects
  [/return [^.]*to the battlefield|exile [^.]*then return/, "zone change new object"],
  [/exile [^.]*until/, "exiled until linked ability duration"],
  [/\bshuffle/, "shuffle library"],
  [/search (?:your|their|target player's|its owner's) library/, "search library"],
  [/create [^.]*\btokens?\b/, "token create"],
  // --- counters, damage, state-based actions
  [/[+-]1\/[+-]1 counters?/, "+1/+1 counters -1/-1 counters state-based action"],
  [/\bcounters? on\b|\bput (?:a|an|one|two|three|x|that many) [\w/+-]+ counters?/, "counters placed"],
  [/lethal damage|damage marked|damage dealt to it this turn/, "lethal damage marked state-based action"],
  [/\bregenerate/, "regeneration shield"],
  [/can't lose the game|win the game|loses? the game/, "losing the game winning state-based action"],
  [/\bloyalty\b/, "loyalty abilities planeswalker"],
  [/lore counter|\bchapter\b/, "saga lore counters chapter"],
  [/play (?:an additional|additional|two additional) lands?|play lands? from/, "play land special action"]
];
// Type-line driven entries.
export const TYPE_MAP = [
  [/\blegendary\b/, "legend rule"],
  [/\baura\b/, "aura attached enchant state-based action"],
  [/\bequipment\b/, "equipment attached equip"],
  [/\bsaga\b/, "saga lore counters chapter"],
  [/\bplaneswalker\b/, "loyalty abilities planeswalker"]
];

export function conceptTerms(oracleText, typeLine = "", name = "") {
  let t = (oracleText ?? "").toLowerCase().replace(/[‘’]/g, "'");
  if (name) for (const part of name.toLowerCase().split(" // ")) if (part) t = t.split(part).join("~");
  const out = [];
  for (const [re, terms] of CONCEPT_MAP) if (re.test(t)) out.push(terms);
  const tl = (typeLine ?? "").toLowerCase();
  for (const [re, terms] of TYPE_MAP) if (re.test(tl)) out.push(terms);
  return [...new Set(out)];
}
