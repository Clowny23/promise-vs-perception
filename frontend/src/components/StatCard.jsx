// frontend/src/components/StatCard.jsx
import React from 'react'

export default function StatCard({ title, value, subtitle, color = 'var(--color-accent)', icon }) {
  return (
    <div className="card fade-in" style={{
      position: 'relative',
      overflow: 'hidden',
      borderTop: `4px solid ${color}`,
    }}>
      {/* Background blob */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '100px', height: '100px',
        borderRadius: '50%',
        background: color,
        opacity: 0.06,
        pointerEvents: 'none',
      }} />

      {/* Icon circle */}
      <div style={{
        width: '44px', height: '44px',
        borderRadius: '12px',
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
        marginBottom: '14px',
      }}>
        {icon}
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'Sora, sans-serif',
        fontSize: '38px',
        fontWeight: 700,
        color: color,
        lineHeight: 1,
        marginBottom: '6px',
        letterSpacing: '-0.02em',
      }}>
        {value.toLocaleString()}
      </div>

      {/* Title */}
      <div style={{
        fontSize: '14px', fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: '3px',
      }}>
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}