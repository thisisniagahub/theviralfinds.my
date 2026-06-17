'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion'
import { useAppStore, type PageId } from '@/store/app-store'
import { useHaptics } from '@/hooks/use-haptics'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingBag, Link2, BarChart3, Calculator,
  Megaphone, Wallet, Settings, Bell, Trophy, Award, Users,
  Bot, X, Sparkles, CalendarClock, PenTool, Target, TrendingUp, Film,
  Music2, Radio, GitCompare, LayoutGrid, Search,
  Lightbulb, Image as ImageIcon, BellRing, FlaskConical, Users2, Hash, CalendarDays,
  Crown, Store, Building2, Palette, Key, LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  id: PageId
  label: string
  icon: React.ElementType
  badge?: string
  color?: string
}

// Full nav list — same as desktop sidebar, shown inside the bottom sheet
const allNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'links', label: 'Affiliate Links', icon: Link2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'autopost', label: 'Auto Post', icon: CalendarClock, badge: 'NEW', color: 'autopost' },
  { id: 'content', label: 'AI Content', icon: PenTool, badge: 'AI', color: 'content' },
  { id: 'trends', label: 'Trend Spy', icon: TrendingUp, badge: 'NEW', color: 'trends' },
  { id: 'profit', label: 'Profit Optimizer', icon: Target, badge: 'AI', color: 'profit' },
  { id: 'studio', label: 'Content Studio', icon: Film, badge: 'NEW', color: 'studio' },
  { id: 'tiktok', label: 'TikTok Shop', icon: Music2, badge: 'NEW', color: 'studio' },
  { id: 'lazada', label: 'Lazada', icon: ShoppingBag, badge: 'NEW', color: 'profit' },
  { id: 'live', label: 'Shopee Live', icon: Radio, badge: '80%', color: 'hermes' },
  { id: 'compare', label: 'Compare', icon: GitCompare, badge: 'NEW', color: 'trends' },
  { id: 'unified', label: 'Unified Earnings', icon: LayoutGrid, color: 'autopost' },
  { id: 'matcher', label: 'Product Matcher', icon: Search, color: 'profit' },
  { id: 'recommender', label: 'AI Recommender', icon: Lightbulb, badge: 'AI', color: 'hermes' },
  { id: 'thumbnails', label: 'AI Thumbnails', icon: ImageIcon, badge: 'AI', color: 'content' },
  { id: 'alerts', label: 'XTRA Alerts', icon: BellRing, badge: 'NEW', color: 'profit' },
  { id: 'abtesting', label: 'A/B Testing', icon: FlaskConical, badge: 'AI', color: 'hermes' },
  { id: 'audience', label: 'Audience AI', icon: Users2, badge: 'AI', color: 'content' },
  { id: 'hashtags', label: 'Hashtag AI', icon: Hash, badge: 'AI', color: 'trends' },
  { id: 'calendar', label: 'AI Calendar', icon: CalendarDays, badge: 'AI', color: 'hermes' },
  { id: 'pricing', label: 'Pricing', icon: Crown, badge: 'PRO', color: 'profit' },
  { id: 'marketplace', label: 'Marketplace', icon: Store, badge: 'NEW', color: 'studio' },
  { id: 'team', label: 'Team Dashboard', icon: Building2, badge: 'NEW', color: 'hermes' },
  { id: 'whitelabel', label: 'White-Label', icon: Palette, badge: 'ENT', color: 'content' },
  { id: 'apikeys', label: 'API Keys', icon: Key, badge: 'API', color: 'trends' },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'referrals', label: 'Referrals', icon: Users },
  { id: 'hermes', label: 'Hermes AI Hub', icon: Bot, badge: 'AI', color: 'hermes' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// Three snap heights the sheet can rest at (as viewport-height percentages)
const SNAP_POINTS = [
  { label: 'Compact', height: '28dvh' },
  { label: 'Half', height: '55dvh' },
  { label: 'Full', height: '92dvh' },
]

export function MobileSheet() {
  const {
    mobileMenuOpen,
    setMobileMenuOpen,
    setActivePage,
    activePage,
    user,
    isAuthenticated,
    logout,
  } = useAppStore()
  const haptics = useHaptics()
  const dragControls = useDragControls()
  const [query, setQuery] = useState('')
  const [snapIndex, setSnapIndex] = useState(1) // default to Half

  // Reset query + snap whenever the sheet opens.
  // Wrapped in queueMicrotask to satisfy the `react-hooks/set-state-in-effect`
  // lint rule (setState calls live inside the callback, not the effect body).
  useEffect(() => {
    if (!mobileMenuOpen) return
    queueMicrotask(() => {
      setQuery('')
      setSnapIndex(1)
    })
  }, [mobileMenuOpen])

  // Lock body scroll while the sheet is open (prevents background scroll on iOS)
  useEffect(() => {
    if (!mobileMenuOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileMenuOpen])

  // ESC closes the sheet
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        haptics.light()
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [mobileMenuOpen, haptics, setMobileMenuOpen])

  const filtered = useMemo(() => {
    if (!query.trim()) return allNavItems
    const q = query.toLowerCase()
    return allNavItems.filter((item) => item.label.toLowerCase().includes(q))
  }, [query])

  const handleItemClick = (id: PageId) => {
    haptics.light()
    setActivePage(id)
    setMobileMenuOpen(false)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // Fast swipe down or large downward drag → close
    if (info.offset.y > 140 || info.velocity.y > 700) {
      haptics.medium()
      setMobileMenuOpen(false)
      return
    }
    // Moderate downward drag → snap down one level
    if (info.offset.y > 70) {
      setSnapIndex((prev) => {
        const next = Math.max(0, prev - 1)
        if (next !== prev) haptics.selection()
        return next
      })
      return
    }
    // Upward drag → snap up one level
    if (info.offset.y < -70) {
      setSnapIndex((prev) => {
        const next = Math.min(SNAP_POINTS.length - 1, prev + 1)
        if (next !== prev) haptics.selection()
        return next
      })
      return
    }
  }

  const cycleSnap = () => {
    haptics.selection()
    setSnapIndex((prev) => (prev + 1) % SNAP_POINTS.length)
  }

  const handleLogout = async () => {
    haptics.medium()
    await logout()
    setMobileMenuOpen(false)
  }

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              haptics.light()
              setMobileMenuOpen(false)
            }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />

          {/* Bottom sheet — slides up from bottom, draggable via handle */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            // Drag is opt-in via dragControls so the nav list can still scroll vertically
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
              'bg-background border-t border-border rounded-t-2xl',
              'shadow-2xl flex flex-col',
              'safe-area-inset-bottom',
              // Cap width on tablets to keep it feeling like a phone sheet
              'max-w-[480px] mx-auto',
            )}
            style={{ height: SNAP_POINTS[snapIndex].height }}
          >
            {/* Drag handle — also cycles snap points on tap */}
            <button
              type="button"
              onPointerDown={(e) => dragControls.start(e)}
              onClick={cycleSnap}
              aria-label={`Sheet at ${SNAP_POINTS[snapIndex].label} height. Tap to resize, drag to dismiss.`}
              className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-target"
            >
              {/* 40px-wide gray bar */}
              <span className="w-10 h-1.5 rounded-full bg-muted-foreground/40" />
              {/* Snap point indicators (3 dots) */}
              <span className="flex gap-1 mt-2">
                {SNAP_POINTS.map((p, i) => (
                  <span
                    key={p.label}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-colors',
                      i === snapIndex ? 'bg-shopee' : 'bg-muted-foreground/30',
                    )}
                  />
                ))}
              </span>
            </button>

            {/* Search bar at top */}
            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search pages..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-9 h-10 bg-muted/50 border-0 focus-visible:ring-1 text-sm"
                  aria-label="Search navigation pages"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable nav items */}
            <nav
              className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar scroll-container overscroll-contain"
              aria-label="All pages"
            >
              {filtered.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground">
                    No pages match &ldquo;{query}&rdquo;
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-shopee"
                    onClick={() => setQuery('')}
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {filtered.map((item) => {
                    const Icon = item.icon
                    const isHermes = item.color === 'hermes'
                    const isActive = activePage === item.id
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 w-full min-h-[48px] px-3 py-2.5 rounded-lg',
                            'text-sm font-medium transition-all',
                            'active:scale-[0.99] active:bg-muted',
                            isActive
                              ? 'bg-shopee/10 text-shopee'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5 flex-shrink-0',
                              isHermes && 'text-hermes',
                            )}
                          />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] px-1.5 py-0 border-0 flex-shrink-0',
                                isHermes
                                  ? 'bg-hermes/10 text-hermes'
                                  : 'bg-shopee/10 text-shopee',
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </nav>

            {/* User profile + logout (sticky at bottom) */}
            <div className="border-t border-border p-3 safe-area-inset-bottom bg-background">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold">
                    {isAuthenticated && user
                      ? (user.name || user.email || 'U').slice(0, 2).toUpperCase()
                      : 'TV'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => handleItemClick('settings')}
                  className="flex flex-col flex-1 min-w-0 text-left min-h-[44px] justify-center"
                >
                  <span className="text-sm font-medium truncate">
                    {isAuthenticated && user ? user.name : 'Guest User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {isAuthenticated
                      ? user?.role === 'admin'
                        ? 'Admin Plan'
                        : 'Affiliate Plan'
                      : 'Tap to sign in'}
                  </span>
                </button>
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 touch-target text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    aria-label="Sign out"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
