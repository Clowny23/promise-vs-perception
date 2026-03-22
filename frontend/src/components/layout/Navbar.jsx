// frontend/src/components/layout/Navbar.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/',          label: 'Dashboard' },
  { to: '/promises',  label: 'Promises'  },
  { to: '/sentiment', label: 'Sentiment' },
  { to: '/compare',   label: 'Compare'   },
]

export default function Navbar() {
  return (
    <nav style={{
      background: '#0F172A',
      borderBottom: '3px solid transparent',
      borderImage: 'linear-gradient(90deg, #D62828, #FF6B2B, #1A56DB) 1',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(15,23,42,0.25)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
      }}>

        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #D62828 0%, #FF6B2B 50%, #1A56DB 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 4px 12px rgba(255,107,43,0.4)',
          }}>🗳️</div>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '16px', color: '#FFFFFF' }}>
              Promise vs Perception
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '-2px', letterSpacing: '0.04em' }}>
              Tamil Nadu · NLP Analysis
            </div>
          </div>
        </NavLink>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                background: isActive ? 'rgba(255,107,43,0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(255,107,43,0.4)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              })}
            >
              {link.label}
            </NavLink>
          ))}

          {/* Upload button — highlighted differently */}
          <NavLink
            to="/upload"
            style={({ isActive }) => ({
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#FFFFFF' : '#FF6B2B',
              background: isActive ? '#FF6B2B' : 'rgba(255,107,43,0.12)',
              border: '1px solid rgba(255,107,43,0.4)',
              transition: 'all 0.2s ease',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            })}
          >
            ↑ Upload PDF
          </NavLink>
        </div>

        {/* Party indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px',
            background: 'rgba(214,40,40,0.15)',
            border: '1px solid rgba(214,40,40,0.3)',
            borderRadius: '20px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#D62828' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#FCA5A5' }}>DMK</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px',
            background: 'rgba(26,86,219,0.15)',
            border: '1px solid rgba(26,86,219,0.3)',
            borderRadius: '20px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1A56DB' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#93C5FD' }}>AIADMK</span>
          </div>
        </div>
      </div>
    </nav>
  )
}