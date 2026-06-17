'use client'

import { useState, useEffect, useId, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
  Bot,
  X,
  ChevronDown,
  Target,
  Sparkles,
  ArrowRight,
  type LucideIcon,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCountUp, formatCountUp } from '@/hooks/use-count-up'

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

type ActivityType = 'conversion' | 'click' | 'payout'

interface ActivityItem {
  id: number
  type: ActivityType
  message: string
  time: string
  amount: string | null
  platform: 'Shopee' | 'TikTok' | 'Lazada'
  thumbnail: string
  thumbnailColor: string
  /** ISO-ish bucket for filter: today / 7d / 30d */
  bucket: 'today' | '7d' | '30d'
}

const platformColor: Record<ActivityItem['platform'], string> = {
  Shopee: 'bg-shopee/10 text-shopee border-shopee/20',
  TikTok: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  Lazada: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
}

const recentActivity: ActivityItem[] = [
  {
    id: 1, type: 'conversion', message: 'Xiaomi Robot Vacuum X10+', time: '2 min ago',
    amount: 'RM 30.00', platform: 'Shopee', thumbnail: 'X',
    thumbnailColor: 'bg-shopee/20 text-shopee', bucket: 'today',
  },
  {
    id: 2, type: 'click', message: '12 new clicks on Anker Soundcore Life Q30', time: '8 min ago',
    amount: null, platform: 'TikTok', thumbnail: 'A',
    thumbnailColor: 'bg-pink-500/20 text-pink-600 dark:text-pink-400', bucket: 'today',
  },
  {
    id: 3, type: 'conversion', message: 'SK-II Facial Treatment Essence', time: '15 min ago',
    amount: 'RM 26.00', platform: 'Lazada', thumbnail: 'S',
    thumbnailColor: 'bg-violet-500/20 text-violet-600 dark:text-violet-400', bucket: 'today',
  },
  {
    id: 4, type: 'click', message: '28 new clicks on Dreame T30 Cordless Vacuum', time: '22 min ago',
    amount: null, platform: 'Shopee', thumbnail: 'D',
    thumbnailColor: 'bg-shopee/20 text-shopee', bucket: 'today',
  },
  {
    id: 5, type: 'conversion', message: 'Philips Air Purifier AC3858', time: '35 min ago',
    amount: 'RM 25.00', platform: 'Shopee', thumbnail: 'P',
    thumbnailColor: 'bg-shopee/20 text-shopee', bucket: 'today',
  },
  {
    id: 6, type: 'payout', message: 'Monthly payout processed', time: '1 hour ago',
    amount: 'RM 4,520.00', platform: 'Shopee', thumbnail: '$',
    thumbnailColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', bucket: 'today',
  },
  {
    id: 7, type: 'click', message: '45 new clicks across all products', time: '2 hours ago',
    amount: null, platform: 'TikTok', thumbnail: 'C',
    thumbnailColor: 'bg-pink-500/20 text-pink-600 dark:text-pink-400', bucket: '7d',
  },
  {
    id: 8, type: 'conversion', message: 'Anker Soundcore Life Q30', time: '3 hours ago',
    amount: 'RM 25.00', platform: 'Lazada', thumbnail: 'A',
    thumbnailColor: 'bg-violet-500/20 text-violet-600 dark:text-violet-400', bucket: '7d',
  },
  {
    id: 9, type: 'conversion', message: 'Dyson V15 Detect', time: '1 day ago',
    amount: 'RM 42.00', platform: 'Shopee', thumbnail: 'D',
    thumbnailColor: 'bg-shopee/20 text-shopee', bucket: '7d',
  },
  {
    id: 10, type: 'click', message: '60 new clicks on Philips Air Purifier', time: '2 days ago',
    amount: null, platform: 'TikTok', thumbnail: 'P',
    thumbnailColor: 'bg-pink-500/20 text-pink-600 dark:text-pink-400', bucket: '7d',
  },
  {
    id: 11, type: 'conversion', message: 'Samsung Galaxy Watch 6', time: '5 days ago',
    amount: 'RM 38.00', platform: 'Lazada', thumbnail: 'S',
    thumbnailColor: 'bg-violet-500/20 text-violet-600 dark:text-violet-400', bucket: '7d',
  },
  {
    id: 12, type: 'conversion', message: 'Apple AirPods Pro 2', time: '12 days ago',
    amount: 'RM 35.00', platform: 'Shopee', thumbnail: 'A',
    thumbnailColor: 'bg-shopee/20 text-shopee', bucket: '30d',
  },
  {
    id: 13, type: 'click', message: '90 new clicks across all products', time: '18 days ago',
    amount: null, platform: 'TikTok', thumbnail: 'C',
    thumbnailColor: 'bg-pink-500/20 text-pink-600 dark:text-pink-400', bucket: '30d',
  },
]

