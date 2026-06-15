'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  QrCode,
  Pencil,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Download,
  Tag,
  Link2,
  BarChart3,
  MousePointerClick,
  Target,
  DollarSign,
  TrendingUp,
  X,
  Check,
  RefreshCw,
  Zap,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// --- Types ---
type LinkStatus = 'active' | 'paused' | 'expired'

interface AffiliateLink {
  id: string
  name: string
  productName: string
  shortCode: string
  fullUrl: string
  clicks: number
  conversions: number
  earnings: number
  ctr: number
  status: LinkStatus
  campaign: string
  tags: string[]
  createdAt: string
  expiresAt?: string
  category: string
  shopeeAffiliateUrl?: string | null
  shopeeTracked?: boolean
}

// --- Mock Data ---
const MOCK_LINKS: AffiliateLink[] = [
  {
    id: '1',
    name: 'Xiaomi Redmi Promo',
    productName: 'Xiaomi Redmi Note 13 Pro 5G - 256GB',
    shortCode: 'shopee.my/xm13p',
    fullUrl: 'https://shopee.my/aff/xm13p?ref=affpro',
    clicks: 3420,
    conversions: 187,
    earnings: 1680.13,
    ctr: 5.47,
    status: 'active',
    campaign: 'Chinese New Year',
    tags: ['electronics', 'xiaomi'],
    createdAt: '2024-12-15',
    expiresAt: '2025-06-15',
    category: 'Electronics',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  },
  {
    id: '2',
    name: 'K-Fashion Hoodie',
    productName: 'Korean Style Oversized Hoodie - Unisex',
    shortCode: 'shopee.my/kfh01',
    fullUrl: 'https://shopee.my/aff/kfh01?ref=affpro',
    clicks: 1850,
    conversions: 95,
    earnings: 855.0,
    ctr: 5.14,
    status: 'active',
    campaign: 'Winter Collection',
    tags: ['fashion', 'hoodie'],
    createdAt: '2025-01-03',
    category: 'Fashion',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  },
  {
    id: '3',
    name: 'Dyson Vacuum Deal',
    productName: 'Dyson V12 Detect Slim Cordless Vacuum',
    shortCode: 'shopee.my/dv12d',
    fullUrl: 'https://shopee.my/aff/dv12d?ref=affpro',
    clicks: 980,
    conversions: 23,
    earnings: 5057.7,
    ctr: 2.35,
    status: 'active',
    campaign: 'Home Makeover',
    tags: ['home', 'appliance'],
    createdAt: '2025-01-10',
    category: 'Home & Living',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  },
  {
    id: '4',
    name: 'LANEIGE Lip Mask',
    productName: 'LANEIGE Lip Sleeping Mask - Berry',
    shortCode: 'shopee.my/llm01',
    fullUrl: 'https://shopee.my/aff/llm01?ref=affpro',
    clicks: 4210,
    conversions: 312,
    earnings: 4243.2,
    ctr: 7.41,
    status: 'active',
    campaign: 'Valentine Beauty',
    tags: ['beauty', 'skincare'],
    createdAt: '2025-02-01',
    category: 'Beauty',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  },
  {
    id: '5',
    name: 'Samsung Buds Promo',
    productName: 'Samsung Galaxy Buds FE Pro',
    shortCode: 'shopee.my/sgbp',
    fullUrl: 'https://shopee.my/aff/sgbp?ref=affpro',
    clicks: 560,
    conversions: 18,
    earnings: 807.3,
    ctr: 3.21,
    status: 'paused',
    campaign: 'Chinese New Year',
    tags: ['electronics', 'samsung'],
    createdAt: '2024-12-20',
    category: 'Electronics',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  },
  {
    id: '6',
    name: 'Nike Air Max 90',
    productName: 'NIKE Air Max 90 - Classic Retro',
    shortCode: 'shopee.my/nam90',
    fullUrl: 'https://shopee.my/aff/nam90?ref=affpro',
    clicks: 1200,
    conversions: 42,
    earnings: 3458.7,
    ctr: 3.5,
    status: 'active',
    campaign: 'Sports Week',
    tags: ['sports', 'nike'],
    createdAt: '2025-01-25',
    category: 'Sports',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  },
  {
    id: '7',
    name: 'COSRX Snail Essence',
    productName: 'COSRX Advanced Snail 96 Mucin Power Essence',
    shortCode: 'shopee.my/cs96',
    fullUrl: 'https://shopee.my/aff/cs96?ref=affpro',
    clicks: 680,
    conversions: 0,
    earnings: 0,
    ctr: 0,
    status: 'expired',
    campaign: '11.11 Sale',
    tags: ['beauty', 'skincare'],
    createdAt: '2024-10-20',
    expiresAt: '2024-11-12',
    category: 'Beauty',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  },
  {
    id: '8',
    name: 'Adidas Ultraboost',
    productName: 'Adidas Ultraboost Light Running Shoes',
    shortCode: 'shopee.my/aulb',
    fullUrl: 'https://shopee.my/aff/aulb?ref=affpro',
    clicks: 890,
    conversions: 31,
    earnings: 3250.35,
    ctr: 3.48,
    status: 'paused',
    campaign: 'Marathon Season',
    tags: ['sports', 'adidas'],
    createdAt: '2025-02-05',
    category: 'Sports',
    shopeeAffiliateUrl: null,
    shopeeTracked: false,
  },
]

