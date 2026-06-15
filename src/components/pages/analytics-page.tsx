'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MousePointerClick,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Link2,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  ShoppingCart,
  CheckCircle,
} from 'lucide-react'

// --- Mock Data ---

const clicksOverTimeData = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  clicks: Math.floor(Math.random() * 300) + 100,
  uniqueClicks: Math.floor(Math.random() * 200) + 60,
}))

const conversionsOverTimeData = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  conversions: Math.floor(Math.random() * 40) + 5,
  revenue: Math.floor(Math.random() * 3000) + 500,
}))

const topCountriesData = [
  { country: 'Malaysia', clicks: 4520, flag: '🇲🇾' },
  { country: 'Singapore', clicks: 2890, flag: '🇸🇬' },
  { country: 'Indonesia', clicks: 2150, flag: '🇮🇩' },
  { country: 'Thailand', clicks: 1340, flag: '🇹🇭' },
  { country: 'Philippines', clicks: 890, flag: '🇵🇭' },
  { country: 'Vietnam', clicks: 560, flag: '🇻🇳' },
]

const deviceBreakdownData = [
  { name: 'Mobile', value: 62, color: 'var(--color-chart-1)' },
  { name: 'Desktop', value: 28, color: 'var(--color-chart-2)' },
  { name: 'Tablet', value: 10, color: 'var(--color-chart-4)' },
]

const topPerformingLinks = [
  { name: 'Xiaomi 14 Ultra Deal', clicks: 2340, conversions: 187, earnings: 5610.0, ctr: 7.99 },
  { name: 'Samsung Galaxy S24', clicks: 1890, conversions: 142, earnings: 4260.0, ctr: 7.51 },
  { name: 'AirPods Pro 2nd Gen', clicks: 1560, conversions: 124, earnings: 1860.0, ctr: 7.95 },
  { name: 'Dyson V15 Detect', clicks: 1230, conversions: 89, earnings: 3560.0, ctr: 7.24 },
  { name: 'Nike Air Max 90', clicks: 980, conversions: 76, earnings: 912.0, ctr: 7.76 },
  { name: 'SK-II Facial Essence', clicks: 870, conversions: 68, earnings: 1360.0, ctr: 7.82 },
]

const categoryPerformanceData = [
  { category: 'Electronics', clicks: 5420, conversions: 380 },
  { category: 'Fashion', clicks: 3890, conversions: 245 },
  { category: 'Beauty', clicks: 2670, conversions: 198 },
  { category: 'Home & Living', clicks: 1980, conversions: 132 },
  { category: 'Sports', clicks: 1240, conversions: 86 },
  { category: 'Groceries', clicks: 890, conversions: 64 },
]

const funnelData = [
  { stage: 'Views', count: 12580, icon: Eye, color: 'var(--color-chart-2)' },
  { stage: 'Clicks', count: 4820, icon: MousePointerClick, color: 'var(--color-chart-1)' },
  { stage: 'Add to Cart', count: 1240, icon: ShoppingCart, color: 'var(--color-chart-4)' },
  { stage: 'Purchase', count: 380, icon: CheckCircle, color: 'var(--color-chart-5)' },
]

// --- Helper ---

