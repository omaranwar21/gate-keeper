import { create } from "zustand";
import type { Role } from "@/types/api";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

interface SessionState {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
