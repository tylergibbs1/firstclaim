# Product Requirements Document: FirstClaim

**Project:** FirstClaim — Get it right the first time. **Author:** Tyler Gibbs **Hackathon:** Built with Opus 4.6: A Claude Code Hackathon (Feb 10–16, 2026) **Last Updated:** February 9, 2026

---

## 1. Problem Statement

Medical billing is a three-step gauntlet. After every patient encounter, a provider's office has to:

1. **Code the visit** — Read through clinical notes and translate diagnoses and procedures into ICD-10 and CPT codes. There are over 70,000 ICD-10 codes and 10,000+ procedure codes. Picking the wrong one means a denial.
    
2. **Build the claim** — Assemble all the codes, modifiers, units, and patient demographics into a properly structured claim with correct line items.
    
3. **Hope it doesn't get denied** — Submit the claim and wait weeks to find out if CMS rejects it because of a bundling conflict, a missing modifier, a unit limit violation, or one of thousands of other rules buried across CMS datasets.
    

Each step is error-prone. Each step requires specialized knowledge. And when something goes wrong at any step, the result is the same: a denied claim that costs hours to rework and appeal.

Denied claims cost the US healthcare system over $250 billion annually. The majority are preventable. They come from coding errors, bundling conflicts, missing modifiers, and rule violations that are documented in public CMS datasets but scattered across millions of rows of data that no human can memorize.

Small practices without dedicated billing teams get hit the hardest. They can't afford enterprise claim scrubbing software, and they don't have the staff to manually cross-reference every code pair against NCCI edits.

## 2. Solution Overview

FirstClaim is an interactive AI billing agent that turns clinical notes into validated, submission-ready claims through a collaborative conversation.

Paste in your clinical notes and the agent does an initial pass: extracting diagnoses and procedures, assigning codes, building the claim, and validating it against real CMS/NCCI rules. Then, instead of just handing you a finished product, it opens a conversation. You can ask it why it picked a specific code, tell it to add a procedure it missed, push back on a modifier choice, or ask it to explain a finding. The agent re-evaluates and re-validates in real time as you refine the claim together.

**Data architecture:** ICD-10 diagnosis codes (72,000+ codes, fully public domain US government data) are stored in Supabase for fast, deterministic lookups. CPT procedure code information and CMS billing rules (PTP edits, MUE limits, add-on requirements, modifier rules) are researched at runtime using Opus 4.6's built-in web search, keeping the repository and database free of any copyrighted data. The agent operates like a human billing specialist: it looks things up when it needs them.

## 3. Why Not Just Use a Chatbot?

You can paste clinical notes into Claude or ChatGPT right now and ask "what codes should I use?" and get a decent answer. So what's the actual gap FirstClaim fills?

**Chatbots hallucinate codes.** They will confidently suggest an ICD-10 code that doesn't exist, was terminated in 2019, or is a category header that can't be billed. There's no validation against the actual code set. FirstClaim checks every ICD-10 code against the real 72,000-code database. That's the difference between "sounds right" and "is right."

**Chatbots don't systematically validate.** Modern chatbots have web search, but they won't use it methodically. If you paste clinical notes into Claude or ChatGPT, it'll code the visit and maybe search for one thing if it's uncertain. It won't proactively check every code pair against current PTP edits, verify every code against MUE limits, confirm add-on code requirements, validate modifier usage, and cross-reference demographics. FirstClaim's pipeline does all of that on every claim, every time, without the user having to know what to ask for. Most billers don't know a PTP edit exists until the claim gets denied.

**Chatbots produce text, not structured output.** A chatbot gives you a paragraph. FirstClaim gives you a structured claim with line items, modifiers, units, linked diagnosis codes, and a risk score. Something that could actually feed into a practice management system.

**Chatbots have no persistent state.** If you tell a chatbot "change the code to M54.5," it rewrites its previous answer as text. In FirstClaim, the claim data structure updates, re-validation runs on the changed claim, findings resolve or appear, and the risk score adjusts. The claim is a living object, not a wall of text.

The short version: a chatbot can _discuss_ medical billing. FirstClaim can _do_ medical billing.

**Think of it like Cursor for coding.** Claude can write code in a chat window. But Cursor is a billion-dollar company because it wraps that same intelligence in a workflow: inline diffs instead of code blocks, changes applied to real files instead of text you copy-paste, automatic linting that catches errors. The AI is the same. The workflow is the product.

FirstClaim is the same pattern:

