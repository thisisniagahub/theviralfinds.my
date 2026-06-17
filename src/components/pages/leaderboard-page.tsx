'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Crown,
  Flame,
  TrendingUp,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  leaderboardData,
  badgeMetadata,
  type LeaderboardPeriod,
  type Niche,
  type AffiliateBadge,
} from '@/lib/community/mock-data'
import { TestimonialsCarousel } from '@/components/marketing/testimonials-carousel'
import { CaseStudies } from '@/components/marketing/case-studies'
import { LiveEarningsTicker } from '@/components/marketing/live-earnings-ticker'
import { SecurityBadges } from '@/components/marketing/security-badges'
import { ChangelogWidget } from '@/components/marketing/changelog-widget'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const NICHES: Array<{ id: Niche | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'Electronics', label: 'Electronics' },
  { id: 'Beauty', label: 'Beauty' },
  { id: 'Fashion', label: 'Fashion' },
  { id: 'Home', label: 'Home' },
  { id: 'Food', label: 'Food' },
]

const periodMeta: Record<LeaderboardPeriod, { label: string; sublabel: string }> = {
  week: { label: 'This Week', sublabel: 'Top 100 affiliates for the current week' },
  month: { label: 'This Month', sublabel: 'Top 100 affiliates for the current month' },
  all: { label: 'All Time', sublabel: 'All-time top 100 affiliates on TheViralFindsMY' },
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BadgePill({ badge }: { badge: AffiliateBadge }) {
  const meta = badgeMetadata[badge]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none',
            meta.className,
          )}
        >
          <span aria-hidden>{meta.emoji}</span>
          <span className="hidden sm:inline">{meta.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {meta.tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

function RankChangeIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Minus className="size-3" />
        Same
      </span>
    )
  }
  const positive = change > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-medium',
        positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      )}
    >
      {positive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(change)}
    </span>
  )
}

function PodiumCard({
  entry,
  place,
}: {
  entry: (typeof leaderboardData)['week'][number]
  place: 1 | 2 | 3
}) {
  const isFirst = place === 1
  const isSecond = place === 2
  const isFirstRank = entry.rank === 1

  const crownClass = isFirstRank
    ? 'text-amber-500'
    : entry.rank === 2
    ? 'text-slate-400'
    : 'text-orange-700'

  const accentBg = isFirstRank
    ? 'from-amber-500/20 to-amber-500/5 border-amber-500/30'
    : entry.rank === 2
    ? 'from-slate-400/20 to-slate-400/5 border-slate-400/30'
    : 'from-orange-700/20 to-orange-700/5 border-orange-700/30'

  const podiumBar = isFirstRank ? 'bg-amber-500/40' : entry.rank === 2 ? 'bg-slate-400/40' : 'bg-orange-700/40'
  const podiumHeight = isFirstRank ? 'h-24' : 'h-16'

  const avatarSize = isFirstRank ? 'size-16' : 'size-12'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (place - 1) * 0.12, duration: 0.45 }}
      className={cn('flex flex-col items-center', isFirst && 'sm:-mt-6')}
    >
      {/* Crown for #1 */}
      {isFirstRank && (
        <Crown className={cn('mb-1 size-6 drop-shadow-sm', crownClass)} aria-hidden />
      )}

      {/* Avatar */}
      <div className="relative">
        <Avatar className={cn(avatarSize, 'border-2 border-background shadow-md')}>
          <AvatarFallback
            className={cn(
              'text-sm font-bold',
              isFirstRank ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-muted',
            )}
          >
            {entry.isYou ? 'YO' : `#${entry.affiliateId.slice(-2)}`}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm',
            isFirstRank ? 'bg-amber-500' : entry.rank === 2 ? 'bg-slate-400' : 'bg-orange-700',
          )}
        >
          {entry.rank}
        </div>
      </div>

      {/* Name + niche */}
      <p
        className={cn(
          'mt-2 text-center text-sm font-semibold',
          entry.isYou && 'text-shopee',
        )}
      >
        {entry.anonymousName}
      </p>
      <Badge variant="outline" className="mt-1 text-[10px]">
        {entry.niche}
      </Badge>

      {/* Earnings range */}
      <p className="mt-1.5 text-sm font-bold text-shopee">{entry.earningsRange}</p>

      {/* Badges row */}
      <div className="mt-2 flex max-w-[140px] flex-wrap items-center justify-center gap-1">
        {entry.badges.slice(0, 4).map((b) => (
          <BadgePill key={b} badge={b} />
        ))}
      </div>

      {/* Podium bar */}
      <div
        className={cn(
          'mt-3 w-20 rounded-t-lg bg-gradient-to-b sm:w-28',
          accentBg,
          'border border-b-0',
          podiumHeight,
        )}
      >
        <div className={cn('h-full w-full rounded-t-lg', podiumBar)} />
      </div>
    </motion.div>
  )
}

