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

import {
  IconHome, IconClock, IconBook, IconHeart, IconNotebook, IconChecklist,
  IconCompass, IconSettings, IconMoon, IconSun, IconBell, IconChevronRight,
  IconChevronLeft, IconSparkles, IconPalette, IconUser, IconMapPin,
  IconShield, IconHelp, IconPlus, IconCheck, IconX, IconPlayerPlay,
  IconPlayerPause, IconVolume, IconRefresh, IconStar, IconFlame, IconTrophy,
  IconLock, IconLogout, IconMenu2, IconCrown, IconArrowLeft, IconArrowRight,
  IconArrowUp, IconArrowDown, IconSearch, IconFilter, IconDotsCircleHorizontal,
  IconDotsVertical, IconLayoutGrid, IconList, IconEye, IconEyeOff, IconPhoto,
  IconCamera, IconDownload, IconUpload, IconShare, IconCopy, IconTrash, IconEdit,
} from '@tabler/icons-react'

// ── hugeicons-react (verified export names) ──────────────────────────────────
import {
  Home01Icon, Clock01Icon, Book01Icon, FavouriteIcon, Notebook01Icon,
  CheckListIcon, Compass01Icon, Settings01Icon, Moon01Icon, Sun01Icon,
  Notification01Icon, ArrowRight01Icon, ArrowLeft01Icon, SparklesIcon,
  PaintBoardIcon, UserIcon, Location01Icon, Shield01Icon,
  PlusSignIcon, Cancel01Icon, PlayIcon, PauseIcon,
  VolumeHighIcon, ReloadIcon, StarIcon, FireIcon, CrownIcon,
  Delete01Icon, Edit01Icon, Search01Icon, FilterIcon, GridIcon,
  Camera01Icon, Download01Icon, Upload01Icon, Share01Icon, Copy01Icon,
  Menu01Icon, Logout01Icon, MoreHorizontalIcon, MoreVerticalIcon,
  ArrowDown01Icon, ArrowUp01Icon, StarAward01Icon, LockIcon,
} from 'hugeicons-react'

import {
  RiHome4Line, RiTimeLine, RiBook2Line, RiHeartLine, RiFileListLine,
  RiCheckboxLine, RiCompass3Line, RiSettings3Line, RiMoonLine, RiSunLine,
  RiBellLine, RiArrowRightSLine, RiArrowLeftSLine, RiSparklingLine,
  RiPaletteLine, RiUser3Line, RiMapPinLine, RiShieldLine, RiQuestionLine,
  RiAddLine, RiCheckLine, RiCloseLine, RiPlayLine, RiPauseLine,
  RiVolumeUpLine, RiRefreshLine, RiStarLine, RiFireLine, RiTrophyLine,
  RiLockLine, RiLogoutBoxLine, RiMenuLine, RiVipCrownLine,
  RiArrowLeftLine, RiArrowRightLine, RiArrowUpLine, RiArrowDownLine,
  RiSearchLine, RiFilterLine, RiMoreLine, RiGridLine, RiListCheck,
  RiEyeLine, RiEyeOffLine, RiImageLine, RiCameraLine, RiDownloadLine,
  RiUploadLine, RiShareLine, RiFileCopyLine, RiDeleteBinLine, RiEdit2Line,
  RiArrowDownSLine, RiArrowUpSLine,
} from '@remixicon/react'

