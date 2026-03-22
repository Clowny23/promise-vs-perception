// frontend/src/App.jsx
// Landing page is now the home route "/"
// Dashboard and all features are at their own routes

import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage  from './pages/LandingPage'
import MainLayout   from './components/layout/MainLayout'
import Dashboard    from './pages/Dashboard'
import PromisesPage from './pages/PromisesPage'
import SentimentPage from './pages/SentimentPage'
import ComparePage  from './pages/ComparePage'
import UploadPage   from './pages/UploadPage'
import './styles/global.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — no navbar, full screen */}
        <Route path="/" element={<LandingPage />} />

        {/* All app pages — wrapped with Navbar */}
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/promises"  element={<MainLayout><PromisesPage /></MainLayout>} />
        <Route path="/sentiment" element={<MainLayout><SentimentPage /></MainLayout>} />
        <Route path="/compare"   element={<MainLayout><ComparePage /></MainLayout>} />
        <Route path="/upload"    element={<MainLayout><UploadPage /></MainLayout>} />

        {/* 404 */}
        <Route path="*" element={
          <div style={{ textAlign:'center', padding:'80px', fontFamily:'Sora, sans-serif', color:'#2E4052' }}>
            <h2 style={{ fontSize:'48px', marginBottom:'12px' }}>404</h2>
            <p>Page not found. <a href="/" style={{ color:'#FFC857' }}>Go home →</a></p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App