const quickActions = [
  { label: 'Create Link', icon: Link2, color: 'bg-shopee/10 text-shopee' },
  { label: 'New Campaign', icon: Megaphone, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { label: 'View Analytics', icon: BarChart3, color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  { label: 'Quick Boost', icon: Zap, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
]

// ─── Stat Card Data (numeric so we can count-up) ──────────────────────────────

interface StatConfig {
  title: string
  value: number
  prefix: string
  suffix: string
  decimals: number
  trend: number
  trendUp: boolean
  icon: LucideIcon
  color: string
  textColor: string
  sparkData: number[]
}

const stats: StatConfig[] = [
  {
    title: 'Total Earnings',
    value: 12694,
    prefix: 'RM ',
    suffix: '',
    decimals: 0,
    trend: 15.2,
    trendUp: true,
    icon: DollarSign,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    textColor: 'text-violet-600 dark:text-violet-400',
    sparkData: [820, 940, 880, 1120, 1240, 1420, 1380],
  },
  {
    title: 'Total Clicks',
    value: 12847,
    prefix: '',
    suffix: '',
    decimals: 0,
    trend: 12.5,
    trendUp: true,
    icon: MousePointer,
    color: 'bg-shopee/10 text-shopee',
    textColor: 'text-shopee',
    sparkData: [1200, 1450, 1380, 1620, 1750, 1920, 1860],
  },
  {
    title: 'Conversion Rate',
    value: 6.49,
    prefix: '',
    suffix: '%',
    decimals: 2,
    trend: 2.1,
    trendUp: false,
    icon: Percent,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-600 dark:text-amber-400',
    sparkData: [5.8, 6.0, 6.1, 5.9, 6.3, 6.4, 6.49],
  },
  {
    title: 'Active Links',
    value: 47,
    prefix: '',
    suffix: '',
    decimals: 0,
    trend: 8.7,
    trendUp: true,
    icon: Link2,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    sparkData: [32, 35, 38, 40, 42, 45, 47],
  },
]

// ─── Sub-Components ───────────────────────────────────────────────────────────

/** Inline SVG sparkline — 7-day trend mini-chart. Uses currentColor. */
function Sparkline({
  data,
  className,
  strokeWidth = 1.5,
}: {
  data: number[]
  className?: string
  strokeWidth?: number
}) {
  const reactId = useId()
  // Strip the colon chars from useId to make a valid SVG id.
  const gradId = `spark-${reactId.replace(/:/g, '')}`
  const width = 64
  const height = 24

  const { path, areaPath } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', areaPath: '' }
    }
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 2) - 1
      return [x, y] as const
    })
    const p = pts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ')
    return { path: p, areaPath: `${p} L ${width} ${height} L 0 ${height} Z` }
  }, [data])

  if (!path) return null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Animated number wrapper — uses useCountUp + formatCountUp. */
function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1500,
  className,
}: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}) {
  const prefersReduced = useReducedMotion()
  const animated = useCountUp(value, {
    duration,
    decimals,
    enabled: !prefersReduced,
  })
  return (
    <span className={className}>
      {formatCountUp(animated, { prefix, suffix, decimals })}
    </span>
  )
}

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

// ─── Smart Insights Banner (HERMES AI) ────────────────────────────────────────

