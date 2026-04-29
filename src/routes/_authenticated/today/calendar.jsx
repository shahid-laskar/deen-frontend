import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Download, Filter } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/today/calendar')({
  component: CalendarPage,
})

const MONTHS_HIJRI = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarPage() {
  const [view, setView] = useState('month')
  const [method, setMethod] = useState('Umm al-Qura')
  const [currentDate, setCurrentDate] = useState(new Date())

  const hijriYear = 1447
  const hijriMonth = 9 // Shawwal
  const daysInMonth = 30
  
  const events = [
    { day: 1, title: 'Eid al-Fitr', type: 'holiday', color: 'bg-emerald-500/20 text-emerald-600' },
    { day: 13, title: 'White Day Fast', type: 'sunnah', color: 'bg-blue-500/20 text-blue-600' },
    { day: 14, title: 'White Day Fast', type: 'sunnah', color: 'bg-blue-500/20 text-blue-600' },
    { day: 15, title: 'White Day Fast', type: 'sunnah', color: 'bg-blue-500/20 text-blue-600' },
  ]

  const generateDays = () => {
    let cells = []
    const startDayOfWeek = 2 // Let's say Tuesday
    
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="h-20 sm:h-24 border-b border-r border-border/50 bg-muted/10 p-1"></div>)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(e => e.day === day)
      const isToday = day === 14 // Mock today
      cells.push(
        <div key={`day-${day}`} className={cn("h-20 sm:h-24 border-b border-r border-border/50 p-1 sm:p-2 relative group hover:bg-muted/30 transition-colors", isToday && "bg-primary/5")}>
          <div className="flex justify-between items-start">
            <span className={cn("text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday ? "bg-primary text-primary-foreground" : "text-foreground")}>{day}</span>
            <span className="text-[10px] text-muted-foreground font-medium">{day + 10}</span>
          </div>
          <div className="mt-1 space-y-1">
            {dayEvents.map((evt, i) => (
              <div key={i} className={cn("text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm truncate", evt.color)}>
                {evt.title}
              </div>
            ))}
          </div>
        </div>
      )
    }
    
    // Fill remainder
    const remaining = 35 - cells.length
    for (let i = 0; i < remaining; i++) {
      cells.push(<div key={`empty-end-${i}`} className="h-20 sm:h-24 border-b border-r border-border/50 bg-muted/10 p-1"></div>)
    }
    
    return cells
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Hijri Calendar <CalendarIcon className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Plan your days with the Islamic calendar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs" onClick={() => alert('Downloaded ICS subscription URL')}><Download className="h-4 w-4 mr-2" /> Sync (.ics)</Button>
          <Button className="text-xs"><Plus className="h-4 w-4 mr-2" /> Add Event</Button>
        </div>
      </div>

      <Card className="p-4 sm:p-6 shadow-sm border-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button className="p-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors"><ChevronLeft className="h-5 w-5" /></button>
            <div className="text-center min-w-[150px]">
              <h2 className="text-xl font-bold text-foreground">{MONTHS_HIJRI[hijriMonth]} {hijriYear}</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">April - May 2026</p>
            </div>
            <button className="p-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl">
            <button className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'month' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")} onClick={() => setView('month')}>Month</button>
            <button className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'agenda' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")} onClick={() => setView('agenda')}>Agenda</button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l border-t border-border/50">
            {generateDays()}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-dashed border-border">
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40"></span><span className="text-xs font-medium">Holiday</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/40"></span><span className="text-xs font-medium">Sunnah Fast</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-500/40"></span><span className="text-xs font-medium">Personal</span></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Calculation:</span>
            <select value={method} onChange={e => setMethod(e.target.value)} className="bg-transparent text-xs font-medium focus:outline-none border-b border-primary/30 pb-0.5">
              <option>Umm al-Qura</option>
              <option>Global (Sighting)</option>
              <option>Regional</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  )
}
