import { useState, type ReactNode } from "react";
import { useAuthStore } from "../store/authStore.js";

// Single-admin auth: the backend checks one shared bearer token (ADMIN_API_TOKEN).
// This just gets it into localStorage so every API call can attach it.
export function TokenGate({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const [draft, setDraft] = useState("");

  if (token) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1115]">
      <form
        className="w-full max-w-sm rounded-xl border border-[#2a2f3a] bg-[#171a21] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) setToken(draft.trim());
        }}
      >
        <h1 className="mb-1 text-lg font-semibold text-white">Release Tracker</h1>
        <p className="mb-4 text-sm text-[#9aa1ac]">
          Enter the admin API token (matches ADMIN_API_TOKEN on the backend).
        </p>
        <input
          autoFocus
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="mb-3 w-full rounded-lg border border-[#2a2f3a] bg-[#1e2229] px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]"
          placeholder="Admin token"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-[#5b8cff] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
