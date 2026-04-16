import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, differenceInMonths } from 'date-fns'
import { Plus, Star, CheckCircle, Circle, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui/compat'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/children')({
  component: ChildrenPage,
})

const MILESTONE_CATS = ['aqeedah', 'salah', 'quran', 'arabic', 'akhlaq', 'seerah', 'fiqh', 'dua']
const CAT_COLORS = { aqeedah: 'text-green-600', salah: 'text-blue-600', quran: 'text-gold-600', arabic: 'text-purple-600', akhlaq: 'text-pink-600', seerah: 'text-teal-600', fiqh: 'text-orange-600', dua: 'text-red-500' }

function ChildCard({ child }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState('milestones')
  const ageMonths = child.date_of_birth ? differenceInMonths(new Date(), new Date(child.date_of_birth)) : null

  const { data: milestones } = useQuery({ queryKey: ['child', child.id, 'milestones'], queryFn: () => api.get(`/children/${child.id}/milestones`).then(r => r.data).catch(() => []) })
  const { data: duas } = useQuery({ queryKey: ['child', child.id, 'duas'], queryFn: () => api.get(`/children/${child.id}/duas`).then(r => r.data).catch(() => []) })

  const { mutate: toggleMilestone } = useMutation({
    mutationFn: ({ msId, achieved }) => api.patch(`/children/${child.id}/milestones/${msId}`, { achieved, achieved_date: achieved ? format(new Date(), 'yyyy-MM-dd') : null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['child', child.id] }),
  })

  const { mutate: updateDua } = useMutation({
    mutationFn: ({ logId, status }) => api.patch(`/children/${child.id}/duas/${logId}`, { status, mastered_date: status === 'mastered' ? format(new Date(), 'yyyy-MM-dd') : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['child', child.id] }); toast.success('MashaaAllah! Progress saved 🌟') },
  })

  const achieved = milestones?.filter(m => m.achieved).length || 0
  const total = milestones?.length || 0

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-gold/20 shadow-sm">{child.avatar_emoji}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-foreground">{child.name}</h3>
          {ageMonths !== null && <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{Math.floor(ageMonths / 12)}y {ageMonths % 12}m old</p>}
        </div>
        <div className="text-right bg-primary/5 p-2 px-3 rounded-xl border border-primary/10">
          <p className="font-black text-xl text-primary">{achieved}<span className="text-sm text-primary/50">/{total}</span></p>
          <p className="text-[9px] font-black uppercase text-primary/70 tracking-widest mt-0.5">milestones</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
        {['milestones', 'duas'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all', tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'milestones' && (
        <div className="space-y-4 max-h-72 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
          {milestones?.length === 0 && <p className="text-sm font-medium text-muted-foreground text-center py-6">No milestones yet.</p>}
          {MILESTONE_CATS.map(cat => {
            const catItems = milestones?.filter(m => m.category === cat) || []
            if (!catItems.length) return null
            return (
              <div key={cat} className="space-y-1.5">
                <p className={cn('text-[10px] font-black uppercase tracking-widest mb-2', CAT_COLORS[cat])}>{cat}</p>
                {catItems.map(ms => (
                  <button key={ms.id} onClick={() => toggleMilestone({ msId: ms.id, achieved: !ms.achieved })} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left group border border-transparent hover:border-border">
                    <div className="shrink-0">{ms.achieved ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />}</div>
                    <p className={cn('text-sm font-semibold flex-1 transition-colors', ms.achieved ? 'text-muted-foreground/60 line-through' : 'text-foreground')}>{ms.title}</p>
                    {ms.achieved && <Star className="h-4 w-4 text-gold fill-current shrink-0 animate-in zoom-in" />}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'duas' && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
          {duas?.length === 0 && <p className="text-sm font-medium text-muted-foreground text-center py-6">No duas tracked yet.</p>}
          {duas?.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{d.dua_name}</p>
              </div>
              <Select className="w-32 h-8 text-[11px] font-bold uppercase tracking-wider" value={d.status} onChange={e => updateDua({ logId: d.id, status: e.target.value })} options={['not_started', 'learning', 'reciting', 'mastered'].map(s => ({label: s.replace('_', ' '), value: s}))} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function ChildrenPage() {
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', date_of_birth: '', gender: 'male', avatar_emoji: '🌟' })
  const EMOJIS = ['🌟', '🌙', '📖', '🕊️', '🌸', '🦋', '🌺', '⭐', '🎯', '💫']

  const { data: children = [], isLoading } = useQuery({ queryKey: ['children'], queryFn: () => api.get('/children').then(r => r.data).catch(() => []) })

  const { mutate: createChild, isPending } = useMutation({
    mutationFn: () => api.post('/children', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['children'] }); setAddModal(false); toast.success(`${form.name}'s profile created! 🌟`) },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Child Upbringing <Star className="h-6 w-6 text-gold fill-current" /></h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Track your children's Islamic education and milestones.</p>
        </div>
        <Button onClick={() => setAddModal(true)} className="font-bold"><Plus className="h-4 w-4 mr-1.5" /> Add child</Button>
      </div>

      <div className="p-5 bg-card border border-border shadow-sm rounded-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <p className="font-bold text-lg text-foreground mb-1 leading-tight">"Every one of you is a shepherd and is responsible for his flock."</p>
        <p className="text-xs font-bold text-primary uppercase tracking-widest">— Prophet Muhammad ﷺ (Bukhari)</p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2">
        {isLoading ? <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
          : children.length === 0 ? (
            <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
              <span className="text-5xl block mb-4">👶</span>
              <h3 className="text-base font-bold text-foreground mb-1">No children added yet</h3>
              <p className="text-sm text-muted-foreground mb-6">Add your children to start tracking their Islamic milestones, Quran progress, and duas.</p>
              <Button onClick={() => setAddModal(true)}>Add your first child</Button>
            </div>
          ) : (
            <div className="space-y-6">{children.map(c => <ChildCard key={c.id} child={c} />)}</div>
          )}
      </div>

      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add a child profile</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold text-foreground mb-1 block">Child's Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></div>
            <div><label className="text-xs font-bold text-foreground mb-1 block">Date of Birth (optional)</label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">Avatar Emoji</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setForm({ ...form, avatar_emoji: e })}
                    className={cn('w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all border-2', form.avatar_emoji === e ? 'bg-gold/20 border-gold shadow-sm scale-110' : 'bg-muted border-transparent hover:border-border hover:bg-muted/80')}>{e}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => createChild()} disabled={isPending || !form.name.trim()}>{isPending ? 'Adding...' : `Add ${form.name || 'child'}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