|Cursor for Code|FirstClaim for Billing|
|---|---|
|Claude can write code in a chat|Claude can code a claim in a chat|
|Cursor gives you inline diffs|FirstClaim gives you a structured claim table|
|Cursor applies changes to real files|FirstClaim updates a real claim data structure|
|Cursor knows your codebase context|FirstClaim knows the ICD-10 database|
|Cursor runs linting automatically|FirstClaim runs CMS validation automatically|
|Cursor shows you what changed|FirstClaim shows risk score changes and resolved findings|
|You don't copy-paste from chat to IDE|You don't copy-paste from chat to your billing system|

The AI underneath is the same model. The difference is infrastructure (ICD-10 database for validation), workflow (systematic validation pipeline that runs every time), and interface (structured claim with live state instead of a wall of text).

## 4. Target Users

- Medical billing specialists at provider offices
- Revenue cycle management teams
- Independent medical billing companies
- Small practice office managers handling their own billing
- Solo practitioners who do their own billing
- Medical billing students learning coding and CMS rules

## 5. Core User Flow

```
Paste clinical / SOAP notes
        |
        v
[Initial Analysis — Agent works through the claim]
  Stage 1 — Extract: Identifies diagnoses, procedures, demographics
  Stage 2 — Code: Assigns ICD-10 (via DB) and CPT (via web search) codes with rationale
  Stage 3 — Build: Assembles structured claim
  Stage 4 — Validate: Searches CMS rules via web, flags issues, auto-corrects where possible
  Stage 5 — Present: Shows complete claim + risk score + findings
        |
        v
[Interactive Refinement — Conversation with the agent]
  User reviews the claim and talks to the agent:
    - "Why did you pick 99214 instead of 99213?"
    - "The patient also had a wound closure, add that"
    - "I think modifier 25 isn't needed here"
    - "Explain that PTP edit in plain language"
    - "What if I code this as 99215 instead?"
    - "Actually the biopsy was excisional, not shave"
  
  Agent responds conversationally and:
    - Explains its reasoning with source citations
    - Accepts corrections and updates the claim
    - Re-validates after every change
    - Warns if a user's requested change introduces risk
    - Maintains full context of the clinical notes + claim state
        |
        v
[Finalize]
  User is satisfied with the claim
  Export validated claim (JSON) with:
    - Final risk score
    - Coding rationale for every line item
    - Validation findings (resolved and remaining)
    - Conversation summary of changes made
```

## 6. Interaction Model

The agent operates in two modes that blend together seamlessly.

### Mode 1: Initial Analysis (Autonomous)

When the user pastes clinical notes and hits "Analyze," the agent runs autonomously through the 5-stage pipeline. The user watches it work in real time via streaming.

### Mode 2: Interactive Refinement (Conversational)

Once the initial analysis is complete, the conversation opens up. The agent presents its work and invites the user to review.

**What the user can do:**

|Action|Example|Agent Response|
|---|---|---|
|Ask for reasoning|"Why 99214 and not 99213?"|Explains MDM complexity levels with reference to the clinical notes|
|Add a procedure|"She also had a joint injection"|Searches web for the right CPT code, adds to claim, re-validates|
|Change a code|"Use M54.5 instead of M54.31"|Updates the code, warns if it's less specific, re-validates|
|Challenge a finding|"That PTP edit doesn't apply here"|Cites the source it found, explains modifier options|
|Request modifier changes|"Add modifier 25 to the E/M"|Adds it, searches for modifier rules, re-checks risk|
|Remove a line item|"Drop the X-ray, it wasn't done"|Removes line, re-validates (may resolve previous findings)|
|Ask general questions|"What's the MUE limit for 11103?"|Searches web, responds with the answer and source|
|Ask for alternatives|"What other codes could work for this diagnosis?"|Searches ICD-10 database, presents options with trade-offs|
|Request re-validation|"Re-check everything"|Runs full validation on current claim state|
|Finalize|"Looks good, export it"|Generates final claim output|

**What the agent does on every claim change:**

1. Updates the claim data structure
2. Re-runs relevant validation checks (web search for affected rules)
3. Updates the risk score
4. Informs the user of any new findings or resolved findings
5. Maintains the full conversation context

### Conversation Memory

The agent maintains context of:

- The original clinical notes
- The current claim state (updated with every change)
- All code assignments and their rationale
- All validation findings (active, resolved, and auto-corrected)
- The conversation history
- Web search results (cached in context for the session)

This is where Opus 4.6's 1M token context and long-form coherence matter. A complex claim with multiple rounds of refinement could generate 50K+ tokens of context between tool calls, search results, findings, and conversation turns.

## 7. Technical Architecture

### 7.1 Stack

