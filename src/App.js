import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './routes'
import './App.css'

/**
 * App: Componente raíz que envuelve el Router
 */
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
