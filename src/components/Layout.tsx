import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { Users, ClipboardCheck, RefreshCw, Settings, Menu, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { syncApi } from "../api/resources.js";
import { useThemeStore } from "../store/themeStore.js";

const NAV_ITEMS = [
  { to: "/", label: "Clients", icon: Users, end: true },
  { to: "/review", label: "Review Queue", icon: ClipboardCheck, end: false },
  { to: "/admin", label: "Settings", icon: Settings, end: false },
];

const COLLAPSE_KEY = "release-tracker.sidebar-collapsed";

export function Layout() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore -- per-viewer convenience only
      }
      return next;
    });
  }

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
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <aside
        className={clsx(
          "flex flex-col border-r border-[var(--border)] bg-[var(--panel)] p-4 transition-[width] duration-150",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <div className={clsx("mb-2 flex items-center px-1", collapsed ? "flex-col gap-2" : "justify-between")}>
          {!collapsed && <span className="text-lg font-bold">Release Tracker</span>}
          <button
            onClick={toggleCollapsed}
            className="rounded-lg p-1.5 text-[var(--text-dim)] hover:bg-[var(--hover-surface)] hover:text-[var(--text)]"
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={clsx(
            "mb-4 flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--text)]",
            collapsed && "justify-center"
          )}
        >
          {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          {!collapsed && (theme === "dark" ? "Dark mode" : "Light mode")}
        </button>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "text-[var(--text-dim)] hover:bg-[var(--hover-surface)] hover:text-[var(--text)]"
                )
              }
            >
              <Icon size={16} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-[var(--border)] pt-4">
          <button
            onClick={runSyncNow}
            disabled={syncing}
            title={collapsed ? "Run EOD sync now" : undefined}
            className={clsx(
              "flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-dim)] hover:border-[var(--accent)] hover:text-[var(--text)] disabled:opacity-50"
            )}
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {!collapsed && (syncing ? "Syncing…" : "Run EOD sync now")}
          </button>
          {!collapsed && lastResult && <p className="mt-2 text-[11px] leading-snug text-[var(--text-dim)]">{lastResult}</p>}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
