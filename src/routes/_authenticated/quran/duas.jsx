import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, ChevronDown, Plus, CheckCircle, Heart, HeartOff, Sprout } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/quran/duas')({
  component: DuaTab,
})

function DuaTab() {
  const qc = useQueryClient()
  const [selectedCat, setSelectedCat] = useState(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [addModal, setAddModal]   = useState(false)
  const [newDua, setNewDua]       = useState({ title: '', text: '' })
  const [activeDua, setActiveDua] = useState(null)

  const { data: categories = [] } = useQuery({ queryKey: ['quran','dua-cats'],   queryFn: quranApi.duaCategories })
  const { data: duas = [],
          isLoading: duasLoading  } = useQuery({ queryKey: ['quran','duas', selectedCat], queryFn: () => quranApi.duas(selectedCat) })
  const { data: personal = []    } = useQuery({ queryKey: ['quran','personal-duas'], queryFn: quranApi.personalDuas })
  const { data: duaOfDay         } = useQuery({ queryKey: ['quran','dua-of-day'],    queryFn: quranApi.duaOfDay })
  const { data: favorites = []   } = useQuery({ queryKey: ['quran','fav-duas'],      queryFn: quranApi.favDuas })

  const favKeys = new Set(favorites.map(f => f.dua_key))

  const { mutate: createPersonal, isPending: saving } = useMutation({
    mutationFn: () => quranApi.addPersonalDua(newDua),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran','personal-duas'] }); setAddModal(false); setNewDua({ title: '', text: '' }); toast.success('Dua added 🤲') },
  })
  const { mutate: markAnswered } = useMutation({
    mutationFn: ({ id }) => quranApi.updatePersonalDua(id, { is_answered: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran','personal-duas'] }); toast.success('Alhamdulillah! 🤲') },
  })
  const { mutate: deletePersonal } = useMutation({
    mutationFn: (id) => quranApi.deletePersonalDua(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran','personal-duas'] }); toast.success('Dua removed') },
  })
  const { mutate: addFav } = useMutation({
    mutationFn: (key) => quranApi.addFavDua({ dua_key: key }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran','fav-duas'] }); toast.success('Added to favorites ♥') },
  })
  const { mutate: removeFav } = useMutation({
    mutationFn: (id) => quranApi.removeFavDua(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran','fav-duas'] }); toast.success('Removed from favorites') },
  })
  const { mutate: seedDuas, isPending: seeding } = useMutation({
    mutationFn: quranApi.seedDuas,
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['quran','duas'] }); toast.success(data?.message || 'Duas seeded!') },
    onError: () => toast.error('Seed failed'),
  })

  const displayDuas = showFavorites ? favorites.map(f => duas.find(d => d.key === f.dua_key)).filter(Boolean) : duas

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-4">

      {/* Dua of the day */}
      {duaOfDay && (
        <Card className="p-5 bg-primary/5 border-primary/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none"><Star className="h-24 w-24" /></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 relative z-10">Dua of the Day</p>
          <p className="font-amiri text-2xl leading-loose text-right rtl text-foreground mb-3 relative z-10">{duaOfDay.arabic_text}</p>
          {duaOfDay.transliteration && <p className="text-xs font-medium italic text-muted-foreground mb-2 relative z-10">{duaOfDay.transliteration}</p>}
          <p className="text-sm font-bold text-foreground leading-relaxed relative z-10">{duaOfDay.translation}</p>
          {duaOfDay.source && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4 relative z-10">— {duaOfDay.source}</p>}
        </Card>
      )}

      {/* Category filter — constrained width to prevent overflow */}
      <div className="w-full overflow-x-auto scrollbar-none">
        <div className="flex gap-2 p-1 bg-muted rounded-xl w-max min-w-full">
          <button
            onClick={() => { setSelectedCat(null); setShowFavorites(false) }}
            className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all', !selectedCat && !showFavorites ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >All</button>
          <button
            onClick={() => { setShowFavorites(f => !f); setSelectedCat(null) }}
            className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-1', showFavorites ? 'bg-background text-red-500 shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            <Heart className="h-3 w-3" /> Favorites ({favorites.length})
          </button>
          {categories.map(c => (
            <button
              key={c.category}
              onClick={() => { setSelectedCat(c.category); setShowFavorites(false) }}
              className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all', selectedCat === c.category ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {c.category.replace(/_/g, ' ')} ({c.count})
            </button>
          ))}
        </div>
      </div>

      {/* Seed button if no duas */}
      {!duasLoading && duas.length === 0 && (
        <Card className="p-6 text-center border-dashed">
          <Sprout className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">No duas in database</p>
          <p className="text-xs text-muted-foreground mb-4">Seed the database with authentic duas to get started.</p>
          <Button onClick={() => seedDuas()} disabled={seeding}>
            {seeding ? 'Seeding...' : '🌱 Seed Duas'}
          </Button>
        </Card>
      )}

      {/* Duas list */}
      <div className="space-y-2">
        {displayDuas.slice(0, 30).map(dua => (
          <Card key={dua.id} className="overflow-hidden transition-all duration-300">
            <button
              className="w-full text-left p-4 focus:outline-none"
              onClick={() => setActiveDua(activeDua?.id === dua.id ? null : dua)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-sm text-foreground truncate flex-1">{dua.title}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (favKeys.has(dua.key)) {
                        const fav = favorites.find(f => f.dua_key === dua.key)
                        if (fav) removeFav(fav.id)
                      } else {
                        addFav(dua.key)
                      }
                    }}
                    className={cn('p-1.5 rounded-lg transition-colors', favKeys.has(dua.key) ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10')}
                  >
                    <Heart className="h-3.5 w-3.5" fill={favKeys.has(dua.key) ? 'currentColor' : 'none'} />
                  </button>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', activeDua?.id === dua.id ? 'rotate-180' : '')} />
                </div>
              </div>
              {activeDua?.id !== dua.id && (
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 truncate">
                  {dua.category.replace(/_/g, ' ')} · {dua.repetition_count}×
                </p>
              )}
            </button>

            {activeDua?.id === dua.id && (
              <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                <div className="h-px w-full bg-border/50 mb-4" />
                <p className="font-amiri text-2xl leading-loose text-right rtl text-foreground mb-4">{dua.arabic_text}</p>
                {dua.transliteration && <p className="text-xs font-bold text-primary italic mb-3">{dua.transliteration}</p>}
                <p className="text-[13px] font-medium text-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">{dua.translation}</p>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {dua.source && <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest">{dua.source}</Badge>}
                  {dua.when_to_recite && (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      <span className="uppercase font-black text-foreground">When: </span>{dua.when_to_recite}
                    </span>
                  )}
                  {dua.repetition_count > 1 && (
                    <Badge className="bg-primary/10 text-primary border-0 text-[9px] uppercase font-black">×{dua.repetition_count}</Badge>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* My Duas */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">My Duas ({personal.length})</h3>
          <Button size="sm" onClick={() => setAddModal(true)}><Plus className="h-4 w-4 mr-1.5" />Add</Button>
        </div>
        <div className="space-y-3">
          {personal.map(pd => (
            <Card key={pd.id} className={cn('p-4 transition-all', pd.is_answered ? 'opacity-60 bg-muted/30 border-dashed' : '')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className={cn('font-bold text-sm text-foreground truncate', pd.is_answered && 'line-through')}>{pd.title}</p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{pd.text}</p>
                  {pd.is_answered && pd.answered_note && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> {pd.answered_note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!pd.is_answered && (
                    <Button size="sm" variant="outline" className="text-[10px] uppercase font-black h-8 px-2 border-primary/30 text-primary hover:bg-primary/10" onClick={() => markAnswered({ id: pd.id })}>
                      🤲 Answered
                    </Button>
                  )}
                  <button onClick={() => deletePersonal(pd.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {personal.length === 0 && <p className="text-sm font-medium text-muted-foreground text-center py-6">No personal duas yet.</p>}
        </div>
      </div>

      {/* Add dua modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Personal Dua</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold mb-1 block">Title</label><Input placeholder="e.g. For my family" value={newDua.title} onChange={e => setNewDua(d => ({ ...d, title: e.target.value }))} /></div>
            <div><label className="text-xs font-bold mb-1 block">Your Dua</label><Textarea rows={4} placeholder="Write your dua..." value={newDua.text} onChange={e => setNewDua(d => ({ ...d, text: e.target.value }))} className="resize-none" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={() => createPersonal()} disabled={saving || !newDua.title || !newDua.text}>{saving ? 'Saving...' : 'Save Dua'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
