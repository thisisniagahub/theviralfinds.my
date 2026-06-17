'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Sparkles, Copy, Loader2, BookOpen, Library,
  Wand2, RefreshCw, Bookmark, Hash, ChevronDown,
  X, ArrowRight, Check, Star, TrendingUp, Zap, Music2,
  Instagram as InstagramIcon, Youtube as YoutubeIcon, Radio, Link2,
  Target, MessageSquare, Eye, Heart, Share2, Lightbulb, Settings2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ============================= Types ============================= */

interface ContentTemplate {
  id: string; name: string; description: string; category: string
  type: string; platform: string; icon: string; template: string; language: string; tone: string
}
interface LibraryItem {
  id: string; type: string; platform: string; niche: string | null
  product: string | null; content: string; language: string; tone: string; isFavorite: boolean; createdAt: string
}

interface Variation {
  id: string
  content: string
  hashtags: string[]
  engagement: number
  ts: number
  isExample?: boolean
  isSaved?: boolean
}

/* ============================= Constants ============================= */

const TYPE_OPTIONS = [
  { value: 'caption', label: 'Caption' },
  { value: 'script', label: 'Video Script' },
  { value: 'hashtags', label: 'Hashtags' },
  { value: 'live_script', label: 'Live Script' },
  { value: 'review', label: 'Review' },
  { value: 'comparison', label: 'Comparison' },
]

const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok', icon: 'tiktok' as const },
  { value: 'instagram', label: 'Instagram', icon: 'instagram' as const },
  { value: 'shopee_live', label: 'Shopee Live', icon: 'shopee_live' as const },
  { value: 'youtube', label: 'YouTube', icon: 'youtube' as const },
  { value: 'facebook', label: 'Facebook', icon: 'facebook' as const },
]

const TONE_OPTIONS = [
  { value: 'manglish', label: 'Manglish', apiTone: 'casual', apiLang: 'manglish', emoji: '🇲🇾' },
  { value: 'professional', label: 'Professional', apiTone: 'professional', apiLang: 'english', emoji: '💼' },
  { value: 'casual', label: 'Casual', apiTone: 'casual', apiLang: 'english', emoji: '😊' },
  { value: 'hype', label: 'Hype', apiTone: 'excited', apiLang: 'manglish', emoji: '🔥' },
  { value: 'educational', label: 'Educational', apiTone: 'professional', apiLang: 'english', emoji: '📚' },
] as const

const EMOJI_DENSITY_OPTIONS = [
  { value: 'none', label: 'None', emoji: '🚫' },
  { value: 'sparse', label: 'Sparse', emoji: '✨' },
  { value: 'moderate', label: 'Moderate', emoji: '🎉' },
  { value: 'heavy', label: 'Heavy', emoji: '🤩' },
] as const

const LENGTH_OPTIONS = [
  { value: 50, label: 'Short', desc: '~50 words' },
  { value: 100, label: 'Medium', desc: '~100 words' },
  { value: 200, label: 'Long', desc: '~200 words' },
] as const

const STATUS_MESSAGES = [
  '🤖 HERMES is analyzing product...',
  '🔍 Researching trending hashtags...',
  '✍️ Writing in Manglish...',
  '🎨 Adding emojis...',
  '✨ Polishing the caption...',
]

const MIN_HOLD_MS = 2500
const MSG_INTERVAL_MS = 500

/* ===== 6 visual template gallery cards ===== */
const TEMPLATE_GALLERY = [
  {
    id: 'tiktok-unboxing',
    name: 'TikTok Unboxing Script',
    platform: 'tiktok' as const,
    type: 'script',
    language: 'manglish', tone: 'hype',
    uses: 1247, rating: 4.8,
    gradient: 'from-pink-500 via-rose-500 to-orange-500',
    icon: '📦',
    blurb: 'Hook → unbox → reaction → CTA. Perfect for first-impression hauls.',
  },
  {
    id: 'ig-carousel-caption',
    name: 'Instagram Carousel Caption',
    platform: 'instagram' as const,
    type: 'caption',
    language: 'manglish', tone: 'casual',
    uses: 892, rating: 4.7,
    gradient: 'from-fuchsia-500 via-pink-500 to-purple-500',
    icon: '🎨',
    blurb: 'Swipeable storytelling caption with hook + value + CTA.',
  },
  {
    id: 'shopee-live-script',
    name: 'Shopee Live Script',
    platform: 'shopee_live' as const,
    type: 'live_script',
    language: 'manglish', tone: 'hype',
    uses: 1543, rating: 4.9,
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    icon: '🛍️',
    blurb: 'Full live selling flow: opening → demo → price reveal → urgency → CTA.',
  },
  {
    id: 'product-comparison',
    name: 'Product Comparison',
    platform: 'instagram' as const,
    type: 'comparison',
    language: 'manglish', tone: 'educational',
    uses: 634, rating: 4.6,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    icon: '⚖️',
    blurb: 'Side-by-side comparison with verdict + use-case recommendations.',
  },
  {
    id: 'raya-promo',
    name: 'Raya Promo',
    platform: 'tiktok' as const,
    type: 'caption',
    language: 'manglish', tone: 'hype',
    uses: 2104, rating: 4.9,
    gradient: 'from-amber-500 via-yellow-500 to-emerald-500',
    icon: '🌙',
    blurb: 'Festive-themed caption with Raya hooks + bundling + flash deal CTA.',
  },
  {
    id: 'flash-sale-alert',
    name: 'Flash Sale Alert',
    platform: 'shopee_live' as const,
    type: 'caption',
    language: 'manglish', tone: 'hype',
    uses: 1089, rating: 4.7,
    gradient: 'from-red-500 via-orange-500 to-amber-500',
    icon: '⚡',
    blurb: 'Urgency-driven price reveal with countdown + scarcity CTA.',
  },
]

