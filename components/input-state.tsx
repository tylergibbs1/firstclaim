"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAnalysisStream } from "@/lib/use-analysis-stream";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const SAMPLE_NOTES: { title: string; subtitle: string; badge: string; badgeClass: string; notes: string }[] = [
  {
    title: "Routine Office Visit",
    subtitle: "Back pain, radiculopathy",
    badge: "Low Risk",
    badgeClass: "bg-success/10 text-success",
    notes: `SUBJECTIVE:
Patient is a 65-year-old male presenting with worsening lower back pain radiating to the left leg for 3 weeks. Pain rated 7/10. History of type 2 diabetes and hypertension. Currently on metformin and lisinopril.

OBJECTIVE:
BP 138/82. BMI 31.2. Lumbar spine tender to palpation L4-L5. Positive straight leg raise on left at 45 degrees. Decreased sensation left L5 dermatome. Reflexes 2+ bilateral.

ASSESSMENT:
1. Lumbar radiculopathy, left L5
2. Type 2 diabetes mellitus, controlled
3. Essential hypertension

PLAN:
1. Lumbar spine X-ray, 2 views
2. Refer to physical therapy
3. Prescribe gabapentin 300mg TID
4. Follow up in 4 weeks
5. Continue current medications`,
  },
  {
    title: "Dermatology Multi-Procedure",
    subtitle: "Skin lesions, 4 procedures",
    badge: "2 Findings",
    badgeClass: "bg-primary/10 text-primary",
    notes: `SUBJECTIVE:
Patient is a 45-year-old female presenting for evaluation of multiple skin lesions. She noticed a changing mole on her upper back and several skin tags on her neck that have been catching on clothing. No pain but the mole has increased in size over the past 2 months. No personal or family history of melanoma.

OBJECTIVE:
Skin exam reveals:
- 8mm irregularly pigmented lesion on upper back, asymmetric borders
- 4 additional suspicious pigmented lesions on trunk requiring biopsy
- Multiple skin tags (6) on bilateral neck

ASSESSMENT:
1. Suspicious pigmented lesion, upper back - rule out melanoma
2. Multiple suspicious pigmented lesions, trunk
3. Multiple skin tags, neck

PLAN:
1. Shave biopsy of upper back lesion
2. Tangential biopsy of 4 additional trunk lesions
3. Skin tag removal x6, neck
4. Pathology consultation
5. Follow up for results in 1 week`,
  },
  {
    title: "Knee Injury + Red Flag",
    subtitle: "Meniscus tear, critical + opportunity",
    badge: "Critical",
    badgeClass: "bg-destructive/10 text-destructive",
    notes: `SUBJECTIVE:
Patient is a 30-year-old male presenting with right knee pain following a basketball injury 3 days ago. Pain 6/10, worse with weight bearing. Mild swelling noted. No locking or giving way. No prior knee injuries. Also reports increasing fatigue over the past month. Has a history of hypertension and type 2 diabetes. Brought outside lab results from last week. Currently on lisinopril 10mg daily and metformin 500mg BID.

OBJECTIVE:
BP 148/92. BMI 32.1.
Right knee: moderate effusion, positive McMurray test medial, stable to varus/valgus stress. ROM 0-120 degrees (limited by pain). No erythema or warmth.
Outside labs reviewed: A1c 8.4% (up from 7.1% six months ago), LDL 162, Cr 1.1.
Screening mammography ordered per protocol.

ASSESSMENT:
1. Internal derangement, right knee - possible medial meniscus tear
2. Right knee effusion
3. Hypertension
4. Type 2 diabetes
5. Screening mammography (per health maintenance protocol)

PLAN:
1. Right knee X-ray, 3 views
2. Knee joint injection - triamcinolone 40mg + lidocaine
3. Knee brace, activity modification
4. MRI if not improved in 2 weeks
5. Increase lisinopril 10mg to 20mg daily for uncontrolled BP
6. Increase metformin 500mg to 1000mg BID, add GLP-1 referral for worsening A1c
7. Recheck A1c and lipid panel in 3 months
8. Screening mammography scheduled`,
  },
];

export function InputState() {
  const { clinicalNotes } = useApp();
  const { startAnalysis, isAnalyzing } = useAnalysisStream();
  const [notes, setNotes] = useState(clinicalNotes);

  function handleAnalyze() {
    if (!notes.trim()) return;
    startAnalysis(notes);
  }

  const wordCount = notes.length > 0
    ? notes.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-pretty">
            Get it right the first time.
          </h1>
          <p className="text-sm text-muted-foreground text-balance">
            Paste your notes. Get back a validated, submission-ready&nbsp;claim.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg shadow-primary/[0.03]">
          <label htmlFor="clinical-notes" className="sr-only">
            Clinical notes
          </label>
          <Textarea
            id="clinical-notes"
            name="clinical-notes"
            autoComplete="off"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your clinical or SOAP notes here…"
            className="min-h-[280px] max-h-[280px] resize-none border-0 bg-transparent px-6 py-5 text-[14.5px] leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-purple/30"
          />
          <div className="flex items-center justify-between border-t border-border/40 bg-muted/30 px-5 py-3">
            <span className="text-xs text-muted-foreground">
              {wordCount > 0
                ? `${wordCount} words`
                : "Supports SOAP notes, clinical summaries, and free-text documentation"}
            </span>
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={!notes.trim() || isAnalyzing}
              className="h-9 gap-2 rounded-xl px-5 text-sm font-medium shadow-sm"
            >
              Analyze Claim
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Try an example
          </p>
          <div className="grid grid-cols-3 gap-3">
            {SAMPLE_NOTES.map((sample) => (
              <button
                key={sample.title}
                onClick={() => setNotes(sample.notes)}
                className="flex flex-col items-start gap-1.5 rounded-xl border border-border/50 bg-card px-3.5 py-3 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${sample.badgeClass}`}>
                  {sample.badge}
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  {sample.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {sample.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
