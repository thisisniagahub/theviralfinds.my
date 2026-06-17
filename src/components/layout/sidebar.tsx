'use client'

import { useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore, type PageId } from '@/store/app-store'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  ShoppingBag,
  Link2,
  BarChart3,
  Calculator,
  Megaphone,
  Wallet,
  Settings,
  Bell,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Trophy,
  Award,
  Users,
  Bot,
  CalendarClock,
  PenTool,
  Target,
  TrendingUp,
  Film,
  Music2,
  Radio,
  GitCompare,
  LayoutGrid,
  Search,
  Lightbulb,
  Image as ImageIcon,
  BellRing,
  FlaskConical,
  Users2,
  Hash,
  CalendarDays,
  Crown,
  Store,
  Building2,
  Palette,
  Key,
  Star,
  Pin,
  Command,
  X,
  Keyboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  id: PageId
  label: string
  icon: React.ElementType
  badge?: string
  color?: string
  isNew?: boolean
}

type SectionId = 'core' | 'ai' | 'platforms' | 'advanced' | 'growth'

interface NavSection {
  id: SectionId
  title: string
  items: NavItem[]
  defaultOpen: boolean
}

// ---------------------------------------------------------------------------
// Section definitions
//
// All 36 nav items are organized into 5 collapsible sections. The "Pinned"
// section at the top of the sidebar is dynamic — populated from user-pinned
// items in localStorage.
// ---------------------------------------------------------------------------

