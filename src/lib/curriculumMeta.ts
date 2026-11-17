import { CURRICULUM_PHASES } from "@/lib/constants";

export const PHASE_VOLUME_BY_ID: Record<number, { problems: string; tag: string }> = {
  1: { problems: "50 Problems", tag: "Branching & Booleans" },
  2: { problems: "30 Problems", tag: "Loops & Patterns" },
  3: { problems: "40 Problems", tag: "Stack & Recursion" },
  4: { problems: "50 Problems", tag: "Arrays & Two Pointers" },
  5: { problems: "40 Problems", tag: "Strings & Parsing" },
  6: { problems: "120+ Problems", tag: "OA Placement Logic" },
};

export const CURRICULUM_PHASE_SUMMARIES = CURRICULUM_PHASES.map((phase) => ({
  ...phase,
  problems: PHASE_VOLUME_BY_ID[phase.id]?.problems ?? "40+ Problems",
  tag: PHASE_VOLUME_BY_ID[phase.id]?.tag ?? "Logic Practice",
}));
