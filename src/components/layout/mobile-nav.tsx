'use client'

import { useAppStore, type PageId } from '@/store/app-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  Link2,
  BarChart3,
  Wallet,
  Bot,
  PenTool,
} from 'lucide-react'

const mobileNavItems: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'content', label: 'AI Content', icon: PenTool },
  { id: 'analytics', label: 'Stats', icon: BarChart3 },
  { id: 'earnings', label: 'Wallet', icon: Wallet },
]

export function MobileNav() {
  const { activePage, setActivePage } = useAppStore()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2" role="tablist">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActivePage(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]',
                isActive ? 'text-shopee' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