const navSections: NavSection[] = [
  {
    id: 'core',
    title: 'Core',
    defaultOpen: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'products', label: 'Products', icon: ShoppingBag },
      { id: 'links', label: 'Affiliate Links', icon: Link2 },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'calculator', label: 'Calculator', icon: Calculator },
      { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
      { id: 'earnings', label: 'Earnings', icon: Wallet },
    ],
  },
  {
    id: 'ai',
    title: 'AI Powered',
    defaultOpen: true,
    items: [
      { id: 'content', label: 'AI Content', icon: PenTool, badge: 'AI', color: 'content' },
      { id: 'trends', label: 'Trend Spy', icon: TrendingUp, color: 'trends' },
      { id: 'profit', label: 'Profit Optimizer', icon: Target, badge: 'AI', color: 'profit' },
      { id: 'studio', label: 'Content Studio', icon: Film, color: 'studio' },
      { id: 'matcher', label: 'Product Matcher', icon: Search, color: 'profit' },
      { id: 'recommender', label: 'AI Recommender', icon: Lightbulb, badge: 'AI', color: 'hermes' },
      { id: 'thumbnails', label: 'AI Thumbnails', icon: ImageIcon, badge: 'AI', color: 'content' },
      { id: 'calendar', label: 'AI Calendar', icon: CalendarDays, badge: 'AI', color: 'hermes' },
      { id: 'hashtags', label: 'Hashtag AI', icon: Hash, badge: 'AI', color: 'trends' },
      { id: 'audience', label: 'Audience AI', icon: Users2, badge: 'AI', color: 'content' },
      { id: 'abtesting', label: 'A/B Testing', icon: FlaskConical, badge: 'AI', color: 'hermes' },
    ],
  },
  {
    id: 'platforms',
    title: 'Platforms',
    defaultOpen: false,
    items: [
      { id: 'tiktok', label: 'TikTok Shop', icon: Music2, badge: 'NEW', color: 'studio', isNew: true },
      { id: 'lazada', label: 'Lazada', icon: ShoppingBag, badge: 'NEW', color: 'profit', isNew: true },
      { id: 'live', label: 'Shopee Live', icon: Radio, badge: '80%', color: 'hermes' },
      { id: 'unified', label: 'Unified Earnings', icon: LayoutGrid, color: 'autopost' },
      { id: 'compare', label: 'Compare', icon: GitCompare, color: 'trends' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    defaultOpen: false,
    items: [
      { id: 'autopost', label: 'Auto Post', icon: CalendarClock, badge: 'NEW', color: 'autopost', isNew: true },
      { id: 'alerts', label: 'XTRA Alerts', icon: BellRing, color: 'profit' },
      { id: 'pricing', label: 'Pricing', icon: Crown, badge: 'PRO', color: 'profit' },
      { id: 'marketplace', label: 'Marketplace', icon: Store, badge: 'NEW', color: 'studio', isNew: true },
      { id: 'team', label: 'Team Dashboard', icon: Building2, badge: 'NEW', color: 'hermes', isNew: true },
      { id: 'whitelabel', label: 'White-Label', icon: Palette, badge: 'ENT', color: 'content' },
      { id: 'apikeys', label: 'API Keys', icon: Key, badge: 'API', color: 'trends' },
    ],
  },
  {
    id: 'growth',
    title: 'Growth',
    defaultOpen: false,
    items: [
      { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
      { id: 'achievements', label: 'Achievements', icon: Award },
      { id: 'referrals', label: 'Referrals', icon: Users },
      { id: 'hermes', label: 'Hermes AI Hub', icon: Bot, badge: 'AI', color: 'hermes' },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

const allNavItems: NavItem[] = navSections.flatMap((s) => s.items)

const DEFAULT_PINNED: PageId[] = ['dashboard', 'content', 'earnings']

const DEFAULT_SECTION_OPEN: Record<SectionId, boolean> = {
  core: true,
  ai: true,
  platforms: false,
  advanced: false,
  growth: false,
}

const STORAGE_KEYS = {
  sections: 'tvf_sidebar_sections',
  pinned: 'tvf_pinned_pages',
  seenNew: 'tvf_seen_new_pages',
  helpSeen: 'tvf_shortcut_help_seen',
} as const

// ---------------------------------------------------------------------------
// Persistent state via useSyncExternalStore
//
// We back sidebar state (section open/close, pinned items, "seen NEW" pages,
// and shortcut-help-seen flag) with localStorage. Using useSyncExternalStore
// gives us:
//   - SSR-safe initial render (server snapshot = default value)
//   - No `setState`-in-effect (avoids cascading-render lint rule)
//   - Cross-tab sync via the native `storage` event
//
// A module-level cache ensures getSnapshot returns a stable reference for the
// same underlying localStorage value (otherwise useSyncExternalStore would
// re-render forever).
// ---------------------------------------------------------------------------

const storageCache = new Map<string, { raw: string | null; value: unknown }>()

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  let raw: string | null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    raw = null
  }
  if (raw === null) return fallback
  const cached = storageCache.get(key)
  if (cached && cached.raw === raw) return cached.value as T
  try {
    const value = JSON.parse(raw) as T
    storageCache.set(key, { raw, value })
    return value
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    const raw = JSON.stringify(value)
    window.localStorage.setItem(key, raw)
    storageCache.set(key, { raw, value })
    // Dispatch a custom event so same-window subscribers are notified (the
    // native `storage` event only fires for OTHER windows/tabs).
    window.dispatchEvent(new CustomEvent('tvf-storage', { detail: { key } }))
  } catch {
    // ignore quota / serialization errors
  }
}

function usePersistentState<T>(
  key: string,
  fallback: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined') return () => {}
      const handler = (e: Event) => {
        if (e.type === 'storage') {
          const se = e as StorageEvent
          if (se.key === key) onChange()
        } else if (e.type === 'tvf-storage') {
          const ce = e as CustomEvent<{ key: string }>
          if (ce.detail?.key === key) onChange()
        }
      }
      window.addEventListener('storage', handler)
      window.addEventListener('tvf-storage', handler)
      return () => {
        window.removeEventListener('storage', handler)
        window.removeEventListener('tvf-storage', handler)
      }
    },
    [key],
  )

  const getSnapshot = useCallback(() => readStorage(key, fallback), [key, fallback])
  const getServerSnapshot = useCallback(() => fallback, [fallback])

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = readStorage(key, fallback)
      const newValue =
        typeof next === 'function' ? (next as (p: T) => T)(current) : next
      writeStorage(key, newValue)
    },
    [key, fallback],
  )

  return [value, setValue]
}

// ---------------------------------------------------------------------------
// Shortcut help dialog content
// ---------------------------------------------------------------------------

interface ShortcutRow {
  keys: string[]
  action: string
}

