import { create } from 'zustand'

export type PageId =
  | 'dashboard'
  | 'products'
  | 'links'
  | 'analytics'
  | 'campaigns'
  | 'calculator'
  | 'earnings'
  | 'hermes'
  | 'achievements'
  | 'leaderboard'
  | 'referrals'
  | 'notifications'
  | 'settings'

interface AppState {
  activePage: PageId
  setActivePage: (page: PageId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  hermesConnected: boolean
  setHermesConnected: (connected: boolean) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  hermesConnected: false,
  setHermesConnected: (connected) => set({ hermesConnected: connected }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}))
