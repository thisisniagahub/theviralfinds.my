'use client'

import * as React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { type LucideIcon, Sparkles, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ILLUSTRATION_COMPONENTS,
  ILLUSTRATION_LABELS,
  type EmptyIllustrationKey,
} from '@/components/illustrations/empty-illustrations'

// ─── New API types ────────────────────────────────────────────────────────────

interface EmptyStateCTA {
  label: string
  onClick: () => void
  icon?: React.ElementType
  /** Optional variant for the primary CTA button. Defaults to "default" (shopee-colored). */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
}

interface EmptyStateExampleAction {
  /** Button label, e.g. "Show me an example" or "Watch 60s tutorial". */
  label: string
  onClick: () => void
  icon?: React.ElementType
}

interface NewEmptyStateProps {
  /** One of 8 custom on-brand SVG illustrations. */
  illustration: EmptyIllustrationKey
  /** Empathetic headline (NOT "No data"). */
  title: string
  /** Specific helpful text. */
  description: string
  /** Primary call-to-action button. */
  cta?: EmptyStateCTA
  /** Secondary "Show me an example" link. */
  exampleAction?: EmptyStateExampleAction
  className?: string
  /**
   * Compact variant — smaller padding, smaller illustration. Use inside cards
   * or in tight vertical layouts where the full-size version would dominate.
   */
  compact?: boolean
  /**
   * Hide the Card wrapper (border + padding) and render just the content.
   * Useful when embedding inside an existing Card or Table cell.
   */
  unwrapped?: boolean
}

// ─── Legacy API types (backward compatibility) ──────────────────────────────

interface LegacyEmptyStateProps {
  /** Lucide icon (legacy API — used by alerts-page.tsx). */
  icon: LucideIcon
  title: string
  description?: string
  /** Render-prop style action (legacy API). */
  action?: React.ReactNode
  className?: string
  compact?: boolean
}

type EmptyStateProps = NewEmptyStateProps | LegacyEmptyStateProps

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isLegacyProps(props: EmptyStateProps): props is LegacyEmptyStateProps {
  return !('illustration' in props) && 'icon' in props
}

// ─── Legacy implementation (preserved for alerts-page.tsx) ───────────────────

function LegacyEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: LegacyEmptyStateProps) {
  if (compact) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mb-3 max-w-sm mx-auto">
            {description}
          </p>
        )}
        {action}
      </div>
    )
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="text-center p-8 sm:p-12">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {description}
          </p>
        )}
        {action}
      </CardContent>
    </Card>
  )
}

// ─── New implementation ──────────────────────────────────────────────────────

