import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { Plus, Flame, Trash2, Check, BarChart2, Library, Layers, Star, Award, ChevronDown, ChevronRight, BookOpen, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Modal, Badge, Skeleton, ProgressRing } from '../components/ui/index'
import { getIslamicContext } from '../lib/hijri'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = ['today', 'library', 'analytics', 'dhikr']
const TAB_LABELS = { today: 'Today', library: 'Library', analytics: 'Analytics', dhikr: 'Dhikr' }

const CAT_ICONS = { ibadah:'🕌', quran:'📖', dhikr:'📿', sunnah:'🌙', health:'💪', learning:'📚', personal:'✅', family:'👨‍👩‍👧', fasting:'🌙', sadaqah:'💚', avoid:'🚫', work:'💼' }
const DIFF_COLOR = { easy:'#22c55e', medium:'#f97316', hard:'#ef4444', epic:'#a855f7' }
const TYPE_BADGE = { binary:'✓', quantity:'#', duration:'⏱', avoid:'✗', checklist:'☑' }

const HABIT_TYPES = ['binary','quantity','duration','avoid','checklist']
const DIFFICULTIES = ['easy','medium','hard','epic']
const CATEGORIES = ['ibadah','quran','dhikr','sunnah','health','learning','personal','family','fasting','sadaqah','avoid']

// ─── 52-week heatmap ────────────────────────────────────────────────────────