|Layer|Technology|Purpose|
|---|---|---|
|Frontend|Next.js (App Router)|Web application|
|UI Components|shadcn/ui + Tailwind CSS|Component library|
|AI Agent|Claude Opus 4.6 via Agent SDK (TypeScript)|Core reasoning, web search, everything|
|MCP Tools|Custom tools via `createSdkMcpServer`|ICD-10 database lookups + claim state management|
|Built-in Tools|`WebSearch`, `WebFetch`|CPT code + CMS rule research (no external search API needed)|
|Database|Supabase (PostgreSQL)|ICD-10 data, sessions|
|Streaming|Server-Sent Events (SSE)|Real-time progress updates|

### 7.2 Data Architecture

**Stored in Supabase (public domain, zero licensing concerns):**

|Dataset|Records (approx.)|Purpose|
|---|---|---|
|ICD-10-CM codes + descriptions|~72,000|Diagnosis code lookup, validation, search|

ICD-10-CM is published by CMS as a US government work. Not subject to copyright restrictions.

**Researched at runtime via Opus 4.6's built-in web search (no data stored):**

|Information|Typical Sources|Purpose|
|---|---|---|
|CPT code information|cms.gov, aapc.com, medical coding references|Procedure code identification and verification|
|NCCI PTP edits|CMS NCCI publications|Bundling conflict detection|
|MUE values|CMS MUE publications|Unit limit enforcement|
|Add-on code requirements|CMS NCCI publications|Add-on code validation|
|Modifier rules|CMS guidelines, coding references|Modifier validation|

CPT codes are copyrighted by the AMA. By having the agent search at runtime rather than storing anything, the repo and database contain zero copyrighted data.

**Why this architecture works:**

- Opus 4.6 is the BrowseComp leader, meaning it's the best model at searching for and finding specific information on the web. CMS rule lookups are exactly this kind of task.
- No external search API dependency. One less API key, one less cost, one less failure point.
- The agent naturally decides when it needs to search and what to search for, rather than being funneled through wrapper tools.
- Every finding comes from a real web source the user can verify.
- It's the purest possible showcase of Opus 4.6's capabilities: the agent reasons, searches, and applies knowledge all on its own.

### 7.3 Claude Opus 4.6 Agent Architecture

Using the Claude TypeScript Agent SDK.

**Why Opus 4.6:**

- **Clinical note comprehension:** Extracting accurate diagnoses and procedures from free-text SOAP notes full of abbreviations, implicit context, and clinical reasoning.
- **Web search + reasoning:** Opus 4.6 is the BrowseComp leader. It searches for CPT codes and CMS rules, evaluates what it finds, and applies the information to the specific claim. No search API wrapper needed; the model handles the entire research workflow natively.
- **Conversational reasoning with tools:** Interactive mode requires holding a conversation while making tool calls (database lookups and web searches), maintaining claim state, and providing accurate citations.
- **Self-critique:** The agent builds the claim and then critically evaluates its own work by searching for applicable rules. During conversation, it honestly assesses when a user's suggestion is better vs. when it should push back.
- **Judgment calls:** Medical coding has gray areas. The agent explains trade-offs, not just picks a code.

**Agent Configuration:**

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

const icd10Server = createSdkMcpServer({
  name: "icd10",
  tools: [searchIcd10Tool, lookupIcd10Tool, checkAgeSexTool, updateClaimTool]
});

