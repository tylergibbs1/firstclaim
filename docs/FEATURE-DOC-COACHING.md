# Feature Spec: Documentation Coaching

**Feature:** Documentation Gap Analysis & Provider Coaching
**Author:** Tyler Gibbs
**Status:** Hackathon Build (Phase 1)
**Last Updated:** February 11, 2026

---

## 1. The Latent Demand

FirstClaim's flow is: clinical notes → codes → validated claim. But the #1 cause of lost revenue in medical billing isn't bad coding — it's insufficient documentation. The notes don't support the code the provider actually earned.

Every biller in America has had this conversation:

> "Doctor, you spent 40 minutes on this patient, managed three chronic conditions, and ordered labs. But your note says 'follow-up visit, stable, continue meds.' I can only bill 99213. You did 99215-level work but documented a 99213."

This happens constantly. Providers lose revenue not because they didn't do the work, but because they didn't write it down with enough specificity for the code to be justified.

**The behavioral signal:** When FirstClaim tells a user "I coded this as 99213 because the documentation only supports low-complexity MDM," the user's immediate next question will be:

*"What would the doctor need to document to support 99214?"*

They will type this into the chat. They will do it on day one. They won't need to be told the feature exists. The conversational interface invites it.

This is the Facebook Groups → Marketplace moment. You built a coding tool. Users will hack it into a documentation coaching tool. Build the real feature around that behavior.

---

## 2. Problem Statement

There is a fundamental information asymmetry in medical billing:

- **Providers** know what they did clinically but don't know what the billing rules require them to document.
- **Billers** know what the billing rules require but can't go back in time and change the notes.

The result: providers under-document, billers under-code, practices lose money. The fix today is retroactive — billers flag the problem after the visit, providers try to addend notes (which has compliance risks), or everyone just accepts the revenue loss.

FirstClaim already sits at the intersection. It reads clinical notes and knows billing rules. It's one step away from closing the loop.

---

## 3. Solution

Add a **Documentation Gap Analysis** that runs automatically during claim analysis and surfaces actionable coaching for providers alongside the existing claim output.

### 3.1 What It Does

For every claim line where documentation limits the code level or creates denial risk, the agent generates:

1. **What was coded** — The code assigned based on current documentation
2. **What was likely performed** — What the clinical context suggests actually happened (based on assessment complexity, number of conditions, procedures mentioned, time indicators)
3. **The gap** — Specific documentation elements that are missing or insufficient
4. **What to document next time** — Concrete, copy-paste-ready language patterns the provider can use in future notes

### 3.2 Example Output

```
┌─────────────────────────────────────────────────────────┐
│ DOCUMENTATION GAP                                       │
│                                                         │
│ E/M Level: Coded 99213 → Could support 99214            │
│ Estimated revenue difference: ~$40-70 per visit         │
│                                                         │
│ What's missing:                                         │
│ ├─ MDM complexity: Note doesn't document data reviewed  │
│ │  (labs, imaging, external records)                    │
│ ├─ Risk: No mention of drug interactions or side        │
│ │  effect management for current medications            │
│ └─ Problems addressed: Note lists diagnoses but         │
│    doesn't document what was done for each one          │
│                                                         │
│ For next time, document:                                │
│ ├─ "Reviewed recent A1c of 7.2, trending up from 6.8"  │
│ ├─ "Discussed metformin GI side effects, patient        │
│ │   tolerating well"                                    │
│ └─ "Addressed hypertension: BP at goal on current       │
│     regimen, continue lisinopril 20mg"                  │
│                                                         │
│ These elements establish moderate-complexity MDM         │
│ (2+ chronic conditions, prescription drug management)   │
│ which supports 99214.                                   │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Conversation Integration

Users can interact with documentation coaching the same way they interact with claims:

| User says | Agent does |
|---|---|
| "What would it take to bill 99215 for this visit?" | Explains high-complexity MDM requirements, maps them to this specific clinical scenario, gives documentation templates |
| "The doctor actually reviewed outside imaging, she just didn't write it" | Suggests addendum language (with compliance caveats), recalculates what the E/M could be |
| "Can you make a cheat sheet for Dr. Martinez?" | Generates a provider-specific documentation guide based on the patterns seen across their notes |
| "We keep getting coded at 99213 for our diabetes follow-ups" | Analyzes why, provides a documentation template specifically for endocrine follow-ups that captures the elements needed for 99214/99215 |

---

## 4. Why This Matters

### 4.1 Revenue Impact

The average primary care practice under-codes 20-30% of E/M visits due to documentation gaps. For a practice seeing 25 patients/day:

- 5-8 visits/day coded below what was actually performed
- ~$40-70 revenue gap per under-coded visit
- **$50,000-$140,000/year in lost revenue per provider**

This isn't upcoding. This is documenting what you actually did.

### 4.2 Flywheel Effect

Documentation coaching creates a compounding improvement loop:

```
Visit 1: Provider writes sparse notes
         → FirstClaim codes 99213
         → Gap analysis shows what's missing
         → Provider sees "$50/visit on the table"