const SHORTCUT_GROUPS: { title: string; rows: ShortcutRow[] }[] = [
  {
    title: 'Navigation (press g, then a key)',
    rows: [
      { keys: ['g', 'd'], action: 'Go to Dashboard' },
      { keys: ['g', 'p'], action: 'Go to Products' },
      { keys: ['g', 'l'], action: 'Go to Affiliate Links' },
      { keys: ['g', 'a'], action: 'Go to Analytics' },
      { keys: ['g', 'e'], action: 'Go to Earnings' },
      { keys: ['g', 'c'], action: 'Go to AI Content' },
      { keys: ['g', 't'], action: 'Go to Trend Spy' },
      { keys: ['g', 'h'], action: 'Go to HERMES AI Hub' },
    ],
  },
  {
    title: 'Actions',
    rows: [
      { keys: ['c'], action: 'Create Link (opens Links page)' },
      { keys: ['?'], action: 'Show this help overlay' },
      { keys: ['Esc'], action: 'Close overlay / clear search' },
    ],
  },
  {
    title: 'Search',
    rows: [
      { keys: ['/'], action: 'Focus sidebar search' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const {
    activePage,
    setActivePage,
    sidebarOpen,
    setSidebarOpen,
    user,
    isAuthenticated,
    logout,
    setAuthView,
  } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()

  // -- Persistent state (localStorage-backed via useSyncExternalStore) ------
  const [sectionOpen, setSectionOpen] = usePersistentState<Record<SectionId, boolean>>(
    STORAGE_KEYS.sections,
    DEFAULT_SECTION_OPEN,
  )
  const [pinned, setPinned] = usePersistentState<PageId[]>(STORAGE_KEYS.pinned, DEFAULT_PINNED)
  const [seenNew, setSeenNew] = usePersistentState<PageId[]>(STORAGE_KEYS.seenNew, [])
  const [helpSeen, setHelpSeen] = usePersistentState<boolean>(STORAGE_KEYS.helpSeen, false)

  // -- Ephemeral UI state ---------------------------------------------------
  const [helpOpen, setHelpOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-open the shortcut help dialog once on first run (after a short
  // delay so the page settles first). setState lives inside the setTimeout
  // callback — never called synchronously in the effect body.
  useEffect(() => {
    if (helpSeen) return
    const t = window.setTimeout(() => setHelpOpen(true), 900)
    return () => window.clearTimeout(t)
  }, [helpSeen])

  // -- Derived state --------------------------------------------------------

  const isPinned = useCallback((id: PageId) => pinned.includes(id), [pinned])

  const togglePinned = useCallback(
    (id: PageId) => {
      setPinned((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
      )
    },
    [setPinned],
  )

  const toggleSection = useCallback(
    (id: SectionId) => {
      setSectionOpen((prev) => ({ ...prev, [id]: !prev[id] }))
    },
    [setSectionOpen],
  )

  const markNewAsSeen = useCallback(
    (id: PageId) => {
      setSeenNew((prev) => (prev.includes(id) ? prev : [...prev, id]))
    },
    [setSeenNew],
  )

  // Pinned items rendered in the PINNED section (preserve pinned order).
  const pinnedItems = useMemo<NavItem[]>(
    () =>
      pinned
        .map((id) => allNavItems.find((it) => it.id === id))
        .filter((it): it is NavItem => Boolean(it)),
    [pinned],
  )

  // Search filtering
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchActive = normalizedQuery.length > 0

  const filteredSections = useMemo(() => {
    if (!isSearchActive) return navSections
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((it) =>
          it.label.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [normalizedQuery, isSearchActive])

  const totalSearchMatches = useMemo(
    () => filteredSections.reduce((sum, s) => sum + s.items.length, 0),
    [filteredSections],
  )

  // -- Navigation handler ---------------------------------------------------

  const navigateTo = useCallback(
    (id: PageId, label: string) => {
      setActivePage(id)
      markNewAsSeen(id)
      // Brief toast so power users get visual confirmation.
      toast(label, {
        duration: 1200,
        position: 'bottom-right',
      })
    },
    [setActivePage, markNewAsSeen],
  )

  // -- Keyboard shortcuts ---------------------------------------------------

  useKeyboardShortcuts({
    goDashboard: () => navigateTo('dashboard', 'Dashboard'),
    goProducts: () => navigateTo('products', 'Products'),
    goLinks: () => navigateTo('links', 'Affiliate Links'),
    goAnalytics: () => navigateTo('analytics', 'Analytics'),
    goEarnings: () => navigateTo('earnings', 'Earnings'),
    goContent: () => navigateTo('content', 'AI Content'),
    goTrends: () => navigateTo('trends', 'Trend Spy'),
    goHermes: () => navigateTo('hermes', 'Hermes AI Hub'),
    createLink: () => {
      setActivePage('links')
      toast('Create Link — Affiliate Links', {
        duration: 1400,
        position: 'bottom-right',
      })
    },
    focusSearch: () => {
      if (!sidebarOpen) setSidebarOpen(true)
      // Defer focus until the input is visible after the sidebar expands.
      window.setTimeout(() => searchInputRef.current?.focus(), 60)
    },
    showHelp: () => setHelpOpen(true),
    escape: () => {
      setHelpOpen(false)
      if (searchQuery) {
        setSearchQuery('')
        setIsSearching(false)
      }
      searchInputRef.current?.blur()
    },
  })

  // -- Render helpers -------------------------------------------------------

  const renderNavItem = (item: NavItem, inPinnedSection = false) => {
    const Icon = item.icon
    const isActive = activePage === item.id
    const isPinnedItem = isPinned(item.id)
    const showRedDot = item.isNew && !seenNew.includes(item.id)

    // Special color classes (matches legacy sidebar behaviour).
    const isSpecial = Boolean(item.color)
    const specialColor =
      item.color === 'hermes'
        ? 'hermes'
        : item.color === 'autopost'
          ? 'emerald'
          : item.color === 'content'
            ? 'violet'
            : item.color === 'trends'
              ? 'amber'
              : item.color === 'profit'
                ? 'rose'
                : item.color === 'studio'
                  ? 'sky'
                  : 'shopee'

    // Pinned items get a subtle gold tint (unless active).
    const pinnedTint =
      isPinnedItem && !isActive
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60'
        : ''

    const activeClasses = isActive
      ? isSpecial
        ? `bg-${specialColor}/10 text-${specialColor} dark:bg-${specialColor}/20`
        : 'bg-shopee/10 text-shopee dark:bg-shopee/20 nav-glow'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'

    return (
      <div key={item.id} className="relative group/nav">
        <button
          onClick={() => navigateTo(item.id, item.label)}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 w-full min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 nav-item-slide relative',
            activeClasses,
            pinnedTint,
          )}
        >
          <Icon
            className={cn(
              'w-[18px] h-[18px] flex-shrink-0',
              isActive && isSpecial
                ? `text-${specialColor}`
                : isActive
                  ? 'text-shopee'
                  : '',
            )}
          />
          <span className="flex-1 truncate text-left">{item.label}</span>

          {/* Red dot for unseen NEW items */}
          {showRedDot && (
            <span className="relative flex h-2 w-2 mr-1" aria-label="New">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          )}

          {/* Badge (AI / NEW / PRO / ENT / API / 80%) */}
          {item.badge && !showRedDot && (
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] px-1.5 py-0 border-0 ml-0',
                isSpecial
                  ? `bg-${specialColor}/10 text-${specialColor}`
                  : 'bg-shopee/10 text-shopee',
              )}
            >
              {item.badge}
            </Badge>
          )}

          {/* Star (pin/unpin) — always visible on hover, persistent if pinned */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              togglePinned(item.id)
              toast(isPinnedItem ? `Unpinned ${item.label}` : `Pinned ${item.label}`, {
                duration: 1200,
                position: 'bottom-right',
              })
            }}
            aria-label={isPinnedItem ? `Unpin ${item.label}` : `Pin ${item.label}`}
            title={isPinnedItem ? 'Unpin from top' : 'Pin to top'}
            className={cn(
              'flex-shrink-0 p-0.5 rounded transition-all',
              isPinnedItem
                ? 'opacity-100 text-amber-500 hover:text-amber-600'
                : 'opacity-0 group-hover/nav:opacity-100 text-muted-foreground hover:text-amber-500',
            )}
          >
            <Star
              className={cn('w-3.5 h-3.5', isPinnedItem && 'fill-current')}
            />
          </button>

          {/* Pinned indicator (only in pinned section) */}
          {inPinnedSection && (
            <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 ml-0.5" aria-hidden />
          )}
        </button>
      </div>
    )
  }

  const renderSection = (section: NavSection, forceOpen = false) => {
    const isOpen = forceOpen || (sectionOpen[section.id] ?? section.defaultOpen)
    return (
      <div key={section.id} className="px-1">
        <button
          onClick={() => toggleSection(section.id)}
          aria-expanded={isOpen}
          className={cn(
            'flex items-center w-full px-2 py-1.5 rounded-md transition-colors',
            'hover:bg-muted/60',
            isSearchActive && 'pointer-events-none opacity-60',
          )}
        >
          <ChevronDown
            className={cn(
              'w-3 h-3 mr-1 text-muted-foreground transition-transform duration-200',
              !isOpen && '-rotate-90',
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex-1 text-left">
            {section.title}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground/70 tabular-nums">
            {section.items.length}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="space-y-0.5 py-1 pl-1">
                {section.items.map((item) => renderNavItem(item))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // -- Collapsed (icon-only) sidebar ---------------------------------------
  const renderCollapsedNav = () => (
    <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
      {allNavItems.map((item) => {
        const Icon = item.icon
        const isActive = activePage === item.id
        const showRedDot = item.isNew && !seenNew.includes(item.id)
        return (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id, item.label)}
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center justify-center w-full min-h-[44px] min-w-[44px] px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
              isActive
                ? 'bg-shopee/10 text-shopee dark:bg-shopee/20 nav-glow'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {showRedDot && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )

  // -- Expanded sidebar body ------------------------------------------------
  const renderExpandedBody = () => (
    <>
      {/* Search bar */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearching(true)
            }}
            onFocus={() => setIsSearching(true)}
            onBlur={() => {
              if (!searchQuery) setIsSearching(false)
            }}
            placeholder="Search pages… (or press /)"
            aria-label="Search sidebar pages"
            className="h-8 pl-8 pr-8 text-xs"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('')
                setIsSearching(false)
                searchInputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground/70 border border-border rounded px-1 py-px select-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-1 pb-2 overflow-y-auto custom-scrollbar"
        aria-label="Primary"
      >
        {/* Pinned section (only when not searching and has pinned items) */}
        {!isSearchActive && pinnedItems.length > 0 && (
          <div className="mb-1 px-1">
            <div className="flex items-center px-2 py-1.5">
              <Pin className="w-3 h-3 mr-1 text-amber-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex-1 text-left">
                Pinned
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/70 tabular-nums">
                {pinnedItems.length}
              </span>
            </div>
            <div className="space-y-0.5 pl-1">
              {pinnedItems.map((item) => renderNavItem(item, true))}
            </div>
            <Separator className="my-2" />
          </div>
        )}

        {/* Search empty state */}
        {isSearchActive && totalSearchMatches === 0 && (
          <div className="px-3 py-8 text-center">
            <Search className="w-5 h-5 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              No pages found. Try another search.
            </p>
          </div>
        )}

        {/* Sections — force-open during search */}
        {filteredSections.map((section) =>
          renderSection(section, isSearchActive),
        )}
      </nav>
    </>
  )

  // -- Help dialog ----------------------------------------------------------
  const dismissHelp = () => {
    setHelpOpen(false)
    setHelpSeen(true)
  }

  const renderHelpDialog = () => (
    <Dialog open={helpOpen} onOpenChange={(o) => (o ? setHelpOpen(true) : dismissHelp())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-shopee" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow. Power-user shortcuts for navigation,
            actions, and search.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.rows.map((row) => (
                  <div
                    key={row.action}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm text-foreground">{row.action}</span>
                    <div className="flex items-center gap-1">
                      {row.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              then
                            </span>
                          )}
                          <kbd className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[11px] font-medium border border-border rounded bg-muted/60">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={dismissHelp} className="bg-shopee hover:bg-shopee-dark text-white">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // -- Main component render ------------------------------------------------

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border transition-all duration-300 bg-sidebar',
        sidebarOpen ? 'w-64' : 'w-[68px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-shopee text-white font-bold text-sm flex-shrink-0">
          TV
        </div>
        {sidebarOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">
              TheViralFinds
            </span>
            <span className="text-[10px] text-muted-foreground">
              Affiliate Manager Pro
            </span>
          </div>
        )}
      </div>

      {sidebarOpen ? renderExpandedBody() : renderCollapsedNav()}

      <Separator />

      {/* Bottom section */}
      <div className="p-2 space-y-1">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size={sidebarOpen ? 'sm' : 'icon'}
            className={sidebarOpen ? 'flex-1 justify-start gap-3 min-h-[40px]' : 'justify-center min-h-[44px] min-w-[44px]'}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
          >
            <span className="relative w-4 h-4 inline-flex items-center justify-center">
              <Moon className="w-4 h-4 dark:hidden" />
              <Sun className="w-4 h-4 hidden dark:block" />
            </span>
            {sidebarOpen && <span className="text-sm">Theme</span>}
          </Button>

          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-h-[40px] min-w-[40px] text-muted-foreground hover:text-shopee"
              onClick={() => setHelpOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (press ?)"
            >
              <Command className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size={sidebarOpen ? 'sm' : 'icon'}
          className="w-full justify-start gap-3 min-h-[44px]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span className="text-sm">Collapse</span>}
        </Button>

        <Separator />

        {/* User */}
        <div className={cn('flex items-center gap-3 px-2 py-2', !sidebarOpen && 'justify-center')}>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold">
              {isAuthenticated && user
                ? (user.name || user.email || 'U').slice(0, 2).toUpperCase()
                : 'TV'}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {isAuthenticated && user ? user.name : 'Guest User'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isAuthenticated ? (user?.role === 'admin' ? 'Admin Plan' : 'Affiliate Plan') : 'Not signed in'}
              </span>
            </div>
          )}
          {sidebarOpen && isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-red-600"
              onClick={async () => {
                await logout()
              }}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
          {sidebarOpen && !isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 min-h-[44px] text-xs bg-shopee/10 text-shopee hover:bg-shopee/20"
              onClick={() => setAuthView('login')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {renderHelpDialog()}
    </aside>
  )
}
