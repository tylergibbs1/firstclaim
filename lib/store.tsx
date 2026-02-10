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
  DemoScenario,
  LeftPanelView,
  NoteHighlight,
} from "./types";

interface StoreState {
  appState: AppState;
  analysisStage: AnalysisStage;
  clinicalNotes: string;
  claim: ClaimData | null;
  messages: ChatMessage[];
  demoScenario: DemoScenario | null;
  leftPanelView: LeftPanelView;
  selectedHighlight: NoteHighlight | null;
}

type Action =
  | { type: "SET_APP_STATE"; state: AppState }
  | { type: "SET_ANALYSIS_STAGE"; stage: AnalysisStage }
  | { type: "SET_CLINICAL_NOTES"; notes: string }
  | { type: "SET_CLAIM"; claim: ClaimData }
  | { type: "UPDATE_RISK_SCORE"; score: number }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_DEMO_SCENARIO"; scenario: DemoScenario }
  | { type: "SET_LEFT_PANEL_VIEW"; view: LeftPanelView }
  | { type: "SET_SELECTED_HIGHLIGHT"; highlight: NoteHighlight | null }
  | { type: "RESET" };

const initialState: StoreState = {
  appState: "input",
  analysisStage: 1,
  clinicalNotes: "",
  claim: null,
  messages: [],
  demoScenario: null,
  leftPanelView: "claim",
  selectedHighlight: null,
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
      return { ...state, claim: action.claim };
    case "UPDATE_RISK_SCORE":
      return state.claim
        ? { ...state, claim: { ...state.claim, riskScore: action.score } }
        : state;
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_DEMO_SCENARIO":
      return { ...state, demoScenario: action.scenario };
    case "SET_LEFT_PANEL_VIEW":
      return { ...state, leftPanelView: action.view, selectedHighlight: null };
    case "SET_SELECTED_HIGHLIGHT":
      return { ...state, selectedHighlight: action.highlight };
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
