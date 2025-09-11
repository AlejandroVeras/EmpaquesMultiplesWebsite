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
import NotFound from './components/NotFound'
import './styles.css'

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="app">
      <Router>
        {user && (
          <>
            <Header />
            <Navigation />
          </>
        )}
        <main className="main-content">
          <Routes>
            <Route path="/" element={user ? <Dashboard /> : <AuthPage />} />
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
            <Route path="/register" element={user ? <LunchRegistration /> : <Navigate to="/" replace />} />
            <Route path="/registro" element={user ? <LunchRegistration /> : <Navigate to="/" replace />} />
            {user && profile?.role === 'admin' && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </Router>
    </div>
  )
}

export default App