function LeaderboardRow({
  entry,
  period,
}: {
  entry: (typeof leaderboardData)['week'][number]
  period: LeaderboardPeriod
}) {
  const isFirstRank = entry.rank === 1
  const isSecondRank = entry.rank === 2
  const isThirdRank = entry.rank === 3

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'grid grid-cols-[40px_1fr] gap-3 px-3 py-2.5 sm:grid-cols-[60px_1.5fr_1fr_1fr_120px_120px] sm:gap-4 sm:px-4',
        entry.isYou && 'bg-shopee/5',
        'border-b border-border/40 last:border-b-0',
        'hover:bg-accent/40 transition-colors',
      )}
    >
      {/* Rank */}
      <div className="flex items-center">
        {isFirstRank || isSecondRank || isThirdRank ? (
          <div
            className={cn(
              'flex size-7 items-center justify-center rounded-full text-xs font-bold',
              isFirstRank
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                : isSecondRank
                ? 'bg-slate-400/15 text-slate-500 dark:text-slate-300'
                : 'bg-orange-700/15 text-orange-700 dark:text-orange-300',
            )}
          >
            {entry.rank}
          </div>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Affiliate name + badges */}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback
              className={cn(
                'text-[10px] font-bold',
                entry.isYou
                  ? 'bg-shopee/15 text-shopee'
                  : isFirstRank
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-muted',
              )}
            >
              {entry.isYou ? 'YO' : `#${entry.affiliateId.slice(-2)}`}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'truncate text-sm',
              entry.isYou ? 'font-semibold text-shopee' : 'font-medium',
            )}
          >
            {entry.anonymousName}
          </span>
          {entry.isYou && (
            <Badge variant="default" className="h-4 shrink-0 px-1 text-[10px]">
              You
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {entry.badges.map((b) => (
            <BadgePill key={b} badge={b} />
          ))}
        </div>
      </div>

      {/* Niche (sm+) */}
      <div className="hidden items-center sm:flex">
        <Badge variant="outline" className="text-[10px]">
          {entry.niche}
        </Badge>
      </div>

      {/* Streak (sm+) */}
      <div className="hidden items-center gap-1 sm:flex">
        {entry.streakDays >= 7 ? (
          <Flame className="size-3.5 text-rose-500" />
        ) : entry.streakDays > 0 ? (
          <Flame className="size-3.5 text-muted-foreground/60" />
        ) : null}
        <span className="text-xs text-muted-foreground">
          {entry.streakDays}d
        </span>
      </div>

      {/* Active links (sm+) */}
      <div className="hidden items-center gap-1 sm:flex">
        <Zap className="size-3.5 text-amber-500" />
        <span className="text-xs text-muted-foreground">
          {entry.activeLinks}
        </span>
      </div>

      {/* Earnings range + rank change */}
      <div className="flex flex-col items-end justify-center gap-0.5 sm:items-end">
        <span className="text-sm font-bold text-shopee">
          {entry.earningsRange}
        </span>
        <RankChangeIndicator change={entry.rankChange} />
        <span className="text-[10px] text-muted-foreground/70 sm:hidden">
          {period === 'week' ? '7d' : period === 'month' ? '30d' : 'all'}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const [niche, setNiche] = useState<Niche | 'all'>('all')
  const [page, setPage] = useState(0)

  const allEntries = leaderboardData[period]

  const filtered = useMemo(() => {
    if (niche === 'all') return allEntries
    return allEntries.filter((e) => e.niche === niche)
  }, [allEntries, niche])

  const top3 = filtered.slice(0, 3)
  const yourEntry = filtered.find((e) => e.isYou) ?? allEntries.find((e) => e.isYou)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageEntries = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  )

  // Podium layout: 2nd, 1st, 3rd
  const podium = [
    top3.find((e) => e.rank === 2),
    top3.find((e) => e.rank === 1),
    top3.find((e) => e.rank === 3),
  ].filter(Boolean) as typeof top3

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            {periodMeta[period].sublabel}
          </p>
        </div>
        <ChangelogWidget compact />
      </motion.div>

      {/* Live ticker */}
      <motion.div {...fadeIn}>
        <LiveEarningsTicker />
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeIn} className="space-y-3">
        {/* Period tabs */}
        <Tabs value={period} onValueChange={(v) => { setPeriod(v as LeaderboardPeriod); setPage(0) }}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Niche filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Niche:
          </span>
          {NICHES.map((n) => (
            <Button
              key={n.id}
              size="sm"
              variant={niche === n.id ? 'default' : 'outline'}
              className={cn(
                'h-7 px-2.5 text-xs',
                niche === n.id && 'bg-shopee hover:bg-shopee-dark text-white',
              )}
              onClick={() => { setNiche(n.id); setPage(0) }}
            >
              {n.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Your Rank card */}
      {yourEntry && (
        <motion.div {...fadeIn}>
          <Card className="border-shopee/30 bg-gradient-to-r from-shopee/10 via-shopee/5 to-transparent card-hover">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-shopee/15">
                  <Trophy className="size-5 text-shopee" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Your Rank
                  </p>
                  <p className="text-2xl font-bold text-shopee">
                    #{yourEntry.rank}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{yourEntry.anonymousName}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {yourEntry.niche}
                  </Badge>
                  <span className="text-sm font-bold text-shopee">
                    {yourEntry.earningsRange}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {yourEntry.activeLinks} active links · {yourEntry.streakDays}-day streak · {yourEntry.conversions} conversions ({yourEntry.conversionRate}%)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 px-3 py-1.5 text-center dark:bg-emerald-950/40">
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <ArrowUp className="size-3.5" />
                    <span className="text-sm font-bold">
                      {Math.abs(yourEntry.rankChange)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">from last period</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Podium - Top 3 */}
      {top3.length === 3 && (
        <motion.div {...fadeIn}>
          <Card className="overflow-hidden card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="size-4 text-amber-500" />
                Top 3 {periodMeta[period].label}
              </CardTitle>
              <CardDescription>
                The cream of the crop — Malaysia&apos;s top Shopee affiliates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-3 px-2 pt-6 pb-2 sm:gap-8 sm:px-8">
                {podium.map((entry, i) => (
                  <PodiumCard
                    key={entry.rank}
                    entry={entry}
                    place={(i + 1) as 1 | 2 | 3}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Full Leaderboard Table */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-shopee" />
                Full Rankings
              </CardTitle>
              <CardDescription>
                {filtered.length} affiliates · page {currentPage + 1} of {totalPages}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {/* Desktop header */}
            <div className="hidden grid-cols-[60px_1.5fr_1fr_1fr_120px_120px] gap-4 border-b border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
              <span>Rank</span>
              <span>Affiliate</span>
              <span>Niche</span>
              <span>Streak</span>
              <span>Active Links</span>
              <span className="text-right">Earnings</span>
            </div>

            {/* Rows */}
            <div className="max-h-[640px] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {pageEntries.map((entry) => (
                  <LeaderboardRow
                    key={`${entry.rank}-${entry.affiliateId}`}
                    entry={entry}
                    period={period}
                  />
                ))}
              </AnimatePresence>
              {pageEntries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Target className="size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm font-medium">No affiliates in this niche yet</p>
                  <p className="text-xs text-muted-foreground">
                    Try another niche or check back next week
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="gap-1.5"
                >
                  <ChevronLeft className="size-3.5" />
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      size="icon"
                      variant={i === currentPage ? 'default' : 'outline'}
                      onClick={() => setPage(i)}
                      className={cn(
                        'size-8 text-xs',
                        i === currentPage && 'bg-shopee hover:bg-shopee-dark text-white',
                      )}
                      aria-label={`Go to page ${i + 1}`}
                      aria-current={i === currentPage ? 'page' : undefined}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="gap-1.5"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Community Spotlight ──────────────────────────────────────────── */}
      <motion.div
        {...fadeIn}
        className="pt-4"
      >
        <div className="mb-6 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-shopee/10 px-3 py-1 text-xs font-medium text-shopee">
            <Sparkles className="size-3" />
            Community Spotlight
          </div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Real Affiliates. Real Earnings.
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Join thousands of Malaysian Shopee affiliates building sustainable income with TheViralFindsMY.
          </p>
        </div>

        {/* Testimonials carousel */}
        <div className="mb-8">
          <TestimonialsCarousel />
        </div>

        {/* Case studies */}
        <div className="mb-8">
          <CaseStudies />
        </div>

        {/* Security badges */}
        <Card className="border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardContent className="flex flex-col items-center gap-3 p-5">
            <div className="text-center">
              <p className="text-sm font-semibold">Your data is safe with us</p>
              <p className="text-xs text-muted-foreground">
                Bank-grade security, verified by industry standards
              </p>
            </div>
            <SecurityBadges variant="row" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default LeaderboardPage
