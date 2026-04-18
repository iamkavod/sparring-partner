import { IMessageSDK, Message } from "@photon-ai/imessage-kit";
import { SQLiteSessionManager } from "./session.js";
import { CommandHandler } from "./commands.js";
import {
  detectCategory,
  generateAIQuestion,
  generateAISummary,
  generateAIAcknowledgment,
  MAX_QUESTIONS,
} from "./questioner.js";

const debug = process.env.DEBUG === "true";

const sdk = new IMessageSDK({ debug });
const sessionManager = new SQLiteSessionManager();
const commandHandler = new CommandHandler(sessionManager);

async function handleMessage(message: Message): Promise<void> {
  const participant = message.participant;
  const text = message.text?.trim() ?? "";

  if (!participant || !text) return;

  if (text.startsWith("/")) {
    const result = await commandHandler.handle(text, participant);
    await sdk.send(participant, result.content);
    return;
  }

  const activeSession = sessionManager.getActiveSession(participant);

  if (!activeSession) {
    const category = detectCategory(text);
    const session = sessionManager.startSession(participant, text, category);
    const acknowledgment = await generateAIAcknowledgment(text, category);
    sessionManager.recordQuestion(session.id, acknowledgment, 1);
    await sdk.send(participant, acknowledgment);
    return;
  }

  const unanswered = sessionManager.getUnansweredExchange(activeSession.id);
  if (unanswered) {
    sessionManager.recordAnswer(unanswered.id, text);
  }

  const exchanges = sessionManager.getSessionExchanges(activeSession.id);
  const nextRound = exchanges.length + 1;

  if (nextRound > MAX_QUESTIONS) {
    const summary = await generateAISummary(activeSession.decision, activeSession.category, exchanges);
    sessionManager.completeSession(activeSession.id);
    await sdk.send(participant, summary);
    return;
  }

  const nextQuestion = await generateAIQuestion(activeSession.decision, activeSession.category, exchanges, nextRound, MAX_QUESTIONS);
  sessionManager.recordQuestion(activeSession.id, nextQuestion, nextRound);
  await sdk.send(participant, nextQuestion);
}

async function main(): Promise<void> {
  await sdk.startWatching({
    onDirectMessage: async (message: Message) => {
      await sdk
        .message(message)
        .ifFromOthers()
        .ifNotReaction()
        .do(async (m) => {
          await handleMessage(m);
        })
        .execute();
    },
  });

  console.log("Sparring Partner is running...");
  console.log("Text any decision you're wrestling with to get started.");
}

process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  sdk.stopWatching();
  await sdk.close();
  sessionManager.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  sdk.stopWatching();
  await sdk.close();
  sessionManager.close();
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
