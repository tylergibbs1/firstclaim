"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
} from "motion/react";
import { ArrowRight, AlertTriangle, ChevronRight } from "lucide-react";
import { Logo } from "@/components/logo";

/* ============================================================================
   ANIMATION — slow, gentle, Anthropic-style reveals
   ============================================================================ */

const ease = [0.16, 1, 0.3, 1] as const; // ease-out-quint

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

/* ============================================================================
   SECTION — scroll-triggered reveal
   ============================================================================ */

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial={prefersReduced ? "visible" : "hidden"}
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
    >
      {children}
    </motion.section>
  );
}

/* ============================================================================
   NAV — slim, serif links (editorial feel)
   ============================================================================ */

function Nav() {
  return (
    <motion.nav
      className="sticky top-0 z-50 border-b border-foreground/[0.06] bg-background/80 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease }}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-10">
        <Logo variant="horizontal" size="sm" animate={false} />
        <div className="flex items-center gap-8">
          <a
            href="#how-it-works"
            className="hidden text-[15px] text-foreground/60 transition-colors hover:text-foreground sm:block"
          >
            How it works
          </a>
          <a
            href="#capabilities"
            className="hidden text-[15px] text-foreground/60 transition-colors hover:text-foreground sm:block"
          >
            Capabilities
          </a>
          <a
            href="/home"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-[14px] text-background transition-opacity hover:opacity-90 active:scale-[0.97]"
          >
            Try it
            <ArrowRight className="size-3" />
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

/* ============================================================================
   HERO — asymmetric, typographic, Anthropic-inspired
   ============================================================================ */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.7], [0, 40]);
  const prefersReduced = useReducedMotion();

  return (
    <div ref={ref} className="relative pb-28 pt-24 sm:pb-36 sm:pt-32 lg:pb-44 lg:pt-40">
      <motion.div
        className="mx-auto max-w-[1200px] px-6 lg:px-10"
        style={prefersReduced ? {} : { opacity, y }}
      >
        <motion.div
          className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16"
          initial={prefersReduced ? "visible" : "hidden"}
          animate="visible"
          variants={stagger}
        >
          {/* Left — headline */}
          <motion.h1
            variants={reveal}
            className="max-w-[600px] text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.08] tracking-[-0.035em]"
            style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
          >
            Clinical notes in, validated claims out
          </motion.h1>

          {/* Right — supporting text, offset down */}
          <motion.div
            variants={reveal}
            className="flex flex-col justify-end lg:pb-2"
          >
            <p className="max-w-[420px] text-[1.125rem] leading-[1.5] text-foreground/60">
              An AI agent that reads clinical documentation, assigns
              codes against a 72,616-entry database, and validates every
              CMS rule. You get a submission-ready claim in around 30
              seconds.
            </p>

            <div className="mt-8 flex items-center gap-6">
              <a
                href="/home"
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] text-background transition-opacity hover:opacity-90 active:scale-[0.97]"
              >
                Try FirstClaim
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how-it-works"
                className="text-[15px] text-foreground/60 underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/40"
              >
                How it works
              </a>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ============================================================================
   CLAIM DEMO — contained stage, the visual centerpiece
   ============================================================================ */

