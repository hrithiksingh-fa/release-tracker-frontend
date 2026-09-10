import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { Users, ClipboardCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { syncApi } from "../api/resources.js";

const NAV_ITEMS = [
  { to: "/", label: "Clients", icon: Users, end: true },
  { to: "/review", label: "Review Queue", icon: ClipboardCheck, end: false },
];

export function Layout() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function runSyncNow() {
    setSyncing(true);
    setLastResult(null);
    try {
      const result = await syncApi.runNow();
      setLastResult(
        `Synced ${result.clientsSynced} client(s), ${result.linkedItemsUpdated} item(s) updated.` +
          (result.errors.length ? ` ${result.errors.length} error(s).` : "")
      );
    } catch (err) {
      setLastResult(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0f1115] text-[#e6e8eb]">
      <aside className="flex w-56 flex-col border-r border-[#2a2f3a] bg-[#171a21] p-4">
        <div className="mb-6 px-2 text-lg font-bold">Release Tracker</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  isActive ? "bg-[#5b8cff]/15 text-[#5b8cff]" : "text-[#9aa1ac] hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#2a2f3a] pt-4">
          <button
            onClick={runSyncNow}
            disabled={syncing}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2f3a] px-3 py-2 text-xs font-medium text-[#9aa1ac] hover:border-[#5b8cff] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Run EOD sync now"}
          </button>
          {lastResult && <p className="mt-2 text-[11px] leading-snug text-[#9aa1ac]">{lastResult}</p>}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
