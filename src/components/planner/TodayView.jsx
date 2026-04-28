import React, { useState, useEffect, useCallback } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Moon, Sparkles, Plus, X } from 'lucide-react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter, useDroppable,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { tasksApi, aiApi } from '@/lib/api'
import { SortableTaskCard } from '@/components/planner/SortableTaskCard'
import { TaskCard } from '@/components/planner/TaskCard'
import { QuickAddBar } from '@/components/planner/QuickAddBar'
import { CapacityBar } from '@/components/planner/CapacityBar'
import { gregorianToHijri, formatHijri } from '@/lib/hijri'
import { BLOCK_META, currentBlock, minutesUntilNextPrayer } from '@/lib/planner/prayer-blocks'
import { getDayNiyyah, isBannerDismissed, dismissBanner } from '@/lib/planner/prefs'
import { isRamadan, ramadanNight, isLaylatulQadrPossible } from '@/lib/planner/ramadan'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().slice(0, 10)
const IS_FRIDAY = new Date().getDay() === 5

// ── Hero Ribbon ─────────────────────────────────────────────────────────────
function HeroRibbon({ todayTasks, prayerTimes, onOpenFajr }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-28 rounded-3xl bg-muted/40 animate-pulse" />

  const hijri  = gregorianToHijri(new Date())
  const niyyah = getDayNiyyah(TODAY)
  const done   = todayTasks.filter(t => t.completed).length
  const total  = todayTasks.length
  const night  = ramadanNight()

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-5 md:p-6">
      <div className="absolute top-3 right-4 text-6xl opacity-5 font-amiri">بسم الله</div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <p className="font-amiri text-lg text-amber-600 dark:text-amber-400">{formatHijri(hijri)}</p>
          {night && <p className="font-amiri text-sm text-amber-500">Night {night} of Ramadan</p>}
          {niyyah ? (
            <button onClick={onOpenFajr} className="font-amiri text-base text-foreground/90 italic mt-1 text-left hover:text-primary transition-colors">
              "{niyyah}"
            </button>
          ) : (
            <button onClick={onOpenFajr} className="text-xs text-primary/70 hover:text-primary mt-1 underline underline-offset-2 transition-colors">
              Set today's intention →
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{done}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Done</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Planned</p>
          </div>
        </div>
      </div>
      {prayerTimes && (
        <div className="mt-4">
          <CapacityBar prayerTimes={prayerTimes} todayTasks={todayTasks} />
        </div>
      )}
    </div>
  )
}

// ── Oracle button ────────────────────────────────────────────────────────────
function OracleButton({ todayTasks, prayerTimes }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    setLoading(true)
    const remaining = todayTasks.filter(t => !t.completed)
    const block = prayerTimes ? currentBlock(prayerTimes) : 'morning'
    const mins  = prayerTimes ? minutesUntilNextPrayer(prayerTimes) : 60
    const now   = format(new Date(), 'HH:mm')
    const prompt = `Given these remaining tasks and the current prayer block, which single task should I work on right now? Reply with the task title and a one-sentence reason under 20 words.\n\nCurrent time: ${now}\nBlock: ${block.replace(/_/g,' ')}\nMinutes until next prayer: ${mins}\nTasks: ${JSON.stringify(remaining.map(t => ({ title: t.title, priority: t.priority, estimated_minutes: t.estimated_minutes })))}`
    try {
      const res = await aiApi.chat({ prompt })
      setResult(res.data?.response || res.data?.message || 'Focus on your highest-priority task.')
      setTimeout(() => setResult(null), 30000)
    } catch {
      toast.error('Oracle unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-30 flex flex-col items-end gap-2">
      {result && (
        <div className="max-w-xs rounded-2xl bg-card border border-primary/30 shadow-elevated p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Oracle</p>
            <button onClick={() => setResult(null)}><X className="h-3 w-3 text-muted-foreground" /></button>
          </div>
          <p className="text-sm text-foreground">{result}</p>
        </div>
      )}
      <button
        onClick={ask} disabled={loading} title="What should I work on?"
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading
          ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Sparkles className="h-5 w-5" />}
      </button>
    </div>
  )
}

// ── DroppableDayBlock ─────────────────────────────────────────────────────────
function DroppableDayBlock({ meta, tasks, prayerTimes, prayerSummary, onComplete, onEdit, onDelete, onDefer, allTasks, onCreateSub, isInRamadan }) {
  const { setNodeRef, isOver } = useDroppable({ id: meta.key, data: { type: 'block', blockKey: meta.key } })
  const [adding, setAdding] = useState(false)

  const prayerTime = prayerTimes?.[meta.prayerName] ?? null
  const prayedKey  = meta.prayerName?.toLowerCase()
  const prayed     = prayerSummary?.[prayedKey]
  const blockTasks = tasks.filter(t => t.time_block === meta.key && !t.parent_task_id)
  const totalMin   = blockTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)
  const isBawarah  = meta.isBawarahWindow
  const isIshaRam  = meta.key === 'after_isha' && isInRamadan

  return (
    <div className={cn(
      'rounded-2xl border transition-all',
      isBawarah ? 'border-amber-400/40 bg-amber-50/30 dark:bg-amber-900/10' : 'border-border/50 bg-card/50',
      isOver && 'ring-2 ring-primary/40 border-primary/40 bg-primary/5',
    )}>
      {/* Header */}
      <div className={cn('flex items-center gap-3 px-4 py-3 rounded-t-2xl', isBawarah && 'border-l-4 border-amber-400')}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {meta.prayerName && <span className="font-amiri text-base text-foreground/90">{meta.prayerName}</span>}
            <span className="text-sm font-semibold">{meta.label}</span>
            {prayerTime && <span className="text-xs text-muted-foreground font-mono">{prayerTime}</span>}
            {meta.prayerName && prayed !== undefined && (
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                prayed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                       : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400')}>
                {prayed ? '✓ Prayed' : '✗ Missed'}
              </span>
            )}
            {isBawarah && <span className="font-amiri text-[11px] text-amber-600 dark:text-amber-400">✦ Barakah Window</span>}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{meta.taskTypeHint}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] text-muted-foreground">
          {totalMin > 0 && <span>{totalMin}m</span>}
          <span className="text-muted-foreground/40">{blockTasks.length}</span>
        </div>
      </div>

      {/* Task drop area */}
      <div ref={setNodeRef} className="px-4 pb-3 space-y-2 min-h-[48px]">
        {isIshaRam && (
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
            <Moon className="h-3.5 w-3.5" /> Taraweeh — ibadah · 60m (Ramadan)
          </div>
        )}

        {blockTasks.length === 0 && !isIshaRam ? (
          <div className={cn(
            'py-4 border-2 border-dashed rounded-xl text-center transition-colors',
            isOver ? 'border-primary/50 bg-primary/5' : 'border-border/30',
          )}>
            <p className="text-xs text-muted-foreground/50 italic">
              {isOver ? 'Drop here →' : <>Drag tasks here or press <kbd className="font-mono bg-muted px-1 rounded">n</kbd></>}
            </p>
          </div>
        ) : (
          <SortableContext items={blockTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {blockTasks.map(task => (
              <SortableTaskCard
                key={task.id}
                task={task}
                allTasks={allTasks}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onDefer={onDefer}
                onCreateSub={onCreateSub}
                showBlock={false}
              />
            ))}
          </SortableContext>
        )}

        <button
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-primary transition-colors mt-1"
        >
          <Plus className="h-3 w-3" /> Add to {meta.label}
        </button>
        {adding && (
          <QuickAddBar defaultTimeBlock={meta.key} defaultDueDate={TODAY} onCreated={() => setAdding(false)} />
        )}
      </div>
    </div>
  )
}

