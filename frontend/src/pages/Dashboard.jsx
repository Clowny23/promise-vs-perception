// frontend/src/pages/Dashboard.jsx
import React, { useState } from 'react'
import PartyFilter from '../components/PartyFilter'
import StatCard from '../components/StatCard'
import SentimentPieChart from '../components/charts/SentimentPieChart'
import TopicBarChart from '../components/charts/TopicBarChart'
import ComparisonBarChart from '../components/charts/ComparisonBarChart'
import PromiseCard from '../components/PromiseCard'
import { useFetch } from '../hooks/useFetch'
import { getDashboardSummary, getPolarizationScore } from '../services/api'

export default function Dashboard() {
  const [selectedParty, setSelectedParty] = useState(null)

  const { data, loading, error } = useFetch(
    getDashboardSummary, [selectedParty], selectedParty
  )
  const { data: polData } = useFetch(getPolarizationScore, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Loading dashboard data...</p>
    </div>
  )

  if (error) return (
    <div style={{
      background: 'var(--color-negative-bg)',
      border: '1px solid var(--color-negative)',
      borderRadius: 'var(--radius-md)',
      padding: '24px', color: 'var(--color-negative)', textAlign: 'center'
    }}>
      <strong>Error:</strong> {error}
      <br />
      <small style={{ color: 'var(--color-text-muted)', marginTop: '8px', display: 'block' }}>
        Make sure the backend is running: <code>uvicorn app.main:app --reload</code>
      </small>
    </div>
  )

  if (!data) return null
  const { promise_stats, topic_distribution, sentiment_summary, party_comparison, recent_promises, total_posts } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ---- HERO HEADER ---- */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(255,107,43,0.08)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-60px', left:'30%', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(26,86,219,0.06)', pointerEvents:'none' }} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'20px', position:'relative' }}>
          <div>
            {/* Gradient accent bar */}
            <div style={{
              width:'48px', height:'4px',
              background:'linear-gradient(90deg, #D62828, #FF6B2B, #1A56DB)',
              borderRadius:'2px', marginBottom:'14px'
            }} />
            <h1 style={{
              fontFamily:'Sora, sans-serif', fontSize:'28px',
              fontWeight:700, color:'#FFFFFF', marginBottom:'8px',
            }}>
              Promise vs Perception
            </h1>
            <p style={{ color:'#94A3B8', fontSize:'14px', maxWidth:'480px', lineHeight:'1.6' }}>
              Analyzing the gap between political promises and public perception in Tamil Nadu using AI-powered NLP.
            </p>
          </div>
          <PartyFilter selected={selectedParty} onChange={setSelectedParty} dark />
        </div>
      </div>

      {/* ---- STAT CARDS ---- */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px' }}>
        <StatCard icon="📋" title="Total Promises" value={promise_stats?.total ?? 0}
          subtitle="extracted via NLP" color="var(--color-accent)" />
        <StatCard icon="🐦" title="Posts Analyzed" value={total_posts ?? 0}
          subtitle="public reactions" color="var(--color-aiadmk)" />
        <StatCard icon="🔴" title="DMK Promises" value={promise_stats?.by_party?.DMK ?? 0}
          subtitle="from manifesto" color="var(--color-dmk)" />
        <StatCard icon="🔵" title="AIADMK Promises" value={promise_stats?.by_party?.AIADMK ?? 0}
          subtitle="from manifesto" color="var(--color-aiadmk)" />
      </div>

      {/* ---- POLARIZATION SCORES ---- */}
      {polData && (
        <div>
          <div style={{ marginBottom:'16px' }}>
            <div className="page-header-accent" />
            <h2 style={{ fontFamily:'Sora, sans-serif', fontSize:'20px' }}>
              Promise–Perception Gap Score
            </h2>
            <p style={{ color:'var(--color-text-secondary)', fontSize:'13px', marginTop:'4px' }}>
              How far is public trust from what parties promise?
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px' }}>
            {Object.entries(polData.scores || {}).map(([party, scores]) => {
              const isDMK = party === 'DMK'
              const partyColor = isDMK ? 'var(--color-dmk)' : 'var(--color-aiadmk)'
              const partyBg = isDMK ? 'var(--color-dmk-soft)' : 'var(--color-aiadmk-soft)'
              const gapColor = scores.polarization_gap_score > 60
                ? 'var(--color-negative)'
                : scores.polarization_gap_score > 40
                  ? 'var(--color-neutral)'
                  : 'var(--color-positive)'

              return (
                <div key={party} className="card fade-in" style={{ borderTop:`4px solid ${partyColor}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:partyBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:partyColor }} />
                      </div>
                      <span style={{ fontFamily:'Sora, sans-serif', fontSize:'18px', fontWeight:700, color:partyColor }}>
                        {party}
                      </span>
                    </div>
                    <span style={{
                      padding:'4px 10px', borderRadius:'12px', fontSize:'11px', fontWeight:600,
                      background: scores.polarization_gap_score > 60
                        ? 'var(--color-negative-bg)'
                        : scores.polarization_gap_score > 40
                          ? 'var(--color-neutral-bg)'
                          : 'var(--color-positive-bg)',
                      color: gapColor,
                    }}>
                      {scores.interpretation}
                    </span>
                  </div>

                  <div style={{ marginBottom:'14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px', fontSize:'13px', color:'var(--color-text-secondary)' }}>
                      <span>Public Trust</span>
                      <span style={{ fontWeight:700, color:'var(--color-positive)' }}>
                        {scores.public_positive_sentiment}%
                      </span>
                    </div>
                    <div style={{ height:'10px', background:'var(--color-border)', borderRadius:'5px', overflow:'hidden' }}>
                      <div style={{
                        height:'100%',
                        width:`${scores.public_positive_sentiment}%`,
                        background:`linear-gradient(90deg, ${partyColor}, var(--color-accent))`,
                        borderRadius:'5px',
                        transition:'width 1s ease',
                      }} />
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div style={{ background:'var(--color-surface-2)', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:'20px', fontWeight:700, color:'var(--color-negative)', fontFamily:'Sora, sans-serif' }}>
                        {scores.polarization_gap_score}
                      </div>
                      <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'2px' }}>Gap Score</div>
                    </div>
                    <div style={{ background:'var(--color-surface-2)', borderRadius:'8px', padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:'20px', fontWeight:700, color:partyColor, fontFamily:'Sora, sans-serif' }}>
                        {scores.promise_count}
                      </div>
                      <div style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'2px' }}>Promises</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize:'12px', color:'var(--color-text-muted)', marginTop:'8px' }}>
            ℹ️ {polData.explanation}
          </p>
        </div>
      )}

      {/* ---- CHARTS ROW ---- */}
      <div>
        <div style={{ marginBottom:'16px' }}>
          <div className="page-header-accent" />
          <h2 style={{ fontFamily:'Sora, sans-serif', fontSize:'20px' }}>Analytics</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'20px' }}>
          <SentimentPieChart
            data={sentiment_summary}
            title={`Sentiment — ${selectedParty || 'All Parties'}`}
          />
          <TopicBarChart
            data={topic_distribution}
            title={`Promises by Topic${selectedParty ? ` — ${selectedParty}` : ''}`}
            party={selectedParty}
          />
        </div>
      </div>

      {/* ---- COMPARISON ---- */}
      {!selectedParty && party_comparison && (
        <ComparisonBarChart
          data={party_comparison}
          title="DMK vs AIADMK — Sentiment Comparison"
        />
      )}

      {/* ---- RECENT PROMISES ---- */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div>
            <div className="page-header-accent" />
            <h2 style={{ fontFamily:'Sora, sans-serif', fontSize:'20px' }}>Recent Promises</h2>
          </div>
          <a href="/promises" style={{
            fontSize:'13px', color:'var(--color-accent)', fontWeight:600,
            padding:'6px 14px', border:'1px solid var(--color-accent)',
            borderRadius:'20px', textDecoration:'none',
            background:'var(--color-accent-soft)',
          }}>
            View all →
          </a>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {recent_promises?.length > 0 ? (
            recent_promises.map(promise => (
              <PromiseCard key={promise.id} promise={promise} />
            ))
          ) : (
            <div style={{
              textAlign:'center', padding:'48px',
              color:'var(--color-text-muted)',
              background:'var(--color-surface)',
              borderRadius:'var(--radius-lg)',
              border:'2px dashed var(--color-border)',
            }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
              <p>No promises found. Run the extraction pipeline first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}