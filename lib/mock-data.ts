import type { ClaimData, ChatMessage, DemoScenario, NoteHighlight } from "./types";

export const DEMO_NOTES: Record<DemoScenario, string> = {
  a: `SUBJECTIVE:
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

  b: `SUBJECTIVE:
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

  c: `SUBJECTIVE:
Patient is a 30-year-old male presenting with right knee pain following a basketball injury 3 days ago. Pain 6/10, worse with weight bearing. Mild swelling noted. No locking or giving way. No prior knee injuries.

OBJECTIVE:
Right knee: moderate effusion, positive McMurray test medial, stable to varus/valgus stress. ROM 0-120 degrees (limited by pain). No erythema or warmth.
Screening mammography ordered per protocol.

ASSESSMENT:
1. Internal derangement, right knee - possible medial meniscus tear
2. Right knee effusion
3. Screening mammography (per health maintenance protocol)

PLAN:
1. Right knee X-ray, 3 views
2. Knee joint injection - triamcinolone 40mg + lidocaine
3. Knee brace, activity modification
4. MRI if not improved in 2 weeks
5. Screening mammography scheduled`,
};

export const DEMO_HIGHLIGHTS: Record<DemoScenario, NoteHighlight[]> = {
  a: [
    {
      id: "ha1",
      original_text: "worsening lower back pain radiating to the left leg",
      code: "M54.31",
      type: "icd10",
      confidence: 0.95,
      notes: "Lumbar radiculopathy, left side. The presentation of lower back pain with radiation to the left leg and positive straight leg raise strongly supports this code.",
      alternatives: [
        { code: "M54.5", description: "Low back pain (non-specific, less specific)" },
        { code: "M54.41", description: "Lumbago with sciatica, left side" },
      ],
    },
    {
      id: "ha2",
      original_text: "type 2 diabetes",
      code: "E11.9",
      type: "icd10",
      confidence: 0.92,
      notes: "Type 2 diabetes mellitus without complications. Patient is on metformin with controlled status noted in the assessment.",
      alternatives: [
        { code: "E11.65", description: "Type 2 diabetes with hyperglycemia" },
      ],
    },
    {
      id: "ha3",
      original_text: "hypertension",
      code: "I10",
      type: "icd10",
      confidence: 0.97,
      notes: "Essential hypertension. BP 138/82 is mildly elevated, consistent with managed hypertension on lisinopril.",
      alternatives: [
        { code: "I11.9", description: "Hypertensive heart disease without heart failure" },
      ],
    },
    {
      id: "ha4",
      original_text: "Lumbar spine X-ray, 2 views",
      code: "72070",
      type: "cpt",
      confidence: 0.98,
      notes: "Radiologic examination of the lumbar spine, 2 views. Directly matches the documented plan for imaging workup of radiculopathy.",
      alternatives: [
        { code: "72080", description: "Lumbar spine X-ray, complete (min 4 views)" },
      ],
    },
    {
      id: "ha5",
      original_text: "Positive straight leg raise on left at 45 degrees",
      code: "M54.31",
      type: "icd10",
      confidence: 0.95,
      notes: "Supporting clinical finding for lumbar radiculopathy diagnosis. Positive SLR is a key physical exam finding that validates the M54.31 code.",
      alternatives: [],
    },
  ],
  b: [
    {
      id: "hb1",
      original_text: "8mm irregularly pigmented lesion on upper back, asymmetric borders",
      code: "D48.5",
      type: "icd10",
      confidence: 0.88,
      notes: "Neoplasm of uncertain behavior of skin. Irregular pigmentation and asymmetric borders are suspicious for melanoma, warranting biopsy before definitive classification.",
      alternatives: [
        { code: "D22.5", description: "Melanocytic nevi of trunk" },
        { code: "C43.59", description: "Malignant melanoma of other part of trunk" },
      ],
    },
    {
      id: "hb2",
      original_text: "4 additional suspicious pigmented lesions on trunk requiring biopsy",
      code: "D48.5",
      type: "icd10",
      confidence: 0.85,
      notes: "Same uncertain behavior classification applied to the additional trunk lesions pending pathology results.",
      alternatives: [
        { code: "D22.5", description: "Melanocytic nevi of trunk" },
      ],
    },
    {
      id: "hb3",
      original_text: "Multiple skin tags (6) on bilateral neck",
      code: "L91.8",
      type: "icd10",
      confidence: 0.94,
      notes: "Other hypertrophic disorders of the skin. Skin tags (acrochordons) are classified under this code.",
      alternatives: [
        { code: "L91.9", description: "Hypertrophic disorder of skin, unspecified" },
      ],
    },
    {
      id: "hb4",
      original_text: "Shave biopsy of upper back lesion",
      code: "11102",
      type: "cpt",
      confidence: 0.93,
      notes: "Tangential biopsy of skin, single lesion. Shave biopsy maps to tangential biopsy CPT code for the primary suspicious lesion.",
      alternatives: [
        { code: "11104", description: "Punch biopsy of skin, single lesion" },
      ],
    },
    {
      id: "hb5",
      original_text: "Tangential biopsy of 4 additional trunk lesions",
      code: "11103",
      type: "cpt",
      confidence: 0.90,
      notes: "Tangential biopsy, each additional lesion. Add-on code for the 4 additional biopsies (auto-corrected to 3 units per MUE limit).",
      alternatives: [
        { code: "11105", description: "Punch biopsy, each additional lesion" },
      ],
    },
    {
      id: "hb6",
      original_text: "Skin tag removal x6, neck",
      code: "11200",
      type: "cpt",
      confidence: 0.96,
      notes: "Removal of skin tags, up to and including 15 lesions. Single code covers all 6 skin tags.",
      alternatives: [],
    },
  ],
  c: [
    {
      id: "hc1",
      original_text: "right knee pain following a basketball injury",
      code: "M23.21",
      type: "icd10",
      confidence: 0.82,
      notes: "Derangement of anterior horn of medial meniscus. Positive McMurray test and mechanism of injury support meniscal pathology.",
      alternatives: [
        { code: "S83.211A", description: "Bucket-handle tear of medial meniscus, right knee, initial encounter" },
        { code: "M23.20", description: "Derangement of unspecified meniscus" },
      ],
    },
    {
      id: "hc2",
      original_text: "moderate effusion, positive McMurray test medial",
      code: "M25.461",
      type: "icd10",
      confidence: 0.91,
      notes: "Effusion, right knee. Moderate effusion is a distinct billable finding supporting the joint injection procedure.",
      alternatives: [
        { code: "M25.469", description: "Effusion, unspecified knee" },
      ],
    },
    {
      id: "hc3",
      original_text: "Right knee X-ray, 3 views",
      code: "73562",
      type: "cpt",
      confidence: 0.97,
      notes: "Radiologic exam of the knee, 3 views. Directly documented in the plan for evaluation of suspected meniscus tear.",
      alternatives: [
        { code: "73560", description: "Knee X-ray, 1 or 2 views" },
      ],
    },
    {
      id: "hc4",
      original_text: "Knee joint injection - triamcinolone 40mg + lidocaine",
      code: "20610",
      type: "cpt",
      confidence: 0.94,
      notes: "Arthrocentesis/injection of a major joint. Knee is classified as a major joint. Includes both aspiration and injection.",
      alternatives: [
        { code: "20611", description: "Arthrocentesis/injection, major joint with ultrasound guidance" },
      ],
    },
    {
      id: "hc5",
      original_text: "Screening mammography scheduled",
      code: "77067",
      type: "cpt",
      confidence: 0.35,
      notes: "Screening mammography, bilateral. WARNING: This code is flagged as inappropriate for a 30-year-old male patient. This will almost certainly be denied.",
      alternatives: [
        { code: "REMOVE", description: "Remove this line item from the claim" },
      ],
    },
  ],
};

