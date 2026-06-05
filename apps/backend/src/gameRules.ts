import { existsSync, readFileSync } from "node:fs";

export type GameRulesTopic = {
  id: string;
  title: string;
  ruleNumbers: string[];
  excerpt: string;
};

export type GameRulesSection = {
  topics: GameRulesTopic[];
  sectionChars: number;
};

const DISCLAIMER =
  "Use these general Magic rules as shared vocabulary. They do not override the user's submitted game state, stack order, zones, targets, notes, or card oracle text.";

const warnedLoadFailures = new Set<string>();

function isGameRulesTopic(value: unknown): value is GameRulesTopic {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Partial<GameRulesTopic>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    Array.isArray(c.ruleNumbers) &&
    typeof c.excerpt === "string"
  );
}

function normalizeTopics(value: unknown): GameRulesTopic[] {
  if (!Array.isArray(value)) return [];
  const topics = value.filter(isGameRulesTopic);
  return [...topics].sort((a, b) => a.id.localeCompare(b.id));
}

function warnOnce(filePath: string, message: string, error?: unknown): void {
  if (warnedLoadFailures.has(filePath)) return;
  warnedLoadFailures.add(filePath);
  if (error) {
    console.warn(message, error);
  } else {
    console.warn(message);
  }
}

export function loadGameRulesTopics(filePath: string): GameRulesTopic[] {
  if (!existsSync(filePath)) {
    warnOnce(filePath, `Game rules artifact missing; GAME RULES prompt section disabled: ${filePath}`);
    return [];
  }

  try {
    return normalizeTopics(JSON.parse(readFileSync(filePath, "utf8")));
  } catch (error) {
    warnOnce(filePath, `Game rules artifact could not be parsed; GAME RULES prompt section disabled: ${filePath}`, error);
    return [];
  }
}

export function formatGameRulesSection(topics: GameRulesTopic[]): string {
  if (topics.length === 0) return "";

  const topicBlocks = topics.map((topic) => [`${topic.title}`, topic.excerpt].join("\n"));

  return [
    "GAME RULES (reference)",
    DISCLAIMER,
    "",
    topicBlocks.join("\n\n")
  ].join("\n");
}
