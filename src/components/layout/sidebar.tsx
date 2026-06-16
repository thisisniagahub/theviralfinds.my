'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppStore, type PageId } from '@/store/app-store'
import { useTheme } from 'next-themes'
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
  LogOut,
  Trophy,
  Award,
  Activity,
  Users,
  Zap,
  Bot,
  Sparkles,
  CalendarClock,
  PenTool,
  Target,
  TrendingUp,
  Film,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface NavItem {
  id: PageId
  label: string
  icon: React.ElementType
  badge?: string
  color?: string
}

const navItems: NavItem[] = [
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
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'referrals', label: 'Referrals', icon: Users },
  { id: 'hermes', label: 'Hermes AI Hub', icon: Bot, badge: 'AI', color: 'hermes' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen, user, isAuthenticated, logout, setAuthView } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border transition-all duration-300 bg-sidebar',
        sidebarOpen ? 'w-64' : 'w-[68px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-shopee text-white font-bold text-sm flex-shrink-0">
          TV
        </div>
        {sidebarOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">TheViralFinds</span>
            <span className="text-[10px] text-muted-foreground">Affiliate Manager Pro</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          const isSpecial = item.color === 'hermes' || item.color === 'autopost' || item.color === 'content' || item.color === 'trends' || item.color === 'profit' || item.color === 'studio'
          const specialColor = item.color === 'hermes' ? 'hermes' : item.color === 'autopost' ? 'emerald' : item.color === 'content' ? 'violet' : item.color === 'trends' ? 'amber' : item.color === 'profit' ? 'rose' : item.color === 'studio' ? 'sky' : 'shopee'
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                'flex items-center gap-3 w-full min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 nav-item-slide relative',
                isActive
                  ? isSpecial
                    ? `bg-${specialColor}/10 text-${specialColor} dark:bg-${specialColor}/20`
                    : 'bg-shopee/10 text-shopee dark:bg-shopee/20 nav-glow'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 flex-shrink-0',
                isActive && isSpecial ? `text-${specialColor}` : isActive ? 'text-shopee' : ''
              )} />
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge && (
                <Badge variant="secondary" className={cn(
                  'ml-auto text-[10px] px-1.5 py-0 border-0',
                  isSpecial ? `bg-${specialColor}/10 text-${specialColor}` : 'bg-shopee/10 text-shopee'
                )}>
                  {item.badge}
                </Badge>
              )}
            </button>
          )
        })}
      </nav>

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
    </aside>
  )
}
