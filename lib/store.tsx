"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type {
  AppState,
  AnalysisStage,
  ClaimData,
  ChatMessage,
  LeftPanelView,
  NoteHighlight,
} from "./types";

interface StoreState {
  appState: AppState;
  analysisStage: AnalysisStage;
  analysisToolActivity: { tool: string; query: string; result?: string } | null;
  clinicalNotes: string;
  claim: ClaimData | null;
  previousClaim: ClaimData | null;
  messages: ChatMessage[];
  leftPanelView: LeftPanelView;
  selectedHighlight: NoteHighlight | null;
  noteHighlights: NoteHighlight[];
  sessionId: string | null;
  pendingFixMessage: string | null;
}

type Action =
  | { type: "SET_APP_STATE"; state: AppState }
  | { type: "SET_ANALYSIS_STAGE"; stage: AnalysisStage }
  | { type: "SET_CLINICAL_NOTES"; notes: string }
  | { type: "SET_CLAIM"; claim: ClaimData }
  | { type: "UPDATE_RISK_SCORE"; score: number }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "UPDATE_MESSAGE"; id: string; updates: Partial<ChatMessage> }
  | { type: "REMOVE_MESSAGE"; id: string }
  | { type: "SET_LEFT_PANEL_VIEW"; view: LeftPanelView }
  | { type: "SET_SELECTED_HIGHLIGHT"; highlight: NoteHighlight | null }
  | { type: "SET_SESSION_ID"; sessionId: string }
  | { type: "SET_NOTE_HIGHLIGHTS"; highlights: NoteHighlight[] }
  | { type: "SET_ANALYSIS_TOOL_ACTIVITY"; tool: string; query: string }
  | { type: "SET_ANALYSIS_TOOL_RESULT"; result: string }
  | { type: "CLEAR_ANALYSIS_TOOL_ACTIVITY" }
  | {
      type: "RESTORE_SESSION";
      sessionId: string;
      clinicalNotes: string;
      claim: ClaimData;
      highlights: NoteHighlight[];
      messages: ChatMessage[];
    }
  | { type: "SET_PENDING_FIX_MESSAGE"; message: string }
  | { type: "CLEAR_PENDING_FIX_MESSAGE" }
  | { type: "CLEAR_PREVIOUS_CLAIM" }
  | { type: "COMPLETE_ALL_TOOL_ACTIVITY" }
  | { type: "RESET" };

const initialState: StoreState = {
  appState: "input",
  analysisStage: 1,
  analysisToolActivity: null,
  clinicalNotes: "",
  claim: null,
  previousClaim: null,
  messages: [],
  leftPanelView: "claim",
  selectedHighlight: null,
  noteHighlights: [],
  sessionId: null,
  pendingFixMessage: null,
};

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "SET_APP_STATE":
      return { ...state, appState: action.state };
    case "SET_ANALYSIS_STAGE":
      return { ...state, analysisStage: action.stage };
    case "SET_CLINICAL_NOTES":
      return { ...state, clinicalNotes: action.notes };
    case "SET_CLAIM":
      return {
        ...state,
        previousClaim: state.previousClaim ?? state.claim,
        claim: action.claim,
      };
    case "UPDATE_RISK_SCORE":
      return state.claim
        ? { ...state, claim: { ...state.claim, riskScore: action.score } }
        : state;
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, ...action.updates } : m
        ),
      };
    case "REMOVE_MESSAGE":
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.id),
      };
    case "SET_LEFT_PANEL_VIEW":
      return { ...state, leftPanelView: action.view, selectedHighlight: null };
    case "SET_SELECTED_HIGHLIGHT":
      return { ...state, selectedHighlight: action.highlight };
    case "SET_NOTE_HIGHLIGHTS":
      return { ...state, noteHighlights: action.highlights };
    case "SET_SESSION_ID":
      return { ...state, sessionId: action.sessionId };
    case "SET_ANALYSIS_TOOL_ACTIVITY":
      return { ...state, analysisToolActivity: { tool: action.tool, query: action.query } };
    case "SET_ANALYSIS_TOOL_RESULT":
      return state.analysisToolActivity
        ? { ...state, analysisToolActivity: { ...state.analysisToolActivity, result: action.result } }
        : state;
    case "CLEAR_ANALYSIS_TOOL_ACTIVITY":
      return { ...state, analysisToolActivity: null };
    case "RESTORE_SESSION":
      return {
        ...initialState,
        appState: "conversation",
        analysisStage: 5,
        sessionId: action.sessionId,
        clinicalNotes: action.clinicalNotes,
        claim: action.claim,
        noteHighlights: action.highlights,
        messages: action.messages,
      };
    case "SET_PENDING_FIX_MESSAGE":
      return { ...state, pendingFixMessage: action.message };
    case "CLEAR_PENDING_FIX_MESSAGE":
      return { ...state, pendingFixMessage: null };
    case "CLEAR_PREVIOUS_CLAIM":
      return { ...state, previousClaim: null };
    case "COMPLETE_ALL_TOOL_ACTIVITY":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.toolActivity?.status === "searching"
            ? { ...m, toolActivity: { ...m.toolActivity, status: "complete" as const } }
            : m
        ),
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const StoreContext = createContext<StoreState>(initialState);
const DispatchContext = createContext<Dispatch<Action>>(() => {});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext value={state}>
      <DispatchContext value={dispatch}>{children}</DispatchContext>
    </StoreContext>
  );
}

export function useStore() {
  return useContext(StoreContext);
}

export function useDispatch() {
  return useContext(DispatchContext);
}
