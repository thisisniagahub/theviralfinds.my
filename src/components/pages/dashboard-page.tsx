'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Percent,
  Plus,
  BarChart3,
  Megaphone,
  Link2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShoppingBag,
  Eye,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const earningsData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`
  return {
    name: dayLabel,
    earnings: Math.round((Math.sin(i / 4) * 40 + 80 + Math.random() * 50) * 100) / 100,
  }
})

const clicksData = Array.from({ length: 14 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (13 - i))
  const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`
  return {
    name: dayLabel,
    clicks: Math.round(Math.sin(i / 3) * 120 + 280 + Math.random() * 100),
  }
})

const topProducts = [
  { id: 1, name: 'Xiaomi Robot Vacuum X10+', clicks: 1842, conversions: 127, earnings: 3810.0, rate: 6.9 },
  { id: 2, name: 'Anker Soundcore Life Q30', clicks: 1534, conversions: 98, earnings: 2450.0, rate: 6.4 },
  { id: 3, name: 'SK-II Facial Treatment Essence', clicks: 1287, conversions: 84, earnings: 2184.0, rate: 6.5 },
  { id: 4, name: 'Dreame T30 Cordless Vacuum', clicks: 1105, conversions: 71, earnings: 1775.0, rate: 6.4 },
  { id: 5, name: 'Philips Air Purifier AC3858', clicks: 978, conversions: 59, earnings: 1475.0, rate: 6.0 },
]

const recentActivity = [
  { id: 1, type: 'conversion', message: 'Conversion from Xiaomi Robot Vacuum X10+', time: '2 min ago', amount: 'RM 30.00' },
  { id: 2, type: 'click', message: '12 new clicks on Anker Soundcore Life Q30', time: '8 min ago', amount: null },
  { id: 3, type: 'conversion', message: 'Conversion from SK-II Facial Treatment Essence', time: '15 min ago', amount: 'RM 26.00' },
  { id: 4, type: 'click', message: '28 new clicks on Dreame T30 Cordless Vacuum', time: '22 min ago', amount: null },
  { id: 5, type: 'conversion', message: 'Conversion from Philips Air Purifier AC3858', time: '35 min ago', amount: 'RM 25.00' },
  { id: 6, type: 'payout', message: 'Monthly payout processed', time: '1 hour ago', amount: 'RM 4,520.00' },
  { id: 7, type: 'click', message: '45 new clicks across all products', time: '2 hours ago', amount: null },
  { id: 8, type: 'conversion', message: 'Conversion from Anker Soundcore Life Q30', time: '3 hours ago', amount: 'RM 25.00' },
]

