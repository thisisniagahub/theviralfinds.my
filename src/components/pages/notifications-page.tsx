'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  DollarSign,
  AlertTriangle,
  Info,
  Settings,
  ShoppingCart,
  TrendingUp,
  Gift,
  Clock,
  Shield,
  Megaphone,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = 'system' | 'earnings' | 'alerts'

interface Notification {
  id: string
  type: NotificationType
  icon: typeof Bell
  title: string
  description: string
  timestamp: string
  read: boolean
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'earnings',
    icon: DollarSign,
    title: 'Commission Received',
    description: 'You earned RM 45.90 commission from Xiaomi 14 Ultra purchase.',
    timestamp: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'alerts',
    icon: AlertTriangle,
    title: 'Link Expiring Soon',
    description: 'Your "11.11 Mega Sale" affiliate link expires in 2 days. Renew it now.',
    timestamp: '15 min ago',
    read: false,
  },
  {
    id: '3',
    type: 'earnings',
    icon: TrendingUp,
    title: 'Earnings Milestone',
    description: 'Congratulations! You\'ve reached RM 4,000 in monthly earnings.',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: '4',
    type: 'system',
    icon: Shield,
    title: 'Security Update',
    description: 'Your account password was changed successfully. If this wasn\'t you, contact support.',
    timestamp: '3 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'earnings',
    icon: ShoppingCart,
    title: 'New Conversion',
    description: 'Samsung Galaxy S24 FE was purchased through your link. Pending commission: RM 170.91.',
    timestamp: '5 hours ago',
    read: true,
  },
  {
    id: '6',
    type: 'system',
    icon: Settings,
    title: 'Scheduled Maintenance',
    description: 'The platform will undergo maintenance on March 20, 2:00 AM - 4:00 AM MYT.',
    timestamp: '8 hours ago',
    read: true,
  },
  {
    id: '7',
    type: 'alerts',
    icon: Megaphone,
    title: 'New Campaign Available',
    description: 'Join the "12.12 Year-End Sale" campaign with boosted commission rates up to 15%.',
    timestamp: '1 day ago',
    read: false,
  },
  {
    id: '8',
    type: 'earnings',
    icon: Gift,
    title: 'Referral Bonus',
    description: 'You earned RM 22.50 from your referral Amirul Hakim\'s commissions this week.',
    timestamp: '2 days ago',
    read: true,
  },
]

const typeConfig: Record<NotificationType, { color: string; bgColor: string }> = {
  system: { color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  earnings: { color: 'text-shopee', bgColor: 'bg-shopee/10' },
  alerts: { color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [activeTab, setActiveTab] = useState<string>('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === activeTab)

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            Stay updated with your latest activity
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2 text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="size-4" />
          Mark All Read
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeIn}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {['all', 'unread', 'system', 'earnings', 'alerts'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <Card className="card-hover">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="text-muted-foreground size-10" />
                      <p className="mt-3 text-sm font-medium">No notifications</p>
                      <p className="text-xs text-muted-foreground">
                        You&apos;re all caught up!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                      const cfg = typeConfig[notification.type]
                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                        >
                          <Card
                            className={cn(
                              'card-hover cursor-pointer transition-colors',
                              !notification.read && 'border-shopee/20 bg-shopee/5'
                            )}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CardContent className="flex items-start gap-3 p-4">
                              <div
                                className={cn(
                                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                  cfg.bgColor
                                )}
                              >
                                <notification.icon className={cn('size-4', cfg.color)} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className={cn('text-sm font-medium leading-tight', !notification.read && 'text-foreground')}>
                                      {notification.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                      {notification.description}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2 pt-0.5">
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {notification.timestamp}
                                    </span>
                                    {!notification.read && (
                                      <div className="size-2 rounded-full bg-shopee animate-pulse" />
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="mt-2 text-[10px] capitalize"
                                >
                                  {notification.type}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  )
}
