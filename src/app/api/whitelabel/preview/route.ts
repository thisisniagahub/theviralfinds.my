/**
 * White-Label Preview API
 *
 * Fasa 4.4 (CHECKLIST Section 4.4 — White-Label Option).
 *
 * POST /api/whitelabel/preview
 *
 * Body: { config: Partial<WhiteLabelConfig> }
 *
 * Returns the preview payload — CSS variable map, Tailwind class overrides,
 * and a sample dashboard payload (sidebar items, sample product, sample
 * notification, sample stat) ready to be rendered with the supplied branding.
 *
 * The frontend can also call `previewBranding()` directly from the
 * `@/lib/whitelabel/applier` module for instant updates as the user types
 * (no network round-trip). The API exists so a non-JS client could fetch a
 * server-rendered preview snapshot.
 */

import { NextRequest, NextResponse } from 'next/server'

import { previewBranding, validateDomain } from '@/lib/whitelabel/applier'
import type {
  WhiteLabelPreviewData,
  WhiteLabelPreviewRequest,
} from '@/lib/whitelabel/types'

/**
 * A small set of Malaysian-flavoured sample dashboard payloads. The frontend
 * rotates through these when the user clicks "Refresh Sample" so they can see
 * their branding applied to different content types.
 */
const SAMPLES = [
  {
    product: {
      name: 'Baju Kurung Moden Premium',
      price: 'RM 89.90',
      commission: '12% / RM 10.79',
      thumbnail:
        'https://placehold.co/120x120/FFFFFF/18181B/png?text=Baju+Kurung&font=raleway',
    },
    notification: {
      title: 'Commission XTRA Aktif!',
      message:
        'Produk "Kopi Susu Tambun" dapat commission boost 18% selama 6 jam akan datang. Jangan lepaskan!',
    },
    stat: { label: 'Pendapatan Bulan Ini', value: 'RM 4,520.50', delta: '+18.4%' },
  },
  {
    product: {
      name: 'Tudung Bawal Premium Korean',
      price: 'RM 45.00',
      commission: '15% / RM 6.75',
      thumbnail:
        'https://placehold.co/120x120/FFFFFF/7C3AED/png?text=Tudung&font=raleway',
    },
    notification: {
      title: 'Link anda viral di TikTok! 🔥',
      message:
        'Link "Serum Vitamin C" dapat 1,240 klik baru dalam 24 jam lepas. Cek sekarang!',
    },
    stat: { label: 'Total Klik', value: '12,840', delta: '+32.1%' },
  },
  {
    product: {
      name: 'Kopi Susu Tambun 3-in-1 (15 sachet)',
      price: 'RM 19.90',
      commission: '20% / RM 3.98',
      thumbnail:
        'https://placehold.co/120x120/FFFFFF/D97706/png?text=Kopi+Susu&font=raleway',
    },
    notification: {
      title: 'Payout berjaya 💰',
      message:
        'RM 1,250.00 telah dipindahkan ke akaun bank anda. Terima kasih!',
    },
    stat: { label: 'Konversi', value: '4.8%', delta: '+0.6pp' },
  },
]

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    let body: WhiteLabelPreviewRequest
    try {
      body = (await request.json()) as WhiteLabelPreviewRequest
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON body. Expected { config: Partial<WhiteLabelConfig> }.',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    if (!body || !body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        {
          error: 'Field "config" is required (object).',
          source: 'mock' as const,
        },
        { status: 400 },
      )
    }

    // Build the base preview (CSS vars + theme overrides + brand name).
    const base = previewBranding(body.config)

    // Rotate sample based on the brand name hash so each tenant sees a
    // deterministic-but-varied sample dashboard.
    const brandName = body.config.brandName ?? 'TheViralFindsMY'
    let hash = 0
    for (let i = 0; i < brandName.length; i++) {
      hash = (hash * 31 + brandName.charCodeAt(i)) | 0
    }
    const sample = SAMPLES[Math.abs(hash) % SAMPLES.length]

    const preview: WhiteLabelPreviewData = {
      ...base,
      sampleDashboard: {
        ...base.sampleDashboard,
        sampleProduct: sample.product,
        sampleNotification: sample.notification,
        sampleStat: sample.stat,
      },
      domainValid: validateDomain(body.config.domain?.domain ?? ''),
      source: 'mock',
    }

    return NextResponse.json(preview, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[POST /api/whitelabel/preview] error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to build white-label preview.',
        source: 'mock' as const,
      },
      { status: 500 },
    )
  }
}