const result = query({
  prompt: agentSystemPrompt + "\n\n" + clinicalNotes,
  options: {
    model: "claude-opus-4-6",
    tools: { type: "preset", preset: "claude_code" }, // includes WebSearch, WebFetch
    mcpServers: {
      icd10: icd10Server
    },
    betas: ["context-1m-2025-08-07"], // 1M context for long sessions
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    includePartialMessages: true, // for streaming UI
    maxTurns: 50 // cap for safety
  }
});
```

**Custom MCP Tools (via `createSdkMcpServer`):**

|Tool|Input|Output|Data Source|
|---|---|---|---|
|`search_icd10`|Search terms / keywords|Matching ICD-10 codes with descriptions, ranked by relevance|Supabase (full-text search)|
|`lookup_icd10`|Specific ICD-10 code|Validity, description, age/sex rules|Supabase (direct lookup)|
|`check_age_sex`|ICD-10 code + patient demographics|Age/sex appropriateness|Supabase (ICD-10 table)|
|`update_claim`|Claim modifications (add/remove/modify line items)|Updated claim state with change summary|In-memory claim state|

**Built-in Tools (from Agent SDK preset):**

|Tool|Purpose in FirstClaim|
|---|---|
|`WebSearch`|Search for CPT codes, PTP edits, MUE limits, add-on rules, modifier guidelines, any CMS billing question|
|`WebFetch`|Fetch full content from CMS.gov pages, AAPC articles, or other authoritative sources when search snippets aren't enough|

**Tool design rationale:**

- Only 4 custom tools. Everything else is Opus doing what it does best: searching, reading, and reasoning.
- ICD-10 gets dedicated database tools because it's public domain data we can store, and database lookups are faster and more reliable than web search for 72,000 codes.
- CPT and CMS rules are handled by Opus's native web search because (a) we can't store copyrighted data, and (b) Opus is literally the best model at this.
- `update_claim` is a state management tool that keeps the claim data structure consistent and triggers the UI to update.

**Agent System Prompt Structure:**

The system prompt defines:

1. Role: Expert medical billing specialist and coding assistant
2. Pipeline: How to execute the 5-stage initial analysis
3. Tool usage: When to use ICD-10 database tools vs. web search
4. Search guidance: Target cms.gov and aapc.com for authoritative sources, verify findings before applying
5. Conversation guidelines: Be helpful, cite sources, explain reasoning, push back when appropriate
6. Claim state: How to use `update_claim` to modify the claim and trigger re-validation
7. Validation approach: What rules to check (PTP edits, MUE limits, add-on requirements, modifiers, demographics) and how to interpret search results

### 7.4 MCP Tool Implementations

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { supabase } from "./supabase";

const searchIcd10Tool = tool(
  "search_icd10",
  "Search the ICD-10-CM database by keyword or description. Returns matching diagnosis codes ranked by relevance. Use this when you need to find the right ICD-10 code for a diagnosis described in clinical notes.",
  {
    query: z.string().describe("Search terms describing the diagnosis (e.g., 'lumbar radiculopathy left')"),
    limit: z.number().optional().default(10).describe("Max results to return")
  },
  async ({ query, limit }) => {
    const { data, error } = await supabase
      .from("icd10")
      .select("code, description, age_range, sex")
      .textSearch("description", query, { type: "websearch" })
      .eq("is_valid", true)
      .limit(limit);

    if (error) {
      return {
        content: [{ type: "text", text: `Search error: ${error.message}. Try different search terms.` }],
        isError: true
      };
    }

    if (!data?.length) {
      return {
        content: [{ type: "text", text: `No ICD-10 codes found for "${query}". Try broader or different terms.` }]
      };
    }

    const results = data.map(r => `${r.code}: ${r.description}${r.sex ? ` [${r.sex} only]` : ""}${r.age_range ? ` [Age: ${r.age_range}]` : ""}`).join("\n");
    return {
      content: [{ type: "text", text: `Found ${data.length} matching ICD-10 codes:\n${results}` }]
    };
  }
);

const lookupIcd10Tool = tool(
  "lookup_icd10",
  "Look up a specific ICD-10-CM code to verify it exists and get its details. Use this to validate a code you already know or to check age/sex restrictions.",
  {
    code: z.string().describe("The ICD-10-CM code to look up (e.g., 'M54.31')")
  },
  async ({ code }) => {
    const { data, error } = await supabase
      .from("icd10")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      return {
        content: [{ type: "text", text: `ICD-10 code "${code}" not found. Verify the code is correct or use search_icd10 to find the right code.` }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          code: data.code,
          description: data.description,
          valid: data.is_valid,
          sex_restriction: data.sex || "none",
          age_range: data.age_range || "none",
          effective_date: data.effective_date,
          termination_date: data.termination_date
        }, null, 2)
      }]
    };
  }
);

const checkAgeSexTool = tool(
  "check_age_sex",
  "Check if an ICD-10 code is appropriate for a patient's age and sex. Returns whether the code has demographic restrictions and if the patient matches.",
  {
    code: z.string().describe("The ICD-10-CM code to check"),
    patient_sex: z.enum(["M", "F"]).describe("Patient's biological sex"),
    patient_age: z.number().describe("Patient's age in years")
  },
  async ({ code, patient_sex, patient_age }) => {
    const { data, error } = await supabase
      .from("icd10")
      .select("code, description, sex, age_range")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      return {
        content: [{ type: "text", text: `Code "${code}" not found.` }],
        isError: true
      };
    }

    const issues = [];

    if (data.sex && data.sex !== patient_sex) {
      issues.push(`Sex mismatch: ${data.code} is designated for ${data.sex === "M" ? "male" : "female"} patients, but patient is ${patient_sex === "M" ? "male" : "female"}.`);
    }

    // age_range parsing would go here based on the CMS format

    return {
      content: [{
        type: "text",
        text: issues.length > 0
          ? `DEMOGRAPHIC FLAG for ${data.code} (${data.description}):\n${issues.join("\n")}`
          : `${data.code} (${data.description}): No demographic restrictions or patient matches all criteria.`
      }]
    };
  }
);

const updateClaimTool = tool(
  "update_claim",
  "Update the current claim state. Use this after making any changes to the claim (adding/removing/modifying line items, changing codes, adding modifiers, adjusting units). The updated claim will be reflected in the UI in real time.",
  {
    action: z.enum(["set_claim", "add_line", "remove_line", "modify_line", "set_risk_score", "add_finding", "resolve_finding"]).describe("The type of update"),
    data: z.any().describe("The update payload, structure depends on action")
  },
  async ({ action, data }) => {
    // This tool updates the in-memory claim state and emits SSE events
    // Implementation depends on the session/state management approach
    return {
      content: [{ type: "text", text: `Claim updated: ${action}` }]
    };
  }
);
```

