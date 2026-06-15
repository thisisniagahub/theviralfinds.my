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
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'referrals', label: 'Referrals', icon: Users },
  { id: 'hermes', label: 'Hermes AI Hub', icon: Bot, badge: 'AI', color: 'hermes' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen } = useAppStore()
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
          const isHermes = item.color === 'hermes'
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 nav-item-slide relative',
                isActive
                  ? isHermes
                    ? 'bg-hermes/10 text-hermes dark:bg-hermes/20 hermes-glow'
                    : 'bg-shopee/10 text-shopee dark:bg-shopee/20 nav-glow'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 flex-shrink-0',
                isActive && isHermes ? 'text-hermes' : isActive ? 'text-shopee' : ''
              )} />
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.badge && (
                <Badge variant="secondary" className={cn(
                  'ml-auto text-[10px] px-1.5 py-0 border-0',
                  isHermes ? 'bg-hermes/10 text-hermes' : 'bg-shopee/10 text-shopee'
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
            className={sidebarOpen ? 'flex-1 justify-start gap-3' : 'justify-center'}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
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
          className="w-full justify-start gap-3"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span className="text-sm">Collapse</span>}
        </Button>

        <Separator />

        {/* User */}
        <div className={cn('flex items-center gap-3 px-2 py-2', !sidebarOpen && 'justify-center')}>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold">AF</AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">Affiliate Pro</span>
              <span className="text-[10px] text-muted-foreground">Premium Plan</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
