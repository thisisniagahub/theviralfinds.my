'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Bot,
  BarChart3,
  Loader2,
  ChevronRight,
  Shield,
  BadgeCheck,
  Globe,
  Play,
  Check,
  Star,
  Quote,
  ArrowRight,
  Users,
  Link as LinkIcon,
  Wallet,
  Zap,
  Lock as LockIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

// =========================================================================
// COUNT-UP HOOK + COMPONENT
// Animates from 0 → target when scrolled into view. Uses requestAnimationFrame
// so setState happens in an async callback (avoids set-state-in-effect lint).
// =========================================================================
function CountUp({
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
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    let startTs: number | null = null
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  const formatted = display.toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

// =========================================================================
// STATIC DATA
// =========================================================================
const HERO_FLOATING_CARDS = [
  {
    id: 'earnings',
    icon: Wallet,
    label: "Today's Earnings",
    value: 'RM 1,247.50',
    sub: '+18.4% vs yesterday',
    accent: 'bg-shopee text-white',
    className: 'top-8 right-4 sm:right-8',
    delay: 0.2,
  },
  {
    id: 'conversion',
    icon: TrendingUp,
    label: 'Conversion Rate',
    value: '8.7%',
    sub: 'Above category avg',
    accent: 'bg-emerald-500 text-white',
    className: 'bottom-20 left-2 sm:left-0',
    delay: 0.4,
  },
  {
    id: 'ai',
    icon: Bot,
    label: 'HERMES AI',
    value: '12 captions ready',
    sub: 'Manglish-perfect ✓',
    accent: 'bg-hermes text-white',
    className: 'top-32 left-4 sm:left-12',
    delay: 0.6,
  },
  {
    id: 'trend',
    icon: Sparkles,
    label: 'Trending Now',
    value: 'Tudung Bawal',
    sub: '+340% search velocity',
    accent: 'bg-amber-500 text-white',
    className: 'bottom-4 right-4 sm:right-12',
    delay: 0.8,
  },
] as const

const STATS = [
  { value: 47382, prefix: 'RM ', label: 'Earned by affiliates today', decimals: 0 },
  { value: 12847, prefix: '', suffix: '', label: 'Active affiliates', decimals: 0 },
  { value: 2.3, suffix: 'M', label: 'Links generated', decimals: 1 },
  { value: 8.9, prefix: 'RM ', suffix: 'M', label: 'Total payouts', decimals: 1 },
] as const

const CREATOR_LOGOS = [
  { initials: 'AK', name: 'Aisyah K.', color: 'bg-shopee' },
  { initials: 'FH', name: 'Faizal H.', color: 'bg-hermes' },
  { initials: 'NS', name: 'Nadia S.', color: 'bg-emerald-500' },
  { initials: 'RZ', name: 'Razman Z.', color: 'bg-amber-500' },
  { initials: 'YT', name: 'Yusuf T.', color: 'bg-rose-500' },
  { initials: 'ML', name: 'Mei Ling', color: 'bg-teal-500' },
] as const

const TESTIMONIALS = [
  {
    quote:
      'Dalam 2 bulan guna TheViralFindsMY, jualan affiliate saya naik 3x. HERMES AI tulis caption Manglish memang kena piawai — follower saya suka sangat!',
    name: 'Aisyah Karim',
    handle: '@aisyahkicks',
    avatar: 'AK',
    color: 'bg-shopee',
    stat: 'RM 8,500 / month',
  },
  {
    quote:
      "Trend Spy is a game changer. Saya jumpa produk viral seminggu sebelum competitor lain. Last month alone RM 12,300 commission masuk.",
    name: 'Faizal Hashim',
    handle: '@faizalfinds',
    avatar: 'FH',
    color: 'bg-hermes',
    stat: 'RM 12,300 last month',
  },
  {
    quote:
      'As a full-time mom, masa saya sangat limited. AI Content Generator buat caption + hashtags dalam 30 saat. Sekarang saya boleh focus on family and still earn.',
    name: 'Nadia Salleh',
    handle: '@nadiasalleh',
    avatar: 'NS',
    color: 'bg-emerald-500',
    stat: 'RM 6,800 / month',
  },
] as const

const FEATURES = [
  {
    icon: TrendingUp,
    badge: 'Trend Spy',
    title: 'Discover trending products before everyone else',
    desc: 'Heat-map of viral Malaysian products by category, search velocity trends, and seasonality indicators. Know what will blow up next week — today.',
    points: [
      'Real-time trending product feed',
      'Search volume + commission rate history',
      '"About to Blow Up" predictions',
      'Seasonal indicators (Raya, Mega Sale, 11.11)',
    ],
    accent: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Sparkles,
    badge: 'AI Content',
    title: 'Generate Manglish-perfect captions in seconds',
    desc: 'HERMES AI writes captions that sound local — Manglish, BM, mixed. Built for TikTok, IG Carousel, Shopee Live, and comparison posts. One-click copy + hashtag chips.',
    points: [
      'Manglish / BM / English language modes',
      'Platform-specific templates (TikTok, IG, Live)',
      'Smart hashtag suggestions',
      'Save to library + regenerate variations',
    ],
    accent: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: BarChart3,
    badge: 'Analytics',
    title: 'Track every click, conversion, and commission in real-time',
    desc: 'Bank-grade analytics built for affiliates. Live activity feed, sparkline trends, campaign-level ROI, and weekly insights digests delivered to your inbox.',
    points: [
      'Real-time click + conversion tracking',
      '7-day sparkline on every KPI card',
      'Campaign A/B testing built-in',
      'Weekly HERMES insights digest',
    ],
    accent: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
] as const

const PRICING = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    desc: 'For affiliates just getting started',
    features: [
      '100 affiliate links / month',
      'Basic analytics (clicks + conversions)',
      '1 Shopee account',
      'Community support',
    ],
    cta: 'Start Free',
    highlight: false,
    accent: 'border-border',
  },
  {
    name: 'Pro',
    price: 49,
    period: '/month',
    desc: 'For serious affiliates scaling up',
    features: [
      'Unlimited affiliate links',
      'AI Content (50 generations / month)',
      'Trend Spy access',
      'Advanced analytics + sparklines',
      'Email support (24h response)',
    ],
    cta: 'Start Free',
    highlight: true,
    accent: 'border-shopee ring-2 ring-shopee/40',
  },
  {
    name: 'Business',
    price: 149,
    period: '/month',
    desc: 'For power users & small teams',
    features: [
      'Everything in Pro',
      'Unlimited AI Content',
      'Team (3 seats included)',
      'API access',
      'Priority support (4h response)',
    ],
    cta: 'Start Free',
    highlight: false,
    accent: 'border-border',
  },
  {
    name: 'Enterprise',
    price: null,
    period: 'custom',
    desc: 'For agencies & large operations',
    features: [
      'Everything in Business',
      'White-label dashboard',
      'Unlimited seats',
      'Dedicated account manager',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    highlight: false,
    accent: 'border-border',
  },
] as const

const TRUST_BADGES = [
  { icon: LockIcon, label: 'Secured by SSL' },
  { icon: BadgeCheck, label: 'Official Shopee Affiliate Partner' },
  { icon: Shield, label: 'GDPR Compliant' },
  { icon: Globe, label: 'Bank-grade Encryption' },
] as const

// =========================================================================
// HERO SECTION
// =========================================================================
function HeroSection({
  onStartFree,
  onWatchDemo,
}: {
  onStartFree: () => void
  onWatchDemo: () => void
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-shopee/5 via-background to-background">
      {/* Decorative background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-shopee/10 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-hermes/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          {/* Left: Copy + CTAs */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex"
            >
              <Badge
                variant="secondary"
                className="bg-shopee/10 text-shopee border-shopee/20 gap-1 px-3 py-1"
              >
                <Sparkles className="w-3 h-3" />
                AI-Powered · Built for Malaysia 🇲🇾
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-5 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
            >
              The Only AI-Powered Platform Built{' '}
              <span className="bg-gradient-to-r from-shopee to-amber-500 bg-clip-text text-transparent">
                Exclusively for Malaysian Shopee Affiliates
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-5 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Generate Links. Track Earnings. Create Content. All in One Place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                onClick={onStartFree}
                className="bg-shopee hover:bg-shopee-dark text-white h-12 px-7 text-base shadow-lg shadow-shopee/20 transition-transform hover:scale-[1.02]"
              >
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onWatchDemo}
                className="h-12 px-7 text-base border-border hover:bg-muted"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 flex items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Free forever plan
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Cancel anytime
              </div>
            </motion.div>
          </div>

          {/* Right: Animated dashboard mockup with floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative h-[420px] sm:h-[480px] lg:h-[520px]"
          >
            {/* Main dashboard card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-md"
            >
              <Card className="border-border shadow-2xl shadow-shopee/10 overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/40">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShoppingBag className="w-3.5 h-3.5 text-shopee" />
                    app.theviralfindsmy.com
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Good morning,</p>
                      <p className="text-sm font-semibold text-foreground">Aisyah K.</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 hover:bg-emerald-500/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                      Live
                    </Badge>
                  </div>

                  {/* Mini KPIs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Earnings', value: 'RM 1.2k', color: 'text-shopee' },
                      { label: 'Clicks', value: '4,829', color: 'text-foreground' },
                      { label: 'CR', value: '8.7%', color: 'text-emerald-500' },
                    ].map((k) => (
                      <div
                        key={k.label}
                        className="rounded-lg bg-muted/50 p-2.5 text-center"
                      >
                        <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini bar chart */}
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-foreground">7-day trend</p>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="flex items-end gap-1.5 h-16">
                      {[40, 55, 35, 70, 50, 85, 95].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.6, delay: 0.6 + i * 0.08 }}
                          className="flex-1 rounded-t bg-gradient-to-t from-shopee to-amber-400"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Activity row */}
                  <div className="flex items-center gap-2 text-xs">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-shopee text-white text-[10px]">
                        S
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">New commission: RM 12.50</p>
                      <p className="text-muted-foreground text-[10px]">Tudung Bawal · just now</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Floating accent cards */}
            {HERO_FLOATING_CARDS.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                transition={{
                  opacity: { duration: 0.4, delay: card.delay },
                  scale: { duration: 0.4, delay: card.delay },
                  y: {
                    duration: 4 + (card.delay % 1) * 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: card.delay,
                  },
                }}
                className={`absolute ${card.className} z-10`}
              >
                <div className="bg-card/95 backdrop-blur border border-border shadow-xl rounded-xl p-3 flex items-center gap-2.5 min-w-[170px]">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.accent}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
                    <p className="text-sm font-bold text-foreground truncate">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{card.sub}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// =========================================================================
// LIVE STATS TICKER
// =========================================================================
function StatsTicker() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center lg:text-left"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tabular-nums">
                <CountUp
                  value={stat.value}
                  prefix={'prefix' in stat ? (stat.prefix as string) : ''}
                  suffix={'suffix' in stat ? (stat.suffix as string) : ''}
                  decimals={stat.decimals}
                />
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =========================================================================
// SOCIAL PROOF BAND
// =========================================================================
function SocialProofBand() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Creator logos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-3"
        >
          <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Trusted by Malaysian creators & affiliates
          </p>
        </motion.div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-20">
          {CREATOR_LOGOS.map((creator, i) => (
            <motion.div
              key={creator.initials}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm"
            >
              <div
                className={`w-7 h-7 rounded-full ${creator.color} text-white flex items-center justify-center text-[10px] font-bold`}
              >
                {creator.initials}
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground">{creator.name}</span>
              <BadgeCheck className="w-3.5 h-3.5 text-shopee" />
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-10 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
          >
            Affiliates are{' '}
            <span className="text-shopee">cashing in</span>{' '}
            with TheViralFindsMY
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto"
          >
            Real Malaysian affiliates. Real RM. Real results — backed by Shopee-verified seller badges.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <Quote className="w-8 h-8 text-shopee/30" />
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1">{t.quote}</p>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className={`${t.color} text-white text-xs font-bold`}>
                        {t.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                        <BadgeCheck className="w-3.5 h-3.5 text-shopee shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{t.handle}</p>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 self-start">
                    <Wallet className="w-3 h-3" />
                    {t.stat}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =========================================================================
// FEATURE SHOWCASE
// =========================================================================
function FeatureShowcase() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-muted/20 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex"
          >
            <Badge variant="secondary" className="bg-hermes/10 text-hermes border-hermes/20 gap-1">
              <Zap className="w-3 h-3" />
              Built for affiliates, by affiliates
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
          >
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-hermes to-shopee bg-clip-text text-transparent">
              scale your Shopee commissions
            </span>
          </motion.h2>
        </div>

        <div className="space-y-16 sm:space-y-20 lg:space-y-24">
          {FEATURES.map((feature, i) => {
            const reversed = i % 2 === 1
            return (
              <div
                key={feature.badge}
                className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
              >
                {/* Copy */}
                <motion.div
                  initial={{ opacity: 0, x: reversed ? 24 : -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6 }}
                  className={reversed ? 'lg:order-2' : ''}
                >
                  <div className={`inline-flex items-center gap-2 rounded-lg ${feature.bg} ${feature.border} border px-3 py-1.5 mb-4`}>
                    <feature.icon className={`w-4 h-4 ${feature.accent}`} />
                    <span className={`text-xs font-semibold ${feature.accent}`}>{feature.badge}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <div className={`mt-0.5 w-4 h-4 rounded-full ${feature.bg} flex items-center justify-center shrink-0`}>
                          <Check className={`w-2.5 h-2.5 ${feature.accent}`} />
                        </div>
                        <span className="text-sm text-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Visual mock */}
                <motion.div
                  initial={{ opacity: 0, x: reversed ? -24 : 24, scale: 0.96 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={reversed ? 'lg:order-1' : ''}
                >
                  <FeatureMock feature={feature} index={i} />
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FeatureMock({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number]
  index: number
}) {
  return (
    <div className="relative">
      <div className={`absolute -inset-4 rounded-3xl ${feature.bg} blur-2xl opacity-50`} aria-hidden />
      <Card className={`relative border-2 ${feature.border} shadow-xl overflow-hidden`}>
        <CardContent className="p-5 sm:p-6">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${feature.bg} flex items-center justify-center`}>
                <feature.icon className={`w-4 h-4 ${feature.accent}`} />
              </div>
              <span className="text-sm font-semibold text-foreground">{feature.badge}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {index === 0 ? 'LIVE' : index === 1 ? 'BETA' : 'REAL-TIME'}
            </Badge>
          </div>

          {/* Mock content per feature */}
          {index === 0 && (
            // Trend Spy mock: trending product list
            <div className="space-y-2.5">
              {[
                { name: 'Tudung Bawal Premium', trend: '+340%', cat: 'Fashion' },
                { name: 'Kopi Susu Tambun', trend: '+212%', cat: 'Food' },
                { name: 'Baju Kurung Moden', trend: '+187%', cat: 'Fashion' },
                { name: 'Mini Fan Portable', trend: '+156%', cat: 'Gadgets' },
              ].map((p, idx) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5"
                >
                  <div className="w-10 h-10 rounded-md bg-gradient-to-br from-shopee/30 to-amber-400/30 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-shopee" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.cat}</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 hover:bg-emerald-500/10 text-[10px]">
                    {p.trend}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}

          {index === 1 && (
            // AI Content mock: generated caption card
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="w-3.5 h-3.5 text-hermes" />
                HERMES AI · Manglish mode
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-hermes animate-pulse" />
                  Generating...
                </span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-foreground leading-relaxed">
                <p>
                  <span className="font-semibold">WAH BEST GILA! 😍</span> Just grab this Tudung Bawal Premium before sold out — quality memang tip-top, lembut macam sutera 🧕✨
                </p>
                <p className="mt-2 text-muted-foreground">
                  Click link in bio, habis dalam 5 minit confirm hilang 🔥 #ShopeeFinds #TudungBawal #MalaysianCreators
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['#ShopeeFinds', '#TudungBawal', '#Manglish', '#AffiliateMY'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] rounded-full bg-hermes/10 text-hermes px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {index === 2 && (
            // Analytics mock: KPI cards + chart
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Clicks', value: '4,829', change: '+12%' },
                  { label: 'Conversions', value: '421', change: '+8%' },
                  { label: 'Commission', value: 'RM 1.2k', change: '+18%' },
                ].map((k) => (
                  <div key={k.label} className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <p className="text-sm font-bold text-foreground">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
                    <p className="text-[10px] text-emerald-500 mt-0.5">{k.change}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-end gap-1.5 h-20">
                  {[45, 60, 40, 75, 55, 80, 95, 70, 85, 100, 90, 110].map((h, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.04 }}
                      className="flex-1 rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400"
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live · updated 3 seconds ago
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =========================================================================
// PRICING PREVIEW
// =========================================================================
function PricingPreview({ onStartFree }: { onStartFree: () => void }) {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex"
          >
            <Badge variant="secondary" className="bg-shopee/10 text-shopee border-shopee/20 gap-1">
              <Wallet className="w-3 h-3" />
              Simple, transparent pricing
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
          >
            Start free. Upgrade when you{' '}
            <span className="text-shopee">scale.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto"
          >
            No hidden fees. No commission cuts. Cancel anytime — your first 1,000 links are always free.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PRICING.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={tier.highlight ? 'relative lg:-mt-2' : 'relative'}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-shopee text-white border-0 hover:bg-shopee shadow-md gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <Card className={`h-full ${tier.accent} transition-shadow ${tier.highlight ? 'shadow-lg shadow-shopee/10' : 'shadow-sm'}`}>
                <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">{tier.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground min-h-[2.5rem]">{tier.desc}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    {tier.price === null ? (
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">Custom</span>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground">RM</span>
                        <span className="text-3xl sm:text-4xl font-bold text-foreground tabular-nums">
                          {tier.price}
                        </span>
                        <span className="text-xs text-muted-foreground">{tier.period}</span>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={onStartFree}
                    className={`mt-5 w-full h-10 ${
                      tier.highlight
                        ? 'bg-shopee hover:bg-shopee-dark text-white'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>

                  <Separator className="my-5" />

                  <ul className="space-y-2.5 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check
                          className={`mt-0.5 w-3.5 h-3.5 shrink-0 ${
                            tier.highlight ? 'text-shopee' : 'text-emerald-500'
                          }`}
                        />
                        <span className="text-xs text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =========================================================================
// TRUST BADGES
// =========================================================================
function TrustBadges() {
  return (
    <section className="border-t border-border bg-muted/30 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_BADGES.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center gap-3 justify-center lg:justify-start"
            >
              <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 shadow-sm">
                <badge.icon className="w-5 h-5 text-shopee" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground">{badge.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =========================================================================
// AUTH SECTION (existing login form, refactored)
// =========================================================================
function AuthSection() {
  const { login, loginWithProvider, setAuthView } = useAppStore()
  const [email, setEmail] = useState('demo@theviralfindsmy.com')
  const [password, setPassword] = useState('demo123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasGoogle, setHasGoogle] = useState(false)
  const [hasFacebook, setHasFacebook] = useState(false)

  useEffect(() => {
    // Detect which OAuth providers are configured by probing the NextAuth providers endpoint
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/auth/providers')
        if (!r.ok || cancelled) return
        const data = await r.json()
        if (cancelled || !data) return
        const ids = Array.isArray(data) ? data.map((p: { id: string }) => p.id) : []
        setHasGoogle(ids.includes('google'))
        setHasFacebook(ids.includes('facebook'))
      } catch {
        // ignore — providers just unavailable
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.error || 'Login failed.')
      toast.error(result.error || 'Login failed.')
    } else {
      toast.success('Welcome back! Login successful.')
    }
  }

  const handleDemoFill = () => {
    setEmail('demo@theviralfindsmy.com')
    setPassword('demo123')
    toast.info('Demo credentials filled. Click Sign In to continue.')
  }

  const handleDemoLogin = async () => {
    setEmail('demo@theviralfindsmy.com')
    setPassword('demo123')
    setError(null)
    setLoading(true)
    const result = await login('demo@theviralfindsmy.com', 'demo123')
    setLoading(false)
    if (!result.ok) {
      setError(result.error || 'Demo login failed.')
      toast.error(result.error || 'Demo login failed.')
    } else {
      toast.success('Welcome to the demo! Explore freely.')
    }
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-background to-shopee/5">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand badge for mobile + heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-shopee text-white flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-foreground">TheViralFindsMY</h2>
                <p className="text-[10px] text-muted-foreground">Affiliate Manager Pro</p>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Ready to start earning? 👋
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your affiliate dashboard — or continue with a demo account.
            </p>
          </div>

          <Card className="border-border shadow-lg" id="auth-form">
            <CardContent className="p-6 sm:p-8 space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-3 py-2 text-xs"
                >
                  {error}
                </div>
              )}

              {/* Prominent demo login button */}
              <Button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                variant="outline"
                className="w-full h-11 border-shopee/40 bg-shopee/5 hover:bg-shopee/10 text-shopee hover:text-shopee-dark"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Continue with demo account
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
                <Separator className="flex-1" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="demo@theviralfindsmy.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-shopee hover:underline"
                      onClick={() => toast.info('Password reset is coming soon.')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pl-9 pr-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-shopee hover:bg-shopee-dark text-white h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="rounded-lg bg-muted/60 border border-border p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-shopee mb-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Demo credentials
                </p>
                <p>
                  Try:{' '}
                  <span className="font-mono text-foreground">demo@theviralfindsmy.com</span>{' '}
                  / <span className="font-mono text-foreground">demo123</span>
                </p>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="mt-1 text-shopee hover:underline text-xs font-medium"
                >
                  Fill demo credentials →
                </button>
              </div>

              {(hasGoogle || hasFacebook) && (
                <>
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      or continue with
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {hasGoogle && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => loginWithProvider('google')}
                        disabled={loading}
                      >
                        <GoogleIcon className="w-4 h-4 mr-2" />
                        Continue with Google
                      </Button>
                    )}
                    {hasFacebook && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        onClick={() => loginWithProvider('facebook')}
                        disabled={loading}
                      >
                        <FacebookIcon className="w-4 h-4 mr-2" />
                        Continue with Facebook
                      </Button>
                    )}
                  </div>
                </>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthView('register')}
                  className="font-semibold text-shopee hover:underline"
                >
                  Create one now
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

// =========================================================================
// DEMO VIDEO DIALOG
// =========================================================================
function DemoVideoDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-4 h-4 text-shopee" />
            TheViralFindsMY — 60-second demo
          </DialogTitle>
          <DialogDescription>
            See how Malaysian affiliates generate links, track earnings, and create Manglish-perfect content with HERMES AI.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-shopee/20 via-hermes/20 to-amber-500/20 flex items-center justify-center border border-border">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-shopee text-white flex items-center justify-center shadow-lg shadow-shopee/30">
              <Play className="w-7 h-7 ml-1 fill-current" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">Demo video coming soon</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              We&apos;re putting the final polish on a 60-second walkthrough. Meanwhile, click{' '}
              <span className="font-semibold text-shopee">Start Free</span> to explore the live demo.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// =========================================================================
// MAIN LOGIN PAGE — Landing page (pre-auth marketing site)
// =========================================================================
export function LoginPage() {
  const [showDemoVideo, setShowDemoVideo] = useState(false)
  const authRef = useRef<HTMLDivElement>(null)

  const scrollToAuth = () => {
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <HeroSection onStartFree={scrollToAuth} onWatchDemo={() => setShowDemoVideo(true)} />
        <StatsTicker />
        <SocialProofBand />
        <FeatureShowcase />
        <PricingPreview onStartFree={scrollToAuth} />
        <TrustBadges />
        <div ref={authRef} id="auth" className="scroll-mt-4">
          <AuthSection />
        </div>
      </main>

      <footer className="mt-auto border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-shopee text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">TheViralFindsMY</p>
                <p className="text-[10px] text-muted-foreground">
                  Built with ❤️ for Malaysian Shopee Affiliates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToAuth()
                }}
                className="hover:text-shopee transition-colors"
              >
                Sign In
              </a>
              <span aria-hidden>·</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  toast.info('Privacy policy page is coming soon.')
                }}
                className="hover:text-shopee transition-colors"
              >
                Privacy
              </a>
              <span aria-hidden>·</span>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showDemoVideo && <DemoVideoDialog open={showDemoVideo} onOpenChange={setShowDemoVideo} />}
      </AnimatePresence>
    </div>
  )
}

// =========================================================================
// BRAND ICONS (Google + Facebook)
// =========================================================================
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
