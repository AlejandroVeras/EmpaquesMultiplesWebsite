import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import LunchRegistration from './pages/LunchRegistration'
import AdminPanel from './pages/AdminPanel'
import Header from './Header'
import Navigation from './Navigation'
import LoadingSpinner from './LoadingSpinner'
import NotFound from './NotFound'

function LunchSystem() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="app">
      {user && (
        <>
          <Header />
          <Navigation />
        </>
      )}
      <main className="main-content">
        <Routes>
          <Route path="/" element={user ? <Dashboard /> : <AuthPage />} />
          <Route path="/login" element={user ? <Navigate to="/lunch-system/" replace /> : <AuthPage />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/lunch-system/" replace />} />
          <Route path="/register" element={user ? <LunchRegistration /> : <Navigate to="/lunch-system/" replace />} />
          <Route path="/registro" element={user ? <LunchRegistration /> : <Navigate to="/lunch-system/" replace />} />
          {user && profile?.role === 'admin' && (
            <Route path="/admin" element={<AdminPanel />} />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default LunchSystem