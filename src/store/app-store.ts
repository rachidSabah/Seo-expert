import { create } from 'zustand';

export type PageId =
  | 'dashboard'
  | 'audit'
  | 'keywords'
  | 'backlinks'
  | 'rankings'
  | 'competitors'
  | 'content'
  | 'ai-writer'
  | 'internal-links'
  | 'automation'
  | 'reports'
  | 'settings';

interface AppState {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  user: { id: string; email: string; name: string; role: string } | null;
  setUser: (user: { id: string; email: string; name: string; role: string } | null) => void;
  selectedProject: string | null;
  setSelectedProject: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  isAuthenticated: false,
  setIsAuthenticated: (val) => set({ isAuthenticated: val }),
  user: null,
  setUser: (user) => set({ user }),
  selectedProject: null,
  setSelectedProject: (id) => set({ selectedProject: id }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
