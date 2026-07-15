import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, AlertTriangle, Shuffle, Sprout, Bookmark } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/worship/hadith')({
  component: HadithTab,
})

const GRADE_STYLES = {
  sahih:   { bg: 'bg-green-500/10 text-green-600 border-green-500/20',   label: 'Sahih ✓' },
  hasan:   { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',     label: 'Hasan' },
  daif:    { bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20',label: "Da'if ⚠" },
  mawdu:   { bg: 'bg-red-500/10 text-red-500 border-red-500/20',         label: 'Mawdu ✗' },
  unknown: { bg: 'bg-muted text-muted-foreground border-border',          label: 'Unknown' },
}

const COLLECTIONS = [
  { key: null,       label: 'All' },
  { key: 'bookmarks',label: 'Bookmarks' },
  { key: 'bukhari',  label: 'Bukhari' },
  { key: 'muslim',   label: 'Muslim' },
  { key: 'tirmidhi', label: 'Tirmidhi' },
  { key: 'abudawud', label: 'Abu Dawud' },
  { key: 'nasai',    label: "An-Nasa'i" },
  { key: 'ibnmajah', label: 'Ibn Majah' },
  { key: 'nawawi40', label: "Nawawi's 40" },
]

const GRADES = [
  { key: null,    label: 'All Grades' },
  { key: 'sahih', label: 'Sahih ✓' },
  { key: 'hasan', label: 'Hasan' },
  { key: 'daif',  label: "Da'if" },
]

function HadithCard({ h, isBookmarked, onToggleBookmark }) {
  const grade = h.grade?.toLowerCase() || 'unknown'
  const style = GRADE_STYLES[grade] || GRADE_STYLES.unknown
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
        <Badge variant="outline" className={cn('text-[9px] uppercase font-black tracking-widest border', style.bg)}>{style.label}</Badge>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {h.collection} #{h.hadith_number}
          </span>
          <button onClick={() => onToggleBookmark(h)} className={cn("transition-colors", isBookmarked ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground")}>
            <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      {h.arabic_text && (
        <p className="font-amiri text-xl leading-loose text-right rtl text-foreground mb-4">{h.arabic_text}</p>
      )}
      <p className="text-[13px] font-medium text-foreground leading-relaxed mb-4">{h.english_text}</p>
      {h.narrator_chain && (
        <p className="text-[11px] font-bold text-muted-foreground mt-2 leading-snug">— {h.narrator_chain}</p>
      )}
      {h.topics && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {h.topics.split(',').map(t => t.trim()).filter(Boolean).map(t => (
            <Badge key={t} variant="secondary" className="text-[9px] uppercase font-black tracking-widest">{t}</Badge>
          ))}
        </div>
      )}
      {grade === 'daif' && (
        <p className="text-[10px] uppercase font-black tracking-widest text-orange-600 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl mt-4 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Da'if hadith — treat with caution; do not cite as religious obligation.
        </p>
      )}
    </Card>
  )
}

function HadithTab() {
  const qc = useQueryClient()
  const [search,     setSearch]     = useState('')
  const [collection, setCollection] = useState(null)
  const [grade,      setGrade]      = useState(null)
  const [offset,     setOffset]     = useState(0)
  const [bookmarks,  setBookmarks]  = useState(() => { try { return JSON.parse(localStorage.getItem('deen-hadith-bookmarks') || '[]') } catch { return [] } })
  const LIMIT = 10

  const handleFilterChange = (fn) => { fn(); setOffset(0) }

  const toggleBookmark = (h) => {
    setBookmarks(prev => {
      const next = prev.some(b => b.id === h.id) ? prev.filter(b => b.id !== h.id) : [h, ...prev]
      localStorage.setItem('deen-hadith-bookmarks', JSON.stringify(next))
      return next
    })
  }

  const { data: hadithOfDay } = useQuery({
    queryKey: ['hadith','day'],
    queryFn:  quranApi.hadithOfDay,
  })

  const searchEnabled = search.trim().length >= 2
  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ['hadith','search', search, collection],
    queryFn:  () => quranApi.searchHadith(search.trim(), collection),
    enabled:  searchEnabled && collection !== 'bookmarks',
    staleTime: 60_000,
  })

  const { data: allHadiths = [], isLoading, isFetching } = useQuery({
    queryKey: ['hadith','list', collection, grade, offset],
    queryFn:  () => quranApi.hadith({ collection, grade, limit: LIMIT, offset }),
    enabled:  !searchEnabled && collection !== 'bookmarks',
    staleTime: 60_000,
    keepPreviousData: true,
  })

  const { mutate: seedHadiths, isPending: seeding } = useMutation({
    mutationFn: quranApi.seedHadiths,
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ['hadith'] }); toast.success(d?.message || 'Hadiths seeded!') },
    onError: () => toast.error('Seed failed'),
  })

  const displayed = collection === 'bookmarks' ? bookmarks : (searchEnabled ? searchResults : allHadiths)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-4">

      {/* Hadith of the day */}
      {hadithOfDay && collection !== 'bookmarks' && !searchEnabled && <HadithCard h={hadithOfDay} isBookmarked={bookmarks.some(b => b.id === hadithOfDay.id)} onToggleBookmark={toggleBookmark} />}

      {/* Search bar */}
      <div className="relative">
        <Input
          placeholder="Search hadiths... (e.g. fasting, patience, prayer)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-11 pl-10 bg-muted/50"
        />
        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5" />
      </div>

      {/* Collection filter */}
      <div className="w-full overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max">
          {COLLECTIONS.map(c => (
            <button
              key={String(c.key)}
              onClick={() => handleFilterChange(() => setCollection(c.key))}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all',
                collection === c.key
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grade filter */}
      {!searchEnabled && collection !== 'bookmarks' && (
        <div className="flex gap-2">
          {GRADES.map(g => (
            <button
              key={String(g.key)}
              onClick={() => handleFilterChange(() => setGrade(g.key))}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
                grade === g.key
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {(isLoading || searching) ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-muted/30">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-sm font-bold text-foreground mb-1">No hadiths found</p>
            <p className="text-xs text-muted-foreground mb-4">
              {allHadiths.length === 0 ? 'Seed the database to browse hadiths.' : 'Try a different search or filter.'}
            </p>
            {allHadiths.length === 0 && (
              <Button onClick={() => seedHadiths()} disabled={seeding}>
                <Sprout className="h-4 w-4 mr-1.5" />
                {seeding ? 'Seeding...' : 'Seed Hadiths'}
              </Button>
            )}
          </div>
        ) : (
          displayed.map(h => <HadithCard key={h.id} h={h} isBookmarked={bookmarks.some(b => b.id === h.id)} onToggleBookmark={toggleBookmark} />)
        )}

        {/* Pagination for browse mode */}
        {!searchEnabled && collection !== 'bookmarks' && displayed.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0 || isFetching}
              onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
            >
              Previous
            </Button>
            <span className="text-xs font-bold text-muted-foreground">Showing {offset + 1}–{offset + displayed.length}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={displayed.length < LIMIT || isFetching}
              onClick={() => setOffset(o => o + LIMIT)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
