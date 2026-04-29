import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Folder, Plus, Trash2, ArrowRight } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/worship/quran/bookmarks')({
  component: BookmarksTab,
})

const FOLDER_COLORS = ['#3b82f6','#ef4444','#22c55e','#a855f7','#f59e0b','#14b8a6']

function BookmarksTab() {
  const qc       = useQueryClient()
  const navigate = useNavigate()
  const [folderModal,    setFolderModal]    = useState(false)
  const [newFolder,      setNewFolder]      = useState({ name: '', color: FOLDER_COLORS[0] })
  const [activeFolderId, setActiveFolderId] = useState(null)

  const { data: folders = [] } = useQuery({
    queryKey: ['quran','bookmark-folders'],
    queryFn:  quranApi.bookmarkFolders,
    staleTime: 60_000,
  })

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['quran','bookmarks', activeFolderId],
    queryFn:  () => quranApi.bookmarks(activeFolderId ? { folder_id: activeFolderId } : {}),
    staleTime: 30_000,
  })

  const { mutate: createFolder, isPending: creatingFolder } = useMutation({
    mutationFn: () => quranApi.createFolder({ name: newFolder.name, color: newFolder.color }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['quran','bookmark-folders'] })
      setFolderModal(false)
      setNewFolder({ name: '', color: FOLDER_COLORS[0] })
      toast.success('Folder created')
    },
    onError: () => toast.error('Failed to create folder'),
  })

  const { mutate: deleteBookmark } = useMutation({
    mutationFn: (id) => quranApi.deleteBookmark(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['quran','bookmarks'] })
      toast.success('Bookmark removed')
    },
  })

  const { mutate: deleteFolder } = useMutation({
    mutationFn: (id) => quranApi.deleteFolder(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['quran','bookmark-folders'] })
      if (activeFolderId) setActiveFolderId(null)
      toast.success('Folder deleted')
    },
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" /> Bookmarks
        </h2>
        <Button size="sm" onClick={() => setFolderModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Folder
        </Button>
      </div>

      {/* Folder tabs */}
      <div className="w-full overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max min-w-full p-1 bg-muted rounded-xl">
          <button
            onClick={() => setActiveFolderId(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap',
              !activeFolderId ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Bookmark className="h-3.5 w-3.5" /> All
            {bookmarks.length > 0 && !activeFolderId && (
              <span className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 text-[9px] font-black">{bookmarks.length}</span>
            )}
          </button>

          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFolderId(f.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap group',
                activeFolderId === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Folder className="h-3.5 w-3.5" style={{ color: f.color }} />
              {f.name}
              {/* Delete folder button on hover */}
              <span
                onClick={(e) => { e.stopPropagation(); deleteFolder(f.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 ml-1"
                title="Delete folder"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookmark list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState
          illustration="book"
          title="No bookmarks yet"
          description={activeFolderId ? 'No bookmarks in this folder.' : 'Tap the bookmark icon on any verse while reading.'}
          className="border-2 border-dashed border-border rounded-3xl bg-muted/20 py-12"
        >
          {!activeFolderId && (
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/worship/quran' })}>
              <BookmarkIcon className="h-4 w-4 mr-1.5" /> Browse Quran
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {bookmarks.map(b => {
            const highlightColor = b.highlight_color || '#f59e0b'
            return (
              <Card
                key={b.id}
                className="p-4 border-l-4 transition-all hover:shadow-md cursor-pointer group"
                style={{ borderLeftColor: highlightColor }}
                onClick={() => navigate({ to: '/worship/quran/surah/$id', params: { id: String(b.surah_number) }, search: { ayah: b.ayah_number } })}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest">
                      {b.surah_name || `Surah ${b.surah_number}`}
                    </Badge>
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                      Ayah {b.ayah_number}
                    </span>
                    {b.verse_key && (
                      <span className="text-[9px] font-black text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {b.verse_key}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBookmark(b.id) }}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {b.ayah_arabic ? (
                  <p className="font-amiri text-xl leading-loose text-right rtl text-foreground mb-2">
                    {b.ayah_arabic}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic mb-2">Tap to load verse text</p>
                )}

                {b.note && (
                  <div className="bg-muted p-3 rounded-xl border border-border/50 mt-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">My Note</p>
                    <p className="text-sm font-medium text-foreground">{b.note}</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* New folder modal */}
      <Dialog open={folderModal} onOpenChange={setFolderModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Bookmark Folder</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold mb-1 block">Folder Name</label>
              <Input
                placeholder="e.g. Favorite Verses"
                value={newFolder.name}
                onChange={e => setNewFolder(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold mb-2 block">Color</label>
              <div className="flex gap-3">
                {FOLDER_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewFolder(f => ({ ...f, color: c }))}
                    className={cn('w-8 h-8 rounded-full border-2 transition-all', newFolder.color === c ? 'border-foreground scale-110 shadow-md' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderModal(false)}>Cancel</Button>
            <Button onClick={() => createFolder()} disabled={!newFolder.name || creatingFolder}>
              {creatingFolder ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Local icon shim since Bookmark isn't exported by name for the empty state CTA
function BookmarkIcon({ className }) {
  return <Bookmark className={className} />
}
