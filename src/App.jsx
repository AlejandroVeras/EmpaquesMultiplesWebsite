import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import StaticWebsite from './components/StaticWebsite'
import LunchSystem from './components/LunchSystem'
import NotFound from './components/NotFound'
import './styles.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal estática */}
        <Route path="/" element={<StaticWebsite />} />
        
        {/* Sistema de registro de almuerzos */}
        <Route path="/lunch-system/*" element={<LunchSystem />} />
        
        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App