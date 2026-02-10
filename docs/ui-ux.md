# FirstClaim UI/UX Design Spec

**Project:** FirstClaim — Get it right the first time.
**Document:** Frontend Design Specification
**Last Updated:** February 9, 2026 (v2 — added Notes Traceability View and Code Detail Card)

---

## 1. Design Philosophy

FirstClaim is a professional billing tool that happens to be powered by a conversation. The design should feel warm, approachable, and competent. Not cold enterprise software. Not a chatbot wrapper. A colleague who knows their stuff and is easy to work with.

The warm amber/teal/cream palette breaks from the typical institutional blue/gray of medical billing software intentionally. Billing is already intimidating. The UI should lower that barrier while still feeling like a serious tool.

**Guiding principles:**

- The claim is the primary artifact, not the conversation
- Every color has a semantic meaning and sticks to it
- Animations serve comprehension, not decoration
- Data surfaces (tables, codes) get maximum contrast on white cards
- The UI teaches as it works through progressive disclosure

---

## 2. Color System

Built on shadcn/ui CSS custom properties using oklch color space. Light mode is the primary presentation mode for demos and general use.

### 2.1 Semantic Color Map

| Token | Visual | Meaning in FirstClaim | Usage |
|-------|--------|----------------------|-------|
| `--primary` | Warm amber | Action, attention, warnings | Buttons, CTAs, medium-risk scores, warning findings, interactive elements, CPT code highlights |
| `--secondary` | Teal | Success, resolution, safety | Low-risk scores, resolved findings, info-level badges, "fixed" indicators, ICD-10 code pill borders |
| `--destructive` | Red | Critical, danger, denial risk | High-risk scores, critical findings, error states, denial flags |
| `--ring` | Purple | Agent activity, focus | Web search spinners, tool call indicators, focus rings, "thinking" states |
| `--accent` | Warm golden | Subtle emphasis | Extraction pills, suggested prompt chips, diff cards, highlight pulses, hover states |
| `--card` | White | Data surfaces | Claim table, message bubbles, modal backgrounds, any surface displaying structured data |
| `--background` | Warm cream | Page canvas | Page background, panel backgrounds, the "desk" that cards sit on |
| `--foreground` | Deep warm brown | Primary text | All body text, headings, labels. Never use pure black. |
| `--muted-foreground` | Warm medium gray | Secondary text | Rationale text, timestamps, line numbers, placeholder text |
| `--border` | Warm light gray | Structure | Table row dividers, card edges, panel separators |

### 2.2 Risk Score Color Mapping

Risk scores use a three-stop color system:

- **0-25 (Low):** `--secondary` (teal) background, `--secondary-foreground` text
- **26-50 (Medium):** `--primary` (amber) background, `--primary-foreground` text
- **51-100 (High):** `--destructive` (red) background, `--destructive-foreground` text

The risk score badge should animate its color transition when the score changes during conversation.

### 2.3 Finding Severity Colors

- **Critical:** `--destructive` (red) badge
- **Warning:** `--primary` (amber) badge
- **Info:** `--secondary` (teal) badge

### 2.4 Code Confidence Indicators

Per-code confidence is displayed as a percentage number with a small colored dot. These use distinct, muted presentations so they don't clash with the claim-level risk score badge.

- **90-100% (High):** `--secondary` (teal) dot
- **70-89% (Medium):** `--primary` (amber) dot
- **Below 70% (Low):** `--destructive` (red) dot

The dot is 6px (`w-1.5 h-1.5`), intentionally smaller than severity badges. The percentage text renders in `--muted-foreground` at `text-sm`. This keeps confidence visually subordinate to finding severity and claim-level risk, which are the higher-priority signals.

**Important:** Confidence is always shown as a number + small dot. Risk score is always shown as a large colored circle badge. The size and format difference prevents confusion between the two.

### 2.5 Dark Mode

The dark mode uses warm brown tones (`--background: oklch(0.1666 0.0158 57.6311)`) instead of pure gray/black. This preserves the brand personality. Dark mode is supported but light mode is the primary presentation mode.

---

## 3. Typography

| Role | Font | Token | Notes |
|------|------|-------|-------|
| Body text, labels, UI | Inter / Geist | `--font-sans` | All prose, descriptions, rationale, conversation text |
| Medical codes | Geist Mono | `--font-mono` | ICD-10 codes, CPT codes, JSON export view. Codes must always read as structured data, not prose. |
| Not used in v1 | Serif stack | `--font-serif` | Reserved for potential future use (reports, printable exports) |

**Rules:**

- Never use pure `#000` for text. Always use `--foreground` (deep warm brown).
- Code values (M54.31, 99214, etc.) always render in `--font-mono`.
- Rationale and secondary explanations use `--muted-foreground`.
- Source links use `--primary` (amber) color.

---

## 4. Application States

The app progresses through three states. Each state transforms the layout rather than navigating to a new page.

### 4.1 Input State

**What the user sees:** A full-screen warm cream (`--background`) canvas with a centered white (`--card`) textarea surface. The textarea has generous padding and `--shadow-md` to feel like a piece of paper on a desk.

**Layout:**

```
┌──────────────────────────────────────────────────────┐ FirstClaim [Demo Scenarios ▾] ┌─────────────────────────────┐ Paste your clinical notes here... └─────────────────────────────┘ [ ■ Analyze Claim ] └──────────────────────────────────────────────────────┘
```

**Specs:**

- Textarea: `--card` white background, `--border` border, `--shadow-md` elevation, minimum 300px height, `--font-sans` at 15-16px
- Textarea max-width: ~720px, centered
- Placeholder text in `--muted-foreground`: "Paste your clinical or SOAP notes here..."
- "Analyze Claim" button: filled `--primary` (amber), large size (h-12 px-8), full rounded corners
- Demo scenario selector: top-right of the top bar, segmented control with `--accent` unselected / `--primary` active

**Transitions:**

- On "Analyze" click, the textarea surface shrinks and slides left as the split panel layout expands from it
- The clinical notes content transfers into a collapsible reference section in the left panel header

### 4.2 Analysis State

**What the user sees:** Split panel layout. Left panel builds the claim progressively. Right panel shows agent thinking stream.

**Layout:**

