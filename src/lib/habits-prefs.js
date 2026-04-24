const VIEW_KEY = "habits:viewMode"
const FILTER_KEY = "habits:lastFilter"
const DHIKR_KEY = "dhikr:lastPreset"

export const habitsPrefs = {
  getView: () => {
    if (typeof window === "undefined") return "today"
    return localStorage.getItem(VIEW_KEY) || "today"
  },
  setView: (v) => {
    if (typeof window !== "undefined") localStorage.setItem(VIEW_KEY, v)
  },
  getFilter: () => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem(FILTER_KEY) || ""
  },
  setFilter: (v) => {
    if (typeof window !== "undefined") localStorage.setItem(FILTER_KEY, v)
  },
  getDhikrPreset: () => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem(DHIKR_KEY) || ""
  },
  setDhikrPreset: (v) => {
    if (typeof window !== "undefined") localStorage.setItem(DHIKR_KEY, v)
  },
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
