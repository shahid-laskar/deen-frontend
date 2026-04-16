import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  DollarSign, Calculator, TrendingUp, Home as HomeIcon,
  Heart, ChevronRight, Info, AlertCircle, CheckCircle,
  RefreshCw, Building
} from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Input, Badge, Skeleton } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'


const TABS = [
  { id: 'zakat', label: 'Zakat', icon: Calculator },
  { id: 'screener', label: 'Halal Screener', icon: TrendingUp },
  { id: 'mortgage', label: 'Mortgage', icon: HomeIcon },
  { id: 'charity', label: 'Charity', icon: Heart },
]

/* ─── Zakat Calculator ─────────────────────────────────────────── */
function ZakatCalculator() {
  const STEPS = ['standard', 'assets', 'liabilities', 'result']
  const [step, setStep] = useState(0)
  const [nisab, setNisab] = useState('gold')
  const [assets, setAssets] = useState({
    cash: '',
    gold_grams: '',
    silver_grams: '',
    stocks: '',
    crypto: '',
    business_inventory: '',
    receivables: '',
  })
  const [liabilities, setLiabilities] = useState({
    loans: '',
    rent_due: '',
    other: '',
  })
  const [result, setResult] = useState(null)

  const { mutate: calculate, isPending } = useMutation({
    mutationFn: () =>
      api.post('/finance/zakat/calculate', {
        nisab_standard: nisab,
        assets: Object.fromEntries(
          Object.entries(assets).filter(([, v]) => v).map(([k, v]) => [k, parseFloat(v)])
        ),
        liabilities: Object.fromEntries(
          Object.entries(liabilities).filter(([, v]) => v).map(([k, v]) => [k, parseFloat(v)])
        ),
      }).then(r => r.data),
    onSuccess: (data) => {
      setResult(data)
      setStep(3)
    },
    onError: () => toast.error('Calculation failed. Please try again.'),
  })

  const assetLabels = {
    cash: 'Cash & Bank Savings (USD)',
    gold_grams: 'Gold (grams)',
    silver_grams: 'Silver (grams)',
    stocks: 'Stocks & Investments (USD)',
    crypto: 'Crypto Holdings (USD)',
    business_inventory: 'Business Inventory (USD)',
    receivables: 'Money Owed to You (USD)',
  }

  const liabilityLabels = {
    loans: 'Loans & Debts (USD)',
    rent_due: 'Rent Due (USD)',
    other: 'Other Liabilities (USD)',
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              i === step ? 'bg-emerald-600 text-white' : i < step ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-parchment-200 dark:bg-emerald-900/30 text-parchment-400'
            )}>{i + 1}</div>
            {i < STEPS.length - 1 && <div className={clsx('flex-1 h-0.5', i < step ? 'bg-emerald-400' : 'bg-parchment-200 dark:bg-emerald-900/30')} />}
          </React.Fragment>
        ))}
      </div>

      
        <div>
          {step === 0 && (
            <Card className="p-6 space-y-5">
              <div>
                <h2 className="font-display font-semibold text-lg text-emerald-900 dark:text-emerald-200">Choose Nisab Standard</h2>
                <p className="text-sm text-muted mt-1">The nisab is the minimum amount of wealth before Zakat becomes obligatory.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'gold', label: 'Gold Standard', desc: '85g of gold (approx. $5,000)', note: 'Most common standard' },
                  { id: 'silver', label: 'Silver Standard', desc: '595g of silver (approx. $500)', note: 'More inclusive, stricter' },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setNisab(opt.id)}
                    className={clsx('p-4 rounded-2xl border-2 text-left transition-all', nisab === opt.id ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'border-parchment-200 dark:border-emerald-900/40')}>
                    <div className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">{opt.label}</div>
                    <div className="text-xs text-muted mt-1">{opt.desc}</div>
                    <Badge variant="green" className="mt-2 text-xs">{opt.note}</Badge>
                  </button>
                ))}
              </div>
              <Button variant="primary" className="w-full" onClick={() => setStep(1)}>
                Next: Enter Assets <ChevronRight size={16} />
              </Button>
            </Card>
          )}

          {step === 1 && (
            <Card className="p-6 space-y-4">
              <h2 className="font-display font-semibold text-lg text-emerald-900 dark:text-emerald-200">Enter Your Assets (USD equivalent)</h2>
              {Object.entries(assets).map(([key, val]) => (
                <Input key={key} label={assetLabels[key]} type="number" min="0" placeholder="0.00"
                  value={val} onChange={e => setAssets({ ...assets, [key]: e.target.value })} />
              ))}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(0)}>Back</Button>
                <Button variant="primary" className="flex-1" onClick={() => setStep(2)}>Next: Liabilities</Button>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="p-6 space-y-4">
              <h2 className="font-display font-semibold text-lg text-emerald-900 dark:text-emerald-200">Enter Your Liabilities</h2>
              <p className="text-sm text-muted">Debts due within the next lunar year may be deducted.</p>
              {Object.entries(liabilities).map(([key, val]) => (
                <Input key={key} label={liabilityLabels[key]} type="number" min="0" placeholder="0.00"
                  value={val} onChange={e => setLiabilities({ ...liabilities, [key]: e.target.value })} />
              ))}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" className="flex-1" onClick={() => calculate()} loading={isPending}>
                  Calculate Zakat
                </Button>
              </div>
            </Card>
          )}

          {step === 3 && result && (
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white">
                <div className="text-sm text-emerald-300 mb-1">Your Zakat Due</div>
                <div className="text-4xl font-display font-bold">${result.zakat_due.toFixed(2)}</div>
                <div className="text-emerald-300 text-sm mt-1">Net Zakatable Assets: ${result.net_zakatable_assets.toFixed(2)}</div>
              </Card>
              <Card className="p-5 space-y-3 text-sm">
                <p className="text-emerald-900 dark:text-emerald-200">
                  ✅ Zakat rate of <strong>2.5%</strong> applied to your net zakatable assets above the nisab.
                </p>
                <p className="text-muted">May Allah accept your Zakat and multiply your provision. آمين</p>
              </Card>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => { setStep(0); setResult(null) }}>
                  <RefreshCw size={15} /> Recalculate
                </Button>
                <Button variant="primary" className="flex-1"
                  onClick={() => toast.success('Charity directory opened!')}>
                  Pay Zakat <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </div>
      
    </div>
  )
}

