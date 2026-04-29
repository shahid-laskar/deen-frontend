import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, Calculator, TrendingUp, Home as HomeIcon, Heart, ChevronRight, Info, AlertCircle, CheckCircle, RefreshCw, Building } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/grow/finance')({
  component: FinancePage,
})

const TABS = [
  { id: 'zakat', label: 'Zakat', icon: Calculator },
  { id: 'screener', label: 'Halal Screener', icon: TrendingUp },
  { id: 'mortgage', label: 'Mortgage', icon: HomeIcon },
  { id: 'sadaqah', label: 'Sadaqah', icon: Heart },
  { id: 'charity', label: 'Directory', icon: Building },
]

function ZakatCalculator() {
  const STEPS = ['standard', 'assets', 'liabilities', 'result']
  const [step, setStep] = useState(0)
  const [nisab, setNisab] = useState('gold')
  const [assets, setAssets] = useState({ cash: '', gold_grams: '', silver_grams: '', stocks: '', crypto: '', business_inventory: '', receivables: '' })
  const [liabilities, setLiabilities] = useState({ loans: '', rent_due: '', other: '' })
  const [result, setResult] = useState(null)
  const [snapshots, setSnapshots] = useState(() => { try { return JSON.parse(localStorage.getItem('deen-zakat-snapshots') || '[]') } catch { return [] } })

  const saveSnapshot = (res) => {
    const next = [...snapshots, { date: new Date().toISOString(), result: res }]
    setSnapshots(next)
    localStorage.setItem('deen-zakat-snapshots', JSON.stringify(next))
    toast.success('Snapshot saved!')
  }

  const { mutate: calculate, isPending } = useMutation({
    mutationFn: () =>
      api.post('/finance/zakat/calculate', {
        nisab_standard: nisab,
        assets: Object.fromEntries(Object.entries(assets).filter(([, v]) => v).map(([k, v]) => [k, parseFloat(v)])),
        liabilities: Object.fromEntries(Object.entries(liabilities).filter(([, v]) => v).map(([k, v]) => [k, parseFloat(v)])),
      }).then(r => r.data),
    onSuccess: (data) => { setResult(data); setStep(3) },
    onError: () => toast.error('Calculation failed. Please try again.'),
  })

  const assetLabels = { cash: 'Cash & Bank Savings ($)', gold_grams: 'Gold (grams)', silver_grams: 'Silver (grams)', stocks: 'Stocks & Investments ($)', crypto: 'Crypto Holdings ($)', business_inventory: 'Business Inventory ($)', receivables: 'Money Owed to You ($)' }
  const liabilityLabels = { loans: 'Loans & Debts ($)', rent_due: 'Rent Due ($)', other: 'Other Liabilities ($)' }

  return (
    <div className="space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 mb-4">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all", i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{i + 1}</div>
            {i < STEPS.length - 1 && <div className={cn("flex-1 h-1 rounded-full", i < step ? "bg-primary/50" : "bg-muted")} />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <Card className="p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-bold text-lg text-foreground">Choose Nisab Standard</h2>
            <p className="text-sm text-muted-foreground mt-1">The nisab is the minimum amount of wealth before Zakat becomes obligatory.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'gold', label: 'Gold Standard', desc: '85g of gold', note: 'Most common' },
              { id: 'silver', label: 'Silver Standard', desc: '595g of silver', note: 'More inclusive' },
            ].map(opt => (
              <button key={opt.id} onClick={() => setNisab(opt.id)}
                className={cn('p-4 rounded-2xl border-2 text-left transition-all', nisab === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-card')}>
                <div className="font-bold text-sm text-foreground">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                <Badge variant="secondary" className="mt-3 text-[10px] uppercase">{opt.note}</Badge>
              </button>
            ))}
          </div>
          <Button size="lg" className="w-full mt-2" onClick={() => setStep(1)}>Next: Enter Assets <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-lg text-foreground mb-4">Enter Your Assets</h2>
          <div className="space-y-3">
            {Object.entries(assets).map(([key, val]) => (
              <div key={key}>
                <label className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">{assetLabels[key]}</label>
                <Input type="number" min="0" placeholder="0.00" value={val} onChange={e => setAssets({ ...assets, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4 border-t border-border mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
            <Button className="flex-1" onClick={() => setStep(2)}>Next: Liabilities</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-bold text-lg text-foreground">Enter Your Liabilities</h2>
            <p className="text-xs font-medium text-muted-foreground mt-1 mb-4">Debts due within the next lunar year may be deducted.</p>
          </div>
          <div className="space-y-3">
            {Object.entries(liabilities).map(([key, val]) => (
              <div key={key}>
                <label className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">{liabilityLabels[key]}</label>
                <Input type="number" min="0" placeholder="0.00" value={val} onChange={e => setLiabilities({ ...liabilities, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4 border-t border-border mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" onClick={() => calculate()} disabled={isPending}>{isPending ? 'Calculating...' : 'Calculate Zakat'}</Button>
          </div>
        </Card>
      )}

      {step === 3 && result && (
        <div className="space-y-4 animate-in zoom-in-95">
          <Card className="p-6 bg-primary text-primary-foreground border-primary/20 shadow-md">
            <div className="text-xs font-bold uppercase tracking-wider text-primary-foreground/80 mb-2">Your Zakat Due</div>
            <div className="text-5xl font-black">${result.zakat_due.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
            <div className="text-sm font-medium mt-3 text-primary-foreground/90">Net Zakatable Assets: ${result.net_zakatable_assets.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-foreground font-medium flex items-start gap-3">
              <span className="text-xl shrink-0">✅</span>
              <span>Zakat rate of <strong className="text-primary font-black">2.5%</strong> applied to your net zakatable assets above the nisab.</span>
            </p>
            <p className="text-xs font-bold text-muted-foreground mt-3 pt-3 border-t border-border italic text-center">May Allah accept your Zakat and multiply your provision. آمين</p>
          </Card>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setStep(0); setResult(null) }}><RefreshCw className="h-4 w-4 mr-2" /> Recalculate</Button>
            <Button className="flex-1 bg-gold hover:bg-gold/90 text-gold-foreground font-bold" onClick={() => saveSnapshot(result)}>Save Snapshot</Button>
          </div>
        </div>
      )}

      {step === 0 && snapshots.length > 0 && (
        <Card className="p-5 sm:p-6 mt-6">
          <h2 className="font-bold text-lg text-foreground mb-4">Past Snapshots</h2>
          <div className="space-y-3">
            {snapshots.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div>
                  <p className="font-bold text-sm text-foreground">{new Date(s.date).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">Assets: ${s.result.net_zakatable_assets.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">${s.result.zakat_due.toLocaleString()}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Zakat</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function SadaqahTracker() {
  const [goal, setGoal] = useState(100)
  const [given, setGiven] = useState(45)
  const [entries, setEntries] = useState([
    { id: 1, amount: 25, recipient: 'Islamic Relief', date: '2026-04-20', note: 'Orphan sponsorship' },
    { id: 2, amount: 20, recipient: 'Local Masjid', date: '2026-04-25', note: 'Jumuah' },
  ])
  const [newAmount, setNewAmount] = useState('')
  const [newRecipient, setNewRecipient] = useState('')

  const handleAdd = () => {
    if (!newAmount || !newRecipient) return
    setEntries([{ id: Date.now(), amount: parseFloat(newAmount), recipient: newRecipient, date: new Date().toISOString().split('T')[0] }, ...entries])
    setGiven(given + parseFloat(newAmount))
    setNewAmount('')
    setNewRecipient('')
    toast.success('Sadaqah logged!')
  }

  const progress = Math.min(100, Math.round((given / goal) * 100))

  return (
    <div className="space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-6">
        <h2 className="font-bold text-lg text-foreground mb-4">Monthly Sadaqah Goal</h2>
        <div className="flex items-end justify-between mb-2">
          <p className="text-3xl font-black text-primary">${given} <span className="text-sm font-medium text-muted-foreground">/ ${goal}</span></p>
          <p className="text-xs font-bold text-muted-foreground">{progress}%</p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground italic">"Charity does not decrease wealth." — Muslim</p>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-sm mb-3">Log New Contribution</h3>
        <div className="flex gap-2 mb-2">
          <Input type="number" placeholder="Amount ($)" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-24" />
          <Input placeholder="Recipient (e.g. Masjid)" value={newRecipient} onChange={e => setNewRecipient(e.target.value)} className="flex-1" />
        </div>
        <Button className="w-full" onClick={handleAdd}>Add Sadaqah</Button>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Contributions</h3>
        {entries.map(e => (
          <div key={e.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-card">
            <div>
              <p className="font-bold text-sm text-foreground">{e.recipient}</p>
              <p className="text-[10px] text-muted-foreground">{e.date} {e.note && `• ${e.note}`}</p>
            </div>
            <p className="font-black text-primary">${e.amount}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function HalalScreener() {
  const [ticker, setTicker] = useState('')
  const [result, setResult] = useState(null)

  const { mutate: screen, isPending } = useMutation({
    mutationFn: () => api.post('/finance/screener', { ticker }).then(r => r.data),
    onSuccess: setResult,
    onError: () => toast.error('Screening failed. Please try again.'),
  })

  return (
    <div className="space-y-5 max-w-xl animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-bold text-lg text-foreground">Halal Investment Screener</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter a stock ticker to check Shariah compliance.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="e.g. AAPL, MSFT" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter' && ticker) screen() }} className="h-11 font-bold uppercase" />
          <Button onClick={() => screen()} disabled={isPending || !ticker} className="h-11 px-8 font-bold">Screen</Button>
        </div>

        {result && (
          <div className={cn("mt-4 p-5 rounded-2xl border animate-in zoom-in-95 duration-200", result.status === 'halal' ? "bg-green-500/10 border-green-500/30" : result.status === 'doubtful' ? "bg-orange-500/10 border-orange-500/30" : "bg-red-500/10 border-red-500/30")}>
            <div className="flex items-center gap-2 mb-2">
              {result.status === 'halal' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className={cn("h-5 w-5", result.status === 'doubtful' ? "text-orange-600" : "text-red-600")} />}
              <div className={cn("font-black text-xl uppercase", result.status === 'halal' ? 'text-green-600' : result.status === 'doubtful' ? 'text-orange-600' : 'text-red-600')}>
                {result.status} <span className="text-muted-foreground font-medium">—</span> {result.ticker}
              </div>
            </div>
            <p className="text-sm text-foreground font-medium leading-relaxed">{result.reason}</p>
          </div>
        )}
      </Card>

      <Card className="p-5 bg-muted/30">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-3"><Info className="h-4 w-4" /> Screening Criteria</h3>
        <ul className="text-[13px] font-medium text-muted-foreground space-y-2">
          <li className="flex gap-2"><span className="text-primary font-bold">•</span> Business activity must not involve alcohol, gambling, tobacco, pork, weapons, or interest.</li>
          <li className="flex gap-2"><span className="text-primary font-bold">•</span> Debt-to-market cap ratio must be below 33%.</li>
          <li className="flex gap-2"><span className="text-primary font-bold">•</span> Interest income must be less than 5% of total revenue.</li>
        </ul>
      </Card>
    </div>
  )
}

function MortgageCalculator() {
  const [form, setForm] = useState({ property_price: '', deposit: '', term_years: '25', conventional_rate: '6.5', islamic_profit_rate: '5.8' })
  const [result, setResult] = useState(null)

  const { mutate: calculate, isPending } = useMutation({
    mutationFn: () => api.post('/finance/mortgage/calculate', { property_price: parseFloat(form.property_price), deposit: parseFloat(form.deposit), term_years: parseInt(form.term_years), conventional_rate: parseFloat(form.conventional_rate), islamic_profit_rate: parseFloat(form.islamic_profit_rate) }).then(r => r.data),
    onSuccess: setResult,
    onError: () => toast.error('Calculation failed.'),
  })

  return (
    <div className="space-y-6 max-w-xl animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-bold text-lg text-foreground">Islamic vs Conventional Mortgage</h2>
          <p className="text-sm text-muted-foreground mt-1">Compare side-by-side costs of both financing approaches.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">Property Price ($)</label><Input type="number" placeholder="450000" value={form.property_price} onChange={e => setForm({ ...form, property_price: e.target.value })} /></div>
          <div><label className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">Deposit ($)</label><Input type="number" placeholder="90000" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} /></div>
          <div><label className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">Term (Years)</label><Input type="number" placeholder="25" value={form.term_years} onChange={e => setForm({ ...form, term_years: e.target.value })} /></div>
          <div />
          <div><label className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">Conventional Rate (%)</label><Input type="number" step="0.1" value={form.conventional_rate} onChange={e => setForm({ ...form, conventional_rate: e.target.value })} /></div>
          <div><label className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">Islamic Rate (%)</label><Input type="number" step="0.1" value={form.islamic_profit_rate} onChange={e => setForm({ ...form, islamic_profit_rate: e.target.value })} /></div>
        </div>
        <Button className="w-full font-bold h-11" onClick={() => calculate()} disabled={isPending || !form.property_price || !form.deposit}>{isPending ? 'Calculating...' : 'Compare Options'}</Button>
      </Card>

      {result && (
        <div className="grid sm:grid-cols-2 gap-4 animate-in zoom-in-95">
          <Card className="p-5 border-2 border-red-500/20 bg-red-500/5 transition-all hover:border-red-500/40">
            <div className="text-[10px] text-red-600 font-black uppercase tracking-widest mb-3">Conventional (Riba)</div>
            <div className="text-3xl font-black text-red-600">${result.conventional.monthly_payment.toLocaleString()}<span className="text-sm font-bold text-red-600/50">/mo</span></div>
            <div className="text-xs font-bold text-muted-foreground mt-3 pt-3 border-t border-red-500/10">Total: ${result.conventional.total_cost.toLocaleString()}</div>
            <Badge variant="secondary" className="mt-3 text-[9px] uppercase bg-red-500/10 text-red-600">{result.conventional.type}</Badge>
          </Card>
          <Card className="p-5 border-2 border-primary/40 bg-primary/5 transition-all hover:border-primary/60 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
            <div className="text-[10px] text-primary font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">Islamic Finance <CheckCircle className="h-3 w-3" /></div>
            <div className="text-3xl font-black text-primary">${result.islamic.monthly_payment.toLocaleString()}<span className="text-sm font-bold text-primary/50">/mo</span></div>
            <div className="text-xs font-bold text-muted-foreground mt-3 pt-3 border-t border-primary/10">Total: ${result.islamic.total_cost.toLocaleString()}</div>
            <Badge variant="secondary" className="mt-3 text-[9px] uppercase bg-primary/20 text-primary">{result.islamic.type}</Badge>
          </Card>
        </div>
      )}

      <Card className="p-5 bg-muted/50 border-dashed border-border/50">
        <p className="text-[11px] uppercase font-bold text-foreground mb-2 flex items-center gap-1.5"><Info className="h-3 w-3" /> Why Islamic Finance?</p>
        <p className="text-sm font-medium text-muted-foreground leading-relaxed">Islamic mortgages use a <em>Diminishing Musharakah</em> structure — you and the bank co-own the property and you gradually buy out the bank's share, avoiding interest (Riba).</p>
      </Card>
    </div>
  )
}

function CharityDirectory() {
  const CAUSES = ['All', 'Education', 'Water', 'Orphan', 'Healthcare', 'Disaster', 'Masjid']
  const [filter, setFilter] = useState('All')

  const charities = [
    { id: 1, name: 'Islamic Relief Worldwide', causes: ['Education', 'Water', 'Disaster', 'Healthcare'], country: 'UK', is_zakat_eligible: true, logo: '🌍' },
    { id: 2, name: 'Penny Appeal', causes: ['Water', 'Orphan', 'Masjid'], country: 'UK', is_zakat_eligible: true, logo: '💧' },
    { id: 3, name: 'Human Appeal', causes: ['Healthcare', 'Education', 'Disaster'], country: 'UK', is_zakat_eligible: true, logo: '❤️' },
    { id: 4, name: 'Zakat Foundation', causes: ['Education', 'Orphan'], country: 'USA', is_zakat_eligible: true, logo: '🏫' },
    { id: 5, name: 'Launchgood', causes: ['Masjid', 'Education'], country: 'USA', is_zakat_eligible: false, logo: '🕌' },
  ]
  const filtered = filter === 'All' ? charities : charities.filter(c => c.causes.includes(filter))

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-wrap gap-2">
        {CAUSES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={cn('px-4 py-1.5 rounded-full text-xs font-bold transition-all border', filter === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted')}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="p-4 flex items-center gap-4 hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-2xl shrink-0 border border-border shadow-sm">{c.logo}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-sm text-foreground">{c.name}</span>
                {c.is_zakat_eligible && <Badge className="text-[9px] uppercase font-black bg-gold text-gold-foreground border-0">Zakat Eligible ✓</Badge>}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{c.country} <span className="opacity-50 mx-1">•</span> {c.causes.join(', ')}</div>
            </div>
            <Button size="sm" variant="outline" className="h-9 shrink-0 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => toast.success(`Opening ${c.name}...`)}>Donate</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function FinancePage() {
  const [tab, setTab] = useState('zakat')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Islamic Finance <DollarSign className="h-6 w-6 text-primary" /></h1>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">Manage your wealth in a Shariah-compliant way.</p>
      </div>

      <div className="flex overflow-x-auto p-1 rounded-xl bg-muted gap-1 scrollbar-none w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 min-w-[110px] px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2', tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === 'zakat' && <ZakatCalculator />}
        {tab === 'screener' && <HalalScreener />}
        {tab === 'mortgage' && <MortgageCalculator />}
        {tab === 'sadaqah' && <SadaqahTracker />}
        {tab === 'charity' && <CharityDirectory />}
      </div>
    </div>
  )
}
