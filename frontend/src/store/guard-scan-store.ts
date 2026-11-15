import { create } from "zustand";
import type { ScanResponse } from "@/types/api";

export interface ScanHistoryEntry {
  id: string;
  response: ScanResponse;
  scannedAt: number;
}

interface GuardScanState {
  history: ScanHistoryEntry[];
  pushScan: (response: ScanResponse) => void;
  clear: () => void;
}

const MAX_HISTORY = 10;

export const useGuardScanStore = create<GuardScanState>((set) => ({
  history: [],
  pushScan: (response) =>
    set((state) => ({
      history: [
        { id: crypto.randomUUID(), response, scannedAt: Date.now() },
        ...state.history,
      ].slice(0, MAX_HISTORY),
    })),
  clear: () => set({ history: [] }),
}));
