"use client";

import { useStore } from "@/lib/store";
import { ClaimHeader } from "./claim-header";
import { ClaimTable } from "./claim-table";
import { FindingsSection } from "./findings-section";
import { ActionBar } from "./action-bar";
import { NotesView } from "./notes-view";

export function ClaimWorkspace() {
  const { claim, leftPanelView } = useStore();

  if (!claim) return null;

  return (
    <div className="relative flex h-full flex-col">
      <div className="shrink-0">
        <ClaimHeader />
      </div>
      <div className="relative flex-1 min-h-0">
        {leftPanelView === "claim" ? (
          <div className="absolute inset-0 overflow-y-auto">
            <ClaimTable />
            <FindingsSection />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto">
            <NotesView />
          </div>
        )}
      </div>
      <ActionBar />
    </div>
  );
}
