// frontend/src/pages/SentimentPage.jsx
//
// WHY THIS FILE:
// Deep-dive into sentiment data for each party.
// Shows the pie chart + sample tweets for each sentiment category.
// Lets users explore WHAT people are saying about each party.

import React, { useState, useEffect } from 'react'
import PartyFilter from '../components/PartyFilter'
import SentimentPieChart from '../components/charts/SentimentPieChart'
import { getSentimentSummary, getPosts } from '../services/api'

const SENTIMENT_ICONS = {
  Positive: { icon: '✅', color: 'var(--color-positive)' },
  Neutral:  { icon: '⚪', color: 'var(--color-neutral)' },
  Negative: { icon: '❌', color: 'var(--color-negative)' },
}

export default function SentimentPage() {
  const [selectedParty, setSelectedParty] = useState('DMK')
  const [selectedSentiment, setSelectedSentiment] = useState(null)
  const [sentimentData, setSentimentData] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)

  // Fetch sentiment summary when party changes
  useEffect(() => {
    setLoading(true)
    getSentimentSummary(selectedParty)
      .then(setSentimentData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedParty])

  // Fetch sample posts when party or sentiment filter changes
  useEffect(() => {
    setPostsLoading(true)
    const params = { limit: 15 }
    if (selectedParty) params.party = selectedParty
    if (selectedSentiment) params.sentiment = selectedSentiment

    getPosts(params)
      .then(setPosts)
      .catch(console.error)
      .finally(() => setPostsLoading(false))
  }, [selectedParty, selectedSentiment])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ---- HEADER ---- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '6px' }}>
            💬 Sentiment Analysis
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Public reaction to party promises from X (Twitter) posts
          </p>
        </div>
        <PartyFilter selected={selectedParty} onChange={setSelectedParty} />
      </div>

      {/* ---- SENTIMENT OVERVIEW ---- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>

        {/* Pie Chart */}
        {loading ? (
          <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <SentimentPieChart
            data={sentimentData}
            title={`Sentiment — ${selectedParty || 'All Parties'}`}
          />
        )}

        {/* Sentiment Breakdown Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--color-text-primary)' }}>
            Breakdown
          </h3>

          {['Positive', 'Neutral', 'Negative'].map(sentiment => {
            const { icon, color } = SENTIMENT_ICONS[sentiment]
            const info = sentimentData?.[sentiment]
            const isSelected = selectedSentiment === sentiment

            return (
              <button
                key={sentiment}
                onClick={() => setSelectedSentiment(isSelected ? null : sentiment)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  background: isSelected ? `${color}15` : 'var(--color-surface)',
                  border: `1px solid ${isSelected ? color : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition)',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: '24px' }}>{icon}</span>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {sentiment}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {info?.count ?? 0} posts
                  </div>
                </div>

                {/* Percentage */}
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color,
                }}>
                  {info?.percentage ?? 0}%
                </div>
              </button>
            )
          })}

          {selectedSentiment && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Showing posts filtered by <strong style={{ color: 'var(--color-text-primary)' }}>{selectedSentiment}</strong> sentiment.
              Click again to clear.
            </p>
          )}
        </div>
      </div>

      {/* ---- SAMPLE POSTS ---- */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '16px' }}>
          📱 Sample Posts
          {selectedSentiment && (
            <span style={{
              marginLeft: '10px',
              fontSize: '14px',
              padding: '2px 10px',
              borderRadius: '12px',
              background: `${SENTIMENT_ICONS[selectedSentiment]?.color}22`,
              color: SENTIMENT_ICONS[selectedSentiment]?.color,
            }}>
              {SENTIMENT_ICONS[selectedSentiment]?.icon} {selectedSentiment}
            </span>
          )}
        </h2>

        {postsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {posts.length > 0 ? posts.map(post => (
              <TweetCard key={post.id} post={post} />
            )) : (
              <div style={{
                textAlign: 'center', padding: '40px',
                color: 'var(--color-text-muted)',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--color-border)',
              }}>
                No posts found. Run the data pipeline first.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- TWEET CARD (internal component) ----
function TweetCard({ post }) {
  const { icon, color } = SENTIMENT_ICONS[post.sentiment_label] || SENTIMENT_ICONS.Neutral
  const partyColor = post.party === 'DMK' ? 'var(--color-dmk)' : 'var(--color-aiadmk)'

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Avatar placeholder */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--color-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}>
            👤
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              @{post.username || 'user'}
            </div>
            {post.tweet_date && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {new Date(post.tweet_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Sentiment badge */}
        <span style={{
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          background: `${color}20`,
          color,
        }}>
          {icon} {post.sentiment_label}
          {post.sentiment_score && ` ${Math.round(post.sentiment_score * 100)}%`}
        </span>
      </div>

      {/* Tweet text */}
      <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5', margin: 0 }}>
        {post.text}
      </p>

      {/* Footer */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        <span style={{ color: partyColor, fontWeight: 600 }}>{post.party}</span>
        {post.likes_count > 0 && <span>♥ {post.likes_count}</span>}
      </div>
    </div>
  )
}