### 7.5 Database Schema (Supabase)

```sql
-- ICD-10-CM diagnosis codes (public domain, full data)
CREATE TABLE icd10 (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT,
  is_valid BOOLEAN DEFAULT true,
  age_range TEXT,
  sex TEXT,                        -- 'M', 'F', or NULL for any
  effective_date DATE,
  termination_date DATE
);

CREATE INDEX idx_icd10_search ON icd10 USING gin(to_tsvector('english', description));
CREATE INDEX idx_icd10_code_prefix ON icd10 (code text_pattern_ops);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Input
  clinical_notes TEXT NOT NULL,
  patient_demographics JSONB,
  
  -- Current claim state
  current_claim JSONB,
  
  -- Validation
  risk_score INTEGER,
  active_findings JSONB,
  resolved_findings JSONB,
  
  -- Conversation
  messages JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'pending'
);
```

One data table. One session table. That's the entire database.

### 7.6 Streaming Architecture

```
Client (React) <-- SSE --> Next.js Route Handler --> Claude Agent SDK --> Custom MCP Tools --> Supabase
                                                          |
                                                          +--> Built-in WebSearch --> Web
                                                          +--> Built-in WebFetch --> Web
```

Each conversation turn sends the full message history + current claim state to the agent. The agent responds with text and/or tool calls, streams the response back via SSE.

With `includePartialMessages: true`, the Agent SDK emits `SDKPartialAssistantMessage` events that contain `RawMessageStreamEvent` from the Anthropic SDK. These get mapped to our SSE event types and pushed to the client.

**Event types:**

```typescript
type StreamEvent =
  // Initial analysis stages
  | { type: "stage"; stage: 1 | 2 | 3 | 4 | 5; label: string }
  | { type: "extraction"; data: { diagnoses: ExtractedDiagnosis[]; procedures: ExtractedProcedure[] } }
  | { type: "code_assignment"; data: { finding: string; code: string; codeType: "icd10" | "cpt"; rationale: string; source?: string } }
  | { type: "claim_built"; data: ClaimData }
  | { type: "finding"; data: Finding }
  | { type: "auto_correction"; data: { issue: string; correction: string } }
  | { type: "risk_score"; score: number; breakdown: SeverityBreakdown }
  | { type: "analysis_complete"; data: FullAnalysisResult }
  
  // Conversation mode
  | { type: "agent_text"; text: string }
  | { type: "tool_call"; tool: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool: string; result: Record<string, unknown> }
  | { type: "claim_updated"; data: ClaimData }
  | { type: "finding_added"; data: Finding }
  | { type: "finding_resolved"; data: { findingId: string; reason: string } }
  | { type: "risk_score_updated"; score: number; breakdown: SeverityBreakdown }
  
  // Shared
  | { type: "error"; message: string }
```

### 7.7 Clinical Notes Input

```
SUBJECTIVE:
Patient is a 65-year-old male presenting with worsening lower back pain 
radiating to the left leg for 3 weeks. Pain rated 7/10. History of type 2 
diabetes and hypertension. Currently on metformin and lisinopril.

OBJECTIVE:
BP 138/82. BMI 31.2. Lumbar spine tender to palpation L4-L5. Positive 
straight leg raise on left at 45 degrees. Decreased sensation left L5 
dermatome. Reflexes 2+ bilateral.

ASSESSMENT:
1. Lumbar radiculopathy, left L5
2. Type 2 diabetes mellitus, controlled
3. Essential hypertension

PLAN:
1. Lumbar spine X-ray, 2 views
2. Refer to physical therapy
3. Prescribe gabapentin 300mg TID
4. Follow up in 4 weeks
5. Continue current medications
```

### 7.8 Generated Claim Format

