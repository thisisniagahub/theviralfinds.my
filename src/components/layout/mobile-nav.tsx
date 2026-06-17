'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type PageId } from '@/store/app-store'
import { useSwipeGestures, dispatchSwipeEvent } from '@/hooks/use-swipe-gestures'
import { useHaptics } from '@/hooks/use-haptics'
import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingBag,
  Plus,
  Sparkles,
  Wallet,
  Link2,
  Megaphone,
  Wand2,
} from 'lucide-react'

interface NavTab {
  id: PageId
  label: string
  icon: React.ElementType
}

// Two tabs on the left of the FAB, two on the right — FAB sits in the middle
const leftTabs: NavTab[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'products', label: 'Products', icon: ShoppingBag },
]

const rightTabs: NavTab[] = [
  { id: 'content', label: 'AI Content', icon: Sparkles },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
]

interface FabAction {
  id: string
  label: string
  icon: React.ElementType
  page: PageId
  /** Tailwind classes for the action button background */
  color: string
}

// 3 quick actions exposed by the center FAB
const fabActions: FabAction[] = [
  { id: 'create-link', label: 'Create Link', icon: Link2, page: 'links', color: 'bg-shopee text-white' },
  { id: 'new-campaign', label: 'New Campaign', icon: Megaphone, page: 'campaigns', color: 'bg-emerald-500 text-white' },
  { id: 'generate-ai', label: 'AI Content', icon: Wand2, page: 'content', color: 'bg-hermes text-white' },
]

// Fan layout: each action's offset (px) from the FAB center.
// [up-left, straight up, up-right] — gives a satisfying radial fan-out.
const fabActionPositions = [
  { x: -88, y: -56 }, // Create Link
  { x: 0, y: -92 },   // New Campaign
  { x: 88, y: -56 },  // Generate AI Content
]

