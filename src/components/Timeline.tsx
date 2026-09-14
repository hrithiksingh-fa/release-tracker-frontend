import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
import { auditLogsApi } from "../api/resources.js";
import type { AuditLogRecord } from "../api/types.js";

const FIELD_LABELS: Record<string, string> = {
  stage: "Stage",
  title: "Title",
  name: "Name",
  description: "Description",
  productOwner: "Product owner",
  priority: "Priority",
  dueDate: "Delivery date",
  revisedDueDate: "Revised delivery date",
  deliveryDate: "Delivery date",
  adoState: "PBI state",
};

function fmt(value: string | null) {
  if (!value) return "—";
  const asDate = new Date(value);
  if (!Number.isNaN(asDate.getTime()) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return asDate.toLocaleString();
  }
  return value;
}

// A slide-over panel showing the full audit trail for one entity. Used from
// Client/Phase/Requirement detail pages ("View timeline").
export function TimelinePanel({
  entityType,
  entityId,
  onClose,
}: {
  entityType: string;
  entityId: string;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<AuditLogRecord[] | null>(null);

  useEffect(() => {
    auditLogsApi.list(entityType, entityId).then(setEntries);
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
        <div className="flex-1 overflow-y-auto p-4">
          {entries === null ? (
            <p className="text-sm text-[#9aa1ac]">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-[#9aa1ac]">No changes recorded yet.</p>
          ) : (
            <ol className="relative border-l border-[#2a2f3a] pl-4">
              {entries.map((e) => (
                <li key={e.id} className="mb-5">
                  <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-[#5b8cff]" />
                  <div className="text-xs text-[#9aa1ac]">
                    {new Date(e.occurredAt).toLocaleString()} · {e.actor}
                  </div>
                  <div className="mt-0.5 text-sm text-white">
                    <span className="font-medium">{FIELD_LABELS[e.field] ?? e.field}</span> changed
                  </div>
                  <div className="mt-1 text-sm text-[#9aa1ac]">
                    <span className="line-through opacity-70">{fmt(e.oldValue)}</span>
                    {" → "}
                    <span className="text-white">{fmt(e.newValue)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
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