const NewEmptyState = React.forwardRef<HTMLDivElement, NewEmptyStateProps>(
  function NewEmptyState(
    {
      illustration,
      title,
      description,
      cta,
      exampleAction,
      className,
      compact = false,
      unwrapped = false,
    },
    ref,
  ) {
    const prefersReducedMotion = useReducedMotion()
    const Illustration = ILLUSTRATION_COMPONENTS[illustration]
    const ariaLabel = ILLUSTRATION_LABELS[illustration]

    // Color hint: pass currentColor via text-* class on the wrapper so the SVG's
    // currentColor resolves to the right brand color. Orange for engagement-style
    // illustrations (no-data, no-links, no-campaigns, no-results); purple for the
    // AI / locked / notification-style ones.
    const purpleIllustrations: EmptyIllustrationKey[] = [
      'no-api',
      'locked',
      'empty-feed',
      'no-notifications',
    ]
    const isPurple = purpleIllustrations.includes(illustration)
    const illustrationColorClass = isPurple ? 'text-hermes' : 'text-shopee'

    // Entrance animation variants — gentle fade-in + slight upward float.
    const containerVariants = {
      hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      },
      exit: {
        opacity: 0,
        y: prefersReducedMotion ? 0 : -8,
        transition: { duration: 0.25, ease: 'easeIn' as const },
      },
    }

    const illustrationVariants = {
      hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.85 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.5,
          delay: 0.05,
          ease: [0.34, 1.56, 0.64, 1] as const,
        },
      },
    }

    const textVariants = {
      hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 6 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          delay: 0.15 + i * 0.08,
          ease: 'easeOut' as const,
        },
      }),
    }

    const content = (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          'flex flex-col items-center text-center',
          compact ? 'py-6' : 'py-8',
          className,
        )}
      >
        {/* Illustration */}
        <motion.div
          variants={illustrationVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            'relative',
            compact ? 'w-28 h-28 mb-3' : 'w-44 h-44 mb-5',
            illustrationColorClass,
          )}
        >
          <Illustration
            className={cn('w-full h-full', illustrationColorClass)}
            role="img"
            aria-label={ariaLabel}
          />
        </motion.div>

        {/* Headline */}
        <motion.h3
          custom={0}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            'font-bold tracking-tight',
            compact ? 'text-base mb-1.5' : 'text-xl mb-2',
          )}
        >
          {title}
        </motion.h3>

        {/* Description */}
        <motion.p
          custom={1}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            'text-muted-foreground leading-relaxed',
            compact
              ? 'text-xs mb-4 max-w-xs'
              : 'text-sm mb-6 max-w-md',
          )}
        >
          {description}
        </motion.p>

        {/* Actions */}
        {(cta || exampleAction) && (
          <motion.div
            custom={2}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              'flex flex-wrap items-center justify-center gap-3',
              compact ? 'flex-col gap-2' : '',
            )}
          >
            {cta && (
              <Button
                onClick={cta.onClick}
                variant={cta.variant ?? 'default'}
                size={compact ? 'sm' : 'default'}
                className={cn(
                  'gap-2 group',
                  (!cta.variant || cta.variant === 'default') &&
                    'bg-shopee hover:bg-shopee-dark text-white',
                )}
              >
                {cta.icon && <cta.icon className="size-4" />}
                {cta.label}
                {!cta.icon && (
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>
            )}
            {exampleAction && (
              <Button
                onClick={exampleAction.onClick}
                variant="ghost"
                size={compact ? 'sm' : 'default'}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {exampleAction.icon ? (
                  <exampleAction.icon className="size-3.5" />
                ) : (
                  <Sparkles className="size-3.5 text-hermes" />
                )}
                {exampleAction.label}
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    )

    if (unwrapped) {
      return content
    }

    return (
      <Card
        className={cn(
          'border-dashed bg-gradient-to-b from-transparent to-muted/30',
          compact ? 'py-2' : '',
        )}
      >
        <CardContent className={compact ? 'p-4' : 'p-6 sm:p-10'}>
          {content}
        </CardContent>
      </Card>
    )
  },
)

// ─── Public component (dispatches legacy vs new) ─────────────────────────────

/**
 * Friendly "no data yet" placeholder. Two supported shapes:
 *
 * 1. NEW (recommended) — pass an `illustration` key from the 8 custom on-brand
 *    SVG illustrations:
 *    ```tsx
 *    <EmptyState
 *      illustration="no-campaigns"
 *      title="No campaigns yet"
 *      description="Launch your first campaign..."
 *      cta={{ label: "Launch your first campaign", onClick: openCreate }}
 *      exampleAction={{ label: "See example campaign", onClick: showExample }}
 *    />
 *    ```
 *
 * 2. LEGACY — pass a `icon` (LucideIcon) and optional `action` ReactNode.
 *    Preserved so existing call sites (e.g. alerts-page.tsx) keep working.
 *
 * @example
 *   {links.length === 0 && (
 *     <EmptyState
 *       illustration="no-links"
 *       title="You haven't created any links yet"
 *       description="Create your first affiliate link in 30 seconds..."
 *       cta={{ label: "Create your first link", onClick: handleCreate }}
 *       exampleAction={{ label: "Watch 60s tutorial", onClick: openTutorial }}
 *     />
 *   )}
 */
export function EmptyState(props: EmptyStateProps) {
  if (isLegacyProps(props)) {
    return <LegacyEmptyState {...props} />
  }
  return (
    <AnimatePresence mode="wait">
      <NewEmptyState key={props.illustration + props.title} {...props} />
    </AnimatePresence>
  )
}

export type { NewEmptyStateProps, EmptyStateCTA, EmptyStateExampleAction }
