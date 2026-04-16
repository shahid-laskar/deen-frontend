import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, MessageSquare, Heart, Flag, Send, BookOpen, Award, Target, GraduationCap, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/community')({
  component: CommunityPage,
})

const TABS = [
  { id: 'feed', label: 'Feed', icon: MessageSquare },
  { id: 'qa', label: 'Scholar Q&A', icon: Award },
  { id: 'circles', label: 'Circles', icon: Target },
  { id: 'halaqah', label: 'Halaqah', icon: GraduationCap },
]

const CATS = ['general', 'quran', 'hadith', 'fiqh', 'lifestyle', 'sisters', 'youth', 'family']
const CAT_ICONS = { general: '🕌', quran: '📖', hadith: '📜', fiqh: '⚖️', lifestyle: '🌿', sisters: '🌸', youth: '🌱', family: '👨‍👩‍👧' }

function PostCard({ post, onReact }) {
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const qc = useQueryClient()

  const { data: comments } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => api.get(`/community/posts/${post.id}/comments`).then(r => r.data),
    enabled: showComments,
  })

  const { mutate: submitComment } = useMutation({
    mutationFn: () => api.post(`/community/posts/${post.id}/comments`, { content: comment }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', post.id] }); setComment('') },
  })

  return (
    <Card className="p-4 sm:p-5 overflow-visible">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {post.is_anonymous ? '?' : 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{post.is_anonymous ? 'Anonymous' : 'Member'}</span>
            {post.post_type !== 'text' && <Badge variant="secondary" className="text-[10px] uppercase">{post.post_type.replace('_',' ')}</Badge>}
            {post.is_pinned && <Badge className="text-[10px] uppercase bg-gold text-gold-foreground">📌 Pinned</Badge>}
            <span className="text-[11px] font-medium text-muted-foreground ml-auto">{format(new Date(post.created_at), 'd MMM')}</span>
          </div>
          {post.title && <h3 className="font-bold text-base text-foreground mb-1 leading-tight">{post.title}</h3>}
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <button onClick={() => onReact(post.id)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
              <Heart className="h-4 w-4" /> {post.like_count}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="h-4 w-4" /> {post.comment_count}
            </button>
            <button onClick={() => { api.post(`/community/posts/${post.id}/report`, null, { params: { reason: 'inappropriate' } }); toast.success('Reported.') }}
              className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors ml-auto uppercase tracking-wider">
              <Flag className="h-3 w-3" /> Report
            </button>
          </div>
          {showComments && (
            <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in">
              {comments?.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">U</div>
                  <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                    <p className="text-sm text-foreground">{c.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Input className="flex-1 h-9 text-sm" placeholder="Add a comment..." value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (comment.trim()) submitComment() } }} />
                <Button size="sm" onClick={() => submitComment()} disabled={!comment.trim()} className="h-9 w-9 p-0 shrink-0"><Send className="h-4 w-4 -ml-0.5" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function CommunityFeed() {
  const qc = useQueryClient()
  const [view, setView] = useState('feed')
  const [activeGroup, setActiveGroup] = useState(null)
  const [postModal, setPostModal] = useState(false)
  const [groupModal, setGroupModal] = useState(false)
  const [postForm, setPostForm] = useState({ content: '', title: '', post_type: 'text', is_anonymous: false })
  const [groupForm, setGroupForm] = useState({ name: '', description: '', category: 'general' })

  const { data: feed, isLoading: feedLoading } = useQuery({ queryKey: ['community', 'feed'], queryFn: () => api.get('/community/feed').then(r => r.data) })
  const { data: groups } = useQuery({ queryKey: ['community', 'groups'], queryFn: () => api.get('/community/groups').then(r => r.data) })
  const { data: groupPosts } = useQuery({
    queryKey: ['community', 'group', activeGroup?.id, 'posts'],
    queryFn: () => api.get(`/community/groups/${activeGroup.id}/posts`).then(r => r.data),
    enabled: !!activeGroup,
  })

  const { mutate: createPost, isPending: posting } = useMutation({
    mutationFn: () => api.post('/community/posts', { ...postForm, group_id: activeGroup?.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['community'] }); setPostModal(false); setPostForm({ content: '', title: '', post_type: 'text', is_anonymous: false }) },
  })

  const { mutate: createGroup, isPending: creatingGroup } = useMutation({
    mutationFn: () => api.post('/community/groups', groupForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['community', 'groups'] }); setGroupModal(false); toast.success('Group created!') },
  })

  const { mutate: joinGroup } = useMutation({
    mutationFn: (id) => api.post(`/community/groups/${id}/join`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['community', 'groups'] }); toast.success('Joined! Ahlan wa sahlan! 🕌') },
  })

  const react = (postId) => api.post(`/community/posts/${postId}/react`, null, { params: { reaction_type: 'like' } }).then(() => qc.invalidateQueries({ queryKey: ['community'] }))
  const posts = view === 'feed' ? feed : groupPosts
  const postsLoading = view === 'feed' ? feedLoading : false

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setGroupModal(true)} className="h-9"><Plus className="h-4 w-4 mr-1.5" /> Group</Button>
        <Button size="sm" onClick={() => setPostModal(true)} className="h-9"><Plus className="h-4 w-4 mr-1.5" /> Post</Button>
      </div>

      <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-center">
        <p className="text-sm text-foreground font-medium">🌿 This is a space of <strong className="text-primary font-black">adab</strong> — respect, kindness, and seeking knowledge. No arguments or backbiting.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 items-start">
        <div className="space-y-2 sticky top-4">
          <button onClick={() => { setView('feed'); setActiveGroup(null) }}
            className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left',
              view === 'feed' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            <span className="text-xl">🌐</span> Global Feed
          </button>
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-3 pt-3 pb-1">Groups</p>
          <div className="space-y-1">
            {groups?.slice(0, 12).map(g => (
              <button key={g.id} onClick={() => { setActiveGroup(g); setView('group') }}
                className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all text-left group',
                  activeGroup?.id === g.id ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium')}>
                <span className="text-lg">{g.icon}</span>
                <span className="flex-1 truncate">{g.name}</span>
                <Badge variant="secondary" className="text-[9px] group-hover:bg-background">{g.member_count}</Badge>
              </button>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-4">
          {activeGroup && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm mb-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">{activeGroup.icon} {activeGroup.name}</h2>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{activeGroup.member_count} members · {activeGroup.description}</p>
              </div>
              <Button size="sm" onClick={() => joinGroup(activeGroup.id)}>Join</Button>
            </div>
          )}
          {postsLoading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
            : !posts?.length ? (
              <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">No posts yet</h3>
                <p className="text-sm text-muted-foreground mb-6">Be the first to share knowledge or ask a question.</p>
                <Button onClick={() => setPostModal(true)}>Write the first post</Button>
              </div>
            ) : posts?.map(p => <PostCard key={p.id} post={p} onReact={react} />)}
        </div>
      </div>

      <Dialog open={postModal} onOpenChange={setPostModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>New post {activeGroup ? `in ${activeGroup.name}` : ''}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Title (optional)" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} className="font-bold text-base h-11" />
            <textarea className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px]" placeholder="Share knowledge, ask a question..." value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <select className="h-10 px-3 py-2 rounded-xl border border-input bg-background text-sm font-medium" value={postForm.post_type} onChange={e => setPostForm({ ...postForm, post_type: e.target.value })}>
                {['text', 'question', 'hadith_share', 'quran_verse', 'achievement', 'poll'].map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary w-4 h-4" checked={postForm.is_anonymous} onChange={e => setPostForm({ ...postForm, is_anonymous: e.target.checked })} /> Post anonymously
              </label>
            </div>
            <Button size="lg" className="w-full" onClick={() => createPost()} disabled={!postForm.content.trim() || posting}>{posting ? 'Posting...' : 'Post'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={groupModal} onOpenChange={setGroupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create a Group</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold text-foreground mb-1 block">Name</label><Input value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} /></div>
            <div><label className="text-xs font-bold text-foreground mb-1 block">Description</label><Input value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} /></div>
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATS.map(c => (
                  <button key={c} onClick={() => setGroupForm({ ...groupForm, category: c })} className={cn('py-2 rounded-xl text-xs font-bold transition-all capitalize', groupForm.category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{CAT_ICONS[c]} {c}</button>
                ))}
              </div>
            </div>
            <Button size="lg" className="w-full mt-2" onClick={() => createGroup()} disabled={!groupForm.name.trim() || creatingGroup}>Create group</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ScholarQA() {
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ text: '', category: 'Fiqh', madhab_relevance: '', is_anonymous: false })

  const CATEGORIES = ['Fiqh', 'Quran', 'Hadith', 'Family', 'Finance', 'Worship', 'Ethics', 'Health']
  const mockQAs = [
    { id: 1, text: 'Is it permissible to use digital payment apps for Zakat?', category: 'Finance', answers: [{ scholar: { name: 'Sheikh Ahmed', madhab: 'Hanafi', institution: 'Al-Azhar' }, content: 'Yes, digital Zakat payments are permissible. The key is ensuring the funds reach eligible recipients.', citations: ['Quran 9:60', 'Fatwa Council UAE 2019'] }] },
  ]

  const qc = useQueryClient()
  const { mutate: submitQuestion, isPending } = useMutation({
    mutationFn: () => api.post('/community/qa/questions', form),
    onSuccess: () => { toast.success('Question submitted! Scholars will respond soon.'); setView('list'); setForm({ text: '', category: 'Fiqh', madhab_relevance: '', is_anonymous: false }) },
  })

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2">
      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
        <button onClick={() => setView('list')} className={cn('px-4 py-2 rounded-lg text-xs font-bold transition-all', view === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Browse Q&A</button>
        <button onClick={() => setView('ask')} className={cn('px-4 py-2 rounded-lg text-xs font-bold transition-all', view === 'ask' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Ask a Question</button>
      </div>

      {view === 'ask' ? (
        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Submit Your Question</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Your question will be reviewed by verified scholars.</p>
          </div>
          <textarea className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px]" placeholder="Type your question clearly..." value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Category</label>
              <select className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Madhab (optional)</label>
              <Input placeholder="e.g. Hanafi" value={form.madhab_relevance} onChange={e => setForm({ ...form, madhab_relevance: e.target.value })} className="h-10" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" className="rounded border-border w-4 h-4 text-primary" checked={form.is_anonymous} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} /> Ask anonymously
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setView('list')}>Cancel</Button>
            <Button className="flex-1" onClick={() => submitQuestion()} disabled={!form.text.trim() || isPending}>{isPending ? 'Submitting...' : 'Submit Question'}</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockQAs.map(qa => (
            <Card key={qa.id} className="p-0 overflow-hidden">
              <div className="p-5 pb-4 border-b border-border bg-muted/10">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">❓</div>
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-tight">{qa.text}</h3>
                    <Badge variant="secondary" className="mt-2 text-[10px] uppercase">{qa.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4 bg-card">
                {qa.answers.map((ans, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-black shrink-0">{ans.scholar.name.split(' ').map(n=>n[0]).join('')}</div>
                      <div>
                        <div className="flex items-center gap-2"><span className="font-bold text-foreground">{ans.scholar.name}</span><Badge className="bg-gold text-gold-foreground text-[9px] uppercase border-0">Verified</Badge></div>
                        <p className="text-[11px] font-medium text-muted-foreground">{ans.scholar.institution} · {ans.scholar.madhab}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-relaxed pl-13 border-l-2 border-border/50 ml-5 py-1">{ans.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function AccountabilityCircles() {
  return (
    <div className="text-center py-20 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30 max-w-3xl mx-auto animate-in fade-in">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary"><Target className="h-8 w-8" /></div>
      <h3 className="text-base font-bold text-foreground mb-1">Accountability Circles</h3>
      <p className="text-sm text-muted-foreground">Join small groups for targeted goals and daily check-ins. Coming soon.</p>
    </div>
  )
}

function HalaqahCircles() {
  return (
    <div className="text-center py-20 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30 max-w-3xl mx-auto animate-in fade-in">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary"><GraduationCap className="h-8 w-8" /></div>
      <h3 className="text-base font-bold text-foreground mb-1">Study Halaqahs</h3>
      <p className="text-sm text-muted-foreground">Structured curriculums for Quran, Hadith, and Fiqh. Coming soon.</p>
    </div>
  )
}

export default function CommunityPage() {
  const [tab, setTab] = useState('feed')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Community <Users className="h-6 w-6 text-primary" /></h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Learn, share, and grow together</p>
        </div>
      </div>

      <div className="flex overflow-x-auto p-1 rounded-xl bg-muted gap-1 scrollbar-none max-w-2xl">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 min-w-[100px] px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2', tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === 'feed' && <CommunityFeed />}
        {tab === 'qa' && <ScholarQA />}
        {tab === 'circles' && <AccountabilityCircles />}
        {tab === 'halaqah' && <HalaqahCircles />}
      </div>
    </div>
  )
}
