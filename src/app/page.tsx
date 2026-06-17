'use client'

import { useAppStore, type PageId } from '@/store/app-store'
import { AppSidebar } from '@/components/layout/sidebar'
import { AppHeader } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { MobileSheet } from '@/components/layout/mobile-sheet'
import { RealtimeProvider } from '@/components/realtime/realtime-provider'
import { RegisterSW } from '@/components/pwa/register-sw'
import { PullToRefreshWrapper } from '@/components/pwa/pull-to-refresh-wrapper'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorBoundary } from '@/components/error-boundary'
import { NetworkBanner } from '@/components/network-banner'
import { PageSkeleton } from '@/components/ui/inline-skeleton'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { HermesChatWidget } from '@/components/hermes/chat-widget'
import { HermesReactions } from '@/components/hermes/hermes-reactions'
import { OfflineBanner } from '@/components/pwa/offline-banner'
import { defaultQueryClientOptions } from '@/lib/query-config'
import {
  LayoutDashboard, ShoppingBag, Link2, BarChart3, Calculator,
  Megaphone, Wallet, Bot, Award, Trophy, Users, Bell, Settings,
  Plus, HelpCircle, FileText, Shield, Lock, Plug,
  DollarSign, LogIn, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'

// Lazy load page components for performance
const DashboardPage = lazy(() => import('@/components/pages/dashboard-page').then(m => ({ default: m.DashboardPage })))
const ProductsPage = lazy(() => import('@/components/pages/products-page').then(m => ({ default: m.ProductsPage })))
const LinksPage = lazy(() => import('@/components/pages/links-page').then(m => ({ default: m.LinksPage })))
const AnalyticsPage = lazy(() => import('@/components/pages/analytics-page').then(m => ({ default: m.AnalyticsPage })))
const CampaignsPage = lazy(() => import('@/components/pages/campaigns-page').then(m => ({ default: m.CampaignsPage })))
const CalculatorPage = lazy(() => import('@/components/pages/calculator-page').then(m => ({ default: m.CalculatorPage })))
const EarningsPage = lazy(() => import('@/components/pages/earnings-page').then(m => ({ default: m.EarningsPage })))
const AutopostPage = lazy(() => import('@/components/pages/autopost-page').then(m => ({ default: m.AutopostPage })))
const ContentPage = lazy(() => import('@/components/pages/content-page').then(m => ({ default: m.ContentPage })))
const TrendsPage = lazy(() => import('@/components/pages/trends-page').then(m => ({ default: m.TrendsPage })))
const ProfitPage = lazy(() => import('@/components/pages/profit-page').then(m => ({ default: m.ProfitPage })))
const StudioPage = lazy(() => import('@/components/pages/studio-page').then(m => ({ default: m.StudioPage })))
const HermesPage = lazy(() => import('@/components/pages/hermes-page').then(m => ({ default: m.HermesPage })))
const AchievementsPage = lazy(() => import('@/components/pages/achievements-page').then(m => ({ default: m.AchievementsPage })))
const LeaderboardPage = lazy(() => import('@/components/pages/leaderboard-page').then(m => ({ default: m.LeaderboardPage })))
const ReferralsPage = lazy(() => import('@/components/pages/referrals-page').then(m => ({ default: m.ReferralsPage })))
const NotificationsPage = lazy(() => import('@/components/pages/notifications-page').then(m => ({ default: m.NotificationsPage })))
const SettingsPage = lazy(() => import('@/components/pages/settings-page').then(m => ({ default: m.SettingsPage })))
const LoginPage = lazy(() => import('@/components/pages/login-page').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/components/pages/register-page').then(m => ({ default: m.RegisterPage })))

// Fasa 2 — Multi-platform expansion
const TikTokPage = lazy(() => import('@/components/pages/tiktok-page').then(m => ({ default: m.TikTokPage })))
const LazadaPage = lazy(() => import('@/components/pages/lazada-page').then(m => ({ default: m.LazadaPage })))
const LivePage = lazy(() => import('@/components/pages/live-page').then(m => ({ default: m.LivePage })))
const ComparePage = lazy(() => import('@/components/pages/compare-page').then(m => ({ default: m.ComparePage })))
const UnifiedPage = lazy(() => import('@/components/pages/unified-page').then(m => ({ default: m.UnifiedPage })))
const MatcherPage = lazy(() => import('@/components/pages/matcher-page').then(m => ({ default: m.MatcherPage })))

// Fasa 3 — AI Superpowers
const RecommenderPage = lazy(() => import('@/components/pages/recommender-page').then(m => ({ default: m.RecommenderPage })))
const ThumbnailsPage = lazy(() => import('@/components/pages/thumbnails-page').then(m => ({ default: m.ThumbnailsPage })))
const AlertsPage = lazy(() => import('@/components/pages/alerts-page').then(m => ({ default: m.AlertsPage })))
const AbTestingPage = lazy(() => import('@/components/pages/abtesting-page').then(m => ({ default: m.AbTestingPage })))
const AudiencePage = lazy(() => import('@/components/pages/audience-page').then(m => ({ default: m.AudiencePage })))
const HashtagsPage = lazy(() => import('@/components/pages/hashtags-page').then(m => ({ default: m.HashtagsPage })))
const CalendarPage = lazy(() => import('@/components/pages/calendar-page').then(m => ({ default: m.CalendarPage })))

// Fasa 4 — Monetize & Scale
const PricingPage = lazy(() => import('@/components/pages/pricing-page').then(m => ({ default: m.PricingPage })))
const MarketplacePage = lazy(() => import('@/components/pages/marketplace-page').then(m => ({ default: m.MarketplacePage })))
const TeamPage = lazy(() => import('@/components/pages/team-page').then(m => ({ default: m.TeamPage })))
const WhiteLabelPage = lazy(() => import('@/components/pages/whitelabel-page').then(m => ({ default: m.WhiteLabelPage })))
const ApiKeysPage = lazy(() => import('@/components/pages/apikeys-page').then(m => ({ default: m.ApiKeysPage })))

function PageLoader() {
  return <PageSkeleton />
}

const pageComponents: Record<PageId, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: DashboardPage,
  products: ProductsPage,
  links: LinksPage,
  analytics: AnalyticsPage,
  campaigns: CampaignsPage,
  calculator: CalculatorPage,
  earnings: EarningsPage,
  autopost: AutopostPage,
  content: ContentPage,
  trends: TrendsPage,
  profit: ProfitPage,
  studio: StudioPage,
  hermes: HermesPage,
  achievements: AchievementsPage,
  leaderboard: LeaderboardPage,
  referrals: ReferralsPage,
  notifications: NotificationsPage,
  settings: SettingsPage,
  // Fasa 2
  tiktok: TikTokPage,
  lazada: LazadaPage,
  live: LivePage,
  compare: ComparePage,
  unified: UnifiedPage,
  matcher: MatcherPage,
  // Fasa 3
  recommender: RecommenderPage,
  thumbnails: ThumbnailsPage,
  alerts: AlertsPage,
  abtesting: AbTestingPage,
  audience: AudiencePage,
  hashtags: HashtagsPage,
  calendar: CalendarPage,
  // Fasa 4
  pricing: PricingPage,
  marketplace: MarketplacePage,
  team: TeamPage,
  whitelabel: WhiteLabelPage,
  apikeys: ApiKeysPage,
}

function AuthScreen() {
  const { authView } = useAppStore()
  return (
    <Suspense fallback={<AuthLoader />}>
      {authView === 'register' ? <RegisterPage /> : <LoginPage />}
    </Suspense>
  )
}

function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-shopee text-white flex items-center justify-center">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading TheViralFindsMY...
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const { activePage, setActivePage, isAuthenticated, isLoadingAuth, checkAuth } = useAppStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Pull-to-refresh: invalidate all queries so they refetch with fresh data
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries()
    toast.success('Refreshed', { description: 'Latest data loaded.' })
  }, [queryClient])

  const PageComponent = pageComponents[activePage]

  // Show auth screen (login/register) when not authenticated
  if (isLoadingAuth) {
    return <AuthLoader />
  }
  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NetworkBanner />
      <OfflineBanner />
      <div className="flex flex-1">
        <AppSidebar />
        <MobileSheet />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 relative">
            <PullToRefreshWrapper onRefresh={handleRefresh}>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <PageComponent />
                </Suspense>
              </ErrorBoundary>
            </PullToRefreshWrapper>
          </main>

          {/* Footer */}
          <footer className="hidden lg:block border-t border-border bg-gradient-to-b from-muted/30 to-background mt-auto">
            <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-shopee flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-foreground text-sm">TheViralFindsMY</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Empowering Malaysian affiliates with AI-powered analytics, link management, and HERMES intelligent automation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-3">Quick Links</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    { label: 'Dashboard', id: 'dashboard' as PageId, icon: LayoutDashboard },
                    { label: 'Products', id: 'products' as PageId, icon: ShoppingBag },
                    { label: 'Links', id: 'links' as PageId, icon: Link2 },
                    { label: 'Analytics', id: 'analytics' as PageId, icon: BarChart3 },
                    { label: 'Calculator', id: 'calculator' as PageId, icon: Calculator },
                    { label: 'Earnings', id: 'earnings' as PageId, icon: DollarSign },
                    { label: 'Hermes AI', id: 'hermes' as PageId, icon: Bot },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-shopee transition-colors text-left"
                    >
                      <item.icon className="w-3 h-3 flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-3">Support</h4>
                <div className="space-y-1.5">
                  {[
                    { label: 'Help Center', icon: HelpCircle },
                    { label: 'API Docs', icon: FileText },
                    { label: 'Terms of Service', icon: Shield },
                    { label: 'Privacy Policy', icon: Lock },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => toast.info('Coming soon', { description: `${item.label} page is under development.` })}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-shopee transition-colors w-full"
                    >
                      <item.icon className="w-3 h-3 flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-border px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} TheViralFindsMY — Built with ❤️ for Malaysian Affiliates
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-mono bg-shopee/10 text-shopee border-shopee/20">
                  v8.0
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono bg-hermes/10 text-hermes border-hermes/20">
                  HERMES
                </Badge>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* HERMES AI character: milestone reactions + floating chat widget */}
      <HermesReactions />
      <HermesChatWidget />

      {/* Interactive Onboarding Wizard — manages its own open/close state */}
      <OnboardingWizard />

      {/* PWA: Service Worker registration + update toast */}
      <RegisterSW />
    </div>
  )
}

export default function Home() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: defaultQueryClientOptions,
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={null}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RealtimeProvider>
            <AppContent />
            <Toaster position="top-right" richColors />
          </RealtimeProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
