import { Exchange } from "./store.js";

export type DecisionCategory =
  | "career"
  | "financial"
  | "relationship"
  | "business"
  | "health"
  | "creative"
  | "general";

interface QuestionBank {
  clarifying: string[];
  risk: string[];
  values: string[];
  wrapUp: string[];
}

const QUESTION_BANKS: Record<DecisionCategory, QuestionBank> = {
  career: {
    clarifying: [
      "What specifically would that look like in practice?",
      "What's driving this decision right now?",
      "What does success look like in 6 months?",
    ],
    risk: [
      "What's your runway if this doesn't work out?",
      "Have you tested this at a smaller scale first?",
      "Who have you talked to that's actually done this?",
      "What would you tell your best friend if they were making this same decision?",
    ],
    values: [
      "Does this align with who you want to be in 5 years?",
      "If you do this and fail, would you regret trying or not trying more?",
      "What are you sacrificing to make this happen?",
    ],
    wrapUp: [
      "What have you learned about yourself through this decision?",
    ],
  },
  financial: {
    clarifying: [
      "What specific outcome are you hoping for?",
      "What numbers have you run so far?",
      "What's the timeline on this decision?",
    ],
    risk: [
      "Can you afford to lose this money entirely?",
      "What's the opportunity cost of this choice?",
      "Have you stress-tested the numbers against worst-case scenarios?",
      "What assumptions are you making that might be wrong?",
    ],
    values: [
      "How does this fit with your long-term financial goals?",
      "Is this about security, growth, or something else?",
      "What would financial peace look like to you?",
    ],
    wrapUp: [
      "What would make you feel confident about this decision?",
    ],
  },
  relationship: {
    clarifying: [
      "What specifically are you hoping will change?",
      "How long have you been thinking about this?",
      "What have you already tried?",
    ],
    risk: [
      "Have you told them exactly how you feel?",
      "What would change if you waited 3 months?",
      "Are you running toward something or away from something?",
      "What's the cost of doing nothing?",
    ],
    values: [
      "What does a healthy relationship look like to you?",
      "What boundaries do you need that aren't being respected?",
      "What are you afraid of losing?",
    ],
    wrapUp: [
      "What do you know now that you didn't before?",
    ],
  },
  business: {
    clarifying: [
      "What's the simplest version of this you could test?",
      "Who exactly is this for?",
      "What problem are you solving?",
    ],
    risk: [
      "Do you have evidence that people want this?",
      "What's the smallest bet you could make to validate this?",
      "Who are your first 10 customers?",
      "What kills this idea?",
    ],
    values: [
      "Why you and why now?",
      "What would make this worth failing at?",
      "Are you building something you want to exist in the world?",
    ],
    wrapUp: [
      "What's the next smallest step you could take?",
    ],
  },
  health: {
    clarifying: [
      "What specifically are you trying to improve?",
      "How is this affecting your daily life?",
      "What have you already tried?",
    ],
    risk: [
      "What happens if you do nothing?",
      "Have you consulted with someone who understands the science?",
      "What's the realistic timeline for results?",
      "What could go wrong with your approach?",
    ],
    values: [
      "What does feeling good actually mean to you?",
      "What are you willing to give up for this?",
      "How does this connect to who you want to be?",
    ],
    wrapUp: [
      "What would sustainable progress look like?",
    ],
  },
  creative: {
    clarifying: [
      "What are you actually trying to create?",
      "Who is this for?",
      "What does finished look like?",
    ],
    risk: [
      "What's the worst that happens if you share this?",
      "Are you avoiding finishing because of fear?",
      "What feedback have you gotten that you're ignoring?",
      "What's the cost of not starting?",
    ],
    values: [
      "Why does this matter to you?",
      "What would make you proud of this work?",
      "Are you creating for yourself or for approval?",
    ],
    wrapUp: [
      "What would make this feel complete?",
    ],
  },
  general: {
    clarifying: [
      "What specifically would that look like?",
      "What's driving this decision right now?",
      "What does success look like?",
    ],
    risk: [
      "What's the worst realistic outcome?",
      "What are you not seeing?",
      "What would you tell a friend in your situation?",
      "What assumptions are you making?",
    ],
    values: [
      "Does this align with who you want to be?",
      "If you do this and fail, would you regret trying or not trying more?",
      "What are you most afraid of?",
    ],
    wrapUp: [
      "What have you learned through this exploration?",
    ],
  },
};

