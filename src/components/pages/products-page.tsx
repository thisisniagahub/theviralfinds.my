'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingBag,
  Star,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Link2,
  SlidersHorizontal,
  Package,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

// --- Types ---
interface Product {
  id: string
  itemId: number
  name: string
  price: number
  originalPrice?: number
  commissionRate: number
  rating: number
  soldCount: number
  shopName: string
  category: string
  isAiPick?: boolean
  color: string
  source?: 'graphql_api' | 'mock'
  affiliateLink?: string | null
  deepLink?: string | null
  productLink?: string
}

interface SearchResult {
  products: Product[]
  total: number
  source: 'graphql_api' | 'mock'
  connected: boolean
  message?: string
}

const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Home & Living',
  'Beauty',
  'Sports',
  'Food',
] as const

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'commission', label: 'Highest Commission' },
  { value: 'rating', label: 'Best Rating' },
] as const

// Color palette for product cards
const CARD_COLORS = [
  'bg-orange-100 dark:bg-orange-900/30',
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-purple-100 dark:bg-purple-900/30',
  'bg-rose-100 dark:bg-rose-900/30',
  'bg-sky-100 dark:bg-sky-900/30',
  'bg-emerald-100 dark:bg-emerald-900/30',
  'bg-lime-100 dark:bg-lime-900/30',
  'bg-amber-100 dark:bg-amber-900/30',
  'bg-teal-100 dark:bg-teal-900/30',
  'bg-fuchsia-100 dark:bg-fuchsia-900/30',
  'bg-yellow-100 dark:bg-yellow-900/30',
  'bg-cyan-100 dark:bg-cyan-900/30',
]

// AI Picks (still use curated mock data for the AI recommendations section)
const AI_PICKS: Product[] = [
  {
    id: 'ai-1',
    itemId: 1001,
    name: 'Xiaomi Redmi Note 13 Pro 5G - 256GB',
    price: 899,
    originalPrice: 1199,
    commissionRate: 10,
    rating: 4.8,
    soldCount: 15200,
    shopName: 'Xiaomi Official Store',
    category: 'Electronics',
    isAiPick: true,
    color: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    id: 'ai-2',
    itemId: 1002,
    name: 'Korean Style Oversized Hoodie - Unisex',
    price: 45,
    originalPrice: 89,
    commissionRate: 20,
    rating: 4.5,
    soldCount: 28300,
    shopName: 'K-Fashion MY',
    category: 'Fashion',
    isAiPick: true,
    color: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    id: 'ai-3',
    itemId: 1003,
    name: 'Dyson V12 Detect Slim Cordless Vacuum',
    price: 2199,
    originalPrice: 2699,
    commissionRate: 10,
    rating: 4.9,
    soldCount: 3200,
    shopName: 'Dyson Official',
    category: 'Home & Living',
    isAiPick: true,
    color: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    id: 'ai-4',
    itemId: 1004,
    name: 'LANEIGE Lip Sleeping Mask - Berry',
    price: 68,
    originalPrice: 85,
    commissionRate: 20,
    rating: 4.7,
    soldCount: 41500,
    shopName: 'LANEIGE Official',
    category: 'Beauty',
    isAiPick: true,
    color: 'bg-rose-100 dark:bg-rose-900/30',
  },
]

// --- Helpers ---
function formatSoldCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-3 ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}</span>
    </div>
  )
}

// Map API product to our Product interface
function mapApiProduct(raw: Record<string, unknown>, index: number): Product {
  const price = Number(raw.price || 0)
  const commissionRate = Number(raw.commissionRate || 0)
  return {
    id: (raw.id as string) || `api-${index}`,
    itemId: Number(raw.itemId || raw.item_id || 0),
    name: (raw.name as string) || (raw.item_name as string) || 'Unknown Product',
    price,
    originalPrice: raw.originalPrice ? Number(raw.originalPrice) : raw.original_price ? Number(raw.original_price) : undefined,
    commissionRate,
    rating: Number(raw.rating || raw.ratingStar || raw.rating_star || 0),
    soldCount: Number(raw.soldCount || raw.sales || 0),
    shopName: (raw.shopName as string) || (raw.shop_name as string) || 'Shopee Seller',
    category: (raw.category as string) || 'general',
    color: CARD_COLORS[index % CARD_COLORS.length],
    source: (raw.source as 'graphql_api' | 'mock') || 'mock',
    affiliateLink: (raw.affiliateLink as string | null) ?? null,
    deepLink: (raw.deepLink as string | null) ?? null,
    productLink: (raw.productLink as string) || (raw.product_link as string),
  }
}

