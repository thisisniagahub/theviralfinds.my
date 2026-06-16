'use client'

import { useAppStore, type PageId } from '@/store/app-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingBag, Link2, BarChart3, Calculator,
  Megaphone, Wallet, Settings, Bell, Trophy, Award, Users,
  Bot, X, Sparkles, CalendarClock, PenTool, Target, TrendingUp, Film,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  id: PageId
  label: string
  icon: React.ElementType
  badge?: string
  color?: string
}

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
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'referrals', label: 'Referrals', icon: Users },
  { id: 'hermes', label: 'Hermes AI Hub', icon: Bot, badge: 'AI', color: 'hermes' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function MobileSheet() {
  const { mobileMenuOpen, setMobileMenuOpen, setActivePage } = useAppStore()

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="p-0 w-72">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-shopee text-white font-bold text-sm">
              TV
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">TheViralFinds</span>
              <span className="text-[10px] text-muted-foreground">Affiliate Manager Pro</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
            {allNavItems.map((item) => {
              const Icon = item.icon
              const isHermes = item.color === 'hermes'
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isHermes && 'text-hermes')} />
                  <span>{item.label}</span>
                  {item.badge && (
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

          {/* User */}
          <div className="p-3 flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold">AF</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">Affiliate Pro</span>
              <span className="text-[10px] text-muted-foreground">Premium Plan</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
