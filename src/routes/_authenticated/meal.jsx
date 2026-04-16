import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Utensils, Droplets, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select } from '@/components/ui/compat'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressRing } from '@/components/ui/progress-ring'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/meal')({
  component: MealPage,
})

const MEAL_TYPES = ['breakfast', 'suhoor', 'lunch', 'dinner', 'iftar', 'snack']
const MEAL_ICONS = { breakfast: '🌅', suhoor: '🌙', lunch: '☀️', dinner: '🌆', iftar: '🌙', snack: '🍎' }

function NutritionBar({ label, value, goal, bgClass, colorName }) {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-xs font-bold text-foreground">{Math.round(value)}g <span className="text-muted-foreground font-medium">{goal ? `/ ${goal}g` : ''}</span></span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden border border-border/50">
        <div className={cn('h-full rounded-full transition-all', bgClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <Card className="p-3">
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-lg sm:text-xl font-black", color ? `text-${color}` : 'text-foreground')}>{value}</p>
    </Card>
  )
}

function MealPage() {
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
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span>{isRamadan ? 'Ramadan Meal Tracker' : 'Meal Planner'}</span>
            <Utensils className="h-5 w-5 text-gold" />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, d MMMM')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWaterModal(true)} className="h-9 border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
            <Droplets className="h-4 w-4 mr-1.5" /> Water
          </Button>
          <Button variant="default" size="sm" onClick={() => setModal(true)} className="h-9">
            <Plus className="h-4 w-4 mr-1.5" /> Log meal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="col-span-2 md:col-span-1 flex flex-row md:flex-col items-center justify-center gap-4 py-4 px-2">
          <ProgressRing value={calories} max={calorieGoal} size={80} strokeWidth={8}>
            <span className="text-sm font-black text-foreground">{Math.round((calories / calorieGoal) * 100)}%</span>
          </ProgressRing>
          <div className="text-left md:text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Calories</p>
            <p className="text-xl font-black text-foreground">{Math.round(calories)}</p>
            <p className="text-[10px] font-medium text-muted-foreground">/ {calorieGoal} kcal</p>
          </div>
        </Card>
        <StatCard label="Protein" value={`${Math.round(summary?.protein_g || 0)}g`} />
        <StatCard label="Carbs" value={`${Math.round(summary?.carbs_g || 0)}g`} color="gold" />
        <Card className="p-4 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" /> Water</p>
            <p className="text-xl font-black text-blue-500">{waterMlLogged}</p>
            <p className="text-[10px] font-medium text-muted-foreground">/ {waterGoal} ml</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-blue-500/10 transition-all duration-1000 ease-out" style={{ height: `${Math.min(100, (waterMlLogged / waterGoal) * 100)}%` }} />
        </Card>
      </div>

      {activePlan && (
        <Card className="space-y-4">
          <NutritionBar label="Protein" value={summary?.protein_g || 0} goal={activePlan.daily_protein_goal_g} bgClass="bg-primary" colorName="primary" />
          <NutritionBar label="Carbs" value={summary?.carbs_g || 0} goal={activePlan.daily_carb_goal_g} bgClass="bg-gold" colorName="gold" />
          <NutritionBar label="Fat" value={summary?.fat_g || 0} goal={activePlan.daily_fat_goal_g} bgClass="bg-red-400" colorName="red-400" />
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-2xl bg-muted/30">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <Utensils className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No meals logged today</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {isRamadan ? "Log your Suhoor and Iftar to track your Ramadan nutrition." : "Log your first meal to start tracking."}
          </p>
          <Button onClick={() => setModal(true)}>Log your first meal</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {MEAL_TYPES.filter(t => grouped[t]).map(mealType => (
            <div key={mealType} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-lg">{MEAL_ICONS[mealType]}</span>
                <h3 className="font-bold text-sm text-foreground capitalize flex-1">{mealType}</h3>
                <Badge variant="secondary" className="font-bold text-[10px] uppercase">
                  {Math.round(grouped[mealType].reduce((s, e) => s + (e.calories || 0), 0))} kcal
                </Badge>
              </div>
              <div className="space-y-2">
                {grouped[mealType].map(entry => (
                  <div key={entry.id} className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{entry.food_name}</span>
                        {entry.is_water_entry && <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-0 flex items-center gap-1 text-[10px]"><Droplets className="h-2 w-2" />{entry.water_ml}ml</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-medium">
                        {entry.calories && <span>{Math.round(entry.calories)} kcal</span>}
                        {entry.protein_g && <span>· P: {Math.round(entry.protein_g)}g</span>}
                        {entry.carbs_g && <span>· C: {Math.round(entry.carbs_g)}g</span>}
                        {entry.fat_g && <span>· F: {Math.round(entry.fat_g)}g</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Meal Dialog */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log a meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Date</label>
                <Input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Meal type</label>
                <Select value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value })} options={MEAL_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Food name <span className="text-destructive">*</span></label>
              <Input placeholder="e.g. Rice and lentils" value={form.food_name} onChange={e => setForm({ ...form, food_name: e.target.value })} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Calories (kcal)</label>
                <Input type="number" placeholder="0" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Servings</label>
                <Input type="number" step="0.5" min="0" value={form.servings} onChange={e => setForm({ ...form, servings: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Protein (g)</label>
                <Input type="number" placeholder="0" value={form.protein_g} onChange={e => setForm({ ...form, protein_g: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Carbs (g)</label>
                <Input type="number" placeholder="0" value={form.carbs_g} onChange={e => setForm({ ...form, carbs_g: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Fat (g)</label>
                <Input type="number" placeholder="0" value={form.fat_g} onChange={e => setForm({ ...form, fat_g: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => logMeal()} disabled={isPending || !form.food_name.trim()}>
              {isPending ? 'Logging...' : 'Log meal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Water Dialog */}
      <Dialog open={waterModal} onOpenChange={setWaterModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-blue-500" /> Log Water</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-foreground font-medium">How much water did you drink?</p>
            <div className="grid grid-cols-2 gap-3">
              {[150, 250, 350, 500].map(ml => (
                <button key={ml} onClick={() => setWaterMl(ml)}
                  className={cn('py-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2',
                    waterMl === ml ? 'bg-blue-500/10 border-blue-500 text-blue-600' : 'bg-card border-border text-foreground hover:border-blue-500/30'
                  )}>
                  <Droplets className={cn("h-4 w-4", waterMl === ml ? "text-blue-500" : "text-muted-foreground")} />
                  {ml} ml
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1 mt-4">Custom amount (ml)</label>
              <Input type="number" value={waterMl} onChange={e => setWaterMl(parseInt(e.target.value))} className="h-12 text-lg font-bold" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => logWater()} className="bg-blue-600 hover:bg-blue-700 text-white border-0">
              Log {waterMl}ml
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