// --- Product Card ---
function ProductCard({
  product,
  onGenerateLink,
  generatingLinkId,
}: {
  product: Product
  onGenerateLink: (product: Product) => void
  generatingLinkId: string | null
}) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const [copied, setCopied] = useState(false)
  const commission = product.price * product.commissionRate / 100

  const handleCopyLink = () => {
    if (product.affiliateLink) {
      navigator.clipboard?.writeText(product.affiliateLink).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isGenerating = generatingLinkId === product.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="card-hover overflow-hidden py-0 gap-0">
        {/* Image placeholder */}
        <div
          className={`${product.color} flex items-center justify-center h-44 relative`}
        >
          <ShoppingBag className="size-12 text-muted-foreground/40" />
          {product.isAiPick && (
            <Badge className="absolute top-2 left-2 bg-hermes text-white border-0 text-[10px] px-1.5 py-0.5 gap-1">
              <Sparkles className="size-3" />
              AI Pick
            </Badge>
          )}
          {product.source === 'graphql_api' && (
            <Badge className="absolute top-2 left-2 bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0.5 gap-1">
              <Zap className="size-3" />
              Live
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-destructive text-white border-0 text-[10px] px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}
        </div>

        <CardContent className="p-4 flex flex-col gap-2">
          <h3 className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-shopee">
              RM{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                RM{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-shopee/10 text-shopee border-0 font-semibold"
              >
                RM{commission.toFixed(2)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {product.commissionRate}% comm
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <StarRating rating={product.rating} />
            <span className="text-xs text-muted-foreground">
              {formatSoldCount(product.soldCount)} sold
            </span>
          </div>

          <p className="text-xs text-muted-foreground truncate">
            {product.shopName}
          </p>

          {product.affiliateLink ? (
            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                className="flex-1 bg-shopee hover:bg-shopee-dark text-white"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onGenerateLink(product)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Link2 className="size-3.5" />
                )}
                Regenerate
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full mt-1 bg-shopee hover:bg-shopee-dark text-white"
              onClick={() => onGenerateLink(product)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Link2 className="size-3.5" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Link'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Main Component ---
export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [sortBy, setSortBy] = useState<string>('popular')
  const [visibleCount, setVisibleCount] = useState(8)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // API integration state
  const { shopeeConnected, setShopeeConnected, shopeeDataSource, setShopeeDataSource } = useAppStore()
  const [apiProducts, setApiProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [apiSource, setApiSource] = useState<'graphql_api' | 'mock' | null>(null)
  const [apiMessage, setApiMessage] = useState<string | null>(null)
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check connection status on mount
  useEffect(() => {
    fetch('/api/shopee/status')
      .then((res) => res.json())
      .then((data) => {
        setShopeeConnected(data.connected === true)
        setShopeeDataSource(data.source || 'mock')
      })
      .catch(() => {
        setShopeeConnected(false)
        setShopeeDataSource('mock')
      })
  }, [setShopeeConnected, setShopeeDataSource])

  // Search products from API
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setApiProducts([])
      setHasSearched(false)
      setApiSource(null)
      setApiMessage(null)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const res = await fetch(`/api/shopee/products?q=${encodeURIComponent(query)}&limit=20`)
      const data: SearchResult = await res.json()

      const mapped = (data.products || []).map((p: Record<string, unknown>, i: number) =>
        mapApiProduct(p, i)
      )

      setApiProducts(mapped)
      setShopeeConnected(data.connected === true)
      setShopeeDataSource(data.source || 'mock')
      setApiSource(data.source || 'mock')
      setApiMessage(data.message || null)
    } catch (error) {
      console.error('Product search error:', error)
      setApiProducts([])
      setApiSource('mock')
      setApiMessage('Failed to search products. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }, [setShopeeConnected, setShopeeDataSource])

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setVisibleCount(8)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(value)
    }, 500)
  }

  // Generate affiliate link for a product
  const handleGenerateLink = async (product: Product) => {
    setGeneratingLinkId(product.id)

    try {
      const res = await fetch('/api/shopee/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: product.itemId || undefined,
          productUrl: product.productLink || undefined,
        }),
      })

      const data = await res.json()

      if (data.link) {
        // Update the product with the generated link
        setApiProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  affiliateLink: data.link.shortUrl || data.link.longUrl,
                  deepLink: data.link.deepLink,
                  source: data.source === 'graphql_api' ? 'graphql_api' : p.source,
                }
              : p
          )
        )
        toast.success('Affiliate link generated!')
      }
    } catch (error) {
      console.error('Generate link error:', error)
      toast.error('Failed to generate affiliate link')
    } finally {
      setGeneratingLinkId(null)
    }
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = apiProducts

    if (activeCategory !== 'All') {
      result = result.filter(
        (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
      )
    }

    switch (sortBy) {
      case 'newest':
        result = [...result].reverse()
        break
      case 'commission':
        result = [...result].sort((a, b) => b.commissionRate - a.commissionRate)
        break
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating)
        break
      default:
        result = [...result].sort((a, b) => b.soldCount - a.soldCount)
    }

    return result
  }, [apiProducts, activeCategory, sortBy])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + 4)
      setIsLoadingMore(false)
    }, 600)
  }

  const aiPicks = useMemo(() => AI_PICKS, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Discover products and generate affiliate links
        </p>
      </div>

      {/* API Not Connected Banner */}
      {!shopeeConnected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 py-3">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Shopee API not connected
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  You are viewing demo data. Connect your Shopee Affiliate API in{' '}
                  <span className="font-semibold">Settings</span> for real affiliate links and commission data.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-amber-600 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))
                }}
              >
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Source indicator when results are loaded */}
      {apiSource && hasSearched && !isSearching && (
        <div className="flex items-center gap-2">
          {apiSource === 'graphql_api' ? (
            <Badge className="bg-emerald-500 text-white border-0 gap-1 text-[10px]">
              <Zap className="size-3" />
              Live from Shopee API
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700 gap-1 text-[10px]">
              <Package className="size-3" />
              Demo Data
            </Badge>
          )}
          {apiMessage && (
            <span className="text-xs text-muted-foreground">{apiMessage}</span>
          )}
        </div>
      )}

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-hermes/20 bg-hermes/5 dark:bg-hermes/10 py-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-hermes text-white rounded-md px-2.5 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                Hermes AI Picks
              </div>
              <Badge variant="outline" className="text-[10px] text-hermes border-hermes/30">
                <TrendingUp className="size-3" />
                Trending Now
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiPicks.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Card className="card-hover py-0 gap-0 cursor-pointer">
                    <div
                      className={`${product.color} flex items-center justify-center h-28 relative rounded-t-xl`}
                    >
                      <ShoppingBag className="size-8 text-muted-foreground/40" />
                      <Badge className="absolute top-1.5 left-1.5 bg-hermes text-white border-0 text-[9px] px-1.5 py-0.5 gap-0.5">
                        <Sparkles className="size-2.5" />
                        AI
                      </Badge>
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      <h4 className="text-xs font-medium line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-shopee">
                          RM{product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            RM{product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className="text-[9px] px-1.5 py-0 bg-shopee/10 text-shopee border-0 font-semibold">
                          +RM{(product.price * product.commissionRate / 100).toFixed(2)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {product.commissionRate}%
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search Shopee products..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Select
          value={sortBy}
          onValueChange={(val) => {
            setSortBy(val)
            setVisibleCount(8)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SlidersHorizontal className="size-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={(val) => {
          setActiveCategory(val)
          setVisibleCount(8)
        }}
      >
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* We only need one TabsContent since we filter manually */}
        <TabsContent value={activeCategory} className="mt-4">
          {!hasSearched ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <Search className="size-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">Search for products</p>
              <p className="text-xs mt-1">Enter a keyword to search Shopee products</p>
            </motion.div>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-shopee mb-3" />
              <p className="text-sm text-muted-foreground">Searching Shopee...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <Package className="size-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs mt-1">Try a different search or category</p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onGenerateLink={handleGenerateLink}
                      generatingLinkId={generatingLinkId}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="min-w-[200px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-4" />
                        Load More Products
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
