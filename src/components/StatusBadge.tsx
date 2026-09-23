import clsx from "clsx";
import type { ReleaseNoteStatus, RequirementPriority } from "../api/types.js";

const RELEASE_NOTE_STYLES: Record<ReleaseNoteStatus, string> = {
  DRAFT: "bg-[var(--amber)]/15 text-[var(--amber)] border-[var(--amber)]/35",
  APPROVED: "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/35",
  SENT: "bg-[var(--green)]/15 text-[var(--green)] border-[var(--green)]/35",
  FAILED: "bg-[var(--red)]/15 text-[var(--red)] border-[var(--red)]/35",
};

// P0-P2 urgent, P3-P5 high/normal, P6-P8 low, P9-P10 lowest.
function priorityStyle(p: RequirementPriority): string {
  if (p <= 2) return "bg-[var(--red)]/15 text-[var(--red)] border-[var(--red)]/35";
  if (p <= 5) return "bg-[var(--amber)]/15 text-[var(--amber)] border-[var(--amber)]/35";
  if (p <= 8) return "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/35";
  return "bg-[var(--panel-2)] text-[var(--text-dim)] border-[var(--border)]";
}

function badgeClass(style: string) {
  return clsx(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
    style
  );
}

// Stages are custom/configurable now (see Stage/Workflow), so a badge just
// takes whatever name+color the stage carries rather than a fixed enum.
// `c` must be a real hex color, not a CSS variable -- the `${c}26`/`${c}59`
// below appends an alpha channel to it, which only works on literal hex.
export function StageBadge({ name, color }: { name: string; color?: string | null }) {
  const c = color ?? "#8b93a1";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: `${c}26`, color: c, borderColor: `${c}59` }}
    >
      {name}
    </span>
  );
}

export function ReleaseNoteStatusBadge({ status }: { status: ReleaseNoteStatus }) {
  return <span className={badgeClass(RELEASE_NOTE_STYLES[status])}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: RequirementPriority }) {
  return <span className={badgeClass(priorityStyle(priority))}>P{priority}</span>;
}
