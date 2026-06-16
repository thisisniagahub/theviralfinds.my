'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Wallet,
  CircleCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Target,
  Banknote,
} from 'lucide-react'
import { ExportButtons } from '@/components/ui/export-buttons'

// --- Mock Data ---

const earningsChartData = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  earnings: Math.floor(Math.random() * 400) + 80,
}))

const recentConversions = [
  { id: 1, product: 'Xiaomi 14 Ultra', amount: 2999.0, commission: 299.90, status: 'approved', date: '2025-03-15' },
  { id: 2, product: 'Samsung Galaxy S24 FE', amount: 1899.0, commission: 170.91, status: 'approved', date: '2025-03-15' },
  { id: 3, product: 'AirPods Pro 2', amount: 899.0, commission: 67.43, status: 'pending', date: '2025-03-14' },
  { id: 4, product: 'Dyson V15 Detect', amount: 2699.0, commission: 323.88, status: 'approved', date: '2025-03-14' },
  { id: 5, product: 'Nike Air Max 90', amount: 599.0, commission: 35.94, status: 'approved', date: '2025-03-13' },
  { id: 6, product: 'SK-II Facial Essence', amount: 689.0, commission: 96.46, status: 'pending', date: '2025-03-13' },
  { id: 7, product: 'Sony WH-1000XM5', amount: 1299.0, commission: 116.91, status: 'approved', date: '2025-03-12' },
  { id: 8, product: 'Adidas Ultraboost', amount: 759.0, commission: 53.13, status: 'rejected', date: '2025-03-12' },
]

const payoutHistory = [
  { id: 1, method: 'Maybank', amount: 3450.0, status: 'completed', requested: '2025-03-01', processed: '2025-03-03' },
  { id: 2, method: 'CIMB', amount: 2180.0, status: 'completed', requested: '2025-02-15', processed: '2025-02-17' },
  { id: 3, method: 'Maybank', amount: 1920.0, status: 'completed', requested: '2025-02-01', processed: '2025-02-03' },
  { id: 4, method: 'RHB', amount: 2750.0, status: 'processing', requested: '2025-03-10', processed: '-' },
  { id: 5, method: 'Maybank', amount: 1560.0, status: 'completed', requested: '2025-01-15', processed: '2025-01-17' },
]

const earningGoals = [
  { name: 'Monthly Target', current: 4280, target: 5000, color: 'bg-chart-1' },
  { name: 'Quarterly Target', current: 11200, target: 15000, color: 'bg-chart-2' },
  { name: 'Yearly Target', current: 34500, target: 60000, color: 'bg-chart-5' },
]

// --- Helpers ---

