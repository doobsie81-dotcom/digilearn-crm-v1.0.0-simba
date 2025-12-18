import { create } from "zustand";

interface OutlookStore {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  error: string | null;
  isConnected: boolean;
  setTokens: (
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ) => void;
  setError: (error: string | null) => void;
  clearTokens: () => void;
  hydrate: () => void;
}

export const useOutlookStore = create<OutlookStore>((set) => ({
  accessToken: null,
  refreshToken: null,
  expiresIn: null,
  error: null,
  isConnected: false,
  setTokens: (accessToken, refreshToken, expiresIn) =>
    set({
      accessToken,
      refreshToken,
      expiresIn,
      error: null,
      isConnected: true,
    }),
  setError: (error) => set({ error }),
  clearTokens: () =>
    set({
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      error: null,
      isConnected: false,
    }),
  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("outlook_access_token");
    const refreshToken = localStorage.getItem("outlook_refresh_token");
    const expiry = localStorage.getItem("outlook_token_expiry");

    if (token && refreshToken && expiry) {
      set({
        accessToken: token,
        refreshToken: refreshToken,
        expiresIn: parseInt(expiry) - Date.now() / 1000,
        isConnected: true,
      });
    }
  },
}));
