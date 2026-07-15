/**
 * icon-map.jsx — Canonical icon abstraction (30 icons × 8 packs)
 * All import names are verified against actual package exports.
 */
import React from 'react'

import {
  LayoutDashboard, Clock, BookOpen, Heart, NotebookPen, CheckSquare, Compass,
  Settings, Moon, Sun, Bell, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Sparkles, Palette, User, MapPin, Shield, HelpCircle, Plus, Check, X,
  Play, Pause, Volume2, RefreshCw, Star, Flame, Trophy, Lock, LogOut, Menu, Crown,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Search, Filter,
  MoreHorizontal, MoreVertical, Grid2x2, List, Eye, EyeOff,
  Image, Camera, Download, Upload, Share, Copy, Trash, Edit,
  Calendar, Activity, Utensils, Banknote,
} from 'lucide-react'

import {
  House, Clock as PhClock, Book, Heart as PhHeart, Notebook,
  ListChecks, Compass as PhCompass, Gear, Moon as PhMoon, Sun as PhSun,
  Bell as PhBell, CaretRight, CaretLeft, Sparkle, Palette as PhPalette,
  User as PhUser, MapPin as PhMapPin, Shield as PhShield, Question,
  Plus as PhPlus, Check as PhCheck, X as PhX, Play as PhPlay,
  Pause as PhPause, SpeakerHigh, ArrowClockwise, Star as PhStar,
  Fire, Trophy as PhTrophy, Lock as PhLock, SignOut, List as PhList,
  Crown as PhCrown, MagnifyingGlass, Funnel, DotsThreeOutline,
  DotsThreeVertical, SquaresFour, Eye as PhEye, EyeSlash,
  Image as PhImage, Camera as PhCamera, DownloadSimple, UploadSimple,
  ShareFat, Copy as PhCopy, Trash as PhTrash, PencilSimple,
  ArrowLeft as PhArrowLeft, ArrowRight as PhArrowRight,
  ArrowUp as PhArrowUp, ArrowDown as PhArrowDown,
} from '@phosphor-icons/react'


// ─── Phosphor Duotone wrappers ───────────────────────────────────────────────
const pd = (Cmp) => (props) => <Cmp weight="duotone" {...props} />

// ─── Lucide "filled chip" wrappers ──────────────────────────────────────────
const lf = (Cmp) => (props) => (
  <span className="inline-flex items-center justify-center rounded-md bg-primary/10 p-0.5">
    <Cmp {...props} />
  </span>
)

// ─── Canonical map ───────────────────────────────────────────────────────────
const lucideBase = {
  home: LayoutDashboard, clock: Clock, book: BookOpen, heart: Heart,
  notebook: NotebookPen, list: CheckSquare, compass: Compass,
  settings: Settings, moon: Moon, sun: Sun, bell: Bell,
  'chevron-right': ChevronRight, 'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown, 'chevron-up': ChevronUp,
  sparkles: Sparkles, palette: Palette, user: User, 'map-pin': MapPin,
  shield: Shield, help: HelpCircle, plus: Plus, check: Check, x: X,
  play: Play, pause: Pause, volume: Volume2, refresh: RefreshCw,
  star: Star, flame: Flame, trophy: Trophy, lock: Lock,
  logout: LogOut, menu: Menu, crown: Crown,
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
  'arrow-up': ArrowUp, 'arrow-down': ArrowDown,
  search: Search, filter: Filter, 'more-h': MoreHorizontal,
  'more-v': MoreVertical, grid: Grid2x2, 'list-view': List,
  eye: Eye, 'eye-off': EyeOff, image: Image, camera: Camera,
  download: Download, upload: Upload, share: Share, copy: Copy,
  trash: Trash, edit: Edit,
  calendar: Calendar, activity: Activity, utensils: Utensils, bank: Banknote,
}

export const ICON_MAP = {
  lucide: lucideBase,

  'lucide-filled': Object.fromEntries(
    Object.entries(lucideBase).map(([k, v]) => [k, lf(v)])
  ),

  phosphor: {
    home: House, clock: PhClock, book: Book, heart: PhHeart,
    notebook: Notebook, list: ListChecks, compass: PhCompass,
    settings: Gear, moon: PhMoon, sun: PhSun, bell: PhBell,
    'chevron-right': CaretRight, 'chevron-left': CaretLeft,
    sparkles: Sparkle, palette: PhPalette, user: PhUser,
    'map-pin': PhMapPin, shield: PhShield, help: Question,
    plus: PhPlus, check: PhCheck, x: PhX, play: PhPlay,
    pause: PhPause, volume: SpeakerHigh, refresh: ArrowClockwise,
    star: PhStar, flame: Fire, trophy: PhTrophy, lock: PhLock,
    logout: SignOut, menu: PhList, crown: PhCrown,
    'arrow-left': PhArrowLeft, 'arrow-right': PhArrowRight,
    'arrow-up': PhArrowUp, 'arrow-down': PhArrowDown,
    search: MagnifyingGlass, filter: Funnel,
    'more-h': DotsThreeOutline, 'more-v': DotsThreeVertical,
    grid: SquaresFour, 'list-view': PhList,
    eye: PhEye, 'eye-off': EyeSlash, image: PhImage,
    camera: PhCamera, download: DownloadSimple, upload: UploadSimple,
    share: ShareFat, copy: PhCopy, trash: PhTrash, edit: PencilSimple,
  },

  'phosphor-duotone': {
    home: pd(House), clock: pd(PhClock), book: pd(Book),
    heart: pd(PhHeart), notebook: pd(Notebook), list: pd(ListChecks),
    compass: pd(PhCompass), settings: pd(Gear), moon: pd(PhMoon),
    sun: pd(PhSun), bell: pd(PhBell), 'chevron-right': pd(CaretRight),
    'chevron-left': pd(CaretLeft), sparkles: pd(Sparkle),
    palette: pd(PhPalette), user: pd(PhUser), 'map-pin': pd(PhMapPin),
    shield: pd(PhShield), help: pd(Question), plus: pd(PhPlus),
    check: pd(PhCheck), x: pd(PhX), play: pd(PhPlay),
    pause: pd(PhPause), volume: pd(SpeakerHigh), refresh: pd(ArrowClockwise),
    star: pd(PhStar), flame: pd(Fire), trophy: pd(PhTrophy),
    lock: pd(PhLock), logout: pd(SignOut), menu: pd(PhList),
    crown: pd(PhCrown), 'arrow-left': pd(PhArrowLeft),
    'arrow-right': pd(PhArrowRight), 'arrow-up': pd(PhArrowUp),
    'arrow-down': pd(PhArrowDown), search: pd(MagnifyingGlass),
    filter: pd(Funnel), 'more-h': pd(DotsThreeOutline),
    'more-v': pd(DotsThreeVertical), grid: pd(SquaresFour),
    'list-view': pd(PhList), eye: pd(PhEye), 'eye-off': pd(EyeSlash),
    image: pd(PhImage), camera: pd(PhCamera), download: pd(DownloadSimple),
    upload: pd(UploadSimple), share: pd(ShareFat), copy: pd(PhCopy),
    trash: pd(PhTrash), edit: pd(PencilSimple),
  },


}