const formatRM = (value: number) =>
  `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatNumber = (value: number) => value.toLocaleString('en-MY')

const statusColor: Record<string, string> = {
  approved: 'text-emerald-500',
  pending: 'text-amber-500',
  rejected: 'text-red-500',
  completed: 'text-emerald-500',
  processing: 'text-amber-500',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'destructive',
  completed: 'default',
  processing: 'secondary',
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// --- Component ---

export function EarningsPage() {
  const [calcPrice, setCalcPrice] = useState<string>('')
  const [calcRate, setCalcRate] = useState<string>('')
  const [payoutOpen, setPayoutOpen] = useState(false)

  const calcEarning = useMemo(() => {
    const price = parseFloat(calcPrice)
    const rate = parseFloat(calcRate)
    if (isNaN(price) || isNaN(rate)) return null
    return (price * rate) / 100
  }, [calcPrice, calcRate])

  const summaryCards = [
    {
      title: "Today's Earnings",
      value: formatRM(186.40),
      change: '+14.2%',
      up: true,
      icon: DollarSign,
    },
    {
      title: 'This Week',
      value: formatRM(1243.80),
      change: '+9.7%',
      up: true,
      icon: TrendingUp,
    },
    {
      title: 'This Month',
      value: formatRM(4280.50),
      change: '+18.3%',
      up: true,
      icon: Calendar,
    },
    {
      title: 'Total Earnings',
      value: formatRM(34521.90),
      change: '+22.1%',
      up: true,
      icon: Wallet,
    },
    {
      title: 'Pending Payout',
      value: formatRM(2750.00),
      change: '',
      up: true,
      icon: Clock,
    },
    {
      title: 'Completed Payout',
      value: formatRM(29110.00),
      change: '',
      up: true,
      icon: CircleCheck,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...fadeIn} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground text-sm">
            Track your commissions, payouts, and earning goals
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons type="earnings" period="30d" />
          <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Banknote className="size-4" />
                Request Payout
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Enter your bank details and the amount you wish to withdraw.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Select>
                  <SelectTrigger id="bank-name" className="w-full">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maybank">Maybank</SelectItem>
                    <SelectItem value="cimb">CIMB</SelectItem>
                    <SelectItem value="rhb">RHB</SelectItem>
                    <SelectItem value="public">Public Bank</SelectItem>
                    <SelectItem value="hong-leong">Hong Leong Bank</SelectItem>
                    <SelectItem value="ambank">AmBank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input id="account-number" placeholder="e.g. 123456789012" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input id="account-name" placeholder="e.g. Ahmad bin Ali" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payout-amount">Amount (RM)</Label>
                <Input
                  id="payout-amount"
                  type="number"
                  placeholder="e.g. 500.00"
                  min={50}
                />
                <p className="text-muted-foreground text-xs">
                  Minimum payout amount is RM 50.00
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setPayoutOpen(false)}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {summaryCards.map((stat) => (
          <motion.div key={stat.title} variants={fadeIn}>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{stat.title}</CardDescription>
                <stat.icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    {stat.up ? (
                      <ArrowUpRight className="size-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="size-3 text-red-500" />
                    )}
                    <span className={stat.up ? 'text-emerald-500' : 'text-red-500'}>
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Earnings Chart */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Earnings Over Time</CardTitle>
            <CardDescription>Daily commission earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsChartData}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickFormatter={(v: number) => `RM ${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                    formatter={(value: number) => formatRM(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--color-chart-1)"
                    fill="url(#earningsGradient)"
                    strokeWidth={2}
                    name="Earnings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Conversions + Commission Calculator */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Conversions */}
        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Recent Conversions</CardTitle>
              <CardDescription>Latest affiliate commission entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentConversions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.product}</TableCell>
                        <TableCell className="text-right">{formatRM(c.amount)}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatRM(c.commission)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[c.status]} className="capitalize">
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{c.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Commission Calculator */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4" />
                Commission Calculator
              </CardTitle>
              <CardDescription>Estimate your earnings quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="calc-price">Product Price (RM)</Label>
                <Input
                  id="calc-price"
                  type="number"
                  placeholder="e.g. 299.90"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="calc-rate">Commission Rate (%)</Label>
                <Input
                  id="calc-rate"
                  type="number"
                  placeholder="e.g. 10"
                  value={calcRate}
                  onChange={(e) => setCalcRate(e.target.value)}
                />
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Estimated Earnings
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {calcEarning !== null ? formatRM(calcEarning) : 'RM 0.00'}
                </p>
              </div>
              <div className="text-muted-foreground text-xs">
                <p>Common rates:</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {['5%', '8%', '10%', '12%', '15%'].map((rate) => (
                    <Button
                      key={rate}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setCalcRate(rate.replace('%', ''))}
                    >
                      {rate}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payout History + Earning Goals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Payout History */}
        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Payout History</CardTitle>
              <CardDescription>Record of your withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Requested</TableHead>
                      <TableHead className="text-right">Processed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutHistory.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.method}</TableCell>
                        <TableCell className="text-right">{formatRM(p.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[p.status]} className="capitalize">
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{p.requested}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{p.processed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Earning Goals */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4" />
                Earning Goals
              </CardTitle>
              <CardDescription>Track progress towards your targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {earningGoals.map((goal) => {
                const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100)
                return (
                  <div key={goal.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-muted-foreground">
                        {formatRM(goal.current)} / {formatRM(goal.target)}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2.5" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{pct}% achieved</span>
                      <span className="font-medium">
                        {formatRM(goal.target - goal.current)} remaining
                      </span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
