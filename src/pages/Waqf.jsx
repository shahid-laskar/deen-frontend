import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, CheckCircle, Star, Globe, DollarSign } from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Input, Modal, Badge, EmptyState, Skeleton, ProgressRing } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const CATS = ['all', 'masjid', 'school', 'water', 'food', 'healthcare', 'orphan', 'quran']
const CAT_ICONS = { masjid: '🕌', school: '📚', water: '💧', food: '🍽️', healthcare: '🏥', orphan: '🤲', quran: '📖', all: '🌍' }

function ProjectCard({ project, onDonate }) {
  const progress = project.goal_amount > 0
    ? Math.min(100, Math.round((project.raised_amount / project.goal_amount) * 100))
    : 0

  return (
    <Card hover className="cursor-pointer" onClick={() => onDonate(project)}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
          {CAT_ICONS[project.category] || '🌍'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200 leading-tight">{project.title}</h3>
            <div className="flex gap-1 flex-shrink-0">
              {project.is_verified && <Badge variant="green" className="text-xs">✓ Verified</Badge>}
              {project.is_featured && <Badge variant="gold" className="text-xs">⭐ Featured</Badge>}
            </div>
          </div>
          <p className="text-xs text-muted mb-3 line-clamp-2">{project.description}</p>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="h-2 bg-parchment-200 dark:bg-emerald-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-gold-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gold-700 dark:text-gold-400">
                ${project.raised_amount.toLocaleString()} raised
              </span>
              <span className="text-muted">${project.goal_amount.toLocaleString()} goal • {progress}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {project.location && <span className="text-xs text-muted flex items-center gap-1"><Globe size={10} />{project.location}</span>}
            {project.beneficiaries_count && <span className="text-xs text-muted">👥 {project.beneficiaries_count.toLocaleString()} beneficiaries</span>}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Waqf() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('all')
  const [donateModal, setDonateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [amount, setAmount] = useState('')
  const [niyyah, setNiyyah] = useState('')
  const [isAnon, setIsAnon] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['waqf', 'projects', category],
    queryFn: () => api.get('/waqf/projects', { params: { category: category !== 'all' ? category : undefined } }).then(r => r.data),
  })

  const { data: myDonations } = useQuery({ queryKey: ['waqf', 'my-donations'], queryFn: () => api.get('/waqf/my-donations').then(r => r.data) })
  const { data: myTotal } = useQuery({ queryKey: ['waqf', 'my-total'], queryFn: () => api.get('/waqf/my-total').then(r => r.data) })

  const { mutate: donate, isPending } = useMutation({
    mutationFn: () => api.post('/waqf/donate', {
      project_id: selectedProject.id,
      amount: parseFloat(amount),
      currency: 'USD',
      is_anonymous: isAnon,
      niyyah: niyyah || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waqf'] })
      setDonateModal(false)
      setAmount('')
      setNiyyah('')
      toast.success(`JazakAllahu Khayran! May Allah accept your donation. 🤲`)
    },
  })

  const openDonate = (project) => {
    setSelectedProject(project)
    setDonateModal(true)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2"><Heart size={26} className="text-red-500" /> Waqf & Sadaqah</h1>
        <p className="text-muted mt-1">Give in the way of Allah — every coin is eternal sadaqah</p>
      </div>

      {/* My giving stats */}
      {myTotal && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-gold-50 dark:bg-gold-900/10 border-gold-200 dark:border-gold-800">
            <p className="text-xs text-muted mb-1">Total donated</p>
            <p className="font-display text-2xl font-bold text-gold-700 dark:text-gold-400">${myTotal.total_donated_usd.toLocaleString()}</p>
            <p className="text-xs text-muted mt-0.5">Confirmed donations</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted mb-1">Projects supported</p>
            <p className="font-display text-2xl font-bold text-emerald-900 dark:text-emerald-100">{new Set(myDonations?.map(d => d.project_id)).size || 0}</p>
            <p className="text-xs text-muted mt-0.5">Across all campaigns</p>
          </Card>
        </div>
      )}

      {/* Ayah about sadaqah */}
      <div className="mb-6 px-5 py-4 bg-emerald-950 rounded-xl">
        <p className="font-arabic text-xl text-white text-right leading-loose mb-2">
          مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ
        </p>
        <p className="text-emerald-300 text-sm">"Those who spend their wealth in the way of Allah are like a grain that sprouts seven ears..." — Quran 2:261</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CATS.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize',
              category === c ? 'bg-emerald-800 text-white border-emerald-800' : 'border-parchment-300 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500')}>
            {CAT_ICONS[c]} {c}
          </button>
        ))}
      </div>

      {/* Projects */}
      {isLoading ? <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
        : projects?.length === 0 ? (
          <EmptyState icon={Heart} title="No projects found" description="Check back soon — new waqf projects are reviewed weekly." />
        ) : (
          <div className="space-y-4">{projects?.map(p => <ProjectCard key={p.id} project={p} onDonate={openDonate} />)}</div>
        )}

      <Modal open={donateModal} onClose={() => setDonateModal(false)} title={`Donate to ${selectedProject?.title}`}>
        <div className="space-y-4">
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              💡 This records your pledge. Payment is processed through{' '}
              {selectedProject?.external_donation_url
                ? <a href={selectedProject.external_donation_url} target="_blank" rel="noopener noreferrer" className="underline">the project's page</a>
                : 'the organisation directly'}.
            </p>
          </div>
          <div>
            <label className="label">Amount (USD)</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 25, 50, 100].map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={clsx('py-2.5 rounded-xl text-sm font-semibold border transition-all',
                    amount === String(a) ? 'bg-gold-600 text-white border-gold-600' : 'border-parchment-300 dark:border-emerald-800 text-parchment-600')}>
                  ${a}
                </button>
              ))}
            </div>
            <Input type="number" min="1" placeholder="Custom amount" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <Input label="Niyyah (intention — optional)" placeholder="e.g. On behalf of my late parents" value={niyyah}
            onChange={e => setNiyyah(e.target.value)} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} />
            Donate anonymously
          </label>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDonateModal(false)} className="flex-1">Cancel</Button>
            <Button variant="gold" onClick={() => donate()} loading={isPending} disabled={!amount || parseFloat(amount) <= 0} className="flex-1">
              🤲 Pledge ${amount || '—'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
