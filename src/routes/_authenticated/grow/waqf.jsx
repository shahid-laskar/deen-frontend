import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Globe, DollarSign } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/grow/waqf')({
  component: WaqfPage,
})

const CATS = ['all', 'masjid', 'school', 'water', 'food', 'healthcare', 'orphan', 'quran']
const CAT_ICONS = { masjid: '🕌', school: '📚', water: '💧', food: '🍽️', healthcare: '🏥', orphan: '🤲', quran: '📖', all: '🌍' }

function ProjectCard({ project, onDonate }) {
  const progress = project.goal_amount > 0 ? Math.min(100, Math.round((project.raised_amount / project.goal_amount) * 100)) : 0

  return (
    <Card className="p-4 sm:p-5 group hover:border-primary/40 transition-all cursor-pointer" onClick={() => onDonate(project)}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform">
          {CAT_ICONS[project.category] || '🌍'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-base text-foreground leading-tight">{project.title}</h3>
            <div className="flex gap-1 shrink-0 flex-wrap justify-end">
              {project.is_verified && <Badge variant="secondary" className="text-[9px] uppercase font-bold text-green-600 bg-green-500/10">✓ Verified</Badge>}
              {project.is_featured && <Badge className="text-[9px] uppercase font-black bg-gold text-gold-foreground border-0">⭐ Featured</Badge>}
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

          <div className="space-y-2">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
              <div className="h-full bg-gold transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span className="text-gold-600 dark:text-gold-400">${project.raised_amount.toLocaleString()} raised</span>
              <span className="text-muted-foreground">${project.goal_amount.toLocaleString()} goal <span className="opacity-50 mx-1">•</span> {progress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {project.location && <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{project.location}</span>}
            {project.beneficiaries_count && <span>👥 {project.beneficiaries_count.toLocaleString()} beneficiaries</span>}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function WaqfPage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('all')
  const [donateModal, setDonateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [amount, setAmount] = useState('')
  const [niyyah, setNiyyah] = useState('')
  const [isAnon, setIsAnon] = useState(false)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['waqf', 'projects', category],
    queryFn: () => api.get('/waqf/projects', { params: { category: category !== 'all' ? category : undefined } }).then(r => r.data).catch(() => []),
  })

  const { data: myDonations = [] } = useQuery({ queryKey: ['waqf', 'my-donations'], queryFn: () => api.get('/waqf/my-donations').then(r => r.data).catch(() => []) })
  const { data: myTotal } = useQuery({ queryKey: ['waqf', 'my-total'], queryFn: () => api.get('/waqf/my-total').then(r => r.data).catch(() => null) })

  const { mutate: donate, isPending } = useMutation({
    mutationFn: () => api.post('/waqf/donate', { project_id: selectedProject.id, amount: parseFloat(amount), currency: 'USD', is_anonymous: isAnon, niyyah: niyyah || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['waqf'] }); setDonateModal(false); setAmount(''); setNiyyah(''); toast.success(`JazakAllahu Khayran! May Allah accept your donation. 🤲`) },
  })

  const openDonate = (project) => { setSelectedProject(project); setDonateModal(true) }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Waqf & Sadaqah <Heart className="h-6 w-6 text-red-500 fill-current" /></h1>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">Give in the way of Allah — every coin is eternal sadaqah.</p>
      </div>

      {myTotal && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in">
          <Card className="p-4 bg-gold-50 dark:bg-gold-900/10 border-gold-200 dark:border-gold-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-gold-600 dark:text-gold-400 mb-2">Total Donated</p>
            <p className="text-2xl font-black text-gold-700 dark:text-gold-300 mb-1">${myTotal.total_donated_usd.toLocaleString()}</p>
            <p className="text-xs font-bold text-muted-foreground">Across all campaigns</p>
          </Card>
          <Card className="p-4 border-primary/20 bg-primary/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Projects</p>
            <p className="text-2xl font-black text-foreground mb-1">{new Set(myDonations.map(d => d.project_id)).size || 0}</p>
            <p className="text-xs font-bold text-muted-foreground">Supported initiatives</p>
          </Card>
        </div>
      )}

      <div className="p-5 bg-card border border-border rounded-2xl relative overflow-hidden shadow-sm animate-in fade-in">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <p className="font-amiri text-2xl text-foreground text-right leading-loose mb-3 opacity-90">مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ</p>
        <p className="text-sm font-medium text-muted-foreground">"Those who spend their wealth in the way of Allah are like a grain that sprouts seven ears..." <br /><span className="text-xs font-bold uppercase mt-2 block opacity-70">Quran 2:261</span></p>
      </div>

      <div className="flex gap-2 flex-wrap animate-in fade-in slide-in-from-bottom-2">
        {CATS.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={cn('px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all border flex items-center gap-1.5', category === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted')}>
            <span>{CAT_ICONS[c]}</span> {c}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2">
        {isLoading ? <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
          : projects.length === 0 ? (
            <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary"><Heart className="h-8 w-8" /></div>
              <h3 className="text-base font-bold text-foreground mb-1">No projects found</h3>
              <p className="text-sm text-muted-foreground mb-6">Check back soon — new waqf projects are reviewed weekly.</p>
            </div>
          ) : (
            <div className="space-y-4">{projects.map(p => <ProjectCard key={p.id} project={p} onDonate={openDonate} />)}</div>
          )}
      </div>

      <Dialog open={donateModal} onOpenChange={setDonateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Donate to {selectedProject?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                💡 This records your pledge. Payment is processed through{' '}
                {selectedProject?.external_donation_url
                  ? <a href={selectedProject.external_donation_url} target="_blank" rel="noopener noreferrer" className="underline font-bold">the project's page</a>
                  : 'the organisation directly'}.
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">Amount (USD)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[10, 25, 50, 100].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className={cn('h-10 rounded-xl text-sm font-bold border transition-all hover:border-gold/50', amount === String(a) ? 'bg-gold text-gold-foreground border-gold' : 'bg-card text-muted-foreground border-border')}>
                    ${a}
                  </button>
                ))}
              </div>
              <Input type="number" min="1" placeholder="Custom amount" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">Niyyah (intention — optional)</label>
              <Input placeholder="e.g. On behalf of my late parents" value={niyyah} onChange={e => setNiyyah(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" className="rounded border-border w-4 h-4 text-primary" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} />
              Donate anonymously
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => donate()} loading={isPending} disabled={!amount || parseFloat(amount) <= 0} className="bg-gold hover:bg-gold/90 text-gold-foreground font-bold">
              🤲 Pledge ${amount || '—'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
