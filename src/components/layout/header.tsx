'use client'

import { useAppStore, type PageId } from '@/store/app-store'
import { useTheme } from 'next-themes'
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  Command,
  Sparkles,
  Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

const pageTitles: Record<PageId, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  links: 'Affiliate Links',
  analytics: 'Analytics',
  campaigns: 'Campaigns',
  calculator: 'Commission Calculator',
  earnings: 'Earnings',
  hermes: 'Hermes AI Hub',
  achievements: 'Achievements',
  leaderboard: 'Leaderboard',
  referrals: 'Referrals',
  notifications: 'Notifications',
  settings: 'Settings',
}

export function AppHeader() {
  const { activePage, setActivePage, setMobileMenuOpen, setSidebarOpen, sidebarOpen, hermesConnected } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="flex items-center justify-between h-14 px-4 gap-4">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-foreground truncate">
              {pageTitles[activePage]}
            </h1>
            {activePage === 'hermes' && (
              <Badge variant="secondary" className="bg-hermes/10 text-hermes border-hermes/20 text-[10px] flex-shrink-0">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            )}
            {activePage === 'hermes' && hermesConnected && (
              <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Connected
              </div>
            )}
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search links, products, campaigns..."
              className="pl-9 pr-12 h-9 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setActivePage('hermes')}
          >
            <Bot className="w-5 h-5 text-hermes" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setActivePage('notifications')}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-shopee" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <span className="relative w-5 h-5 inline-flex items-center justify-center">
              <Moon className="w-5 h-5 dark:hidden" />
              <Sun className="w-5 h-5 hidden dark:block" />
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}
