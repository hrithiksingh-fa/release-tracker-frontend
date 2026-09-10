import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { clientsApi, trackersApi } from "../api/resources.js";
import type { ClientRecord, TrackerRecord } from "../api/types.js";

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [trackers, setTrackers] = useState<TrackerRecord[]>([]);
  const [newTrackerName, setNewTrackerName] = useState("");
  const [creating, setCreating] = useState(false);

  function reload() {
    if (!clientId) return;
    clientsApi.get(clientId).then(setClient);
    trackersApi.listForClient(clientId).then(setTrackers);
  }

  useEffect(reload, [clientId]);

  async function createTracker() {
    if (!clientId || !newTrackerName.trim()) return;
    setCreating(true);
    try {
      await trackersApi.create(clientId, newTrackerName.trim());
      setNewTrackerName("");
      reload();
    } finally {
      setCreating(false);
    }
  }

  if (!client) return <div className="p-8 text-sm text-[#9aa1ac]">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-[#9aa1ac] hover:text-white">
        <ArrowLeft size={14} /> All clients
      </Link>
      <h1 className="mb-1 text-xl font-semibold">{client.name}</h1>
      <p className="mb-6 text-sm text-[#9aa1ac]">
        {client.slackChannelName ? `Slack: #${client.slackChannelName}` : "No Slack channel configured"} ·{" "}
        {client.adoProject ? `ADO: ${client.adoProject} (${client.adoAreaPath})` : "ADO not configured"}
      </p>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#9aa1ac]">Trackers</h2>
        <div className="flex gap-2">
          <input
            value={newTrackerName}
            onChange={(e) => setNewTrackerName(e.target.value)}
            placeholder="New tracker name"
            className="rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-1.5 text-sm text-white outline-none focus:border-[#5b8cff]"
            onKeyDown={(e) => e.key === "Enter" && createTracker()}
          />
          <button
            onClick={createTracker}
            disabled={creating || !newTrackerName.trim()}
            className="flex items-center gap-1 rounded-lg bg-[#5b8cff] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {trackers.length === 0 ? (
        <p className="text-sm text-[#9aa1ac]">No trackers yet for this client.</p>
      ) : (
        <div className="divide-y divide-[#2a2f3a] rounded-xl border border-[#2a2f3a] bg-[#171a21]">
          {trackers.map((t) => (
            <Link
              key={t.id}
              to={`/trackers/${t.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
            >
              <span className="font-medium text-white">{t.name}</span>
              <span className="text-xs text-[#9aa1ac]">{t._count?.requirements ?? 0} requirement(s)</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
