import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Plus, MessageSquare, Heart, Flag, Send,
  BookOpen, Award, Target, GraduationCap, ChevronRight,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Input, Modal, Badge, EmptyState, Skeleton, Textarea } from '../components/ui/index'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { clsx } from 'clsx'


const TABS = [
  { id: 'feed', label: 'Feed', icon: MessageSquare },
  { id: 'qa', label: 'Scholar Q&A', icon: Award },
  { id: 'circles', label: 'Circles', icon: Target },
  { id: 'halaqah', label: 'Halaqah', icon: GraduationCap },
]

const CATS = ['general', 'quran', 'hadith', 'fiqh', 'lifestyle', 'sisters', 'youth', 'family']
const CAT_ICONS = { general: '🕌', quran: '📖', hadith: '📜', fiqh: '⚖️', lifestyle: '🌿', sisters: '🌸', youth: '🌱', family: '👨‍👩‍👧' }

/* ─── PostCard ─────────────────────────────────────────────────── */
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
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-emerald-800 rounded-xl flex items-center justify-center text-emerald-200 text-sm font-semibold flex-shrink-0">
          {post.is_anonymous ? '?' : 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{post.is_anonymous ? 'Anonymous' : 'Member'}</span>
            {post.post_type !== 'text' && <Badge variant="green" className="text-xs capitalize">{post.post_type}</Badge>}
            {post.is_pinned && <Badge variant="gold" className="text-xs">📌 Pinned</Badge>}
            <span className="text-xs text-muted ml-auto">{format(new Date(post.created_at), 'd MMM')}</span>
          </div>
          {post.title && <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200 mb-1">{post.title}</h3>}
          <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-4 mt-3">
            <button onClick={() => onReact(post.id)} className="flex items-center gap-1.5 text-xs text-parchment-500 hover:text-emerald-700 transition-colors">
              <Heart size={14} /> {post.like_count}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs text-parchment-500 hover:text-emerald-700 transition-colors">
              <MessageSquare size={14} /> {post.comment_count}
            </button>
            <button onClick={() => { api.post(`/community/posts/${post.id}/report`, null, { params: { reason: 'inappropriate' } }); toast.success('Reported.') }}
              className="flex items-center gap-1 text-xs text-parchment-400 hover:text-red-500 transition-colors ml-auto">
              <Flag size={12} /> Report
            </button>
          </div>
          {showComments && (
            <div className="mt-4 pt-4 border-t border-parchment-200 dark:border-emerald-900/30 space-y-3">
              {comments?.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 bg-parchment-200 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-xs flex-shrink-0">U</div>
                  <div className="flex-1 bg-parchment-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">{c.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <input className="input text-sm py-2 flex-1" placeholder="Add a comment..." value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (comment.trim()) submitComment() } }} />
                <Button variant="primary" size="sm" onClick={() => submitComment()} disabled={!comment.trim()}><Send size={14} /></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ─── Community Feed ───────────────────────────────────────────── */
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
    <>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="secondary" size="sm" onClick={() => setGroupModal(true)}><Plus size={14} /> New group</Button>
        <Button variant="primary" size="sm" onClick={() => setPostModal(true)}><Plus size={14} /> Post</Button>
      </div>

      <Card className="mb-5 bg-emerald-950 border-0 p-4">
        <p className="text-emerald-300 text-sm">🌿 This is a space of <strong className="text-white">adab</strong> — respect, kindness, and seeking knowledge. No fatwas, no arguments, no backbiting.</p>
      </Card>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <button onClick={() => { setView('feed'); setActiveGroup(null) }}
            className={clsx('w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all',
              view === 'feed' ? 'bg-emerald-800/20 dark:bg-emerald-800/30 text-emerald-900 dark:text-white font-medium' : 'hover:bg-parchment-100 dark:hover:bg-emerald-900/30 text-parchment-600 dark:text-emerald-500')}>
            🌐 Global Feed
          </button>
          <p className="text-xs text-muted px-3 pt-2">Groups</p>
          {groups?.slice(0, 12).map(g => (
            <button key={g.id} onClick={() => { setActiveGroup(g); setView('group') }}
              className={clsx('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all',
                activeGroup?.id === g.id ? 'bg-emerald-800/20 dark:bg-emerald-800/30 text-emerald-900 dark:text-white font-medium' : 'hover:bg-parchment-100 dark:hover:bg-emerald-900/30 text-parchment-600 dark:text-emerald-500')}>
              <span>{g.icon}</span><span className="flex-1 truncate">{g.name}</span><span className="text-xs text-muted">{g.member_count}</span>
            </button>
          ))}
        </div>
        <div className="md:col-span-2 space-y-4">
          {activeGroup && (
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-display font-semibold text-emerald-900 dark:text-emerald-200">{activeGroup.icon} {activeGroup.name}</h2>
                <p className="text-xs text-muted">{activeGroup.member_count} members · {activeGroup.description}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => joinGroup(activeGroup.id)}>Join</Button>
            </div>
          )}
          {postsLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
            : !posts?.length ? <EmptyState icon={MessageSquare} title="No posts yet" description="Be the first to post. Share knowledge, ask a question, or write a reflection." action={<Button variant="primary" onClick={() => setPostModal(true)}>Write the first post</Button>} />
              : posts?.map(p => <PostCard key={p.id} post={p} onReact={react} />)}
        </div>
      </div>

      <Modal open={postModal} onClose={() => setPostModal(false)} title={`New post${activeGroup ? ` in ${activeGroup.name}` : ''}`} size="lg">
        <div className="space-y-4">
          <Input label="Title (optional)" placeholder="Optional — for questions or resources" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
          <Textarea label="Content" placeholder="Share knowledge, ask a question, or write a reflection..." rows={5} value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
          <div className="flex items-center gap-4">
            <select className="input text-sm" value={postForm.post_type} onChange={e => setPostForm({ ...postForm, post_type: e.target.value })}>
              {['text', 'question', 'hadith_share', 'quran_verse', 'achievement', 'poll'].map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={postForm.is_anonymous} onChange={e => setPostForm({ ...postForm, is_anonymous: e.target.checked })} /> Post anonymously
            </label>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setPostModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => createPost()} loading={posting} disabled={!postForm.content.trim()} className="flex-1">Post</Button>
          </div>
        </div>
      </Modal>

      <Modal open={groupModal} onClose={() => setGroupModal(false)} title="Create a group">
        <div className="space-y-4">
          <Input label="Group name" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
          <Input label="Description" value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} />
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATS.map(c => (
                <button key={c} onClick={() => setGroupForm({ ...groupForm, category: c })}
                  className={clsx('py-2 rounded-xl text-xs font-medium border transition-all capitalize',
                    groupForm.category === c ? 'bg-emerald-800 text-white border-emerald-800' : 'border-parchment-300 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500')}>
                  {CAT_ICONS[c]} {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setGroupModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => createGroup()} loading={creatingGroup} className="flex-1">Create group</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ─── Scholar Q&A ──────────────────────────────────────────────── */
function ScholarQA() {
  const [view, setView] = useState('list') // list | ask
  const [form, setForm] = useState({ text: '', category: 'Fiqh', madhab_relevance: '', is_anonymous: false })
  const qc = useQueryClient()

  const CATEGORIES = ['Fiqh', 'Quran', 'Hadith', 'Family', 'Finance', 'Worship', 'Ethics', 'Health']

  // Mock answered questions for display
  const mockQAs = [
    { id: 1, text: 'Is it permissible to use digital payment apps for Zakat?', category: 'Finance', status: 'answered', answers: [{ scholar: { name: 'Sheikh Ahmed', madhab: 'Hanafi', institution: 'Al-Azhar' }, content: 'Yes, digital Zakat payments are permissible. The key is ensuring the funds reach eligible recipients. Many contemporary scholars support online Zakat payments due to their efficiency and reach.', madhab_note: 'All four madhabs agree on this.', citations: ['Quran 9:60', 'Fatwa Council UAE 2019'] }] },
    { id: 2, text: 'Can I combine Johr and Asr prayers while traveling?', category: 'Worship', status: 'answered', answers: [{ scholar: { name: 'Sheikh Omar', madhab: 'Shafi\'i', institution: 'Islamic University' }, content: 'Yes, the Jam\' (combining) of prayers during travel is permitted by the consensus of scholars based on authentic hadith showing the Prophet ﷺ combining prayers during travel.', madhab_note: 'Shafi\'i, Maliki, and Hanbali permit Jam\' during travel. Hanafi permits Jam\' only at Arafat and Muzdalifah.', citations: ['Bukhari 1109', 'Muslim 704'] }] },
  ]

  const { mutate: submitQuestion, isPending } = useMutation({
    mutationFn: () => api.post('/community/qa/questions', form),
    onSuccess: () => { toast.success('Question submitted! Scholars will respond soon, in sha Allah.'); setView('list'); setForm({ text: '', category: 'Fiqh', madhab_relevance: '', is_anonymous: false }) },
    onError: () => toast.error('Failed to submit question.'),
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex gap-2">
          <button onClick={() => setView('list')} className={clsx('px-4 py-2 rounded-xl text-sm font-medium transition-all', view === 'list' ? 'bg-emerald-700 text-white' : 'bg-parchment-100 dark:bg-emerald-900/30 text-muted')}>
            Browse Q&A
          </button>
          <button onClick={() => setView('ask')} className={clsx('px-4 py-2 rounded-xl text-sm font-medium transition-all', view === 'ask' ? 'bg-emerald-700 text-white' : 'bg-parchment-100 dark:bg-emerald-900/30 text-muted')}>
            Ask a Question
          </button>
        </div>
      </div>

      {view === 'ask' ? (
        <Card className="p-6 space-y-4">
          <h2 className="font-display font-semibold text-lg text-emerald-900 dark:text-emerald-200">Submit Your Question</h2>
          <p className="text-sm text-muted">Your question will be reviewed by our verified scholars and answered with proper Islamic citations.</p>
          <Textarea label="Your Question" placeholder="Type your question clearly and respectfully..." rows={4}
            value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Madhab (optional)" placeholder="e.g. Hanafi, Shafi'i" value={form.madhab_relevance}
              onChange={e => setForm({ ...form, madhab_relevance: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} />
            Ask anonymously
          </label>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setView('list')}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={() => submitQuestion()} loading={isPending} disabled={!form.text.trim()}>
              Submit Question
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockQAs.map(qa => (
            <Card key={qa.id} className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-parchment-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">❓</div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-900 dark:text-emerald-200">{qa.text}</p>
                  <Badge variant="green" className="text-xs mt-1">{qa.category}</Badge>
                </div>
              </div>

              {qa.answers.map((ans, i) => (
                <div key={i} className="border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {ans.scholar.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-amber-900 dark:text-amber-300">{ans.scholar.name}</span>
                        <Badge variant="gold" className="text-xs">✓ Verified Scholar</Badge>
                      </div>
                      <div className="text-xs text-muted">{ans.scholar.institution} · {ans.scholar.madhab}</div>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">{ans.content}</p>
                  {ans.madhab_note && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl p-3">
                      <AlertCircle size={13} className="mt-0.5 flex-shrink-0" /> {ans.madhab_note}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {ans.citations?.map(c => <Badge key={c} variant="gold" className="text-xs">📚 {c}</Badge>)}
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Accountability Circles ───────────────────────────────────── */
function AccountabilityCircles() {
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', check_in_day: 0 })
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const TEMPLATES = [
    { name: 'Ramadan Circle', desc: 'Support each other during Ramadan', icon: '🌙' },
    { name: 'New Muslim', desc: 'Journey together as new Muslims', icon: '🕊️' },
    { name: 'Quran 30-Day', desc: 'Complete the Quran together', icon: '📖' },
    { name: 'Fitness Ummah', desc: 'Health is an amanah', icon: '💪' },
  ]

  const mockCircles = [
    { id: 1, name: 'Morning Adhkar Circle', members: 4, goals: ['Fajr on time', 'Morning adhkar'], next_check_in: 'Friday' },
    { id: 2, name: 'Quran Completion', members: 6, goals: ['1 Juz per day'], next_check_in: 'Sunday' },
  ]

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateModal(true)}><Plus size={14} /> Create Circle</Button>
      </div>

      {/* Templates */}
      <div>
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-3">Circle Templates</p>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <button key={t.name} onClick={() => { setForm({ ...form, name: t.name, description: t.desc }); setCreateModal(true) }}
              className="p-4 rounded-2xl border border-parchment-200 dark:border-emerald-900/40 text-left hover:border-emerald-500 transition-all group">
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="font-semibold text-sm text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-600">{t.name}</div>
              <div className="text-xs text-muted mt-1">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* My Circles */}
      <div>
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-3">My Circles</p>
        <div className="space-y-3">
          {mockCircles.map(circle => (
            <Card key={circle.id} className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {circle.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-emerald-900 dark:text-emerald-200">{circle.name}</div>
                <div className="text-xs text-muted mt-0.5">
                  {circle.members} members · Check-in: {circle.next_check_in}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {circle.goals.map(g => <Badge key={g} variant="green" className="text-xs">{g}</Badge>)}
                </div>
              </div>
              <Button variant="secondary" size="sm">Check In</Button>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Accountability Circle">
        <div className="space-y-4">
          <Input label="Circle Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Description" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="label">Weekly Check-in Day</label>
            <select className="input" value={form.check_in_day} onChange={e => setForm({ ...form, check_in_day: parseInt(e.target.value) })}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1"
              onClick={() => { toast.success('Circle created! Invite members to get started.'); setCreateModal(false) }}
              disabled={!form.name}>
              Create Circle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ─── Halaqah Study Circles ────────────────────────────────────── */
function HalaqahCircles() {
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState({ name: '', h_type: 'quran_study', curriculum: '' })

  const TYPES = [
    { id: 'quran_study', label: 'Quran Study', icon: '📖' },
    { id: 'hadith_study', label: 'Hadith Study', icon: '📜' },
    { id: 'book_study', label: 'Book Study', icon: '📚' },
    { id: 'open_discussion', label: 'Open Discussion', icon: '💬' },
  ]

  const CURRICULA = [
    { name: '40 Hadith of Nawawi', type: 'hadith_study', sessions: 20 },
    { name: 'Quran Tafsir by Juz', type: 'quran_study', sessions: 30 },
    { name: 'Fiqh of Worship', type: 'book_study', sessions: 15 },
  ]

  const mockHalaqahs = [
    { id: 1, name: 'Tafsir Al-Fatiha', type: 'quran_study', members: 8, progress: 30, next_session: '2026-04-17', topic: 'Verse 3-4: Ar-Rahman, Ar-Rahim' },
    { id: 2, name: 'Forty Hadith Circle', type: 'hadith_study', members: 12, progress: 45, next_session: '2026-04-18', topic: 'Hadith 5: The Obligation of Intention' },
  ]

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setCreateModal(true)}><Plus size={14} /> New Halaqah</Button>
      </div>

      {/* Pre-loaded Curricula */}
      <div>
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-3">Start with a Curriculum</p>
        <div className="grid grid-cols-3 gap-3">
          {CURRICULA.map(c => (
            <button key={c.name} onClick={() => { setForm({ name: c.name, h_type: c.type, curriculum: c.name }); setCreateModal(true) }}
              className="p-4 rounded-2xl border border-parchment-200 dark:border-emerald-900/40 text-left hover:border-emerald-500 transition-all group">
              <div className="font-semibold text-sm text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-600">{c.name}</div>
              <div className="text-xs text-muted mt-1">{c.sessions} planned sessions</div>
            </button>
          ))}
        </div>
      </div>

      {/* My Halaqahs */}
      <div>
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-3">My Halaqahs</p>
        <div className="space-y-3">
          {mockHalaqahs.map(h => (
            <Card key={h.id} className="p-5 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0">
                  {TYPES.find(t => t.id === h.type)?.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-emerald-900 dark:text-emerald-200">{h.name}</div>
                  <div className="text-xs text-muted">{h.members} members · {TYPES.find(t => t.id === h.type)?.label}</div>
                </div>
                <Badge variant="green" className="text-xs">{h.progress}% complete</Badge>
              </div>
              <div className="h-1.5 bg-parchment-100 dark:bg-emerald-900/30 rounded-full">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${h.progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1"><Clock size={12} /> Next: {format(new Date(h.next_session), 'd MMM')} — {h.topic}</span>
                <Button variant="secondary" size="sm">View Session</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create a Halaqah">
        <div className="space-y-4">
          <Input label="Halaqah Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="label">Study Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setForm({ ...form, h_type: t.id })}
                  className={clsx('p-3 rounded-xl border text-sm font-medium text-left transition-all flex items-center gap-2',
                    form.h_type === t.id ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' : 'border-parchment-200 dark:border-emerald-900/40 text-muted')}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Curriculum / Description" rows={3} value={form.curriculum}
            onChange={e => setForm({ ...form, curriculum: e.target.value })} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1"
              onClick={() => { toast.success('Halaqah created! Invite members to begin.'); setCreateModal(false) }}
              disabled={!form.name}>
              Create Halaqah
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ─── Main Community Page ──────────────────────────────────────── */
export default function Community() {
  const [tab, setTab] = useState('feed')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <Users size={26} className="text-emerald-600" /> Community
        </h1>
        <p className="text-muted mt-1">Learn, share, and grow together — with Islamic adab</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/20 rounded-2xl mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center',
              tab === t.id
                ? 'bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-sm'
                : 'text-parchment-500 hover:text-emerald-700')}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      
        <div>
          {tab === 'feed' && <CommunityFeed />}
          {tab === 'qa' && <ScholarQA />}
          {tab === 'circles' && <AccountabilityCircles />}
          {tab === 'halaqah' && <HalaqahCircles />}
        </div>
      
    </div>
  )
}
