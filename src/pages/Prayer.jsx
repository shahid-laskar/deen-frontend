import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Clock, MapPin, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { prayerApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, StatCard, Badge, Modal, Skeleton, EmptyState } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const STATUS_OPTIONS = [
  { value: 'on_time', label: 'On time', color: 'bg-emerald-700' },
  { value: 'late', label: 'Late', color: 'bg-gold-600' },
  { value: 'missed', label: 'Missed', color: 'bg-red-500' },
  { value: 'qadha', label: 'Qadha', color: 'bg-blue-600' },
]

function PrayerRow({ name, time, log, onLog }) {
  const statusColors = {
    on_time: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    late: 'border-gold-500 bg-gold-50 dark:bg-gold-900/10',
    missed: 'border-red-400 bg-red-50 dark:bg-red-900/10',
    qadha: 'border-blue-400 bg-blue-50 dark:bg-blue-900/10',
    excused: 'border-parchment-300 bg-parchment-50',
  }

  return (
    <div className={clsx(
      'flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
      log ? statusColors[log.status] : 'border-parchment-200 dark:border-emerald-900/50'
    )}>
      <div className="flex-1">
        <p className="font-semibold capitalize text-emerald-900 dark:text-emerald-100">{name}</p>
        {time && <p className="text-sm text-muted">{time}</p>}
      </div>
      {log ? (
        <div className="flex items-center gap-2">
          <Badge variant={log.status === 'on_time' ? 'green' : log.status === 'missed' ? 'red' : 'gold'}>
            {log.status.replace('_', ' ')}
          </Badge>
          <button
            onClick={() => onLog(name)}
            className="text-muted hover:text-emerald-700 transition-colors p-1"
            title="Change"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => onLog(name)}>
          Log prayer
        </Button>
      )}
    </div>
  )
}

export default function Prayer() {
  const qc = useQueryClient()
  const { user, hasLocation } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [logModal, setLogModal] = useState(null) // prayer name
  const [selectedStatus, setSelectedStatus] = useState('on_time')

  const { data: times, isLoading: timesLoading } = useQuery({
    queryKey: ['prayer', 'times'],
    queryFn: () => prayerApi.getTimes().then((r) => r.data),
    enabled: hasLocation(),
  })

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['prayer', 'today'],
    queryFn: () => prayerApi.getTodaySummary().then((r) => r.data),
  })

  const { data: streak } = useQuery({
    queryKey: ['prayer', 'streak'],
    queryFn: () => prayerApi.getStreak().then((r) => r.data),
  })

  const { mutate: logPrayer, isPending } = useMutation({
    mutationFn: () => prayerApi.log({
      prayer_name: logModal,
      log_date: today,
      status: selectedStatus,
      prayed_at: selectedStatus !== 'missed' ? new Date().toISOString() : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prayer'] })
      toast.success(`${logModal} logged as ${selectedStatus.replace('_', ' ')}`)
      setLogModal(null)
      setSelectedStatus('on_time')
    },
    onError: () => toast.error('Could not log prayer.'),
  })

  const getTime = (name) => times?.[name] ?? null
  const getLog = (name) => summary?.[name] ?? null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Prayer Times</h1>
        <p className="text-muted mt-1">
          {times?.date || format(new Date(), 'EEEE, d MMMM')} • {times?.prayer_method || user?.madhab}
        </p>
      </div>

      {/* Location warning */}
      {!hasLocation() && (
        <Card className="mb-5 border-gold-300 bg-gold-50 dark:bg-gold-900/10">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-gold-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gold-800 dark:text-gold-300">Location not set</p>
              <p className="text-xs text-gold-600 dark:text-gold-500 mt-0.5">
                Go to Settings to enable accurate prayer times for your area.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Hijri date & stats */}
      {times?.hijri_date && (
        <div className="mb-5 px-4 py-3 bg-emerald-950 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
          <span className="font-arabic text-base text-emerald-200">{times.hijri_date}</span>
          <span className="text-emerald-500">Hijri date</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Streak" value={streak?.current_streak ?? '—'} sub="days" icon={Clock} />
        <StatCard label="Today" value={`${summary?.total_on_time ?? 0}/5`} sub="on time" icon={CheckCircle} color="emerald" />
        <StatCard label="This week" value={`${Math.round(streak?.this_week_completion ?? 0)}%`} sub="completion" icon={AlertCircle} color="gold" />
      </div>

      {/* Prayer rows */}
      <Card className="mb-5">
        <div className="space-y-3">
          {timesLoading || sumLoading ? (
            PRAYERS.map((p) => <Skeleton key={p} className="h-16" />)
          ) : (
            PRAYERS.map((name) => (
              <PrayerRow
                key={name}
                name={name}
                time={getTime(name.charAt(0).toUpperCase() + name.slice(1))}
                log={getLog(name)}
                onLog={(n) => { setLogModal(n); setSelectedStatus('on_time') }}
              />
            ))
          )}
        </div>
      </Card>

      {/* Additional prayers */}
      <div className="text-center">
        <p className="text-xs text-muted">
          Jumuah (Friday prayer), Tahajjud, and Duha can also be logged →{' '}
          <button
            onClick={() => setLogModal('jumuah')}
            className="text-emerald-700 hover:underline"
          >
            Log additional prayer
          </button>
        </p>
      </div>

      {/* Log modal */}
      <Modal open={!!logModal} onClose={() => setLogModal(null)} title={`Log ${logModal}`}>
        <div className="space-y-4">
          <p className="text-muted text-sm">How did you pray {logModal}?</p>
          <div className="grid grid-cols-2 gap-3">
            {STATUS_OPTIONS.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setSelectedStatus(value)}
                className={clsx(
                  'py-3 rounded-xl text-sm font-medium border-2 transition-all',
                  selectedStatus === value
                    ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                    : 'border-parchment-200 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500'
                )}
              >
                <span className={clsx('inline-block w-2 h-2 rounded-full mr-2', color)} />
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" onClick={() => setLogModal(null)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => logPrayer()} loading={isPending} className="flex-1">Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