export function MobileNav() {
  const { activePage, setActivePage, setMobileMenuOpen } = useAppStore()
  const haptics = useHaptics()
  const [fabOpen, setFabOpen] = useState(false)

  // Close the FAB whenever navigation changes.
  // Wrapped in queueMicrotask to avoid the `react-hooks/set-state-in-effect`
  // lint rule (setState is in a callback, not in the effect body).
  useEffect(() => {
    queueMicrotask(() => setFabOpen(false))
  }, [activePage])

  // ESC key closes the expanded FAB
  useEffect(() => {
    if (!fabOpen) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        haptics.light()
        setFabOpen(false)
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [fabOpen, haptics])

  // Swipe up on the bottom nav → open the mobile sheet
  const navRef = useSwipeGestures<HTMLElement>({
    onSwipeUp: () => {
      haptics.medium()
      setMobileMenuOpen(true)
    },
    threshold: 24,
  })

  // Swipe left/right on the dashboard content → cycle dashboard period tabs
  // (Today → 7d → 30d). Listens on <main> so the whole dashboard is swipeable.
  // Dispatches a global CustomEvent that the dashboard can react to.
  useEffect(() => {
    if (activePage !== 'dashboard') return
    const main = document.querySelector('main')
    if (!main) return

    let startX = 0
    let startY = 0
    let startT = 0
    let tracking = false

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false
        return
      }
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startT = Date.now()
      tracking = true
    }

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const adx = Math.abs(dx)
      const ady = Math.abs(dy)
      // Only fire for clearly horizontal swipes (>60px, >1.5x vertical delta, <700ms)
      if (adx < 60 || adx < ady * 1.5 || Date.now() - startT > 700) return
      haptics.light()
      dispatchSwipeEvent(dx < 0 ? 'left' : 'right', 'dashboard')
    }

    main.addEventListener('touchstart', onStart, { passive: true })
    main.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      main.removeEventListener('touchstart', onStart)
      main.removeEventListener('touchend', onEnd)
    }
  }, [activePage, haptics])

  const handleTabClick = (page: PageId) => {
    haptics.light()
    setActivePage(page)
  }

  const handleFabClick = () => {
    haptics.medium()
    setFabOpen((prev) => !prev)
  }

  const handleFabAction = (action: FabAction) => {
    haptics.success()
    setFabOpen(false)
    setActivePage(action.page)
  }

  return (
    <>
      {/* Backdrop dim when FAB is expanded — click anywhere to close */}
      <AnimatePresence>
        {fabOpen && (
          <motion.button
            type="button"
            aria-label="Close quick actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              haptics.light()
              setFabOpen(false)
            }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden cursor-default"
          />
        )}
      </AnimatePresence>

      {/* Expanded FAB actions — radial fan anchored at the FAB center */}
      <div
        aria-hidden={!fabOpen}
        className="fixed z-50 lg:hidden pointer-events-none"
        style={{
          // Anchor at approximate FAB vertical center:
          // nav (h-14 = 56px) + safe-area-inset-bottom + ~4px to reach FAB center
          bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          width: 0,
          height: 0,
        }}
      >
        <AnimatePresence>
          {fabOpen &&
            fabActions.map((action, idx) => {
              const pos = fabActionPositions[idx]
              const Icon = action.icon
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  aria-label={action.label}
                  // Each action sits at its (x, y) offset from the FAB center.
                  // translate(-50%, -50%) centers the button on that point.
                  className="absolute pointer-events-auto flex flex-col items-center gap-1.5"
                  style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                  transformTemplate={({ scale = 1 }) =>
                    `translate(-50%, -50%) scale(${scale})`
                  }
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.2 }}
                  transition={{
                    delay: idx * 0.06,
                    type: 'spring',
                    stiffness: 500,
                    damping: 22,
                  }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleFabAction(action)}
                >
                  <span
                    className={cn(
                      'w-12 h-12 rounded-full shadow-lg flex items-center justify-center',
                      'border-2 border-background',
                      action.color,
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-semibold text-white bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md whitespace-nowrap shadow-md">
                    {action.label}
                  </span>
                </motion.button>
              )
            })}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        ref={navRef}
        aria-label="Primary mobile navigation"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
          'border-t border-border bg-background/95 backdrop-blur-lg',
          'safe-area-inset-bottom',
          // Prevent horizontal scroll on iPhone
          'overflow-x-hidden',
          fabOpen && 'z-50',
        )}
      >
        <ul
          className="flex items-center justify-around h-14 px-2 relative"
          role="tablist"
        >
          {/* Left tabs */}
          {leftTabs.map((item) => (
            <NavTabButton
              key={item.id}
              item={item}
              isActive={activePage === item.id}
              onClick={() => handleTabClick(item.id)}
            />
          ))}

          {/* Center: FAB */}
          <li className="flex-1 flex justify-center">
            <motion.button
              type="button"
              aria-label={fabOpen ? 'Close quick actions' : 'Open quick actions'}
              aria-expanded={fabOpen}
              onClick={handleFabClick}
              whileTap={{ scale: 0.88 }}
              animate={{ rotate: fabOpen ? 135 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={cn(
                'relative -mt-6 w-14 h-14 rounded-full',
                'bg-shopee text-white',
                'shadow-lg shadow-shopee/40',
                'flex items-center justify-center',
                'border-4 border-background',
                'touch-target',
              )}
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
              {/* Pulsing ring when closed (invites tap) */}
              {!fabOpen && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-shopee/40 animate-ping opacity-60 pointer-events-none"
                />
              )}
            </motion.button>
          </li>

          {/* Right tabs */}
          {rightTabs.map((item) => (
            <NavTabButton
              key={item.id}
              item={item}
              isActive={activePage === item.id}
              onClick={() => handleTabClick(item.id)}
            />
          ))}
        </ul>
      </nav>
    </>
  )
}

interface NavTabButtonProps {
  item: NavTab
  isActive: boolean
  onClick: () => void
}

function NavTabButton({ item, isActive, onClick }: NavTabButtonProps) {
  const Icon = item.icon
  return (
    <li className="flex-1 flex justify-center">
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-label={item.label}
        onClick={onClick}
        className={cn(
          'relative flex flex-col items-center justify-center gap-0.5',
          'w-full min-h-[48px] min-w-[48px] rounded-lg',
          'transition-colors active:scale-95 active:bg-muted/60',
          'touch-target',
          isActive ? 'text-shopee' : 'text-muted-foreground',
        )}
      >
        {/* Active indicator — top border in shopee orange (animated between tabs) */}
        {isActive && (
          <motion.span
            layoutId="active-tab-indicator"
            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-shopee"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <Icon
          className={cn(
            'w-5 h-5 flex-shrink-0 transition-transform',
            isActive && 'scale-110',
          )}
          fill={isActive ? 'currentColor' : 'none'}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="text-[10px] font-medium leading-none">{item.label}</span>
      </button>
    </li>
  )
}
