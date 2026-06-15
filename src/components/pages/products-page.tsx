'use client'

import { useState, useMemo } from 'react'
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

// --- Mock Data ---
interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  commission: number
  commissionRate: number
  rating: number
  soldCount: number
  shopName: string
  category: string
  isAiPick?: boolean
  color: string
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

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Xiaomi Redmi Note 13 Pro 5G - 256GB',
    price: 899,
    originalPrice: 1199,
    commission: 89.9,
    commissionRate: 10,
    rating: 4.8,
    soldCount: 15200,
    shopName: 'Xiaomi Official Store',
    category: 'Electronics',
    isAiPick: true,
    color: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    id: '2',
    name: 'Korean Style Oversized Hoodie - Unisex',
    price: 45,
    originalPrice: 89,
    commission: 9,
    commissionRate: 20,
    rating: 4.5,
    soldCount: 28300,
    shopName: 'K-Fashion MY',
    category: 'Fashion',
    isAiPick: true,
    color: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    id: '3',
    name: 'Dyson V12 Detect Slim Cordless Vacuum',
    price: 2199,
    originalPrice: 2699,
    commission: 219.9,
    commissionRate: 10,
    rating: 4.9,
    soldCount: 3200,
    shopName: 'Dyson Official',
    category: 'Home & Living',
    isAiPick: true,
    color: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    id: '4',
    name: 'LANEIGE Lip Sleeping Mask - Berry',
    price: 68,
    originalPrice: 85,
    commission: 13.6,
    commissionRate: 20,
    rating: 4.7,
    soldCount: 41500,
    shopName: 'LANEIGE Official',
    category: 'Beauty',
    isAiPick: true,
    color: 'bg-rose-100 dark:bg-rose-900/30',
  },
  {
    id: '5',
    name: 'Samsung Galaxy Buds FE Pro',
    price: 299,
    originalPrice: 399,
    commission: 44.85,
    commissionRate: 15,
    rating: 4.6,
    soldCount: 8700,
    shopName: 'Samsung Malaysia',
    category: 'Electronics',
    color: 'bg-sky-100 dark:bg-sky-900/30',
  },
  {
    id: '6',
    name: 'NIKE Air Max 90 - Classic Retro',
    price: 549,
    originalPrice: 699,
    commission: 82.35,
    commissionRate: 15,
    rating: 4.8,
    soldCount: 5400,
    shopName: 'Nike Official MY',
    category: 'Sports',
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: '7',
    name: 'Portable Blender USB Rechargeable 400ml',
    price: 35,
    originalPrice: 59,
    commission: 10.5,
    commissionRate: 30,
    rating: 4.3,
    soldCount: 35600,
    shopName: 'KitchenMate MY',
    category: 'Home & Living',
    color: 'bg-lime-100 dark:bg-lime-900/30',
  },
  {
    id: '8',
    name: 'COSRX Advanced Snail 96 Mucin Power Essence',
    price: 52,
    originalPrice: 68,
    commission: 15.6,
    commissionRate: 30,
    rating: 4.9,
    soldCount: 62000,
    shopName: 'COSRX Official',
    category: 'Beauty',
    color: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    id: '9',
    name: 'Adidas Ultraboost Light Running Shoes',
    price: 699,
    originalPrice: 899,
    commission: 104.85,
    commissionRate: 15,
    rating: 4.7,
    soldCount: 3100,
    shopName: 'Adidas MY',
    category: 'Sports',
    color: 'bg-teal-100 dark:bg-teal-900/30',
  },
  {
    id: '10',
    name: 'JBL Tune 230NC TWS Earbuds',
    price: 199,
    originalPrice: 299,
    commission: 29.85,
    commissionRate: 15,
    rating: 4.5,
    soldCount: 12400,
    shopName: 'JBL Official',
    category: 'Electronics',
    color: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  {
    id: '11',
    name: 'Baju Kurung Moden - Rayon Premium',
    price: 89,
    originalPrice: 129,
    commission: 17.8,
    commissionRate: 20,
    rating: 4.6,
    soldCount: 19800,
    shopName: 'Hijabista Fashion',
    category: 'Fashion',
    color: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
  },
  {
    id: '12',
    name: 'Tongkat Ali Coffee - 15 Sachets',
    price: 38,
    originalPrice: 55,
    commission: 9.5,
    commissionRate: 25,
    rating: 4.4,
    soldCount: 27300,
    shopName: 'Kopitiam Heritage',
    category: 'Food',
    color: 'bg-yellow-100 dark:bg-yellow-900/30',
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

// --- Product Card ---
function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

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
                RM{product.commission.toFixed(2)}
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

          <Button
            size="sm"
            className="w-full mt-1 bg-shopee hover:bg-shopee-dark text-white"
          >
            <Link2 className="size-3.5" />
            Generate Link
          </Button>
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

  const aiPicks = useMemo(() => MOCK_PRODUCTS.filter((p) => p.isAiPick), [])

  const filteredProducts = useMemo(() => {
    let result = MOCK_PRODUCTS.filter((p) => !p.isAiPick)

    if (activeCategory !== 'All') {
      result = result.filter((p) => p.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shopName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
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
  }, [activeCategory, searchQuery, sortBy])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + 4)
      setIsLoadingMore(false)
    }, 600)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Discover products and generate affiliate links
        </p>
      </div>

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
                          +RM{product.commission.toFixed(2)}
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
            placeholder="Search products, shops, categories..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setVisibleCount(8)
            }}
          />
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
          {filteredProducts.length === 0 ? (
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
                    <ProductCard key={product.id} product={product} />
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
