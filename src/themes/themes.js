/**
 * Deen Theme Definitions
 * ======================
 * 12 built-in themes. Each defines a complete CSS variable surface.
 * Variables are injected onto :root by themeStore.js.
 *
 * Variable anatomy:
 *   --t-bg          page/app background
 *   --t-bg-card     card surface
 *   --t-bg-sidebar  sidebar / bottom-nav surface
 *   --t-bg-input    input field background
 *   --t-text        primary text
 *   --t-text-muted  secondary/muted text
 *   --t-text-inverse text on primary-coloured buttons
 *   --t-border      default border
 *   --t-border-strong stronger border / dividers
 *   --t-primary     primary action colour (buttons, links)
 *   --t-primary-hover
 *   --t-accent      gold / highlight accent
 *   --t-accent-hover
 *   --t-nav-bg      bottom-nav background
 *   --t-nav-active  active tab indicator colour
 *   --t-nav-text    inactive tab text
 *   --t-prayer-hero background of the prayer hero card (gradient CSS string)
 *   --t-geometric   SVG pattern fill colour (with opacity in svg)
 *   --t-glow        box-shadow glow for dark themes
 *   --t-font-scale  default 1, overridden by typography prefs
 */

export const THEMES = {
  // ─── 1. Medina Midnight ─────────────────────────────────────────────────────
  'medina-midnight': {
    id: 'medina-midnight',
    name: 'Medina Midnight',
    description: 'Deep dark greens inspired by the city of the Prophet ﷺ',
    isDark: true,
    preview: ['#0a1f14', '#0d6b3d', '#c9870a'],
    vars: {
      '--t-bg':            '#0a1f14',
      '--t-bg-card':       '#0f2e1e',
      '--t-bg-sidebar':    '#071510',
      '--t-bg-input':      '#0d2518',
      '--t-text':          '#e8f5ee',
      '--t-text-muted':    '#6aaf85',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#1a3d28',
      '--t-border-strong': '#2a5a3e',
      '--t-primary':       '#14a860',
      '--t-primary-hover': '#1cc97a',
      '--t-accent':        '#c9870a',
      '--t-accent-hover':  '#e8b832',
      '--t-nav-bg':        '#071510',
      '--t-nav-active':    '#14a860',
      '--t-nav-text':      '#4a8a62',
      '--t-prayer-hero':   'linear-gradient(135deg, #0a3d24 0%, #0d6b3d 50%, #0f5a32 100%)',
      '--t-geometric':     'rgba(20,168,96,0.06)',
      '--t-glow':          '0 0 20px rgba(20,168,96,0.15)',
    },
  },

  // ─── 2. Desert Dawn ──────────────────────────────────────────────────────────
  'desert-dawn': {
    id: 'desert-dawn',
    name: 'Desert Dawn',
    description: 'Warm sand and sunrise — the colour of Fajr in the Arabian desert',
    isDark: false,
    preview: ['#faf0e0', '#c9870a', '#0d6b3d'],
    vars: {
      '--t-bg':            '#faf0e0',
      '--t-bg-card':       '#fff8ed',
      '--t-bg-sidebar':    '#2d1e0e',
      '--t-bg-input':      '#fff8ed',
      '--t-text':          '#1e1206',
      '--t-text-muted':    '#7a5a38',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#e8d4b0',
      '--t-border-strong': '#c8a870',
      '--t-primary':       '#9b6200',
      '--t-primary-hover': '#c9870a',
      '--t-accent':        '#c9870a',
      '--t-accent-hover':  '#e8b832',
      '--t-nav-bg':        '#2d1e0e',
      '--t-nav-active':    '#e8b832',
      '--t-nav-text':      '#8a6840',
      '--t-prayer-hero':   'linear-gradient(135deg, #c9870a 0%, #e8b832 50%, #f5d870 100%)',
      '--t-geometric':     'rgba(201,135,10,0.07)',
      '--t-glow':          '0 0 20px rgba(201,135,10,0.10)',
    },
  },

  // ─── 3. Mecca Marble ─────────────────────────────────────────────────────────
  'mecca-marble': {
    id: 'mecca-marble',
    name: 'Mecca Marble',
    description: 'Pure white marble and gold — the grandeur of Masjid al-Haram',
    isDark: false,
    preview: ['#f8f8f6', '#c9870a', '#1a1a18'],
    vars: {
      '--t-bg':            '#f8f8f6',
      '--t-bg-card':       '#ffffff',
      '--t-bg-sidebar':    '#1a1a18',
      '--t-bg-input':      '#ffffff',
      '--t-text':          '#1a1a18',
      '--t-text-muted':    '#6b6b68',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#e8e8e4',
      '--t-border-strong': '#c8c8c2',
      '--t-primary':       '#1a1a18',
      '--t-primary-hover': '#3a3a36',
      '--t-accent':        '#c9870a',
      '--t-accent-hover':  '#e8b832',
      '--t-nav-bg':        '#1a1a18',
      '--t-nav-active':    '#c9870a',
      '--t-nav-text':      '#8a8a84',
      '--t-prayer-hero':   'linear-gradient(135deg, #1a1a18 0%, #3a3a36 60%, #4a4a44 100%)',
      '--t-geometric':     'rgba(201,135,10,0.05)',
      '--t-glow':          '0 0 20px rgba(201,135,10,0.08)',
    },
  },

  // ─── 4. Ramadan Night ────────────────────────────────────────────────────────
  'ramadan-night': {
    id: 'ramadan-night',
    name: 'Ramadan Night',
    description: 'Deep indigo and crescent gold for the blessed month',
    isDark: true,
    seasonal: 'ramadan',
    preview: ['#0d0a1e', '#6b40c4', '#c9870a'],
    vars: {
      '--t-bg':            '#0d0a1e',
      '--t-bg-card':       '#150f2e',
      '--t-bg-sidebar':    '#08061a',
      '--t-bg-input':      '#100d26',
      '--t-text':          '#e8e0f8',
      '--t-text-muted':    '#8070c0',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#1e1840',
      '--t-border-strong': '#3a2d6e',
      '--t-primary':       '#7b52d4',
      '--t-primary-hover': '#9068e8',
      '--t-accent':        '#c9870a',
      '--t-accent-hover':  '#e8b832',
      '--t-nav-bg':        '#08061a',
      '--t-nav-active':    '#c9870a',
      '--t-nav-text':      '#5040a0',
      '--t-prayer-hero':   'linear-gradient(135deg, #0d0a1e 0%, #1e1248 50%, #2a1a5e 100%)',
      '--t-geometric':     'rgba(107,64,196,0.08)',
      '--t-glow':          '0 0 24px rgba(123,82,212,0.20)',
    },
  },

  // ─── 5. Forest Dua ───────────────────────────────────────────────────────────
  'forest-dua': {
    id: 'forest-dua',
    name: 'Forest Dua',
    description: 'Earthy forest greens — like making dua under the canopy of trees',
    isDark: false,
    preview: ['#f0f7f0', '#2d5a3d', '#8a6c2a'],
    vars: {
      '--t-bg':            '#f0f7f0',
      '--t-bg-card':       '#f8fbf8',
      '--t-bg-sidebar':    '#1a3028',
      '--t-bg-input':      '#f8fbf8',
      '--t-text':          '#1a2e22',
      '--t-text-muted':    '#5a7a60',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#d0e8d4',
      '--t-border-strong': '#a0c8a8',
      '--t-primary':       '#2d5a3d',
      '--t-primary-hover': '#3d7a52',
      '--t-accent':        '#8a6c2a',
      '--t-accent-hover':  '#b08838',
      '--t-nav-bg':        '#1a3028',
      '--t-nav-active':    '#6aaf7a',
      '--t-nav-text':      '#4a6a52',
      '--t-prayer-hero':   'linear-gradient(135deg, #1a3028 0%, #2d5a3d 60%, #3d7a52 100%)',
      '--t-geometric':     'rgba(45,90,61,0.06)',
      '--t-glow':          '0 0 20px rgba(45,90,61,0.10)',
    },
  },

  // ─── 6. Obsidian Crescent ────────────────────────────────────────────────────
  'obsidian-crescent': {
    id: 'obsidian-crescent',
    name: 'Obsidian Crescent',
    description: 'Near-black with silver highlights — minimal and focused',
    isDark: true,
    preview: ['#0a0a0a', '#2a2a2a', '#c0c0b8'],
    vars: {
      '--t-bg':            '#0a0a0a',
      '--t-bg-card':       '#141414',
      '--t-bg-sidebar':    '#050505',
      '--t-bg-input':      '#111111',
      '--t-text':          '#e8e8e2',
      '--t-text-muted':    '#808078',
      '--t-text-inverse':  '#000000',
      '--t-border':        '#242424',
      '--t-border-strong': '#3a3a36',
      '--t-primary':       '#d0d0c8',
      '--t-primary-hover': '#f0f0e8',
      '--t-accent':        '#c9870a',
      '--t-accent-hover':  '#e8b832',
      '--t-nav-bg':        '#050505',
      '--t-nav-active':    '#c9870a',
      '--t-nav-text':      '#505050',
      '--t-prayer-hero':   'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #242424 100%)',
      '--t-geometric':     'rgba(192,192,184,0.04)',
      '--t-glow':          '0 0 20px rgba(201,135,10,0.12)',
    },
  },

  // ─── 7. Rose Garden ──────────────────────────────────────────────────────────
  'rose-garden': {
    id: 'rose-garden',
    name: 'Rose Garden',
    description: 'Soft rose and sage — inspired by the gardens of Jannah',
    isDark: false,
    preview: ['#fdf2f4', '#c46080', '#4a8060'],
    vars: {
      '--t-bg':            '#fdf2f4',
      '--t-bg-card':       '#fff8f9',
      '--t-bg-sidebar':    '#2a1020',
      '--t-bg-input':      '#fff8f9',
      '--t-text':          '#1e0814',
      '--t-text-muted':    '#8a5068',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#f0d4da',
      '--t-border-strong': '#d8a8b4',
      '--t-primary':       '#b04060',
      '--t-primary-hover': '#c45070',
      '--t-accent':        '#c9870a',
      '--t-accent-hover':  '#e8b832',
      '--t-nav-bg':        '#2a1020',
      '--t-nav-active':    '#e87090',
      '--t-nav-text':      '#7a3050',
      '--t-prayer-hero':   'linear-gradient(135deg, #b04060 0%, #c45070 50%, #d06080 100%)',
      '--t-geometric':     'rgba(196,96,128,0.06)',
      '--t-glow':          '0 0 20px rgba(176,64,96,0.10)',
    },
  },

  // ─── 8. Andalus Amber ────────────────────────────────────────────────────────
  'andalus-amber': {
    id: 'andalus-amber',
    name: 'Andalus Amber',
    description: 'Warm amber and deep green — echoes of Moorish Andalusia',
    isDark: false,
    preview: ['#fdf5e8', '#8a5e00', '#1e4a2a'],
    vars: {
      '--t-bg':            '#fdf5e8',
      '--t-bg-card':       '#fff9f0',
      '--t-bg-sidebar':    '#1e2e1a',
      '--t-bg-input':      '#fff9f0',
      '--t-text':          '#1a1200',
      '--t-text-muted':    '#7a5e30',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#ecd8a8',
      '--t-border-strong': '#c8a860',
      '--t-primary':       '#8a5e00',
      '--t-primary-hover': '#b07800',
      '--t-accent':        '#c9870a',
      '--t-accent-hover':  '#e8b832',
      '--t-nav-bg':        '#1e2e1a',
      '--t-nav-active':    '#e8b832',
      '--t-nav-text':      '#6a7a50',
      '--t-prayer-hero':   'linear-gradient(135deg, #6b3d00 0%, #9b6200 50%, #c9870a 100%)',
      '--t-geometric':     'rgba(138,94,0,0.06)',
      '--t-glow':          '0 0 20px rgba(201,135,10,0.10)',
    },
  },

  // ─── 9. Arctic Fajr ──────────────────────────────────────────────────────────
  'arctic-fajr': {
    id: 'arctic-fajr',
    name: 'Arctic Fajr',
    description: 'Ice blue and dawn pink — the colours of Fajr at high latitude',
    isDark: false,
    preview: ['#f0f5ff', '#3860c0', '#e87890'],
    vars: {
      '--t-bg':            '#f0f5ff',
      '--t-bg-card':       '#f8faff',
      '--t-bg-sidebar':    '#0a1840',
      '--t-bg-input':      '#f8faff',
      '--t-text':          '#0a1230',
      '--t-text-muted':    '#5870a8',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#d0dcf8',
      '--t-border-strong': '#a0b4e8',
      '--t-primary':       '#3860c0',
      '--t-primary-hover': '#4878d8',
      '--t-accent':        '#e87890',
      '--t-accent-hover':  '#f090a8',
      '--t-nav-bg':        '#0a1840',
      '--t-nav-active':    '#e87890',
      '--t-nav-text':      '#3050a0',
      '--t-prayer-hero':   'linear-gradient(135deg, #0a1840 0%, #1a3878 50%, #3860c0 100%)',
      '--t-geometric':     'rgba(56,96,192,0.06)',
      '--t-glow':          '0 0 20px rgba(56,96,192,0.12)',
    },
  },

  // ─── 10. Golden Mosque ───────────────────────────────────────────────────────
  'golden-mosque': {
    id: 'golden-mosque',
    name: 'Golden Mosque',
    description: 'Rich ochre and deep walnut — domed mosque at sunset',
    isDark: true,
    preview: ['#1a1000', '#8a6000', '#e8b832'],
    vars: {
      '--t-bg':            '#1a1200',
      '--t-bg-card':       '#241a00',
      '--t-bg-sidebar':    '#100c00',
      '--t-bg-input':      '#1e1600',
      '--t-text':          '#f8f0d0',
      '--t-text-muted':    '#c0a060',
      '--t-text-inverse':  '#1a1200',
      '--t-border':        '#3a2800',
      '--t-border-strong': '#5a4000',
      '--t-primary':       '#e8b832',
      '--t-primary-hover': '#f0cb5a',
      '--t-accent':        '#e8b832',
      '--t-accent-hover':  '#f5d880',
      '--t-nav-bg':        '#100c00',
      '--t-nav-active':    '#e8b832',
      '--t-nav-text':      '#7a6030',
      '--t-prayer-hero':   'linear-gradient(135deg, #1a1200 0%, #3a2400 50%, #5a3c00 100%)',
      '--t-geometric':     'rgba(232,184,50,0.07)',
      '--t-glow':          '0 0 24px rgba(232,184,50,0.18)',
    },
  },

  // ─── 11. Kerala Green ────────────────────────────────────────────────────────
  'kerala-green': {
    id: 'kerala-green',
    name: 'Kerala Green',
    description: 'Vibrant tropical green — for the lush Malabar coast',
    isDark: false,
    preview: ['#edfff4', '#006b3c', '#c9870a'],
    vars: {
      '--t-bg':            '#edfff4',
      '--t-bg-card':       '#f8fffc',
      '--t-bg-sidebar':    '#00291a',
      '--t-bg-input':      '#f8fffc',
      '--t-text':          '#002214',
      '--t-text-muted':    '#3a7a58',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#b8f0d4',
      '--t-border-strong': '#70d4a4',
      '--t-primary':       '#006b3c',
      '--t-primary-hover': '#008a4e',
      '--t-accent':        '#c9870a',
      '--t-accent-hover':  '#e8b832',
      '--t-nav-bg':        '#00291a',
      '--t-nav-active':    '#00e87c',
      '--t-nav-text':      '#00704a',
      '--t-prayer-hero':   'linear-gradient(135deg, #003d22 0%, #006b3c 60%, #008a4e 100%)',
      '--t-geometric':     'rgba(0,107,60,0.07)',
      '--t-glow':          '0 0 20px rgba(0,107,60,0.12)',
    },
  },

  // ─── 12. Maghrib Horizon ─────────────────────────────────────────────────────
  'maghrib-horizon': {
    id: 'maghrib-horizon',
    name: 'Maghrib Horizon',
    description: 'Purple and burnt orange — the sky at the time of breaking fast',
    isDark: true,
    preview: ['#0e0818', '#8040c0', '#e86030'],
    vars: {
      '--t-bg':            '#0e0818',
      '--t-bg-card':       '#180d28',
      '--t-bg-sidebar':    '#080510',
      '--t-bg-input':      '#120a20',
      '--t-text':          '#f0e8f8',
      '--t-text-muted':    '#9070c0',
      '--t-text-inverse':  '#ffffff',
      '--t-border':        '#241040',
      '--t-border-strong': '#3c1a60',
      '--t-primary':       '#9050d0',
      '--t-primary-hover': '#a860e8',
      '--t-accent':        '#e86030',
      '--t-accent-hover':  '#f08050',
      '--t-nav-bg':        '#080510',
      '--t-nav-active':    '#e86030',
      '--t-nav-text':      '#5030a0',
      '--t-prayer-hero':   'linear-gradient(135deg, #0e0818 0%, #2a1050 40%, #5030a0 80%, #e86030 100%)',
      '--t-geometric':     'rgba(128,64,192,0.07)',
      '--t-glow':          '0 0 24px rgba(144,80,208,0.18)',
    },
  },
}

// Ordered list for UI display
export const THEME_LIST = Object.values(THEMES)

// Seasonal themes map (hijri month → theme id, null means user's current or default)
export const SEASONAL_THEMES = {
  ramadan:    'ramadan-night',   // Month 9
  eid_fitr:   'mecca-marble',    // 1 Shawwal (3 days)
  eid_adha:   'golden-mosque',   // 10 Dhul Hijjah (3 days)
  dhul_hijjah: null,             // First 10 days — add gold accent only, don't change theme
}

export const DEFAULT_THEME_ID = 'medina-midnight'
