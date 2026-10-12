// Maps cited Comprehensive Rules ids onto the committed rule index for the
// local practice suite's convert step (REQ-232).
//
// A cited id present in the index maps to itself. A cited id absent from the
// index whose lettered subrules are present (a bare keyword header such as
// `702.16`, held as `702.16a`, `702.16b`, ...) maps to all of them; the prefix
// must be followed by a letter, so `702.16` never matches `702.160`. Any other
// absent id is unknown. Each cited id is one rule group: a group "reached the
// prompt" when any id in it did.

/** The ids of the committed rule index, in index order. `ruleIndex` is `[{ ruleId }]`. */
export function ruleIdsOf(ruleIndex) {
  return ruleIndex.map((entry) => entry.ruleId).filter((ruleId) => typeof ruleId === "string");
}

/**
 * Returns `{ groups, unknown }` for the cited ids: `groups[i]` is the list of
 * index ids for `citedIds[i]` (empty when unknown), and `unknown` lists the
 * cited ids that map to nothing.
 */
export function mapCitedRules(citedIds, indexIds) {
  const present = new Set(indexIds);
  const groups = [];
  const unknown = [];
  for (const cited of citedIds) {
    if (present.has(cited)) {
      groups.push([cited]);
      continue;
    }
    const subrules = indexIds.filter((ruleId) => ruleId.startsWith(cited) && /^[a-z]/.test(ruleId.slice(cited.length)));
    if (subrules.length > 0) {
      groups.push(subrules);
    } else {
      groups.push([]);
      unknown.push(cited);
    }
  }
  return { groups, unknown };
}
