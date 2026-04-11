import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Utensils, Droplets, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, Skeleton, ProgressRing, StatCard } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const MEAL_TYPES = ['breakfast', 'suhoor', 'lunch', 'dinner', 'iftar', 'snack']
const MEAL_ICONS = { breakfast: '🌅', suhoor: '🌙', lunch: '☀️', dinner: '🌆', iftar: '🌙', snack: '🍎' }

function NutritionBar({ label, value, goal, color }) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-emerald-800 dark:text-emerald-300">{Math.round(value)}g {goal ? `/ ${goal}g` : ''}</span>
      </div>
      <div className="h-1.5 bg-parchment-200 dark:bg-emerald-900/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Meal() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [waterModal, setWaterModal] = useState(false)
  const [form, setForm] = useState({ entry_date: format(new Date(), 'yyyy-MM-dd'), meal_type: 'breakfast', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', servings: 1 })
  const [waterMl, setWaterMl] = useState(250)

  const { data: summary } = useQuery({ queryKey: ['meal', 'summary'], queryFn: () => api.get('/meal/summary/today').then(r => r.data) })
  const { data: entries, isLoading } = useQuery({ queryKey: ['meal', 'log', 'today'], queryFn: () => api.get('/meal/log', { params: { entry_date: format(new Date(), 'yyyy-MM-dd') } }).then(r => r.data) })
  const { data: activePlan } = useQuery({ queryKey: ['meal', 'active-plan'], queryFn: () => api.get('/meal/plans/active').then(r => r.data).catch(() => null) })

  const { mutate: logMeal, isPending } = useMutation({
    mutationFn: () => api.post('/meal/log', { ...form, calories: form.calories ? parseFloat(form.calories) : null, protein_g: form.protein_g ? parseFloat(form.protein_g) : null, carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : null, fat_g: form.fat_g ? parseFloat(form.fat_g) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meal'] }); setModal(false); toast.success('Meal logged!') },
  })

  const { mutate: logWater } = useMutation({
    mutationFn: () => api.post('/meal/log', { entry_date: format(new Date(), 'yyyy-MM-dd'), meal_type: 'snack', food_name: 'Water', is_water_entry: true, water_ml: waterMl }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meal'] }); setWaterModal(false); toast.success(`${waterMl}ml water logged!`) },
  })

  const { mutate: deleteEntry } = useMutation({
    mutationFn: (id) => api.delete(`/meal/log/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal'] }),
  })

  const calorieGoal = activePlan?.daily_calorie_goal || 2000
  const waterGoal = activePlan?.daily_water_goal_ml || 2000
  const calories = summary?.calories || 0
  const waterMlLogged = summary?.water_ml || 0
  const isRamadan = activePlan?.is_ramadan_mode

  const grouped = {}
  entries?.forEach(e => {
    if (!grouped[e.meal_type]) grouped[e.meal_type] = []
    grouped[e.meal_type].push(e)
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Utensils size={26} className="text-gold-600" /> {isRamadan ? 'Ramadan Meal Tracker' : 'Meal Planner'}
          </h1>
          <p className="text-muted mt-1">{format(new Date(), 'EEEE, d MMMM')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWaterModal(true)}><Droplets size={14} /> Water</Button>
          <Button variant="primary" size="sm" onClick={() => setModal(true)}><Plus size={14} /> Log meal</Button>
        </div>
      </div>

      {/* Calorie ring + stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="col-span-2 md:col-span-1 flex items-center gap-4 p-4">
          <ProgressRing value={calories} max={calorieGoal} size={70} strokeWidth={6}>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{Math.round((calories / calorieGoal) * 100)}%</span>
          </ProgressRing>
          <div>
            <p className="text-xs text-muted">Calories</p>
            <p className="font-display text-xl font-bold text-emerald-900 dark:text-emerald-100">{Math.round(calories)}</p>
            <p className="text-xs text-muted">/ {calorieGoal} kcal</p>
          </div>
        </Card>
        <StatCard label="Protein" value={`${Math.round(summary?.protein_g || 0)}g`} icon={null} />
        <StatCard label="Carbs" value={`${Math.round(summary?.carbs_g || 0)}g`} icon={null} color="gold" />
        <Card className="p-4">
          <p className="text-xs text-muted mb-1">Water</p>
          <div className="flex items-end gap-1">
            <span className="font-display text-xl font-bold text-blue-600">{waterMlLogged}</span>
            <span className="text-xs text-muted mb-0.5">/ {waterGoal}ml</span>
          </div>
          <div className="h-1.5 bg-parchment-200 dark:bg-emerald-900/40 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (waterMlLogged / waterGoal) * 100)}%` }} />
          </div>
        </Card>
      </div>

      {/* Macro bars */}
      {activePlan && (
        <Card className="mb-5 space-y-3">
          <NutritionBar label="Protein" value={summary?.protein_g || 0} goal={activePlan.daily_protein_goal_g} color="bg-emerald-600" />
          <NutritionBar label="Carbs" value={summary?.carbs_g || 0} goal={activePlan.daily_carb_goal_g} color="bg-gold-500" />
          <NutritionBar label="Fat" value={summary?.fat_g || 0} goal={activePlan.daily_fat_goal_g} color="bg-red-400" />
        </Card>
      )}

      {/* Entries by meal type */}
      {isLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        : Object.keys(grouped).length === 0 ? (
          <EmptyState icon={Utensils} title="No meals logged today"
            description={isRamadan ? "Log your Suhoor and Iftar to track your Ramadan nutrition." : "Log your first meal to start tracking."}
            action={<Button variant="primary" onClick={() => setModal(true)}>Log your first meal</Button>} />
        ) : (
          <div className="space-y-4">
            {MEAL_TYPES.filter(t => grouped[t]).map(mealType => (
              <div key={mealType}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{MEAL_ICONS[mealType]}</span>
                  <h3 className="font-medium text-emerald-900 dark:text-emerald-200 capitalize text-sm">{mealType}</h3>
                  <span className="text-xs text-muted">{Math.round(grouped[mealType].reduce((s, e) => s + (e.calories || 0), 0))} kcal</span>
                </div>
                <div className="space-y-1.5">
                  {grouped[mealType].map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-parchment-200 dark:border-emerald-900/30 bg-white dark:bg-emerald-950/30">
                      <div className="flex-1">
                        <span className="text-sm text-emerald-800 dark:text-emerald-300">{entry.food_name}</span>
                        {entry.is_water_entry && <span className="text-xs text-blue-500 ml-2">💧 {entry.water_ml}ml</span>}
                      </div>
                      {entry.calories && <span className="text-xs text-muted">{Math.round(entry.calories)} kcal</span>}
                      <button onClick={() => deleteEntry(entry.id)} className="text-parchment-400 hover:text-red-500 p-1">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={modal} onClose={() => setModal(false)} title="Log a meal">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} />
            <Select label="Meal type" value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value })}>
              {MEAL_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </Select>
          </div>
          <Input label="Food name" placeholder="e.g. Rice and lentils" value={form.food_name} onChange={e => setForm({ ...form, food_name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Calories (kcal)" type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} />
            <Input label="Servings" type="number" step="0.5" value={form.servings} onChange={e => setForm({ ...form, servings: parseFloat(e.target.value) })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Protein (g)" type="number" value={form.protein_g} onChange={e => setForm({ ...form, protein_g: e.target.value })} />
            <Input label="Carbs (g)" type="number" value={form.carbs_g} onChange={e => setForm({ ...form, carbs_g: e.target.value })} />
            <Input label="Fat (g)" type="number" value={form.fat_g} onChange={e => setForm({ ...form, fat_g: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => logMeal()} loading={isPending} className="flex-1">Log meal</Button>
          </div>
        </div>
      </Modal>

      <Modal open={waterModal} onClose={() => setWaterModal(false)} title="Log water intake">
        <div className="space-y-4">
          <p className="text-muted text-sm">How much water did you drink?</p>
          <div className="grid grid-cols-4 gap-2">
            {[150, 250, 350, 500].map(ml => (
              <button key={ml} onClick={() => setWaterMl(ml)}
                className={clsx('py-3 rounded-xl text-sm font-medium border transition-all',
                  waterMl === ml ? 'bg-blue-600 text-white border-blue-600' : 'border-parchment-300 dark:border-emerald-800 text-parchment-600'
                )}>{ml}ml</button>
            ))}
          </div>
          <Input label="Custom amount (ml)" type="number" value={waterMl} onChange={e => setWaterMl(parseInt(e.target.value))} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setWaterModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => logWater()} className="flex-1">Log {waterMl}ml 💧</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