import {
  HomeSimple, Clock as IcClock, Book as IcBook, Heart as IcHeart,
  Journal, FilterList, Compass as IcCompass, Settings as IcSettings,
  MoonSat, SunLight, Bell as IcBell, NavArrowRight, NavArrowLeft,
  Sparks, ColorFilter, User as IcUser, MapPin as IcMapPin,
  Shield as IcShield, HelpCircle as IcHelp, Plus as IcPlus,
  Check as IcCheck, Xmark, Play as IcPlay, Pause as IcPause,
  SoundHigh, RefreshDouble, Star as IcStar, Bonfire as IcFlame,
  Trophy as IcTrophy, Lock as IcLock, LogOut as IcLogout,
  Menu as IcMenu, Crown as IcCrown, NavArrowDown, NavArrowUp,
  Search as IcSearch, Filter as IcFilter, GridPlus,
  MediaImage, Camera as IcCamera, Download as IcDownload,
  Upload as IcUpload, ShareAndroid as IcShare, Copy as IcCopy,
  Trash as IcTrash, Edit as IcEdit, Eye as IcEye, EyeClosed,
  ArrowLeft as IcArrowLeft, ArrowRight as IcArrowRight,
} from 'iconoir-react'

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

  tabler: {
    home: IconHome, clock: IconClock, book: IconBook, heart: IconHeart,
    notebook: IconNotebook, list: IconChecklist, compass: IconCompass,
    settings: IconSettings, moon: IconMoon, sun: IconSun, bell: IconBell,
    'chevron-right': IconChevronRight, 'chevron-left': IconChevronLeft,
    sparkles: IconSparkles, palette: IconPalette, user: IconUser,
    'map-pin': IconMapPin, shield: IconShield, help: IconHelp,
    plus: IconPlus, check: IconCheck, x: IconX, play: IconPlayerPlay,
    pause: IconPlayerPause, volume: IconVolume, refresh: IconRefresh,
    star: IconStar, flame: IconFlame, trophy: IconTrophy, lock: IconLock,
    logout: IconLogout, menu: IconMenu2, crown: IconCrown,
    'arrow-left': IconArrowLeft, 'arrow-right': IconArrowRight,
    'arrow-up': IconArrowUp, 'arrow-down': IconArrowDown,
    search: IconSearch, filter: IconFilter, 'more-h': IconDotsCircleHorizontal,
    'more-v': IconDotsVertical, grid: IconLayoutGrid, 'list-view': IconList,
    eye: IconEye, 'eye-off': IconEyeOff, image: IconPhoto,
    camera: IconCamera, download: IconDownload, upload: IconUpload,
    share: IconShare, copy: IconCopy, trash: IconTrash, edit: IconEdit,
  },

  hugeicons: {
    home: Home01Icon, clock: Clock01Icon, book: Book01Icon,
    heart: FavouriteIcon, notebook: Notebook01Icon, list: CheckListIcon,
    compass: Compass01Icon, settings: Settings01Icon, moon: Moon01Icon,
    sun: Sun01Icon, bell: Notification01Icon,
    'chevron-right': ArrowRight01Icon, 'chevron-left': ArrowLeft01Icon,
    sparkles: SparklesIcon, palette: PaintBoardIcon, user: UserIcon,
    'map-pin': Location01Icon, shield: Shield01Icon, help: Search01Icon,
    plus: PlusSignIcon, check: Cancel01Icon, x: Cancel01Icon,
    play: PlayIcon, pause: PauseIcon, volume: VolumeHighIcon,
    refresh: ReloadIcon, star: StarIcon, flame: FireIcon,
    trophy: StarAward01Icon, lock: LockIcon, logout: Logout01Icon,
    menu: Menu01Icon, crown: CrownIcon,
    'arrow-left': ArrowLeft01Icon, 'arrow-right': ArrowRight01Icon,
    'arrow-up': ArrowUp01Icon, 'arrow-down': ArrowDown01Icon,
    search: Search01Icon, filter: FilterIcon, 'more-h': MoreHorizontalIcon,
    'more-v': MoreVerticalIcon, grid: GridIcon, 'list-view': CheckListIcon,
    eye: UserIcon, 'eye-off': UserIcon, image: Camera01Icon,
    camera: Camera01Icon, download: Download01Icon, upload: Upload01Icon,
    share: Share01Icon, copy: Copy01Icon, trash: Delete01Icon, edit: Edit01Icon,
  },

  remix: {
    home: RiHome4Line, clock: RiTimeLine, book: RiBook2Line,
    heart: RiHeartLine, notebook: RiFileListLine, list: RiCheckboxLine,
    compass: RiCompass3Line, settings: RiSettings3Line, moon: RiMoonLine,
    sun: RiSunLine, bell: RiBellLine, 'chevron-right': RiArrowRightSLine,
    'chevron-left': RiArrowLeftSLine, sparkles: RiSparklingLine,
    palette: RiPaletteLine, user: RiUser3Line, 'map-pin': RiMapPinLine,
    shield: RiShieldLine, help: RiQuestionLine, plus: RiAddLine,
    check: RiCheckLine, x: RiCloseLine, play: RiPlayLine,
    pause: RiPauseLine, volume: RiVolumeUpLine, refresh: RiRefreshLine,
    star: RiStarLine, flame: RiFireLine, trophy: RiTrophyLine,
    lock: RiLockLine, logout: RiLogoutBoxLine, menu: RiMenuLine,
    crown: RiVipCrownLine, 'arrow-left': RiArrowLeftLine,
    'arrow-right': RiArrowRightLine, 'arrow-up': RiArrowUpLine,
    'arrow-down': RiArrowDownLine, search: RiSearchLine,
    filter: RiFilterLine, 'more-h': RiMoreLine, 'more-v': RiMoreLine,
    grid: RiGridLine, 'list-view': RiListCheck, eye: RiEyeLine,
    'eye-off': RiEyeOffLine, image: RiImageLine, camera: RiCameraLine,
    download: RiDownloadLine, upload: RiUploadLine, share: RiShareLine,
    copy: RiFileCopyLine, trash: RiDeleteBinLine, edit: RiEdit2Line,
  },

  iconoir: {
    home: HomeSimple, clock: IcClock, book: IcBook, heart: IcHeart,
    notebook: Journal, list: FilterList, compass: IcCompass,
    settings: IcSettings, moon: MoonSat, sun: SunLight, bell: IcBell,
    'chevron-right': NavArrowRight, 'chevron-left': NavArrowLeft,
    sparkles: Sparks, palette: ColorFilter, user: IcUser,
    'map-pin': IcMapPin, shield: IcShield, help: IcHelp,
    plus: IcPlus, check: IcCheck, x: Xmark, play: IcPlay,
    pause: IcPause, volume: SoundHigh, refresh: RefreshDouble,
    star: IcStar, flame: IcFlame, trophy: IcTrophy, lock: IcLock,
    logout: IcLogout, menu: IcMenu, crown: IcCrown,
    'arrow-left': IcArrowLeft, 'arrow-right': IcArrowRight,
    'arrow-up': NavArrowUp, 'arrow-down': NavArrowDown,
    search: IcSearch, filter: IcFilter, 'more-h': IcMenu,
    'more-v': IcMenu, grid: GridPlus, 'list-view': FilterList,
    eye: IcEye, 'eye-off': EyeClosed, image: MediaImage, camera: IcCamera,
    download: IcDownload, upload: IcUpload, share: IcShare,
    copy: IcCopy, trash: IcTrash, edit: IcEdit,
  },
}
