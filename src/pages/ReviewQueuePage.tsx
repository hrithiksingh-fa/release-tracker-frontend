import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { releaseNotesApi } from "../api/resources.js";
import type { ReleaseNoteRecord } from "../api/types.js";
import { ReleaseNoteStatusBadge } from "../components/StatusBadge.js";

export function ReviewQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<ReleaseNoteRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("noteId"));
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    releaseNotesApi
      .list("DRAFT")
      .then((list) => {
        setNotes(list);
        if (!selectedId && list.length) setSelectedId(list[0].id);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  useEffect(() => {
    if (selectedId) setSearchParams({ noteId: selectedId }, { replace: true });
  }, [selectedId]);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="flex h-screen">
      <div className="w-80 shrink-0 overflow-y-auto border-r border-[#2a2f3a] p-4">
        <h1 className="mb-3 text-sm font-semibold text-[#9aa1ac]">Needs review ({notes.length})</h1>
        {loading && <p className="text-sm text-[#9aa1ac]">Loading…</p>}
        <div className="flex flex-col gap-1">
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm ${
                n.id === selectedId ? "bg-[#5b8cff]/15 text-white" : "text-[#9aa1ac] hover:bg-white/5"
              }`}
            >
              <div className="font-medium">{n.requirement?.title ?? n.requirementId}</div>
              <div className="text-xs text-[#9aa1ac]">{n.category}</div>
            </button>
          ))}
          {!loading && notes.length === 0 && <p className="text-sm text-[#9aa1ac]">Nothing to review.</p>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        {selected ? <NoteEditor note={selected} onChange={reload} /> : <p className="text-sm text-[#9aa1ac]">Select a note.</p>}
      </div>
    </div>
  );
}

function NoteEditor({ note, onChange }: { note: ReleaseNoteRecord; onChange: () => void }) {
  const [problemStatement, setProblemStatement] = useState(note.problemStatement ?? "");
  const [objective, setObjective] = useState(note.objective ?? "");
  const [stepsToUse, setStepsToUse] = useState(note.stepsToUse ?? "");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(note.acceptanceCriteria ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProblemStatement(note.problemStatement ?? "");
    setObjective(note.objective ?? "");
    setStepsToUse(note.stepsToUse ?? "");
    setAcceptanceCriteria(note.acceptanceCriteria ?? "");
  }, [note.id]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await releaseNotesApi.update(note.id, {
        problemStatement,
        objective: objective || null,
        stepsToUse: stepsToUse || null,
        acceptanceCriteria,
      });
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function approveAndSend() {
    setSaving(true);
    setError(null);
    try {
      await save();
      await releaseNotesApi.approve(note.id);
      await releaseNotesApi.send(note.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve/send");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{note.requirement?.title}</h2>
        <ReleaseNoteStatusBadge status={note.status} />
      </div>
      <p className="mb-6 text-xs text-[#9aa1ac]">
        Going to Slack channel #{note.requirement?.phase?.client?.slackChannelName ?? "(none configured)"} for{" "}
        {note.requirement?.phase?.client?.name}
      </p>

      <TextField label="Problem statement" value={problemStatement} onChange={setProblemStatement} rows={3} />
      <TextField label="Objective (what changed)" value={objective} onChange={setObjective} rows={3} />
      <TextField label="Steps to use" value={stepsToUse} onChange={setStepsToUse} rows={3} />
      <TextField label="Acceptance criteria" value={acceptanceCriteria} onChange={setAcceptanceCriteria} rows={3} />

      {error && <p className="mb-3 text-sm text-[#e05a5a]">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg border border-[#2a2f3a] px-4 py-2 text-sm font-medium text-white hover:border-[#5b8cff] disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          onClick={approveAndSend}
          disabled={saving}
          className="rounded-lg bg-[#33c17a] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Approve & send to Slack
        </button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <label className="mb-4 flex flex-col gap-1">
      <span className="text-xs font-semibold text-[#9aa1ac]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
      />
    </label>
  );
}
