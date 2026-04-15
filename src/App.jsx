import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'

// ─── Skeleton loader for route suspense ───────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-parchment-200 dark:bg-emerald-900/30" />
      <div className="h-4 w-72 rounded-lg bg-parchment-100 dark:bg-emerald-900/20" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-parchment-100 dark:bg-emerald-900/20" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-parchment-100 dark:bg-emerald-900/20" />
    </div>
  )
}

// ─── Lazy route imports (Phase 10.6 — code splitting) ─────────────────────────
const LoginPage       = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage    = lazy(() => import('./pages/auth/RegisterPage'))
const OnboardingV2    = lazy(() => import('./pages/auth/OnboardingV2'))

const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Prayer          = lazy(() => import('./pages/Prayer'))
const Quran           = lazy(() => import('./pages/Quran'))
const Habits          = lazy(() => import('./pages/Habits'))
const Journal         = lazy(() => import('./pages/Journal'))
const Tasks           = lazy(() => import('./pages/Tasks'))
const Female          = lazy(() => import('./pages/Female'))
const AIGuide         = lazy(() => import('./pages/AIGuide'))
const Settings        = lazy(() => import('./pages/Settings'))
const Meal            = lazy(() => import('./pages/Meal'))
const Workout         = lazy(() => import('./pages/Workout'))
const Children        = lazy(() => import('./pages/Children'))
const Qibla           = lazy(() => import('./pages/Qibla'))
const Community       = lazy(() => import('./pages/Community'))
const Waqf            = lazy(() => import('./pages/Waqf'))
const Wellness        = lazy(() => import('./pages/Wellness'))
const Gamification    = lazy(() => import('./pages/Gamification'))
const Learning        = lazy(() => import('./pages/Learning'))
// Phase 8
const Finance         = lazy(() => import('./pages/Finance'))
const Family          = lazy(() => import('./pages/Family'))
// Phase 10
const Admin           = lazy(() => import('./pages/Admin'))
const Subscription    = lazy(() => import('./pages/Subscription'))

// ─── Route guards ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.onboarding_completed) return <Navigate to="/onboarding" replace />
  return children
}

function AuthRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function FemaleRoute({ children }) {
  const { isFemale } = useAuthStore()
  return isFemale() ? children : <Navigate to="/dashboard" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuthStore()
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Auth routes */}
          <Route path="/login"      element={<AuthRoute><LoginPage /></AuthRoute>} />
          <Route path="/register"   element={<AuthRoute><RegisterPage /></AuthRoute>} />
          <Route path="/onboarding" element={<OnboardingV2 />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/prayer"        element={<Prayer />} />
            <Route path="/quran"         element={<Quran />} />
            <Route path="/habits"        element={<Habits />} />
            <Route path="/journal"       element={<Journal />} />
            <Route path="/tasks"         element={<Tasks />} />
            <Route path="/ai"            element={<AIGuide />} />
            <Route path="/settings"      element={<Settings />} />
            <Route path="/female"        element={<FemaleRoute><Female /></FemaleRoute>} />
            <Route path="/meal"          element={<Meal />} />
            <Route path="/workout"       element={<Workout />} />
            <Route path="/wellness"      element={<Wellness />} />
            <Route path="/children"      element={<Children />} />
            <Route path="/qibla"         element={<Qibla />} />
            <Route path="/community"     element={<Community />} />
            <Route path="/waqf"          element={<Waqf />} />
            <Route path="/gamification"  element={<Gamification />} />
            <Route path="/learning"      element={<Learning />} />
            {/* Phase 8 */}
            <Route path="/finance"       element={<Finance />} />
            <Route path="/family"        element={<Family />} />
            {/* Phase 10 */}
            <Route path="/subscription"  element={<Subscription />} />
            <Route path="/admin"         element={<AdminRoute><Admin /></AdminRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