```
┌──────────────────────────────────────────────────────┐ FirstClaim [Stage 2 of 5 ●●○○○] [Demo ▾] [New] ├────────────────────────────┬─────────────────────────┤ LEFT PANEL (58%) RIGHT PANEL (42%) Claim Workspace Agent Stream [Demographics card Searching ICD-10 for fading in...] lumbar radiculopathy... [Extraction pills Found M54.31 — Lumbar appearing...] radiculopathy, left [Claim table building...] Checking PTP edits between 99214 and [Findings appearing...] 72070... [Risk score counting up] No conflicts found. ├────────────────────────────┤ ░░░░░░░░░░░░░░░░░░░░░░░░ └────────────────────────────┴─────────────────────────┘
```

**Left panel during analysis:**

Each stage visually transforms the panel content. Not appending, transforming.

- **Stage 1 (Extract):** Demographics card fades in at the top. Below it, the **Notes Traceability View (Section 5.5) is the default view** during this stage. The user watches their clinical notes light up with `--primary/40` underline highlights as the agent identifies diagnoses and procedures. Clicking any highlight shows the code detail in the right sub-panel. This is more compelling than extraction pills alone because the user can see the agent "reading" their notes in real time.
- **Stage 2 (Code):** Each pill gets a code badge appended to it. ICD-10 codes appear in `--font-mono` with a `--secondary` (teal) left border. CPT codes appear in `--font-mono` with a `--primary` (amber) left border. Brief rationale text appears below each in `--muted-foreground`.
- **Stage 3 (Build):** The left panel **automatically switches from Notes Traceability View to Claim Table view** with a cross-fade transition. The extractions consolidate into a structured claim table. Line items slide into place on a `--card` white surface. This is the key visual moment: the user watched the agent read their notes (Stage 1-2), and now sees that understanding materialize into a structured claim.
- **Stage 4 (Validate):** Finding cards slide in below the claim table with severity badges. If auto-corrections occur, the affected table row shows a brief strikethrough in `--muted-foreground` then the corrected value in `--secondary` (teal). Risk score circle in the header animates from 0 to the final value with color transitions.
- **Stage 5 (Present):** Everything settles. Subtle animations complete. The right panel transitions from a thinking stream into the conversation interface.

**Right panel during analysis:**

- Agent thinking text in `--muted-foreground` at slightly reduced size (14px)
- Tool activity shows inline with `--ring` (purple) spinner icons
- Text like: "Searching ICD-10 for lumbar radiculopathy..." / "Checking PTP edits between 99214 and 72070..."
- This panel is secondary during analysis. The left panel is the show.

**Top bar during analysis:**

- Stage progress indicator: 5 dots or small segmented bar, filled dots use `--primary` (amber), unfilled use `--border`
- Current stage label next to progress: "Extracting diagnoses..." / "Assigning codes..." / "Building claim..." / "Validating rules..." / "Complete"

### 4.3 Conversation State

**What the user sees:** Same split panel, but the right panel is now a full chat interface and the left panel is a live document.

**Layout:**

```
┌──────────────────────────────────────────────────────┐ FirstClaim [Complete ●●●●●] [Demo ▾] [New] ├────────────────────────────┬─────────────────────────┤ ┌ Risk: 12 ─ Low ──────┐ Agent: Your claim looks DOS: 2024-06-15 clean. Two line items, Patient: 65M risk score of 12... └───────────────────────┘ ┌───────────────────┐ CLAIM TABLE Why 99214 not ┌─┬──────┬────┬────┬───┐ 99213? # CPT Mod Dx Qty ├───────────────────┤ ├─┼──────┼────┼────┼───┤ What are the 1 99214 M54… 1 biggest risks? ├─┼──────┼────┼────┼───┤ ├───────────────────┤ 2 72070 M54… 1 Export the claim └─┴──────┴────┴────┴───┘ └───────────────────┘ FINDINGS (none — clean claim) ├─────────────────────────┤
├────────────────────────────┤ [Type a message...] ▶ [Export Claim] [Revalidate] └────────────────────────────┴─────────────────────────┘
```

---

## 5. Left Panel: Claim Workspace

### 5.1 Header Strip (sticky)

Sticks to the top of the left panel scroll area. `--card` background with `--shadow-sm`.

**Contents:**

- **Risk score badge:** 48px circle. Color follows the three-stop risk mapping. Score number centered inside in `--primary-foreground` / `--secondary-foreground` / `--destructive-foreground` depending on level. Animates color and number on change.
- **Risk label:** "Low Risk" / "Medium Risk" / "High Risk" text next to the badge, same color as badge.
- **Date of service:** `--foreground` text
- **Patient summary:** "65-year-old male" in `--muted-foreground`
- **Clinical notes toggle:** Small "View notes" link in `--primary` that expands a collapsible section showing the original pasted notes in `--muted-foreground` text.
- **View mode toggle:** A two-segment toggle in the header: "Claim" (default, shows claim table + findings) and "Notes" (shows the Notes Traceability View, see Section 5.5). Uses `--accent` for unselected, `--primary` for active. This toggle replaces the simple collapsible and gives the clinical notes a first-class interactive view.

### 5.2 Claim Table

The core data display. Sits on a `--card` (white) surface with `--border` outline and `--shadow-xs`.

**Table structure:**

| Column | Width | Font | Color | Notes |
|--------|-------|------|-------|-------|
| Line # | 40px | `--font-sans` | `--muted-foreground` | Right-aligned |
| CPT Code | 100px | `--font-mono` | `--foreground`, semi-bold | The primary scannable data |
| Description | flex | `--font-sans` | `--foreground` | Truncate with tooltip if needed |
| Modifiers | 80px | `--font-mono` | Small badges with `--accent` bg | Empty state: subtle dash |
| Dx Codes | 120px | `--font-mono` | Clickable pills with `--secondary` border | Click to open Code Detail Card (see Section 5.6) |
| Units | 48px | `--font-mono` | `--foreground` | Center-aligned |
| Expand | 32px | — | `--muted-foreground` chevron | Opens rationale row |

**Row behavior:**

- Default: `--card` background, `--border` bottom border
- Hover: `--accent` background at ~10% opacity
- Changed (during conversation): `--accent` background pulse that fades over 1.5s
- Has active finding: Subtle left border in the finding's severity color (4px)