```json
{
  "claimId": "FC-20240615-001",
  "dateOfService": "2024-06-15",
  "patient": {
    "dateOfBirth": "1959-03-20",
    "sex": "M"
  },
  "provider": {
    "type": "practitioner"
  },
  "lineItems": [
    {
      "lineNumber": 1,
      "cpt": "99214",
      "description": "Office visit, established patient, moderate complexity",
      "modifiers": [],
      "icd10": ["M54.31", "E11.9", "I10"],
      "units": 1,
      "codingRationale": "Moderate complexity E/M: multiple chronic conditions being managed, new symptom with radiculopathy workup, prescription management. 3 diagnoses addressed.",
      "sources": ["https://cms.gov/..."]
    },
    {
      "lineNumber": 2,
      "cpt": "72070",
      "description": "Radiologic exam, lumbar spine, 2 views",
      "modifiers": [],
      "icd10": ["M54.31"],
      "units": 1,
      "codingRationale": "2-view lumbar spine X-ray ordered for evaluation of radiculopathy.",
      "sources": ["https://cms.gov/..."]
    }
  ],
  "validationResult": {
    "riskScore": 12,
    "findings": [],
    "status": "clean"
  }
}
```

## 8. Demo Scenarios

### Scenario A: Clean Claim + Educational Conversation

**Input:** SOAP note for a straightforward office visit. 65-year-old male, established patient, moderate complexity visit for lower back pain with radiculopathy. Lumbar X-ray ordered.

**Initial analysis produces:**

- Correctly codes E/M level as 99214 (not 99215)
- Assigns M54.31 (lumbar radiculopathy, left) as primary, not the less specific M54.5
- Searches web for PTP edit checks between procedure codes
- Risk score: ~10 (low, clean claim)

**Demo conversation:**

```
User: "Why 99214 and not 99213?"
Agent: [Explains MDM complexity levels, references the 3 diagnoses and 
        prescription management in the notes, maps to moderate complexity]

User: "What about 99215?"
Agent: [Explains 99215 requires high complexity, visit doesn't meet 
        criteria, warns upcoding is a denial risk and audit flag]

User: "Could I use M54.5 instead of M54.31?"
Agent: [Explains M54.5 is less specific, clinical documentation clearly 
        states left-sided symptoms, recommends keeping M54.31]
```

**Demo value:** Agent as knowledgeable colleague you can question.

### Scenario B: Claim with Issues + Collaborative Fix

**Input:** SOAP note for a dermatology visit. 45-year-old female, office visit with two lesion biopsies and a skin tag removal.

**Initial analysis produces:**

- E/M with modifier 25
- Shave biopsy (primary) + tangential biopsy (add-on, 4 units)
- Skin tag removal
- Agent searches web for MUE limit, finds limit of 3
- Agent searches web for PTP edit, finds bundling conflict
- Auto-corrects units to 3
- Risk score: ~45 (medium)

**Demo conversation:**

```
User: "The patient actually had 4 additional lesions biopsied, why did 
       you change the units?"
Agent: [Shows search result with MUE limit, explains the per-DOS limit, 
        suggests documenting medical necessity, offers to keep at 4 
        with risk warning]

User: "Keep it at 4, we have documentation"
Agent: [Updates claim, re-validates, risk score increases, adds note 
        about documentation requirements]

User: "What about that bundling issue with the skin tag?"
Agent: [Shows PTP edit source, explains modifier 59, asks if skin tag 
        was at a distinct anatomical site]

User: "Yes, different site"
Agent: [Adds modifier 59, re-validates, finding resolves, risk drops]
```

**Demo value:** Real collaboration. User overrides agent with transparency. User provides clinical context, claim improves.

### Scenario C: Complex Claim + Agent Pushback

**Input:** SOAP note for an orthopedic visit. 30-year-old male, knee evaluation with X-ray and joint injection. Notes include a screening mammography order (intentional error).

**Initial analysis produces:**

- E/M, X-ray, and joint injection correctly coded
- Age/sex flag on mammography for 30-year-old male (critical, from ICD-10 database)
- PTP edit between E/M and injection found via web search (modifier 25 needed)
- Risk score: ~75 (high)

**Demo conversation:**

```
User: "Add the mammography to the claim anyway"
Agent: [Pushes back: will almost certainly be denied, screening code is 
        for female patients, offers alternative codes if clinical reason]

User: "Never mind, remove it. But add modifier 25 to the office visit"
Agent: [Removes mammography, adds modifier 25, re-validates, PTP finding 
        resolves, risk score drops significantly]

User: "Looks good, export"
Agent: [Generates final claim with summary of all changes]
```

**Demo value:** Agent pushes back on a bad decision.

## 9. Evaluation Suite

Automated eval suite validating coding accuracy and the agent's ability to find and apply rules.

**Eval categories:**

1. **ICD-10 code extraction accuracy** — Correct diagnosis codes from clinical notes
2. **ICD-10 code specificity** — Most specific applicable code selected
3. **CPT code identification** — Agent finds correct procedure codes via web search
4. **PTP edit detection** — Agent correctly identifies bundling conflicts
5. **MUE enforcement** — Agent finds and applies correct unit limits
6. **Modifier appropriateness** — Agent suggests correct modifiers
7. **Demographic checks** — Age/sex flag accuracy (deterministic from ICD-10 database)
8. **Conversational accuracy** — Agent correctly handles claim modifications and re-validates

