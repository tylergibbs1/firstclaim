"use client";

import { useState, useCallback } from "react";
import { useClaim, useApp } from "@/lib/store";
import { ClaimHeader } from "./claim-header";
import { ClaimTable } from "./claim-table";
import { FindingsSection } from "./findings-section";
import { ActionBar } from "./action-bar";
import { NotesView } from "./notes-view";

export function ClaimWorkspace() {
  const { claim } = useClaim();
  const { leftPanelView } = useApp();
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 0);
  }, []);

  if (!claim) return null;

  return (
    <div className="relative flex h-full flex-col">
      <div className={`shrink-0 transition-shadow duration-200 ${scrolled ? "shadow-sm" : ""}`}>
        <ClaimHeader />
      </div>
      <div className="relative flex-1 min-h-0">
        <div
          className={`absolute inset-0 overflow-y-auto ${leftPanelView !== "claim" ? "hidden" : ""}`}
          onScroll={handleScroll}
        >
          <ClaimTable />
          <FindingsSection />
        </div>
        <div
          className={`absolute inset-0 overflow-y-auto ${leftPanelView !== "notes" ? "hidden" : ""}`}
          onScroll={handleScroll}
        >
          <NotesView />
        </div>
      </div>
      <ActionBar />
    </div>
  );
}
