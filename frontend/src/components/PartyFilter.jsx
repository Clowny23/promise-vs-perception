// frontend/src/components/PartyFilter.jsx
import React from 'react'

const PARTIES = [
  { key: null,      label: 'All Parties', color: 'var(--color-accent)',   bg: 'var(--color-accent-soft)',   border: 'var(--color-accent)' },
  { key: 'DMK',     label: 'DMK',         color: 'var(--color-dmk)',      bg: 'var(--color-dmk-soft)',      border: 'var(--color-dmk)' },
  { key: 'AIADMK',  label: 'AIADMK',      color: 'var(--color-aiadmk)',   bg: 'var(--color-aiadmk-soft)',   border: 'var(--color-aiadmk)' },
]

export default function PartyFilter({ selected, onChange, dark = false }) {
  return (
    <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
      <span style={{ fontSize:'12px', color: dark ? '#64748B' : 'var(--color-text-muted)', marginRight:'2px', fontWeight:500 }}>
        FILTER
      </span>
      {PARTIES.map(party => {
        const isSelected = selected === party.key
        return (
          <button
            key={party.key ?? 'all'}
            onClick={() => onChange(party.key)}
            style={{
              padding: '7px 18px',
              borderRadius: '24px',
              border: `1.5px solid ${isSelected ? party.border : dark ? 'rgba(255,255,255,0.15)' : 'var(--color-border)'}`,
              background: isSelected ? party.bg : dark ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: isSelected ? party.color : dark ? '#94A3B8' : 'var(--color-text-secondary)',
              fontSize: '13px',
              fontWeight: isSelected ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-body)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isSelected ? `0 2px 8px ${party.bg}` : 'none',
            }}
          >
            {party.key && (
              <div style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: party.color,
                flexShrink: 0,
              }} />
            )}
            {party.label}
          </button>
        )
      })}
    </div>
  )
}