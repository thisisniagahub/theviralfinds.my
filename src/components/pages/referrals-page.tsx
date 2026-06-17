'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Copy,
  Check,
  UserPlus,
  Link2,
  DollarSign,
  Clock,
  ShieldCheck,
  Send,
  Gift,
  ArrowRight,
  Mail,
  User,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { EmptyState } from '@/components/ui/empty-state'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReferralStatus = 'active' | 'pending' | 'inactive'

interface Referral {
  id: string
  name: string
  email: string
  status: ReferralStatus
  commission: number
  date: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockReferrals: Referral[] = [
  { id: '1', name: 'Amirul Hakim', email: 'amirul@email.com', status: 'active', commission: 450.00, date: '2025-02-15' },
  { id: '2', name: 'Siti Nurhaliza', email: 'siti.nh@email.com', status: 'active', commission: 320.50, date: '2025-02-20' },
  { id: '3', name: 'Kevyn Tan', email: 'kevyn.t@email.com', status: 'pending', commission: 0, date: '2025-03-10' },
  { id: '4', name: 'Priya Devi', email: 'priya.d@email.com', status: 'active', commission: 180.00, date: '2025-01-28' },
  { id: '5', name: 'Hasan Ali', email: 'hasan.a@email.com', status: 'inactive', commission: 75.20, date: '2025-01-05' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRM = (value: number) =>
  `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const statusVariant: Record<ReferralStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  pending: 'secondary',
  inactive: 'outline',
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReferralsPage() {
  const [copied, setCopied] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [successStoryOpen, setSuccessStoryOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>(mockReferrals)

  const referralLink = 'https://shopee.com/r/theviralfindsMY?ref=aff2025'

  // "Invite friends" CTA — copies the referral link and provides a hint.
  const handleInviteFriends = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
    } catch {
      // Fallback — clipboard may be blocked; user can still copy from the link card.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalReferrals = referrals.length
  const activeReferrals = referrals.filter((r) => r.status === 'active').length
  const pendingReferrals = referrals.filter((r) => r.status === 'pending').length
  const totalCommission = referrals.reduce((sum, r) => sum + r.commission, 0)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleInvite = () => {
    if (!inviteName || !inviteEmail) return
    const newReferral: Referral = {
      id: String(Date.now()),
      name: inviteName,
      email: inviteEmail,
      status: 'pending',
      commission: 0,
      date: new Date().toISOString().split('T')[0],
    }
    setReferrals((prev) => [newReferral, ...prev])
    setInviteName('')
    setInviteEmail('')
    setInviteOpen(false)
  }

  const statCards = [
    { title: 'Total Referrals', value: totalReferrals, icon: Users, color: 'text-shopee' },
    { title: 'Active', value: activeReferrals, icon: ShieldCheck, color: 'text-emerald-500' },
    { title: 'Pending', value: pendingReferrals, icon: Clock, color: 'text-amber-500' },
    { title: 'Commission Earned', value: formatRM(totalCommission), icon: DollarSign, color: 'text-shopee' },
  ]

  const howItWorks = [
    {
      step: 1,
      icon: Link2,
      title: 'Share Your Link',
      description: 'Send your unique referral link to friends and followers via any channel.',
    },
    {
      step: 2,
      icon: UserPlus,
      title: 'They Sign Up',
      description: 'When someone signs up through your link and becomes an affiliate, they get linked to you.',
    },
    {
      step: 3,
      icon: Gift,
      title: 'You Earn Commission',
      description: 'Earn a percentage of your referrals\' commission for the first 6 months — passive income!',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
        <p className="text-muted-foreground text-sm">
          Grow your network and earn from your referrals
        </p>
      </motion.div>

      {/* Referral Link */}
      <motion.div {...fadeIn}>
        <Card className="border-shopee/20 bg-shopee/5 card-hover">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">Your Referral Link</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground font-mono">
                  {referralLink}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={fadeIn}>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{stat.title}</CardDescription>
                <stat.icon className={`size-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Referral List Table — or empty state when no referrals yet */}
        {referrals.length === 0 ? (
          <motion.div {...fadeIn} className="lg:col-span-2">
            <EmptyState
              illustration="no-data"
              title="No referrals yet"
              description="Invite friends to TheViralFindsMY and earn 20% of their subscription for 12 months."
              cta={{
                label: copied ? 'Link copied!' : 'Invite friends',
                icon: copied ? Check : UserPlus,
                onClick: handleInviteFriends,
              }}
              exampleAction={{
                label: 'See success story',
                onClick: () => setSuccessStoryOpen(true),
              }}
            />
          </motion.div>
        ) : (
        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Referral List</CardTitle>
                <CardDescription>All your referred affiliates</CardDescription>
              </div>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="size-4" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite a Friend</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join the Shopee Affiliate Program.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="invite-name">Name</Label>
                      <div className="relative">
                        <User className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                          id="invite-name"
                          placeholder="e.g. Ahmad Razak"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <div className="relative">
                        <Mail className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="e.g. ahmad@email.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={!inviteName || !inviteEmail} className="gap-2">
                      <Send className="size-4" />
                      Send Invite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell className="font-medium">{ref.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {ref.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[ref.status]} className="capitalize">
                            {ref.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-shopee">
                          {formatRM(ref.commission)}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                          {ref.date}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* How It Works */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
              <CardDescription>Start earning from referrals in 3 simple steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {howItWorks.map((step, idx) => (
                <div key={step.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="bg-shopee/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                      <step.icon className="text-shopee size-4" />
                    </div>
                    {idx < howItWorks.length - 1 && (
                      <div className="mt-2 h-6 w-px bg-border" />
                    )}
                  </div>
                  <div className="min-w-0 pt-1">
                    <p className="text-sm font-semibold">
                      Step {step.step}: {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="rounded-lg bg-shopee/5 border border-shopee/10 p-3">
                <p className="text-xs font-medium text-shopee">Referral Bonus</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Earn 5% of your referrals&apos; commission for the first 6 months after they join.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Success story dialog — shown via "See success story" exampleAction */}
      <Dialog open={successStoryOpen} onOpenChange={setSuccessStoryOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-hermes/10">
              <Sparkles className="size-5 text-hermes" />
            </div>
            <DialogTitle>Referral success story</DialogTitle>
            <DialogDescription>
              Here&apos;s what a typical referral journey looks like once your
              friends start earning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Hero stat */}
            <div className="rounded-lg border bg-gradient-to-br from-shopee/10 to-hermes/10 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total earned from 5 referrals
              </p>
              <p className="mt-1 text-3xl font-bold text-shopee">
                RM 1,025.70
              </p>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3" />
                +18% vs. last month
              </p>
            </div>

            {/* Mock referral list */}
            <div className="space-y-2">
              {[
                { name: 'Amirul Hakim', status: 'active', commission: 450.0, months: 4 },
                { name: 'Siti Nurhaliza', status: 'active', commission: 320.5, months: 3 },
                { name: 'Priya Devi', status: 'active', commission: 180.0, months: 2 },
                { name: 'Kevyn Tan', status: 'pending', commission: 0, months: 0 },
              ].map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-shopee/15 text-xs font-semibold text-shopee">
                      {r.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.status === 'pending'
                          ? 'Invited — not joined yet'
                          : `Active for ${r.months} month${r.months === 1 ? '' : 's'}`}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-shopee">
                    {formatRM(r.commission)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSuccessStoryOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-shopee hover:bg-shopee-dark text-white gap-2"
              onClick={() => {
                setSuccessStoryOpen(false)
                handleInviteFriends()
              }}
            >
              <UserPlus className="size-4" />
              Invite my first friend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