**Expanded rationale row:**

- Spans full width below the parent row
- `--background` (cream) surface to differentiate from data rows
- Contains: rationale text in `--muted-foreground`, source links in `--primary` (amber), and the web sources the agent used

### 5.3 Findings Section

Below the claim table. Grouped by severity (critical first, then warning, then info).

**Finding row:**

```
┌────────────────────────────────────────────────────────┐ 🔴 CRITICAL PTP edit conflict: 99214 and 20610 bundled per CMS NCCI. Modifier 25 may separate. [▾] └────────────────────────────────────────────────────────┘
```

- Severity badge: small rounded badge, colored per severity mapping
- Description: `--foreground`, concise one-liner
- Expandable detail: source URL, full explanation, recommendation
- Resolved findings: strikethrough text, `--secondary` (teal) checkmark, collapsed into a "Resolved" group at the bottom

**Empty state (no findings):**

- Teal `--secondary` text: "No issues found. Claim looks clean."
- Subtle checkmark icon

### 5.4 Action Bar (sticky bottom)

Sticky to the bottom of the left panel. `--card` background with upward `--shadow-md`.

- **"Export Claim"** button: filled `--primary` (amber), medium size
- **"Re-validate"** button: outlined with `--secondary` (teal) border, medium size
- **"View JSON"** toggle: ghost button in `--muted-foreground`

### 5.5 Notes Traceability View (PreviewBox)

Activated by the "Notes" toggle in the header strip. This view replaces the claim table content area (same panel, different view mode) and provides direct traceability from clinical note text to assigned codes.

**What it solves:** The claim table shows codes, but the biller can't easily verify that the agent read the notes correctly. This view shows the original clinical notes with interactive highlights on every span of text that produced a code assignment. Clicking a highlighted span opens a detail panel showing the code, confidence, rationale, and alternatives.

**Layout:**

```
┌──────────────────────────────────────────────────────┐ NOTES TRACEABILITY ├──────────────────────────────┬───────────────────────┤ SUBJECTIVE:Lumbar radiculopathy, Patient is a 65-year-old left L5 male presenting with worsening ██lower back██ ICD-10: M54.31 ██pain radiating to the██ 92% Confidence ● ██left leg██ for 3 weeks... Description: ASSESSMENT:Sciatica, left side 1. ██Lumbar radiculopathy,██ ██left L5██ Context: 2. ██Type 2 diabetes██ "Lumbar radiculopa- ██mellitus, controlled██ thy, left L5" 3. ██Essential██ ██hypertension██ Alternatives: M54.5 - Low back pain, unspecified └──────────────────────────────┴───────────────────────┘
```

**Left sub-panel (clinical notes text):**

- Renders the full original clinical notes as prose
- Spans of text that map to a code assignment are highlighted with an underline in `--primary/40` (amber at 40% opacity) and a `border-b-2` bottom border
- Hovering a highlighted span changes the background to `--primary/5`
- Clicking a span selects it (background becomes `--primary/10`, border becomes solid `--primary`) and populates the right detail sub-panel
- Multiple findings may highlight overlapping or adjacent text
- Non-highlighted text renders normally in `--foreground`

**Right sub-panel (code detail):**

When a highlighted span is selected, show:

- **Finding title:** `text-lg font-semibold` in `--foreground/90`
- **Code badge:** `Badge` with `bg-primary/5 text-primary border-primary/20`. Code in `--font-mono`.
- **Confidence indicator:** Small colored dot (per Section 2.4) + percentage in `--muted-foreground`
- **Description:** Code description text in `--foreground/80`
- **Context block:** The original highlighted text in a `bg-muted/30` rounded box, showing exactly what text in the notes produced this code
- **Coding notes:** If present, shown in a `bg-warning/5 border-warning/10` box. Expandable if longer than ~30 words (show/hide toggle).
- **Alternative codes:** Each alternative displayed as a row with a `Badge` for the code and description text. Clicking an alternative code should send a message to the agent: "Use [code] instead of [current code]" which triggers the claim update and re-validation loop.
- **References:** Source URLs shown as clickable rows with a numbered indicator in `bg-primary/10` and domain text that highlights to `--primary` on hover.

**Empty state (no span selected):**

Centered message: "Select highlighted text to view coding details" in `--foreground/90` with a supporting line in `--muted-foreground`.

**When to show this view:**

- Available via toggle at any time after analysis completes
- During Stage 1 (Extract) of the initial analysis, this is the **default view** in the left panel before the claim table exists. The user watches their notes light up with highlights as the agent identifies findings. Once Stage 3 (Build) begins, the view automatically switches to the Claim table view.

**Header badge strip:**

At the top of the notes view, show a compact row of `Badge` components for the first 3 ICD-10 codes found, plus a "+N" overflow badge if there are more. Uses `bg-primary/5 text-primary border-primary/20` styling.

**Copy functionality:**

A "Copy" ghost button in the header copies the notes plus all findings in a structured text format (original text + each finding with code, confidence, description, and notes).

### 5.6 Code Detail Card (PreviewClaimCard)

A self-contained card component that displays full detail for a single code assignment. Used in two locations:

**Location 1: ICD-10 pill click in the claim table.**

When the user clicks an ICD-10 code pill (e.g., `M54.31`) in the Dx Codes column of the claim table, the Code Detail Card appears as a popover or inline expansion below the claim table row. This gives the pills a purpose beyond labeling and lets the biller inspect any code without switching views.

**Location 2: Inline in agent conversation messages.**

When the agent discusses a specific code during chat (e.g., explaining why it chose M54.31 over M54.5), it can embed a Code Detail Card inline in its message instead of writing prose. This provides structured, scannable detail within the conversation flow.

**Card contents:**

- **Finding title:** The diagnosis or procedure name. `text-lg font-semibold text-foreground/90`.
- **Code + confidence row:** ICD-10 or CPT code as a `Badge` (`bg-primary/5 text-primary border-primary/20`, code in `--font-mono`), plus the confidence dot and percentage.
- **Description:** Full code description in `text-sm text-foreground/80`.
- **Context:** The original clinical note text that supports this code, in a `bg-muted/30 rounded-lg` box.
- **Coding notes:** Agent's notes about code selection. Shown in a `bg-warning/5 border-warning/10` box if present. Collapsible if long.
- **Alternative codes:** List of alternatives, each as a row with a `Badge` and description. **Alternatives are clickable.** Clicking one sends a message to the agent like "Use E11.65 instead of E11.9 for line 2" and triggers claim update + re-validation.
- **References:** Source URLs with numbered indicators and domain labels.

