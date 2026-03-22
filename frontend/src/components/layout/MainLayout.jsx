// frontend/src/components/layout/MainLayout.jsx
// Wraps all inner app pages with the Navbar + footer

import React from 'react'
import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/promises',  label: 'Promises'  },
  { to: '/sentiment', label: 'Sentiment' },
  { to: '/compare',   label: 'Compare'   },
]

function AppNavbar() {
  return (
    <nav style={{
      background: '#2E4052',
      borderBottom: '3px solid #FFC857',
      padding: '0 32px',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 16px rgba(46,64,82,0.2)',
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '64px',
      }}>
        {/* Logo */}
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: '#FFC857',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
          }}>🗳️</div>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>
              Promise vs Perception
            </div>
            <div style={{ fontSize: '10px', color: '#BDD9BF', marginTop: '-1px' }}>
              Tamil Nadu · NLP Analysis
            </div>
          </div>
        </a>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px', fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? '#2E4052' : '#BDD9BF',
                background: isActive ? '#FFC857' : 'transparent',
                border: isActive ? '1px solid #FFC857' : '1px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Upload button */}
          <NavLink
            to="/upload"
            style={({ isActive }) => ({
              marginLeft: '8px',
              padding: '7px 16px',
              borderRadius: '20px',
              fontSize: '13px', fontWeight: 700,
              textDecoration: 'none',
              color: isActive ? '#2E4052' : '#FFC857',
              background: isActive ? '#FFC857' : 'rgba(255,200,87,0.12)',
              border: '1.5px solid rgba(255,200,87,0.5)',
              transition: 'all 0.15s ease',
            })}
          >
            ↑ Upload
          </NavLink>
        </div>

        {/* Party pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'DMK', color: '#e74c3c', bg: 'rgba(231,76,60,0.15)' },
            { label: 'AIADMK', color: '#3498db', bg: 'rgba(52,152,219,0.15)' },
          ].map(p => (
            <div key={p.label} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '16px',
              background: p.bg,
              border: `1px solid ${p.color}40`,
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: p.color }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default function MainLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F7F5' }}>
      <AppNavbar />
      <main style={{
        flex: 1,
        padding: '32px 24px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
      }}>
        {children}
      </main>
      <footer style={{
        textAlign: 'center', padding: '20px 24px',
        borderTop: '1px solid #D8E8D9',
        background: '#FFFFFF',
        color: '#8fa3b0', fontSize: '12px',
      }}>
        Promise vs Perception · Tamil Nadu Political NLP Analysis · React + FastAPI
      </footer>
    </div>
  )
}