export const DEMO_CLAIMS: Record<DemoScenario, ClaimData> = {
  a: {
    claimId: "FC-20240615-001",
    dateOfService: "2024-06-15",
    patient: { sex: "M", age: 65 },
    lineItems: [
      {
        lineNumber: 1,
        cpt: "99214",
        description: "Office visit, established patient, moderate complexity",
        modifiers: [],
        icd10: ["M54.31", "E11.9", "I10"],
        units: 1,
        codingRationale:
          "Moderate complexity E/M: multiple chronic conditions being managed, new symptom with radiculopathy workup, prescription management. 3 diagnoses addressed.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
      {
        lineNumber: 2,
        cpt: "72070",
        description: "Radiologic exam, lumbar spine, 2 views",
        modifiers: [],
        icd10: ["M54.31"],
        units: 1,
        codingRationale:
          "2-view lumbar spine X-ray ordered for evaluation of radiculopathy. Linked to primary diagnosis M54.31.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
    ],
    riskScore: 12,
    findings: [],
  },

  b: {
    claimId: "FC-20240615-002",
    dateOfService: "2024-06-15",
    patient: { sex: "F", age: 45 },
    lineItems: [
      {
        lineNumber: 1,
        cpt: "99213",
        description: "Office visit, established patient, low complexity",
        modifiers: ["25"],
        icd10: ["D48.5", "L91.8"],
        units: 1,
        codingRationale:
          "Low complexity E/M with modifier 25 for significant, separately identifiable service on same day as procedures.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
      {
        lineNumber: 2,
        cpt: "11102",
        description: "Tangential biopsy of skin, single lesion",
        modifiers: [],
        icd10: ["D48.5"],
        units: 1,
        codingRationale:
          "Primary shave biopsy for the suspicious pigmented lesion on upper back.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
      {
        lineNumber: 3,
        cpt: "11103",
        description: "Tangential biopsy of skin, each additional lesion",
        modifiers: [],
        icd10: ["D48.5"],
        units: 3,
        codingRationale:
          "Add-on code for 4 additional trunk lesion biopsies. Auto-corrected from 4 to 3 units per MUE limit.",
        sources: [
          "https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits",
        ],
      },
      {
        lineNumber: 4,
        cpt: "11200",
        description: "Removal of skin tags, up to and including 15 lesions",
        modifiers: [],
        icd10: ["L91.8"],
        units: 1,
        codingRationale:
          "Skin tag removal for 6 skin tags on neck. Single unit covers up to 15 lesions.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
    ],
    riskScore: 45,
    findings: [
      {
        id: "f1",
        severity: "warning",
        title: "MUE limit exceeded",
        description:
          "CPT 11103 has a Medically Unlikely Edit (MUE) limit of 3 units per date of service. Original 4 units auto-corrected to 3.",
        recommendation:
          "If medical necessity supports 4 units, append modifier with documentation.",
        sourceUrl:
          "https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits/mue",
        relatedLineNumber: 3,
        resolved: false,
      },
      {
        id: "f2",
        severity: "warning",
        title: "PTP edit: 11200 and 11102",
        description:
          "CMS NCCI Procedure-to-Procedure edit identifies potential bundling conflict between skin tag removal (11200) and biopsy (11102).",
        recommendation:
          "If procedures were performed at distinct anatomical sites, add modifier 59 (Distinct Procedural Service) to 11200.",
        sourceUrl:
          "https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits",
        relatedLineNumber: 4,
        resolved: false,
      },
    ],
  },

  c: {
    claimId: "FC-20240615-003",
    dateOfService: "2024-06-15",
    patient: { sex: "M", age: 30 },
    lineItems: [
      {
        lineNumber: 1,
        cpt: "99214",
        description: "Office visit, established patient, moderate complexity",
        modifiers: [],
        icd10: ["M23.21", "M25.461"],
        units: 1,
        codingRationale:
          "Moderate complexity E/M for knee evaluation with effusion workup and injection decision-making.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
      {
        lineNumber: 2,
        cpt: "73562",
        description: "Radiologic exam, knee, 3 views",
        modifiers: [],
        icd10: ["M23.21"],
        units: 1,
        codingRationale:
          "3-view knee X-ray for evaluation of suspected meniscus tear.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
      {
        lineNumber: 3,
        cpt: "20610",
        description: "Arthrocentesis/injection, major joint",
        modifiers: [],
        icd10: ["M25.461"],
        units: 1,
        codingRationale:
          "Knee joint injection with triamcinolone and lidocaine for effusion and pain management.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
      {
        lineNumber: 4,
        cpt: "77067",
        description: "Screening mammography, bilateral",
        modifiers: [],
        icd10: ["Z12.31"],
        units: 1,
        codingRationale:
          "Screening mammography per health maintenance protocol noted in the plan.",
        sources: ["https://www.cms.gov/medicare/payment/fee-schedules"],
      },
    ],
    riskScore: 75,
    findings: [
      {
        id: "f1",
        severity: "critical",
        title: "Age/sex mismatch: Screening mammography",
        description:
          "CPT 77067 (screening mammography) with ICD-10 Z12.31 is designated for female patients. Patient is a 30-year-old male. This will almost certainly be denied.",
        recommendation:
          "Remove screening mammography from the claim. If there is a clinical reason for breast imaging in a male patient, use diagnostic codes instead of screening codes.",
        relatedLineNumber: 4,
        resolved: false,
      },
      {
        id: "f2",
        severity: "warning",
        title: "PTP edit: 99214 and 20610",
        description:
          "CMS NCCI PTP edit identifies bundling conflict between E/M service (99214) and joint injection (20610) on the same date of service.",
        recommendation:
          "Add modifier 25 to the E/M code (99214) to indicate a significant, separately identifiable evaluation and management service.",
        sourceUrl:
          "https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits",
        relatedLineNumber: 1,
        resolved: false,
      },
    ],
  },
};

export const DEMO_INITIAL_MESSAGES: Record<DemoScenario, ChatMessage[]> = {
  a: [
    {
      id: "m1",
      role: "agent",
      content:
        "Your claim looks clean. Two line items coded from the clinical notes — a moderate complexity E/M visit (99214) and a 2-view lumbar spine X-ray (72070). Risk score is 12 (low) with $0 revenue at risk. I checked for PTP edit conflicts between these procedures and found none. All ICD-10 codes validated against the database.\n\nThe primary diagnosis M54.31 (lumbar radiculopathy, left side) is the most specific code matching the clinical documentation. I linked the chronic conditions (E11.9, I10) to the E/M visit since they were actively managed.\n\nAnything you'd like to review or change?",
      timestamp: new Date(),
      suggestedPrompts: [
        "Why 99214 and not 99213?",
        "What are the biggest risks?",
        "Could I use M54.5 instead of M54.31?",
        "Export the claim",
      ],
    },
  ],
  b: [
    {
      id: "m1",
      role: "agent",
      content:
        "I've built the claim with 4 line items. Risk score is 45 (medium) with **$267 revenue at risk** from 2 unresolved findings.\n\n**Finding 1 — MUE Limit ($189):** CPT 11103 (additional tangential biopsies) has a Medically Unlikely Edit limit of 3 units per date of service. The clinical notes describe 4 additional lesions, but I've auto-corrected the units to 3. If you have documentation supporting medical necessity for 4 units, we can override this.\n\n**Finding 2 — PTP Edit ($78):** There's a potential bundling conflict between the skin tag removal (11200) and the biopsy (11102). If these were performed at distinct anatomical sites, modifier 59 would resolve this.\n\nWhat would you like to address first?",
      timestamp: new Date(),
      suggestedPrompts: [
        "The patient had 4 biopsies, why did you change the units?",
        "The skin tags were on a different site, add modifier 59",
        "Walk me through the findings",
        "Export the claim",
      ],
    },
  ],
  c: [
    {
      id: "m1",
      role: "agent",
      content:
        "I've built the claim but there are significant issues. Risk score is 75 (high) with **$281 revenue at risk** from 2 unresolved findings.\n\n**Critical — Age/Sex Mismatch ($150):** The clinical notes include a screening mammography order for a 30-year-old male patient. CPT 77067 with ICD-10 Z12.31 is designated for female patients. This will almost certainly be denied. I strongly recommend removing this line item.\n\n**Warning — PTP Edit ($131):** There's a bundling conflict between the E/M visit (99214) and the knee joint injection (20610). Adding modifier 25 to the E/M code would resolve this, indicating the evaluation was a significant, separately identifiable service.\n\nThe knee evaluation and X-ray are correctly coded. Let's address these findings.",
      timestamp: new Date(),
      suggestedPrompts: [
        "Remove the mammography",
        "Add modifier 25 to the office visit",
        "Why is the mammography flagged?",
        "What if I keep the mammography?",
      ],
    },
  ],
};