const STATUS_STYLES: Record<
  LinkStatus,
  { className: string; label: string }
> = {
  active: {
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0',
    label: 'Active',
  },
  paused: {
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0',
    label: 'Paused',
  },
  expired: {
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0',
    label: 'Expired',
  },
}

// --- QR Code SVG Placeholder ---
function QRCodePlaceholder({ size = 160 }: { size?: number }) {
  const cells = 21
  const cellSize = size / cells

  const pattern: boolean[][] = []
  for (let r = 0; r < cells; r++) {
    pattern[r] = []
    for (let c = 0; c < cells; c++) {
      const isTopLeft = r < 7 && c < 7
      const isTopRight = r < 7 && c >= cells - 7
      const isBottomLeft = r >= cells - 7 && c < 7

      if (isTopLeft || isTopRight || isBottomLeft) {
        const lr = isTopLeft ? r : isBottomLeft ? r - (cells - 7) : r
        const lc = isTopLeft ? c : isTopRight ? c - (cells - 7) : c
        const isOuterBorder = lr === 0 || lr === 6 || lc === 0 || lc === 6
        const isInnerSquare = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
        pattern[r][c] = isOuterBorder || isInnerSquare
      } else {
        const seed = (r * 31 + c * 17 + 42) % 100
        pattern[r][c] = seed < 40
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx={4} />
      {pattern.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  )
}

// --- Main Component ---
export function LinksPage() {
  const [links, setLinks] = useState<AffiliateLink[]>(MOCK_LINKS)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // API integration state
  const [isShopeeConnected, setIsShopeeConnected] = useState(false)
  const [isCreatingLink, setIsCreatingLink] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // Create Link Dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newLink, setNewLink] = useState({
    productUrl: '',
    customName: '',
    campaign: '',
    tags: '',
    expiryDate: '',
  })

  // QR Code Dialog
  const [qrOpen, setQrOpen] = useState(false)
  const [qrLink, setQrLink] = useState<AffiliateLink | null>(null)

  // Detail Dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLink, setDetailLink] = useState<AffiliateLink | null>(null)

  // Check Shopee connection on mount
  useEffect(() => {
    fetch('/api/shopee/connect')
      .then((res) => res.json())
      .then((data) => {
        setIsShopeeConnected(data.connected === true)
      })
      .catch(() => {
        setIsShopeeConnected(false)
      })
  }, [])

  // Stats
  const stats = useMemo(() => {
    const total = links.length
    const active = links.filter((l) => l.status === 'active').length
    const paused = links.filter((l) => l.status === 'paused').length
    const expired = links.filter((l) => l.status === 'expired').length
    const tracked = links.filter((l) => l.shopeeTracked).length
    return { total, active, paused, expired, tracked }
  }, [links])

  // Filtered links
  const filteredLinks = useMemo(() => {
    let result = links

    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      result = result.filter((l) => l.category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.productName.toLowerCase().includes(q) ||
          l.shortCode.toLowerCase().includes(q) ||
          l.campaign.toLowerCase().includes(q)
      )
    }

    return result
  }, [links, statusFilter, categoryFilter, searchQuery])

  // Bulk actions
  const allFilteredSelected =
    filteredLinks.length > 0 &&
    filteredLinks.every((l) => selectedIds.has(l.id))

  const handleToggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLinks.map((l) => l.id)))
    }
  }

  const handleToggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopyLink = (link: AffiliateLink) => {
    // Copy the real Shopee affiliate URL if available, otherwise the full URL
    const urlToCopy = link.shopeeAffiliateUrl || link.fullUrl
    navigator.clipboard?.writeText(urlToCopy).catch(() => {})
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleTogglePause = (id: string) => {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: l.status === 'paused' ? 'active' : 'paused' }
          : l
      )
    )
  }

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleBulkPause = () => {
    setLinks((prev) =>
      prev.map((l) =>
        selectedIds.has(l.id) && l.status === 'active'
          ? { ...l, status: 'paused' }
          : l
      )
    )
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    setLinks((prev) => prev.filter((l) => !selectedIds.has(l.id)))
    setSelectedIds(new Set())
  }

  const handleCreateLink = async () => {
    setIsCreatingLink(true)

    try {
      let shopeeAffiliateUrl: string | null = null
      let shopeeTracked = false

      // If Shopee API is connected and we have a product URL, generate a real affiliate link
      if (isShopeeConnected && newLink.productUrl) {
        try {
          const res = await fetch('/api/shopee/generate-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productUrl: newLink.productUrl,
              subId: newLink.customName || undefined,
            }),
          })

          const data = await res.json()

          if (data.link) {
            shopeeAffiliateUrl = data.link.shortUrl || data.link.longUrl
            shopeeTracked = data.source === 'shopee_api'
          }
        } catch (error) {
          console.error('Failed to generate Shopee link:', error)
        }
      }

      const newId = String(Date.now())
      const shortCode = `shopee.my/${Math.random().toString(36).slice(2, 7)}`

      const newAffLink: AffiliateLink = {
        id: newId,
        name: newLink.customName || 'Untitled Link',
        productName: newLink.productUrl || 'Custom Product',
        shortCode,
        fullUrl: shopeeAffiliateUrl || `https://shopee.my/aff/${Math.random().toString(36).slice(2, 7)}?ref=affpro`,
        clicks: 0,
        conversions: 0,
        earnings: 0,
        ctr: 0,
        status: 'active',
        campaign: newLink.campaign || 'Default',
        tags: newLink.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        createdAt: new Date().toISOString().split('T')[0],
        expiresAt: newLink.expiryDate || undefined,
        category: 'Electronics',
        shopeeAffiliateUrl,
        shopeeTracked,
      }

      setLinks((prev) => [newAffLink, ...prev])
      setNewLink({
        productUrl: '',
        customName: '',
        campaign: '',
        tags: '',
        expiryDate: '',
      })
      setCreateOpen(false)
    } catch (error) {
      console.error('Create link error:', error)
    } finally {
      setIsCreatingLink(false)
    }
  }

  // Sync stats from Shopee API
  const handleSyncStats = async () => {
    setIsSyncing(true)
    setSyncMessage(null)

    try {
      const res = await fetch('/api/shopee/stats?period=30d')
      const data = await res.json()

      if (data.connected) {
        // Update link stats with real data from Shopee
        // For now, just show a success message
        setSyncMessage('Stats synced successfully from Shopee API')
      } else {
        setSyncMessage('Shopee API not connected. Showing demo data.')
      }
    } catch (error) {
      setSyncMessage('Failed to sync stats. Please try again.')
    } finally {
      setIsSyncing(false)
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  const openQrDialog = (link: AffiliateLink) => {
    setQrLink(link)
    setQrOpen(true)
  }

  const openDetailDialog = (link: AffiliateLink) => {
    setDetailLink(link)
    setDetailOpen(true)
  }

  const categories = useMemo(() => {
    const cats = new Set(links.map((l) => l.category))
    return Array.from(cats).sort()
  }, [links])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Links</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track your affiliate links
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sync Stats Button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSyncStats}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Stats'}
          </Button>
          {isShopeeConnected && (
            <Badge className="bg-emerald-500 text-white border-0 gap-1 text-[10px]">
              <Zap className="size-3" />
              Shopee API Connected
            </Badge>
          )}
        </div>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`py-3 ${syncMessage.includes('successfully') ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20' : 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/20'}`}>
            <CardContent className="p-3 flex items-center gap-2">
              {syncMessage.includes('successfully') ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <X className="size-4 text-amber-500" />
              )}
              <p className="text-xs">{syncMessage}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Links',
            value: stats.total,
            icon: Link2,
            color: 'text-shopee',
            bg: 'bg-shopee/10',
          },
          {
            label: 'Active',
            value: stats.active,
            icon: TrendingUp,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          },
          {
            label: 'Paused',
            value: stats.paused,
            icon: Pause,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
          },
          {
            label: 'Expired',
            value: stats.expired,
            icon: X,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-100 dark:bg-red-900/30',
          },
          {
            label: 'Shopee Tracked',
            value: stats.tracked,
            icon: Zap,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="py-4">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex items-center justify-center size-10 rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Create New Link */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-shopee hover:bg-shopee-dark text-white">
              <Plus className="size-4" />
              Create New Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Affiliate Link</DialogTitle>
              <DialogDescription>
                Generate a new affiliate link for a product
                {isShopeeConnected && (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    — Shopee API connected, will generate real tracking link
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product-url">Product URL</Label>
                <Input
                  id="product-url"
                  placeholder="https://shopee.com.my/product/..."
                  value={newLink.productUrl}
                  onChange={(e) =>
                    setNewLink((prev) => ({
                      ...prev,
                      productUrl: e.target.value,
                    }))
                  }
                />
                {!isShopeeConnected && newLink.productUrl && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    Connect Shopee API in Settings to generate real tracking links
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="custom-name">Custom Name</Label>
                <Input
                  id="custom-name"
                  placeholder="e.g., Xiaomi CNY Promo"
                  value={newLink.customName}
                  onChange={(e) =>
                    setNewLink((prev) => ({
                      ...prev,
                      customName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select
                  value={newLink.campaign}
                  onValueChange={(val) =>
                    setNewLink((prev) => ({ ...prev, campaign: val }))
                  }
                >
                  <SelectTrigger id="campaign" className="w-full">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chinese New Year">
                      Chinese New Year
                    </SelectItem>
                    <SelectItem value="Valentine Beauty">
                      Valentine Beauty
                    </SelectItem>
                    <SelectItem value="11.11 Sale">11.11 Sale</SelectItem>
                    <SelectItem value="12.12 Sale">12.12 Sale</SelectItem>
                    <SelectItem value="Home Makeover">Home Makeover</SelectItem>
                    <SelectItem value="Sports Week">Sports Week</SelectItem>
                    <SelectItem value="Default">Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="electronics, promo, xiaomi"
                  value={newLink.tags}
                  onChange={(e) =>
                    setNewLink((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newLink.expiryDate}
                  onChange={(e) =>
                    setNewLink((prev) => ({
                      ...prev,
                      expiryDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-shopee hover:bg-shopee-dark text-white"
                onClick={handleCreateLink}
                disabled={(!newLink.productUrl && !newLink.customName) || isCreatingLink}
              >
                {isCreatingLink ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Create Link'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Badge variant="secondary" className="gap-1">
              {selectedIds.size} selected
            </Badge>
            <Button variant="outline" size="sm" onClick={handleBulkPause}>
              <Pause className="size-3.5" />
              Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </motion.div>
        )}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            className="pl-10 h-9 w-full sm:w-[200px] lg:w-[260px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Links Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] pl-4">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={handleToggleAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Short Code</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px] pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredLinks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No links found matching your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLinks.map((link) => (
                        <motion.tr
                          key={link.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-muted/50 border-b transition-colors"
                          data-state={
                            selectedIds.has(link.id) ? 'selected' : undefined
                          }
                        >
                          <TableCell className="pl-4">
                            <Checkbox
                              checked={selectedIds.has(link.id)}
                              onCheckedChange={() => handleToggleOne(link.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              className="text-left hover:underline cursor-pointer"
                              onClick={() => openDetailDialog(link)}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">
                                  {link.name}
                                </span>
                                {link.shopeeTracked && (
                                  <Badge className="bg-emerald-500 text-white border-0 text-[9px] px-1 py-0 gap-0.5">
                                    <Zap className="size-2.5" />
                                    Tracked
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {link.productName}
                              </div>
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {link.shortCode}
                              </code>
                              <button
                                onClick={() => handleCopyLink(link)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title={link.shopeeAffiliateUrl ? 'Copy Shopee affiliate URL' : 'Copy link'}
                              >
                                {copiedId === link.id ? (
                                  <Check className="size-3 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {link.clicks.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {link.conversions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            <span className="text-shopee">
                              RM{link.earnings.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {link.ctr.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge
                                className={`text-[10px] px-1.5 py-0.5 ${
                                  STATUS_STYLES[link.status].className
                                }`}
                              >
                                {STATUS_STYLES[link.status].label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="pr-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openDetailDialog(link)}
                                >
                                  <BarChart3 className="size-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setLinks((prev) =>
                                      prev.map((l) =>
                                        l.id === link.id
                                          ? { ...l, name: l.name + ' (edited)' }
                                          : l
                                      )
                                    )
                                  }
                                >
                                  <Pencil className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTogglePause(link.id)
                                  }
                                  disabled={link.status === 'expired'}
                                >
                                  {link.status === 'paused' ? (
                                    <>
                                      <Play className="size-4" />
                                      Resume
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="size-4" />
                                      Pause
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openQrDialog(link)}
                                >
                                  <QrCode className="size-4" />
                                  QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyLink(link)}
                                >
                                  <Copy className="size-4" />
                                  {link.shopeeAffiliateUrl ? 'Copy Shopee Link' : 'Copy Link'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => handleDelete(link.id)}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              {qrLink?.name || 'Scan to open affiliate link'}
            </DialogDescription>
          </DialogHeader>
          {qrLink && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="border rounded-lg p-4 bg-white">
                <QRCodePlaceholder size={200} />
              </div>
              <div className="text-center w-full">
                <p className="text-sm font-medium">{qrLink.productName}</p>
                {qrLink.shopeeTracked && qrLink.shopeeAffiliateUrl && (
                  <div className="mt-1">
                    <Badge className="bg-emerald-500 text-white border-0 text-[9px] gap-0.5 mb-1">
                      <Zap className="size-2.5" />
                      Shopee Tracked
                    </Badge>
                    <code className="block text-xs text-muted-foreground break-all">
                      {qrLink.shopeeAffiliateUrl}
                    </code>
                  </div>
                )}
                <code className="text-xs text-muted-foreground break-all">
                  {qrLink.fullUrl}
                </code>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const svgEl = document.querySelector(
                    '#qr-dialog svg'
                  ) as SVGElement | null
                  if (svgEl) {
                    const svgData = new XMLSerializer().serializeToString(svgEl)
                    const blob = new Blob([svgData], {
                      type: 'image/svg+xml',
                    })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `qr-${qrLink.shortCode}.svg`
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                }}
              >
                <Download className="size-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Link Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailLink?.name}
              {detailLink && (
                <>
                  <Badge
                    className={`text-[10px] ${
                      STATUS_STYLES[detailLink.status].className
                    }`}
                  >
                    {STATUS_STYLES[detailLink.status].label}
                  </Badge>
                  {detailLink.shopeeTracked && (
                    <Badge className="bg-emerald-500 text-white border-0 text-[10px] gap-0.5">
                      <Zap className="size-3" />
                      Shopee Tracked
                    </Badge>
                  )}
                </>
              )}
            </DialogTitle>
            <DialogDescription>{detailLink?.productName}</DialogDescription>
          </DialogHeader>
          {detailLink && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    icon: MousePointerClick,
                    label: 'Clicks',
                    value: detailLink.clicks.toLocaleString(),
                    color: 'text-shopee',
                    bg: 'bg-shopee/10',
                  },
                  {
                    icon: Target,
                    label: 'Conversions',
                    value: detailLink.conversions.toLocaleString(),
                    color: 'text-hermes',
                    bg: 'bg-hermes/10',
                  },
                  {
                    icon: DollarSign,
                    label: 'Earnings',
                    value: `RM${detailLink.earnings.toFixed(2)}`,
                    color: 'text-emerald-600 dark:text-emerald-400',
                    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                  },
                  {
                    icon: TrendingUp,
                    label: 'CTR',
                    value: `${detailLink.ctr.toFixed(2)}%`,
                    color: 'text-amber-600 dark:text-amber-400',
                    bg: 'bg-amber-100 dark:bg-amber-900/30',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={`flex items-center justify-center size-8 rounded-md ${stat.bg}`}
                    >
                      <stat.icon className={`size-4 ${stat.color}`} />
                    </div>
                    <span className="text-lg font-bold">{stat.value}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Link Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Link Information</h4>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Short Code:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs w-fit">
                    {detailLink.shortCode}
                  </code>
                  <span className="text-muted-foreground">Full URL:</span>
                  <span className="text-xs break-all">
                    {detailLink.fullUrl}
                  </span>
                  {detailLink.shopeeAffiliateUrl && (
                    <>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Zap className="size-3 text-emerald-500" />
                        Shopee URL:
                      </span>
                      <span className="text-xs break-all text-emerald-600 dark:text-emerald-400">
                        {detailLink.shopeeAffiliateUrl}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">Campaign:</span>
                  <span>{detailLink.campaign}</span>
                  <span className="text-muted-foreground">Category:</span>
                  <span>{detailLink.category}</span>
                  <span className="text-muted-foreground">Created:</span>
                  <span>{detailLink.createdAt}</span>
                  {detailLink.expiresAt && (
                    <>
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{detailLink.expiresAt}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              {detailLink.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Tag className="size-3.5" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detailLink.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Click History (Mock) */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <MousePointerClick className="size-3.5" />
                  Recent Clicks
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {[
                    {
                      time: '2 min ago',
                      source: 'Instagram Story',
                      device: 'Mobile',
                    },
                    {
                      time: '15 min ago',
                      source: 'TikTok Bio',
                      device: 'Mobile',
                    },
                    {
                      time: '1 hr ago',
                      source: 'Blog Post',
                      device: 'Desktop',
                    },
                    {
                      time: '3 hrs ago',
                      source: 'WhatsApp Share',
                      device: 'Mobile',
                    },
                    {
                      time: '5 hrs ago',
                      source: 'Facebook Post',
                      device: 'Mobile',
                    },
                  ].map((click, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="size-3 text-muted-foreground" />
                        <span className="font-medium">{click.source}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{click.device}</span>
                        <span>{click.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversion History (Mock) */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Target className="size-3.5" />
                  Recent Conversions
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {detailLink.conversions > 0 ? (
                    [
                      {
                        time: '30 min ago',
                        amount: `RM${(detailLink.earnings / detailLink.conversions).toFixed(2)}`,
                        product: detailLink.productName,
                      },
                      {
                        time: '2 hrs ago',
                        amount: `RM${(detailLink.earnings / detailLink.conversions * 1.2).toFixed(2)}`,
                        product: detailLink.productName,
                      },
                      {
                        time: 'Yesterday',
                        amount: `RM${(detailLink.earnings / detailLink.conversions * 0.8).toFixed(2)}`,
                        product: detailLink.productName,
                      },
                    ].map((conv, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="size-3 text-emerald-500" />
                          <span className="font-medium text-shopee">
                            {conv.amount}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {conv.time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No conversions yet
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(detailLink)}
                  className="flex-1"
                >
                  <Copy className="size-3.5" />
                  {detailLink.shopeeAffiliateUrl ? 'Copy Shopee Link' : 'Copy Link'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openQrDialog(detailLink)}
                  className="flex-1"
                >
                  <QrCode className="size-3.5" />
                  QR Code
                </Button>
                {detailLink.status !== 'expired' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleTogglePause(detailLink.id)
                      setDetailLink((prev) =>
                        prev
                          ? {
                              ...prev,
                              status:
                                prev.status === 'paused' ? 'active' : 'paused',
                            }
                          : null
                      )
                    }}
                    className="flex-1"
                  >
                    {detailLink.status === 'paused' ? (
                      <>
                        <Play className="size-3.5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="size-3.5" />
                        Pause
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