**Scoring:**

- Precision and recall per category
- Source citation accuracy
- Overall F1 target: > 85%

## 10. Synthetic Data

All demo scenarios use synthetic patient data and clinical notes. No real PHI.

**ICD-10 data is real and public domain.** No copyright restrictions.

**No copyrighted data stored anywhere.** CPT information and CMS billing rules are researched at runtime via Opus 4.6's built-in web search. The repository and database contain zero copyrighted material.

## 11. Non-Functional Requirements

### Performance

- Initial analysis (notes to validated claim): < 90 seconds
- Conversation turn response: < 15 seconds
- ICD-10 database lookups: < 1 second
- First stream event within 2-3 seconds

### Accuracy

- ICD-10 code validation: 100% (deterministic)
- ICD-10 age/sex checks: 100% (deterministic)
- CPT code identification via web search: > 90%
- Rule-based findings via web search: > 85%

### Cost per session (estimated)

- Opus 4.6: ~$0.40 initial analysis, ~$0.10 per conversation turn
- Web search: included in Opus 4.6 API usage
- Typical session (analysis + 5 turns): ~$0.90

## 12. UI/UX Requirements

### Component Library: shadcn/ui

Key components:

- `Card` — finding cards, code assignment cards, claim line items
- `Badge` — severity indicators (critical/warning/info), code type labels
- `Progress` — stage progress bar during initial analysis
- `Textarea` — clinical notes input
- `Button` — action buttons, demo scenario selectors
- `ScrollArea` — conversation panel, findings list
- `Collapsible` — expandable coding rationale, tool call details
- `Separator` — visual division between claim sections
- `Tooltip` — hover info on codes, risk scores
- `Sheet` / `Dialog` — claim export, full report view
- `Tabs` — switching between claim view and raw JSON

### Layout: Split Panel

**Left panel: Claim workspace**

- During initial analysis: stages stream in
- After analysis: live claim preview as a structured table
    - Line items with codes, modifiers, units, linked diagnoses
    - Severity badges on items with active findings
    - Risk score prominently displayed (updates live)
    - Coding rationale expandable per line item
    - Source links for findings
    - Findings listed below with severity, description, source, recommendation

**Right panel: Conversation**

- Chat interface
- Agent messages stream in real time
- Tool call indicators (web search activity, database lookups)
- Suggested prompts after initial analysis:
    - "Why did you choose these codes?"
    - "What are the biggest risks?"
    - "Walk me through the findings"
    - "Export the claim"

**Top bar:**

- Session info
- Stage progress indicator (during initial analysis)
- "New claim" button
- Demo scenario selector

### Interaction Details

- Left panel updates in real time during conversation
- Changed line items briefly highlight
- New findings slide in, resolved findings fade out
- Risk score animates on change
- Export button available at any time

### Design Direction

- Clean, professional, institutional
- White/blue/gray palette
- shadcn/ui for consistency and polish
- Split panel feels like a professional tool, not a chatbot wrapper
- Claim workspace is the primary artifact, conversation is the interaction method
- Subtle animations, nothing distracting

## 13. Problem Statement Alignment

### Primary: Problem Statement Two — Break the Barriers

> _"Take something powerful that's locked behind expertise, cost, language, or infrastructure and put it in everyone's hands."_

FirstClaim follows the exact same pattern as the hackathon's example projects. Crop Doctor takes agricultural expertise and puts it in a farmer's hands. FirstClaim takes medical billing expertise and puts it in a small practice office manager's hands.

What's locked behind barriers:

- **Expertise:** Certified medical coders train for years to learn 72,000+ ICD-10 codes, 10,000+ CPT codes, and the web of CMS rules governing how they interact. Small practices can't afford to hire one.
- **Cost:** Enterprise claim scrubbing software (Waystar, Optum, 3M) costs tens of thousands per year. Small practices absorb denial losses instead.
- **Infrastructure:** CMS billing rules are scattered across massive datasets (NCCI PTP edits, MUE tables, modifier guidelines) that no human can memorize and no small office has the tooling to cross-reference.

FirstClaim breaks all three barriers by putting that expertise into a conversation with an AI agent that researches rules in real time, explains its reasoning, and teaches as it works.

### Secondary: Problem Statement Three — Amplify Human Judgment

> _"Build AI that makes researchers, professionals, and decision-makers dramatically more capable — without taking them out of the loop."_

The interactive conversation model is where FirstClaim aligns with Problem Statement Three. Like the hackathon's Grading Calibration Partner example (which highlights scoring inconsistencies but doesn't override the instructor), FirstClaim flags coding issues and pushes back on bad decisions but never overrides the biller.

