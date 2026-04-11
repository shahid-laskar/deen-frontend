import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, MessageSquare, Heart, Flag, Send, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Modal, Badge, EmptyState, Skeleton, Textarea } from '../components/ui/index'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { clsx } from 'clsx'

const CATS = ['general', 'quran', 'hadith', 'fiqh', 'lifestyle', 'sisters', 'youth', 'family']
const CAT_ICONS = { general: '🕌', quran: '📖', hadith: '📜', fiqh: '⚖️', lifestyle: '🌿', sisters: '🌸', youth: '🌱', family: '👨‍👩‍👧' }

function PostCard({ post, onReact, onComment }) {
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
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              {post.is_anonymous ? 'Anonymous' : 'Member'}
            </span>
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
                  <div className="w-7 h-7 bg-parchment-200 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-xs flex-shrink-0">
                    {c.is_anonymous ? '?' : 'U'}
                  </div>
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

export default function Community() {
  const qc = useQueryClient()
  const [view, setView] = useState('feed')   // feed | groups | my-group
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Users size={26} className="text-emerald-600" /> Community</h1>
          <p className="text-muted mt-1">Learn, share, and grow together — with Islamic adab</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setGroupModal(true)}><Plus size={14} /> New group</Button>
          <Button variant="primary" size="sm" onClick={() => setPostModal(true)}><Plus size={14} /> Post</Button>
        </div>
      </div>

      {/* Community guidelines banner */}
      <Card className="mb-5 bg-emerald-950 border-0 p-4">
        <p className="text-emerald-300 text-sm">
          🌿 This is a space of <strong className="text-white">adab</strong> — respect, kindness, and seeking knowledge.
          No fatwas, no arguments, no backbiting. <span className="text-emerald-500">Report anything that violates Islamic etiquette.</span>
        </p>
      </Card>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Groups sidebar */}
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
              <span>{g.icon}</span>
              <span className="flex-1 truncate">{g.name}</span>
              <span className="text-xs text-muted">{g.member_count}</span>
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="md:col-span-2 space-y-4">
          {activeGroup && (
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-display font-semibold text-emerald-900 dark:text-emerald-200">{activeGroup.icon} {activeGroup.name}</h2>
                <p className="text-xs text-muted">{activeGroup.member_count} members • {activeGroup.description}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => joinGroup(activeGroup.id)}>Join</Button>
            </div>
          )}

          {postsLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
            : !posts?.length ? (
              <EmptyState icon={MessageSquare} title="No posts yet"
                description="Be the first to post. Share knowledge, ask a question, or write a reflection."
                action={<Button variant="primary" onClick={() => setPostModal(true)}>Write the first post</Button>} />
            ) : (
              posts?.map(p => <PostCard key={p.id} post={p} onReact={react} onComment={() => {}} />)
            )}
        </div>
      </div>

      <Modal open={postModal} onClose={() => setPostModal(false)} title={`New post${activeGroup ? ` in ${activeGroup.name}` : ''}`} size="lg">
        <div className="space-y-4">
          <Input label="Title (optional)" placeholder="Optional — for questions or resources" value={postForm.title}
            onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
          <Textarea label="Content" placeholder="Share knowledge, ask a question, or write a reflection..." rows={5}
            value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
          <div className="flex items-center gap-4">
            <select className="input text-sm" value={postForm.post_type} onChange={e => setPostForm({ ...postForm, post_type: e.target.value })}>
              {['text', 'question', 'reflection', 'resource'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={postForm.is_anonymous} onChange={e => setPostForm({ ...postForm, is_anonymous: e.target.checked })} />
              Post anonymously
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
    </div>
  )
}
