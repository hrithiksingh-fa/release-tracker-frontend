import { create } from "zustand";

const STORAGE_KEY = "release-tracker.admin-token";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(STORAGE_KEY),
  setToken: (token) => {
    localStorage.setItem(STORAGE_KEY, token);
    set({ token });
  },
  clearToken: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null });
  },
}));
