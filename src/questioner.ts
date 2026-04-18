import { Exchange } from "./store.js";

export type DecisionCategory =
  | "career"
  | "financial"
  | "relationship"
  | "business"
  | "health"
  | "creative"
  | "general";

const CATEGORY_KEYWORDS: Record<DecisionCategory, string[]> = {
  career: ["job", "career", "quit", "resign", "promotion", "salary", "work", "boss", "company", "hire", "fired", "interview", "offer"],
  financial: ["money", "invest", "save", "debt", "loan", "mortgage", "stock", "crypto", "buy", "sell", "spend", "budget", "financial"],
  relationship: ["breakup", "divorce", "marry", "dating", "partner", "boyfriend", "girlfriend", "spouse", "wife", "husband", "friend", "family"],
  business: ["startup", "business", "company", "product", "customer", "revenue", "profit", "launch", "market", "competitor"],
  health: ["health", "diet", "exercise", "gym", "doctor", "surgery", "medication", "therapy", "mental health", "weight", "fitness"],
  creative: ["write", "book", "art", "music", "film", "project", "create", "design", "portfolio", "publish", "album", "painting"],
  general: [],
};

const MAX_QUESTIONS = 7;

export function detectCategory(decision: string): DecisionCategory {
  const lowerDecision = decision.toLowerCase();

  const scores: Record<DecisionCategory, number> = {
    career: 0,
    financial: 0,
    relationship: 0,
    business: 0,
    health: 0,
    creative: 0,
    general: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDecision.includes(keyword)) {
        scores[category as DecisionCategory]++;
      }
    }
  }

  let bestCategory: DecisionCategory = "general";
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as DecisionCategory;
    }
  }

  return bestCategory;
}

export { generateAIQuestion, generateAISummary, generateAIAcknowledgment } from "./ai.js";
export { MAX_QUESTIONS };

export type { Exchange };