function SmartInsightsBanner() {
  const prefersReduced = useReducedMotion()
  // Dismiss state is per-day so users see fresh insights each morning.
  const todayKey = new Date().toISOString().slice(0, 10)
  const storageKey = `tvf_insight_dismissed_${todayKey}`
  const [dismissed, setDismissed] = useState(false)

  // Sync dismissed state from localStorage after mount.
  // The setState happens inside a microtask callback (not synchronously
  // in the effect body) so it complies with the project's
  // `react-hooks/set-state-in-effect` lint rule.
  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      try {
        if (
          typeof window !== 'undefined' &&
          window.localStorage.getItem(storageKey) === '1'
        ) {
          setDismissed(true)
        }
      } catch {
        /* ignore (private mode / quota) */
      }
    })
    return () => {
      cancelled = true
    }
  }, [storageKey])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      /* ignore */
    }
  }

  const handleViewDetails = () => {
    toast.success('HERMES insight expanded', {
      description: 'Opening detailed breakdown of your electronics performance…',
    })
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <Card className="border-hermes/30 bg-gradient-to-r from-hermes/10 via-hermes/5 to-transparent overflow-hidden">
          <CardContent className="flex items-start gap-3 py-3 sm:gap-4 sm:py-4">
            {/* HERMES robot icon */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hermes/15">
              <Bot className="h-5 w-5 text-hermes" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hermes/70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-hermes" />
              </span>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-hermes/10 text-hermes border-hermes/20"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  HERMES AI Insight
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Daily intelligence · {todayKey}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                Your{' '}
                <span className="font-semibold text-hermes">electronics links</span>{' '}
                are converting{' '}
                <span className="font-semibold text-emerald-600">23% higher</span>{' '}
                this week. Consider creating more content for the{' '}
                <span className="font-semibold">Xiaomi Robot Vacuum</span> — it&apos;s
                trending in your niche.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-hermes/30 text-hermes hover:bg-hermes/10 hover:text-hermes"
                  onClick={handleViewDetails}
                >
                  View Details
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              aria-label="Dismiss insight"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Animated Stat Card ───────────────────────────────────────────────────────

function StatCard({ stat, index }: { stat: StatConfig; index: number }) {
  const prefersReduced = useReducedMotion()
  const Icon = stat.icon
  const hoverLift = prefersReduced
    ? {}
    : {
        whileHover: { y: -2 },
        transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
      }

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      {...hoverLift}
    >
      <Card className="card-hover group relative overflow-hidden transition-colors hover:border-shopee/40">
        {/* Sparkline in the corner — sits behind the value */}
        <div
          className={cn(
            'pointer-events-none absolute bottom-2 right-2 opacity-60 transition-opacity group-hover:opacity-90',
            stat.textColor
          )}
        >
          <Sparkline data={stat.sparkData} className="h-6 w-16" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-sm font-medium">
            {stat.title}
          </CardDescription>
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              stat.color
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">
            <AnimatedNumber
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              decimals={stat.decimals}
              duration={1500}
            />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <motion.span
              initial={prefersReduced ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 15,
                delay: 0.6 + index * 0.08,
              }}
              className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-xs font-medium',
                stat.trendUp
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}
            >
              {stat.trendUp ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {stat.trend}%
            </motion.span>
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

// ─── Activity Card (shared between inline list and Sheet drawer) ──────────────

function ActivityCard({ activity }: { activity: ActivityItem }) {
  const iconMap: Record<ActivityType, React.ReactNode> = {
    conversion: <ShoppingCart className="h-3.5 w-3.5 text-emerald-500" />,
    click: <MousePointer className="h-3.5 w-3.5 text-shopee" />,
    payout: <DollarSign className="h-3.5 w-3.5 text-violet-500" />,
  }
  return (
    <div className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-accent/50">
      {/* Thumbnail: colored square with first letter */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold',
          activity.thumbnailColor
        )}
      >
        {activity.thumbnail}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug font-medium truncate">
          {activity.message}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{activity.time}</span>
          <span
            className={cn(
              'inline-flex items-center rounded border px-1 py-0 text-[10px] font-medium leading-none',
              platformColor[activity.platform]
            )}
          >
            {activity.platform}
          </span>
          {iconMap[activity.type]}
          {activity.amount && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {activity.amount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Real-Time Activity Feed ──────────────────────────────────────────────────

function RecentActivityList({ onSeeAll }: { onSeeAll: () => void }) {
  const prefersReduced = useReducedMotion()
  // "+RM 30.00" floating text — appears briefly after mount to celebrate
  // the latest conversion in the feed. Re-triggers when the list updates.
  const [floatingAmount, setFloatingAmount] = useState<string | null>(null)

  useEffect(() => {
    const firstConversion = recentActivity.find(
      (a) => a.type === 'conversion' && a.amount
    )
    if (!firstConversion?.amount) return
    let hideTimeout: ReturnType<typeof setTimeout> | null = null
    const showTimeout = setTimeout(() => {
      setFloatingAmount(firstConversion.amount!)
      hideTimeout = setTimeout(() => setFloatingAmount(null), 2200)
    }, 1200)
    return () => {
      clearTimeout(showTimeout)
      if (hideTimeout) clearTimeout(hideTimeout)
    }
  }, [])

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                {/* Live pulsing dot */}
                <span className="relative inline-flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                Recent Activity
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0"
                >
                  Live
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Latest affiliate events in real time
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onSeeAll}
            >
              See All Activity
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {/* Floating "+RM 30.00" celebration text */}
          <AnimatePresence>
            {floatingAmount && (
              <motion.div
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 0, scale: 0.9 }}
                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: -36, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="pointer-events-none absolute right-4 top-0 z-10 select-none text-sm font-bold text-emerald-600 dark:text-emerald-400"
              >
                +{floatingAmount}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
            {recentActivity.slice(0, 8).map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
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

// ─── Activity Drawer (Sheet) ──────────────────────────────────────────────────

function ActivitySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const filtered = (bucket: 'today' | '7d' | '30d') =>
    recentActivity.filter((a) => (bucket === '30d' ? true : a.bucket === bucket || (bucket === '7d' && a.bucket === 'today')))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Activity History
          </SheetTitle>
          <SheetDescription>
            All your recent affiliate events, filterable by time range.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="mt-4 space-y-1">
              {filtered('today').map((a) => (
                <ActivityCard key={a.id} activity={a} />
              ))}
            </TabsContent>
            <TabsContent value="7d" className="mt-4 space-y-1">
              {filtered('7d').map((a) => (
                <ActivityCard key={a.id} activity={a} />
              ))}
            </TabsContent>
            <TabsContent value="30d" className="mt-4 space-y-1">
              {filtered('30d').map((a) => (
                <ActivityCard key={a.id} activity={a} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

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

// ─── Gamified Performance Score ───────────────────────────────────────────────

interface SubScore {
  label: string
  value: number
}

const subScores: SubScore[] = [
  { label: 'Click Rate', value: 85 },
  { label: 'Conversion Rate', value: 72 },
  { label: 'Engagement', value: 68 },
  { label: 'Consistency', value: 81 },
]

function PerformanceScore() {
  const prefersReduced = useReducedMotion()
  const score = 78
  const nextMilestone = 80
  const nextLabel = 'Excellent'

  const radius = 54
  const circumference = 2 * Math.PI * radius
  // Animate stroke from "empty" (full circumference) to filled (offset).
  const targetOffset = circumference - (score / 100) * circumference

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

  const [subScoresOpen, setSubScoresOpen] = useState(false)

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
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
            {/* Animated circular gauge */}
            <div className="relative h-36 w-36">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="var(--shopee)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeLinecap="round"
                  initial={prefersReduced ? false : { strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: targetOffset }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tabular-nums">
                  <AnimatedNumber value={score} duration={1500} />
                </span>
                <span className="text-xs text-muted-foreground">out of 100</span>
              </div>
            </div>

            <Badge
              variant="secondary"
              className={cn('text-sm font-semibold', getScoreColor(score))}
            >
              {getScoreLabel(score)}
            </Badge>

            {/* Next milestone prompt */}
            <div className="w-full rounded-lg border border-shopee/20 bg-shopee/5 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-shopee shrink-0" />
                <span className="font-medium">
                  Next milestone: {nextMilestone}/100 (Good → {nextLabel})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 pl-6">
                Create 3 more links this week to reach {nextLabel} tier.
              </p>
              <div className="mt-2 pl-6">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>{score}</span>
                  <span>{nextMilestone}</span>
                </div>
                <Progress value={(score / nextMilestone) * 100} className="h-1.5" />
              </div>
            </div>

            {/* Expandable sub-scores */}
            <Collapsible
              open={subScoresOpen}
              onOpenChange={setSubScoresOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Breakdown</span>
                  <motion.span
                    animate={{ rotate: subScoresOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2.5">
                {subScores.map((sub, idx) => (
                  <motion.div
                    key={sub.label}
                    initial={prefersReduced ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{sub.label}</span>
                      <span className="font-medium tabular-nums">{sub.value}%</span>
                    </div>
                    <Progress value={sub.value} className="h-1.5" />
                  </motion.div>
                ))}
              </CollapsibleContent>
            </Collapsible>
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
  const [activityOpen, setActivityOpen] = useState(false)

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

        <RecentActivitySkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Smart Insights Banner (HERMES AI) */}
      <SmartInsightsBanner />

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
      <RecentActivityList onSeeAll={() => setActivityOpen(true)} />

      {/* Activity Drawer */}
      <ActivitySheet open={activityOpen} onOpenChange={setActivityOpen} />
    </div>
  )
}

export default DashboardPage
