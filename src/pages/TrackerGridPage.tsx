import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { requirementsApi, trackersApi } from "../api/resources.js";
import type { RequirementRecord, TrackerRecord, ClientRecord } from "../api/types.js";
import { RequirementStatusBadge, ReleaseNoteStatusBadge } from "../components/StatusBadge.js";

const columnHelper = createColumnHelper<RequirementRecord>();

export function TrackerGridPage() {
  const { trackerId } = useParams<{ trackerId: string }>();
  const navigate = useNavigate();
  const [tracker, setTracker] = useState<(TrackerRecord & { client: ClientRecord }) | null>(null);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  function reload() {
    if (!trackerId) return;
    trackersApi.get(trackerId).then(setTracker);
    requirementsApi.listForTracker(trackerId).then(setRequirements);
  }

  useEffect(reload, [trackerId]);

  async function addRequirement() {
    if (!trackerId || !newTitle.trim()) return;
    setCreating(true);
    try {
      await requirementsApi.create(trackerId, { title: newTitle.trim() });
      setNewTitle("");
      reload();
    } finally {
      setCreating(false);
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Requirement",
        cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <RequirementStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor((r) => r.linkedWorkItems, {
        id: "linkedWorkItems",
        header: "ADO work items",
        cell: (info) => {
          const items = info.getValue();
          if (!items.length) return <span className="text-[#9aa1ac]">None linked</span>;
          return (
            <span className="text-[#9aa1ac]">
              {items.map((li) => `#${li.adoId} (${li.adoState ?? "?"})`).join(", ")}
            </span>
          );
        },
      }),
      columnHelper.accessor((r) => r.releaseNotes?.[0], {
        id: "releaseNote",
        header: "Release note",
        cell: (info) => {
          const note = info.getValue();
          return note ? <ReleaseNoteStatusBadge status={note.status} /> : <span className="text-[#9aa1ac]">—</span>;
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: requirements,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!tracker) return <div className="p-8 text-sm text-[#9aa1ac]">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl p-8">
      <Link
        to={`/clients/${tracker.clientId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#9aa1ac] hover:text-white"
      >
        <ArrowLeft size={14} /> {tracker.client.name}
      </Link>
      <h1 className="mb-1 text-xl font-semibold">{tracker.name}</h1>
      <p className="mb-6 text-sm text-[#9aa1ac]">
        Status updates automatically at EOD sync from every linked ADO work item. A requirement is Done only
        once all of its linked items reach a terminal state.
      </p>

      <div className="mb-4 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New requirement title"
          className="flex-1 rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
          onKeyDown={(e) => e.key === "Enter" && addRequirement()}
        />
        <button
          onClick={addRequirement}
          disabled={creating || !newTitle.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} /> Add requirement
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#2a2f3a] bg-[#171a21]">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[#2a2f3a]">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9aa1ac]"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/requirements/${row.original.id}`)}
                className="cursor-pointer border-b border-[#2a2f3a] last:border-0 hover:bg-white/5"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {requirements.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-[#9aa1ac]">
                  No requirements yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
