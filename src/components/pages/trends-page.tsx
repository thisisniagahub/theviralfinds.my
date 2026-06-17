'use client'

import { useState, useMemo, useCallback, useRef, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  TrendingUp, Flame, Rocket, Crown, Bell, Eye, EyeOff, Trash2,
  Smartphone, Zap, Sparkles, Link2, Wand2, RefreshCw,
  ArrowUp, ArrowRight, ArrowDown, ShieldAlert, Target, Search, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

// ============================================================
// Types
// ============================================================
type VelocityDir = 'up' | 'stable' | 'down'
type Competition = 'Low' | 'Medium' | 'High'
type TrendTab = 'trending' | 'emerging' | 'steady'
type AlertType = 'commission_increase' | 'daily_digest' | 'spike_push'

interface AlertItem {
  id: string
  productId: string
  productName: string
  type: AlertType
  enabled: boolean
  createdAt: number
}

interface TrendProduct {
  id: string
  name: string
  category: string
  emoji: string
  commissionRate: number
  velocity: number
  velocityDir: VelocityDir
  competition: Competition
  competitorCount: number
  sparkline7d: number[]
  commissionHistory: { day: string; rate: number }[]
  searchVolume7d: { day: string; vol: number }[]
  season?: string
  whyTrending: string
  priceRange: string
  monthlySearch: string
  tab: TrendTab
  competitors: string[]
}

// ============================================================
// 12 Categories (per P1-d spec)
// ============================================================
const CATEGORIES = [
  { id: 'Electronics', emoji: '📱' },
  { id: 'Beauty', emoji: '💄' },
  { id: 'Fashion', emoji: '👗' },
  { id: 'Home', emoji: '🏠' },
  { id: 'Food', emoji: '🍜' },
  { id: 'Baby', emoji: '🍼' },
  { id: 'Sports', emoji: '⚽' },
  { id: 'Gaming', emoji: '🎮' },
  { id: 'Auto', emoji: '🚗' },
  { id: 'Books', emoji: '📚' },
  { id: 'Health', emoji: '💊' },
  { id: 'Pets', emoji: '🐾' },
] as const

const TAB_META: Record<TrendTab, { label: string; icon: typeof Flame; description: string; accent: string }> = {
  trending: {
    label: 'Trending Now',
    icon: Flame,
    description: 'Velocity > 50% — moving fast right now',
    accent: 'text-red-600',
  },
  emerging: {
    label: 'About to Blow Up',
    icon: Rocket,
    description: 'Velocity 20–50%, low competition — get in early',
    accent: 'text-amber-600',
  },
  steady: {
    label: 'Steady Earners',
    icon: Crown,
    description: 'High commission, stable demand — reliable income',
    accent: 'text-emerald-600',
  },
}

const ALERT_LABELS: Record<AlertType, { label: string; icon: typeof Bell; desc: string }> = {
  commission_increase: {
    label: 'Notify me when commission increases',
    icon: Bell,
    desc: 'Email alert when the commission rate goes up',
  },
  daily_digest: {
    label: 'Daily trending digest at 9 AM',
    icon: Smartphone,
    desc: 'Morning summary of top trending products',
  },
  spike_push: {
    label: 'Push notification for sudden spikes',
    icon: Zap,
    desc: 'Instant push when velocity spikes > 100%',
  },
}

// ============================================================
// Mock Data — 24 Malaysian products across 12 categories
// ============================================================
const PRODUCTS: TrendProduct[] = [
  // ---------- Electronics ----------
  {
    id: 'p-1', name: 'Xiaomi Robot Vacuum Mop 2 Pro', category: 'Electronics', emoji: '🤖',
    commissionRate: 6.8, velocity: 78, velocityDir: 'up', competition: 'Medium',
    competitorCount: 18, monthlySearch: '142K',
    sparkline7d: [40, 45, 52, 58, 64, 72, 78],
    commissionHistory: [{day:'Mon',rate:5.8},{day:'Tue',rate:6.0},{day:'Wed',rate:6.2},{day:'Thu',rate:6.4},{day:'Fri',rate:6.5},{day:'Sat',rate:6.7},{day:'Sun',rate:6.8}],
    searchVolume7d: [{day:'Mon',vol:18200},{day:'Tue',vol:19400},{day:'Wed',vol:21050},{day:'Thu',vol:22800},{day:'Fri',vol:24300},{day:'Sat',vol:26100},{day:'Sun',vol:28800}],
    season: 'Year-round — peaks during 11.11 & 12.12 mega sales',
    whyTrending: 'Xiaomi Malaysia restocked. Viral TikTok unboxing reviews driving massive search. Smart home adoption accelerating in Klang Valley.',
    priceRange: 'RM 549 - RM 899', tab: 'trending',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318'],
  },
  {
    id: 'p-2', name: 'Anker Soundcore TWS Earbuds Life Note 3', category: 'Electronics', emoji: '🎧',
    commissionRate: 5.2, velocity: 8, velocityDir: 'stable', competition: 'High',
    competitorCount: 42, monthlySearch: '210K',
    sparkline7d: [62, 60, 63, 58, 61, 59, 60],
    commissionHistory: [{day:'Mon',rate:5.0},{day:'Tue',rate:5.1},{day:'Wed',rate:5.0},{day:'Thu',rate:5.2},{day:'Fri',rate:5.1},{day:'Sat',rate:5.2},{day:'Sun',rate:5.2}],
    searchVolume7d: [{day:'Mon',vol:28000},{day:'Tue',vol:29500},{day:'Wed',vol:30100},{day:'Thu',vol:31200},{day:'Fri',vol:32800},{day:'Sat',vol:33400},{day:'Sun',vol:34100}],
    season: 'Year-round steady',
    whyTrending: 'Anker is the established leader. Saturated but reliable. Steady 5% commission has held for 6 months.',
    priceRange: 'RM 129 - RM 249', tab: 'steady',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318', 'Affiliate #5520', 'Affiliate #6712'],
  },
  // ---------- Beauty ----------
  {
    id: 'p-3', name: 'Safi Balqis UV Sunblock SPF50 PA+++', category: 'Beauty', emoji: '🧴',
    commissionRate: 9.5, velocity: 64, velocityDir: 'up', competition: 'Low',
    competitorCount: 12, monthlySearch: '88K',
    sparkline7d: [28, 35, 42, 48, 55, 60, 64],
    commissionHistory: [{day:'Mon',rate:8.5},{day:'Tue',rate:8.8},{day:'Wed',rate:9.0},{day:'Thu',rate:9.1},{day:'Fri',rate:9.3},{day:'Sat',rate:9.4},{day:'Sun',rate:9.5}],
    searchVolume7d: [{day:'Mon',vol:9200},{day:'Tue',vol:10100},{day:'Wed',vol:11400},{day:'Thu',vol:12800},{day:'Fri',vol:13600},{day:'Sat',vol:14900},{day:'Sun',vol:16200}],
    season: 'Year-round — surges during haze & dry season (Feb-Apr)',
    whyTrending: 'Local halal brand going viral. K-beauty alternative for humid Malaysian climate. Only 12 affiliates promoting — huge gap.',
    priceRange: 'RM 19 - RM 45', tab: 'trending',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-4', name: 'Cushion Foundation Matte Halal Wardah', category: 'Beauty', emoji: '💄',
    commissionRate: 11.0, velocity: 34, velocityDir: 'up', competition: 'Low',
    competitorCount: 8, monthlySearch: '54K',
    sparkline7d: [18, 22, 25, 28, 30, 32, 34],
    commissionHistory: [{day:'Mon',rate:9.8},{day:'Tue',rate:10.0},{day:'Wed',rate:10.3},{day:'Thu',rate:10.5},{day:'Fri',rate:10.7},{day:'Sat',rate:10.9},{day:'Sun',rate:11.0}],
    searchVolume7d: [{day:'Mon',vol:5800},{day:'Tue',vol:6200},{day:'Wed',vol:6700},{day:'Thu',vol:7200},{day:'Fri',vol:7800},{day:'Sat',vol:8400},{day:'Sun',vol:9100}],
    season: 'Peaks during Ramadan & Raya season (Apr-May)',
    whyTrending: 'Halal cosmetic market exploding. Only 8 affiliates promoting this — huge first-mover advantage. TikTok halal beauty creators hungry for content.',
    priceRange: 'RM 32 - RM 89', tab: 'emerging',
    competitors: ['Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318'],
  },
  // ---------- Fashion ----------
  {
    id: 'p-5', name: 'Tudung Bawal Premium Cotton Instant', category: 'Fashion', emoji: '🧕',
    commissionRate: 7.5, velocity: 92, velocityDir: 'up', competition: 'Medium',
    competitorCount: 24, monthlySearch: '156K',
    sparkline7d: [50, 58, 66, 72, 80, 86, 92],
    commissionHistory: [{day:'Mon',rate:6.8},{day:'Tue',rate:7.0},{day:'Wed',rate:7.1},{day:'Thu',rate:7.3},{day:'Fri',rate:7.4},{day:'Sat',rate:7.4},{day:'Sun',rate:7.5}],
    searchVolume7d: [{day:'Mon',vol:18500},{day:'Tue',vol:20400},{day:'Wed',vol:22800},{day:'Thu',vol:25100},{day:'Fri',vol:27800},{day:'Sat',vol:30200},{day:'Sun',vol:33100}],
    season: 'Massive spike during Ramadan & Raya (Mar-May)',
    whyTrending: 'Raya season incoming — tudung bawal search volume up 92% WoW. Premium cotton with instant designs is the #1 pick for working professionals.',
    priceRange: 'RM 25 - RM 95', tab: 'trending',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318', 'Affiliate #5520'],
  },
  {
    id: 'p-6', name: 'Baju Kurung Moden Raya 2025 Pastel', category: 'Fashion', emoji: '👗',
    commissionRate: 7.0, velocity: 28, velocityDir: 'up', competition: 'Medium',
    competitorCount: 21, monthlySearch: '95K',
    sparkline7d: [16, 19, 22, 24, 26, 27, 28],
    commissionHistory: [{day:'Mon',rate:6.5},{day:'Tue',rate:6.6},{day:'Wed',rate:6.7},{day:'Thu',rate:6.8},{day:'Fri',rate:6.9},{day:'Sat',rate:6.9},{day:'Sun',rate:7.0}],
    searchVolume7d: [{day:'Mon',vol:10200},{day:'Tue',vol:11200},{day:'Wed',vol:12300},{day:'Thu',vol:13100},{day:'Fri',vol:14200},{day:'Sat',vol:15400},{day:'Sun',vol:16700}],
    season: 'Peaks during Ramadan & Raya (Mar-May)',
    whyTrending: 'Pastel colors trending for Raya 2025. Modern kurung sets are in high demand. Commission holding steady at 7%.',
    priceRange: 'RM 45 - RM 189', tab: 'steady',
    competitors: ['Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318'],
  },
  // ---------- Home ----------
  {
    id: 'p-7', name: 'Instant Pot Duo 7-in-1 Pressure Cooker', category: 'Home', emoji: '🍚',
    commissionRate: 6.0, velocity: 55, velocityDir: 'up', competition: 'Low',
    competitorCount: 10, monthlySearch: '72K',
    sparkline7d: [30, 36, 42, 47, 50, 53, 55],
    commissionHistory: [{day:'Mon',rate:5.2},{day:'Tue',rate:5.4},{day:'Wed',rate:5.5},{day:'Thu',rate:5.7},{day:'Fri',rate:5.8},{day:'Sat',rate:5.9},{day:'Sun',rate:6.0}],
    searchVolume7d: [{day:'Mon',vol:7800},{day:'Tue',vol:8400},{day:'Wed',vol:9100},{day:'Thu',vol:9800},{day:'Fri',vol:10400},{day:'Sat',vol:11100},{day:'Sun',vol:11800}],
    season: 'Year-round — gift season spike (Dec)',
    whyTrending: 'Working-from-home parents rediscovering pressure cookers. Instant Pot restocked at RM349 — only 10 affiliates promoting.',
    priceRange: 'RM 299 - RM 549', tab: 'trending',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-8', name: 'Portable Blender USB Rechargeable 6 Blades', category: 'Home', emoji: '🥤',
    commissionRate: 9.0, velocity: 42, velocityDir: 'up', competition: 'Low',
    competitorCount: 14, monthlySearch: '110K',
    sparkline7d: [22, 26, 30, 34, 38, 40, 42],
    commissionHistory: [{day:'Mon',rate:8.0},{day:'Tue',rate:8.2},{day:'Wed',rate:8.4},{day:'Thu',rate:8.6},{day:'Fri',rate:8.7},{day:'Sat',rate:8.9},{day:'Sun',rate:9.0}],
    searchVolume7d: [{day:'Mon',vol:12400},{day:'Tue',vol:13500},{day:'Wed',vol:14700},{day:'Thu',vol:15900},{day:'Fri',vol:17200},{day:'Sat',vol:18600},{day:'Sun',vol:20100}],
    season: 'Year-round — fitness season peaks (Jan-Feb, Sep-Oct)',
    whyTrending: 'Health-conscious Malaysians blending smoothies on-the-go. TikTok viral content driving massive sales for sub-RM50 models.',
    priceRange: 'RM 20 - RM 80', tab: 'emerging',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318'],
  },
  // ---------- Food ----------
  {
    id: 'p-9', name: 'Kopi Susu Tambun 3-in-1 Premium 30sachet', category: 'Food', emoji: '☕',
    commissionRate: 10.0, velocity: 67, velocityDir: 'up', competition: 'Low',
    competitorCount: 9, monthlySearch: '130K',
    sparkline7d: [38, 44, 50, 55, 60, 64, 67],
    commissionHistory: [{day:'Mon',rate:8.8},{day:'Tue',rate:9.0},{day:'Wed',rate:9.2},{day:'Thu',rate:9.5},{day:'Fri',rate:9.7},{day:'Sat',rate:9.8},{day:'Sun',rate:10.0}],
    searchVolume7d: [{day:'Mon',vol:14800},{day:'Tue',vol:16200},{day:'Wed',vol:17700},{day:'Thu',vol:19300},{day:'Fri',vol:20800},{day:'Sat',vol:22400},{day:'Sun',vol:24100}],
    season: 'Year-round — peak during monsoon & cool months (Nov-Feb)',
    whyTrending: 'Local kopi susu brands going viral on social media. Kedai kopi culture at home — instant premium coffee is a huge market. Only 9 affiliates.',
    priceRange: 'RM 12 - RM 45', tab: 'trending',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-10', name: 'Mamee Chef Curgy Mi Instant Noodles Pack 12', category: 'Food', emoji: '🍜',
    commissionRate: 8.5, velocity: 12, velocityDir: 'stable', competition: 'Medium',
    competitorCount: 20, monthlySearch: '78K',
    sparkline7d: [55, 58, 56, 60, 57, 59, 58],
    commissionHistory: [{day:'Mon',rate:8.3},{day:'Tue',rate:8.4},{day:'Wed',rate:8.4},{day:'Thu',rate:8.5},{day:'Fri',rate:8.5},{day:'Sat',rate:8.5},{day:'Sun',rate:8.5}],
    searchVolume7d: [{day:'Mon',vol:8900},{day:'Tue',vol:9100},{day:'Wed',vol:9300},{day:'Thu',vol:9500},{day:'Fri',vol:9700},{day:'Sat',vol:9900},{day:'Sun',vol:10100}],
    season: 'Year-round steady',
    whyTrending: 'Malaysian childhood nostalgia meets adult convenience. Local brand loyalty. 8.5% commission is rock solid.',
    priceRange: 'RM 14 - RM 32', tab: 'steady',
    competitors: ['Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318', 'Affiliate #5520'],
  },
  // ---------- Baby ----------
  {
    id: 'p-11', name: 'MamyPoko Pants Standard M56 Tapes', category: 'Baby', emoji: '🍼',
    commissionRate: 7.2, velocity: 47, velocityDir: 'up', competition: 'Low',
    competitorCount: 11, monthlySearch: '96K',
    sparkline7d: [28, 32, 36, 40, 43, 45, 47],
    commissionHistory: [{day:'Mon',rate:6.5},{day:'Tue',rate:6.7},{day:'Wed',rate:6.9},{day:'Thu',rate:7.0},{day:'Fri',rate:7.1},{day:'Sat',rate:7.1},{day:'Sun',rate:7.2}],
    searchVolume7d: [{day:'Mon',vol:10800},{day:'Tue',vol:11400},{day:'Wed',vol:12100},{day:'Thu',vol:12800},{day:'Fri',vol:13500},{day:'Sat',vol:14200},{day:'Sun',vol:14900}],
    season: 'Year-round — diaper panic-buying before price hikes',
    whyTrending: 'Diaper shortage rumors driving bulk buying. MamyPoko Pants restocked — only 11 affiliates promoting this batch.',
    priceRange: 'RM 42 - RM 89', tab: 'emerging',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-12', name: 'Philips Avent Natural Baby Bottle Anti-Colic', category: 'Baby', emoji: '🍼',
    commissionRate: 6.5, velocity: 9, velocityDir: 'stable', competition: 'Medium',
    competitorCount: 19, monthlySearch: '64K',
    sparkline7d: [48, 46, 49, 47, 50, 48, 49],
    commissionHistory: [{day:'Mon',rate:6.3},{day:'Tue',rate:6.4},{day:'Wed',rate:6.4},{day:'Thu',rate:6.5},{day:'Fri',rate:6.5},{day:'Sat',rate:6.5},{day:'Sun',rate:6.5}],
    searchVolume7d: [{day:'Mon',vol:7100},{day:'Tue',vol:7200},{day:'Wed',vol:7300},{day:'Thu',vol:7400},{day:'Fri',vol:7500},{day:'Sat',vol:7600},{day:'Sun',vol:7700}],
    season: 'Year-round steady',
    whyTrending: 'Premium baby bottle trusted by Malaysian parents. 6.5% commission has been stable for 8 months.',
    priceRange: 'RM 28 - RM 75', tab: 'steady',
    competitors: ['Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318'],
  },
  // ---------- Sports ----------
  {
    id: 'p-13', name: 'Yoga Mat Anti-Slip TPE 6mm Premium', category: 'Sports', emoji: '🧘',
    commissionRate: 8.8, velocity: 38, velocityDir: 'up', competition: 'Low',
    competitorCount: 13, monthlySearch: '68K',
    sparkline7d: [20, 24, 28, 31, 34, 36, 38],
    commissionHistory: [{day:'Mon',rate:7.8},{day:'Tue',rate:8.0},{day:'Wed',rate:8.2},{day:'Thu',rate:8.4},{day:'Fri',rate:8.6},{day:'Sat',rate:8.7},{day:'Sun',rate:8.8}],
    searchVolume7d: [{day:'Mon',vol:7400},{day:'Tue',vol:8000},{day:'Wed',vol:8600},{day:'Thu',vol:9300},{day:'Fri',vol:10000},{day:'Sat',vol:10700},{day:'Sun',vol:11400}],
    season: 'Year-round — peaks during New Year resolution season (Jan-Feb)',
    whyTrending: 'Home yoga trend continues post-pandemic. TPE mats replacing PVC. Only 13 affiliates promoting — good niche.',
    priceRange: 'RM 35 - RM 120', tab: 'emerging',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-14', name: 'Adjustable Dumbbell 24kg Pair Home Gym', category: 'Sports', emoji: '💪',
    commissionRate: 5.5, velocity: 14, velocityDir: 'stable', competition: 'Medium',
    competitorCount: 17, monthlySearch: '52K',
    sparkline7d: [52, 50, 53, 51, 54, 52, 53],
    commissionHistory: [{day:'Mon',rate:5.3},{day:'Tue',rate:5.4},{day:'Wed',rate:5.4},{day:'Thu',rate:5.5},{day:'Fri',rate:5.5},{day:'Sat',rate:5.5},{day:'Sun',rate:5.5}],
    searchVolume7d: [{day:'Mon',vol:5900},{day:'Tue',vol:6000},{day:'Wed',vol:6100},{day:'Thu',vol:6200},{day:'Fri',vol:6300},{day:'Sat',vol:6400},{day:'Sun',vol:6500}],
    season: 'Year-round steady',
    whyTrending: 'Home gym setup is permanent. Adjustable dumbbells save space for condo dwellers. Reliable commission.',
    priceRange: 'RM 199 - RM 449', tab: 'steady',
    competitors: ['Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318'],
  },
  // ---------- Gaming ----------
  {
    id: 'p-15', name: 'RGB Mechanical Keyboard Hot-Swappable Brown Switch', category: 'Gaming', emoji: '⌨️',
    commissionRate: 4.8, velocity: 71, velocityDir: 'up', competition: 'High',
    competitorCount: 38, monthlySearch: '125K',
    sparkline7d: [42, 48, 54, 60, 65, 68, 71],
    commissionHistory: [{day:'Mon',rate:4.2},{day:'Tue',rate:4.4},{day:'Wed',rate:4.5},{day:'Thu',rate:4.6},{day:'Fri',rate:4.7},{day:'Sat',rate:4.7},{day:'Sun',rate:4.8}],
    searchVolume7d: [{day:'Mon',vol:14200},{day:'Tue',vol:15600},{day:'Wed',vol:17100},{day:'Thu',vol:18700},{day:'Fri',vol:20300},{day:'Sat',vol:22100},{day:'Sun',vol:24000}],
    season: 'Year-round — peaks during school holidays (May, Nov-Dec)',
    whyTrending: 'Esports growth in Malaysia driving gaming peripheral sales. Hot-swappable switches trending. High competition though — 38 affiliates.',
    priceRange: 'RM 89 - RM 350', tab: 'trending',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318', 'Affiliate #5520', 'Affiliate #6712'],
  },
  {
    id: 'p-16', name: 'Nintendo Switch OLED Restock Bundle', category: 'Gaming', emoji: '🎮',
    commissionRate: 3.5, velocity: 22, velocityDir: 'up', competition: 'High',
    competitorCount: 45, monthlySearch: '180K',
    sparkline7d: [12, 14, 16, 18, 20, 21, 22],
    commissionHistory: [{day:'Mon',rate:3.2},{day:'Tue',rate:3.3},{day:'Wed',rate:3.3},{day:'Thu',rate:3.4},{day:'Fri',rate:3.4},{day:'Sat',rate:3.5},{day:'Sun',rate:3.5}],
    searchVolume7d: [{day:'Mon',vol:20400},{day:'Tue',vol:21500},{day:'Wed',vol:22600},{day:'Thu',vol:23800},{day:'Fri',vol:25000},{day:'Sat',vol:26300},{day:'Sun',vol:27600}],
    season: 'Year-round — huge spike during Black Friday & year-end',
    whyTrending: 'Switch OLED restocked in Malaysia. Low commission but massive volume. Steady demand.',
    priceRange: 'RM 1,599 - RM 1,899', tab: 'steady',
    competitors: ['Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318', 'Affiliate #5520', 'Affiliate #6712'],
  },
  // ---------- Auto ----------
  {
    id: 'p-17', name: 'Magnetic Car Phone Holder Fast Charging', category: 'Auto', emoji: '📱',
    commissionRate: 8.0, velocity: 51, velocityDir: 'up', competition: 'Low',
    competitorCount: 10, monthlySearch: '85K',
    sparkline7d: [28, 33, 38, 42, 46, 49, 51],
    commissionHistory: [{day:'Mon',rate:7.0},{day:'Tue',rate:7.2},{day:'Wed',rate:7.4},{day:'Thu',rate:7.6},{day:'Fri',rate:7.7},{day:'Sat',rate:7.9},{day:'Sun',rate:8.0}],
    searchVolume7d: [{day:'Mon',vol:9200},{day:'Tue',vol:10000},{day:'Wed',vol:10800},{day:'Thu',vol:11600},{day:'Fri',vol:12400},{day:'Sat',vol:13200},{day:'Sun',vol:14000}],
    season: 'Year-round — peaks during Grab/InDriver signup surges',
    whyTrending: 'Navigation essential for Grab drivers and daily commuters. Magnetic holders with fast-charging are the top pick. Only 10 affiliates.',
    priceRange: 'RM 15 - RM 65', tab: 'trending',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-18', name: 'Dashcam 4K Front Rear Dual Camera', category: 'Auto', emoji: '📷',
    commissionRate: 7.0, velocity: 26, velocityDir: 'up', competition: 'Low',
    competitorCount: 12, monthlySearch: '62K',
    sparkline7d: [14, 17, 19, 22, 24, 25, 26],
    commissionHistory: [{day:'Mon',rate:6.3},{day:'Tue',rate:6.4},{day:'Wed',rate:6.6},{day:'Thu',rate:6.7},{day:'Fri',rate:6.8},{day:'Sat',rate:6.9},{day:'Sun',rate:7.0}],
    searchVolume7d: [{day:'Mon',vol:6800},{day:'Tue',vol:7300},{day:'Wed',vol:7800},{day:'Thu',vol:8400},{day:'Fri',vol:9000},{day:'Sat',vol:9600},{day:'Sun',vol:10200}],
    season: 'Year-round — surges during festive balik kampung seasons',
    whyTrending: 'Insurance premium discounts for dashcam owners. 4K dual-camera now under RM250. Only 12 affiliates promoting.',
    priceRange: 'RM 89 - RM 449', tab: 'emerging',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  // ---------- Books ----------
  {
    id: 'p-19', name: 'Atomic Habits James Clear (Malay Edition)', category: 'Books', emoji: '📚',
    commissionRate: 9.0, velocity: 33, velocityDir: 'up', competition: 'Low',
    competitorCount: 7, monthlySearch: '42K',
    sparkline7d: [18, 22, 25, 28, 30, 32, 33],
    commissionHistory: [{day:'Mon',rate:8.0},{day:'Tue',rate:8.2},{day:'Wed',rate:8.4},{day:'Thu',rate:8.6},{day:'Fri',rate:8.7},{day:'Sat',rate:8.9},{day:'Sun',rate:9.0}],
    searchVolume7d: [{day:'Mon',vol:4600},{day:'Tue',vol:5000},{day:'Wed',vol:5400},{day:'Thu',vol:5800},{day:'Fri',vol:6200},{day:'Sat',vol:6600},{day:'Sun',vol:7000}],
    season: 'Peaks during January (New Year resolution season)',
    whyTrending: 'Malay translation just released. Self-improvement wave on Malaysian TikTok. Only 7 affiliates promoting — extremely low competition.',
    priceRange: 'RM 39 - RM 75', tab: 'emerging',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-20', name: 'Career Reset Starter Pack Bundle (3 Books)', category: 'Books', emoji: '📖',
    commissionRate: 8.5, velocity: 11, velocityDir: 'stable', competition: 'Low',
    competitorCount: 9, monthlySearch: '38K',
    sparkline7d: [50, 48, 51, 49, 52, 50, 51],
    commissionHistory: [{day:'Mon',rate:8.3},{day:'Tue',rate:8.4},{day:'Wed',rate:8.4},{day:'Thu',rate:8.5},{day:'Fri',rate:8.5},{day:'Sat',rate:8.5},{day:'Sun',rate:8.5}],
    searchVolume7d: [{day:'Mon',vol:4200},{day:'Tue',vol:4250},{day:'Wed',vol:4300},{day:'Thu',vol:4350},{day:'Fri',vol:4400},{day:'Sat',vol:4450},{day:'Sun',vol:4500}],
    season: 'Year-round — small peak after Chinese New Year (job-hopping season)',
    whyTrending: 'Career development niche. Steady 8.5% commission. Low competition makes it a reliable earner.',
    priceRange: 'RM 89 - RM 149', tab: 'steady',
    competitors: ['Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318'],
  },
  // ---------- Health ----------
  {
    id: 'p-21', name: 'Blackmores Vitamin C 1000mg Effervescent 30s', category: 'Health', emoji: '💊',
    commissionRate: 8.0, velocity: 58, velocityDir: 'up', competition: 'Low',
    competitorCount: 13, monthlySearch: '92K',
    sparkline7d: [32, 38, 44, 48, 52, 55, 58],
    commissionHistory: [{day:'Mon',rate:7.0},{day:'Tue',rate:7.2},{day:'Wed',rate:7.4},{day:'Thu',rate:7.6},{day:'Fri',rate:7.7},{day:'Sat',rate:7.9},{day:'Sun',rate:8.0}],
    searchVolume7d: [{day:'Mon',vol:10200},{day:'Tue',vol:11100},{day:'Wed',vol:12100},{day:'Thu',vol:13100},{day:'Fri',vol:14100},{day:'Sat',vol:15200},{day:'Sun',vol:16300}],
    season: 'Year-round — massive peak during flu season & haze (Mar-May, Sep-Oct)',
    whyTrending: 'Haze season incoming. Vitamin C demand spiking. Blackmores restocked — only 13 affiliates promoting.',
    priceRange: 'RM 39 - RM 89', tab: 'trending',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-22', name: 'Omega-3 Fish Oil 1000mg Triple Strength', category: 'Health', emoji: '🐟',
    commissionRate: 9.5, velocity: 19, velocityDir: 'up', competition: 'Low',
    competitorCount: 11, monthlySearch: '48K',
    sparkline7d: [10, 12, 14, 16, 17, 18, 19],
    commissionHistory: [{day:'Mon',rate:8.5},{day:'Tue',rate:8.7},{day:'Wed',rate:8.9},{day:'Thu',rate:9.1},{day:'Fri',rate:9.2},{day:'Sat',rate:9.4},{day:'Sun',rate:9.5}],
    searchVolume7d: [{day:'Mon',vol:5200},{day:'Tue',vol:5500},{day:'Wed',vol:5800},{day:'Thu',vol:6100},{day:'Fri',vol:6400},{day:'Sat',vol:6700},{day:'Sun',vol:7000}],
    season: 'Year-round steady — peaks during CNY gift-giving',
    whyTrending: 'Heart health awareness growing among Malaysian Gen X. 9.5% commission is exceptional for supplements. Only 11 affiliates.',
    priceRange: 'RM 49 - RM 129', tab: 'steady',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  // ---------- Pets ----------
  {
    id: 'p-23', name: 'Smart Pet Feeder WiFi Camera Auto Dispenser', category: 'Pets', emoji: '🐾',
    commissionRate: 6.5, velocity: 49, velocityDir: 'up', competition: 'Low',
    competitorCount: 8, monthlySearch: '45K',
    sparkline7d: [26, 31, 36, 40, 44, 47, 49],
    commissionHistory: [{day:'Mon',rate:5.8},{day:'Tue',rate:6.0},{day:'Wed',rate:6.1},{day:'Thu',rate:6.3},{day:'Fri',rate:6.4},{day:'Sat',rate:6.4},{day:'Sun',rate:6.5}],
    searchVolume7d: [{day:'Mon',vol:5000},{day:'Tue',vol:5400},{day:'Wed',vol:5800},{day:'Thu',vol:6200},{day:'Fri',vol:6600},{day:'Sat',vol:7100},{day:'Sun',vol:7600}],
    season: 'Year-round — peak during pet adoption month (Oct)',
    whyTrending: 'Pet ownership surge post-pandemic continues. Smart feeders with WiFi camera are the new must-have for Malaysian pet owners. Only 8 affiliates.',
    priceRange: 'RM 55 - RM 250', tab: 'emerging',
    competitors: ['Affiliate #2847', 'Affiliate #1932', 'Affiliate #4501'],
  },
  {
    id: 'p-24', name: 'Premium Cat Food Grain-Free Salmon 1.5kg', category: 'Pets', emoji: '🐱',
    commissionRate: 8.0, velocity: 16, velocityDir: 'stable', competition: 'Medium',
    competitorCount: 22, monthlySearch: '68K',
    sparkline7d: [54, 52, 55, 53, 56, 54, 55],
    commissionHistory: [{day:'Mon',rate:7.8},{day:'Tue',rate:7.9},{day:'Wed',rate:7.9},{day:'Thu',rate:8.0},{day:'Fri',rate:8.0},{day:'Sat',rate:8.0},{day:'Sun',rate:8.0}],
    searchVolume7d: [{day:'Mon',vol:7400},{day:'Tue',vol:7500},{day:'Wed',vol:7600},{day:'Thu',vol:7700},{day:'Fri',vol:7800},{day:'Sat',vol:7900},{day:'Sun',vol:8000}],
    season: 'Year-round steady',
    whyTrending: 'Premium cat food market growing as owners treat pets as family. Grain-free salmon is the #1 formula. 8% commission is steady.',
    priceRange: 'RM 49 - RM 119', tab: 'steady',
    competitors: ['Affiliate #1932', 'Affiliate #4501', 'Affiliate #3318', 'Affiliate #5520'],
  },
]

// ============================================================
// Persistent state via useSyncExternalStore (SSR-safe, lint-safe)
// ============================================================
const EMPTY_STRING_ARRAY: string[] = Object.freeze([]) as string[]
const EMPTY_ALERT_ARRAY: AlertItem[] = Object.freeze([]) as AlertItem[]

function useLocalStorageState<T>(
  key: string,
  initial: T,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const cacheRef = useRef<{ raw: string | null; value: T }>({ raw: null, value: initial })

  const subscribe = useCallback(
    (cb: () => void) => {
      if (typeof window === 'undefined') return () => {}
      const handler = (e: StorageEvent) => {
        if (e.key === null || e.key === key) cb()
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
    [key],
  )

  const getSnapshot = useCallback((): T => {
    if (typeof window === 'undefined') return cacheRef.current.value
    try {
      const raw = localStorage.getItem(key)
      if (raw !== cacheRef.current.raw) {
        cacheRef.current = {
          raw,
          value: raw === null ? initial : (JSON.parse(raw) as T),
        }
      }
      return cacheRef.current.value
    } catch {
      return cacheRef.current.value
    }
    // `initial` is a frozen module-level constant (stable identity) — safe in deps
  }, [key, initial])

  const getServerSnapshot = useCallback((): T => initial, [initial])

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      try {
        const prev = getSnapshot()
        const next =
          typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater
        const raw = JSON.stringify(next)
        localStorage.setItem(key, raw)
        cacheRef.current = { raw, value: next }
        // storage event doesn't fire in the same window — dispatch manually
        window.dispatchEvent(new StorageEvent('storage', { key }))
      } catch {
        /* ignore (private mode / quota) */
      }
    },
    [key, getSnapshot],
  )

  return [value, setValue]
}

// ============================================================
// Helpers
// ============================================================
function heatClassForVelocity(v: number): { bg: string; text: string; label: string } {
  if (v >= 60) return { bg: 'bg-red-500 hover:bg-red-600', text: 'text-white', label: 'Hot' }
  if (v >= 40) return { bg: 'bg-orange-500 hover:bg-orange-600', text: 'text-white', label: 'Hot' }
  if (v >= 25) return { bg: 'bg-amber-400 hover:bg-amber-500', text: 'text-stone-900', label: 'Warm' }
  if (v >= 10) return { bg: 'bg-yellow-300 hover:bg-yellow-400', text: 'text-stone-900', label: 'Warm' }
  return { bg: 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600', text: 'text-stone-700 dark:text-stone-200', label: 'Cool' }
}

function competitionMeta(c: Competition): { emoji: string; text: string; className: string } {
  switch (c) {
    case 'Low': return { emoji: '🟢', text: 'Low', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900' }
    case 'Medium': return { emoji: '🟡', text: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900' }
    case 'High': return { emoji: '🔴', text: 'High', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900' }
  }
}

function velocityArrow(dir: VelocityDir, v: number) {
  if (dir === 'up') return { Icon: ArrowUp, color: 'text-emerald-600 dark:text-emerald-400', text: `+${v}%` }
  if (dir === 'down') return { Icon: ArrowDown, color: 'text-red-600 dark:text-red-400', text: `-${v}%` }
  return { Icon: ArrowRight, color: 'text-slate-500 dark:text-slate-400', text: `${v}%` }
}

// ============================================================
// Sparkline (mini 7-day line chart, currentColor stroke)
// ============================================================
function Sparkline({ data, stroke = '#f59e0b' }: { data: number[]; stroke?: string }) {
  const chartData = data.map((v, i) => ({ day: `D${i + 1}`, v }))
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.8} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============================================================
// Heat Map Cell
// ============================================================
function HeatMapCell({
  category,
  velocity,
  active,
  onClick,
}: {
  category: { id: string; emoji: string }
  velocity: number
  active: boolean
  onClick: () => void
}) {
  const heat = heatClassForVelocity(velocity)
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`group relative aspect-square sm:aspect-[4/3] rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all duration-200 ${heat.bg} ${heat.text} ${active ? 'ring-2 ring-offset-2 ring-amber-500 ring-offset-background scale-105' : ''}`}
    >
      <span className="text-2xl sm:text-3xl mb-1">{category.emoji}</span>
      <span className="text-xs sm:text-sm font-semibold leading-tight">{category.id}</span>
      <span className="text-[10px] sm:text-xs opacity-90 mt-0.5">{velocity}% ↑</span>
      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-wide opacity-70">{heat.label}</span>
    </button>
  )
}

// ============================================================
// Product Card
// ============================================================
function ProductCard({
  product,
  onOpen,
  onAlert,
  watched,
  onToggleWatch,
  index,
}: {
  product: TrendProduct
  onOpen: () => void
  onAlert: (type: AlertType) => void
  watched: boolean
  onToggleWatch: () => void
  index: number
}) {
  const comp = competitionMeta(product.competition)
  const arrow = velocityArrow(product.velocityDir, product.velocity)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card
        className="group relative overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-400 transition-all"
        onClick={onOpen}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 text-2xl">
              {product.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{product.category}</Badge>
                <span className="text-[10px] text-muted-foreground">{product.priceRange}</span>
              </div>
            </div>
            {/* Alert bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Create alert"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Create alert for this product
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(ALERT_LABELS) as AlertType[]).map((type) => {
                  const meta = ALERT_LABELS[type]
                  const Icon = meta.icon
                  return (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => onAlert(type)}
                      className="flex items-start gap-2 py-2"
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{meta.label}</span>
                        <span className="text-[11px] text-muted-foreground">{meta.desc}</span>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {product.commissionRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">commission</span>
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${arrow.color}`}>
              <arrow.Icon className="h-3.5 w-3.5" />
              <span>{arrow.text}</span>
            </div>
          </div>

          {/* Sparkline + competition */}
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted-foreground mb-0.5">7-day trend</div>
              <Sparkline data={product.sparkline7d} stroke="#f59e0b" />
            </div>
            <Badge variant="outline" className={`text-[10px] px-2 py-0 ${comp.className}`}>
              <span className="mr-0.5">{comp.emoji}</span>
              {comp.text}
            </Badge>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{product.monthlySearch} searches/mo</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={(e) => { e.stopPropagation(); onToggleWatch() }}
            >
              {watched ? (
                <><EyeOff className="h-3 w-3 mr-1" />Unwatch</>
              ) : (
                <><Eye className="h-3 w-3 mr-1" />Watch</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================================
// Product Detail Dialog
// ============================================================
function ProductDetailDialog({
  product, open, onOpenChange, related, onSwitchProduct,
}: {
  product: TrendProduct | null
  open: boolean
  onOpenChange: (v: boolean) => void
  related: TrendProduct[]
  onSwitchProduct: (id: string) => void
}) {
  if (!product) return null
  const comp = competitionMeta(product.competition)
  const arrow = velocityArrow(product.velocityDir, product.velocity)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 text-3xl">
              {product.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-tight">{product.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {product.category} · {product.priceRange} · {product.monthlySearch} searches/month
              </DialogDescription>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge className={`text-xs ${comp.className}`}>
                  <span className="mr-1">{comp.emoji}</span>{comp.text} competition
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <span className={`mr-1 inline-flex items-center ${arrow.color}`}>
                    <arrow.Icon className="h-3 w-3" />
                  </span>
                  {arrow.text} velocity
                </Badge>
                <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                  {product.commissionRate.toFixed(1)}% commission
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Why trending */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-sm">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300 mb-1">
            <Sparkles className="h-4 w-4" />Why it&apos;s trending
          </div>
          <p className="text-amber-900 dark:text-amber-200">{product.whyTrending}</p>
        </div>

        {/* Seasonal indicator */}
        {product.season && (
          <div className="flex items-start gap-2 rounded-lg border p-3 text-sm">
            <Target className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" />
            <div>
              <span className="font-semibold">Seasonal insight: </span>
              <span className="text-muted-foreground">📈 {product.season}</span>
            </div>
          </div>
        )}

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Commission history line chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Commission rate history (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={product.commissionHistory} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`, 'Commission']}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Search volume bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Search className="h-4 w-4 text-amber-600" />
                Search volume trend (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={product.searchVolume7d} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }}
                    formatter={(v: number) => [v.toLocaleString(), 'Searches']}
                  />
                  <Bar dataKey="vol" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Competition analysis */}
        <div className="rounded-lg border p-3 text-sm">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Competition analysis
          </div>
          <p className="text-muted-foreground">
            {product.competition === 'Low' && (
              <>🟢 <strong>Low competition</strong> — only <strong>{product.competitorCount} affiliates</strong> are promoting this product right now. First-mover advantage is significant.</>
            )}
            {product.competition === 'Medium' && (
              <>🟡 <strong>Medium competition</strong> — <strong>{product.competitorCount} affiliates</strong> are promoting this. Differentiate with unique content angles.</>
            )}
            {product.competition === 'High' && (
              <>🔴 <strong>High competition</strong> — <strong>{product.competitorCount} affiliates</strong> are promoting this. Volume is large but margins will be thinner.</>
            )}
          </p>
        </div>

        {/* Competitors list */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold mb-2">
            <Eye className="h-4 w-4 text-amber-600" />
            Anonymous competitors promoting this ({product.competitors.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {product.competitors.map((c) => (
              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
            ))}
          </div>
        </div>

        {/* Related products carousel */}
        {related.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Related trending products
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
              {related.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSwitchProduct(r.id)}
                  className="shrink-0 w-44 text-left rounded-lg border p-2 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{r.emoji}</span>
                    <span className="text-xs font-medium line-clamp-2 flex-1">{r.name}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-emerald-600">{r.commissionRate.toFixed(1)}%</span>
                    <span className="text-muted-foreground">{r.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="sm:flex-1"
            onClick={() => toast.success('Affiliate link generated!', { description: 'Copied to clipboard' })}
          >
            <Link2 className="h-4 w-4 mr-1.5" />
            Generate Affiliate Link
          </Button>
          <Button
            className="sm:flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => toast.success('HERMES AI is writing your content...', { description: 'Opening AI Content Studio' })}
          >
            <Wand2 className="h-4 w-4 mr-1.5" />
            Create AI Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Manage Alerts Dialog
// ============================================================
function ManageAlertsDialog({
  alerts, open, onOpenChange, onToggle, onDelete,
}: {
  alerts: AlertItem[]
  open: boolean
  onOpenChange: (v: boolean) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            Manage Alerts
          </DialogTitle>
          <DialogDescription>
            Active alerts across all your watched products. Toggle off to pause, or delete to remove permanently.
          </DialogDescription>
        </DialogHeader>

        {alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-40" />
            No active alerts yet. Click the <span className="inline-flex items-center"><Bell className="h-3 w-3 mx-0.5" /></span> bell icon on any product to create one.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alerts.map((a) => {
              const meta = ALERT_LABELS[a.type]
              const Icon = meta.icon
              return (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                    <Icon className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{meta.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      On: <span className="font-medium">{a.productName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={a.enabled} onCheckedChange={() => onToggle(a.id)} aria-label="Toggle alert" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600"
                      onClick={() => onDelete(a.id)}
                      aria-label="Delete alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Main Component
// ============================================================
export function TrendsPage() {
  const [tab, setTab] = useState<TrendTab>('trending')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Persistent state (localStorage-backed, SSR-safe via useSyncExternalStore)
  const [watchList, setWatchList] = useLocalStorageState<string[]>('trends:watchlist', EMPTY_STRING_ARRAY)
  const [alerts, setAlerts] = useLocalStorageState<AlertItem[]>('trends:alerts', EMPTY_ALERT_ARRAY)

  const toggleWatch = useCallback((id: string) => {
    const isWatched = watchList.includes(id)
    setWatchList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    const p = PRODUCTS.find((x) => x.id === id)
    if (p) {
      toast.success(
        isWatched ? 'Removed from watch list' : 'Added to watch list',
        { description: p.name },
      )
    }
  }, [watchList, setWatchList])

  const createAlert = useCallback((productId: string, type: AlertType) => {
    const product = PRODUCTS.find((p) => p.id === productId)
    if (!product) return
    const newAlert: AlertItem = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId,
      productName: product.name,
      type,
      enabled: true,
      createdAt: Date.now(),
    }
    setAlerts((prev) => [...prev, newAlert])
    toast.success('Alert created', {
      description: `${ALERT_LABELS[type].label} — ${product.name}`,
    })
  }, [setAlerts])

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)))
  }, [setAlerts])

  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    toast.success('Alert deleted')
  }, [setAlerts])

  // Per-category hottest velocity for heat map
  const heatByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of CATEGORIES) {
      const products = PRODUCTS.filter((p) => p.category === c.id)
      const top = Math.max(0, ...products.map((p) => p.velocity))
      map[c.id] = top
    }
    return map
  }, [])

  // Filtered products per tab
  const filteredForTab = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.tab === tab)
    if (categoryFilter !== 'All') {
      list = list.filter((p) => p.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.whyTrending.toLowerCase().includes(q)
      )
    }
    return list
  }, [tab, categoryFilter, search])

  // Competitor watch list: products with 3+ competitors
  const competitorWatchProducts = useMemo(() => {
    return PRODUCTS
      .filter((p) => p.competitors.length >= 3)
      .sort((a, b) => b.competitors.length - a.competitors.length)
      .slice(0, 5)
  }, [])

  const selectedProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedId) || null,
    [selectedId]
  )

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return []
    return PRODUCTS
      .filter((p) => p.category === selectedProduct.category && p.id !== selectedProduct.id)
      .slice(0, 6)
  }, [selectedProduct])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      toast.success('Trend data refreshed', {
        description: 'Latest signals loaded from Shopee Malaysia',
      })
    }, 900)
  }, [])

  const openProduct = useCallback((id: string) => {
    setSelectedId(id)
    setDetailOpen(true)
  }, [])

  const switchProduct = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const activeTabMeta = TAB_META[tab]
  const ActiveIcon = activeTabMeta.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-amber-600" />
            Trend Spy
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Your secret weapon — insider trend intelligence on what Malaysians are searching for right now. Spot the next viral product before your competitors do.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAlertsOpen(true)}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-1.5" />
            Manage Alerts
            {alerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                {alerts.length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Competitor Watch Section */}
      <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">👀</span>
            Competitor Watch
          </CardTitle>
          <CardDescription className="text-xs">
            See which products other affiliates are promoting right now — anonymous intel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {competitorWatchProducts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="rounded-lg border bg-card p-3 flex flex-col gap-2"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium line-clamp-2 leading-tight">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{p.category}</div>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-bold text-amber-700 dark:text-amber-400">{p.competitors.length}</span> competitors promoting
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {p.competitors.slice(0, 3).map((c) => (
                    <Badge key={c} variant="secondary" className="text-[9px] px-1 py-0">{c}</Badge>
                  ))}
                  {p.competitors.length > 3 && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">+{p.competitors.length - 3} more</Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={watchList.includes(p.id) ? 'default' : 'outline'}
                  className="h-7 text-[11px] w-full"
                  onClick={() => toggleWatch(p.id)}
                >
                  {watchList.includes(p.id) ? (
                    <><EyeOff className="h-3 w-3 mr-1" />Unwatch</>
                  ) : (
                    <><Eye className="h-3 w-3 mr-1" />Watch this</>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heat Map */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-lg">🔥</span>
                Category Heat Map
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Click any category to filter products below. Color = trend velocity (hot vs cool).
              </CardDescription>
            </div>
            {categoryFilter !== 'All' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCategoryFilter('All')}
              >
                <X className="h-3 w-3 mr-1" />Clear filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {CATEGORIES.map((c) => (
              <HeatMapCell
                key={c.id}
                category={c}
                velocity={heatByCategory[c.id] || 0}
                active={categoryFilter === c.id}
                onClick={() => setCategoryFilter(categoryFilter === c.id ? 'All' : c.id)}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-red-500" />🔥 Hot
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-amber-400" />🌤️ Warm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-slate-300 dark:bg-slate-700" />❄️ Cool
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TrendTab)}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          {(Object.keys(TAB_META) as TrendTab[]).map((t) => {
            const meta = TAB_META[t]
            const Icon = meta.icon
            return (
              <TabsTrigger key={t} value={t} className="text-xs sm:text-sm gap-1.5">
                <Icon className={`h-4 w-4 ${meta.accent}`} />
                <span className="hidden sm:inline">{meta.label}</span>
                <span className="sm:hidden">{meta.label.split(' ')[0]}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Filter bar */}
        <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ActiveIcon className={`h-4 w-4 ${activeTabMeta.accent}`} />
            <span>{activeTabMeta.description}</span>
          </div>
          <div className="flex items-center gap-2">
            {categoryFilter !== 'All' && (
              <Badge variant="secondary" className="text-xs">
                {categoryFilter}
                <button
                  className="ml-1 hover:text-red-600"
                  onClick={() => setCategoryFilter('All')}
                  aria-label="Clear category filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full sm:w-56 pl-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tab content with animation */}
        <TabsContent value={tab} className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab + '-' + categoryFilter}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {filteredForTab.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-2 opacity-50">🔍</div>
                  <p className="text-sm text-muted-foreground">
                    No products match this filter. Try clearing the search or category filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredForTab.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      index={i}
                      onOpen={() => openProduct(p.id)}
                      onAlert={(type) => createAlert(p.id, type)}
                      watched={watchList.includes(p.id)}
                      onToggleWatch={() => toggleWatch(p.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        related={relatedProducts}
        onSwitchProduct={switchProduct}
      />

      {/* Manage Alerts Dialog */}
      <ManageAlertsDialog
        alerts={alerts}
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        onToggle={toggleAlert}
        onDelete={deleteAlert}
      />
    </motion.div>
  )
}
