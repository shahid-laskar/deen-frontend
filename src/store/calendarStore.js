import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCalendarStore = create(
  persist(
    (set, get) => ({
      events: [],
      addEvent: (event) => set((state) => ({
        events: [...state.events, { id: crypto.randomUUID(), ...event }]
      })),
      removeEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),
      getEventsForDate: (dateString) => {
        // dateString should be YYYY-MM-DD
        return get().events.filter(e => e.date === dateString)
      }
    }),
    {
      name: 'deen-calendar-events',
    }
  )
)
