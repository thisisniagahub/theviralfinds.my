'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Calendar, Clock, Send, Trash2, Sparkles, Video, Camera, MessageCircle, Tv } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-pink-500' },
  { id: 'instagram', name: 'Instagram', icon: Camera, color: 'bg-purple-500' },
  { id: 'facebook', name: 'Facebook', icon: MessageCircle, color: 'bg-blue-600' },
  { id: 'youtube', name: 'YouTube', icon: Tv, color: 'bg-red-600' },
]

interface ScheduledPost {
  id: string; caption: string; platforms: string[]; productUrl: string | null
  affiliateLink: string | null; imageUrl: string | null; hashtags: string[]
  status: 'scheduled' | 'publishing' | 'published' | 'failed'
  scheduledAt: string; publishedAt: string | null
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-yellow-100 text-yellow-800', publishing: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800',
}

export function AutopostPage() {
  const [tab, setTab] = useState('quick')
  const [caption, setCaption] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [productUrl, setProductUrl] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [bestTimes, setBestTimes] = useState<Record<string, any>>({})

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/autopost')
      if (res.ok) { const data = await res.json(); setPosts(data.posts || []) }
    } catch {}
  }, [])

  const fetchBestTimes = useCallback(async () => {
    try {
      const res = await fetch('/api/autopost/suggest-times')
      if (res.ok) { const data = await res.json(); setBestTimes(data.platforms || {}) }
    } catch {}
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [postsRes, timesRes] = await Promise.all([
          fetch('/api/autopost'), fetch('/api/autopost/suggest-times')
        ])
        if (postsRes.ok && active) { const data = await postsRes.json(); setPosts(data.posts || []) }
        if (timesRes.ok && active) { const data = await timesRes.json(); setBestTimes(data.platforms || {}) }
      } catch {}
    })()
    return () => { active = false }
  }, [])

  const handleSchedule = async () => {
    if (!caption || selectedPlatforms.length === 0) return toast.error('Add caption & select platform')
    if (!scheduledAt) return toast.error('Select schedule time')
    setLoading(true)
    try {
      const res = await fetch('/api/autopost', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, platforms: selectedPlatforms, scheduledAt, productUrl: productUrl || undefined, hashtags: hashtags ? hashtags.split(',').map(h => h.trim()) : undefined }),
      })
      if (res.ok) { toast.success('Post scheduled!'); setCaption(''); setScheduledAt(''); setProductUrl(''); setHashtags(''); fetchPosts() }
      else { const e = await res.json(); toast.error(e.error || 'Failed') }
    } catch { toast.error('Network error') }
    setLoading(false)
  }

  const deletePost = async (id: string) => {
    try {
      const res = await fetch(`/api/autopost/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Post deleted'); fetchPosts() }
    } catch {}
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6 text-emerald-600" /> AutoPost</h1>
        <p className="text-muted-foreground">Schedule & automate your social media posts</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="quick"><Sparkles className="h-4 w-4 mr-1" />Quick Post</TabsTrigger>
          <TabsTrigger value="queue"><Calendar className="h-4 w-4 mr-1" />Queue</TabsTrigger>
          <TabsTrigger value="times"><Clock className="h-4 w-4 mr-1" />Best Times</TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <Card>
            <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Caption</Label>
                <Textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write your post caption..." rows={4} />
              </div>
              <div><Label>Platforms</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {PLATFORMS.map(p => {
                    const Icon = p.icon; const on = selectedPlatforms.includes(p.id)
                    return <button key={p.id} onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${on ? `${p.color} text-white border-transparent` : 'border-muted bg-background'}`}>
                      <Icon className="h-4 w-4" />{p.name}
                    </button>
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Product URL</Label><Input value={productUrl} onChange={e => setProductUrl(e.target.value)} placeholder="https://shopee.com.my/..." /></div>
                <div><Label>Hashtags (comma-separated)</Label><Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#RacunShopee, #ad" /></div>
              </div>
              <div><Label>Schedule Time</Label><Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></div>
              <Button onClick={handleSchedule} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Scheduling...' : <><Send className="h-4 w-4 mr-2" />Schedule Post</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader><CardTitle>Scheduled Posts ({posts.length})</CardTitle></CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No scheduled posts yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {posts.map(post => (
                    <div key={post.id} className="flex items-start justify-between p-3 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{post.caption}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {post.platforms.map((p: string) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
                          <Badge className={statusColors[post.status] || ''}>{post.status}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(post.scheduledAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="times">
          <div className="space-y-4">
            {Object.entries(bestTimes).map(([key, platform]: [string, any]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{platform.icon}</span>{platform.name}
                    <span className="text-xs text-muted-foreground ml-auto">Limit: {platform.characterLimit}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {platform.timeSlots?.map((slot: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-sm font-medium">{slot.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${slot.engagement}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{slot.engagement}%</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-1 mt-1">
                      {platform.bestDays?.map((d: string) => <Badge key={d} variant="outline" className="text-xs">{d}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
