/**
 * Shopee Affiliate Open API Integration Service
 * 
 * Official API Docs: https://open.shopee.com/
 * Affiliate Portal: https://affiliate.shopee.com.my/
 * 
 * This service integrates with the Shopee Affiliate Open API to:
 * 1. Generate real affiliate tracking links
 * 2. Fetch product details with commission rates
 * 3. Sync commission/conversion data
 * 4. Track clicks and conversions in real-time
 * 
 * Setup:
 * 1. Register at https://affiliate.shopee.com.my/
 * 2. Go to Account > API > Open API
 * 3. Generate your API Key (app_id + secret)
 * 4. Enter credentials in Settings > Shopee Integration
 */

import crypto from 'crypto'

// ─── Types ──────────────────────────────────────────────────────

export interface ShopeeAffiliateConfig {
  appId: string
  secret: string
  region: 'my' | 'sg' | 'id' | 'th' | 'ph' | 'vn' | 'br' | 'mx' | 'co' | 'cl'
  accessToken?: string
}

export interface ShopeeProduct {
  itemId: number
  name: string
  image: string
  price: number
  originalPrice?: number
  commissionRate: number
  commissionMin: number
  commissionMax: number
  sales: number
  ratingStar: number
  shopName: string
  shopId: number
  category: string
  categoryId: number
  productLink: string
  deepLink?: string
}

export interface ShopeeAffiliateLink {
  shortUrl: string
  longUrl: string
  deepLink: string
  generateUrl: string
}

export interface ShopeeCommissionOrder {
  orderSn: string
  orderCreateTime: number
  itemId: number
  itemName: string
  itemPrice: number
  commissionRate: number
  commission: number
  commissionStatus: 'pending' | 'confirmed' | 'rejected' | 'paid'
  orderStatus: string
  settleTime?: number
  clickTime: number
  subId?: string
}

export interface ShopeeCommissionSummary {
  totalCommission: number
  pendingCommission: number
  confirmedCommission: number
  rejectedCommission: number
  paidCommission: number
  totalOrders: number
  conversionRate: number
}

export interface ShopeeClickStats {
  date: string
  clicks: number
  uniqueClicks: number
  conversions: number
  earnings: number
}

// ─── API Base URLs ──────────────────────────────────────────────

const API_BASES: Record<string, string> = {
  my: 'https://open.shopee.com.my/api/v2',
  sg: 'https://open.shopee.sg/api/v2',
  id: 'https://open.shopee.co.id/api/v2',
  th: 'https://open.shopee.co.th/api/v2',
  ph: 'https://open.shopee.ph/api/v2',
  vn: 'https://open.shopee.vn/api/v2',
}

// ─── Shopee Affiliate Service ───────────────────────────────────

export class ShopeeAffiliateService {
  private config: ShopeeAffiliateConfig
  private baseUrl: string

  constructor(config: ShopeeAffiliateConfig) {
    this.config = config
    this.baseUrl = API_BASES[config.region] || API_BASES.my
  }

  // ─── Authentication ─────────────────────────────────────────

  /**
   * Generate HMAC-SHA256 signature for API requests
   * Shopee Open API uses partner_id + path + timestamp for signing
   */
  private generateSign(path: string, timestamp: number): string {
    const baseString = `${this.config.appId}${path}${timestamp}`
    return crypto
      .createHmac('sha256', this.config.secret)
      .update(baseString)
      .digest('hex')
  }

  /**
   * Build authenticated API URL with signature
   */
  private buildUrl(path: string, extraParams?: Record<string, string>): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const sign = this.generateSign(path, timestamp)

    const params = new URLSearchParams({
      partner_id: this.config.appId,
      timestamp: timestamp.toString(),
      sign: sign,
      ...(this.config.accessToken ? { access_token: this.config.accessToken } : {}),
      ...extraParams,
    })

