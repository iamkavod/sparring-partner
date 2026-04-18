import { HistoryEntry } from "./store.js";
import { SessionManager } from "./session.js";
import { generateAISummary } from "./ai.js";

export type CommandResult = {
  content: string;
};

export class CommandHandler {
  private sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  async handle(command: string, participant: string): Promise<CommandResult> {
    const normalizedCommand = command.toLowerCase().trim();

    switch (normalizedCommand) {
      case "/new":
        return this.handleNew(participant);
      case "/done":
        return await this.handleDone(participant);
      case "/history":
        return this.handleHistory(participant);
      case "/help":
        return this.handleHelp();
      default:
        return {
          content: `Unknown command: ${command}\n\nReply /help for available commands.`,
        };
    }
  }

  private handleNew(participant: string): CommandResult {
    const abandoned = this.sessionManager.abandonSession(participant);

    if (abandoned) {
      return {
        content:
          "Previous session closed.\n\nWhat's the decision you're wrestling with?",
      };
    }

    return {
      content: "Starting fresh. What's the decision you're wrestling with?",
    };
  }

  private async handleDone(participant: string): Promise<CommandResult> {
    const session = this.sessionManager.getActiveSession(participant);

    if (!session) {
      return {
        content:
          "No active session. Start by telling me what decision you're considering.",
      };
    }

    const exchanges = this.sessionManager.completeSession(session.id);
    const summary = await generateAISummary(session.decision, session.category, exchanges);

    return {
      content: summary,
    };
  }

  private handleHistory(participant: string): CommandResult {
    const history = this.sessionManager.getHistory(participant, 10);

    if (history.length === 0) {
      return {
        content: "No decisions explored yet. Start by telling me what you're considering.",
      };
    }

    return {
      content: this.formatHistory(history),
    };
  }

  private handleHelp(): CommandResult {
    return {
      content: [
        "Sparring Partner Commands",
        "",
        "/new - Start a fresh session (abandons current)",
        "/done - End session early and get summary",
        "/history - View past decisions (last 10)",
        "/help - Show this message",
        "",
        "Just text me any decision you're wrestling with and I'll start asking questions.",
      ].join("\n"),
    };
  }

  private formatHistory(history: HistoryEntry[]): string {
    const lines: string[] = ["Your Decision History", ""];

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      if (!entry) continue;
      const date = entry.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const status = entry.completedAt ? "\u2713" : "\u25CB";
      const shortDecision = entry.decision.length > 50
        ? `${entry.decision.substring(0, 50)}...`
        : entry.decision;
      lines.push(`${i + 1}. ${status} [${entry.category}] ${shortDecision} (${date})`);
    }

    lines.push("");
    lines.push("Reply /new to start exploring a new decision.");

    return lines.join("\n");
  }
}