**Styling:**

- `rounded-lg border border-border/50 bg-background p-6`
- Uses `BlurFade` animation (fade in with slight blur) on appearance with a 200ms delay
- `Separator` between the header section and the description section
- Sections are spaced with `space-y-6`

**Behavior when used as popover (claim table):**

- Appears below the clicked row, pushing content down
- Dismissed by clicking elsewhere, pressing Escape, or clicking the pill again
- Only one card open at a time in the table context

**Behavior when used inline (conversation):**

- Rendered as a regular block element within the agent message bubble
- Not dismissible, it's part of the message content
- The agent decides when to include a card vs. when to respond with prose (cards are better for "why did you choose this code" questions, prose is better for general explanations)

---

## 6. Right Panel: Conversation

### 6.1 Message Bubbles

- **Agent messages:** `--card` (white) background, `--shadow-2xs`, left-aligned, max-width 85%
- **User messages:** `--primary` (amber) background, `--primary-foreground` (white) text, right-aligned, max-width 85%
- **System messages** (stage transitions, summaries): no bubble, centered text in `--muted-foreground`, smaller size

### 6.2 Tool Activity Indicators

Inline in the conversation stream when the agent is searching or looking something up.

```
 🟣 Searching CMS NCCI edits for 99214 + 20610...
```

