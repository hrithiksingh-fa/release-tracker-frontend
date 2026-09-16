import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, History, X } from "lucide-react";
import { auditLogsApi } from "../api/resources.js";
import type { AuditLogRecord, ActivityType, TimelineNode } from "../api/types.js";

const FIELD_LABELS: Record<string, string> = {
  stage: "Stage",
  client: "Client",
  phase: "Phase",
  requirement: "Requirement",
  title: "Title",
  name: "Name",
  description: "Description",
  productOwner: "Product owner",
  priority: "Priority",
  deliveryDate: "Delivery date",
  moduleId: "Module",
  categoryId: "Category",
  asanaLink: "Asana link",
  releaseNotesText: "Release notes",
  generalRemarks: "General remarks",
  linkedWorkItem: "Linked PBI",
  figmaLink: "Figma link",
  comment: "Comment",
  adoState: "PBI state",
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  create: "Created",
  update: "Updated",
  stage_change: "Stage change",
  comment: "Comment",
  pbi: "PBI",
  figma: "Figma",
};

function fmt(value: string | null) {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) return asDate.toLocaleString();
  }
  return value;
}

// A slide-over panel showing the audit trail for one entity. Client/Phase
// show a nested accordion rolling up every descendant's changes too
// (Client -> Phase -> Requirement); Requirement shows just its own, flat.
export function TimelinePanel({
  entityType,
  entityId,
  onClose,
}: {
  entityType: "client" | "phase" | "requirement";
  entityId: string;
  onClose: () => void;
}) {
  const [tree, setTree] = useState<TimelineNode | null>(null);
  const [filter, setFilter] = useState<ActivityType | "all">("all");

  useEffect(() => {
    if (entityType === "requirement") {
      auditLogsApi.list("requirement", entityId).then((logs) => setTree({ entityType, entityId, label: "", logs }));
    } else {
      auditLogsApi.rollup(entityType, entityId).then(setTree);
    }
  }, [entityType, entityId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="flex h-full w-full max-w-md flex-col border-l border-[#2a2f3a] bg-[#171a21]">
        <div className="flex items-center justify-between border-b border-[#2a2f3a] p-4">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[#5b8cff]" />
            <h2 className="text-sm font-semibold text-white">Timeline</h2>
          </div>
          <button onClick={onClose} className="text-[#9aa1ac] hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="border-b border-[#2a2f3a] p-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ActivityType | "all")}
            className="w-full rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-1.5 text-xs text-white outline-none focus:border-[#5b8cff]"
          >
            <option value="all">All activity</option>
            {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tree === null ? (
            <p className="text-sm text-[#9aa1ac]">Loading…</p>
          ) : (
            <TimelineTree node={tree} filter={filter} depth={0} topLevel />
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineTree({
  node,
  filter,
  depth,
  topLevel,
}: {
  node: TimelineNode;
  filter: ActivityType | "all";
  depth: number;
  topLevel?: boolean;
}) {
  const logs = filter === "all" ? node.logs : node.logs.filter((l) => l.activityType === filter);
  const children = node.children ?? [];

  return (
    <div className={depth > 0 ? "mt-3 border-l border-[#2a2f3a] pl-3" : ""}>
      <EntryList logs={logs} />
      {children.map((child) => (
        <ChildAccordion key={child.entityId} node={child} filter={filter} depth={depth + 1} />
      ))}
      {topLevel && logs.length === 0 && children.length === 0 && (
        <p className="text-sm text-[#9aa1ac]">No changes recorded yet.</p>
      )}
    </div>
  );
}

function ChildAccordion({ node, filter, depth }: { node: TimelineNode; filter: ActivityType | "all"; depth: number }) {
  const [open, setOpen] = useState(false);
  const totalCount = countMatching(node, filter);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-left text-xs font-semibold text-white hover:bg-white/5"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="uppercase tracking-wide text-[#9aa1ac]">{node.entityType}</span>
        {node.label}
        <span className="ml-auto text-[10px] font-normal text-[#9aa1ac]">{totalCount}</span>
      </button>
      {open && <TimelineTree node={node} filter={filter} depth={depth} />}
    </div>
  );
}

function countMatching(node: TimelineNode, filter: ActivityType | "all"): number {
  const own = filter === "all" ? node.logs.length : node.logs.filter((l) => l.activityType === filter).length;
  const nested = (node.children ?? []).reduce((sum, c) => sum + countMatching(c, filter), 0);
  return own + nested;
}

function EntryList({ logs }: { logs: AuditLogRecord[] }) {
  if (!logs.length) return null;
  return (
    <ol className="mb-2">
      {logs.map((e) => (
        <li key={e.id} className="relative mb-4 pl-4">
          <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-[#5b8cff]" />
          <div className="text-xs text-[#9aa1ac]">
            {new Date(e.occurredAt).toLocaleString()} · {e.actor} · {ACTIVITY_LABELS[e.activityType]}
          </div>
          <div className="mt-0.5 text-sm text-white">
            <span className="font-medium">{FIELD_LABELS[e.field] ?? e.field}</span>
            {e.activityType === "create" ? " created" : e.activityType === "comment" ? " added" : " changed"}
          </div>
          {e.activityType !== "create" && (
            <div className="mt-1 text-sm text-[#9aa1ac]">
              {e.oldValue && (
                <>
                  <span className="line-through opacity-70">{fmt(e.oldValue)}</span>
                  {" → "}
                </>
              )}
              <span className="text-white">{fmt(e.newValue)}</span>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

export function TimelineButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-[#2a2f3a] px-3 py-1.5 text-xs font-medium text-[#9aa1ac] hover:border-[#5b8cff] hover:text-white"
    >
      <History size={14} /> Timeline
    </button>
  );
}