Visit 2: Provider documents one more element
         → FirstClaim codes 99214
         → Gap analysis shows remaining opportunity

Visit 5: Provider's default documentation
         captures what's needed
         → Claims consistently code correctly
         → FirstClaim validates, finds nothing to coach on
```

The product makes itself less necessary over time — which paradoxically makes it more valuable, because the practice sees measurable revenue improvement they can attribute directly to FirstClaim.

### 4.3 User Base Expansion

Without this feature, FirstClaim's user is the biller. With it, the provider cares too. The biller shows the documentation gap report to the doctor. The doctor sees "$140K/year in lost revenue" and pays attention. Now you have two users per practice instead of one, and the provider is the one with purchasing authority.

---

## 5. Scope & Phases

### Phase 1: Inline Gap Analysis — HACKATHON BUILD

**Effort:** Low. This is prompt engineering + one new finding type in the UI. No new tools, no new infrastructure.

The agent already reads clinical notes, understands E/M documentation requirements, and explains its coding rationale. We're telling it to do one more thing: when documentation limits the code level, say so and say what's missing.

**Implementation:**
- Add documentation gap analysis to the agent's system prompt as a step after coding
- Agent automatically notes when documentation limits the E/M level
- Gaps surface as a new finding type (alongside PTP edits, MUE limits, etc.)
- Users can ask follow-up questions in the existing chat

**UI changes:**
- New finding category: "Documentation Gap" with a distinct visual treatment — opportunity/gold, not red/critical. This isn't a problem with the claim, it's money left on the table.
- Finding card shows: current code, potential code, what's missing, what to document next time

**Why this belongs in the hackathon demo:** The three existing demo scenarios show the agent validating and fixing claims. Documentation coaching shows it going *upstream* — improving the source data, not just the output. That's a fundamentally different value proposition and it lands in the demo as a "wait, it does that too?" moment. It also directly strengthens the "Break the Barriers" narrative: the expertise being democratized isn't just "how to code" but "how to document so you get paid for what you did."

### Phase 2: Documentation Templates (Post-hackathon)

- Generate provider-specific documentation templates based on their common visit types
- "For your typical diabetes follow-up, include these 5 elements"
- Exportable as a one-page reference card (PDF or printable)

### Phase 3: Practice-Level Patterns (Post-hackathon)

- Aggregate documentation gaps across sessions
- "Dr. Martinez under-documents data review in 80% of visits"
- "Your orthopedic visits consistently miss risk documentation"
- Practice dashboard showing documentation improvement over time

### Phase 4: Real-Time Documentation Assistance (Long-term)

- EHR integration that coaches the provider while they write the note
- "You mentioned reviewing labs — document which labs and the results"
- This is the end-state: the gap disappears because it's caught at the source

---

## 6. Demo Scenario

### Scenario D: Documentation Gap — "You're Leaving Money on the Table"

**Input:** SOAP note for a primary care follow-up. 58-year-old female, established patient, managing type 2 diabetes, hypertension, and hyperlipidemia. Provider adjusted metformin dose, reviewed recent labs, discussed statin side effects, and ordered follow-up A1c. But the note is sparse — assessment just lists the three diagnoses, plan says "continue meds, adjust metformin, recheck labs."

**Initial analysis produces:**

- E/M coded as 99213 (low complexity) based on documentation
- ICD-10 codes: E11.65, I10, E78.5 — all validated
- No PTP edits, no MUE issues
- Risk score: ~8 (low, clean claim)
- **Documentation Gap finding:** Gold card — "Coded 99213, clinical context suggests 99214. Documentation doesn't capture data review, medication risk management, or per-problem assessment."

**Demo conversation:**

```
User: "Why only 99213? She's managing three chronic conditions."

Agent: The clinical notes mention three active conditions, a medication
       adjustment, and lab review — which suggests moderate-complexity
       MDM. But the documentation doesn't explicitly capture the elements
       CMS requires for 99214:

       - No mention of which labs were reviewed or the results
       - No documentation of risk assessment for the metformin dose change
       - Assessment lists diagnoses but doesn't document what was
         evaluated and decided for each one

       I can only code what's documented, not what was likely done.

User: "What would the note need to say to support 99214?"

