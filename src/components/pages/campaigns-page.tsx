'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Plus,
  Link2,
  Calendar,
  DollarSign,
  TrendingUp,
  PauseCircle,
  BarChart3,
  Rocket,
  Lightbulb,
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
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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

type CampaignStatus = 'active' | 'paused' | 'completed'

interface Campaign {
  id: string
  name: string
  description: string
  status: CampaignStatus
  budget: number
  spent: number
  linksCount: number
  startDate: string
  endDate: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: '11.11 Mega Sale',
    description: 'Biggest sale event of the year with exclusive deals on electronics and fashion.',
    status: 'active',
    budget: 5000,
    spent: 3250,
    linksCount: 24,
    startDate: '2025-11-01',
    endDate: '2025-11-12',
  },
  {
    id: '2',
    name: 'Raya Collection 2025',
    description: 'Promote festive fashion, home decor, and food hampers for Hari Raya.',
    status: 'active',
    budget: 3000,
    spent: 1200,
    linksCount: 18,
    startDate: '2025-03-01',
    endDate: '2025-03-31',
  },
  {
    id: '3',
    name: 'Tech Week Deals',
    description: 'Highlight the best gadgets and tech accessories with special commission rates.',
    status: 'paused',
    budget: 2000,
    spent: 850,
    linksCount: 12,
    startDate: '2025-02-15',
    endDate: '2025-02-22',
  },
  {
    id: '4',
    name: 'Back to School',
    description: 'Stationery, bags, and educational products for the new school term.',
    status: 'completed',
    budget: 1500,
    spent: 1420,
    linksCount: 15,
    startDate: '2025-01-05',
    endDate: '2025-01-31',
  },
  {
    id: '5',
    name: 'Beauty Glow Up',
    description: 'Skincare and makeup essentials with higher commission tiers.',
    status: 'active',
    budget: 4000,
    spent: 1800,
    linksCount: 20,
    startDate: '2025-03-10',
    endDate: '2025-04-10',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRM = (value: number) =>
  `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const statusConfig: Record<CampaignStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Play }> = {
  active: { label: 'Active', variant: 'default', icon: Play },
  paused: { label: 'Paused', variant: 'secondary', icon: Pause },
  completed: { label: 'Completed', variant: 'outline', icon: CheckCircle2 },
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

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [createOpen, setCreateOpen] = useState(false)
  const [exampleOpen, setExampleOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formBudget, setFormBudget] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')

  // Example mock campaign shown via the "See example campaign" exampleAction.
  const exampleCampaign: Campaign = {
    id: 'example',
    name: '11.11 Mega Sale (Example)',
    description:
      'Biggest sale event of the year with exclusive deals on electronics and fashion. Curated top-performing products, batch-generated 24 links, scheduled social posts.',
    status: 'active',
    budget: 5000,
    spent: 3250,
    linksCount: 24,
    startDate: '2025-11-01',
    endDate: '2025-11-12',
  }

  const totalCampaigns = campaigns.length
  const activeCount = campaigns.filter((c) => c.status === 'active').length
  const pausedCount = campaigns.filter((c) => c.status === 'paused').length
  const completedCount = campaigns.filter((c) => c.status === 'completed').length

  const handleCreate = () => {
    if (!formName || !formBudget) return
    const newCampaign: Campaign = {
      id: String(Date.now()),
      name: formName,
      description: formDesc,
      status: 'active',
      budget: parseFloat(formBudget),
      spent: 0,
      linksCount: 0,
      startDate: formStart || new Date().toISOString().split('T')[0],
      endDate: formEnd || '',
    }
    setCampaigns((prev) => [newCampaign, ...prev])
    setFormName('')
    setFormDesc('')
    setFormBudget('')
    setFormStart('')
    setFormEnd('')
    setCreateOpen(false)
  }

  const togglePause = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'paused' ? 'active' : 'paused' }
          : c
      )
    )
  }

  const markComplete = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'completed' } : c))
    )
  }

  const deleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  const statCards = [
    { title: 'Total Campaigns', value: totalCampaigns, icon: Megaphone, color: 'text-shopee' },
    { title: 'Active', value: activeCount, icon: Play, color: 'text-emerald-500' },
    { title: 'Paused', value: pausedCount, icon: PauseCircle, color: 'text-amber-500' },
    { title: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Manage your affiliate campaigns and track performance
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new affiliate campaign with budget and schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g. 12.12 Year-End Sale"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-desc">Description</Label>
                <Textarea
                  id="campaign-desc"
                  placeholder="Describe your campaign goals and strategy..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-budget">Budget (RM)</Label>
                <Input
                  id="campaign-budget"
                  type="number"
                  placeholder="e.g. 3000"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="campaign-start">Start Date</Label>
                  <Input
                    id="campaign-start"
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="campaign-end">End Date</Label>
                  <Input
                    id="campaign-end"
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formName || !formBudget}>
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* Campaign Cards Grid */}
      {campaigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <EmptyState
            illustration="no-campaigns"
            title="No campaigns yet"
            description="Launch your first campaign to organize your affiliate promotions and track performance over time."
            cta={{
              label: 'Launch your first campaign',
              icon: Rocket,
              onClick: () => setCreateOpen(true),
            }}
            exampleAction={{
              label: 'See example campaign',
              onClick: () => setExampleOpen(true),
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {campaigns.map((campaign) => {
          const pct = Math.min(Math.round((campaign.spent / campaign.budget) * 100), 100)
          const cfg = statusConfig[campaign.status]
          return (
            <motion.div key={campaign.id} variants={fadeIn}>
              <Card className="card-hover flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base leading-tight">{campaign.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-xs">
                        {campaign.description}
                      </CardDescription>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0 capitalize">
                      {cfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {/* Budget Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="size-3" />
                        Budget
                      </span>
                      <span className="font-medium">
                        {formatRM(campaign.spent)} / {formatRM(campaign.budget)}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-muted-foreground text-xs">{pct}% spent</p>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Link2 className="size-3" />
                      {campaign.linksCount} links
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {campaign.startDate} → {campaign.endDate || 'Ongoing'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Pencil className="size-3" />
                      Edit
                    </Button>
                    {campaign.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => togglePause(campaign.id)}
                      >
                        {campaign.status === 'paused' ? (
                          <>
                            <Play className="size-3" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="size-3" />
                            Pause
                          </>
                        )}
                      </Button>
                    )}
                    {campaign.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => markComplete(campaign.id)}
                      >
                        <CheckCircle2 className="size-3" />
                        Complete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => deleteCampaign(campaign.id)}
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
        </motion.div>
      )}

      {/* Example campaign dialog (shown via "See example campaign" exampleAction) */}
      <Dialog open={exampleOpen} onOpenChange={setExampleOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-shopee/10">
              <Lightbulb className="size-5 text-shopee" />
            </div>
            <DialogTitle>Example campaign</DialogTitle>
            <DialogDescription>
              Here&apos;s what a well-structured affiliate campaign looks like.
              Use it as inspiration for your first launch.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold leading-tight">
                  {exampleCampaign.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {exampleCampaign.description}
                </p>
              </div>
              <Badge variant="default" className="capitalize shrink-0">
                {exampleCampaign.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="size-3" />
                  Budget
                </span>
                <span className="font-medium">
                  {formatRM(exampleCampaign.spent)} /{' '}
                  {formatRM(exampleCampaign.budget)}
                </span>
              </div>
              <Progress
                value={Math.round(
                  (exampleCampaign.spent / exampleCampaign.budget) * 100,
                )}
                className="h-2"
              />
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Link2 className="size-3" />
                {exampleCampaign.linksCount} links
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {exampleCampaign.startDate} → {exampleCampaign.endDate}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setExampleOpen(false)}
            >
              Close
            </Button>
            <Button
              className="bg-shopee hover:bg-shopee-dark text-white gap-2"
              onClick={() => {
                setExampleOpen(false)
                setCreateOpen(true)
              }}
            >
              <Plus className="size-4" />
              Create my campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
