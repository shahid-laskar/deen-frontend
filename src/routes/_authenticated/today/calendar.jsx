import React, { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { gregorianToHijri, HIJRI_MONTHS } from '@/lib/hijri'
import { useCalendarStore } from '@/store/calendarStore'

export const Route = createFileRoute('/_authenticated/today/calendar')({
  component: CalendarPage,
})

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_GREGORIAN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function CalendarPage() {
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  
  // New event form state
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('')

  const { events: customEvents, addEvent } = useCalendarStore()

  const handleAddEvent = (e) => {
    e.preventDefault()
    if (!newEventTitle || !newEventDate) return
    addEvent({
      title: newEventTitle,
      date: newEventDate, // YYYY-MM-DD
      type: 'personal',
      color: 'bg-purple-500/20 text-purple-600 border border-purple-500/40'
    })
    setIsAddEventOpen(false)
    setNewEventTitle('')
    setNewEventDate('')
  }

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Generate calendar days
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const paddingDays = firstDayOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const today = new Date()
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
    const todayDate = today.getDate()

    let cells = []
    let allMonthEvents = []

    // Padding
    for (let i = 0; i < paddingDays; i++) {
      cells.push({ isEmpty: true, id: `pad-${i}` })
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day)
      const hijri = gregorianToHijri(dateObj)
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      const dayEvents = []
      
      // Auto-calculate Islamic events
      if (hijri.month === 9) {
        dayEvents.push({ title: 'Ramadan', type: 'holiday', color: 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40' })
      }
      if (hijri.month === 10 && hijri.day >= 1 && hijri.day <= 3) {
        dayEvents.push({ title: 'Eid al-Fitr', type: 'holiday', color: 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40' })
      }
      if (hijri.month === 12 && hijri.day >= 10 && hijri.day <= 13) {
        dayEvents.push({ title: 'Eid al-Adha', type: 'holiday', color: 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40' })
      }
      // Sunnah Fasts (White Days 13, 14, 15) - omit during Ramadan
      if (hijri.month !== 9 && hijri.month !== 12 && (hijri.day === 13 || hijri.day === 14 || hijri.day === 15)) {
        dayEvents.push({ title: 'White Day Fast', type: 'sunnah', color: 'bg-blue-500/20 text-blue-600 border border-blue-500/40' })
      }
      if (hijri.month === 10 && hijri.day > 3 && hijri.day <= 9) { // Simple approximation for 6 days of Shawwal
        dayEvents.push({ title: 'Shawwal Fast', type: 'sunnah', color: 'bg-blue-500/20 text-blue-600 border border-blue-500/40' })
      }

      // Merge custom events
      const personalEvents = customEvents.filter(e => e.date === dateString)
      const combinedEvents = [...dayEvents, ...personalEvents]

      if (combinedEvents.length > 0) {
        allMonthEvents.push({
          date: dateObj,
          hijri,
          events: combinedEvents
        })
      }

      cells.push({
        isEmpty: false,
        id: `day-${day}`,
        day,
        hijri,
        dateObj,
        isToday: isCurrentMonth && day === todayDate,
        events: combinedEvents
      })
    }

    // Fill remaining to complete grid (up to 42 cells for 6 rows)
    const remaining = 42 - cells.length
    for (let i = 0; i < remaining; i++) {
      cells.push({ isEmpty: true, id: `pad-end-${i}` })
    }

    return { cells, allMonthEvents }
  }, [currentDate, customEvents])

  const { cells, allMonthEvents } = calendarData

  // Identify the primary Hijri month(s) this Gregorian month spans
  const firstHijri = cells.find(c => !c.isEmpty)?.hijri
  const lastHijri = [...cells].reverse().find(c => !c.isEmpty)?.hijri
  let hijriTitle = firstHijri ? `${HIJRI_MONTHS[firstHijri.month - 1]} ${firstHijri.year}` : ''
  if (firstHijri && lastHijri && firstHijri.month !== lastHijri.month) {
    hijriTitle = `${HIJRI_MONTHS[firstHijri.month - 1]} / ${HIJRI_MONTHS[lastHijri.month - 1]} ${lastHijri.year}`
  }

  const generateICS = () => {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Deen//EN\n'
    allMonthEvents.forEach(entry => {
      entry.events.forEach(evt => {
        const d = entry.date
        const dtstart = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T000000Z`
        const dtend = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()+1).padStart(2,'0')}T000000Z`
        ics += `BEGIN:VEVENT\nDTSTART:${dtstart}\nDTEND:${dtend}\nSUMMARY:${evt.title}\nEND:VEVENT\n`
      })
    })
    ics += 'END:VCALENDAR'
    
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'deen-calendar.ics'
    link.click()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Dual Calendar <Icon name="calendar" className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Hijri & Gregorian dates perfectly synced.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs font-bold shadow-sm" onClick={generateICS}>
            <Icon name="download" className="h-4 w-4 mr-2" /> Sync (.ics)
          </Button>
          
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs font-bold shadow-sm">
                <Icon name="plus" className="h-4 w-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Personal Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Title</label>
                  <Input 
                    placeholder="e.g. Family Iftar" 
                    value={newEventTitle} 
                    onChange={e => setNewEventTitle(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date (Gregorian)</label>
                  <Input 
                    type="date" 
                    value={newEventDate} 
                    onChange={e => setNewEventDate(e.target.value)} 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full font-bold">Save Event</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-4 sm:p-6 shadow-sm border-border space-y-6 bg-card/60 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors">
              <Icon name="chevron-left" className="h-5 w-5" />
            </button>
            <div className="text-center min-w-[200px]">
              <h2 className="text-xl font-bold text-foreground">
                {MONTHS_GREGORIAN[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">
                {hijriTitle}
              </p>
            </div>
            <button onClick={nextMonth} className="p-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors">
              <Icon name="chevron-right" className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl self-start md:self-auto">
            <button 
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'month' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")} 
              onClick={() => setView('month')}
            >
              Month
            </button>
            <button 
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'agenda' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")} 
              onClick={() => setView('agenda')}
            >
              Agenda
            </button>
          </div>
        </div>

        {view === 'month' ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-border/50">
              {cells.map((cell, idx) => {
                if (cell.isEmpty) {
                  return <div key={cell.id} className="h-24 sm:h-28 border-b border-r border-border/50 bg-muted/5" />
                }
                return (
                  <div key={cell.id} className={cn(
                    "h-24 sm:h-28 border-b border-r border-border/50 p-1.5 sm:p-2 relative group hover:bg-muted/20 transition-colors flex flex-col", 
                    cell.isToday && "bg-primary/5"
                  )}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full shrink-0", 
                        cell.isToday ? "bg-primary text-primary-foreground shadow-glow-primary" : "text-foreground"
                      )}>
                        {cell.hijri.day}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold opacity-70">
                        {cell.day} {cell.day === 1 ? MONTHS_GREGORIAN[currentDate.getMonth()].slice(0,3) : ''}
                      </span>
                    </div>
                    {/* Month Label for 1st of Hijri month */}
                    {cell.hijri.day === 1 && (
                      <div className="text-[8px] font-bold text-primary uppercase tracking-wider mb-1 px-1 truncate">
                        {HIJRI_MONTHS[cell.hijri.month - 1]}
                      </div>
                    )}
                    <div className="space-y-1 overflow-y-auto scrollbar-none flex-1 mt-auto">
                      {cell.events.map((evt, i) => (
                        <div key={i} className={cn("text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] truncate leading-tight", evt.color)}>
                          {evt.title}
                        </div>
                      ))}
                    </div>
                    
                    {/* Daily Summary Overlay trigger - covers the cell */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none" aria-label={`View daily summary for ${cell.day}`} />
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                             Daily Summary <Icon name="sun" className="text-amber-500 w-5 h-5" />
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                           <div className="text-center p-4 bg-muted/30 rounded-xl">
                             <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{DAYS_OF_WEEK[cell.dateObj.getDay()]}, {cell.day} {MONTHS_GREGORIAN[currentDate.getMonth()]}</p>
                             <h3 className="text-2xl font-bold text-foreground">{cell.hijri.day} {HIJRI_MONTHS[cell.hijri.month-1]} {cell.hijri.year}</h3>
                           </div>
                           
                           {cell.events.length > 0 ? (
                             <div className="space-y-2">
                               <p className="text-xs font-bold text-muted-foreground uppercase">Scheduled Events</p>
                               {cell.events.map((evt, i) => (
                                 <div key={i} className={cn("px-3 py-2 text-sm font-bold rounded-lg border", evt.color)}>
                                   {evt.title}
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <p className="text-sm text-muted-foreground text-center italic py-4">No special events today.</p>
                           )}
                           
                           <div className="grid grid-cols-2 gap-3 mt-4">
                              <div className="p-3 rounded-xl border border-border flex flex-col items-center justify-center bg-card">
                                 <Icon name="check-circle" className="text-primary mb-1" size={20} />
                                 <span className="text-lg font-bold">5/5</span>
                                 <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Prayers Logged</span>
                              </div>
                              <div className="p-3 rounded-xl border border-border flex flex-col items-center justify-center bg-card">
                                 <Icon name="book-open" className="text-amber-500 mb-1" size={20} />
                                 <span className="text-lg font-bold">10</span>
                                 <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ayahs Read</span>
                              </div>
                           </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {allMonthEvents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-border border-dashed">
                <Icon name="calendar" size={32} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">No events scheduled for {MONTHS_GREGORIAN[currentDate.getMonth()]}.</p>
              </div>
            ) : (
              allMonthEvents.map((entry, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-surface-1 border border-border hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <span className="text-xl font-bold leading-none">{entry.hijri.day}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">{HIJRI_MONTHS[entry.hijri.month-1].slice(0,3)}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      {DAYS_OF_WEEK[entry.date.getDay()]}, {entry.date.getDate()} {MONTHS_GREGORIAN[entry.date.getMonth()]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.events.map((evt, i) => (
                        <div key={i} className={cn("text-xs font-bold px-2 py-1 rounded-md border", evt.color)}>
                          {evt.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-dashed border-border mt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40"></span><span className="text-xs font-bold text-muted-foreground">Islamic Holiday</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/40"></span><span className="text-xs font-bold text-muted-foreground">Sunnah Fast</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-500/40"></span><span className="text-xs font-bold text-muted-foreground">Personal</span></div>
          </div>
          <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            Umm al-Qura Algorithmic Grid
          </div>
        </div>
      </Card>
    </div>
  )
}
