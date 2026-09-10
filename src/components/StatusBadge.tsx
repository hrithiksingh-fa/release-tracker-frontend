import clsx from "clsx";
import type { RequirementStatus, ReleaseNoteStatus } from "../api/types.js";

const REQUIREMENT_STYLES: Record<RequirementStatus, string> = {
  NOT_STARTED: "bg-white/5 text-[#9aa1ac] border-[#2a2f3a]",
  IN_PROGRESS: "bg-[#5b8cff]/15 text-[#5b8cff] border-[#5b8cff]/35",
  DONE: "bg-[#33c17a]/15 text-[#33c17a] border-[#33c17a]/35",
};

const RELEASE_NOTE_STYLES: Record<ReleaseNoteStatus, string> = {
  DRAFT: "bg-[#e0a13a]/15 text-[#e0a13a] border-[#e0a13a]/35",
  APPROVED: "bg-[#5b8cff]/15 text-[#5b8cff] border-[#5b8cff]/35",
  SENT: "bg-[#33c17a]/15 text-[#33c17a] border-[#33c17a]/35",
  FAILED: "bg-[#e05a5a]/15 text-[#e05a5a] border-[#e05a5a]/35",
};

function badgeClass(style: string) {
  return clsx(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
    style
  );
}

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  return <span className={badgeClass(REQUIREMENT_STYLES[status])}>{status.replace("_", " ")}</span>;
}

export function ReleaseNoteStatusBadge({ status }: { status: ReleaseNoteStatus }) {
  return <span className={badgeClass(RELEASE_NOTE_STYLES[status])}>{status}</span>;
}