function ClaimPreview() {
  return (
    <Section className="px-6 pb-28 sm:pb-36 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          variants={reveal}
          className="overflow-hidden rounded-2xl border border-foreground/[0.06] bg-card shadow-xl"
        >
          {/* Chrome bar */}
          <div className="flex items-center gap-3 border-b border-foreground/[0.06] bg-muted/30 px-5 py-2.5">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-foreground/10" />
              <div className="size-2.5 rounded-full bg-foreground/10" />
              <div className="size-2.5 rounded-full bg-foreground/10" />
            </div>
            <div className="flex-1 text-center">
              <span className="rounded-md bg-foreground/[0.04] px-8 py-0.5 text-[11px] text-foreground/40">
                firstclaim.app
              </span>
            </div>
          </div>

          {/* Workspace */}
          <div className="grid sm:grid-cols-[1.4fr_1fr]">
            {/* Left panel — claim table */}
            <div className="border-r border-foreground/[0.06] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-sm"
                    style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
                  >
                    FC-20260213-001
                  </span>
                  <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
                    42 risk
                  </span>
                </div>
                <span className="text-[11px] text-foreground/40">
                  $327.00 total
                </span>
              </div>

              {/* Line items */}
              <div className="mt-4 space-y-1.5">
                {[
                  { cpt: "99214", desc: "Office visit, est. patient", icd: "E11.65, I10", fee: "$148", warn: false },
                  { cpt: "11102", desc: "Tangential biopsy, skin", icd: "L82.1", fee: "$112", warn: true },
                  { cpt: "11103", desc: "Tangential bx, addl lesion", icd: "L82.1", fee: "$67", warn: false },
                ].map((l) => (
                  <div
                    key={l.cpt}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[11px] ${
                      l.warn ? "border-warning/25 bg-warning/[0.03]" : "border-foreground/[0.06]"
                    }`}
                  >
                    <span className={`w-px self-stretch rounded-full ${l.warn ? "bg-warning" : "bg-foreground/10"}`} />
                    <span className="w-12 shrink-0 font-mono text-foreground">{l.cpt}</span>
                    <span className="flex-1 text-foreground/50">{l.desc}</span>
                    <span className="hidden font-mono text-[10px] text-foreground/30 sm:block">{l.icd}</span>
                    <span className="w-12 text-right font-mono text-foreground">{l.fee}</span>
                  </div>
                ))}
              </div>

              {/* Finding card */}
              <div className="mt-3.5 rounded-lg border border-warning/25 bg-warning/[0.03] p-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3 text-warning" />
                  <span className="text-[11px] text-foreground">
                    PTP edit: 99214 + 11102
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-foreground/50">
                  NCCI bundling conflict. Modifier 25 required on E/M to
                  indicate separately identifiable service.
                </p>
                <button className="mt-2 inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline">
                  Fix this <ChevronRight className="size-2.5" />
                </button>
              </div>
            </div>

            {/* Right panel — chat */}
            <div className="flex flex-col p-5 sm:p-6">
              <span className="text-[11px] text-foreground/40">
                Conversation
              </span>

              <div className="mt-3 flex-1 space-y-2.5">
                <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed text-foreground">
                  99214 and 11102 have an NCCI conflict. Adding modifier 25 to
                  the E/M resolves this. Should I apply it?
                </div>
                <div className="ml-auto max-w-[85%] rounded-lg bg-primary p-2.5 text-[11px] leading-relaxed text-primary-foreground">
                  Yes, add modifier 25
                </div>
                <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed text-foreground">
                  <span className="font-medium">Done.</span> Added 25 to 99214.
                  Finding resolved. Risk: 42 → 18.
                </div>
              </div>

              <div className="mt-3 flex gap-1.5">
                <div className="flex-1 rounded-lg border border-foreground/[0.06] bg-background px-2.5 py-1.5 text-[11px] text-foreground/40">
                  Ask about the claim...
                </div>
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ArrowRight className="size-3" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ============================================================================
   CAPABILITIES — Anthropic-style row list with thin dividers
   ============================================================================ */

const capabilities = [
  {
    title: "Deterministic compliance",
    desc: "Runs PTP edits, MUE limits, age/sex rules, modifier requirements, and ICD-10 specificity checks on every claim. Citations to CMS sources, not confidence scores.",
    tag: "Validation",
    color: "text-purple" as const,
  },
  {
    title: "Codes looked up, not generated",
    desc: "72,616 ICD-10 codes verified against a real Postgres database. Every code checked for billability, specificity, and demographic rules before it reaches the claim.",
    tag: "Database",
    color: "text-teal" as const,
  },
  {
    title: "Conversational refinement",
    desc: "Challenge a finding, add a procedure, swap a code. The claim updates, re-validates, and shows you the delta. It pushes back when you\u2019re wrong.",
    tag: "Conversation",
    color: "text-primary" as const,
  },
  {
    title: "Revenue impact, quantified",
    desc: "Risk score 0\u2013100 tied to Medicare fee schedule rates. You see the dollar amount at stake for each unresolved finding.",
    tag: "Revenue",
    color: "text-teal" as const,
  },
  {
    title: "Documentation gap analysis",
    desc: "When clinical complexity suggests higher-level billing, FirstClaim identifies the gap between work performed and what was documented. Concrete templates, no fabrication.",
    tag: "Optimization",
    color: "text-purple" as const,
  },
  {
    title: "Honest guardrails",
    desc: "Refuses to write clinical language or help backdate documentation. Warns about audit risk. The agent has opinions and will share them.",
    tag: "Safety",
    color: "text-primary" as const,
  },
];

function Capabilities() {
  return (
    <Section id="capabilities" className="py-28 sm:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <motion.div
          variants={reveal}
          className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20"
        >
          {/* Left — section heading */}
          <div>
            <h2
              className="max-w-[320px] text-[clamp(1.25rem,2.5vw,1.5rem)] leading-[1.3] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
            >
              A purpose-built agent that treats medical billing as a
              systematic discipline, not a language task
            </h2>
          </div>

          {/* Right — list rows */}
          <div>
            {capabilities.map((c, i) => (
              <motion.div
                key={c.title}
                variants={reveal}
                className={`flex items-start justify-between gap-8 py-6 ${
                  i < capabilities.length - 1 ? "border-b border-foreground/[0.08]" : ""
                }`}
              >
                <div className="flex-1">
                  <h3
                    className="text-[1rem] tracking-[-0.01em] text-foreground"
                    style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
                  >
                    {c.title}
                  </h3>
                  <p className="mt-1.5 max-w-[480px] text-[14px] leading-[1.6] text-foreground/50">
                    {c.desc}
                  </p>
                </div>
                <span className={`hidden shrink-0 text-[13px] opacity-50 sm:block ${c.color}`}>
                  {c.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ============================================================================
   HOW IT WORKS — pipeline, compact
   ============================================================================ */

const stageColors = ["text-primary", "text-teal", "text-purple", "text-teal", "text-primary"];

const stages = [
  {
    num: "01",
    title: "Read",
    desc: "Extracts billable diagnoses and procedures from SOAP notes, clinical summaries, or free text.",
  },
  {
    num: "02",
    title: "Code",
    desc: "Verifies ICD-10 and CPT codes against the full database. Calculates E/M levels from documented MDM and time.",
  },
  {
    num: "03",
    title: "Build",
    desc: "Assembles a structured claim with line items, modifiers, units, and linked diagnoses.",
  },
  {
    num: "04",
    title: "Validate",
    desc: "Checks PTP edits, MUE limits, age/sex rules, and modifier requirements. Every claim, automatically.",
  },
  {
    num: "05",
    title: "Refine",
    desc: "You challenge a finding or swap a code. The claim updates and re-validates in real time.",
  },
];

function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      className="border-t border-foreground/[0.06] py-28 sm:py-36"
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <motion.div variants={reveal} className="max-w-[400px]">
          <h2
            className="text-[clamp(1.25rem,2.5vw,1.5rem)] leading-[1.3] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
          >
            Five stages, around thirty seconds
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-foreground/50">
            The pipeline runs autonomously. You get a validated claim
            and a conversation to refine it.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-px sm:grid-cols-5">
          {stages.map((s, i) => (
            <motion.div
              key={s.num}
              variants={reveal}
              className="border-t border-foreground/[0.08] pt-5 pb-8 sm:pr-6"
            >
              <span className={`text-[12px] opacity-40 ${stageColors[i]}`}>{s.num}</span>
              <h3
                className="mt-3 text-[1rem] tracking-[-0.01em] text-foreground"
                style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
              >
                {s.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.6] text-foreground/50">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ============================================================================
   CLOSING CTA
   ============================================================================ */

function ClosingCTA() {
  return (
    <Section className="border-t border-foreground/[0.06] py-28 sm:py-36">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <motion.div variants={reveal} className="max-w-[520px]">
          <h2
            className="text-[clamp(1.5rem,3.5vw,2.5rem)] leading-[1.12] tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
          >
            Get it right the first time
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-[1.6] text-foreground/50">
            No enterprise contract. No months of setup. Just paste
            clinical notes and get a validated, submission-ready claim.
          </p>
          <div className="mt-8">
            <a
              href="/home"
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] text-background transition-opacity hover:opacity-90 active:scale-[0.97]"
            >
              Try FirstClaim
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ============================================================================
   FOOTER
   ============================================================================ */

function Footer() {
  return (
    <footer className="border-t border-foreground/[0.06] py-8">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 lg:px-10">
        <Logo variant="horizontal" size="sm" animate={false} />
        <p className="text-[13px] text-foreground/30">
          Built for the Anthropic Hackathon, Feb 2026
        </p>
      </div>
    </footer>
  );
}

/* ============================================================================
   PAGE
   ============================================================================ */

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <ClaimPreview />
        <HowItWorks />
        <Capabilities />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