const quickActions = [
  { label: 'Create Link', icon: Link2, color: 'bg-shopee/10 text-shopee' },
  { label: 'New Campaign', icon: Megaphone, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { label: 'View Analytics', icon: BarChart3, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { label: 'Quick Boost', icon: Zap, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
]

// ─── Stat Card Data ───────────────────────────────────────────────────────────

const stats = [
  {
    title: 'Total Clicks',
    value: '12,847',
    trend: 12.5,
    trendUp: true,
    icon: MousePointer,
    color: 'bg-shopee/10 text-shopee',
  },
  {
    title: 'Total Conversions',
    value: '834',
    trend: 8.3,
    trendUp: true,
    icon: ShoppingCart,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Total Earnings',
    value: 'RM 12,694',
    trend: 15.2,
    trendUp: true,
    icon: DollarSign,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    title: 'Conversion Rate',
    value: '6.49%',
    trend: 2.1,
    trendUp: false,
    icon: Percent,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
]

// ─── Sub-Components ───────────────────────────────────────────────────────────

function WelcomeBanner() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const hour = now.getHours()
  let greeting = 'Good Morning'
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon'
  if (hour >= 17) greeting = 'Good Evening'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="card-hover border-shopee/20 bg-gradient-to-r from-shopee/5 via-shopee/10 to-transparent overflow-hidden">
        <CardContent className="flex items-center gap-4 py-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-shopee/15 animate-float">
            <LayoutDashboard className="h-6 w-6 text-shopee" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              {greeting}, TheViralFindsMY! 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Eye className="mr-1 h-3 w-3" />
                1,247 views today
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <ShoppingBag className="mr-1 h-3 w-3" />
                23 orders today
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatCard({
  stat,
  index,
}: {
  stat: (typeof stats)[0]
  index: number
}) {
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-sm font-medium">
            {stat.title}
          </CardDescription>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', stat.color)}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
          <div className="flex items-center gap-1 mt-1">
            {stat.trendUp ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                stat.trendUp ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {stat.trend}%
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-3 w-36" />
      </CardContent>
    </Card>
  )
}

function EarningsChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Earnings Overview</CardTitle>
          <CardDescription>Last 30 days performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={earningsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--shopee)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--shopee)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `RM${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`RM ${value.toFixed(2)}`, 'Earnings']}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="var(--shopee)"
                strokeWidth={2}
                fill="url(#earningsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ClicksChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Clicks Overview</CardTitle>
          <CardDescription>Last 14 days click data</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={clicksData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [value, 'Clicks']}
              />
              <Bar
                dataKey="clicks"
                fill="var(--shopee)"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36 mb-1" />
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function TopProducts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Top Products</CardTitle>
          <CardDescription>Best performing affiliate products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {topProducts.map((product, idx) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-shopee/10 text-shopee text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <MousePointer className="h-3 w-3" />
                      {product.clicks.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <ShoppingCart className="h-3 w-3" />
                      {product.conversions}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Percent className="h-3 w-3" />
                      {product.rate}%
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-shopee">
                    RM {product.earnings.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TopProductsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28 mb-1" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentActivityList() {
  const iconMap: Record<string, React.ReactNode> = {
    conversion: <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" />,
    click: <MousePointer className="h-3.5 w-3.5 text-shopee" />,
    payout: <DollarSign className="h-3.5 w-3.5 text-violet-500" />,
  }

  const colorMap: Record<string, string> = {
    conversion: 'bg-emerald-500/10 border-emerald-500/20',
    click: 'bg-shopee/10 border-shopee/20',
    payout: 'bg-violet-500/10 border-violet-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest affiliate events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
            {recentActivity.map((activity, idx) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border mt-0.5',
                    colorMap[activity.type] || 'bg-muted border-border'
                  )}
                >
                  {iconMap[activity.type] || <Activity className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{activity.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    {activity.amount && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {activity.amount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 hover:scale-[1.02] transition-transform"
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', action.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function QuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28 mb-1" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceScore() {
  const score = 78

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Average'
    return 'Needs Work'
  }

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500'
    if (s >= 60) return 'text-shopee'
    if (s >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-base">Performance Score</CardTitle>
          <CardDescription>Overall affiliate health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-36 w-36">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--shopee)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{score}</span>
                <span className="text-xs text-muted-foreground">out of 100</span>
              </div>
            </div>
            <div className="text-center">
              <Badge
                variant="secondary"
                className={cn('text-sm font-semibold', getScoreColor(score))}
              >
                {getScoreLabel(score)}
              </Badge>
              <div className="mt-3 w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Click Rate</span>
                  <span className="font-medium">85%</span>
                </div>
                <Progress value={85} className="h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Conversion Rate</span>
                  <span className="font-medium">72%</span>
                </div>
                <Progress value={72} className="h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Earnings Growth</span>
                  <span className="font-medium">78%</span>
                </div>
                <Progress value={78} className="h-1.5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PerformanceScoreSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Skeleton className="h-36 w-36 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="w-full space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {/* Welcome Banner Skeleton */}
        <Card className="border-shopee/20">
          <CardContent className="flex items-center gap-4 py-2">
            <Skeleton className="h-12 w-12 rounded-xl animate-float" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopProductsSkeleton />
          <div className="space-y-4">
            <QuickActionsSkeleton />
            <PerformanceScoreSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} stat={stat} index={idx} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EarningsChart />
        <ClicksChart />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <TopProducts />

        {/* Right Column: Quick Actions + Performance */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <QuickActions />
          <PerformanceScore />
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <RecentActivityList />
    </div>
  )
}

export default DashboardPage
