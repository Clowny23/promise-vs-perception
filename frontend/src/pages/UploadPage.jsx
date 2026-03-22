// frontend/src/pages/UploadPage.jsx
//
// Full upload + analysis page.
// Shows: promises extracted, topic chart, sentiment breakdown,
// sample promises, sample tweets with sentiment labels.

import React, { useState, useRef } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const TOPIC_COLORS = {
  Economy:        '#7C3AED',
  Jobs:           '#0D9E6E',
  Education:      '#1A56DB',
  Healthcare:     '#DC2626',
  Welfare:        '#D97706',
  Infrastructure: '#0891B2',
}

const SENTIMENT_CONFIG = {
  Positive: { color: '#0D9E6E', bg: 'rgba(13,158,110,0.08)', icon: '😊' },
  Neutral:  { color: '#D97706', bg: 'rgba(217,119,6,0.08)',  icon: '😐' },
  Negative: { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',  icon: '😠' },
}

export default function UploadPage() {
  const [file, setFile]         = useState(null)
  const [party, setParty]       = useState('DMK')
  const [year, setYear]         = useState(2024)
  const [loading, setLoading]   = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError]       = useState(null)
  const [result, setResult]     = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef                 = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') { setFile(f); setError(null) }
    else setError('Only PDF files accepted.')
  }

  const handleSelect = (e) => {
    const f = e.target.files[0]
    if (f) { setFile(f); setError(null) }
  }

  const handleUpload = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    setLoading(true); setError(null); setResult(null)

    const steps = [
      'Reading PDF pages...',
      'Extracting promise sentences with spaCy NLP...',
      'Classifying promises into topics...',
      'Saving promises to database...',
      'Running sentiment analysis on public reactions...',
      'Building full analysis report...',
    ]
    let stepIndex = 0
    setProgress(steps[0])
    const timer = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1)
      setProgress(steps[stepIndex])
    }, 4000)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post(
        `${BASE_URL}/promises/upload-manifesto?party=${party}&year=${year}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
      )
      setResult(res.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Upload failed. Make sure backend is running.'
      )
    } finally {
      clearInterval(timer)
      setLoading(false)
      setProgress('')
    }
  }

  const reset = () => {
    setFile(null); setResult(null); setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* PAGE HEADER */}
      <div>
        <div className="page-header-accent" />
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', marginBottom: '6px' }}>
          Upload & Analyse Manifesto
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Upload a political party manifesto PDF. The AI will extract promises, classify topics, run sentiment analysis, and show you the complete results.
        </p>
      </div>

      {/* UPLOAD FORM */}
      {!result && (
        <div className="card">

          {/* Party + Year */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.07em', marginBottom: '10px' }}>
              STEP 1 — PARTY & YEAR
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '5px' }}>Party</label>
                <select value={party} onChange={e => setParty(e.target.value)} style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer'
                }}>
                  <option value="DMK">DMK</option>
                  <option value="AIADMK">AIADMK</option>
                  <option value="BJP">BJP</option>
                  <option value="INC">INC (Congress)</option>
                  <option value="OTHER">Other Party</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '5px' }}>Year</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} style={{
                  width: '100%', padding: '10px 14px',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer'
                }}>
                  {[2026,2024,2023,2021,2019,2016,2014].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--color-border)', margin: '0 0 20px' }} />

          {/* Drop Zone */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.07em', marginBottom: '10px' }}>
              STEP 2 — UPLOAD PDF
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-accent)' : file ? 'var(--color-positive)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)', padding: '36px 24px',
                textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'var(--color-accent-soft)' : file ? 'var(--color-positive-bg)' : 'var(--color-surface-2)',
                transition: 'all 0.2s ease',
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleSelect} style={{ display: 'none' }} />
              {file ? (
                <div>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-positive)', marginBottom: '3px' }}>{file.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF ready
                  </div>
                  <button onClick={e => { e.stopPropagation(); reset() }} style={{
                    padding: '4px 12px', borderRadius: '16px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)'
                  }}>Change file</button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '44px', marginBottom: '10px' }}>📄</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '5px' }}>
                    Drag & drop your PDF here
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>or click to browse</div>
                  <div style={{
                    display: 'inline-block', padding: '6px 18px', borderRadius: '20px',
                    background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent)',
                    color: 'var(--color-accent)', fontSize: '13px', fontWeight: 600,
                  }}>Browse PDF</div>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    English text PDF only · Max recommended: 10MB
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: '14px',
              background: 'var(--color-negative-bg)',
              border: '1px solid var(--color-negative)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-negative)', fontSize: '13px'
            }}>⚠️ {error}</div>
          )}

          {/* Progress */}
          {loading && (
            <div style={{
              padding: '14px 16px', marginBottom: '14px',
              background: 'var(--color-accent-soft)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '18px', height: '18px', flexShrink: 0,
                border: '2px solid rgba(255,107,43,0.3)',
                borderTopColor: 'var(--color-accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)' }}>
                  Analysing...
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {progress}
                </div>
              </div>
            </div>
          )}

          {/* Analyse Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 'var(--radius-md)', border: 'none',
              background: !file || loading ? 'var(--color-border)' : 'linear-gradient(135deg, #FF6B2B, #D62828)',
              color: !file || loading ? 'var(--color-text-muted)' : '#fff',
              fontSize: '15px', fontWeight: 700, fontFamily: 'Sora, sans-serif',
              cursor: !file || loading ? 'not-allowed' : 'pointer',
              boxShadow: !file || loading ? 'none' : '0 4px 16px rgba(255,107,43,0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Analysing PDF... please wait (30–90 sec)' : '🔍  Analyse Manifesto'}
          </button>
        </div>
      )}

      {/* ============================================================
          RESULTS
          ============================================================ */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Hero banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: 'var(--radius-xl)', padding: '28px 32px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,107,43,0.08)', pointerEvents: 'none' }} />
            <div style={{ fontSize: '12px', color: '#64748B', letterSpacing: '0.06em', marginBottom: '6px' }}>ANALYSIS COMPLETE</div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', color: '#fff', marginBottom: '4px' }}>
              ✅ {result.party} Manifesto — {result.manifesto_year}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>{result.file_name}</p>
          </div>

          {/* Key stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Promises found',  value: result.promises_found, color: 'var(--color-accent)',   icon: '📋' },
              { label: 'Posts analysed',  value: result.sentiment_summary?.total || 0, color: 'var(--color-aiadmk)', icon: '🐦' },
              { label: 'Positive reactions', value: `${result.sentiment_summary?.Positive?.percentage || 0}%`, color: 'var(--color-positive)', icon: '✅' },
              { label: 'Polarization gap', value: `${result.polarization_gap}`, color: 'var(--color-negative)', icon: '📊' },
            ].map(s => (
              <div key={s.label} className="card fade-in" style={{ borderTop: `3px solid ${s.color}`, textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '26px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Topic Distribution */}
          {result.topic_distribution && Object.keys(result.topic_distribution).length > 0 && (
            <div className="card">
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', marginBottom: '16px' }}>
                📊 Topic Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(result.topic_distribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([topic, count]) => {
                    const total = result.promises_found || 1
                    const pct = Math.round((count / total) * 100)
                    const color = TOPIC_COLORS[topic] || '#888'
                    return (
                      <div key={topic}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color }}>{topic}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{count} promises ({pct}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: color, borderRadius: '4px',
                            transition: 'width 0.8s ease',
                          }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Sentiment Analysis */}
          {result.sentiment_summary && (
            <div className="card">
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', marginBottom: '16px' }}>
                💬 Public Sentiment Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {['Positive', 'Neutral', 'Negative'].map(label => {
                  const cfg = SENTIMENT_CONFIG[label]
                  const data = result.sentiment_summary[label]
                  return (
                    <div key={label} style={{
                      padding: '16px', borderRadius: 'var(--radius-md)',
                      background: cfg.bg, border: `1px solid ${cfg.color}30`,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>{cfg.icon}</div>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: 700, color: cfg.color }}>
                        {data?.percentage || 0}%
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{data?.count || 0} posts</div>
                    </div>
                  )
                })}
              </div>

              {/* Sentiment bar */}
              <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${result.sentiment_summary.Positive?.percentage || 0}%`, background: '#0D9E6E', transition: 'width 1s ease' }} />
                <div style={{ width: `${result.sentiment_summary.Neutral?.percentage || 0}%`, background: '#D97706', transition: 'width 1s ease' }} />
                <div style={{ width: `${result.sentiment_summary.Negative?.percentage || 0}%`, background: '#DC2626', transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#0D9E6E', display: 'inline-block' }} /> Positive</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#D97706', display: 'inline-block' }} /> Neutral</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#DC2626', display: 'inline-block' }} /> Negative</span>
              </div>
            </div>
          )}

          {/* Sample Promises */}
          {result.sample_promises?.length > 0 && (
            <div className="card">
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', marginBottom: '14px' }}>
                📋 Sample Extracted Promises
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.sample_promises.map((p, i) => {
                  const color = TOPIC_COLORS[p.topic] || '#888'
                  return (
                    <div key={i} style={{
                      padding: '12px 14px',
                      background: 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${color}`,
                    }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
                          background: `${color}20`, color, border: `1px solid ${color}40`
                        }}>{p.topic}</span>
                        {p.page && <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Page {p.page}</span>}
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {Math.round((p.confidence || 0) * 100)}% confidence
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: '1.5', margin: 0 }}>
                        {p.text?.slice(0, 200)}{p.text?.length > 200 ? '...' : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sample Tweets */}
          {result.sample_tweets?.length > 0 && (
            <div className="card">
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', marginBottom: '14px' }}>
                🐦 Sample Public Reactions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.sample_tweets.map((t, i) => {
                  const cfg = SENTIMENT_CONFIG[t.sentiment] || SENTIMENT_CONFIG.Neutral
                  return (
                    <div key={i} style={{
                      padding: '12px 14px',
                      background: 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${cfg.color}`,
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{cfg.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: '1.5', margin: '0 0 5px' }}>
                          {t.text}
                        </p>
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                          background: cfg.bg, color: cfg.color,
                        }}>
                          {t.sentiment} · {t.score}% confidence
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingBottom: '16px' }}>
            <a href="/promises" style={{
              padding: '12px 24px', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #FF6B2B, #D62828)',
              color: '#fff', fontWeight: 700, fontSize: '14px',
              textDecoration: 'none', fontFamily: 'Sora, sans-serif',
              boxShadow: '0 4px 16px rgba(255,107,43,0.3)',
            }}>View All Promises →</a>
            <a href="/sentiment" style={{
              padding: '12px 24px', borderRadius: 'var(--radius-md)',
              background: 'rgba(26,86,219,0.1)', border: '1.5px solid var(--color-aiadmk)',
              color: 'var(--color-aiadmk)', fontWeight: 600, fontSize: '14px', textDecoration: 'none',
            }}>View Sentiment →</a>
            <a href="/" style={{
              padding: '12px 24px', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14px', textDecoration: 'none',
            }}>Dashboard</a>
            <button onClick={reset} style={{
              padding: '12px 24px', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--color-accent)',
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)', fontWeight: 600, fontSize: '14px',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>Upload Another PDF</button>
          </div>
        </div>
      )}
    </div>
  )
}