    return `${this.baseUrl}${path}?${params.toString()}`
  }

  // ─── Product APIs ───────────────────────────────────────────

  /**
   * Search products on Shopee with commission info
   * Endpoint: POST /affiliate/product/search
   */
  async searchProducts(query: string, options?: {
    page?: number
    limit?: number
    sortField?: 'commission' | 'price' | 'sales' | 'rating'
    sortOrder?: 'asc' | 'desc'
    categoryId?: number
    minPrice?: number
    maxPrice?: number
  }): Promise<{ products: ShopeeProduct[]; total: number }> {
    const path = '/affiliate/product/search'
    const url = this.buildUrl(path)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: query,
          page: options?.page || 1,
          page_size: options?.limit || 20,
          sort_field: options?.sortField || 'sales',
          sort_order: options?.sortOrder || 'desc',
          category_id: options?.categoryId,
          min_price: options?.minPrice,
          max_price: options?.maxPrice,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(`Shopee API Error: ${data.message || data.error}`)
      }

      return {
        products: (data.response?.products || []).map((p: Record<string, unknown>) => ({
          itemId: p.item_id as number,
          name: p.item_name as string,
          image: p.image_url as string || '',
          price: Number(p.price || 0),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          commissionRate: Number(p.commission_rate || 0),
          commissionMin: Number(p.commission_min || 0),
          commissionMax: Number(p.commission_max || 0),
          sales: Number(p.sales || 0),
          ratingStar: Number(p.rating_star || 0),
          shopName: p.shop_name as string || '',
          shopId: p.shop_id as number || 0,
          category: p.category_name as string || '',
          categoryId: p.category_id as number || 0,
          productLink: p.product_link as string || '',
        })),
        total: data.response?.total_count || 0,
      }
    } catch (error) {
      console.error('Shopee product search error:', error)
      throw error
    }
  }

  /**
   * Get product details by item ID
   * Endpoint: GET /affiliate/product/detail
   */
  async getProductDetail(itemId: number): Promise<ShopeeProduct | null> {
    const path = '/affiliate/product/detail'
    const url = this.buildUrl(path, { item_id: itemId.toString() })

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        throw new Error(`Shopee API Error: ${data.message || data.error}`)
      }

      const p = data.response
      if (!p) return null

      return {
        itemId: p.item_id,
        name: p.item_name,
        image: p.image_url || '',
        price: Number(p.price || 0),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        commissionRate: Number(p.commission_rate || 0),
        commissionMin: Number(p.commission_min || 0),
        commissionMax: Number(p.commission_max || 0),
        sales: Number(p.sales || 0),
        ratingStar: Number(p.rating_star || 0),
        shopName: p.shop_name || '',
        shopId: p.shop_id || 0,
        category: p.category_name || '',
        categoryId: p.category_id || 0,
        productLink: p.product_link || '',
      }
    } catch (error) {
      console.error('Shopee product detail error:', error)
      return null
    }
  }

  // ─── Affiliate Link APIs ────────────────────────────────────

  /**
   * Generate affiliate tracking link
   * Endpoint: POST /affiliate/link/generate
   */
  async generateAffiliateLink(params: {
    itemId?: number
    productUrl?: string
    subId?: string
    deepLinkType?: 'default' | 'app_only'
  }): Promise<ShopeeAffiliateLink> {
    const path = '/affiliate/link/generate'
    const url = this.buildUrl(path)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: params.itemId,
          product_url: params.productUrl,
          sub_id: params.subId,
          deep_link_type: params.deepLinkType || 'default',
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(`Shopee API Error: ${data.message || data.error}`)
      }

      const link = data.response
      return {
        shortUrl: link.short_url || '',
        longUrl: link.long_url || link.url || '',
        deepLink: link.deep_link || '',
        generateUrl: link.generate_url || '',
      }
    } catch (error) {
      console.error('Shopee generate link error:', error)
      throw error
    }
  }

  // ─── Commission & Earnings APIs ─────────────────────────────

  /**
   * Get commission orders (conversions)
   * Endpoint: GET /affiliate/order/list
   */
  async getCommissionOrders(params?: {
    page?: number
    limit?: number
    startTime?: number
    endTime?: number
    commissionStatus?: 'pending' | 'confirmed' | 'rejected' | 'paid'
  }): Promise<{ orders: ShopeeCommissionOrder[]; total: number }> {
    const path = '/affiliate/order/list'
    const extraParams: Record<string, string> = {}

    if (params?.startTime) extraParams.start_time = params.startTime.toString()
    if (params?.endTime) extraParams.end_time = params.endTime.toString()
    if (params?.commissionStatus) extraParams.commission_status = params.commissionStatus

    const url = this.buildUrl(path, extraParams)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: params?.page || 1,
          page_size: params?.limit || 50,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(`Shopee API Error: ${data.message || data.error}`)
      }

      return {
        orders: (data.response?.orders || []).map((o: Record<string, unknown>) => ({
          orderSn: o.order_sn as string,
          orderCreateTime: o.order_create_time as number,
          itemId: o.item_id as number,
          itemName: o.item_name as string,
          itemPrice: Number(o.item_price || 0),
          commissionRate: Number(o.commission_rate || 0),
          commission: Number(o.commission || 0),
          commissionStatus: o.commission_status as 'pending' | 'confirmed' | 'rejected' | 'paid',
          orderStatus: o.order_status as string,
          settleTime: o.settle_time as number | undefined,
          clickTime: o.click_time as number,
          subId: o.sub_id as string | undefined,
        })),
        total: data.response?.total_count || 0,
      }
    } catch (error) {
      console.error('Shopee commission orders error:', error)
      throw error
    }
  }

  /**
   * Get commission summary
   * Endpoint: GET /affiliate/commission/summary
   */
  async getCommissionSummary(params?: {
    startTime?: number
    endTime?: number
  }): Promise<ShopeeCommissionSummary> {
    const path = '/affiliate/commission/summary'
    const extraParams: Record<string, string> = {}

    if (params?.startTime) extraParams.start_time = params.startTime.toString()
    if (params?.endTime) extraParams.end_time = params.endTime.toString()

    const url = this.buildUrl(path, extraParams)

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        throw new Error(`Shopee API Error: ${data.message || data.error}`)
      }

      const s = data.response
      return {
        totalCommission: Number(s?.total_commission || 0),
        pendingCommission: Number(s?.pending_commission || 0),
        confirmedCommission: Number(s?.confirmed_commission || 0),
        rejectedCommission: Number(s?.rejected_commission || 0),
        paidCommission: Number(s?.paid_commission || 0),
        totalOrders: Number(s?.total_orders || 0),
        conversionRate: Number(s?.conversion_rate || 0),
      }
    } catch (error) {
      console.error('Shopee commission summary error:', error)
      throw error
    }
  }

  // ─── Click & Stats APIs ─────────────────────────────────────

  /**
   * Get click statistics
   * Endpoint: GET /affiliate/click/stats
   */
  async getClickStats(params: {
    startTime: number
    endTime: number
    granularity?: 'hour' | 'day' | 'week' | 'month'
  }): Promise<ShopeeClickStats[]> {
    const path = '/affiliate/click/stats'
    const url = this.buildUrl(path, {
      start_time: params.startTime.toString(),
      end_time: params.endTime.toString(),
      granularity: params.granularity || 'day',
    })

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        throw new Error(`Shopee API Error: ${data.message || data.error}`)
      }

      return (data.response?.stats || []).map((s: Record<string, unknown>) => ({
        date: s.date as string,
        clicks: Number(s.clicks || 0),
        uniqueClicks: Number(s.unique_clicks || 0),
        conversions: Number(s.conversions || 0),
        earnings: Number(s.earnings || 0),
      }))
    } catch (error) {
      console.error('Shopee click stats error:', error)
      throw error
    }
  }

  // ─── Utility ────────────────────────────────────────────────

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; region: string }> {
    try {
      // Try to fetch commission summary as a connection test
      const summary = await this.getCommissionSummary()
      return {
        success: true,
        message: `Connected! Total commission: RM ${summary.totalCommission.toFixed(2)}`,
        region: this.config.region.toUpperCase(),
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        region: this.config.region.toUpperCase(),
      }
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSign = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSign)
    )
  }
}

// ─── Singleton Factory ──────────────────────────────────────────

let _instance: ShopeeAffiliateService | null = null

export function getShopeeService(config?: ShopeeAffiliateConfig): ShopeeAffiliateService | null {
  if (!config && !_instance) return null
  
  if (config) {
    _instance = new ShopeeAffiliateService(config)
  }
  
  return _instance
}

/**
 * Get Shopee service from database settings
 * This reads the API credentials from AppSetting table
 */
export async function getShopeeServiceFromDB(): Promise<ShopeeAffiliateService | null> {
  const { db } = await import('@/lib/db')
  
  const settings = await db.appSetting.findMany({
    where: {
      key: { in: ['shopee_app_id', 'shopee_secret', 'shopee_region', 'shopee_access_token'] }
    }
  })

  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))
  
  if (!settingsMap.shopee_app_id || !settingsMap.shopee_secret) {
    return null
  }

  return new ShopeeAffiliateService({
    appId: settingsMap.shopee_app_id,
    secret: settingsMap.shopee_secret,
    region: (settingsMap.shopee_region as ShopeeAffiliateConfig['region']) || 'my',
    accessToken: settingsMap.shopee_access_token,
  })
}
