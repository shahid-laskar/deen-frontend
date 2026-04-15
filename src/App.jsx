import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingV2 from './pages/auth/OnboardingV2'
import Dashboard from './pages/Dashboard'
import Prayer from './pages/Prayer'
import Quran from './pages/Quran'
import Habits from './pages/Habits'
import Journal from './pages/Journal'
import Tasks from './pages/Tasks'
import Female from './pages/Female'
import AIGuide from './pages/AIGuide'
import Settings from './pages/Settings'
import Meal from './pages/Meal'
import Workout from './pages/Workout'
import Children from './pages/Children'
import Qibla from './pages/Qibla'
import Community from './pages/Community'
import Waqf from './pages/Waqf'
import Wellness from './pages/Wellness'
import Gamification from './pages/Gamification'
import Learning from './pages/Learning'

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
        <Route path="/onboarding" element={<OnboardingV2 />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/prayer" element={<Prayer />} />
          <Route path="/quran" element={<Quran />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/ai" element={<AIGuide />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/female" element={<FemaleRoute><Female /></FemaleRoute>} />
          <Route path="/meal" element={<Meal />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/children" element={<Children />} />
          <Route path="/qibla" element={<Qibla />} />
          <Route path="/community" element={<Community />} />
          <Route path="/waqf" element={<Waqf />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/learning" element={<Learning />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
