import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import LunchRegistration from './pages/LunchRegistration'
import AdminPanel from './pages/AdminPanel'
import Header from './components/Header'
import Navigation from './components/Navigation'
import LoadingSpinner from './components/LoadingSpinner'
import './styles.css'

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="app">
      <Router>
        <Header />
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/registro" element={<LunchRegistration />} />
            {profile?.role === 'admin' && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Router>
    </div>
  )
}

export default App