/* ─── Halal Stock Screener ─────────────────────────────────────── */
function HalalScreener() {
  const [ticker, setTicker] = useState('')
  const [result, setResult] = useState(null)

  const { mutate: screen, isPending } = useMutation({
    mutationFn: () => api.post('/finance/screener', { ticker }).then(r => r.data),
    onSuccess: setResult,
    onError: () => toast.error('Screening failed. Please try again.'),
  })

  const statusConfig = {
    halal: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: CheckCircle, label: '✅ Halal' },
    doubtful: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: AlertCircle, label: '⚠️ Doubtful' },
    'non-halal': { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: AlertCircle, label: '❌ Non-Halal' },
  }

  return (
    <div className="space-y-5 max-w-xl">
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-lg text-emerald-900 dark:text-emerald-200">Halal Investment Screener</h2>
          <p className="text-sm text-muted mt-1">Enter a stock ticker to check Shariah compliance.</p>
        </div>
        <div className="flex gap-3">
          <Input placeholder="e.g. AAPL, MSFT, JPM" value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter' && ticker) screen() }}
            className="flex-1" />
          <Button variant="primary" onClick={() => screen()} loading={isPending} disabled={!ticker}>
            Screen
          </Button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={clsx('rounded-2xl p-4', statusConfig[result.status]?.bg)}>
            <div className={clsx('font-display font-bold text-xl mb-1', statusConfig[result.status]?.color)}>
              {statusConfig[result.status]?.label} — {result.ticker}
            </div>
            <p className="text-sm text-emerald-800 dark:text-emerald-300">{result.reason}</p>
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <Info size={15} /> Screening Criteria
        </h3>
        <ul className="text-sm text-muted space-y-1">
          <li>✦ Business activity must not involve alcohol, gambling, tobacco, pork, weapons, or interest.</li>
          <li>✦ Debt-to-market cap ratio must be below 33%.</li>
          <li>✦ Interest income must be less than 5% of total revenue.</li>
        </ul>
      </Card>
    </div>
  )
}

