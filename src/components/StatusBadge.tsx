import clsx from "clsx";
import type { ReleaseNoteStatus, RequirementPriority } from "../api/types.js";

const RELEASE_NOTE_STYLES: Record<ReleaseNoteStatus, string> = {
  DRAFT: "bg-[#e0a13a]/15 text-[#e0a13a] border-[#e0a13a]/35",
  APPROVED: "bg-[#5b8cff]/15 text-[#5b8cff] border-[#5b8cff]/35",
  SENT: "bg-[#33c17a]/15 text-[#33c17a] border-[#33c17a]/35",
  FAILED: "bg-[#e05a5a]/15 text-[#e05a5a] border-[#e05a5a]/35",
};

const PRIORITY_STYLES: Record<RequirementPriority, string> = {
  LOW: "bg-white/5 text-[#9aa1ac] border-[#2a2f3a]",
  MEDIUM: "bg-[#5b8cff]/15 text-[#5b8cff] border-[#5b8cff]/35",
  HIGH: "bg-[#e0a13a]/15 text-[#e0a13a] border-[#e0a13a]/35",
  URGENT: "bg-[#e05a5a]/15 text-[#e05a5a] border-[#e05a5a]/35",
};

function badgeClass(style: string) {
  return clsx(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
    style
  );
}

// Stages are custom/configurable now (see Stage/Workflow), so a badge just
// takes whatever name+color the stage carries rather than a fixed enum.
export function StageBadge({ name, color }: { name: string; color?: string | null }) {
  const c = color ?? "#9aa1ac";
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
  return <span className={badgeClass(PRIORITY_STYLES[priority])}>{priority}</span>;
}
