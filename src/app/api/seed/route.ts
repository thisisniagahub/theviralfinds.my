import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

function generateShortCode(): string {
  return randomBytes(4).toString('hex')
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export async function POST() {
  try {
    // Clear existing data (in reverse dependency order)
    await db.hermesMessage.deleteMany()
    await db.hermesConversation.deleteMany()
    await db.conversion.deleteMany()
    await db.clickRecord.deleteMany()
    await db.affiliateLink.deleteMany()
    await db.campaign.deleteMany()
    await db.payout.deleteMany()
    await db.notification.deleteMany()
    await db.achievement.deleteMany()
    await db.leaderboardEntry.deleteMany()
    await db.hermesInsight.deleteMany()
    await db.hermesTask.deleteMany()
    await db.hermesSkill.deleteMany()
    await db.hermesConnection.deleteMany()
    await db.agentMemory.deleteMany()
    await db.earningGoal.deleteMany()
    await db.referral.deleteMany()
    await db.user.deleteMany()

    // ─── Create Users ─────────────────────────────────────────────
    const users = await Promise.all([
      db.user.create({
        data: {
          email: 'admin@theviralfinds.my',
          name: 'Admin User',
          role: 'admin',
          shopeeAffId: 'SHP_AFF_001',
          avatarUrl: null,
          isActive: true,
          lastLoginAt: new Date(),
        },
      }),
      db.user.create({
        data: {
          email: 'affiliate@theviralfinds.my',
          name: 'Ahmad Razak',
          role: 'affiliate',
          shopeeAffId: 'SHP_AFF_002',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 1000 * 60 * 60),
        },
      }),
      db.user.create({
        data: {
          email: 'viewer@theviralfinds.my',
          name: 'Siti Nurhaliza',
          role: 'viewer',
          shopeeAffId: 'SHP_AFF_003',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      }),
    ])

    // ─── Create Campaigns ─────────────────────────────────────────
    const campaigns = await Promise.all([
      db.campaign.create({
        data: {
          name: '9.9 Super Shopping Day',
          description: 'Major sale event campaign for September 9th',
          status: 'active',
          budget: 500,
          spent: 234.5,
          startDate: new Date('2025-08-01'),
          endDate: new Date('2025-09-15'),
        },
      }),
      db.campaign.create({
        data: {
          name: 'Back to School',
          description: 'Back to school essentials promotion',
          status: 'active',
          budget: 300,
          spent: 156.75,
          startDate: new Date('2025-07-15'),
          endDate: new Date('2025-09-01'),
        },
      }),
      db.campaign.create({
        data: {
          name: 'Summer Tech Deals',
          description: 'Summer electronics and gadget promotion',
          status: 'completed',
          budget: 400,
          spent: 387.2,
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-07-31'),
        },
      }),
    ])

    // ─── Create Affiliate Links ───────────────────────────────────
    const linkData = [
      {
        name: 'Wireless Earbuds Pro',
        productUrl: 'https://shopee.com.my/wireless-earbuds-pro',
        affiliateUrl: 'https://shopee.com.my/aff/wireless-earbuds-pro',
        productId: 'SHP_PROD_001',
        productName: 'Wireless Earbuds Pro X1',
        productImage: null,
        productPrice: 89.9,
        commission: 4.5,
        commissionRate: 5,
        category: 'electronics',
        clicks: 3200,
        conversions: 280,
        earnings: 1260.0,
        ctr: 8.75,
        status: 'active' as const,
        campaignId: campaigns[0].id,
        userId: users[0].id,
      },
      {
        name: 'RGB Gaming Mouse',
        productUrl: 'https://shopee.com.my/rgb-gaming-mouse',
        affiliateUrl: 'https://shopee.com.my/aff/rgb-gaming-mouse',
        productId: 'SHP_PROD_002',
        productName: 'RGB Gaming Mouse G7',
        productImage: null,
        productPrice: 59.9,
        commission: 3.0,
        commissionRate: 5,
        category: 'electronics',
        clicks: 2100,
        conversions: 195,
        earnings: 585.0,
        ctr: 9.29,
        status: 'active' as const,
        campaignId: campaigns[0].id,
        userId: users[0].id,
      },
      {
        name: 'Phone Case Ultra Slim',
        productUrl: 'https://shopee.com.my/phone-case-ultra',
        affiliateUrl: 'https://shopee.com.my/aff/phone-case-ultra',
        productId: 'SHP_PROD_003',
        productName: 'Ultra Slim Phone Case',
        productImage: null,
        productPrice: 25.0,
        commission: 1.5,
        commissionRate: 6,
        category: 'accessories',
        clicks: 1500,
        conversions: 142,
        earnings: 213.0,
        ctr: 9.47,
        status: 'active' as const,
        campaignId: campaigns[1].id,
        userId: users[1].id,
      },
      {
        name: 'USB-C Hub 7-in-1',
        productUrl: 'https://shopee.com.my/usbc-hub-7in1',
        affiliateUrl: 'https://shopee.com.my/aff/usbc-hub-7in1',
        productId: 'SHP_PROD_004',
        productName: 'USB-C Hub 7-in-1 Adapter',
        productImage: null,
        productPrice: 45.0,
        commission: 2.25,
        commissionRate: 5,
        category: 'electronics',
        clicks: 1800,
        conversions: 160,
        earnings: 360.0,
        ctr: 8.89,
        status: 'active' as const,
        campaignId: campaigns[1].id,
        userId: users[0].id,
      },
      {
        name: 'Fitness Tracker Band',
        productUrl: 'https://shopee.com.my/fitness-tracker',
        affiliateUrl: 'https://shopee.com.my/aff/fitness-tracker',
        productId: 'SHP_PROD_005',
        productName: 'Smart Fitness Tracker V3',
        productImage: null,
        productPrice: 79.9,
        commission: 4.0,
        commissionRate: 5,
        category: 'health',
        clicks: 1200,
        conversions: 115,
        earnings: 460.0,
        ctr: 9.58,
        status: 'active' as const,
        userId: users[1].id,
      },
      {
        name: 'LED Desk Lamp',
        productUrl: 'https://shopee.com.my/led-desk-lamp',
        affiliateUrl: 'https://shopee.com.my/aff/led-desk-lamp',
        productId: 'SHP_PROD_006',
        productName: 'Smart LED Desk Lamp',
        productImage: null,
        productPrice: 35.0,
        commission: 2.1,
        commissionRate: 6,
        category: 'home',
        clicks: 900,
        conversions: 72,
        earnings: 151.2,
        ctr: 8.0,
        status: 'active' as const,
        campaignId: campaigns[2].id,
        userId: users[0].id,
      },
      {
        name: 'Portable Blender',
        productUrl: 'https://shopee.com.my/portable-blender',
        affiliateUrl: 'https://shopee.com.my/aff/portable-blender',
        productId: 'SHP_PROD_007',
        productName: 'Mini Portable Blender',
        productImage: null,
        productPrice: 29.9,
        commission: 1.8,
        commissionRate: 6,
        category: 'home',
        clicks: 750,
        conversions: 58,
        earnings: 104.4,
        ctr: 7.73,
        status: 'paused' as const,
        userId: users[1].id,
      },
      {
        name: 'Mechanical Keyboard',
        productUrl: 'https://shopee.com.my/mechanical-keyboard',
        affiliateUrl: 'https://shopee.com.my/aff/mechanical-keyboard',
        productId: 'SHP_PROD_008',
        productName: 'Mechanical Gaming Keyboard',
        productImage: null,
        productPrice: 129.0,
        commission: 6.45,
        commissionRate: 5,
        category: 'electronics',
        clicks: 650,
        conversions: 52,
        earnings: 335.4,
        ctr: 8.0,
        status: 'active' as const,
        campaignId: campaigns[0].id,
        userId: users[0].id,
      },
      {
        name: 'Yoga Mat Premium',
        productUrl: 'https://shopee.com.my/yoga-mat',
        affiliateUrl: 'https://shopee.com.my/aff/yoga-mat',
        productId: 'SHP_PROD_009',
        productName: 'Premium Non-slip Yoga Mat',
        productImage: null,
        productPrice: 49.9,
        commission: 3.0,
        commissionRate: 6,
        category: 'sports',
        clicks: 500,
        conversions: 38,
        earnings: 114.0,
        ctr: 7.6,
        status: 'expired' as const,
        userId: users[1].id,
        expiresAt: new Date('2025-06-30'),
      },
      {
        name: 'Skincare Set Bundle',
        productUrl: 'https://shopee.com.my/skincare-set',
        affiliateUrl: 'https://shopee.com.my/aff/skincare-set',
        productId: 'SHP_PROD_010',
        productName: 'Complete Skincare Bundle',
        productImage: null,
        productPrice: 69.9,
        commission: 5.59,
        commissionRate: 8,
        category: 'beauty',
        clicks: 1100,
        conversions: 99,
        earnings: 553.41,
        ctr: 9.0,
        status: 'active' as const,
        campaignId: campaigns[1].id,
        userId: users[0].id,
      },
      {
        name: 'Wireless Charger Pad',
        productUrl: 'https://shopee.com.my/wireless-charger',
        affiliateUrl: 'https://shopee.com.my/aff/wireless-charger',
        productId: 'SHP_PROD_011',
        productName: 'Fast Wireless Charger Pad',
        productImage: null,
        productPrice: 39.9,
        commission: 2.0,
        commissionRate: 5,
        category: 'electronics',
        clicks: 447,
        conversions: 33,
        earnings: 66.0,
        ctr: 7.38,
        status: 'active' as const,
        userId: users[1].id,
      },
      {
        name: 'Running Shoes',
        productUrl: 'https://shopee.com.my/running-shoes',
        affiliateUrl: 'https://shopee.com.my/aff/running-shoes',
        productId: 'SHP_PROD_012',
        productName: 'Lightweight Running Shoes',
        productImage: null,
        productPrice: 99.0,
        commission: 5.94,
        commissionRate: 6,
        category: 'sports',
        clicks: 700,
        conversions: 48,
        earnings: 285.12,
        ctr: 6.86,
        status: 'active' as const,
        userId: users[0].id,
      },
    ]

    const links = []
    for (const ld of linkData) {
      const shortCode = generateShortCode()
      const link = await db.affiliateLink.create({
        data: { ...ld, shortCode, tags: ld.category },
      })
      links.push(link)
    }

    // ─── Create Click Records ─────────────────────────────────────
    const countries = ['MY', 'SG', 'ID', 'TH', 'PH', 'VN']
    const devices = ['mobile', 'desktop', 'tablet']
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge']
    const osOptions = ['Android', 'iOS', 'Windows', 'macOS']

    const clickBatch = []
    for (const link of links) {
      const clickCount = Math.min(link.clicks, 200) // Limit demo clicks per link
      for (let i = 0; i < clickCount; i++) {
        const converted = Math.random() < (link.conversions / link.clicks)
        clickBatch.push({
          linkId: link.id,
          userId: Math.random() > 0.5 ? users[0].id : users[1].id,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          country: countries[Math.floor(Math.random() * countries.length)],
          referer: ['google.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'direct'][Math.floor(Math.random() * 5)],
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: osOptions[Math.floor(Math.random() * osOptions.length)],
          converted,
          createdAt: randomDate(new Date('2025-01-01'), new Date()),
        })
      }
    }

    // Create clicks in batches
    const BATCH_SIZE = 500
    for (let i = 0; i < clickBatch.length; i += BATCH_SIZE) {
      const batch = clickBatch.slice(i, i + BATCH_SIZE)
      await db.clickRecord.createMany({ data: batch })
    }

    // ─── Create Conversions ───────────────────────────────────────
    const conversionStatuses = ['pending', 'confirmed', 'rejected', 'paid'] as const
    for (const link of links) {
      const convCount = Math.min(link.conversions, 50)
      for (let i = 0; i < convCount; i++) {
        const amount = link.productPrice
          ? Number(link.productPrice) * (0.8 + Math.random() * 0.4)
          : 50 + Math.random() * 100
        const commission = amount * (Number(link.commissionRate) / 100)
        await db.conversion.create({
          data: {
            linkId: link.id,
            orderId: `ORD-${Date.now()}-${i}`,
            amount: Math.round(amount * 100) / 100,
            commission: Math.round(commission * 100) / 100,
            status: conversionStatuses[Math.floor(Math.random() * conversionStatuses.length)],
            createdAt: randomDate(new Date('2025-01-01'), new Date()),
          },
        })
      }
    }

    // ─── Create Payouts ───────────────────────────────────────────
    await db.payout.createMany({
      data: [
        {
          userId: users[0].id,
          method: 'bank_transfer',
          amount: 1250.0,
          status: 'completed',
          bankName: 'Maybank',
          accountNo: '****4521',
          accountName: 'TheViralFinds MY',
          requestedAt: new Date('2025-02-01'),
          processedAt: new Date('2025-02-03'),
          note: 'Monthly payout - February 2025',
        },
        {
          userId: users[0].id,
          method: 'bank_transfer',
          amount: 890.0,
          status: 'processing',
          bankName: 'Maybank',
          accountNo: '****4521',
          accountName: 'TheViralFinds MY',
          requestedAt: new Date('2025-03-01'),
          note: 'Monthly payout - March 2025',
        },
        {
          userId: users[1].id,
          method: 'bank_transfer',
          amount: 650.0,
          status: 'completed',
          bankName: 'CIMB',
          accountNo: '****8832',
          accountName: 'Ahmad Razak',
          requestedAt: new Date('2025-02-01'),
          processedAt: new Date('2025-02-04'),
          note: 'Monthly payout - February 2025',
        },
      ],
    })

    // ─── Create Notifications ─────────────────────────────────────
    await db.notification.createMany({
      data: [
        {
          type: 'conversion',
          title: 'New Conversion!',
          description: 'Wireless Earbuds Pro just earned you RM 4.50 commission',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 5),
        },
        {
          type: 'alert',
          title: 'Low Conversion Rate Alert',
          description: 'Your Yoga Mat Premium link has a conversion rate below 5%',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          type: 'system',
          title: 'Campaign Ending Soon',
          description: 'Back to School campaign ends in 3 days',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
        },
        {
          type: 'achievement',
          title: 'Achievement Unlocked!',
          description: 'You reached 500 total conversions! 🎉',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
        {
          type: 'payout',
          title: 'Payout Processed',
          description: 'RM 1,250.00 has been transferred to your Maybank account',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        },
        {
          type: 'insight',
          title: 'Hermes Insight',
          description: 'Electronics category showing 25% increase in conversion rate this week',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        },
        {
          type: 'conversion',
          title: 'Bulk Conversions!',
          description: '5 new conversions from USB-C Hub 7-in-1 in the last hour',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        },
        {
          type: 'system',
          title: 'New Feature Available',
          description: 'Hermes AI Agent is now available for affiliate optimization',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
        },
      ],
    })

    // ─── Create Achievements ──────────────────────────────────────
    await db.achievement.createMany({
      data: [
        {
          userId: users[0].id,
          type: 'milestone',
          title: 'First 100 Clicks',
          description: 'Reached 100 total clicks on your affiliate links',
          icon: '🎯',
          earnedAt: new Date('2025-01-15'),
        },
        {
          userId: users[0].id,
          type: 'milestone',
          title: 'Conversion Master',
          description: 'Achieved 500 total conversions',
          icon: '🏆',
          earnedAt: new Date('2025-02-20'),
        },
        {
          userId: users[0].id,
          type: 'earning',
          title: 'RM 1,000 Earner',
          description: 'Earned over RM 1,000 in total commissions',
          icon: '💰',
          earnedAt: new Date('2025-03-01'),
        },
        {
          userId: users[1].id,
          type: 'milestone',
          title: 'Quick Starter',
          description: 'Got first 50 clicks within a week',
          icon: '⚡',
          earnedAt: new Date('2025-01-10'),
        },
        {
          userId: users[0].id,
          type: 'streak',
          title: '7-Day Streak',
          description: 'Had at least one conversion every day for 7 days',
          icon: '🔥',
          earnedAt: new Date('2025-03-10'),
        },
      ],
    })

    // ─── Create Leaderboard Entries ───────────────────────────────
    await db.leaderboardEntry.createMany({
      data: [
        {
          userId: users[0].id,
          userName: 'Admin User',
          totalEarnings: 4291.5,
          totalClicks: 12847,
          totalConversions: 892,
          period: '2025-03',
          rank: 1,
        },
        {
          userId: users[1].id,
          userName: 'Ahmad Razak',
          totalEarnings: 2180.75,
          totalClicks: 6540,
          totalConversions: 455,
          period: '2025-03',
          rank: 2,
        },
        {
          userId: users[2].id,
          userName: 'Siti Nurhaliza',
          totalEarnings: 890.0,
          totalClicks: 3200,
          totalConversions: 180,
          period: '2025-03',
          rank: 3,
        },
        {
          userName: 'Lim Wei Chong',
          totalEarnings: 654.25,
          totalClicks: 2800,
          totalConversions: 140,
          period: '2025-03',
          rank: 4,
        },
        {
          userName: 'Priya Sharma',
          totalEarnings: 432.0,
          totalClicks: 1950,
          totalConversions: 95,
          period: '2025-03',
          rank: 5,
        },
      ],
    })

    // ─── Create Hermes Connection ─────────────────────────────────
    const hermesConnection = await db.hermesConnection.create({
      data: {
        name: 'Default Hermes Connection',
        endpoint: 'https://api.z-ai.com',
        model: 'hermes-3',
        isActive: true,
        status: 'connected',
        lastConnected: new Date(),
      },
    })

    // ─── Create Hermes Conversations & Messages ───────────────────
    const conversation1 = await db.hermesConversation.create({
      data: {
        connectionId: hermesConnection.id,
        title: 'Product Research for Electronics',
        messageCount: 4,
        isActive: true,
      },
    })

    await db.hermesMessage.createMany({
      data: [
        {
          conversationId: conversation1.id,
          role: 'user',
          content: 'What are the best selling electronics on Shopee Malaysia right now?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
        {
          conversationId: conversation1.id,
          role: 'assistant',
          content: '**Top Selling Electronics on Shopee Malaysia**\n\n1. **Wireless Earbuds** - Consistently high demand, especially under RM100\n2. **Phone Cases & Accessories** - High volume, good commission rates\n3. **USB-C Hubs & Adapters** - Growing demand with newer laptops\n4. **Smart Home Devices** - Trending upward, premium commissions\n5. **Gaming Peripherals** - Strong niche audience\n\nI recommend focusing on wireless earbuds and phone accessories for volume, with a few smart home items for higher commissions.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 5000),
        },
        {
          conversationId: conversation1.id,
          role: 'user',
          content: 'What commission rates should I target?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
        },
        {
          conversationId: conversation1.id,
          role: 'assistant',
          content: '**Commission Rate Strategy**\n\n• **5-8%** - Sweet spot for electronics and accessories\n• **8-12%** - Available for fashion and beauty products\n• **3-5%** - Typical for high-ticket items (laptops, phones)\n\n**My recommendation:** Focus on products with 5%+ commission and a price point of RM 30-100. This gives you the best balance of conversion volume and per-sale earnings.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23 + 5000),
        },
      ],
    })

    const conversation2 = await db.hermesConversation.create({
      data: {
        connectionId: hermesConnection.id,
        title: 'Campaign Optimization Tips',
        messageCount: 2,
        isActive: true,
      },
    })

    await db.hermesMessage.createMany({
      data: [
        {
          conversationId: conversation2.id,
          role: 'user',
          content: 'How can I improve my conversion rate?',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
        {
          conversationId: conversation2.id,
          role: 'assistant',
          content: "**Conversion Rate Optimization Tips**\n\n1. **Target the right audience** - Focus on Malaysian buyers aged 18-35\n2. **Use compelling CTAs** - \"Grab it before it's gone!\" works well\n3. **Leverage FOMO** - Highlight limited-time offers and stock levels\n4. **Mobile optimization** - 68% of Shopee traffic is mobile\n5. **Product reviews** - Share genuine reviews to build trust\n\nYour current conversion rate of 6.94% is above average. Keep optimizing!",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 5000),
        },
      ],
    })

    // ─── Create Hermes Skills ─────────────────────────────────────
    await db.hermesSkill.createMany({
      data: [
        {
          name: 'Product Analyzer',
          description: 'Analyzes product performance and suggests optimization strategies',
          category: 'analytics',
          code: 'async function analyzeProduct(productId) { /* analysis logic */ }',
          trigger: 'product_analysis_request',
          status: 'active',
          usageCount: 45,
          successRate: 92,
          version: 3,
          learnedFrom: 'user_interactions',
        },
        {
          name: 'Content Generator',
          description: 'Generates promotional content for affiliate products',
          category: 'content',
          code: 'async function generateContent(product, platform) { /* content gen logic */ }',
          trigger: 'content_generation_request',
          status: 'active',
          usageCount: 78,
          successRate: 88,
          version: 2,
          learnedFrom: 'marketing_best_practices',
        },
        {
          name: 'Link Optimizer',
          description: 'Optimizes affiliate link placement and timing',
          category: 'optimization',
          code: 'async function optimizeLink(linkId) { /* optimization logic */ }',
          trigger: 'link_optimization_request',
          status: 'active',
          usageCount: 32,
          successRate: 85,
          version: 2,
          learnedFrom: 'performance_data',
        },
        {
          name: 'Trend Detector',
          description: 'Detects emerging trends in Shopee marketplace',
          category: 'analytics',
          code: 'async function detectTrends() { /* trend detection logic */ }',
          trigger: 'trend_check',
          status: 'active',
          usageCount: 56,
          successRate: 90,
          version: 4,
          learnedFrom: 'market_data',
        },
        {
          name: 'Campaign Scheduler',
          description: 'Automatically schedules and manages campaigns',
          category: 'automation',
          code: 'async function scheduleCampaign(campaignId) { /* scheduling logic */ }',
          trigger: 'campaign_schedule',
          status: 'learning',
          usageCount: 12,
          successRate: 75,
          version: 1,
          learnedFrom: 'user_patterns',
        },
        {
          name: 'Commission Tracker',
          description: 'Tracks commission changes and alerts on rate drops',
          category: 'monitoring',
          code: 'async function trackCommissions() { /* tracking logic */ }',
          trigger: 'commission_check',
          status: 'active',
          usageCount: 120,
          successRate: 95,
          version: 5,
          learnedFrom: 'commission_history',
        },
        {
          name: 'Audience Profiler',
          description: 'Profiles audience demographics and behavior patterns',
          category: 'analytics',
          code: 'async function profileAudience() { /* profiling logic */ }',
          trigger: 'audience_analysis',
          status: 'draft',
          usageCount: 0,
          successRate: 0,
          version: 1,
        },
        {
          name: 'SEO Optimizer',
          description: 'Optimizes affiliate content for search engines',
          category: 'optimization',
          code: 'async function optimizeSEO(content) { /* SEO logic */ }',
          trigger: 'seo_request',
          status: 'archived',
          usageCount: 23,
          successRate: 70,
          version: 1,
          learnedFrom: 'seo_guidelines',
        },
      ],
    })

    // ─── Create Hermes Tasks ──────────────────────────────────────
    await db.hermesTask.createMany({
      data: [
        {
          name: 'Daily Product Scan',
          description: 'Scan top products daily and update performance metrics',
          schedule: '0 9 * * *',
          status: 'scheduled',
          nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          runCount: 30,
          lastResult: 'Updated 45 products, 3 new trending items found',
        },
        {
          name: 'Commission Rate Monitor',
          description: 'Check for commission rate changes every 6 hours',
          schedule: '0 */6 * * *',
          status: 'scheduled',
          nextRunAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
          runCount: 120,
          lastResult: '2 products had commission changes detected',
          lastRunAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          name: 'Weekly Performance Report',
          description: 'Generate weekly performance summary and insights',
          schedule: '0 10 * * 1',
          status: 'scheduled',
          nextRunAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          runCount: 8,
          lastResult: 'Report generated: 15% click increase, 8% conversion increase',
          lastRunAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Trend Alert Scanner',
          description: 'Scan for trending products and send alerts',
          schedule: '0 */12 * * *',
          status: 'running',
          runCount: 45,
          lastResult: '5 trending products found in electronics category',
          lastRunAt: new Date(Date.now() - 1000 * 60 * 10),
        },
        {
          name: 'Link Health Check',
          description: 'Verify all affiliate links are active and working',
          schedule: '0 8 * * *',
          status: 'scheduled',
          nextRunAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          runCount: 22,
          lastResult: 'All 24 links are active and working',
          lastRunAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
        {
          name: 'Content Performance Review',
          description: 'Analyze content performance and suggest improvements',
          schedule: '0 14 * * 5',
          status: 'failed',
          runCount: 6,
          lastResult: 'Error: API rate limit exceeded',
          lastRunAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
    })

    // ─── Create Hermes Insights ───────────────────────────────────
    await db.hermesInsight.createMany({
      data: [
        {
          type: 'trend',
          title: 'Mobile Clicks Dominance',
          description: '68% of all clicks come from mobile devices. Consider optimizing your content for mobile-first experience.',
          severity: 'info',
          isRead: false,
        },
        {
          type: 'opportunity',
          title: 'Electronics Category Surge',
          description: 'Electronics products are seeing a 25% increase in conversion rate this month. Consider promoting more electronics items.',
          severity: 'info',
          isRead: false,
        },
        {
          type: 'alert',
          title: 'Low Conversion on Weekend Traffic',
          description: 'Weekend click volume is 40% higher but conversion rate drops by 15%. Weekend visitors may be browsing rather than buying.',
          severity: 'warning',
          isRead: false,
        },
        {
          type: 'recommendation',
          title: 'Optimize Underperforming Links',
          description: '5 links have over 100 clicks but 0 conversions. Review and update their landing pages or consider replacing them.',
          severity: 'info',
          isRead: true,
        },
        {
          type: 'trend',
          title: 'Peak Traffic Hours: 8-10 PM',
          description: 'Your audience is most active between 8-10 PM MYT. Schedule your content posts during this window for maximum engagement.',
          severity: 'info',
          isRead: false,
        },
        {
          type: 'opportunity',
          title: '9.9 Sale Preparation',
          description: 'The 9.9 Super Shopping Day is approaching. Start creating content and shortlinks now to capture early traffic.',
          severity: 'critical',
          isRead: false,
        },
        {
          type: 'alert',
          title: 'Commission Rate Drop Detected',
          description: '3 of your top products have reduced their commission rates from 5% to 3%. Look for alternative products with better rates.',
          severity: 'warning',
          isRead: true,
        },
        {
          type: 'recommendation',
          title: 'Cross-Platform Distribution',
          description: 'Diversify your link distribution across TikTok, Instagram, and Telegram for broader reach. Currently 80% of traffic comes from a single platform.',
          severity: 'info',
          isRead: false,
        },
      ],
    })

    // ─── Create Agent Memories ────────────────────────────────────
    await db.agentMemory.createMany({
      data: [
        {
          agentId: 'hermes-main',
          sessionId: 'sess-001',
          role: 'system',
          content: 'User prefers Malaysian market focus with electronics category',
          metadata: JSON.stringify({ type: 'preference', confidence: 0.95, source: 'user_input' }),
        },
        {
          agentId: 'hermes-main',
          sessionId: 'sess-001',
          role: 'assistant',
          content: 'Recommended focusing on RM 30-100 price range products for optimal conversion',
          metadata: JSON.stringify({ type: 'insight', confidence: 0.88, source: 'data_analysis' }),
        },
        {
          agentId: 'hermes-main',
          sessionId: 'sess-002',
          role: 'system',
          content: 'Peak engagement time for this user is 8-10 PM MYT',
          metadata: JSON.stringify({ type: 'pattern', confidence: 0.92, source: 'behavior_analysis' }),
        },
        {
          agentId: 'hermes-analyzer',
          sessionId: 'sess-003',
          role: 'assistant',
          content: 'Electronics category has highest ROI at 6.2x for this affiliate',
          metadata: JSON.stringify({ type: 'metric', confidence: 0.90, source: 'performance_data' }),
        },
        {
          agentId: 'hermes-main',
          sessionId: 'sess-004',
          role: 'user',
          content: 'User wants to focus on Shopee 9.9 campaign preparation',
          metadata: JSON.stringify({ type: 'goal', confidence: 0.99, source: 'user_input' }),
        },
        {
          agentId: 'hermes-analyzer',
          sessionId: 'sess-003',
          role: 'assistant',
          content: 'Mobile traffic from Instagram converts 2.3x better than desktop traffic',
          metadata: JSON.stringify({ type: 'insight', confidence: 0.85, source: 'conversion_data' }),
        },
        {
          agentId: 'hermes-main',
          sessionId: 'sess-005',
          role: 'system',
          content: 'User has 24 active links, 3 active campaigns',
          metadata: JSON.stringify({ type: 'state', confidence: 1.0, source: 'system_check' }),
        },
        {
          agentId: 'hermes-optimizer',
          sessionId: 'sess-006',
          role: 'assistant',
          content: 'A/B test shows "Limited Time" CTA performs 35% better than "Shop Now"',
          metadata: JSON.stringify({ type: 'experiment', confidence: 0.87, source: 'ab_test' }),
        },
      ],
    })

    // ─── Create Earning Goals ─────────────────────────────────────
    await db.earningGoal.createMany({
      data: [
        {
          name: 'Monthly Earnings Target',
          targetAmount: 5000,
          currentAmount: 2180.75,
          period: 'monthly',
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-03-31'),
          status: 'active',
        },
        {
          name: 'Quarterly Revenue Goal',
          targetAmount: 15000,
          currentAmount: 8543.0,
          period: 'yearly',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
          status: 'active',
        },
        {
          name: '9.9 Campaign Target',
          targetAmount: 3000,
          currentAmount: 0,
          period: 'custom',
          startDate: new Date('2025-09-01'),
          endDate: new Date('2025-09-15'),
          status: 'active',
        },
      ],
    })

    // ─── Create Referrals ─────────────────────────────────────────
    await db.referral.createMany({
      data: [
        {
          referrerId: users[0].id,
          referredEmail: 'friend1@gmail.com',
          referredName: 'Mohammad Ali',
          status: 'active',
          commission: 25.0,
        },
        {
          referrerId: users[0].id,
          referredEmail: 'friend2@gmail.com',
          referredName: 'Lee Mei Ling',
          status: 'pending',
          commission: null,
        },
        {
          referrerId: users[1].id,
          referredEmail: 'friend3@gmail.com',
          referredName: 'Raj Kumar',
          status: 'active',
          commission: 15.0,
        },
      ],
    })

    return NextResponse.json({
      message: 'Database seeded successfully with demo data',
      stats: {
        users: users.length,
        campaigns: campaigns.length,
        links: links.length,
        clicks: clickBatch.length,
        conversions: links.reduce((sum, l) => sum + Math.min(l.conversions, 50), 0),
        notifications: 8,
        achievements: 5,
        leaderboardEntries: 5,
        hermesSkills: 8,
        hermesTasks: 6,
        hermesInsights: 8,
        agentMemories: 8,
        earningGoals: 3,
        referrals: 3,
        payouts: 3,
        conversations: 2,
      },
    })
  } catch (error) {
    console.error('Seed API error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}
