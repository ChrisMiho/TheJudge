export type RuleMetadataItem = {
  ruleId: string;
  sectionId: string;
  sectionTitle: string;
  parentRuleIds: string[];
  text: string;
  searchText: string;
  crossRefs: string[];
};

export type RetrievedRuleReference = {
  ruleId: string;
  sectionTitle: string;
  text: string;
  score: number;
};
