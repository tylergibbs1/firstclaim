"use client";

import { useEffect, useState } from "react";

interface RiskScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  revenueAtRisk?: number;
}

function getRiskLevel(score: number) {
  if (score <= 25) return { label: "Low Risk", color: "success" } as const;
  if (score <= 50) return { label: "Medium Risk", color: "warning" } as const;
  return { label: "High Risk", color: "destructive" } as const;
}

const colorMap = {
  success: {
    bg: "bg-success/15 ring-success/25",
    text: "text-success",
    label: "text-success",
  },
  warning: {
    bg: "bg-warning/15 ring-warning/25",
    text: "text-warning",
    label: "text-warning",
  },
  destructive: {
    bg: "bg-destructive/15 ring-destructive/25",
    text: "text-destructive",
    label: "text-destructive",
  },
};

export function RiskScore({ score, size = "md", revenueAtRisk }: RiskScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const { label, color } = getRiskLevel(score);
  const colors = colorMap[color];

  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [score]);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs ring-1",
    md: "h-11 w-11 text-sm ring-2",
    lg: "h-14 w-14 text-base ring-2",
  };

  return (
    <div className="flex items-center gap-3" aria-label={`Risk score: ${score}, ${label}`}>
      <div
        aria-hidden="true"
        className={`flex items-center justify-center rounded-xl font-bold tabular-nums transition-colors duration-500 ${colors.bg} ${colors.text} ${sizeClasses[size]}`}
      >
        {displayScore}
      </div>
      <div className="flex flex-col">
        {revenueAtRisk != null ? (
          <>
            <span className={`text-sm font-semibold ${revenueAtRisk > 0 ? colors.label : "text-success"}`}>
              ${Math.round(revenueAtRisk).toLocaleString("en-US")} at risk
            </span>
            <span className="text-[11px] text-muted-foreground">
              Score: {score}/100
            </span>
          </>
        ) : (
          <>
            <span className={`text-sm font-semibold ${colors.label}`}>
              {label}
            </span>
            <span className="text-[11px] text-muted-foreground">Risk Score</span>
          </>
        )}
      </div>
    </div>
  );
}