/* ===== Example content cards (shown in empty state) ===== */
const EXAMPLE_CARDS = [
  {
    platform: 'tiktok' as const,
    product: 'Xiaomi Robot Vacuum',
    firstLine: 'Walao eh, lantai rumah aku memang tragic sampai aku jumpa ni... 🤖✨',
    hashtags: ['#RacunShopee', '#SmartHome', '#Xiaomi'],
    engagement: 8.7,
  },
  {
    platform: 'instagram' as const,
    product: 'Tudung Bawal Premium',
    firstLine: 'OOTD dari Shopee je tapi orang ingat designer 👀 Lembut gila, confirm grab!',
    hashtags: ['#TudungBawal', '#OOTD', '#RacunShopee'],
    engagement: 9.1,
  },
  {
    platform: 'shopee_live' as const,
    product: 'Instant Pot Duo',
    firstLine: 'Hai semua! Tengok ni — barang yang viral gila, masak apa pun senang! 🍲',
    hashtags: ['#ShopeeLive', '#InstantPot', '#Promosi'],
    engagement: 8.4,
  },
]

const SAMPLE_VARIATION: Variation = {
  id: 'sample-1',
  content: `Walao eh, lantai rumah aku memang tragic sampai aku jumpa ni... 🤖✨

Xiaomi Robot Vacuum ni confirm game changer! Setakat ni aku dah try macam-macam, tapi yang ni memang terer:

✅ Auto-map rumah — tak langgar langsung
✅ Boleh control pakai phone (remote mode best gila)
✅ Senyap, tak ganggu tengok Netflix
✅ Dustbox besar, sekali kosong je seminggu

Harga? Tak sampai RM400 je tau! Compare dengan Dyson yang ribu-ribu... confirm untung.

Link dekat bio, grab sebelum habis stock 🔥

#ad #promosi #RacunShopee #SmartHome #Xiaomi #RobotVacuum`,
  hashtags: ['#ad', '#promosi', '#RacunShopee', '#SmartHome', '#Xiaomi', '#RobotVacuum'],
  engagement: 8.7,
  ts: Date.now(),
  isExample: true,
}

/* ============================= Platform Icons ============================= */

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  if (platform === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.59a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.02z" />
      </svg>
    )
  }
  if (platform === 'instagram') return <InstagramIcon className={className} />
  if (platform === 'youtube') return <YoutubeIcon className={className} />
  if (platform === 'shopee_live') return <Radio className={className} />
  return <MessageSquare className={className} />
}

/* ============================= Helpers ============================= */

function detectPlatformFromUrl(url: string): string | null {
  const u = url.toLowerCase()
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('shopee.com.my') || u.includes('shopee.sg') || u.includes('shopee.')) return 'shopee_live'
  if (u.includes('lazada.com.my') || u.includes('lazada.')) return 'shopee_live' // lazada ≈ live commerce platform
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('facebook.com')) return 'facebook'
  return null
}

function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\p{L}\p{N}_]+/gu) || []
  // dedupe, preserve order
  return Array.from(new Set(matches))
}

function predictEngagement(content: string, platform: string, tone: string): number {
  // Deterministic pseudo-random based on content + platform + tone
  let hash = 0
  const str = content + platform + tone
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  const score = 7.5 + (Math.abs(hash) % 25) / 10 // 7.5 → 9.9
  return Math.round(score * 10) / 10
}

