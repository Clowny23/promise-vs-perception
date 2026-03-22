// frontend/src/pages/PromisesPage.jsx
//
// WHY THIS FILE:
// Full-page view of all extracted promises.
// Includes search box, party filter, topic filter, and pagination.
//
// KEY CONCEPTS:
// - "Controlled inputs": React state controls input values
//   (value={search} + onChange={setSearch})
// - "Debouncing": We don't search on every keystroke — wait 400ms
//   after the user stops typing. Prevents hammering the API.

import React, { useState, useEffect, useCallback } from 'react'
import PartyFilter from '../components/PartyFilter'
import PromiseCard from '../components/PromiseCard'
import { getPromises, getPromiseStats } from '../services/api'

const TOPICS = ['Economy', 'Jobs', 'Education', 'Healthcare', 'Welfare', 'Infrastructure']
const PAGE_SIZE = 20

export default function PromisesPage() {
  const [selectedParty, setSelectedParty] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [promises, setPromises] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // --- DEBOUNCE ---
  // Wait 400ms after user stops typing before searching
  // Without this: every letter press = one API call (too many)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0) // Reset to first page on new search
    }, 400)
    return () => clearTimeout(timer) // Cancel timer if user types again
  }, [search])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [selectedParty, selectedTopic])

  // --- FETCH PROMISES ---
  const fetchPromises = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }
      if (selectedParty) params.party = selectedParty
      if (selectedTopic) params.topic = selectedTopic
      if (debouncedSearch) params.search = debouncedSearch

      const results = await getPromises(params)
      setPromises(results)
      setHasMore(results.length === PAGE_SIZE)
    } catch (err) {
      console.error('Failed to fetch promises:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedParty, selectedTopic, debouncedSearch, page])

  useEffect(() => { fetchPromises() }, [fetchPromises])

  // --- FETCH STATS (for the topic counts) ---
  useEffect(() => {
    getPromiseStats(selectedParty).then(setStats).catch(console.error)
  }, [selectedParty])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ---- HEADER ---- */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '6px' }}>
          📋 Promises
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Political commitments extracted from election manifestos using NLP
        </p>
      </div>

      {/* ---- FILTERS ROW ---- */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px', pointerEvents: 'none'
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search promises... (e.g. school, farmers, jobs)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              transition: 'border-color var(--transition)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: 'var(--color-text-muted)', fontSize: '16px',
                cursor: 'pointer'
              }}
            >✕</button>
          )}
        </div>

        {/* Party filter */}
        <PartyFilter selected={selectedParty} onChange={(p) => { setSelectedParty(p); setPage(0) }} />

        {/* Topic pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Topic:</span>

          {/* "All Topics" pill */}
          <button
            onClick={() => { setSelectedTopic(null); setPage(0) }}
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              border: `1px solid ${!selectedTopic ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: !selectedTopic ? 'var(--color-accent-soft)' : 'transparent',
              color: !selectedTopic ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            All Topics
          </button>

          {TOPICS.map(topic => {
            const count = stats?.by_topic?.[topic] ?? 0
            const isSelected = selectedTopic === topic
            return (
              <button
                key={topic}
                onClick={() => { setSelectedTopic(isSelected ? null : topic); setPage(0) }}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-accent-soft)' : 'transparent',
                  color: isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'all var(--transition)',
                }}
              >
                {topic}
                {count > 0 && (
                  <span style={{
                    marginLeft: '5px',
                    background: 'var(--color-border)',
                    borderRadius: '8px',
                    padding: '0 5px',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                  }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ---- RESULTS COUNT ---- */}
      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
        {loading
          ? 'Loading...'
          : `Showing ${promises.length} promises ${debouncedSearch ? `matching "${debouncedSearch}"` : ''}`
        }
      </div>

      {/* ---- PROMISE LIST ---- */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" />
        </div>
      ) : promises.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <p>No promises found for the selected filters.</p>
          <button
            onClick={() => { setSelectedParty(null); setSelectedTopic(null); setSearch('') }}
            style={{
              marginTop: '12px', padding: '8px 16px',
              background: 'var(--color-accent-soft)',
              border: '1px solid var(--color-accent)',
              color: 'var(--color-accent)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px',
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {promises.map(promise => (
            <PromiseCard key={promise.id} promise={promise} />
          ))}
        </div>
      )}

      {/* ---- PAGINATION ---- */}
      {!loading && (promises.length > 0) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingTop: '8px' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '8px 20px',
              background: page === 0 ? 'var(--color-border)' : 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: page === 0 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              borderRadius: 'var(--radius-sm)',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontFamily: 'var(--font-body)',
            }}
          >
            ← Previous
          </button>

          <span style={{
            padding: '8px 16px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px', color: 'var(--color-text-secondary)',
          }}>
            Page {page + 1}
          </span>

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            style={{
              padding: '8px 20px',
              background: !hasMore ? 'var(--color-border)' : 'var(--color-accent-soft)',
              border: `1px solid ${!hasMore ? 'var(--color-border)' : 'var(--color-accent)'}`,
              color: !hasMore ? 'var(--color-text-muted)' : 'var(--color-accent)',
              borderRadius: 'var(--radius-sm)',
              cursor: !hasMore ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontFamily: 'var(--font-body)',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}