const formatRM = (value: number) => `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formatNumber = (value: number) => value.toLocaleString('en-MY')

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// --- Component ---

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d')

  const totalClicks = 12340
  const uniqueVisitors = 8560
  const conversionRate = 3.8
  const avgOrderValue = 127.45

  const overviewStats = [
    {
      title: 'Total Clicks',
      value: formatNumber(totalClicks),
      change: '+12.5%',
      up: true,
      icon: MousePointerClick,
    },
    {
      title: 'Unique Visitors',
      value: formatNumber(uniqueVisitors),
      change: '+8.3%',
      up: true,
      icon: Users,
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      change: '+0.4%',
      up: true,
      icon: TrendingUp,
    },
    {
      title: 'Avg. Order Value',
      value: formatRM(avgOrderValue),
      change: '-2.1%',
      up: false,
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <motion.div {...fadeIn} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Track your affiliate link performance and audience insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground size-4" />
          {(['7d', '30d', '90d', 'custom'] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === '7d'
                ? 'Last 7 days'
                : range === '30d'
                  ? 'Last 30 days'
                  : range === '90d'
                    ? 'Last 90 days'
                    : 'Custom'}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {overviewStats.map((stat, i) => (
          <motion.div key={stat.title} variants={fadeIn}>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{stat.title}</CardDescription>
                <stat.icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
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
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row 1: Clicks + Conversions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Clicks Over Time */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Clicks Over Time</CardTitle>
              <CardDescription>Daily clicks vs unique clicks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={clicksOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={false}
                      name="Total Clicks"
                    />
                    <Line
                      type="monotone"
                      dataKey="uniqueClicks"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      dot={false}
                      name="Unique Clicks"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversions Over Time */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Conversions Over Time</CardTitle>
              <CardDescription>Daily conversions and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={conversionsOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      interval={4}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickFormatter={(v: number) => `RM ${(v / 1000).toFixed(1)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) =>
                        name === 'revenue' ? formatRM(value) : value
                      }
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="conversions"
                      stroke="var(--color-chart-5)"
                      fill="var(--color-chart-5)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                      name="Conversions"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-chart-1)"
                      fill="var(--color-chart-1)"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      name="Revenue (RM)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2: Top Countries + Device Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top Countries */}
        <motion.div {...fadeIn} className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Top Countries</CardTitle>
              <CardDescription>Clicks by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCountriesData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis
                      type="category"
                      dataKey="country"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="clicks" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div {...fadeIn}>
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-base">Device Breakdown</CardTitle>
              <CardDescription>Traffic by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {deviceBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => `${value}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { name: 'Mobile', pct: 62, icon: Smartphone, color: 'bg-chart-1' },
                  { name: 'Desktop', pct: 28, icon: Monitor, color: 'bg-chart-2' },
                  { name: 'Tablet', pct: 10, icon: Tablet, color: 'bg-chart-4' },
                ].map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${d.color}`} />
                      <d.icon className="text-muted-foreground size-3.5" />
                      <span>{d.name}</span>
                    </div>
                    <span className="font-medium">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Links */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Top Performing Links</CardTitle>
            <CardDescription>Your highest-earning affiliate links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link Name</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformingLinks.map((link) => (
                    <TableRow key={link.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link2 className="text-muted-foreground size-3.5" />
                          <span className="font-medium">{link.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(link.clicks)}</TableCell>
                      <TableCell className="text-right">{formatNumber(link.conversions)}</TableCell>
                      <TableCell className="text-right font-medium">{formatRM(link.earnings)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{link.ctr.toFixed(2)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Performance */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Category Performance</CardTitle>
            <CardDescription>Clicks and conversions by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="clicks" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="Clicks" />
                  <Bar dataKey="conversions" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversion Funnel */}
      <motion.div {...fadeIn}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>User journey from view to purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-0">
              {funnelData.map((stage, i) => {
                const prevCount = i > 0 ? funnelData[i - 1].count : null
                const dropOff = prevCount ? ((1 - stage.count / prevCount) * 100).toFixed(1) : null

                return (
                  <div key={stage.stage} className="flex items-center gap-2 sm:gap-0">
                    {i > 0 && (
                      <div className="flex flex-col items-center px-2 sm:px-3">
                        <ArrowDownRight className="text-muted-foreground size-4 sm:hidden" />
                        <div className="hidden h-0.5 w-8 bg-border sm:block" />
                        {dropOff && (
                          <span className="mt-0.5 text-[10px] text-red-400">
                            -{dropOff}%
                          </span>
                        )}
                      </div>
                    )}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.12, duration: 0.3 }}
                      className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 shadow-sm"
                      style={{ minWidth: 130 }}
                    >
                      <div
                        className="flex size-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `color-mix(in srgb, ${stage.color} 15%, transparent)` }}
                      >
                        <stage.icon className="size-5" style={{ color: stage.color }} />
                      </div>
                      <span className="text-sm font-semibold">{stage.stage}</span>
                      <span className="text-lg font-bold">{formatNumber(stage.count)}</span>
                      <span className="text-muted-foreground text-xs">
                        {((stage.count / funnelData[0].count) * 100).toFixed(1)}% of total
                      </span>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
