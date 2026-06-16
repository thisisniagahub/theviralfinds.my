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
  ShoppingBag,
  Wifi,
  WifiOff,
  LogOut,
  UserCircle,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useState } from 'react'
import { useRealtimeStore } from '@/store/realtime-store'
import { toast } from 'sonner'

const pageTitles: Record<PageId, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  links: 'Affiliate Links',
  analytics: 'Analytics',
  campaigns: 'Campaigns',
  calculator: 'Commission Calculator',
  earnings: 'Earnings',
  autopost: 'Auto Post',
  content: 'AI Content Generator',
  trends: 'Trend Spy',
  profit: 'Profit Optimizer',
  studio: 'Content Studio',
  hermes: 'Hermes AI Hub',
  achievements: 'Achievements',
  leaderboard: 'Leaderboard',
  referrals: 'Referrals',
  notifications: 'Notifications',
  settings: 'Settings',
}

const SHOPEE_INDICATOR_PAGES: PageId[] = [
  'dashboard',
  'products',
  'links',
  'analytics',
  'earnings',
]

export function AppHeader() {
  const {
    activePage,
    setActivePage,
    setMobileMenuOpen,
    setSidebarOpen,
    sidebarOpen,
    hermesConnected,
    shopeeConnected,
    shopeeDataSource,
    user,
    isAuthenticated,
    setAuthView,
    logout,
  } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()
  const [searchFocused, setSearchFocused] = useState(false)

  // Realtime connection state (drives the green/red dot indicator)
  const realtimeConnected = useRealtimeStore((s) => s.isConnected)
  const realtimeReconnecting = useRealtimeStore((s) => s.isReconnecting)
  const realtimeUnread = useRealtimeStore((s) => s.unreadCount)

  const showShopeeIndicator = SHOPEE_INDICATOR_PAGES.includes(activePage)

  const realtimeTooltipText = realtimeConnected
    ? 'Real-time connected — live notifications active'
    : realtimeReconnecting
      ? 'Reconnecting to real-time service…'
      : 'Real-time disconnected — click to retry'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="flex items-center justify-between h-14 px-4 gap-4">
        {/* Left: Mobile menu + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0 size-11 -ml-2"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
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
            {/* Shopee connection indicator */}
            {showShopeeIndicator && (
              <button
                type="button"
                onClick={() => setActivePage('settings')}
                className="flex items-center gap-1.5 text-[10px] flex-shrink-0 hover:opacity-80 transition-opacity"
                title={shopeeConnected ? 'Shopee API Connected - Click to view settings' : 'Shopee Demo Mode - Click to configure API'}
              >
                <ShoppingBag className="size-3.5 text-muted-foreground" />
                {shopeeConnected ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
                <span className={shopeeConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {shopeeDataSource === 'graphql_api' ? 'Live' : 'Demo'}
                </span>
              </button>
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
            className="md:hidden size-11"
            onClick={() => setActivePage('hermes')}
            aria-label="Open HERMES AI assistant"
          >
            <Bot className="w-5 h-5 text-hermes" />
          </Button>

          {/* Real-time WebSocket connection status indicator */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={realtimeTooltipText}
                  className="flex items-center gap-1.5 px-2 min-h-[44px] min-w-[44px] rounded-md hover:bg-muted transition-colors"
                >
                  <span className="relative flex items-center justify-center">
                    {realtimeConnected ? (
                      <Wifi className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="w-4 h-5 text-red-500" />
                    )}
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-background ${
                        realtimeConnected
                          ? 'bg-emerald-500 animate-pulse'
                          : realtimeReconnecting
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-red-500'
                      }`}
                    />
                  </span>
                  <span
                    className={`hidden sm:inline text-[11px] font-medium ${
                      realtimeConnected
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : realtimeReconnecting
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {realtimeConnected ? 'Live' : realtimeReconnecting ? 'Reconnecting' : 'Offline'}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{realtimeTooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="icon"
            className="relative size-11 sm:size-9"
            onClick={() => setActivePage('notifications')}
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {realtimeUnread > 0 ? (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-shopee text-white text-[9px] font-bold flex items-center justify-center">
                {realtimeUnread > 9 ? '9+' : realtimeUnread}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-shopee" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-11 sm:size-9"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
          >
            <span className="relative w-5 h-5 inline-flex items-center justify-center">
              <Moon className="w-5 h-5 dark:hidden" />
              <Sun className="w-5 h-5 hidden dark:block" />
            </span>
          </Button>

          {/* User menu / Login button */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 min-h-[44px] px-2 rounded-md hover:bg-muted transition-colors"
                  aria-label="Open user menu"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-shopee/10 text-shopee text-xs font-bold">
                      {(user.name || user.email || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal truncate">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setActivePage('settings')}
                  className="cursor-pointer"
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setActivePage('earnings')}
                  className="cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  My Earnings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout()
                    toast.success('You have been signed out.')
                  }}
                  className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="bg-shopee hover:bg-shopee-dark text-white"
              onClick={() => setAuthView('login')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
