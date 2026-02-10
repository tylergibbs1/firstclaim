"use client";

import { useStore, useDispatch } from "@/lib/store";
import { ClaimHeader } from "./claim-header";
import { ClaimTable } from "./claim-table";
import { FindingsSection } from "./findings-section";
import { ActionBar } from "./action-bar";
import { NotesView } from "./notes-view";
import type { LeftPanelView } from "@/lib/types";

const TABS: { key: LeftPanelView; label: string }[] = [
  { key: "claim", label: "Claim" },
  { key: "notes", label: "Notes" },
];

export function ClaimWorkspace() {
  const { claim, leftPanelView } = useStore();
  const dispatch = useDispatch();

  if (!claim) return null;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <ClaimHeader />
        <div className="border-b border-border/40 bg-card/60 px-5 py-2">
          <div
            className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-0.5 w-fit"
            role="tablist"
            aria-label="Left panel view"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={leftPanelView === tab.key}
                onClick={() =>
                  dispatch({ type: "SET_LEFT_PANEL_VIEW", view: tab.key })
                }
                className={`rounded-lg px-3.5 py-1 text-[11px] font-medium transition-all duration-200 ${
                  leftPanelView === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {leftPanelView === "claim" ? (
          <>
            <ClaimTable />
            <FindingsSection />
          </>
        ) : (
          <NotesView />
        )}
      </div>
      <ActionBar />
    </div>
  );
}