function genId() {
  return `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/* ============================= Sub-components ============================= */

function EmptyStateIllustration() {
  return (
    <motion.svg
      width="180"
      height="160"
      viewBox="0 0 180 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wand-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.55 0.18 280)" />
          <stop offset="100%" stopColor="oklch(0.45 0.18 278)" />
        </linearGradient>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.63 0.22 30)" />
          <stop offset="100%" stopColor="oklch(0.55 0.18 280)" />
        </linearGradient>
      </defs>
      {/* glow background */}
      <motion.circle
        cx="90" cy="80" r="55"
        fill="oklch(0.55 0.18 280 / 0.08)"
        animate={{ r: [50, 58, 50], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* wand body */}
      <motion.g
        initial={{ rotate: -8 }}
        animate={{ rotate: [-8, 6, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '90px 80px' }}
      >
        <rect x="85" y="35" width="10" height="80" rx="3" fill="url(#wand-grad)" />
        <rect x="85" y="35" width="10" height="14" rx="3" fill="oklch(0.63 0.22 30)" />
        <circle cx="90" cy="35" r="9" fill="oklch(0.63 0.22 30)" />
        <circle cx="90" cy="35" r="5" fill="white" opacity="0.6" />
      </motion.g>
      {/* sparkles */}
      <motion.g
        animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '40px 50px' }}
      >
        <path d="M40 40 L43 47 L50 50 L43 53 L40 60 L37 53 L30 50 L37 47 Z" fill="url(#spark-grad)" />
      </motion.g>
      <motion.g
        animate={{ scale: [0.6, 1.05, 0.6], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        style={{ transformOrigin: '140px 60px' }}
      >
        <path d="M140 50 L142 56 L148 58 L142 60 L140 66 L138 60 L132 58 L138 56 Z" fill="oklch(0.63 0.22 30)" />
      </motion.g>
      <motion.g
        animate={{ scale: [0.7, 1.15, 0.7], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        style={{ transformOrigin: '135px 120px' }}
      >
        <path d="M135 115 L137 119 L141 121 L137 123 L135 127 L133 123 L129 121 L133 119 Z" fill="url(#spark-grad)" />
      </motion.g>
      <motion.circle cx="50" cy="120" r="3" fill="oklch(0.55 0.18 280)" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }} />
      <motion.circle cx="155" cy="100" r="2.5" fill="oklch(0.63 0.22 30)" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
    </motion.svg>
  )
}

function PlatformPreview({
  platform,
  product,
  content,
}: {
  platform: string
  product: string
  content: string
}) {
  const firstLine = content.split('\n')[0] || ''
  const shortCaption = firstLine.length > 90 ? firstLine.slice(0, 90) + '…' : firstLine

  if (platform === 'tiktok') {
    return (
      <div className="flex justify-center py-2">
        <div className="relative w-[150px] h-[268px] rounded-[22px] bg-zinc-900 p-1.5 shadow-xl ring-1 ring-zinc-800">
          {/* notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3 bg-zinc-900 rounded-b-[10px] z-20" />
          <div className="relative w-full h-full rounded-[18px] overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500">
            {/* mock video gradient + product name */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/90 text-xs font-semibold text-center px-3 drop-shadow line-clamp-3">{product}</span>
            </div>
            {/* right-side icons (like, comment, share) */}
            <div className="absolute right-1.5 bottom-14 flex flex-col items-center gap-2.5 z-10">
              <div className="flex flex-col items-center">
                <Heart className="h-4 w-4 text-white drop-shadow" />
                <span className="text-[8px] text-white drop-shadow">12K</span>
              </div>
              <div className="flex flex-col items-center">
                <MessageSquare className="h-4 w-4 text-white drop-shadow" />
                <span className="text-[8px] text-white drop-shadow">847</span>
              </div>
              <div className="flex flex-col items-center">
                <Share2 className="h-4 w-4 text-white drop-shadow" />
                <span className="text-[8px] text-white drop-shadow">2.1K</span>
              </div>
            </div>
            {/* caption overlay */}
            <div className="absolute bottom-0 left-0 right-7 p-2 pt-6 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                  <Music2 className="h-2 w-2 text-white" />
                </div>
                <span className="text-[8px] text-white font-medium">@theviralfindsmy</span>
              </div>
              <p className="text-[8px] text-white leading-tight line-clamp-3">{shortCaption}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (platform === 'instagram') {
    return (
      <div className="flex justify-center py-2">
        <div className="w-full max-w-[280px] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-md ring-1 ring-border">
          {/* header */}
          <div className="flex items-center gap-2 p-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 p-[1.5px]">
              <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                <span className="text-[8px] font-bold text-foreground">TVF</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-foreground">theviralfindsmy</p>
              <p className="text-[8px] text-muted-foreground">Sponsored</p>
            </div>
            <span className="text-foreground">⋯</span>
          </div>
          {/* square image area */}
          <div className="aspect-square bg-gradient-to-br from-fuchsia-500 via-pink-500 to-purple-500 flex items-center justify-center relative">
            <span className="text-white text-sm font-bold text-center px-4 drop-shadow line-clamp-3">{product}</span>
            <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5">
              <span className="text-[8px] text-white font-medium">1/1</span>
            </div>
          </div>
          {/* action bar */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <MessageSquare className="h-3.5 w-3.5 text-foreground" />
            <Share2 className="h-3.5 w-3.5 text-foreground" />
            <div className="flex-1" />
            <Bookmark className="h-3.5 w-3.5 text-foreground" />
          </div>
          {/* caption */}
          <div className="px-2 pb-2">
            <p className="text-[9px] text-foreground leading-snug line-clamp-3">
              <span className="font-semibold">theviralfindsmy</span> {shortCaption}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (platform === 'shopee_live') {
    return (
      <div className="flex justify-center py-2">
        <div className="w-full max-w-[320px] bg-zinc-900 rounded-lg overflow-hidden shadow-md">
          {/* live header */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500">
            <span className="bg-white text-orange-600 text-[8px] font-bold px-1.5 py-0.5 rounded">LIVE</span>
            <span className="text-white text-[10px] font-semibold">Shopee Live MY</span>
            <div className="flex-1" />
            <span className="text-white/90 text-[9px] flex items-center gap-0.5">
              <Eye className="h-2.5 w-2.5" /> 2.4K
            </span>
          </div>
          {/* stream area */}
          <div className="relative aspect-video bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center">
            <div className="absolute top-2 left-2 bg-black/40 backdrop-blur rounded-full px-1.5 py-0.5">
              <span className="text-[8px] text-white font-medium">{product}</span>
            </div>
            <div className="text-white text-xs font-bold text-center px-3 drop-shadow line-clamp-2">
              🛍️ {product}
            </div>
            {/* live chat overlay (right side) */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 space-y-0.5">
              <div className="inline-block bg-black/50 backdrop-blur rounded-full px-1.5 py-0.5 max-w-full">
                <span className="text-[7px] text-white truncate">
                  <span className="text-pink-300 font-medium">@user1</span> best gila! 🔥
                </span>
              </div>
              <div className="inline-block bg-black/50 backdrop-blur rounded-full px-1.5 py-0.5 max-w-full">
                <span className="text-[7px] text-white truncate">
                  <span className="text-pink-300 font-medium">@user2</span> grab now!
                </span>
              </div>
            </div>
          </div>
          {/* bottom CTA bar */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-900">
            <div className="flex-1">
              <p className="text-[8px] text-zinc-400">Special price</p>
              <p className="text-[10px] font-bold text-orange-400">RM 39.90</p>
            </div>
            <button className="bg-orange-500 text-white text-[9px] font-bold px-2 py-1 rounded">+ Cart</button>
          </div>
        </div>
      </div>
    )
  }

  if (platform === 'youtube') {
    return (
      <div className="flex justify-center py-2">
        <div className="w-full max-w-[320px] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-md ring-1 ring-border">
          <div className="relative aspect-video bg-gradient-to-br from-red-500 via-rose-500 to-amber-400 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <div className="w-0 h-0 border-l-[10px] border-l-white border-y-[6px] border-y-transparent ml-1" />
              </div>
            </div>
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 rounded px-1 py-0.5">
              <span className="text-[8px] text-white font-medium">3:47</span>
            </div>
          </div>
          <div className="flex gap-2 p-2">
            <div className="w-6 h-6 rounded-full bg-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-foreground line-clamp-2">{product} — Full Review!</p>
              <p className="text-[8px] text-muted-foreground">TheViralFindsMY · 12K views · 2d ago</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // facebook / generic
  return (
    <div className="flex justify-center py-2">
      <div className="w-full max-w-[320px] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-md ring-1 ring-border">
        <div className="flex items-center gap-2 p-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">f</span>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-foreground">TheViralFindsMY</p>
            <p className="text-[8px] text-muted-foreground">Sponsored · 🌐</p>
          </div>
        </div>
        <p className="px-2 pb-2 text-[10px] text-foreground line-clamp-3">{shortCaption}</p>
        <div className="aspect-[1.91/1] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold text-center px-3 drop-shadow line-clamp-2">{product}</span>
        </div>
        <div className="flex items-center justify-around p-1.5 text-muted-foreground">
          <span className="text-[9px] flex items-center gap-0.5"><Heart className="h-3 w-3" /> Like</span>
          <span className="text-[9px] flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> Comment</span>
          <span className="text-[9px] flex items-center gap-0.5"><Share2 className="h-3 w-3" /> Share</span>
        </div>
      </div>
    </div>
  )
}

/* ============================= Main component ============================= */

export function ContentPage() {
  const [tab, setTab] = useState('generator')

  // Form state
  const [product, setProduct] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [niche, setNiche] = useState('')
  const [type, setType] = useState('caption')
  const [platform, setPlatform] = useState('tiktok')
  const [tone, setTone] = useState<string>('manglish')
  const [length, setLength] = useState<number>(100)
  const [emojiDensity, setEmojiDensity] = useState<string>('moderate')
  const [ctaStyle, setCtaStyle] = useState('urgency')
  const [targetAudience, setTargetAudience] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [statusIndex, setStatusIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [variations, setVariations] = useState<Variation[]>([])
  const [activeVariation, setActiveVariation] = useState(0)
  const [showExample, setShowExample] = useState(false)

  // Data
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [library, setLibrary] = useState<LibraryItem[]>([])

  // Refs
  const inputCardRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<boolean>(false)
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])

  /* ---- Data fetching ---- */
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [templRes, libRes] = await Promise.all([
          fetch('/api/content/templates'),
          fetch('/api/content/library'),
        ])
        if (templRes.ok && active) {
          const d = await templRes.json()
          setTemplates(d.templates || [])
        }
        if (libRes.ok && active) {
          const d = await libRes.json()
          setLibrary(d.items || [])
        }
      } catch {
        // silent
      }
    })()
    return () => {
      active = false
      intervalsRef.current.forEach(clearInterval)
      intervalsRef.current = []
    }
  }, [])

  /* ---- Persist variations to localStorage (per session) ---- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hermes-content-variations')
      if (saved) {
        const parsed = JSON.parse(saved) as Variation[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVariations(parsed)
          setActiveVariation(0)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      if (variations.length > 0) {
        localStorage.setItem('hermes-content-variations', JSON.stringify(variations.slice(0, 6)))
      }
    } catch {
      // ignore
    }
  }, [variations])

  /* ---- URL auto-detect ---- */
  const handleUrlChange = (value: string) => {
    setProductUrl(value)
    const detected = detectPlatformFromUrl(value)
    if (detected && detected !== platform) {
      setPlatform(detected)
      toast.info(`Platform auto-detected: ${PLATFORM_OPTIONS.find(p => p.value === detected)?.label || detected}`)
    }
    // try extract product name from URL (slug)
    if (!product && value) {
      try {
        const url = new URL(value)
        const slug = url.pathname.split('/').filter(Boolean).pop() || ''
        const cleaned = slug
          .replace(/[-_]/g, ' ')
          .replace(/\.\w+$/, '')
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim()
        if (cleaned && cleaned.length > 3 && cleaned.length < 80) {
          setProduct(cleaned)
        }
      } catch {
        // not a URL
      }
    }
  }

  /* ---- Generation flow ---- */
  const clearIntervals = () => {
    intervalsRef.current.forEach(clearInterval)
    intervalsRef.current = []
  }

  const runGeneration = useCallback(async () => {
    if (!product) {
      toast.error('Enter a product name')
      inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    cancelRef.current = false
    setGenerating(true)
    setShowExample(false)
    setProgress(0)
    setStatusIndex(0)
    setTab('generator')

    // Start status cycling
    const statusTimer = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length)
    }, MSG_INTERVAL_MS)
    intervalsRef.current.push(statusTimer)

    // Start progress bar (smooth to ~98% over MIN_HOLD_MS, then 100% on completion)
    const progressStart = Date.now()
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - progressStart
      const pct = Math.min(98, (elapsed / MIN_HOLD_MS) * 100)
      setProgress(pct)
    }, 50)
    intervalsRef.current.push(progressTimer)

    // Determine tone → API tone/language
    const toneConfig = TONE_OPTIONS.find(t => t.value === tone) || TONE_OPTIONS[0]

    // Fire the API call (don't await immediately — race against min hold)
    const apiPromise = fetch('/api/content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        product,
        niche: niche || undefined,
        platform,
        language: toneConfig.apiLang,
        tone: toneConfig.apiTone,
      }),
    }).then(r => (r.ok ? r.json() : Promise.reject(r)))

    const minHoldPromise = new Promise(resolve => setTimeout(resolve, MIN_HOLD_MS))

    try {
      const [, data] = await Promise.all([minHoldPromise, apiPromise])
      if (cancelRef.current) return

      const generatedContent: string = data.content || ''
      const hashtags = extractHashtags(generatedContent)
      const engagement = predictEngagement(generatedContent, platform, tone)

      // Add as a new variation (max 3 — replace oldest beyond 3)
      const newVariation: Variation = {
        id: genId(),
        content: generatedContent,
        hashtags,
        engagement,
        ts: Date.now(),
      }
      setVariations(prev => {
        const next = [...prev, newVariation]
        if (next.length > 3) next.shift()
        return next
      })
      setActiveVariation(prev => Math.min(prev + 1, 2))
      setProgress(100)
      toast.success('✨ Caption ready!')
    } catch (err) {
      if (cancelRef.current) return
      const e = err as Response & { json?: () => Promise<{ error?: string }> }
      let msg = 'Failed to generate content'
      try {
        if (e && typeof e.json === 'function') {
          const body = await e.json()
          msg = body.error || msg
        }
      } catch {
        // ignore
      }
      toast.error(msg)
    } finally {
      clearIntervals()
      setGenerating(false)
      // small delay so user sees progress hit 100%
      setTimeout(() => setProgress(0), 400)
    }
  }, [product, niche, type, platform, tone])

  const handleCancel = () => {
    cancelRef.current = true
    clearIntervals()
    setGenerating(false)
    setProgress(0)
    toast.message('Generation cancelled')
  }

  const handleRegenerate = () => {
    runGeneration()
  }

  const handleSeeExample = () => {
    setShowExample(true)
    setVariations(prev => {
      const filtered = prev.filter(v => !v.isExample)
      const next = [...filtered, { ...SAMPLE_VARIATION, id: genId(), ts: Date.now() } as Variation]
      if (next.length > 3) next.shift()
      return next
    })
    setActiveVariation(variations.length >= 3 ? 2 : Math.max(0, variations.length))
    setTab('generator')
    toast.info('Loaded sample caption — try generating your own!')
  }

  const handleUseExample = (idx: number) => {
    const ex = EXAMPLE_CARDS[idx]
    setProduct(ex.product)
    setPlatform(ex.platform)
    setTab('generator')
    toast.success(`Loaded "${ex.product}" — click Generate!`)
    setTimeout(() => {
      inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleUseTemplate = (tpl: typeof TEMPLATE_GALLERY[number]) => {
    setProduct('')
    setType(tpl.type)
    setPlatform(tpl.platform)
    const toneConfig = TONE_OPTIONS.find(t => t.apiLang === tpl.language && t.value === tpl.tone)
    if (toneConfig) setTone(toneConfig.value)
    setTab('generator')
    toast.success(`"${tpl.name}" template applied`)
    setTimeout(() => {
      inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const scrollToInput = () => {
    setTab('generator')
    setTimeout(() => {
      inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  /* ---- Copy / Save ---- */
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleSaveToLibrary = async (variation: Variation) => {
    try {
      const res = await fetch('/api/content/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          platform,
          niche: niche || undefined,
          product,
          content: variation.content,
          language: TONE_OPTIONS.find(t => t.value === tone)?.apiLang || 'manglish',
          tone: TONE_OPTIONS.find(t => t.value === tone)?.apiTone || 'casual',
        }),
      })
      if (res.ok) {
        toast.success('Saved to library!')
        // mark variation as saved in state
        setVariations(prev =>
          prev.map(v => (v.id === variation.id ? { ...v, isSaved: true } : v))
        )
        // refresh library
        const libRes = await fetch('/api/content/library')
        if (libRes.ok) {
          const d = await libRes.json()
          setLibrary(d.items || [])
        }
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const deleteFromLibrary = async (id: string) => {
    try {
      const res = await fetch(`/api/content/library?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Deleted')
        setLibrary(prev => prev.filter(i => i.id !== id))
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const activeVariationData = variations[activeVariation] || null
  const isShowingExample = !!activeVariationData?.isExample
  const hasResult = variations.length > 0 && !!activeVariationData

  /* ============================= Render ============================= */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-hermes" />
          Content Studio
        </h1>
        <p className="text-muted-foreground">
          Generate scroll-stopping content with HERMES AI — built for Malaysian Shopee affiliates.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="generator">
            <Sparkles className="h-4 w-4 mr-1" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="templates">
            <BookOpen className="h-4 w-4 mr-1" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="library">
            <Library className="h-4 w-4 mr-1" />
            Library
            {library.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                {library.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===================== Generator Tab ===================== */}
        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Input form */}
            <Card ref={inputCardRef as never} className="scroll-mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-hermes" />
                  Generate Content
                </CardTitle>
                <CardDescription>
                  Describe what you want — HERMES will craft something special.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product URL with auto-detect */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    Product URL <span className="text-muted-foreground text-xs font-normal">(optional, auto-detects platform)</span>
                  </Label>
                  <Input
                    value={productUrl}
                    onChange={e => handleUrlChange(e.target.value)}
                    placeholder="https://shopee.com.my/product..."
                  />
                  {productUrl && detectPlatformFromUrl(productUrl) && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      Detected: {PLATFORM_OPTIONS.find(p => p.value === detectPlatformFromUrl(productUrl))?.label}
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="cp-product">Product Name</Label>
                  <Input
                    id="cp-product"
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                    placeholder="e.g. Xiaomi Robot Vacuum"
                  />
                </div>

                {/* Niche */}
                <div className="space-y-1.5">
                  <Label htmlFor="cp-niche">Niche / Category</Label>
                  <Input
                    id="cp-niche"
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    placeholder="e.g. Electronics, Beauty, Fashion"
                  />
                </div>

                {/* Type + Platform */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Content Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>
                            <span className="flex items-center gap-2">
                              <PlatformIcon platform={o.icon} className="h-3.5 w-3.5" />
                              {o.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tone — 5 options as pill chips */}
                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONE_OPTIONS.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTone(t.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                          tone === t.value
                            ? 'bg-hermes text-white border-hermes shadow-sm'
                            : 'bg-background text-muted-foreground border-border hover:border-hermes/40 hover:text-foreground'
                        )}
                      >
                        <span className="mr-1">{t.emoji}</span>{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Length</Label>
                    <Badge variant="secondary" className="text-xs">
                      {LENGTH_OPTIONS.find(l => l.value === length)?.label} · {length} words
                    </Badge>
                  </div>
                  <Slider
                    value={[length]}
                    min={50}
                    max={200}
                    step={50}
                    onValueChange={(v) => setLength(v[0])}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                    {LENGTH_OPTIONS.map(l => (
                      <span key={l.value} className={cn(length === l.value && 'text-hermes font-medium')}>
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Emoji density */}
                <div className="space-y-1.5">
                  <Label>Emoji Density</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {EMOJI_DENSITY_OPTIONS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setEmojiDensity(d.value)}
                        className={cn(
                          'py-1.5 rounded-md text-xs font-medium border transition-all flex flex-col items-center gap-0.5',
                          emojiDensity === d.value
                            ? 'bg-shopee/10 text-shopee border-shopee'
                            : 'bg-background text-muted-foreground border-border hover:border-shopee/40'
                        )}
                      >
                        <span className="text-sm">{d.emoji}</span>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced options */}
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Settings2 className="h-3.5 w-3.5" />
                        Advanced options
                      </span>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', advancedOpen && 'rotate-180')} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs"><Hash className="h-3 w-3" /> Hashtag count</Label>
                      <Select defaultValue="auto">
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto (recommended)</SelectItem>
                          <SelectItem value="5">5 hashtags</SelectItem>
                          <SelectItem value="10">10 hashtags</SelectItem>
                          <SelectItem value="15">15 hashtags</SelectItem>
                          <SelectItem value="25">25 hashtags</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs"><Target className="h-3 w-3" /> CTA style</Label>
                      <Select value={ctaStyle} onValueChange={setCtaStyle}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgency">Urgency (Limited time!)</SelectItem>
                          <SelectItem value="curiosity">Curiosity (You won&apos;t believe...)</SelectItem>
                          <SelectItem value="direct">Direct (Buy now)</SelectItem>
                          <SelectItem value="soft">Soft (Check it out)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs"><Eye className="h-3 w-3" /> Target audience</Label>
                      <Input
                        value={targetAudience}
                        onChange={e => setTargetAudience(e.target.value)}
                        placeholder="e.g. Working moms, students, Gen Z"
                        className="h-8 text-xs"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Generate button — shimmer effect */}
                <Button
                  onClick={runGeneration}
                  disabled={generating}
                  className="w-full bg-hermes hover:bg-hermes-dark text-white relative overflow-hidden group"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />HERMES is crafting…</>
                  ) : (
                    <>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <Sparkles className="h-4 w-4 mr-2 relative" />
                      Generate with HERMES
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right: Result / Empty state / Generation animation */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-hermes" />
                    Result
                  </span>
                  {hasResult && !generating && (
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => handleCopy(activeVariationData.content)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy to clipboard</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={generating}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Regenerate variation</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveToLibrary(activeVariationData)}
                            disabled={activeVariationData.isSaved}
                          >
                            <Bookmark className={cn('h-3.5 w-3.5', activeVariationData.isSaved && 'fill-shopee text-shopee')} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{activeVariationData.isSaved ? 'Already saved' : 'Save to library'}</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {/* ===== Generation animation ===== */}
                  {generating && (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8"
                    >
                      <div className="relative rounded-xl bg-gradient-to-br from-hermes/10 via-hermes/5 to-transparent border border-hermes/20 p-6 overflow-hidden">
                        {/* floating sparkles */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {[...Array(6)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute"
                              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
                              animate={{
                                y: [0, -10, 0],
                                opacity: [0.3, 1, 0.3],
                                scale: [0.7, 1.1, 0.7],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: 'easeInOut',
                              }}
                            >
                              <Sparkles className="h-3 w-3 text-hermes" />
                            </motion.div>
                          ))}
                        </motion.div>

                        {/* HERMES orb */}
                        <div className="relative flex flex-col items-center gap-4">
                          <motion.div
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-hermes to-hermes-dark flex items-center justify-center shadow-lg"
                            animate={{
                              scale: [1, 1.08, 1],
                              boxShadow: [
                                '0 0 0 0 oklch(0.55 0.18 280 / 0.4)',
                                '0 0 0 12px oklch(0.55 0.18 280 / 0)',
                                '0 0 0 0 oklch(0.55 0.18 280 / 0)',
                              ],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                          >
                            <Wand2 className="h-7 w-7 text-white" />
                          </motion.div>

                          {/* Typing message */}
                          <div className="text-center min-h-[2rem]">
                            <motion.div
                              key={statusIndex}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25 }}
                              className="text-sm font-medium bg-gradient-to-r from-hermes to-hermes-dark bg-clip-text text-transparent inline-flex items-center"
                            >
                              {STATUS_MESSAGES[statusIndex]}
                              <motion.span
                                className="ml-0.5 inline-block w-[2px] h-4 bg-hermes"
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.7, repeat: Infinity }}
                              />
                            </motion.div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full max-w-sm">
                            <Progress value={progress} className="h-1.5 bg-hermes/10 [&>div]:bg-gradient-to-r [&>div]:from-hermes [&>div]:to-hermes-dark" />
                            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                              <span>HERMES AI working…</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                          </div>

                          {/* Cancel */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ===== Result card ===== */}
                  {!generating && hasResult && activeVariationData && (
                    <motion.div
                      key={`result-${activeVariationData.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {/* Variations tabs */}
                      {variations.length > 1 && (
                        <div className="flex gap-1 border-b pb-2">
                          {variations.map((v, i) => (
                            <button
                              key={v.id}
                              onClick={() => setActiveVariation(i)}
                              className={cn(
                                'px-3 py-1 text-xs font-medium rounded-t-md transition-all relative',
                                i === activeVariation
                                  ? 'text-hermes'
                                  : 'text-muted-foreground hover:text-foreground'
                              )}
                            >
                              Version {i + 1}
                              {v.isExample && <span className="ml-1 text-[9px] text-shopee">sample</span>}
                              {i === activeVariation && (
                                <motion.div
                                  layoutId="var-underline"
                                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-hermes"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Platform preview mock */}
                      <div className="rounded-lg bg-muted/30 border p-3">
                        <PlatformPreview
                          platform={platform}
                          product={product || 'Your Product'}
                          content={activeVariationData.content}
                        />
                      </div>

                      {/* Engagement prediction */}
                      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-shopee/5 border border-shopee/20">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-shopee" />
                          <span className="text-xs text-muted-foreground">Predicted engagement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-shopee">
                            {activeVariationData.engagement.toFixed(1)}/10
                          </span>
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <Star
                                key={s}
                                className={cn(
                                  'h-3 w-3',
                                  s <= Math.round(activeVariationData.engagement / 2)
                                    ? 'fill-shopee text-shopee'
                                    : 'text-muted-foreground/30'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Full caption */}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 p-4 rounded-lg max-h-72 overflow-y-auto custom-scrollbar">
                        {activeVariationData.content}
                      </div>

                      {/* Hashtag chips */}
                      {activeVariationData.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {activeVariationData.hashtags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toast.info(`Searching "${tag}" in trending hashtags…`)}
                              className="inline-flex items-center px-2 py-1 rounded-full bg-hermes/10 hover:bg-hermes/20 text-hermes text-[11px] font-medium transition-colors"
                            >
                              <Hash className="h-2.5 w-2.5 mr-0.5" />
                              {tag.replace('#', '')}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Example banner */}
                      {isShowingExample && (
                        <div className="text-xs text-shopee bg-shopee/5 border border-shopee/20 rounded px-3 py-2 flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5" />
                          This is a sample — generate your own by clicking Generate above!
                        </div>
                      )}

                      {/* Action row (mobile-friendly duplicate) */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(activeVariationData.content)}
                          className="flex-1 min-w-[120px]"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRegenerate}
                          disabled={generating}
                          className="flex-1 min-w-[120px]"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveToLibrary(activeVariationData)}
                          disabled={activeVariationData.isSaved}
                          className="flex-1 min-w-[120px] bg-shopee hover:bg-shopee-dark text-white"
                        >
                          <Bookmark className={cn('h-3.5 w-3.5 mr-1.5', activeVariationData.isSaved && 'fill-white')} />
                          {activeVariationData.isSaved ? 'Saved' : 'Save'}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* ===== Empty state ===== */}
                  {!generating && !hasResult && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-4"
                    >
                      <EmptyStateIllustration />
                      <h3 className="text-lg font-semibold text-center mt-4">
                        Your AI-generated caption will appear here
                      </h3>
                      <p className="text-sm text-muted-foreground text-center mt-1 max-w-sm mx-auto">
                        Pick a template below or describe what you want to create.
                      </p>

                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        <Button onClick={scrollToInput} size="sm" className="bg-hermes hover:bg-hermes-dark text-white">
                          Try generating one <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                        <Button onClick={handleSeeExample} size="sm" variant="outline">
                          <Eye className="h-3.5 w-3.5 mr-1" /> See example
                        </Button>
                      </div>

                      {/* Example content cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6">
                        {EXAMPLE_CARDS.map((ex, idx) => (
                          <motion.div
                            key={ex.product}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.08 }}
                            whileHover={{ y: -3 }}
                            className="group relative rounded-lg border bg-card hover:border-hermes/40 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                            onClick={() => handleUseExample(idx)}
                          >
                            <div className={cn(
                              'h-1.5 w-full',
                              ex.platform === 'tiktok' && 'bg-gradient-to-r from-pink-500 to-rose-500',
                              ex.platform === 'instagram' && 'bg-gradient-to-r from-fuchsia-500 to-purple-500',
                              ex.platform === 'shopee_live' && 'bg-gradient-to-r from-orange-500 to-amber-500',
                            )} />
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-1.5">
                                <div className={cn(
                                  'w-6 h-6 rounded-md flex items-center justify-center text-white',
                                  ex.platform === 'tiktok' && 'bg-pink-500',
                                  ex.platform === 'instagram' && 'bg-fuchsia-500',
                                  ex.platform === 'shopee_live' && 'bg-orange-500',
                                )}>
                                  <PlatformIcon platform={ex.platform} className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-semibold truncate">{ex.product}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                                &ldquo;{ex.firstLine}&rdquo;
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star
                                      key={s}
                                      className={cn(
                                        'h-2.5 w-2.5',
                                        s <= Math.round(ex.engagement / 2)
                                          ? 'fill-shopee text-shopee'
                                          : 'text-muted-foreground/30'
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">{ex.engagement}/10</span>
                              </div>
                            </div>
                            {/* Hover overlay — "Use this template" */}
                            <div className="absolute inset-0 bg-hermes/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-semibold flex items-center gap-1">
                                <Wand2 className="h-3.5 w-3.5" /> Use this template
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===================== Templates Tab (visual gallery) ===================== */}
        <TabsContent value="templates">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Template Gallery</h2>
            <p className="text-sm text-muted-foreground">
              Pick a starting point — each template is crafted for Malaysian Shopee affiliate use cases.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_GALLERY.map((tpl, idx) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                whileHover={{ y: -4 }}
              >
                <Card className="overflow-hidden group h-full hover:shadow-lg hover:border-hermes/30 transition-all">
                  {/* Gradient thumbnail with platform icon */}
                  <div className={cn('relative h-32 bg-gradient-to-br flex items-center justify-center', tpl.gradient)}>
                    <span className="text-4xl drop-shadow-lg">{tpl.icon}</span>
                    <div className="absolute top-2 left-2">
                      <div className="bg-white/20 backdrop-blur rounded-full px-2 py-0.5 flex items-center gap-1">
                        <PlatformIcon platform={tpl.platform} className="h-3 w-3 text-white" />
                        <span className="text-[10px] text-white font-medium">
                          {PLATFORM_OPTIONS.find(p => p.value === tpl.platform)?.label}
                        </span>
                      </div>
                    </div>
                    {/* hover overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(tpl)}
                        className="bg-white text-zinc-900 hover:bg-white/90"
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1" /> Use Template
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm">{tpl.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{tpl.blurb}</p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Zap className="h-3 w-3 text-shopee" />
                          {tpl.uses.toLocaleString()} uses
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-shopee text-shopee" />
                          {tpl.rating}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUseTemplate(tpl)}
                        className="h-7 text-xs text-hermes hover:text-hermes-dark hover:bg-hermes/10"
                      >
                        Use <ArrowRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Bonus: existing API templates */}
          {templates.length > 0 && (
            <>
              <div className="mt-8 mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">More templates from library</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map(t => (
                  <Card
                    key={t.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setProduct('')
                      setType(t.type)
                      setPlatform(t.platform)
                      const matchingTone = TONE_OPTIONS.find(tn => tn.apiLang === t.language && tn.apiTone === t.tone)
                      if (matchingTone) setTone(matchingTone.value)
                      setTab('generator')
                      toast.info(`"${t.name}" template applied`)
                      setTimeout(() => inputCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{t.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                            <Badge variant="outline" className="text-xs">{t.type}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ===================== Library Tab ===================== */}
        <TabsContent value="library">
          {library.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-12">
                <Library className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-sm font-semibold mb-1">No saved content yet</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Generate a caption and click the bookmark icon to save it here.
                </p>
                <Button size="sm" variant="outline" onClick={() => setTab('generator')}>
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Start generating
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {library.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1 mb-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                          <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                          {item.product && (
                            <span className="text-xs text-muted-foreground truncate">{item.product}</span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-3 whitespace-pre-wrap">{item.content}</p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {new Date(item.createdAt).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(item.content)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteFromLibrary(item.id)}
                              className="text-muted-foreground hover:text-rose-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
