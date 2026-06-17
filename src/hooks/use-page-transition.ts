'use client'

/**
 * usePageTransition — returns a Framer Motion `variants` object for a soft
 * fade + slide-up entrance, suitable for wrapping any page or major section.
 *
 * Accessibility:
 *   When the user prefers reduced motion, the variants become effectively
 *   static (opacity 1, y 0, duration 0) so the content shows instantly
 *   without any motion.
 *
 * Usage:
 *   const pageTransition = usePageTransition()
 *   <motion.div variants={pageTransition} initial="hidden" animate="visible">
 *     ...
 *   </motion.div>
 */

import { useEffect, useState } from 'react'
import type { Variants } from 'framer-motion'

const MOTION_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

const STATIC_VARIANTS: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0 },
  },
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function usePageTransition(): Variants {
  const [reduced, setReduced] = useState<boolean>(prefersReducedMotion())

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (): void => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced ? STATIC_VARIANTS : MOTION_VARIANTS
}

/**
 * Stagger container — pair with `usePageTransition`'s item variants to fade
 * a list of items in sequence. Respects reduced motion automatically.
 *
 * Usage:
 *   const container = useStaggerContainer()
 *   <motion.ul variants={container} initial="hidden" animate="visible">
 *     <motion.li variants={usePageTransition()} />
 *     <motion.li variants={usePageTransition()} />
 *   </motion.ul>
 */
export function useStaggerContainer(staggerChildren = 0.06): Variants {
  const reduced = prefersReducedMotion()
  if (reduced) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1, transition: { duration: 0 } },
    }
  }
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren,
        delayChildren: 0.05,
      },
    },
  }
}
