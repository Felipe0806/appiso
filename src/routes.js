import React from 'react'
import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home/Home'
import Test from './pages/Test/Test'
import Resolver from './pages/Resolver/Resolver'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test" element={<Test />} />
      <Route path="/resolver" element={<Resolver />} />
    </Routes>
  )
}