/* ─── Mortgage Calculator ──────────────────────────────────────── */
function MortgageCalculator() {
  const [form, setForm] = useState({ property_price: '', deposit: '', term_years: '25', conventional_rate: '6.5', islamic_profit_rate: '5.8' })
  const [result, setResult] = useState(null)

  const { mutate: calculate, isPending } = useMutation({
    mutationFn: () =>
      api.post('/finance/mortgage/calculate', {
        property_price: parseFloat(form.property_price),
        deposit: parseFloat(form.deposit),
        term_years: parseInt(form.term_years),
        conventional_rate: parseFloat(form.conventional_rate),
        islamic_profit_rate: parseFloat(form.islamic_profit_rate),
      }).then(r => r.data),
    onSuccess: setResult,
    onError: () => toast.error('Calculation failed.'),
  })

  return (
    <div className="space-y-5 max-w-2xl">
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-lg text-emerald-900 dark:text-emerald-200">Islamic vs. Conventional Mortgage</h2>
          <p className="text-sm text-muted mt-1">Compare side-by-side costs of both financing approaches.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Property Price (USD)" type="number" placeholder="450000" value={form.property_price}
            onChange={e => setForm({ ...form, property_price: e.target.value })} />
          <Input label="Deposit (USD)" type="number" placeholder="90000" value={form.deposit}
            onChange={e => setForm({ ...form, deposit: e.target.value })} />
          <Input label="Term (Years)" type="number" placeholder="25" value={form.term_years}
            onChange={e => setForm({ ...form, term_years: e.target.value })} />
          <div /> {/* spacer */}
          <Input label="Conventional Interest Rate (%)" type="number" step="0.1" value={form.conventional_rate}
            onChange={e => setForm({ ...form, conventional_rate: e.target.value })} />
          <Input label="Islamic Profit Rate (%)" type="number" step="0.1" value={form.islamic_profit_rate}
            onChange={e => setForm({ ...form, islamic_profit_rate: e.target.value })} />
        </div>
        <Button variant="primary" className="w-full" onClick={() => calculate()} loading={isPending}
          disabled={!form.property_price || !form.deposit}>
          Compare Financing Options
        </Button>
      </Card>

      {result && (
        <div>
          <Card className="p-5 border-2 border-red-200 dark:border-red-900/30">
            <div className="text-xs text-red-500 font-semibold uppercase tracking-wide mb-3">Conventional (Riba)</div>
            <div className="text-2xl font-display font-bold text-red-600">${result.conventional.monthly_payment.toLocaleString()}<span className="text-sm text-muted">/mo</span></div>
            <div className="text-sm text-muted mt-1">Total: ${result.conventional.total_cost.toLocaleString()}</div>
            <Badge variant="red" className="mt-3 text-xs">{result.conventional.type}</Badge>
          </Card>
          <Card className="p-5 border-2 border-emerald-400 dark:border-emerald-600">
            <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-3">Islamic Finance ✓</div>
            <div className="text-2xl font-display font-bold text-emerald-600">${result.islamic.monthly_payment.toLocaleString()}<span className="text-sm text-muted">/mo</span></div>
            <div className="text-sm text-muted mt-1">Total: ${result.islamic.total_cost.toLocaleString()}</div>
            <Badge variant="green" className="mt-3 text-xs">{result.islamic.type}</Badge>
          </Card>
        </div>
      )}

      <Card className="p-5 text-sm text-muted space-y-2">
        <p className="font-semibold text-emerald-900 dark:text-emerald-200">Why Islamic Finance?</p>
        <p>Islamic mortgages use a <em>Diminishing Musharakah</em> structure — you and the bank co-own the property and you gradually buy out the bank's share, avoiding interest (Riba).</p>
      </Card>
    </div>
  )
}

/* ─── Charity Directory ────────────────────────────────────────── */
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
    <div className="space-y-5 max-w-2xl">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {CAUSES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={clsx('px-4 py-1.5 rounded-full text-sm font-medium transition-all', filter === c ? 'bg-emerald-700 text-white' : 'bg-parchment-100 dark:bg-emerald-900/30 text-parchment-600 dark:text-emerald-400 hover:bg-parchment-200')}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="p-5 flex items-center gap-4">
            <div className="text-3xl">{c.logo}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">{c.name}</span>
                {c.is_zakat_eligible && <Badge variant="gold" className="text-xs">Zakat Eligible ✓</Badge>}
              </div>
              <div className="text-xs text-muted mt-0.5">{c.country} · {c.causes.join(', ')}</div>
            </div>
            <Button variant="primary" size="sm" onClick={() => toast.success(`Opening ${c.name}...`)}>
              Donate
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-5 text-sm">
        <div className="flex gap-3 items-start">
          <Building size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">Donation Types Supported</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['Zakat ul-Fitr', 'Zakat ul-Maal', 'Sadaqah', 'Lillah', 'Fidya', 'Kaffarah'].map(t => (
                <Badge key={t} variant="green" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ─── Main Finance Page ────────────────────────────────────────── */
export default function Finance() {
  const [tab, setTab] = useState('zakat')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <DollarSign size={26} className="text-emerald-600" /> Islamic Finance
        </h1>
        <p className="text-muted mt-1">Zakat, halal investing, Islamic mortgages & charity — all Shariah-compliant</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/20 rounded-2xl mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center',
              tab === t.id
                ? 'bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-sm'
                : 'text-parchment-500 hover:text-emerald-700')}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      
        <div>
          {tab === 'zakat' && <ZakatCalculator />}
          {tab === 'screener' && <HalalScreener />}
          {tab === 'mortgage' && <MortgageCalculator />}
          {tab === 'charity' && <CharityDirectory />}
        </div>
      
    </div>
  )
}