Agent: For this visit to support 99214, the note should document:

       1. Data reviewed: "Reviewed A1c of 7.4 (up from 6.9), BMP normal,
          lipid panel showing LDL 118"
       2. Per-problem assessment:
          - "DM2: A1c rising, increase metformin 500mg to 1000mg BID.
            Discussed hypoglycemia risk with dose increase."
          - "HTN: BP at goal on current regimen, continue lisinopril"
          - "HLD: LDL above target on atorvastatin 20mg. Discussed
            myalgia, patient tolerating well. Continue current dose."
       3. Risk: "Prescription drug management with dose change"

       These elements establish moderate-complexity MDM: 2+ chronic
       conditions with medication management and data review.

User: "That's exactly what she did. She just doesn't write it that way."

Agent: That's the most common documentation gap in primary care. The
       clinical work supports 99214 — the note just doesn't capture it
       in the structure CMS needs. The revenue difference is roughly
       $40-70 per visit. For a provider seeing 20 patients/day with
       similar documentation patterns, that adds up.
```

**Demo value:** The agent goes upstream. It doesn't just code the claim — it identifies why the practice is leaving money on the table and gives the provider concrete language to fix it. This is the moment in the demo where it stops being a coding tool and becomes a revenue tool.

**Judging criteria alignment:**
- **Impact:** This is where "$50K-$140K/year in lost revenue per provider" lands. The tool pays for itself.
- **Opus 4.6 Use:** The agent reasons about the gap between clinical reality and documentation — understanding both what was likely done and what was written. That's a sophisticated inference, not a lookup.
- **Depth & Execution:** This is the "pushed past the first idea" moment. Claim validation is the first idea. Going upstream to fix the documentation is the second-order insight.
- **Demo:** Self-explanatory finding card. One conversational beat. No extra setup needed.

---

## 7. Compliance Guardrails

Documentation coaching sits near a compliance boundary. The feature must be designed carefully.

### What this IS:
- Helping providers document what they actually did
- Teaching documentation best practices per CMS guidelines
- Identifying when documentation doesn't reflect the complexity of care provided

### What this is NOT:
- Suggesting providers document things they didn't do
- Recommending upcoding without clinical basis
- Encouraging addendums to inflate billing after the fact

### Agent Behavior Rules:
1. **Always anchor to clinical evidence.** Gaps should only be flagged when the notes contain implicit evidence of higher complexity (multiple conditions managed, medications adjusted, tests ordered) that isn't explicitly documented per billing requirements.
2. **Never suggest fabrication.** The coaching should be "document what you did" not "add this to justify a higher code."
3. **Flag addendum risks.** If a user asks about addending notes after the fact, the agent should explain the compliance implications (late addendums face increased audit scrutiny).
4. **Cite the rules.** Every documentation recommendation should reference the specific CMS guideline or E/M documentation requirement it's based on.

---

## 8. How It Fits the Product Narrative

Current narrative: *"Get it right the first time."*

With documentation coaching, the narrative deepens:

*"Get it right the first time — starting with the note."*

FirstClaim doesn't just fix claims at the end of the billing pipeline. It pushes improvement upstream to where the data originates. The claim is only as good as the documentation. FirstClaim makes the documentation better, which makes the claim better, which makes the revenue better.

This transforms FirstClaim from a **billing tool** into a **revenue cycle tool**. The TAM expands from "people who code claims" to "everyone involved in getting paid for healthcare."

---

## 9. Success Metrics

| Metric | Target | How to measure |
|---|---|---|
| Gap detection rate | Flags documentation gaps in >50% of sessions | Count sessions with at least one doc gap finding |
| User engagement with gaps | >30% of users ask a follow-up question about a doc gap | Track chat messages that reference documentation findings |
| Revenue impact (self-reported) | Users report coding improvement within 30 days | Post-session survey or in-app prompt |
| Provider reach | >20% of sessions result in a shared/exported doc coaching output | Track exports and shares of gap analysis |

---

## 10. Open Questions

1. **Should gap analysis run automatically or be opt-in?** Automatic is better for discovery (users see the value without asking), but some billers may find it noisy if they can't control the provider's documentation.

2. **How do we handle specialties?** E/M documentation requirements differ for psychiatry (time-based), surgical specialties (procedure-focused), and primary care (MDM-focused). The agent needs specialty-aware coaching.

3. **Revenue estimation accuracy.** Showing "$50/visit" is powerful but risky if the numbers are wrong. Should we show ranges, or just qualitative framing ("this visit could support a higher E/M level")?

4. **Addendum workflow.** Users will ask "can I fix this note and rebill?" How aggressive should the agent be about compliance warnings vs. just helping?
