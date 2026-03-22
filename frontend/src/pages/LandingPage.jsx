// frontend/src/pages/LandingPage.jsx
// Brand colors: Jet Stream #BDD9BF, Charcoal #2E4052, Mustard #FFC857, White #FFFFFF

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  charcoal: '#2E4052',
  charcoalLight: '#3d5268',
  charcoalDark: '#1e2c38',
  jetStream: '#BDD9BF',
  jetStreamDark: '#8fb893',
  mustard: '#FFC857',
  mustardDark: '#e6ad3a',
  white: '#FFFFFF',
  offWhite: '#F8FAF8',
  textMuted: '#6b7e8a',
}

const features = [
  {
    icon: '📄',
    title: 'Manifesto Upload',
    desc: 'Upload any .txt manifesto file. Our NLP engine reads every sentence and finds political promises automatically.',
    color: C.mustard,
  },
  {
    icon: '🧠',
    title: 'AI Promise Extraction',
    desc: 'spaCy NLP identifies future-tense commitment sentences — "will provide", "shall ensure", "we commit to".',
    color: C.jetStream,
  },
  {
    icon: '🏷️',
    title: 'Topic Classification',
    desc: 'Every promise is classified into Economy, Jobs, Education, Healthcare, Welfare, or Infrastructure.',
    color: C.mustard,
  },
  {
    icon: '💬',
    title: 'Sentiment Analysis',
    desc: 'HuggingFace BERT model analyses public reactions — classifying them as Positive, Neutral, or Negative.',
    color: C.jetStream,
  },
  {
    icon: '📊',
    title: 'Polarization Gap Score',
    desc: 'A unique metric that measures the distance between what parties promise and what the public believes.',
    color: C.mustard,
  },
  {
    icon: '⚖️',
    title: 'Party Comparison',
    desc: 'Compare DMK and AIADMK side by side — topic focus, public trust, and polarization scores.',
    color: C.jetStream,
  },
]

const stats = [
  { value: '687+', label: 'Promises extracted', sub: 'from real manifestos' },
  { value: '400+', label: 'Posts analysed',     sub: 'for public sentiment' },
  { value: '6',    label: 'Topic categories',   sub: 'Economy to Healthcare' },
  { value: '2',    label: 'Parties compared',   sub: 'DMK vs AIADMK' },
]

const howItWorks = [
  { step: '01', title: 'Upload manifesto',     desc: 'Drop a .txt version of any political party manifesto into the upload page.' },
  { step: '02', title: 'NLP extraction',       desc: 'spaCy splits the text and our rule-based engine finds all promise sentences.' },
  { step: '03', title: 'Topic classification', desc: 'Each promise is matched to one of 6 policy topics using TF-IDF similarity.' },
  { step: '04', title: 'Sentiment analysis',   desc: 'HuggingFace BERT classifies public reactions into Positive / Neutral / Negative.' },
  { step: '05', title: 'View the gap',         desc: 'The polarization gap score reveals how far public trust is from party promises.' },
]

