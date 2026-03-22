// frontend/src/pages/ComparePage.jsx
//
// WHY THIS FILE:
// Side-by-side comparison of DMK vs AIADMK.
// Shows both parties' promise counts, topic distributions,
// and sentiment scores at the same time.
// This is the most visually impactful page for academic presentation.

import React, { useEffect, useState } from 'react'
import ComparisonBarChart from '../components/charts/ComparisonBarChart'
import TopicBarChart from '../components/charts/TopicBarChart'
import { getDashboardSummary, getSentimentComparison, getPolarizationScore } from '../services/api'

export default function ComparePage() {
  const [dmkData, setDmkData]       = useState(null)
  const [aiadmkData, setAiadmkData] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [polScores, setPolScores]   = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardSummary('DMK'),
      getDashboardSummary('AIADMK'),
      getSentimentComparison(),
      getPolarizationScore(),
    ])
      .then(([dmk, aiadmk, comp, pol]) => {
        setDmkData(dmk)
        setAiadmkData(aiadmk)
        setComparison(comp)
        setPolScores(pol)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ---- HEADER ---- */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '6px' }}>
          ⚔️ Party Comparison
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          DMK vs AIADMK — Side-by-side analysis of promises and public perception
        </p>
      </div>

      {/* ---- HEAD-TO-HEAD STATS ---- */}
      <div className="card fade-in">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '20px' }}>
          At a Glance
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
          {/* DMK Column */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-dmk)',
              marginBottom: '16px',
              letterSpacing: '0.1em',
            }}>
              🔴 DMK
            </div>
            <HeadToHeadStat label="Promises" value={dmkData?.promise_stats?.total ?? '—'} color="var(--color-dmk)" />
            <HeadToHeadStat label="Posts Analyzed" value={dmkData?.total_posts ?? '—'} color="var(--color-dmk)" />
            <HeadToHeadStat
              label="Public Trust"
              value={`${dmkData?.sentiment_summary?.Positive?.percentage ?? 0}%`}
              color="var(--color-positive)"
            />
            <HeadToHeadStat
              label="Polarization Gap"
              value={`${polScores?.scores?.DMK?.polarization_gap_score ?? '—'}`}
              color="var(--color-negative)"
            />
          </div>

          {/* VS divider */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '48px', height: '48px',
              borderRadius: '50%',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '14px', fontWeight: 700,
              color: 'var(--color-text-muted)',
            }}>
              VS
            </div>
            <div style={{ width: '1px', height: '120px', background: 'var(--color-border)' }} />
          </div>

          {/* AIADMK Column */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px', fontWeight: 700,
              color: 'var(--color-aiadmk)',
              marginBottom: '16px', letterSpacing: '0.1em',
            }}>
              🔵 AIADMK
            </div>
            <HeadToHeadStat label="Promises" value={aiadmkData?.promise_stats?.total ?? '—'} color="var(--color-aiadmk)" />
            <HeadToHeadStat label="Posts Analyzed" value={aiadmkData?.total_posts ?? '—'} color="var(--color-aiadmk)" />
            <HeadToHeadStat
              label="Public Trust"
              value={`${aiadmkData?.sentiment_summary?.Positive?.percentage ?? 0}%`}
              color="var(--color-positive)"
            />
            <HeadToHeadStat
              label="Polarization Gap"
              value={`${polScores?.scores?.AIADMK?.polarization_gap_score ?? '—'}`}
              color="var(--color-negative)"
            />
          </div>
        </div>
      </div>

      {/* ---- SENTIMENT COMPARISON CHART ---- */}
      {comparison && (
        <ComparisonBarChart
          data={comparison}
          title="Sentiment Comparison — DMK vs AIADMK"
        />
      )}

      {/* ---- TOPIC DISTRIBUTIONS SIDE BY SIDE ---- */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '16px' }}>
          Promise Topics — Side by Side
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <TopicBarChart
            data={dmkData?.topic_distribution}
            title="DMK — Promises by Topic"
            party="DMK"
          />
          <TopicBarChart
            data={aiadmkData?.topic_distribution}
            title="AIADMK — Promises by Topic"
            party="AIADMK"
          />
        </div>
      </div>

      {/* ---- KEY INSIGHTS ---- */}
      <div className="card fade-in">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '16px' }}>
          🔍 Key Insights
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            {
              title: 'Polarization Gap',
              text: `DMK has a gap score of ${polScores?.scores?.DMK?.polarization_gap_score ?? '?'} vs AIADMK at ${polScores?.scores?.AIADMK?.polarization_gap_score ?? '?'}.
                     A higher score means greater distance between party promises and public trust.`,
              icon: '📊'
            },
            {
              title: 'Public Trust',
              text: `${
                (dmkData?.sentiment_summary?.Positive?.percentage ?? 0) > (aiadmkData?.sentiment_summary?.Positive?.percentage ?? 0)
                  ? 'DMK' : 'AIADMK'
              } has higher positive public sentiment in social media discussions.`,
              icon: '🤝'
            },
            {
              title: 'Promise Coverage',
              text: 'Both parties cover all 6 topic areas (Economy, Jobs, Education, Healthcare, Welfare, Infrastructure), but the emphasis differs. Compare the topic bars above.',
              icon: '📋'
            },
          ].map(insight => (
            <div key={insight.title} style={{
              display: 'flex', gap: '12px',
              padding: '14px',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{insight.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  {insight.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  {insight.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Small internal helper component for head-to-head stats
function HeadToHeadStat({ label, value, color }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  )
}