const CATEGORY_KEYWORDS: Record<DecisionCategory, string[]> = {
  career: ["job", "career", "quit", "resign", "promotion", "salary", "work", "boss", "company", "hire", "fired", "interview", "offer"],
  financial: ["money", "invest", "save", "debt", "loan", "mortgage", "stock", "crypto", "buy", "sell", "spend", "budget", "financial"],
  relationship: ["breakup", "divorce", "marry", "dating", "partner", "boyfriend", "girlfriend", "spouse", "wife", "husband", "friend", "family"],
  business: ["startup", "business", "company", "product", "customer", "revenue", "profit", "launch", "market", "competitor"],
  health: ["health", "diet", "exercise", "gym", "doctor", "surgery", "medication", "therapy", "mental health", "weight", "fitness"],
  creative: ["write", "book", "art", "music", "film", "project", "create", "design", "portfolio", "publish", "album", "painting"],
  general: [],
};

const FALLBACK_QUESTION = "What else should we explore about this?";
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

export function generateQuestion(
  category: DecisionCategory,
  round: number,
  previousExchanges: Exchange[]
): string {
  const bank = QUESTION_BANKS[category];

  if (round >= MAX_QUESTIONS) {
    return bank.wrapUp[0] ?? QUESTION_BANKS.general.wrapUp[0] ?? FALLBACK_QUESTION;
  }

  const askedQuestions = new Set(previousExchanges.map((e) => e.question));

  let questionPool: string[];
  if (round <= 2) {
    questionPool = bank.clarifying;
  } else if (round <= 4) {
    questionPool = bank.risk;
  } else {
    questionPool = bank.values;
  }

  const availableQuestions = questionPool.filter((q) => !askedQuestions.has(q));

  if (availableQuestions.length === 0) {
    const allQuestions = [...bank.clarifying, ...bank.risk, ...bank.values];
    const unusedQuestions = allQuestions.filter((q) => !askedQuestions.has(q));
    if (unusedQuestions.length > 0) {
      const question = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
      return question ?? FALLBACK_QUESTION;
    }
    return bank.wrapUp[0] ?? QUESTION_BANKS.general.wrapUp[0] ?? FALLBACK_QUESTION;
  }

  const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  return question ?? FALLBACK_QUESTION;
}

export function generateSummary(exchanges: Exchange[], decision: string): string {
  const answered = exchanges.filter((e) => e.answer);
  const lines: string[] = [
    "REFLECTION SUMMARY",
    "",
    `Decision: "${decision}"`,
    `Rounds: ${answered.length}`,
    "",
  ];

  for (let i = 0; i < answered.length; i++) {
    const e = answered[i];
    lines.push(`Q${i + 1}: ${e!.question}`);
    lines.push(`A: ${e!.answer!.substring(0, 120)}${e!.answer!.length > 120 ? "..." : ""}`);
    lines.push("");
  }

  const contradictions = detectContradictions(exchanges);
  if (contradictions.length > 0) {
    lines.push("TENSIONS TO CONSIDER");
    lines.push("");
    for (const c of contradictions) {
      lines.push(`- ${c}`);
    }
    lines.push("");
  }

  lines.push("The decision is yours. But now you're making it with your eyes open.");
  lines.push("");
  lines.push("Text /new to explore another decision.");

  return lines.join("\n");
}

function detectContradictions(exchanges: Exchange[]): string[] {
  const contradictions: string[] = [];
  const answers = exchanges.map((e) => e.answer?.toLowerCase() ?? "");
  const fullText = answers.join(" ");

  const confidencePatterns = [
    { confident: ["ready", "sure", "certain", "definitely"], hesitant: ["maybe", "unsure", "don't know", "not sure"] },
    { confident: ["prepared", "planned"], hesitant: ["haven't", "need to", "should", "wing it"] },
    { confident: ["want this"], hesitant: ["should", "supposed to", "have to"] },
  ];

  for (const pattern of confidencePatterns) {
    const hasConfident = pattern.confident.some((word) => fullText.includes(word));
    const hasHesitant = pattern.hesitant.some((word) => fullText.includes(word));
    if (hasConfident && hasHesitant) {
      contradictions.push("You expressed both confidence and hesitation about this decision");
      break;
    }
  }

  if (fullText.includes("want") && fullText.includes("should")) {
    contradictions.push("There's tension between what you want and what you feel you should do");
  }

  return contradictions;
}

export function getAcknowledgment(_decision: string, category: DecisionCategory): string {
  const categoryNames: Record<DecisionCategory, string> = {
    career: "career move",
    financial: "financial decision",
    relationship: "relationship matter",
    business: "business decision",
    health: "health choice",
    creative: "creative project",
    general: "decision",
  };

  return `Got it. You're weighing a ${categoryNames[category]}.\n\nLet's stress-test this before you act.\n\n${generateQuestion(category, 1, [])}`;
}

export { MAX_QUESTIONS };
