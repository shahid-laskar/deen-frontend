import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layout
import AppLayout from './components/layout/AppLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingPage from './pages/auth/OnboardingPage'

// App pages
import Dashboard from './pages/Dashboard'
import Prayer from './pages/Prayer'
import Quran from './pages/Quran'
import Habits from './pages/Habits'
import Journal from './pages/Journal'
import Tasks from './pages/Tasks'
import Female from './pages/Female'
import AIGuide from './pages/AIGuide'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.onboarding_completed) return <Navigate to="/onboarding" replace />
  return children
}

function AuthRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function FemaleRoute({ children }) {
  const { isFemale } = useAuthStore()
  if (!isFemale()) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* App (protected) */}
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
          <Route
            path="/female"
            element={<FemaleRoute><Female /></FemaleRoute>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
