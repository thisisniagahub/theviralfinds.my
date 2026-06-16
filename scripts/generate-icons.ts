/**
 * generate-icons.ts
 *
 * Generates all PWA icons required by manifest.json + Apple touch icon + favicons
 * from a single SVG source (scripts/icon-source.svg).
 *
 * Outputs to public/icons/ and public/:
 *   - public/icons/icon-192.png        (192x192, any)
 *   - public/icons/icon-512.png        (512x512, any)
 *   - public/icons/icon-512-maskable.png (512x512, maskable — padded with bg)
 *   - public/icons/icon-180.png        (180x180, apple-touch-icon)
 *   - public/icons/icon-167.png        (167x167, iPad pro)
 *   - public/icons/icon-152.png        (152x152, iPad)
 *   - public/icons/icon-32.png         (32x32 favicon)
 *   - public/icons/icon-16.png         (16x16 favicon)
 *   - public/apple-touch-icon.png      (180x180 — duplicated for iOS Safari default lookup)
 *   - public/favicon-32.png
 *   - public/favicon-16.png
 *   - public/favicon.ico               (multi-size ICO: 16,32,48)
 *
 * Run: `bun run scripts/generate-icons.ts` (or `bun run icons`)
 */

import sharp from 'sharp'
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd())
const SRC_SVG = path.join(ROOT, 'scripts', 'icon-source.svg')
const ICONS_DIR = path.join(ROOT, 'public', 'icons')
const PUBLIC_DIR = path.join(ROOT, 'public')

interface IconSpec {
  out: string
  size: number
  maskable?: boolean
}

const ICONS: IconSpec[] = [
  { out: path.join(ICONS_DIR, 'icon-192.png'), size: 192 },
  { out: path.join(ICONS_DIR, 'icon-512.png'), size: 512 },
  { out: path.join(ICONS_DIR, 'icon-512-maskable.png'), size: 512, maskable: true },
  { out: path.join(ICONS_DIR, 'icon-180.png'), size: 180 },
  { out: path.join(ICONS_DIR, 'icon-167.png'), size: 167 },
  { out: path.join(ICONS_DIR, 'icon-152.png'), size: 152 },
  { out: path.join(ICONS_DIR, 'icon-32.png'), size: 32 },
  { out: path.join(ICONS_DIR, 'icon-16.png'), size: 16 },
  { out: path.join(PUBLIC_DIR, 'apple-touch-icon.png'), size: 180 },
  { out: path.join(PUBLIC_DIR, 'favicon-32.png'), size: 32 },
  { out: path.join(PUBLIC_DIR, 'favicon-16.png'), size: 16 },
]

async function main() {
  if (!existsSync(SRC_SVG)) {
    console.error(`✗ Source SVG not found: ${SRC_SVG}`)
    process.exit(1)
  }

  if (!existsSync(ICONS_DIR)) await mkdir(ICONS_DIR, { recursive: true })
  if (!existsSync(PUBLIC_DIR)) await mkdir(PUBLIC_DIR, { recursive: true })

  const svgBuffer = await readFile(SRC_SVG)

  console.log(`→ Source SVG: ${SRC_SVG} (${svgBuffer.length} bytes)`)

  // The source SVG already fills the full canvas with the brand background,
  // so for "any" purpose icons we render it 1:1.
  // For "maskable" icons, ChromeOS/Android may crop up to ~20% on each edge.
  // We composite the source SVG at 80% scale on a full-bleed orange background
  // so the logo survives safe-zone cropping.
  for (const spec of ICONS) {
    if (spec.maskable) {
      const inner = sharp(svgBuffer).resize(
        Math.round(spec.size * 0.8),
        Math.round(spec.size * 0.8),
        { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }
      )
      await sharp({
        create: {
          width: spec.size,
          height: spec.size,
          channels: 4,
          background: { r: 238, g: 77, b: 45, alpha: 1 },
        },
      })
        .composite([{ input: await inner.png().toBuffer(), gravity: 'center' }])
        .png()
        .toFile(spec.out)
    } else {
      await sharp(svgBuffer)
        .resize(spec.size, spec.size, { fit: 'cover' })
        .png()
        .toFile(spec.out)
    }
    console.log(`✓ ${path.relative(ROOT, spec.out)} (${spec.size}x${spec.size}${spec.maskable ? ' maskable' : ''})`)
  }

  // Build a multi-size favicon.ico (16, 32, 48) — sharp can write ICO via toFormat
  // but ICO support is spotty; instead, embed 3 PNGs and let browsers pick.
  // Sharp doesn't natively emit .ico, so we write a small 32x32 PNG and copy it as favicon.ico.
  // Most modern browsers accept PNG content with .ico extension.
  const faviconPng = await sharp(svgBuffer).resize(32, 32, { fit: 'cover' }).png().toBuffer()
  const faviconPath = path.join(PUBLIC_DIR, 'favicon.ico')
  await sharp(faviconPng).toFile(faviconPath)
  console.log(`✓ ${path.relative(ROOT, faviconPath)} (32x32 PNG-as-ICO)`)

  console.log('\n✅ All icons generated successfully.')
}

main().catch((err) => {
  console.error('✗ Icon generation failed:', err)
  process.exit(1)
})
