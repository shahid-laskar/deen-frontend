import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.prayer': 'Prayer',
      'nav.quran': 'Quran & Hifz',
      'nav.habits': 'Habits',
      'nav.journal': 'Journal',
      'nav.tasks': 'Planner',
      'nav.ai': 'AI Guide',
      'nav.female': "Sister's Space",
      'nav.settings': 'Settings',

      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.create': 'Create',
      'common.loading': 'Loading...',

      // Prayer
      'prayer.fajr': 'Fajr',
      'prayer.dhuhr': 'Dhuhr',
      'prayer.asr': 'Asr',
      'prayer.maghrib': 'Maghrib',
      'prayer.isha': 'Isha',
      'prayer.on_time': 'On time',
      'prayer.late': 'Late',
      'prayer.missed': 'Missed',
      'prayer.qadha': 'Qadha',

      // Greetings
      'greet.morning': 'Good morning',
      'greet.afternoon': 'Good afternoon',
      'greet.evening': 'Good evening',
      'greet.night': 'Assalamu Alaikum',
    },
  },
  ar: {
    translation: {
      'nav.dashboard': 'لوحة التحكم',
      'nav.prayer': 'الصلاة',
      'nav.quran': 'القرآن والحفظ',
      'nav.habits': 'العادات',
      'nav.journal': 'المذكرة',
      'nav.tasks': 'المخطط',
      'nav.ai': 'الدليل الذكي',
      'nav.settings': 'الإعدادات',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('deen-language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
