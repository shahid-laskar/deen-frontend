import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { SurahCard } from '@/components/quran/SurahCard'
import { ContinueReadingHero } from '@/components/quran/ContinueReadingHero'
import { EmptyState } from '@/components/ui/empty-state'

export const Route = createFileRoute('/_authenticated/worship/quran/')({
  component: QuranIndex,
})

function QuranIndex() {
  const [search, setSearch] = useState('')

  const { data: surahs, isLoading } = useQuery({
    queryKey: ['quran', 'surahs'],
    queryFn: quranApi.surahs,
    staleTime: Infinity,
  })

  // Start with local, update with server
  const { data: lastRead } = useQuery({
    queryKey: ['quran', 'lastRead'],
    queryFn: quranApi.lastRead,
  })

  const { data: stats } = useQuery({
    queryKey: ['quran', 'stats'],
    queryFn: quranApi.stats,
  })

  const filteredSurahs = surahs?.filter(s =>
    s.name_simple.toLowerCase().includes(search.toLowerCase()) ||
    s.name_arabic.includes(search) ||
    s.id.toString() === search
  ) || []

  const navigate = useNavigate()
  const isVerseSearch = /^\d+:\d+$/.test(search.trim())

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search surahs (e.g., 'Yaseen', 'Kahf', '36', '2:255')"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-card shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Continue Reading */}
      {!search && (
        <ContinueReadingHero
          lastRead={lastRead}
          versesRead={stats?.total_verses_read || 0}
        />
      )}

      {/* Surahs Grid */}
      <div>
        <h3 className="section-label mb-4">{search ? 'Search Results' : 'Surahs (114)'}</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isVerseSearch ? (
              <div className="col-span-full">
                <button 
                  onClick={() => {
                    const [sId, aId] = search.trim().split(':')
                    navigate({ to: `/worship/quran/surah/$id`, params: { id: sId }, search: { ayah: aId }})
                  }}
                  className="w-full p-6 text-center bg-card rounded-2xl border border-primary/30 hover:bg-primary/5 transition-colors group shadow-sm flex flex-col items-center justify-center gap-2"
                >
                  <p className="text-xl font-bold text-foreground">Jump to Verse {search.trim()}</p>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">Read exact verse in reader →</p>
                </button>
              </div>
            ) : (
              <>
                {filteredSurahs.map(surah => (
                  <SurahCard key={surah.id} surah={surah} />
                ))}
                {filteredSurahs.length === 0 && (
                  <div className="col-span-full">
                    <EmptyState
                      illustration="book"
                      title="No Surahs Found"
                      description={`We couldn't find any surahs matching "${search}".`}
                      className="bg-transparent"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
