import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, ArrowRight, Loader2, ChevronDown } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authenticated/quran/search')({
  component: SearchTab,
})

const SEARCH_TOPIC_CHIPS = [
  'Sabr','Rahmah','Tawakkul','Jannah','Dua',
  'Forgiveness','Heart','Prayer','Fasting','Zakat',
  'Parents','Knowledge','Gratitude','Trust',
]

function stripHtml(value = '') { return value.replace(/<[^>]+>/g, '').replace(/\[\d+\]/g, '') }

function SearchTab() {
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const navigate                 = useNavigate()
  const trimmedSearch            = search.trim()

  // Reset page when query changes
  const handleSearchChange = (val) => { setSearch(val); setPage(1) }

  const { data: searchData, isFetching } = useQuery({
    queryKey: ['quran','search', trimmedSearch, page],
    queryFn:  () => quranApi.search(trimmedSearch, { page }),
    enabled:  trimmedSearch.length >= 2,
    staleTime: 5 * 60_000,
    keepPreviousData: true,
  })

  const searchResults  = searchData?.search?.results || []
  const totalResults   = searchData?.search?.total_results || 0
  const totalPages     = searchData?.search?.total_pages || 1
  const currentPage    = searchData?.search?.current_page || page

  const goToVerse = (verseKey) => {
    const [surahId, ayahId] = String(verseKey).split(':').map(Number)
    navigate({ to: '/quran/surah/$id', params: { id: String(surahId) }, search: { ayah: ayahId } })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-4">
      {/* Search input */}
      <div className="relative">
        <Input
          placeholder="Search topic, keyword, or transliteration..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="h-14 pl-12 bg-card rounded-2xl text-base shadow-sm border-border/50"
        />
        <SearchIcon className="h-5 w-5 text-muted-foreground absolute left-4" style={{ top: '18px' }} />
        {isFetching && <Loader2 className="h-5 w-5 text-primary animate-spin absolute right-4" style={{ top: '18px' }} />}
      </div>

      {/* Topic chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 flex-wrap">
        {SEARCH_TOPIC_CHIPS.map(topic => (
          <button
            key={topic}
            onClick={() => handleSearchChange(topic)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border whitespace-nowrap shadow-sm transition-all ${
              search === topic
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Results */}
      {trimmedSearch.length >= 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
              Search Results
            </p>
            <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {totalResults} total · page {currentPage}/{totalPages}
            </span>
          </div>

          <div className="space-y-3">
            {searchResults.map((result) => (
              <button
                key={result.verse_key}
                onClick={() => goToVerse(result.verse_key)}
                className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors shadow-sm group block"
              >
                <div className="flex justify-between items-center mb-3">
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Verse {result.verse_key}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                </div>
                <p className="font-amiri text-2xl leading-loose text-right rtl text-foreground mb-3">
                  {result.text_uthmani || result.text || ''}
                </p>
                <p className="text-sm font-medium text-foreground leading-relaxed bg-muted/40 p-3 rounded-xl border border-border/50 line-clamp-3">
                  {stripHtml(result.translations?.[0]?.text || result.translated_text || '')}
                </p>
              </button>
            ))}

            {!isFetching && searchResults.length === 0 && (
              <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
                <SearchIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-bold text-foreground mb-1">No verses found</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Try a different keyword or topic
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isFetching}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm font-bold text-foreground">{currentPage} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || isFetching}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {trimmedSearch.length < 2 && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-teal-500/5 border-primary/10">
          <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-primary" /> Deep Quran Search
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Search across all 6,236 verses by topic, keyword, or concept. Results come from the full translated Quran.
          </p>
          <div className="space-y-2 text-xs font-medium text-muted-foreground">
            <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Try <strong>"patience"</strong> to find all Sabr verses.</p>
            <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Try <strong>"2:255"</strong> in the Browse tab to jump to Ayatul Kursi.</p>
            <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Up to 50 results per page with pagination.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
