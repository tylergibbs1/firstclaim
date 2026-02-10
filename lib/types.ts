export type AppState = "input" | "analyzing" | "conversation";

export type AnalysisStage = 1 | 2 | 3 | 4 | 5;

export const STAGE_LABELS: Record<AnalysisStage, string> = {
  1: "Extracting diagnoses...",
  2: "Assigning codes...",
  3: "Building claim...",
  4: "Validating rules...",
  5: "Complete",
};

export type FindingSeverity = "critical" | "warning" | "info";

export interface Finding {
  id: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  recommendation?: string;
  sourceUrl?: string;
  relatedLineNumber?: number;
  resolved: boolean;
  resolvedReason?: string;
}

export interface ClaimLineItem {
  lineNumber: number;
  cpt: string;
  description: string;
  modifiers: string[];
  icd10: string[];
  units: number;
  codingRationale: string;
  sources: string[];
}

export interface PatientDemographics {
  dateOfBirth?: string;
  sex: "M" | "F";
  age?: number;
}

export interface ClaimData {
  claimId: string;
  dateOfService: string;
  patient: PatientDemographics;
  lineItems: ClaimLineItem[];
  riskScore: number;
  findings: Finding[];
}

export type MessageRole = "agent" | "user" | "system" | "tool";

export interface ToolActivity {
  tool: string;
  query: string;
  status: "searching" | "complete" | "error";
  result?: string;
}

export interface ClaimChange {
  description: string;
  oldValue?: string;
  newValue?: string;
  riskBefore?: number;
  riskAfter?: number;
  revenueBefore?: number;
  revenueAfter?: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolActivity?: ToolActivity;
  claimChange?: ClaimChange;
  suggestedPrompts?: string[];
}

export type LeftPanelView = "claim" | "notes";

export interface NoteHighlight {
  id: string;
  /** Exact substring from the clinical notes to highlight */
  original_text: string;
  /** The extracted code (ICD-10 or CPT) */
  code: string;
  /** "icd10" | "cpt" */
  type: "icd10" | "cpt";
  /** 0–1 confidence score */
  confidence: number;
  /** Explanation of why this code was chosen */
  notes: string;
  /** Alternative codes the user could consider */
  alternatives: { code: string; description: string }[];
}