// SVG Illustrations built inline — political themed
function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '500px' }}>
      {/* Background card — manifesto document */}
      <rect x="60" y="30" width="200" height="260" rx="14" fill="#FFFFFF" stroke="#BDD9BF" strokeWidth="2"/>
      <rect x="80" y="60" width="160" height="8"  rx="4" fill="#BDD9BF" opacity="0.8"/>
      <rect x="80" y="80" width="130" height="6"  rx="3" fill="#BDD9BF" opacity="0.5"/>
      <rect x="80" y="96" width="150" height="6"  rx="3" fill="#BDD9BF" opacity="0.5"/>
      <rect x="80" y="112" width="120" height="6" rx="3" fill="#BDD9BF" opacity="0.5"/>
      {/* Highlighted promise lines */}
      <rect x="76" y="130" width="168" height="18" rx="4" fill="#FFC857" opacity="0.25"/>
      <rect x="80" y="136" width="140" height="6"  rx="3" fill="#FFC857" opacity="0.9"/>
      <rect x="76" y="156" width="168" height="18" rx="4" fill="#FFC857" opacity="0.25"/>
      <rect x="80" y="162" width="120" height="6"  rx="3" fill="#FFC857" opacity="0.9"/>
      <rect x="80" y="186" width="110" height="6"  rx="3" fill="#BDD9BF" opacity="0.5"/>
      <rect x="80" y="202" width="150" height="6"  rx="3" fill="#BDD9BF" opacity="0.5"/>
      <rect x="80" y="218" width="100" height="6"  rx="3" fill="#BDD9BF" opacity="0.5"/>
      {/* Document title */}
      <rect x="80" y="44" width="80" height="10" rx="3" fill="#2E4052" opacity="0.7"/>

      {/* Floating AI badge */}
      <rect x="220" y="50" width="120" height="44" rx="10" fill="#2E4052"/>
      <circle cx="244" cy="72" r="10" fill="#BDD9BF"/>
      <text x="244" y="76" textAnchor="middle" fontSize="11" fill="#2E4052" fontWeight="bold">AI</text>
      <rect x="262" y="64" width="64" height="6"  rx="3" fill="#BDD9BF" opacity="0.8"/>
      <rect x="262" y="76" width="48" height="5"  rx="2" fill="#FFC857" opacity="0.8"/>

      {/* Sentiment result card */}
      <rect x="240" y="120" width="180" height="100" rx="12" fill="#FFFFFF" stroke="#BDD9BF" strokeWidth="1.5"/>
      <rect x="256" y="136" width="80" height="7"   rx="3" fill="#2E4052" opacity="0.7"/>
      {/* Sentiment bars */}
      <rect x="256" y="154" width="40" height="10" rx="5" fill="#2E4052" opacity="0.15"/>
      <rect x="256" y="154" width="28" height="10" rx="5" fill="#4CAF50"/>
      <text x="302" y="163" fontSize="10" fill="#2E4052" opacity="0.7">Positive 44%</text>
      <rect x="256" y="170" width="40" height="10" rx="5" fill="#2E4052" opacity="0.15"/>
      <rect x="256" y="170" width="18" height="10" rx="5" fill="#FFC857"/>
      <text x="302" y="179" fontSize="10" fill="#2E4052" opacity="0.7">Neutral 22%</text>
      <rect x="256" y="186" width="40" height="10" rx="5" fill="#2E4052" opacity="0.15"/>
      <rect x="256" y="186" width="14" height="10" rx="5" fill="#e74c3c"/>
      <text x="302" y="195" fontSize="10" fill="#2E4052" opacity="0.7">Negative 34%</text>

      {/* Connecting arrow */}
      <path d="M260 180 L242 180" stroke="#FFC857" strokeWidth="2" strokeDasharray="4 3"
        markerEnd="url(#tip)" fill="none"/>
      <defs>
        <marker id="tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 2L8 5L2 8" fill="none" stroke="#FFC857" strokeWidth="1.5"/>
        </marker>
      </defs>

      {/* Gap score badge */}
      <rect x="250" y="240" width="155" height="52" rx="10" fill="#2E4052"/>
      <text x="270" y="260" fontSize="11" fill="#BDD9BF" opacity="0.8">Polarization gap</text>
      <text x="270" y="282" fontSize="20" fill="#FFC857" fontWeight="bold">56 / 100</text>

      {/* Decorative dots */}
      <circle cx="52"  cy="50"  r="6" fill="#BDD9BF" opacity="0.4"/>
      <circle cx="52"  cy="70"  r="4" fill="#FFC857" opacity="0.4"/>
      <circle cx="430" cy="310" r="8" fill="#2E4052" opacity="0.15"/>
      <circle cx="450" cy="290" r="5" fill="#BDD9BF" opacity="0.3"/>
    </svg>
  )
}

