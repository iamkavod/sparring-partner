import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.1-8b-instant";

export interface Exchange {
  question: string;
  answer: string | null;
}

export async function generateAIQuestion(
  decision: string,
  category: string,
  exchanges: Exchange[],
  round: number,
  maxRounds: number
): Promise<string> {
  const conversationContext = exchanges
    .filter((e) => e.answer)
    .map((e, i) => `Q${i + 1}: ${e.question}\nA: ${e.answer}`)
    .join("\n\n");

  const roundGuidance =
    round <= 2
      ? "Ask a clarifying question to understand the specifics of their situation."
      : round <= 4
        ? "Ask a risk-probing question — challenge their assumptions, ask about worst cases or what they might be avoiding."
        : round <= 6
          ? "Ask a values-based question — does this align with who they want to be? What matters most here?"
          : "Ask a final reflective question — what have they learned? What's their gut telling them now?";

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Sparring Partner, a tough-love decision advisor delivered via iMessage. Your job is to ask ONE hard, specific question that helps the user think clearly about their decision.

Rules:
- Ask exactly ONE question, nothing else
- Be direct, specific, and slightly uncomfortable — ask what they're avoiding
- Reference their actual answers when relevant
- No fluff, no pleasantries, no "great question" type responses
- Keep it under 2 sentences
- Category of decision: ${category}
- This is round ${round} of ${maxRounds}
- ${roundGuidance}`,
        },
        {
          role: "user",
          content: conversationContext
            ? `The user is considering: "${decision}"\n\nConversation so far:\n${conversationContext}\n\nAsk the next question.`
            : `The user just said: "${decision}"\n\nThis is the opening. Ask your first probing question.`,
        },
      ],
      model: MODEL,
      temperature: 0.8,
      max_tokens: 150,
    });

    const question = completion.choices[0]?.message?.content?.trim();
    if (question) return question;
  } catch (error) {
    console.error("Groq API error (question):", error);
  }

  const fallbacks = [
    "What are you most afraid of here?",
    "What would you do if failure wasn't an option?",
    "What's the real reason behind this decision?",
    "Who else does this affect, and have you talked to them?",
    "What would future-you think about this choice?",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)] ?? fallbacks[0]!;
}

export async function generateAISummary(
  decision: string,
  category: string,
  exchanges: Exchange[]
): Promise<string> {
  const answered = exchanges.filter((e) => e.answer);
  const conversationContext = answered
    .map((e, i) => `Q${i + 1}: ${e.question}\nA: ${e.answer}`)
    .join("\n\n");

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Sparring Partner, a decision advisor. The user just finished a ${answered.length}-round Socratic conversation about a decision. Analyze their responses and provide a helpful, honest summary.

Your summary MUST follow this exact format (plain text only, no markdown, no bold, no bullets):

REFLECTION SUMMARY

Decision: "[their decision]"
Rounds: ${answered.length}

WHAT I NOTICED
Write 2-3 sentences about patterns you observed in their answers. Be specific — reference what they actually said. Point out any contradictions, hesitations, or blind spots.

WHAT YOU MIGHT BE AVOIDING
Write 1-2 sentences about the hard truth they might not be facing. Be direct but not cruel.

MY HONEST TAKE
Write 2-3 sentences giving your actual advice. What should they seriously consider? What's the smart move here based on everything they've shared?

NEXT STEP
One concrete, actionable thing they should do in the next 24 hours.

The decision is yours. But now you're making it with your eyes open.

Text /new to explore another decision.

Rules:
- Plain text only — NO markdown, NO asterisks, NO bullet points, NO special characters
- Be specific to THEIR answers, not generic advice
- Be honest even if it's uncomfortable
- Keep the whole thing under 200 words
- Sound like a smart friend, not a therapist`,
        },
        {
          role: "user",
          content: `Decision: "${decision}"\nCategory: ${category}\n\nConversation:\n${conversationContext}`,
        },
      ],
      model: MODEL,
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    if (summary) return summary;
  } catch (error) {
    console.error("Groq API error (summary):", error);
  }

  const lines: string[] = [
    "REFLECTION SUMMARY",
    "",
    `Decision: "${decision}"`,
    `Rounds: ${answered.length}`,
    "",
  ];

  for (const [i, e] of answered.entries()) {
    lines.push(`Q${i + 1}: ${e.question}`);
    lines.push(
      `A: ${e.answer!.substring(0, 120)}${e.answer!.length > 120 ? "..." : ""}`
    );
    lines.push("");
  }

  lines.push("The decision is yours. But now you're making it with your eyes open.");
  lines.push("");
  lines.push("Text /new to explore another decision.");

  return lines.join("\n");
}

export async function generateAIAcknowledgment(
  decision: string,
  category: string
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Sparring Partner, a tough-love decision advisor on iMessage. The user just shared a decision they're thinking about. Acknowledge it briefly (1 sentence max) and ask your first hard question.

Rules:
- One short acknowledgment sentence + one probing question
- Be direct, no fluff
- Reference what they actually said
- Keep total response under 3 sentences
- No markdown, plain text only`,
        },
        {
          role: "user",
          content: `The user says: "${decision}" (Category detected: ${category})`,
        },
      ],
      model: MODEL,
      temperature: 0.8,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    if (response) return response;
  } catch (error) {
    console.error("Groq API error (acknowledgment):", error);
  }

  return `Alright, let's stress-test this. "${decision}" — what specifically would that look like in practice?`;
}
