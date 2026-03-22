// frontend/src/components/PromiseCard.jsx
//
// WHY THIS FILE:
// Renders a single promise as a card in the promise list.
// Shows the promise text, party badge, topic badge, and confidence.
//
// PROPS:
// - promise: { id, party, text, topic, topic_confidence, page_number }

import React, { useState } from 'react'

const TOPIC_COLORS = {
  Economy:        '#7C3AED',
  Jobs:           '#2DC653',
  Education:      '#457B9D',
  Healthcare:     '#E63946',
  Welfare:        '#F4A261',
  Infrastructure: '#06B6D4',
}

export default function PromiseCard({ promise }) {
  const [expanded, setExpanded] = useState(false)

  const partyColor = promise.party === 'DMK'
    ? 'var(--color-dmk)'
    : 'var(--color-aiadmk)'

  const topicColor = TOPIC_COLORS[promise.topic] || '#94A3B8'

  // If the text is long, show truncated version with expand button
  const isLong = promise.text.length > 180
  const displayText = isLong && !expanded
    ? promise.text.slice(0, 180) + '...'
    : promise.text

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${partyColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        transition: 'border-color var(--transition), box-shadow var(--transition)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = partyColor
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header: Party badge + Topic badge */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>

        {/* Party badge */}
        <span style={{
          padding: '2px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 700,
          background: `${partyColor}22`,
          color: partyColor,
          border: `1px solid ${partyColor}55`,
          letterSpacing: '0.05em',
        }}>
          {promise.party}
        </span>

        {/* Topic badge */}
        {promise.topic && (
          <span style={{
            padding: '2px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 500,
            background: `${topicColor}22`,
            color: topicColor,
            border: `1px solid ${topicColor}44`,
          }}>
            {promise.topic}
          </span>
        )}

        {/* Confidence indicator */}
        {promise.topic_confidence !== null && promise.topic_confidence !== undefined && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {/* Small confidence bar */}
            <div style={{
              width: '40px',
              height: '3px',
              background: 'var(--color-border)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.round(promise.topic_confidence * 100)}%`,
                height: '100%',
                background: topicColor,
                borderRadius: '2px',
              }} />
            </div>
            {Math.round(promise.topic_confidence * 100)}%
          </span>
        )}
      </div>

      {/* Promise Text */}
      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-primary)',
        lineHeight: '1.6',
        margin: 0,
      }}>
        {displayText}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              fontSize: '13px',
              padding: '0 4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {expanded ? ' Show less' : ' Read more'}
          </button>
        )}
      </p>

      {/* Footer: Source info */}
      {promise.page_number && (
        <div style={{
          marginTop: '10px',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
        }}>
          📄 Page {promise.page_number}
          {promise.manifesto_year && ` • Manifesto ${promise.manifesto_year}`}
        </div>
      )}
    </div>
  )
}