Concrete examples from the demo scenarios:

- **Scenario B:** User overrides the agent's MUE auto-correction because they have clinical documentation supporting 4 units. The agent respects the override, updates the claim, and adjusts the risk score. Human context wins.
- **Scenario C:** Agent pushes back when the user tries to add a screening mammography for a 30-year-old male patient. The agent explains why it will be denied and offers alternatives. AI judgment wins.
- **Scenario A:** User asks "Why 99214 and not 99213?" and the agent walks through the MDM complexity levels with references to the specific clinical notes. Neither overrides the other; the conversation sharpens the decision.

The result is a claim that's better than either the human or the AI could produce alone. The agent has the rules and the research capability. The human has the clinical context and the final say.

### Recommended Submission Category

**Problem Statement Two: Break the Barriers.** The "access" angle is the stronger emotional hook for the demo. The $250B denial problem, small practices getting crushed, expertise locked behind expensive software. Problem Statement Three describes the _interaction model_ that makes FirstClaim special, but Problem Statement Two describes the _problem_ that makes it matter.

## 14. Judging Criteria Alignment

|Criterion|Weight|How FirstClaim addresses it|
|---|---|---|
|**Impact**|25%|$250B denial problem, full billing workflow in one tool, accessible to small practices, prevention over remediation, educational value|
|**Opus 4.6 Use**|25%|This is an Opus 4.6 showcase in the purest sense. The agent uses its own web search to research CMS rules (BrowseComp strength), comprehends clinical notes (medical language understanding), reasons over multiple rule types simultaneously, maintains long conversations with accumulated context (1M tokens), and makes calibrated judgment calls about code selection and risk. 4 custom MCP tools for ICD-10 + claim state, everything else is Opus being Opus|
|**Depth & Execution**|20%|Real ICD-10 data pipeline, 5-stage agent pipeline, conversational claim refinement with live re-validation, eval suite, every finding linked to a verifiable source, copyright-clean architecture. Minimal stack with maximum capability|
|**Demo**|30%|Initial analysis is the visual hook. Conversation is the emotional hook. Three scenarios show range: educational, collaborative, pushback. Split panel with live updates is visually compelling. The simplicity of the architecture (paste notes, talk to agent, get claim) makes the demo clean and focused|

## 15. Success Criteria

### For the hackathon demo

1. Paste clinical notes and get a validated claim in under 90 seconds
2. Multi-turn conversation that modifies the claim and re-validates
3. Every code assignment includes a rationale
4. Every validation finding links to a verifiable source
5. Agent pushes back on at least one bad user decision
6. Eval suite passes with > 85% accuracy
7. Risk scores update live during conversation
8. Repo contains zero copyrighted data

### For a real product (post-hackathon)

1. Licensed CPT database for faster, deterministic lookups
2. Validated with actual billing specialists
3. Full CMS data coverage with automatic quarterly sync
4. EHR/PMS integration
5. Session history and claim tracking
6. HIPAA-compliant infrastructure
7. Support for Medicaid and commercial payers

## 16. Out of Scope (Hackathon)

- User authentication / multi-tenancy
- Appeal letter generation
- Real patient data or HIPAA compliance
- EHR/PMS integration
- Commercial payer or Medicaid rules
- Batch processing
- Session history beyond current session
- Mobile responsive design
- CMS-1500 form generation
- LCD/NCD coverage determination analysis
- Voice input
- Licensed CPT database

## 17. Competitive Landscape

|Product|What it does|Gap FirstClaim fills|
|---|---|---|
|Waystar|Enterprise RCM with claim scrubbing|No conversation, no notes-to-claim, enterprise pricing|
|Optum/Change Healthcare|Claim editing and denial prevention|Black box, no clinical note input, no interactive refinement|
|3M CodeFinder|Computer-assisted coding|Expensive, no validation, no conversation|
|Nuance DAX|Ambient clinical documentation|Note generation only, doesn't code or validate|
|Availity|Eligibility and claim status|No coding, no validation, no agent|

## 18. Open Questions

1. **API credits:** Confirm whether Anthropic provides Opus 4.6 credits during the hackathon. Ask in #questions on Discord.
2. **Web search reliability for CMS rules:** Test early whether Opus's built-in web search reliably surfaces specific CMS NCCI data (PTP edits, MUE values). If it struggles with very specific rule lookups, may need to supplement with WebFetch targeting known CMS URLs directly.
3. **ICD-10 data source:** Confirm best CMS download URL for current ICD-10-CM release.
4. **Session context limits:** Test how many conversation turns the agent handles before context degrades. The 1M context beta should provide plenty of room.
5. **WebSearch rate limits:** Verify there are no rate limits on the Agent SDK's built-in web search that would bottleneck the initial analysis phase.