function NLPIllustration() {
  return (
    <svg viewBox="0 0 420 280" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '420px' }}>
      {/* Text input box */}
      <rect x="20" y="20" width="180" height="80" rx="10" fill="#FFFFFF" stroke="#BDD9BF" strokeWidth="1.5"/>
      <text x="35" y="42" fontSize="10" fill="#2E4052" opacity="0.5">Manifesto text</text>
      <rect x="30" y="50" width="140" height="5" rx="2" fill="#2E4052" opacity="0.2"/>
      <rect x="30" y="62" width="120" height="5" rx="2" fill="#2E4052" opacity="0.2"/>
      <rect x="30" y="74" width="150" height="5" rx="2" fill="#FFC857" opacity="0.8"/>
      <rect x="30" y="86" width="100" height="5" rx="2" fill="#2E4052" opacity="0.2"/>

      {/* Arrow */}
      <path d="M205 60 L245 60" stroke="#2E4052" strokeWidth="1.5" fill="none" markerEnd="url(#a2)"/>
      <defs>
        <marker id="a2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M2 2L8 5L2 8" fill="none" stroke="#2E4052" strokeWidth="1.5"/>
        </marker>
      </defs>

      {/* NLP brain circle */}
      <circle cx="285" cy="60" r="35" fill="#2E4052"/>
      <text x="285" y="55" textAnchor="middle" fontSize="11" fill="#BDD9BF" fontWeight="bold">spaCy</text>
      <text x="285" y="70" textAnchor="middle" fontSize="9" fill="#FFC857">NLP</text>

      {/* Output tags */}
      <rect x="20"  y="140" width="100" height="30" rx="8" fill="#FFC857"/>
      <text x="70"  y="160" textAnchor="middle" fontSize="10" fill="#2E4052" fontWeight="bold">Economy</text>
      <rect x="132" y="140" width="80"  height="30" rx="8" fill="#BDD9BF"/>
      <text x="172" y="160" textAnchor="middle" fontSize="10" fill="#2E4052" fontWeight="bold">Jobs</text>
      <rect x="224" y="140" width="100" height="30" rx="8" fill="#FFC857" opacity="0.7"/>
      <text x="274" y="160" textAnchor="middle" fontSize="10" fill="#2E4052" fontWeight="bold">Education</text>
      <rect x="336" y="140" width="64"  height="30" rx="8" fill="#BDD9BF" opacity="0.7"/>
      <text x="368" y="160" textAnchor="middle" fontSize="9" fill="#2E4052" fontWeight="bold">Health</text>

      {/* Connecting lines from brain */}
      <path d="M270 90 L70 138"  stroke="#BDD9BF" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.7"/>
      <path d="M278 93 L172 138" stroke="#BDD9BF" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.7"/>
      <path d="M292 93 L274 138" stroke="#BDD9BF" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.7"/>
      <path d="M300 90 L368 138" stroke="#BDD9BF" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.7"/>

      {/* Promise count badge */}
      <rect x="140" y="200" width="140" height="56" rx="10" fill="#2E4052"/>
      <text x="210" y="222" textAnchor="middle" fontSize="10" fill="#BDD9BF" opacity="0.8">Promises extracted</text>
      <text x="210" y="246" textAnchor="middle" fontSize="26" fill="#FFC857" fontWeight="bold">687</text>
    </svg>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ fontFamily: 'Sora, DM Sans, sans-serif', background: C.white, color: C.charcoal, overflowX: 'hidden' }}>

      {/* ============================================================
          NAVBAR
          ============================================================ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? C.charcoal : 'transparent',
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        boxShadow: scrolled ? '0 2px 20px rgba(46,64,82,0.3)' : 'none',
        padding: '0 40px',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '68px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: C.mustard,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>🗳️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: C.white, lineHeight: 1.1 }}>
                Promise vs Perception
              </div>
              <div style={{ fontSize: '10px', color: C.jetStream, letterSpacing: '0.05em' }}>
                Tamil Nadu · NLP Analysis
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            {['Features', 'How it works', 'About'].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} style={{
                fontSize: '14px', fontWeight: 500,
                color: C.jetStream, textDecoration: 'none',
                opacity: 0.85,
              }}>{link}</a>
            ))}
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '8px 22px', borderRadius: '24px',
                background: C.mustard, color: C.charcoal,
                border: 'none', fontWeight: 700, fontSize: '14px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Open Dashboard →
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section style={{
        background: C.charcoal,
        minHeight: '92vh',
        display: 'flex', alignItems: 'center',
        padding: '80px 40px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative shapes */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: C.jetStream, opacity: 0.06, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: C.mustard, opacity: 0.06, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: C.jetStream, opacity: 0.08, pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>

          {/* Left: Text */}
          <div>
            {/* Tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '20px',
              background: 'rgba(189,217,191,0.15)',
              border: `1px solid ${C.jetStream}40`,
              marginBottom: '24px',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.jetStream }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: C.jetStream, letterSpacing: '0.06em' }}>
                AI-POWERED POLITICAL ANALYSIS
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800, lineHeight: 1.1,
              color: C.white,
              marginBottom: '20px',
            }}>
              What Parties{' '}
              <span style={{ color: C.mustard }}>Promise</span>
              {' '}vs What People{' '}
              <span style={{ color: C.jetStream }}>Perceive</span>
            </h1>

            <p style={{
              fontSize: '17px', lineHeight: 1.7,
              color: 'rgba(255,255,255,0.65)',
              marginBottom: '36px', maxWidth: '500px',
            }}>
              An NLP-powered platform that extracts political promises from Tamil Nadu party manifestos, analyses public sentiment, and reveals the polarization gap.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '14px 32px', borderRadius: '30px',
                  background: C.mustard, color: C.charcoal,
                  border: 'none', fontWeight: 700, fontSize: '15px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: `0 6px 24px ${C.mustard}55`,
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
              >
                View Dashboard →
              </button>
              <button
                onClick={() => navigate('/upload')}
                style={{
                  padding: '14px 32px', borderRadius: '30px',
                  background: 'transparent', color: C.white,
                  border: `2px solid ${C.jetStream}80`,
                  fontWeight: 600, fontSize: '15px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.target.style.background = C.jetStream + '20'; e.target.style.borderColor = C.jetStream }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = C.jetStream + '80' }}
              >
                Upload Manifesto
              </button>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'flex', gap: '32px', marginTop: '44px' }}>
              {[
                { num: '687+', label: 'Promises' },
                { num: '400+', label: 'Posts' },
                { num: '2',    label: 'Parties' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: C.mustard }}>{s.num}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Illustration */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS BAND
          ============================================================ */}
      <section style={{ background: C.mustard, padding: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '42px', fontWeight: 800, color: C.charcoal, fontFamily: 'Sora, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.charcoal, marginTop: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: C.charcoalLight, marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          FEATURES
          ============================================================ */}
      <section id="features" style={{ padding: '100px 40px', background: C.offWhite }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Section heading */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-block', width: '48px', height: '4px', borderRadius: '2px', background: C.mustard, marginBottom: '16px' }} />
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: C.charcoal, marginBottom: '12px' }}>
              What this platform does
            </h2>
            <p style={{ fontSize: '16px', color: C.textMuted, maxWidth: '500px', margin: '0 auto' }}>
              Six powerful features built on open-source AI and NLP tools
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: C.white,
                borderRadius: '16px',
                padding: '28px',
                border: `1px solid ${C.jetStream}60`,
                borderTop: `4px solid ${f.color}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(46,64,82,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: f.color + '25',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '16px',
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: C.charcoal, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: C.textMuted, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ============================================================ */}
      <section id="how-it-works" style={{ padding: '100px 40px', background: C.white }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

          {/* Left: illustration */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <NLPIllustration />
          </div>

          {/* Right: steps */}
          <div>
            <div style={{ display: 'inline-block', width: '48px', height: '4px', borderRadius: '2px', background: C.jetStream, marginBottom: '16px' }} />
            <h2 style={{ fontSize: '34px', fontWeight: 800, color: C.charcoal, marginBottom: '36px' }}>
              How it works
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {howItWorks.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '20px', paddingBottom: i < howItWorks.length - 1 ? '28px' : '0', position: 'relative' }}>
                  {/* Step number + vertical line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: i % 2 === 0 ? C.mustard : C.jetStream,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '13px', color: C.charcoal,
                      flexShrink: 0,
                    }}>{step.step}</div>
                    {i < howItWorks.length - 1 && (
                      <div style={{ width: '2px', flex: 1, background: `${C.jetStream}50`, marginTop: '6px', minHeight: '20px' }} />
                    )}
                  </div>
                  <div style={{ paddingTop: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: C.charcoal, marginBottom: '4px' }}>{step.title}</div>
                    <div style={{ fontSize: '13px', color: C.textMuted, lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PARTIES SECTION
          ============================================================ */}
      <section style={{ padding: '80px 40px', background: C.charcoal }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-block', width: '48px', height: '4px', borderRadius: '2px', background: C.mustard, marginBottom: '16px' }} />
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: C.white, marginBottom: '10px' }}>
              Parties analysed
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)' }}>Tamil Nadu 2021 Assembly Election</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>
            {[
              { name: 'DMK', full: 'Dravida Munnetra Kazhagam', color: '#e74c3c', promises: '687', founded: '1949', leader: 'M. K. Stalin' },
              { name: 'AIADMK', full: 'All India Anna Dravida Munnetra Kazhagam', color: '#3498db', promises: '15+', founded: '1972', leader: 'Edappadi K. Palaniswami' },
            ].map(party => (
              <div key={party.name} style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${party.color}40`,
                borderTop: `4px solid ${party.color}`,
                borderRadius: '16px', padding: '28px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: party.color }} />
                  <span style={{ fontSize: '22px', fontWeight: 800, color: C.white }}>{party.name}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', lineHeight: 1.4 }}>{party.full}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Promises', val: party.promises },
                    { label: 'Founded', val: party.founded },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: C.mustard }}>{item.val}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{item.label}</div>
                    </div>
                  ))}
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: C.jetStream }}>{party.leader.split(' ')[0]}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Leader</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA SECTION
          ============================================================ */}
      <section style={{ padding: '100px 40px', background: C.jetStream }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '38px', fontWeight: 800, color: C.charcoal, marginBottom: '16px', lineHeight: 1.15 }}>
            Ready to explore the gap?
          </h2>
          <p style={{ fontSize: '17px', color: C.charcoalLight, marginBottom: '36px', lineHeight: 1.6 }}>
            Upload a manifesto .txt file and see the complete NLP analysis — promises, topics, sentiment, and polarization score — in under 60 seconds.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '15px 36px', borderRadius: '30px',
                background: C.charcoal, color: C.white,
                border: 'none', fontWeight: 700, fontSize: '16px',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 24px rgba(46,64,82,0.3)',
              }}
            >
              Open Dashboard
            </button>
            <button
              onClick={() => navigate('/upload')}
              style={{
                padding: '15px 36px', borderRadius: '30px',
                background: C.mustard, color: C.charcoal,
                border: 'none', fontWeight: 700, fontSize: '16px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Upload Manifesto →
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer style={{ background: C.charcoalDark, padding: '32px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: C.mustard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🗳️</div>
            <span style={{ fontWeight: 700, color: C.white, fontSize: '14px' }}>Promise vs Perception</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Tamil Nadu Political NLP Analysis · Built with React + FastAPI · spaCy + HuggingFace BERT
          </p>
        </div>
      </footer>
    </div>
  )
}