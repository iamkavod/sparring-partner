# Sparring Partner

An iMessage agent that stress-tests your decisions with Socratic questioning.

**One sentence:** Text it what you're about to do, it asks the questions you're avoiding.

## How It Works

1. Text the bot any decision you're wrestling with
2. It detects the category (career, financial, relationship, business, health, creative)
3. It asks 7 progressively deeper Socratic questions:
   - Rounds 1-2: Clarifying questions
   - Rounds 3-4: Risk/consequence questions
   - Rounds 5-6: Values/identity questions
   - Round 7: Reflection synthesis
4. Get a summary highlighting what you revealed, contradictions, and blind spots

## Requirements

- macOS with Messages app configured and signed in
- Bun executable must have Full Disk Access (System Settings → Privacy & Security → Full Disk Access)
- `DEBUG` is the only environment variable (`true` or `false`)

## Setup

```bash
# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Build
bun run build

# Run
bun start
```

## Commands

| Command | Description |
|---------|-------------|
| `/new` | Abandon current session, start fresh |
| `/done` | End session early, get summary |
| `/history` | List past decisions (last 10) |
| `/help` | Show available commands |

## Example Conversation

**You:** I'm thinking about quitting my job to start a startup

**Sparring Partner:** Got it. You're weighing a business decision.

Let's stress-test this before you act.

What specifically would that look like in practice?

**You:** I'd build a SaaS tool for freelancers

**Sparring Partner:** What's driving this decision right now?

... (continues for 7 rounds)

**Sparring Partner:** ---

**Reflection Summary**

You were considering: "I'm thinking about quitting my job to start a startup"

Through our conversation, you explored:
• What specifically would that look like in practice?
  → I'd build a SaaS tool for freelancers
...

**Tensions to consider:**
• You expressed both confidence and hesitation about this decision

The decision is yours. But now you're making it with your eyes open.

Reply /new to explore another decision.

## Tech Stack

- [Bun](https://bun.sh/) - Runtime
- [@photon-ai/imessage-kit](https://www.npmjs.com/package/@photon-ai/imessage-kit) - iMessage integration
- Bun SQLite - Persistence
- TypeScript (strict mode)