// ── TodayView (DndContext root) ───────────────────────────────────────────────
export function TodayView({ todayTasks, allTasks, prayerTimes, prayerSummary, onComplete, onEdit, onDelete, onDefer, onCreateSub, onOpenFajr, onOpenIsha }) {
  const qc = useQueryClient()
  const ramadan = isRamadan()
  const unscheduled = todayTasks.filter(t => !t.time_block && !t.parent_task_id)

  const jumuahDismissed = isBannerDismissed(`jumuah-${TODAY}`)
  const [jumuahVisible, setJumuahVisible] = useState(IS_FRIDAY && !jumuahDismissed)
  const laylaDismissed = isBannerDismissed(`layla-${TODAY}`)
  const [laylaVisible, setLaylaVisible] = useState(ramadan && isLaylatulQadrPossible() && !laylaDismissed)

  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const { mutate: moveTask } = useMutation({
    mutationFn: ({ id, patch }) => tasksApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prev = qc.getQueryData(['tasks', 'today'])
      qc.setQueryData(['tasks', 'today'], old =>
        (old || []).map(t => t.id === id ? { ...t, ...patch } : t)
      )
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(['tasks', 'today'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleDragStart = useCallback(({ active }) => {
    const task = todayTasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }, [todayTasks])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveTask(null)
    if (!over) return

    const activeTaskObj = todayTasks.find(t => t.id === active.id)
    if (!activeTaskObj) return

    const overData = over.data?.current
    const overIsBlock = overData?.type === 'block'
    const overIsTask  = overData?.type === 'task'

    if (overIsBlock) {
      const newBlock = overData.blockKey
      if (newBlock !== activeTaskObj.time_block) {
        moveTask({ id: activeTaskObj.id, patch: { time_block: newBlock, due_date: activeTaskObj.due_date || TODAY } })
      }
      return
    }

    if (overIsTask) {
      const overTask = todayTasks.find(t => t.id === over.id)
      if (!overTask) return
      const newBlock = overTask.time_block || null

      if (newBlock !== activeTaskObj.time_block) {
        // Cross-container: update time_block
        moveTask({ id: activeTaskObj.id, patch: { time_block: newBlock, due_date: activeTaskObj.due_date || TODAY } })
      }
      // Same-container reorder: sort_order updates would go here (skip — server handles ordering by created_at)
    }
  }, [todayTasks, moveTask])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5">
        <HeroRibbon todayTasks={todayTasks} prayerTimes={prayerTimes} onOpenFajr={onOpenFajr} />

        {/* Ritual launchers */}
        <div className="flex items-center gap-2">
          <button onClick={onOpenFajr} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors">
            🌅 Morning planning
          </button>
          <button onClick={onOpenIsha} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-colors">
            🌙 Evening muhasaba
          </button>
        </div>

        {/* Jumu'ah banner */}
        {jumuahVisible && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
            <div>
              <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">Jumu'ah today — الجمعة 🕌</p>
              <p className="text-xs text-emerald-600/80 mt-0.5">Don't forget to read Surah Al-Kahf today</p>
            </div>
            <button onClick={() => { setJumuahVisible(false); dismissBanner(`jumuah-${TODAY}`) }}><X className="h-4 w-4 text-emerald-600" /></button>
          </div>
        )}

        {/* Laylat al-Qadr banner */}
        {laylaVisible && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
            <div>
              <p className="font-semibold text-sm text-amber-700 dark:text-amber-300">✨ Laylat al-Qadr possible tonight</p>
              <p className="text-xs text-amber-600/80 mt-0.5 font-amiri">خَيْرٌ مِّنْ أَلْفِ شَهْرٍ</p>
            </div>
            <button onClick={() => { setLaylaVisible(false); dismissBanner(`layla-${TODAY}`) }}><X className="h-4 w-4 text-amber-600" /></button>
          </div>
        )}

        {/* Global quick-add */}
        <QuickAddBar defaultDueDate={TODAY} />

        {/* Unscheduled */}
        {unscheduled.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card/50">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">Unscheduled</span>
              <span className="text-[11px] text-muted-foreground/50">{unscheduled.length}</span>
            </div>
            <div className="px-4 pb-3 space-y-2">
              <SortableContext items={unscheduled.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {unscheduled.map(task => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    allTasks={allTasks}
                    onComplete={onComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDefer={onDefer}
                    onCreateSub={onCreateSub}
                    showBlock={false}
                  />
                ))}
              </SortableContext>
            </div>
          </div>
        )}

        {/* Prayer-anchored day board */}
        <div className="space-y-4">
          {BLOCK_META.map(meta => (
            <DroppableDayBlock
              key={meta.key}
              meta={meta}
              tasks={todayTasks}
              allTasks={allTasks}
              prayerTimes={prayerTimes}
              prayerSummary={prayerSummary}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onDefer={onDefer}
              onCreateSub={onCreateSub}
              isInRamadan={ramadan}
            />
          ))}
        </div>

        {/* Oracle */}
        <OracleButton todayTasks={todayTasks} prayerTimes={prayerTimes} />
      </div>

      {/* Drag overlay — ghost card while dragging */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask && (
          <div className="opacity-90 rotate-1 scale-105">
            <TaskCard
              task={activeTask}
              allTasks={allTasks}
              onComplete={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onDefer={() => {}}
              isDragging
              showBlock={false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
