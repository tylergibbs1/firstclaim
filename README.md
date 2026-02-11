# FirstClaim

Medical billing errors cost US providers over $125 billion a year. FirstClaim catches them in 30 seconds.

Paste clinical notes. An AI agent reads them, extracts diagnosis and procedure codes, verifies every charge against patient demographics and CMS rules, and builds a validated claim — streaming every decision in real time. Then it becomes a conversation: tell it to remove a charge, ask why it picked a code, or get documentation coaching to capture revenue you're leaving on the table.

**Built with Claude Opus 4.6 for the [Anthropic Hackathon](https://cerebralvalley.ai/e/claude-code-hackathon).**

## What it does

- **Claim extraction** — Reads free-text clinical notes and builds structured billing claims with CPT codes, ICD-10 diagnoses, modifiers, and fees
- **Compliance validation** — Checks age/sex rules, procedure bundling (PTP edits), unit limits (MUE), ICD-10 specificity, and undercoding
- **Risk quantification** — Calculates dollar amount at risk from flagged findings using Medicare fee schedule rates
- **Documentation coaching** — Identifies when clinical complexity suggests higher-level billing than what's documented, and coaches providers on what to capture next time
- **Conversational editing** — Chat with the agent to modify the claim, resolve findings, and ask follow-up questions
- **Compliance guardrails** — Refuses to write clinical language, help backdate documentation, or suggest documenting things that weren't performed

## How Opus 4.6 is used

FirstClaim uses the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) with custom MCP tools for domain-specific reasoning:

- **Multi-stage pipeline** — 5-stage analysis (Extract → Code → Build → Validate → Score) with the agent signaling stage transitions through tool selection
- **Structured tool calling** — 6 specialized tools (`search_icd10`, `lookup_icd10`, `check_age_sex`, `update_claim`, `add_highlights`, `suggest_next_actions`) ground the agent in real medical coding data
- **State mutation** — The agent doesn't just return text. Tool calls directly modify the claim object, triggering real-time UI updates
- **Documentation gap inference** — Opus reasons about the gap between clinical work performed (inferred from note complexity) and what was actually documented. This requires understanding both clinical reality and billing rules simultaneously

## Tech stack

Next.js 16 · React 19 · Supabase · Claude Agent SDK · Tailwind CSS v4 · Motion

## Getting started

```bash
bun install
cp .env.example .env.local  # Add your Supabase and Anthropic API keys
bun dev
```

## License

[MIT](LICENSE)