function Heatmap52({ data }) {
    const today = new Date()
    const start = subDays(today, 364)
    const weeks = []
    let day = startOfWeek(start, { weekStartsOn: 0 })
    while (day <= today) {
        const end = new Date(Math.min(day.getTime() + 6*86400000, today.getTime()))
        weeks.push(eachDayOfInterval({ start: day, end }))
        day = new Date(day.getTime() + 7*86400000)
    }
    const byDate = {}
    data?.forEach(d => { byDate[d.date] = d })
    const color = cell => {
        if (!cell || !cell.completed) return 'var(--t-border)'
        return 'var(--t-primary)'
    }
    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {week.map((d, di) => {
                            const k = format(d, 'yyyy-MM-dd')
                            return <div key={di} title={k} style={{ width: 10, height: 10, borderRadius: 2, background: color(byDate[k]), cursor: 'default' }} />
                        })}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, color: 'var(--t-text-muted)', fontSize: 11 }}>
                <span>Less</span>
                {[0.15, 0.35, 0.6, 0.85, 1].map((v, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(20,168,96,${v})` }} />)}
                <span>More</span>
            </div>
        </div>
    )
}

// ─── Habit row ───────────────────────────────────────────────────────────────

function HabitRow({ habit, onLog, onDelete }) {
    const [expanded, setExpanded] = useState(false)
    const { data: checklistItems = [] } = useQuery({
        queryKey: ['habits', habit.id, 'checklist'],
        queryFn: () => api.get(`/habits/${habit.id}/checklist`).then(r => r.data).catch(() => []),
        enabled: habit.habit_type === 'checklist',
    })
    const qc = useQueryClient()
    const { mutate: toggleItem } = useMutation({
        mutationFn: (itemId) => api.post(`/habits/${habit.id}/checklist/${itemId}/log`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
    })
    const { mutate: useToken } = useMutation({
        mutationFn: () => api.post(`/habits/${habit.id}/use-token`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); toast.success('Rahmah Token used — streak protected ☪️') },
        onError: (e) => toast.error(e.response?.data?.detail || 'No tokens available'),
    })
    const done = habit.completed_today
    const tokens = habit.rahmah_tokens || 0
    return (
        <div style={{ borderRadius: 12, border: `1px solid ${done ? 'var(--t-primary)' : 'var(--t-border)'}`, background: done ? 'rgba(20,168,96,0.05)' : 'var(--t-bg-card)', marginBottom: 8, overflow: 'hidden', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                {/* Completion button */}
                <button onClick={() => onLog(habit)} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${done ? 'var(--t-primary)' : 'var(--t-border-strong)'}`, background: done ? 'var(--t-primary)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {done && <Check size={16} color="white" />}
                </button>
                {/* Icon + name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{habit.icon || CAT_ICONS[habit.category] || '✅'}</span>
                        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</p>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: DIFF_COLOR[habit.difficulty]+'22', color: DIFF_COLOR[habit.difficulty], fontWeight: 700, flexShrink: 0 }}>{TYPE_BADGE[habit.habit_type]}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        {habit.current_streak > 0 && (
                            <span style={{ fontSize: 11, color: 'var(--t-accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Flame size={11} /> {habit.current_streak}d
                            </span>
                        )}
                        {tokens > 0 && (
                            <span style={{ fontSize: 10, color: '#a855f7' }}>☪️ ×{tokens}</span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{habit.completion_rate_30d}% (30d)</span>
                    </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {habit.habit_type === 'checklist' && (
                        <button onClick={() => setExpanded(e => !e)} style={{ padding: '4px 6px', borderRadius: 8, border: 'none', background: 'var(--t-border)', cursor: 'pointer', color: 'var(--t-text-muted)' }}>
                            <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>
                    )}
                    {!done && tokens > 0 && (
                        <button onClick={() => useToken()} title="Use Rahmah Token" style={{ padding: '4px 6px', borderRadius: 8, border: 'none', background: 'rgba(168,85,247,0.1)', cursor: 'pointer', fontSize: 12 }}>☪️</button>
                    )}
                    <button onClick={() => onDelete(habit.id)} style={{ padding: '4px 6px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
            {/* Checklist items */}
            {expanded && checklistItems.length > 0 && (
                <div style={{ borderTop: '0.5px solid var(--t-border)', padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {checklistItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={() => toggleItem(item.id)} style={{ width: 20, height: 20, borderRadius: 4, border: '1.5px solid var(--t-border-strong)', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
                                <Check size={12} style={{ color: 'var(--t-primary)', opacity: 0.6 }} />
                            </button>
                            <span style={{ fontSize: 13, color: 'var(--t-text)' }}>{item.label}</span>
                            {item.repetition_count > 1 && <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>×{item.repetition_count}</span>}
                            {item.arabic_text && <span style={{ fontFamily: 'Amiri,serif', fontSize: 14, color: 'var(--t-accent)', marginLeft: 'auto', direction: 'rtl' }}>{item.arabic_text}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Today tab ───────────────────────────────────────────────────────────────

function TodayTab() {
    const qc = useQueryClient()
    const [addModal, setAddModal] = useState(false)
    const [form, setForm] = useState({ name:'', category:'ibadah', habit_type:'binary', difficulty:'medium', target_count:1, unit:'', icon:'', implementation_intention:'', islamic_source:'' })
    const [filterCat, setFilterCat] = useState(null)
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data: habits = [], isLoading } = useQuery({ queryKey: ['habits'], queryFn: () => api.get('/habits').then(r => r.data).catch(() => []) })
    const { mutate: createHabit, isPending: creating } = useMutation({
        mutationFn: () => api.post('/habits', { ...form, target_count: Number(form.target_count) || 1 }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); setAddModal(false); setForm({ name:'', category:'ibadah', habit_type:'binary', difficulty:'medium', target_count:1, unit:'', icon:'', implementation_intention:'', islamic_source:'' }); toast.success('Habit created!') },
        onError: () => toast.error('Could not create habit.'),
    })
    const { mutate: logHabit } = useMutation({
        mutationFn: (habit) => api.post('/habits/log', { habit_id: habit.id, log_date: today, count: 1, completed: !habit.completed_today }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }) },
    })
    const { mutate: deleteHabit } = useMutation({
        mutationFn: (id) => api.delete(`/habits/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); toast.success('Habit deleted.') },
    })

    const displayed = filterCat ? habits.filter(h => h.category === filterCat) : habits
    const done   = displayed.filter(h => h.completed_today).length
    const total  = displayed.length
    const cats   = [...new Set(habits.map(h => h.category))]
    const ctx    = getIslamicContext()

    // Milestone celebrations
    const streakMilestones = [7, 30, 66, 100]
    const celebrated = habits.filter(h => h.current_streak && streakMilestones.includes(h.current_streak))

    return (
        <div className="space-y-4">
            {/* Completion header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ProgressRing value={done} max={Math.max(total, 1)} size={68} strokeWidth={6} color="var(--t-primary)">
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-text)' }}>{done}/{total}</span>
                </ProgressRing>
                <div>
                    <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--t-text)' }}>
                        {done === total && total > 0 ? '🎉 All done!' : `${total - done} remaining`}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{ctx.formatted}</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setAddModal(true)} style={{ marginLeft: 'auto' }}>
                    <Plus size={14} /> Add
                </Button>
            </div>

            {/* Streak milestones */}
            {celebrated.map(h => (
                <div key={h.id} style={{ borderRadius: 12, padding: '10px 14px', background: 'linear-gradient(135deg, var(--t-accent), #f0cb5a)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🎯</span>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{h.current_streak}-day streak milestone!</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{h.name}</p>
                    </div>
                    <Award size={24} color="white" style={{ marginLeft: 'auto' }} />
                </div>
            ))}

            {/* Category filter */}
            {cats.length > 1 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                    <button onClick={() => setFilterCat(null)} style={{ padding: '4px 12px', borderRadius: 99, border: '0.5px solid', borderColor: !filterCat ? 'var(--t-primary)' : 'var(--t-border)', background: !filterCat ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', fontSize: 12, color: !filterCat ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>All</button>
                    {cats.map(c => <button key={c} onClick={() => setFilterCat(c === filterCat ? null : c)} style={{ padding: '4px 12px', borderRadius: 99, border: '0.5px solid', borderColor: filterCat===c ? 'var(--t-primary)' : 'var(--t-border)', background: filterCat===c ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', fontSize: 12, color: filterCat===c ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{CAT_ICONS[c]} {c}</button>)}
                </div>
            )}

            {/* Habit list */}
            {isLoading
                ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)
                : displayed.length === 0
                    ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--t-text-muted)' }}>
                        <p style={{ fontSize: 32, marginBottom: 8 }}>📿</p>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--t-text)' }}>No habits yet</p>
                        <p style={{ fontSize: 13 }}>Browse the library or add your own</p>
                    </div>
                    : displayed.map(habit => <HabitRow key={habit.id} habit={habit} onLog={logHabit} onDelete={deleteHabit} />)
            }

            {/* Add habit modal */}
            <Modal open={addModal} onClose={() => setAddModal(false)} title="Add habit">
                <div className="space-y-4">
                    <div><p className="label">Name</p><input className="input" placeholder="What will you do?" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <p className="label">Category</p>
                            <select className="input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="label">Type</p>
                            <select className="input" value={form.habit_type} onChange={e => setForm(f => ({...f, habit_type: e.target.value}))}>
                                {HABIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><p className="label">Difficulty</p>
                            <select className="input" value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))}>
                                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div><p className="label">Target</p><input className="input" type="number" min={0} value={form.target_count} onChange={e => setForm(f => ({...f, target_count: e.target.value}))} /></div>
                    </div>
                    <div><p className="label">Implementation intention (optional)</p><input className="input" placeholder='After ___, I will ___' value={form.implementation_intention} onChange={e => setForm(f => ({...f, implementation_intention: e.target.value}))} /></div>
                    <div><p className="label">Islamic source (optional)</p><input className="input" placeholder='e.g. Bukhari 543' value={form.islamic_source} onChange={e => setForm(f => ({...f, islamic_source: e.target.value}))} /></div>
                    <Button variant="primary" className="w-full" onClick={() => createHabit()} loading={creating}>Create habit</Button>
                </div>
            </Modal>
        </div>
    )
}

// ─── Library tab ─────────────────────────────────────────────────────────────

function LibraryTab() {
    const qc = useQueryClient()
    const [catFilter, setCatFilter]   = useState(null)
    const [diffFilter, setDiffFilter] = useState(null)
    const [expanded, setExpanded]     = useState(null)

    const { data: library = [] } = useQuery({
        queryKey: ['habits', 'library', catFilter, diffFilter],
        queryFn: () => {
            const params = {}
            if (catFilter)  params.category   = catFilter
            if (diffFilter) params.difficulty  = diffFilter
            return api.get('/habits/library', { params }).then(r => r.data).catch(() => [])
        },
    })

    const { mutate: addFromLib, isPending } = useMutation({
        mutationFn: (key) => api.post(`/habits/from-library?key=${key}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); toast.success('Added to your habits!') },
        onError: () => toast.error('Could not add habit.'),
    })

    const cats = [...new Set(library.map(h => h.category))]

    return (
        <div className="space-y-4">
            <div>
                <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--t-text)', marginBottom: 4 }}>Islamic Habit Library</p>
                <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{library.length} habits — all grounded in Quran & Sunnah</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {['easy','medium','hard','epic'].map(d => (
                    <button key={d} onClick={() => setDiffFilter(diffFilter === d ? null : d)}
                        style={{ padding: '4px 10px', borderRadius: 99, border: '0.5px solid', borderColor: diffFilter===d ? DIFF_COLOR[d] : 'var(--t-border)', background: diffFilter===d ? DIFF_COLOR[d]+'22' : 'var(--t-bg-card)', fontSize: 11, color: diffFilter===d ? DIFF_COLOR[d] : 'var(--t-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >{d}</button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                <button onClick={() => setCatFilter(null)} style={{ padding: '4px 10px', borderRadius: 99, border: '0.5px solid', borderColor: !catFilter ? 'var(--t-primary)' : 'var(--t-border)', background: !catFilter ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', fontSize: 11, color: !catFilter ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>All ({library.length})</button>
                {cats.map(c => {
                    const count = library.filter(h => h.category === c).length
                    return <button key={c} onClick={() => setCatFilter(catFilter===c?null:c)} style={{ padding: '4px 10px', borderRadius: 99, border: '0.5px solid', borderColor: catFilter===c?'var(--t-primary)':'var(--t-border)', background: catFilter===c?'rgba(20,168,96,0.1)':'var(--t-bg-card)', fontSize: 11, color: catFilter===c?'var(--t-primary)':'var(--t-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{CAT_ICONS[c]} {c} ({count})</button>
                })}
            </div>

            {/* Library items */}
            <div className="space-y-2">
                {library.map(item => (
                    <div key={item.key} style={{ borderRadius: 12, border: '0.5px solid var(--t-border)', background: 'var(--t-bg-card)', overflow: 'hidden' }}>
                        <button style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => setExpanded(expanded===item.key ? null : item.key)}>
                            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{CAT_ICONS[item.category]}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-text)' }}>{item.name}</p>
                                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: DIFF_COLOR[item.difficulty]+'22', color: DIFF_COLOR[item.difficulty], fontWeight: 700 }}>{item.difficulty}</span>
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{item.category} · {item.estimated_minutes ? `~${item.estimated_minutes}min` : 'anytime'}</p>
                            </div>
                            <ChevronDown size={14} style={{ color: 'var(--t-text-muted)', transform: expanded===item.key?'rotate(180deg)':'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                        </button>
                        {expanded === item.key && (
                            <div style={{ borderTop: '0.5px solid var(--t-border)', padding: '10px 14px 14px' }}>
                                {item.description && <p style={{ fontSize: 13, color: 'var(--t-text)', marginBottom: 8 }}>{item.description}</p>}
                                {item.islamic_source && <p style={{ fontSize: 12, color: 'var(--t-accent)', marginBottom: 4 }}>📜 {item.islamic_source}</p>}
                                {item.minimum_version && <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginBottom: 10, fontStyle: 'italic' }}>💡 Start here: {item.minimum_version}</p>}
                                <Button variant="primary" size="sm" onClick={() => addFromLib(item.key)} loading={isPending}>
                                    <Plus size={13} /> Add this habit
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
    const { data: weekly } = useQuery({ queryKey: ['habits','analytics','weekly'], queryFn: () => api.get('/habits/analytics/weekly').then(r => r.data).catch(() => null) })
    const { data: health } = useQuery({ queryKey: ['habits','analytics','health'], queryFn: () => api.get('/habits/analytics/health').then(r => r.data).catch(() => null) })
    const { data: habitsRaw } = useQuery({ queryKey: ['habits'], queryFn: () => api.get('/habits').then(r => r.data).catch(() => []) })
    const habits = Array.isArray(habitsRaw) ? habitsRaw : []
    const [selectedHabit, setSelectedHabit] = useState(null)
    const { data: habitAnalytics } = useQuery({
        queryKey: ['habits', selectedHabit, 'analytics'],
        queryFn: () => api.get(`/habits/${selectedHabit}/analytics`).then(r => r.data).catch(() => null),
        enabled: !!selectedHabit,
    })

    return (
        <div className="space-y-4">
            {/* Health score */}
            {health && (
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <ProgressRing value={health.score} max={100} size={72} strokeWidth={7} color="var(--t-primary)">
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t-text)' }}>{Math.round(health.score)}</span>
                        </ProgressRing>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--t-text)' }}>Habit Health Score</p>
                            <p style={{ fontSize: 14, color: 'var(--t-primary)', fontWeight: 600 }}>{health.label}</p>
                            <p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>Completion {health.breakdown?.completion_rate}% · {health.breakdown?.category_variety} categories</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Weekly review */}
            {weekly && (
                <Card>
                    <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-text)', marginBottom: 12 }}>This week</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
                        {[['Completed', weekly.total_completed, weekly.total_possible], ['On track', Math.round(weekly.completion_rate)+'%', ''], ['Active', weekly.total_habits, 'habits']].map(([l, v, sub]) => (
                            <div key={l} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'var(--t-bg)', border: '0.5px solid var(--t-border)' }}>
                                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text)' }}>{v}{sub && <span style={{ fontSize: 12, color: 'var(--t-text-muted)', fontWeight: 400 }}>/{sub}</span>}</p>
                                <p style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>{l}</p>
                            </div>
                        ))}
                    </div>
                    {weekly.top_habits?.length > 0 && (
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text)', marginBottom: 4 }}>🏆 Top habits</p>
                            {weekly.top_habits.map(h => <p key={h} style={{ fontSize: 12, color: 'var(--t-text-muted)', padding: '2px 0' }}>• {h}</p>)}
                        </div>
                    )}
                    {weekly.needs_attention?.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#f97316', marginBottom: 4 }}>⚡ Needs attention</p>
                            {weekly.needs_attention.map(h => <p key={h} style={{ fontSize: 12, color: 'var(--t-text-muted)', padding: '2px 0' }}>• {h}</p>)}
                        </div>
                    )}
                </Card>
            )}

            {/* Per-habit heatmap */}
            <Card>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-text)', marginBottom: 10 }}>52-week record</h3>
                <select className="input mb-3" value={selectedHabit || ''} onChange={e => setSelectedHabit(e.target.value || null)}>
                    <option value="">Select a habit…</option>
                    {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                {selectedHabit && habitAnalytics && (
                    <>
                        <Heatmap52 data={habitAnalytics.heatmap} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 12 }}>
                            {[['Current streak', habitAnalytics.current_streak+'d'], ['Best streak', habitAnalytics.best_streak+'d'], ['30-day rate', habitAnalytics.completion_rate_30d+'%'], ['7-day rate', habitAnalytics.completion_rate_7d+'%']].map(([l, v]) => (
                                <div key={l} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--t-bg)', border: '0.5px solid var(--t-border)', textAlign: 'center' }}>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-text)' }}>{v}</p>
                                    <p style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>{l}</p>
                                </div>
                            ))}
                        </div>
                        {/* Day of week breakdown */}
                        <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text)', marginBottom: 6 }}>Best days</p>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
                                    const rate = habitAnalytics.day_of_week_rates?.[i] || 0
                                    return (
                                        <div key={d} style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 3 }}>
                                                <div style={{ width: 14, background: `rgba(20,168,96,${0.15 + rate/100*0.85})`, borderRadius: '3px 3px 0 0', height: `${Math.max(rate, 5)}%` }} />
                                            </div>
                                            <p style={{ fontSize: 9, color: 'var(--t-text-muted)' }}>{d[0]}</p>
                                            <p style={{ fontSize: 9, color: 'var(--t-text)' }}>{rate}%</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}

// ─── Dhikr counter tab ────────────────────────────────────────────────────────

function DhikrTab() {
    const qc = useQueryClient()
    const [activeSession, setActiveSession] = useState(null)
    const [selectedPreset, setSelectedPreset] = useState(null)
    const [customTarget, setCustomTarget] = useState(33)

    const { data: presets = [] } = useQuery({ queryKey: ['dhikr','presets'], queryFn: () => api.get('/dhikr/presets').then(r => r.data).catch(() => []) })
    const { data: sessions = [] } = useQuery({ queryKey: ['dhikr','sessions'], queryFn: () => api.get('/dhikr/sessions').then(r => r.data).catch(() => []) })
    const { data: history = [] } = useQuery({ queryKey: ['dhikr','history'], queryFn: () => api.get('/dhikr/history').then(r => r.data).catch(() => []) })

    const { mutate: startSession } = useMutation({
        mutationFn: (preset) => api.post('/dhikr/sessions', { dhikr_type: preset.type, target_count: customTarget }),
        onSuccess: (data) => { setActiveSession(data.data); qc.invalidateQueries({ queryKey: ['dhikr'] }) },
    })

    const { mutate: increment, isPending: tapping } = useMutation({
        mutationFn: () => api.post(`/dhikr/sessions/${activeSession.id}/increment`, { increment: 1 }),
        onSuccess: (data) => {
            setActiveSession(data.data)
            if (data.data.is_completed) { toast.success('Alhamdulillah! Session complete 🤲'); qc.invalidateQueries({ queryKey: ['dhikr'] }) }
        },
    })

    // Haptic feedback
    const tap = useCallback(() => {
        if (window.navigator?.vibrate) window.navigator.vibrate(8)
        if (activeSession && !activeSession.is_completed) increment()
    }, [activeSession, increment])

    const pct = activeSession ? (activeSession.current_count / activeSession.target_count) * 100 : 0

    if (activeSession && !activeSession.is_completed) {
        const preset = presets.find(p => p.type === activeSession.dhikr_type)
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 24 }}>
                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginBottom: 4 }}>{preset?.label}</p>
                    <p style={{ fontFamily: 'Amiri,serif', fontSize: 32, color: 'var(--t-accent)', direction: 'rtl' }}>{preset?.arabic}</p>
                </div>

                {/* Big tap area */}
                <button
                    onClick={tap}
                    style={{
                        width: 200, height: 200, borderRadius: '50%',
                        background: `conic-gradient(var(--t-primary) ${pct}%, var(--t-border) ${pct}%)`,
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-3)', transition: 'transform 80ms', WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--t-bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 48, fontWeight: 800, color: 'var(--t-text)', lineHeight: 1 }}>{activeSession.current_count}</span>
                        <span style={{ fontSize: 13, color: 'var(--t-text-muted)' }}>of {activeSession.target_count}</span>
                    </div>
                </button>

                <p style={{ fontSize: 13, color: 'var(--t-text-muted)' }}>Tap the circle to count</p>

                <button onClick={() => setActiveSession(null)} style={{ padding: '8px 20px', borderRadius: 10, border: '0.5px solid var(--t-border)', background: 'var(--t-bg-card)', color: 'var(--t-text-muted)', cursor: 'pointer', fontSize: 13 }}>
                    ← Back
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--t-text)', marginBottom: 4 }}>Dhikr Counter</h2>
                <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>Tap to count — Allahumma innaka 'afuwwun</p>
            </div>

            {/* Target presets */}
            <Card>
                <p className="label" style={{ marginBottom: 8 }}>Target count</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[33, 99, 100, 1000].map(n => (
                        <button key={n} onClick={() => setCustomTarget(n)}
                            style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '0.5px solid', borderColor: customTarget===n ? 'var(--t-primary)' : 'var(--t-border)', background: customTarget===n ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', fontSize: 14, fontWeight: 700, color: customTarget===n ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer' }}
                        >{n}</button>
                    ))}
                </div>
                <input type="number" className="input" placeholder="Custom target" value={customTarget} onChange={e => setCustomTarget(Number(e.target.value) || 33)} style={{ marginBottom: 0 }} />
            </Card>

            {/* Dhikr type selection */}
            <div className="space-y-2">
                {presets.map(preset => (
                    <button key={preset.type} onClick={() => startSession(preset)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '0.5px solid var(--t-border)', background: 'var(--t-bg-card)', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)' }}>{preset.label}</p>
                            <p style={{ fontFamily: 'Amiri,serif', fontSize: 16, color: 'var(--t-accent)', direction: 'rtl', textAlign: 'right' }}>{preset.arabic}</p>
                        </div>
                        <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 99, background: 'var(--t-border)', color: 'var(--t-text-muted)' }}>×{customTarget}</span>
                    </button>
                ))}
            </div>

            {/* Today's sessions */}
            {sessions.length > 0 && (
                <Card>
                    <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)', marginBottom: 10 }}>Today's sessions</h3>
                    {sessions.filter(s => s.session_date === format(new Date(), 'yyyy-MM-dd')).map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--t-border)' }}>
                            <span style={{ fontSize: 13, color: 'var(--t-text)', textTransform: 'capitalize' }}>{s.dhikr_type.replace(/_/g,' ')}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-text)' }}>{s.current_count}/{s.target_count}</span>
                                {s.is_completed && <span style={{ fontSize: 11, color: 'var(--t-primary)' }}>✓</span>}
                            </div>
                        </div>
                    ))}
                </Card>
            )}

            {/* History */}
            {history.length > 0 && (
                <Card>
                    <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)', marginBottom: 10 }}>30-day history</h3>
                    {history.map(h => (
                        <div key={h.dhikr_type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                            <span style={{ fontSize: 13, color: 'var(--t-text)', textTransform: 'capitalize' }}>{h.dhikr_type.replace(/_/g,' ')}</span>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t-accent)' }}>{h.total_count.toLocaleString()}</p>
                                <p style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>{h.sessions} sessions</p>
                            </div>
                        </div>
                    ))}
                </Card>
            )}
        </div>
    )
}

