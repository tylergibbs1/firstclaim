"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useApp, useDispatch } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { STAGE_LABELS } from "@/lib/types";
import { Clock, LogOut, Moon, Plus, Sun } from "lucide-react";
import { Logo } from "@/components/logo";

const SessionHistoryDrawer = dynamic(() =>
  import("@/components/session-history-drawer").then((m) => ({ default: m.SessionHistoryDrawer }))
);

export function TopBar() {
  const { appState, analysisStage } = useApp();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function handleNewClaim() {
    dispatch({ type: "RESET" });
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/60 bg-card/80 px-5 backdrop-blur-xl">
      <div className="flex items-center gap-5">
        <Logo text="FirstClaim" size="sm" animate={false} />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHistoryOpen(true)}
          aria-label="Session history"
          className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:text-foreground"
        >
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>

        {appState === "analyzing" && (
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1" aria-label={`Stage ${analysisStage} of 5`} role="progressbar" aria-valuenow={analysisStage} aria-valuemin={1} aria-valuemax={5}>
              {([1, 2, 3, 4, 5] as const).map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    s <= analysisStage
                      ? "scale-100 bg-primary"
                      : "scale-75 bg-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {STAGE_LABELS[analysisStage]}
            </span>
          </div>
        )}
      </div>

      <nav className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:text-foreground"
        >
          {dark ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
        </Button>

        {appState !== "input" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewClaim}
            aria-label="Start new claim"
            className="h-8 gap-1 rounded-xl px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New
          </Button>
        )}

        {user && (
          <div className="flex items-center gap-2 border-l border-border/40 pl-3">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              aria-label="Sign out"
              className="h-8 w-8 rounded-xl p-0 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </nav>

      <SessionHistoryDrawer open={historyOpen} onOpenChange={setHistoryOpen} />
    </header>
  );
}