- `--ring` (purple) spinner/dot icon
- Text in `--muted-foreground`, italic
- Appears inline in the agent's message area
- Disappears or collapses once the tool call completes (replaced by the agent's response that incorporates the result)

### 6.3 Change Summary Cards

When the agent modifies the claim during conversation, an inline card appears in the chat:

```
┌─────────────────────────────────────────┐ CLAIM UPDATED Line 2: Units 4̶ → 3 (MUE limit) Risk: 4̶5̶ → 38 └─────────────────────────────────────────┘
```

- `--accent` (warm golden) background
- `--accent-foreground` text
- Old values in `--muted-foreground` with strikethrough
- New values in `--secondary` (teal) for improvements, `--destructive` for regressions
- Compact, max 3-4 lines

### 6.4 Inline Code Detail Cards

When the agent discusses a specific code in response to a question like "Why did you choose M54.31?" or "What alternatives are there for this diagnosis?", it can embed a Code Detail Card (see Section 5.6) inline in its message instead of writing a paragraph.

**When to use inline cards vs. prose:**

- "Why did you pick this code?" -> Card (shows code, confidence, context, alternatives in structured form)
- "What other codes could work?" -> Card (alternatives section is the focus)
- "Explain the PTP edit" -> Prose (rule explanation is conceptual, not code-specific)
- "What's the MUE limit for 11103?" -> Prose (single fact answer)
- "What if I coded this as 99215?" -> Prose first (explanation of risk), then optionally a card comparing the two codes

**Styling in conversation context:**

- The card sits within the agent message bubble but gets its own `bg-background` surface (slightly different from the `--card` message bubble) to visually separate it from the prose
- Alternative code badges inside the card are clickable and trigger claim updates just like in the Notes Traceability View
- Card uses `rounded-lg border border-border/50` inside the message, no extra shadow (the message bubble already has shadow)

### 6.5 Suggested Prompts

Clickable chips below the agent's message.

- `--accent` background, `--accent-foreground` text
- Rounded full (`rounded-full`)
- Hover: `--primary` background, `--primary-foreground` text
- After initial analysis, show 3-4 prompts:
 - "Why did you choose these codes?"
 - "What are the biggest risks?"
 - "Walk me through the findings"
 - "Export the claim"
- After subsequent agent messages, show 1-2 contextual follow-ups based on what was just discussed

### 6.6 Input Area

Sticky at the bottom of the right panel.

- Text input: `--card` background, `--border` border, `--shadow-xs`
- Placeholder: "Ask about the claim, request changes, or type 'export'..." in `--muted-foreground`
- Send button: `--primary` (amber) icon button
- The input should feel conversational, not like a search bar

---

## 7. Top Bar

Persistent across all states. `--card` background with `--border` bottom border.

**Contents:**

- **Logo/name:** "FirstClaim" in `--foreground`, semi-bold, `--font-sans`
- **Stage progress** (analysis state only): 5 small circles, filled = `--primary`, unfilled = `--border`. Current stage label text beside them.
- **Demo scenario selector:** Segmented control, right side. Unselected segments use `--accent` background. Active segment uses `--primary` background with `--primary-foreground` text. Options: "Scenario A: Clean Claim" / "Scenario B: Claim with Issues" / "Scenario C: Complex + Pushback"
- **"New Claim" button:** Ghost button with `--muted-foreground` text and a plus or refresh icon. Resets to input state.

---

## 8. Responsive Behavior

### Desktop (>1200px)

Full split panel layout as described. Left panel 58%, right panel 42%.

### Tablet / Narrow (768-1200px)

Stack the panels vertically. Claim workspace on top (scrollable), conversation below (fixed height with scroll). Or use a tab toggle between "Claim" and "Chat" views.

### Mobile (<768px)

Out of scope for the hackathon. If needed, default to conversation-only view with a slide-out drawer for the claim workspace.

---

## 9. Animations and Transitions

All animations serve comprehension. Nothing decorative.

| Element | Trigger | Animation | Duration |
|---------|---------|-----------|----------|
| Extraction pills | Stage 1 | Fade in + slight upward slide, staggered 80ms apart | 300ms each |
| Code badge on pill | Stage 2 | Fade in beside the pill | 200ms |
| Pill-to-table-row | Stage 3 | Pills reorganize into table row positions | 500ms |
| Finding cards | Stage 4 | Slide in from left, staggered | 300ms each |
| Risk score number | Stage 4 | Count up from 0, color transitions at thresholds | 1500ms |
| Claim row highlight | Conversation change | `--accent` background pulse | 1500ms fade |
| Finding resolved | Conversation | Strikethrough + teal check, then collapse after 2s | 2000ms total |
| Risk score change | Conversation | Number morphs, color transitions if threshold crossed | 800ms |
| Panel transition | Input to Analysis | Textarea shrinks left, right panel slides in | 600ms |
| Note highlight | Stage 1 / Notes view | `--primary/40` underline fades in on matched text spans, staggered | 250ms each |
| Code Detail Card | Pill click / Conversation | BlurFade: opacity 0 to 1 with slight blur clear | 200ms |
| Notes-to-Claim toggle | User clicks view toggle | Cross-fade between Notes Traceability View and Claim Table | 300ms |
| Alternative code click | User clicks alt code | Brief `--accent` flash on the badge, then sends message to chat | 150ms flash |

**Easing:** Use `ease-out` for entrances, `ease-in-out` for morphs and reorganizations.

---

## 10. Component Inventory (shadcn/ui)

Map of shadcn/ui components to their FirstClaim usage:

| Component | Usage |
|-----------|-------|
| `Card` | Claim workspace surface, finding cards, change summary cards, demographics header |
| `Badge` | Severity indicators (critical/warning/info), modifier labels, code type labels, ICD-10 code badges in Code Detail Card, confidence indicators |
| `Progress` | Stage progress in top bar during initial analysis |
| `Textarea` | Clinical notes input on the input state |
| `Button` | Analyze, Export, Re-validate, New Claim, Send message, Copy (in Notes view), Show More/Less (in coding notes) |
| `ScrollArea` | Both panels independently scrollable, Notes Traceability sub-panels, Code Detail Card alternative codes list |
| `Collapsible` | Expanded rationale per claim line, coding notes in Code Detail Card, resolved findings group |
| `Separator` | Between claim table and findings section, between header and description in Code Detail Card |
| `Tooltip` | Hover on ICD-10 pills to see description, hover on risk score for breakdown |
| `Dialog` | JSON export view, full claim report |
| `Tabs` | Claim view vs. JSON toggle in export dialog, Claim/Notes view toggle in left panel header |
| `Table` | Claim line items |
| `BlurFade` | Entrance animation for Code Detail Cards and Notes Traceability View sections |
| `PreviewBox` (custom) | Notes Traceability View: highlighted clinical notes with click-to-inspect code details |
| `PreviewClaimCard` (custom) | Code Detail Card: full detail view for a single code assignment, used in claim table popovers and inline in conversation |

---

## 11. Empty and Error States

### No clinical notes yet (Input State)

The textarea with placeholder text. Demo scenario selector available. No loading, no skeleton.

### Analysis error

If the agent fails mid-analysis:

- Left panel shows whatever was completed with a `--destructive` banner: "Analysis interrupted. Try again or modify your notes."
- "Retry" button in `--primary`
- Conversation panel remains available so the user can ask what happened

### No findings (clean claim)

`--secondary` (teal) text with checkmark: "No issues found. Claim looks clean." This is a positive state, not an empty state. Celebrate it.

### Web search failure during conversation

Agent responds conversationally: "I wasn't able to look up the PTP edit rules for that code pair right now. Based on what I know, here's my best assessment, but I'd recommend verifying against the CMS NCCI tables directly."

Tool activity indicator shows `--destructive` colored X instead of `--ring` spinner.

---

## 12. Export Output

### JSON Export Dialog

Triggered by "Export Claim" button. Uses `Dialog` component.

**Contains:**

- `Tabs` with two views: "Formatted" (human-readable summary) and "JSON" (raw structured output)
- Formatted view: the claim table, findings, risk score, coding rationale, and conversation change summary rendered as a clean read-only document
- JSON view: `--font-mono` text on `--card` background, syntax-highlighted
- "Copy to Clipboard" button: `--primary`
- "Download JSON" button: outlined `--secondary`

---

## 13. Build Priority

For the hackathon, build in this order:

1. **Claim table** with live update support on `--card` white surface
2. **Chat panel** with streaming, amber/white message bubbles
3. **Initial analysis staging** with progressive build animations
4. **Findings section** with three-color severity badges
5. **Risk score badge** with teal-to-amber-to-red color animation
6. **Tool activity indicators** with purple pulse
7. **Export dialog** with JSON output
8. **Notes Traceability View (PreviewBox)** with highlighted spans and click-to-inspect detail panel
9. **Code Detail Card (PreviewClaimCard)** as popover on ICD-10 pill click in claim table
10. **Demo scenario selector** in top bar
11. **Suggested prompt chips**
12. **Change summary cards** in conversation
13. **Inline Code Detail Cards** in agent conversation messages
14. **Clickable alternative codes** that trigger claim updates from both Notes view and conversation cards

Items 1-7 are required for demo. Items 8-9 are high-value additions that showcase traceability and make the tool feel distinctly different from a chatbot. Items 10-14 are polish that significantly improve the demo flow.

**Note on items 8-9:** These components bridge the gap between "the agent suggested some codes" and "the agent can show you exactly why, from your own notes, with alternatives you can act on." For the hackathon demo, even a basic version of the Notes Traceability View (highlights without the full detail panel) adds significant visual impact during Stage 1 of the analysis.# FirstClaim UI/UX Design Spec

**Project:** FirstClaim — Get it right the first time.
**Document:** Frontend Design Specification
**Last Updated:** February 9, 2026

---

## 1. Design Philosophy

FirstClaim is a professional billing tool that happens to be powered by a conversation. The design should feel warm, approachable, and competent. Not cold enterprise software. Not a chatbot wrapper. A colleague who knows their stuff and is easy to work with.

The warm amber/teal/cream palette breaks from the typical institutional blue/gray of medical billing software intentionally. Billing is already intimidating. The UI should lower that barrier while still feeling like a serious tool.

**Guiding principles:**

- The claim is the primary artifact, not the conversation
- Every color has a semantic meaning and sticks to it
- Animations serve comprehension, not decoration
- Data surfaces (tables, codes) get maximum contrast on white cards
- The UI teaches as it works through progressive disclosure

---

## 2. Color System

Built on shadcn/ui CSS custom properties using oklch color space. Light mode is the primary presentation mode for demos and general use.

### 2.1 Semantic Color Map

| Token | Visual | Meaning in FirstClaim | Usage |
|-------|--------|----------------------|-------|
| `--primary` | Warm amber | Action, attention, warnings | Buttons, CTAs, medium-risk scores, warning findings, interactive elements, CPT code highlights |
| `--secondary` | Teal | Success, resolution, safety | Low-risk scores, resolved findings, info-level badges, "fixed" indicators, ICD-10 code pill borders |
| `--destructive` | Red | Critical, danger, denial risk | High-risk scores, critical findings, error states, denial flags |
| `--ring` | Purple | Agent activity, focus | Web search spinners, tool call indicators, focus rings, "thinking" states |
| `--accent` | Warm golden | Subtle emphasis | Extraction pills, suggested prompt chips, diff cards, highlight pulses, hover states |
| `--card` | White | Data surfaces | Claim table, message bubbles, modal backgrounds, any surface displaying structured data |
| `--background` | Warm cream | Page canvas | Page background, panel backgrounds, the "desk" that cards sit on |
| `--foreground` | Deep warm brown | Primary text | All body text, headings, labels. Never use pure black. |
| `--muted-foreground` | Warm medium gray | Secondary text | Rationale text, timestamps, line numbers, placeholder text |
| `--border` | Warm light gray | Structure | Table row dividers, card edges, panel separators |

### 2.2 Risk Score Color Mapping

Risk scores use a three-stop color system:

- **0-25 (Low):** `--secondary` (teal) background, `--secondary-foreground` text
- **26-50 (Medium):** `--primary` (amber) background, `--primary-foreground` text
- **51-100 (High):** `--destructive` (red) background, `--destructive-foreground` text

The risk score badge should animate its color transition when the score changes during conversation.

### 2.3 Finding Severity Colors

- **Critical:** `--destructive` (red) badge
- **Warning:** `--primary` (amber) badge
- **Info:** `--secondary` (teal) badge

### 2.4 Dark Mode

The dark mode uses warm brown tones (`--background: oklch(0.1666 0.0158 57.6311)`) instead of pure gray/black. This preserves the brand personality. Dark mode is supported but light mode is the primary presentation mode.

---

## 3. Typography

| Role | Font | Token | Notes |
|------|------|-------|-------|
| Body text, labels, UI | Inter / Geist | `--font-sans` | All prose, descriptions, rationale, conversation text |
| Medical codes | Geist Mono | `--font-mono` | ICD-10 codes, CPT codes, JSON export view. Codes must always read as structured data, not prose. |
| Not used in v1 | Serif stack | `--font-serif` | Reserved for potential future use (reports, printable exports) |

**Rules:**

- Never use pure `#000` for text. Always use `--foreground` (deep warm brown).
- Code values (M54.31, 99214, etc.) always render in `--font-mono`.
- Rationale and secondary explanations use `--muted-foreground`.
- Source links use `--primary` (amber) color.

---

## 4. Application States

The app progresses through three states. Each state transforms the layout rather than navigating to a new page.

### 4.1 Input State

**What the user sees:** A full-screen warm cream (`--background`) canvas with a centered white (`--card`) textarea surface. The textarea has generous padding and `--shadow-md` to feel like a piece of paper on a desk.

**Layout:**

```
┌──────────────────────────────────────────────────────┐ FirstClaim [Demo Scenarios ▾] ┌─────────────────────────────┐ Paste your clinical notes here... └─────────────────────────────┘ [ ■ Analyze Claim ] └──────────────────────────────────────────────────────┘
```

**Specs:**

- Textarea: `--card` white background, `--border` border, `--shadow-md` elevation, minimum 300px height, `--font-sans` at 15-16px
- Textarea max-width: ~720px, centered
- Placeholder text in `--muted-foreground`: "Paste your clinical or SOAP notes here..."
- "Analyze Claim" button: filled `--primary` (amber), large size (h-12 px-8), full rounded corners
- Demo scenario selector: top-right of the top bar, segmented control with `--accent` unselected / `--primary` active

**Transitions:**

- On "Analyze" click, the textarea surface shrinks and slides left as the split panel layout expands from it
- The clinical notes content transfers into a collapsible reference section in the left panel header

### 4.2 Analysis State

**What the user sees:** Split panel layout. Left panel builds the claim progressively. Right panel shows agent thinking stream.

**Layout:**

```
┌──────────────────────────────────────────────────────┐ FirstClaim [Stage 2 of 5 ●●○○○] [Demo ▾] [New] ├────────────────────────────┬─────────────────────────┤ LEFT PANEL (58%) RIGHT PANEL (42%) Claim Workspace Agent Stream [Demographics card Searching ICD-10 for fading in...] lumbar radiculopathy... [Extraction pills Found M54.31 — Lumbar appearing...] radiculopathy, left [Claim table building...] Checking PTP edits between 99214 and [Findings appearing...] 72070... [Risk score counting up] No conflicts found. ├────────────────────────────┤ ░░░░░░░░░░░░░░░░░░░░░░░░ └────────────────────────────┴─────────────────────────┘
```

**Left panel during analysis:**

Each stage visually transforms the panel content. Not appending, transforming.

- **Stage 1 (Extract):** Demographics card fades in at the top. Below it, extracted diagnoses and procedures appear as `--accent` (warm golden) pills with `--accent-foreground` text. Each pill animates in with a slight stagger.
- **Stage 2 (Code):** Each pill gets a code badge appended to it. ICD-10 codes appear in `--font-mono` with a `--secondary` (teal) left border. CPT codes appear in `--font-mono` with a `--primary` (amber) left border. Brief rationale text appears below each in `--muted-foreground`.
- **Stage 3 (Build):** The pills and codes reorganize into a structured claim table. This is the key visual moment. Scattered extractions consolidate into clean rows on a `--card` white surface.
- **Stage 4 (Validate):** Finding cards slide in below the claim table with severity badges. If auto-corrections occur, the affected table row shows a brief strikethrough in `--muted-foreground` then the corrected value in `--secondary` (teal). Risk score circle in the header animates from 0 to the final value with color transitions.
- **Stage 5 (Present):** Everything settles. Subtle animations complete. The right panel transitions from a thinking stream into the conversation interface.

**Right panel during analysis:**

- Agent thinking text in `--muted-foreground` at slightly reduced size (14px)
- Tool activity shows inline with `--ring` (purple) spinner icons
- Text like: "Searching ICD-10 for lumbar radiculopathy..." / "Checking PTP edits between 99214 and 72070..."
- This panel is secondary during analysis. The left panel is the show.

**Top bar during analysis:**

- Stage progress indicator: 5 dots or small segmented bar, filled dots use `--primary` (amber), unfilled use `--border`
- Current stage label next to progress: "Extracting diagnoses..." / "Assigning codes..." / "Building claim..." / "Validating rules..." / "Complete"

### 4.3 Conversation State

**What the user sees:** Same split panel, but the right panel is now a full chat interface and the left panel is a live document.

**Layout:**

```
┌──────────────────────────────────────────────────────┐ FirstClaim [Complete ●●●●●] [Demo ▾] [New] ├────────────────────────────┬─────────────────────────┤ ┌ Risk: 12 ─ Low ──────┐ Agent: Your claim looks DOS: 2024-06-15 clean. Two line items, Patient: 65M risk score of 12... └───────────────────────┘ ┌───────────────────┐ CLAIM TABLE Why 99214 not ┌─┬──────┬────┬────┬───┐ 99213? # CPT Mod Dx Qty ├───────────────────┤ ├─┼──────┼────┼────┼───┤ What are the 1 99214 M54… 1 biggest risks? ├─┼──────┼────┼────┼───┤ ├───────────────────┤ 2 72070 M54… 1 Export the claim └─┴──────┴────┴────┴───┘ └───────────────────┘ FINDINGS (none — clean claim) ├─────────────────────────┤
├────────────────────────────┤ [Type a message...] ▶ [Export Claim] [Revalidate] └────────────────────────────┴─────────────────────────┘
```

---

## 5. Left Panel: Claim Workspace

### 5.1 Header Strip (sticky)

Sticks to the top of the left panel scroll area. `--card` background with `--shadow-sm`.

**Contents:**

- **Risk score badge:** 48px circle. Color follows the three-stop risk mapping. Score number centered inside in `--primary-foreground` / `--secondary-foreground` / `--destructive-foreground` depending on level. Animates color and number on change.
- **Risk label:** "Low Risk" / "Medium Risk" / "High Risk" text next to the badge, same color as badge.
- **Date of service:** `--foreground` text
- **Patient summary:** "65-year-old male" in `--muted-foreground`
- **Clinical notes toggle:** Small "View notes" link in `--primary` that expands a collapsible section showing the original pasted notes in `--muted-foreground` text.

### 5.2 Claim Table

The core data display. Sits on a `--card` (white) surface with `--border` outline and `--shadow-xs`.

**Table structure:**

| Column | Width | Font | Color | Notes |
|--------|-------|------|-------|-------|
| Line # | 40px | `--font-sans` | `--muted-foreground` | Right-aligned |
| CPT Code | 100px | `--font-mono` | `--foreground`, semi-bold | The primary scannable data |
| Description | flex | `--font-sans` | `--foreground` | Truncate with tooltip if needed |
| Modifiers | 80px | `--font-mono` | Small badges with `--accent` bg | Empty state: subtle dash |
| Dx Codes | 120px | `--font-mono` | Clickable pills with `--secondary` border | Comma-separated, hover to see description |
| Units | 48px | `--font-mono` | `--foreground` | Center-aligned |
| Expand | 32px | — | `--muted-foreground` chevron | Opens rationale row |

**Row behavior:**

- Default: `--card` background, `--border` bottom border
- Hover: `--accent` background at ~10% opacity
- Changed (during conversation): `--accent` background pulse that fades over 1.5s
- Has active finding: Subtle left border in the finding's severity color (4px)

**Expanded rationale row:**

- Spans full width below the parent row
- `--background` (cream) surface to differentiate from data rows
- Contains: rationale text in `--muted-foreground`, source links in `--primary` (amber), and the web sources the agent used

### 5.3 Findings Section

Below the claim table. Grouped by severity (critical first, then warning, then info).

**Finding row:**

```
┌────────────────────────────────────────────────────────┐ 🔴 CRITICAL PTP edit conflict: 99214 and 20610 bundled per CMS NCCI. Modifier 25 may separate. [▾] └────────────────────────────────────────────────────────┘
```

- Severity badge: small rounded badge, colored per severity mapping
- Description: `--foreground`, concise one-liner
- Expandable detail: source URL, full explanation, recommendation
- Resolved findings: strikethrough text, `--secondary` (teal) checkmark, collapsed into a "Resolved" group at the bottom

**Empty state (no findings):**

- Teal `--secondary` text: "No issues found. Claim looks clean."
- Subtle checkmark icon

### 5.4 Action Bar (sticky bottom)

Sticky to the bottom of the left panel. `--card` background with upward `--shadow-md`.

- **"Export Claim"** button: filled `--primary` (amber), medium size
- **"Re-validate"** button: outlined with `--secondary` (teal) border, medium size
- **"View JSON"** toggle: ghost button in `--muted-foreground`

---

## 6. Right Panel: Conversation

### 6.1 Message Bubbles

- **Agent messages:** `--card` (white) background, `--shadow-2xs`, left-aligned, max-width 85%
- **User messages:** `--primary` (amber) background, `--primary-foreground` (white) text, right-aligned, max-width 85%
- **System messages** (stage transitions, summaries): no bubble, centered text in `--muted-foreground`, smaller size

### 6.2 Tool Activity Indicators

Inline in the conversation stream when the agent is searching or looking something up.

```
 🟣 Searching CMS NCCI edits for 99214 + 20610...
```

- `--ring` (purple) spinner/dot icon
- Text in `--muted-foreground`, italic
- Appears inline in the agent's message area
- Disappears or collapses once the tool call completes (replaced by the agent's response that incorporates the result)

### 6.3 Change Summary Cards

When the agent modifies the claim during conversation, an inline card appears in the chat:

```
┌─────────────────────────────────────────┐ CLAIM UPDATED Line 2: Units 4̶ → 3 (MUE limit) Risk: 4̶5̶ → 38 └─────────────────────────────────────────┘
```

- `--accent` (warm golden) background
- `--accent-foreground` text
- Old values in `--muted-foreground` with strikethrough
- New values in `--secondary` (teal) for improvements, `--destructive` for regressions
- Compact, max 3-4 lines

### 6.4 Suggested Prompts

Clickable chips below the agent's message.

- `--accent` background, `--accent-foreground` text
- Rounded full (`rounded-full`)
- Hover: `--primary` background, `--primary-foreground` text
- After initial analysis, show 3-4 prompts:
 - "Why did you choose these codes?"
 - "What are the biggest risks?"
 - "Walk me through the findings"
 - "Export the claim"
- After subsequent agent messages, show 1-2 contextual follow-ups based on what was just discussed

### 6.5 Input Area

Sticky at the bottom of the right panel.

- Text input: `--card` background, `--border` border, `--shadow-xs`
- Placeholder: "Ask about the claim, request changes, or type 'export'..." in `--muted-foreground`
- Send button: `--primary` (amber) icon button
- The input should feel conversational, not like a search bar

---

## 7. Top Bar

Persistent across all states. `--card` background with `--border` bottom border.

**Contents:**

- **Logo/name:** "FirstClaim" in `--foreground`, semi-bold, `--font-sans`
- **Stage progress** (analysis state only): 5 small circles, filled = `--primary`, unfilled = `--border`. Current stage label text beside them.
- **Demo scenario selector:** Segmented control, right side. Unselected segments use `--accent` background. Active segment uses `--primary` background with `--primary-foreground` text. Options: "Scenario A: Clean Claim" / "Scenario B: Claim with Issues" / "Scenario C: Complex + Pushback"
- **"New Claim" button:** Ghost button with `--muted-foreground` text and a plus or refresh icon. Resets to input state.

---

## 8. Responsive Behavior

### Desktop (>1200px)

Full split panel layout as described. Left panel 58%, right panel 42%.

### Tablet / Narrow (768-1200px)

Stack the panels vertically. Claim workspace on top (scrollable), conversation below (fixed height with scroll). Or use a tab toggle between "Claim" and "Chat" views.

### Mobile (<768px)

Out of scope for the hackathon. If needed, default to conversation-only view with a slide-out drawer for the claim workspace.

---

## 9. Animations and Transitions

All animations serve comprehension. Nothing decorative.

| Element | Trigger | Animation | Duration |
|---------|---------|-----------|----------|
| Extraction pills | Stage 1 | Fade in + slight upward slide, staggered 80ms apart | 300ms each |
| Code badge on pill | Stage 2 | Fade in beside the pill | 200ms |
| Pill-to-table-row | Stage 3 | Pills reorganize into table row positions | 500ms |
| Finding cards | Stage 4 | Slide in from left, staggered | 300ms each |
| Risk score number | Stage 4 | Count up from 0, color transitions at thresholds | 1500ms |
| Claim row highlight | Conversation change | `--accent` background pulse | 1500ms fade |
| Finding resolved | Conversation | Strikethrough + teal check, then collapse after 2s | 2000ms total |
| Risk score change | Conversation | Number morphs, color transitions if threshold crossed | 800ms |
| Panel transition | Input to Analysis | Textarea shrinks left, right panel slides in | 600ms |

**Easing:** Use `ease-out` for entrances, `ease-in-out` for morphs and reorganizations.

---

## 10. Component Inventory (shadcn/ui)

Map of shadcn/ui components to their FirstClaim usage:

| Component | Usage |
|-----------|-------|
| `Card` | Claim workspace surface, finding cards, change summary cards, demographics header |
| `Badge` | Severity indicators (critical/warning/info), modifier labels, code type labels |
| `Progress` | Stage progress in top bar during initial analysis |
| `Textarea` | Clinical notes input on the input state |
| `Button` | Analyze, Export, Re-validate, New Claim, Send message |
| `ScrollArea` | Both panels independently scrollable |
| `Collapsible` | Expanded rationale per claim line, clinical notes reference, resolved findings group |
| `Separator` | Between claim table and findings section |
| `Tooltip` | Hover on ICD-10 pills to see description, hover on risk score for breakdown |
| `Dialog` | JSON export view, full claim report |
| `Tabs` | Claim view vs. JSON toggle in export dialog |
| `Table` | Claim line items |

---

## 11. Empty and Error States

### No clinical notes yet (Input State)

The textarea with placeholder text. Demo scenario selector available. No loading, no skeleton.

### Analysis error

If the agent fails mid-analysis:

- Left panel shows whatever was completed with a `--destructive` banner: "Analysis interrupted. Try again or modify your notes."
- "Retry" button in `--primary`
- Conversation panel remains available so the user can ask what happened

### No findings (clean claim)

`--secondary` (teal) text with checkmark: "No issues found. Claim looks clean." This is a positive state, not an empty state. Celebrate it.

### Web search failure during conversation

Agent responds conversationally: "I wasn't able to look up the PTP edit rules for that code pair right now. Based on what I know, here's my best assessment, but I'd recommend verifying against the CMS NCCI tables directly."

Tool activity indicator shows `--destructive` colored X instead of `--ring` spinner.

---

## 12. Export Output

### JSON Export Dialog

Triggered by "Export Claim" button. Uses `Dialog` component.

**Contains:**

- `Tabs` with two views: "Formatted" (human-readable summary) and "JSON" (raw structured output)
- Formatted view: the claim table, findings, risk score, coding rationale, and conversation change summary rendered as a clean read-only document
- JSON view: `--font-mono` text on `--card` background, syntax-highlighted
- "Copy to Clipboard" button: `--primary`
- "Download JSON" button: outlined `--secondary`

---

## 13. Build Priority

For the hackathon, build in this order:

1. **Claim table** with live update support on `--card` white surface
2. **Chat panel** with streaming, amber/white message bubbles
3. **Initial analysis staging** with progressive build animations
4. **Findings section** with three-color severity badges
5. **Risk score badge** with teal-to-amber-to-red color animation
6. **Tool activity indicators** with purple pulse
7. **Export dialog** with JSON output
8. **Demo scenario selector** in top bar
9. **Suggested prompt chips**
10. **Change summary cards** in conversation

Items 1-7 are required for demo. Items 8-10 are polish that significantly improve the demo flow.