// ─── Main Habits page ─────────────────────────────────────────────────────────

import { useLocation } from 'react-router-dom'

export default function Habits() {
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const initialTab = queryParams.get('tab') && TABS.includes(queryParams.get('tab')) ? queryParams.get('tab') : 'today'
    const [tab, setTab] = useState(initialTab)
    
    // Update tab if URL changes
    useEffect(() => {
        const queryTab = new URLSearchParams(location.search).get('tab')
        if (queryTab && TABS.includes(queryTab)) setTab(queryTab)
    }, [location.search])

    const ctx = getIslamicContext()
    return (
        <div className="max-w-2xl mx-auto px-4 py-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display,serif)', fontSize: 24, fontWeight: 700, color: 'var(--t-text)' }}>Habits</h1>
                    <p style={{ fontSize: 13, color: 'var(--t-accent)' }}>{ctx.formatted}</p>
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 12, marginBottom: 16, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab===t ? 'var(--t-primary)' : 'transparent', color: tab===t ? 'white' : 'var(--t-text-muted)', transition: 'all 0.15s' }}>
                        {TAB_LABELS[t]}
                    </button>
                ))}
            </div>

            {tab === 'today'     && <TodayTab />}
            {tab === 'library'   && <LibraryTab />}
            {tab === 'analytics' && <AnalyticsTab />}
            {tab === 'dhikr'     && <DhikrTab />}
        </div>
    )
}
