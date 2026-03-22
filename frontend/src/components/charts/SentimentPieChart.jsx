// frontend/src/components/charts/SentimentPieChart.jsx
//
// WHY THIS FILE:
// Renders a doughnut (pie) chart showing sentiment distribution.
// Uses react-chartjs-2, which is a React wrapper around Chart.js.
//
// WHAT IS Chart.js:
// A JavaScript library that draws charts on an HTML <canvas> element.
// We configure it with a data object and options, and it draws automatically.
//
// PROPS:
// - data: { Positive: {count, percentage}, Neutral: {...}, Negative: {...} }
// - title: "Sentiment for DMK"

import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components — required in Chart.js v4
// (Chart.js is "tree-shakeable" — only load what you use)
ChartJS.register(ArcElement, Tooltip, Legend)

export default function SentimentPieChart({ data, title = 'Sentiment Distribution' }) {
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
        No data available
      </div>
    )
  }

  // Build Chart.js data structure from our API response
  const chartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [
        data.Positive?.count || 0,
        data.Neutral?.count  || 0,
        data.Negative?.count || 0,
      ],
      backgroundColor: [
        'rgba(45, 198, 83, 0.85)',   // green = positive
        'rgba(244, 162, 97, 0.85)',  // amber = neutral
        'rgba(230, 57, 70, 0.85)',   // red   = negative
      ],
      borderColor: [
        '#2DC653',
        '#F4A261',
        '#E63946',
      ],
      borderWidth: 2,
      hoverOffset: 8,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',  // Makes it a doughnut instead of solid pie

    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94A3B8',       // --color-text-secondary
          font: { size: 13, family: 'DM Sans' },
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
        }
      },
      tooltip: {
        backgroundColor: '#161A23',
        borderColor: '#2A3045',
        borderWidth: 1,
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        callbacks: {
          // Custom tooltip: shows "Positive: 45.2% (226 posts)"
          label: (context) => {
            const label = context.label
            const count = context.parsed
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
            return ` ${label}: ${percentage}% (${count} posts)`
          }
        }
      }
    }
  }

  return (
    <div className="card fade-in">
      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '16px',
        marginBottom: '20px',
        color: 'var(--color-text-primary)',
      }}>
        {title}
      </h3>

      {/* Center label showing dominant sentiment */}
      <div style={{ position: 'relative' }}>
        <Doughnut data={chartData} options={options} />

        {/* Center text overlay */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}>
            {data.Positive?.percentage || 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Positive
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginTop: '16px',
      }}>
        {[
          { label: 'Positive', color: 'var(--color-positive)', key: 'Positive' },
          { label: 'Neutral',  color: 'var(--color-neutral)',  key: 'Neutral' },
          { label: 'Negative', color: 'var(--color-negative)', key: 'Negative' },
        ].map(item => (
          <div
            key={item.key}
            style={{
              textAlign: 'center',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-2)',
            }}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: item.color,
              fontFamily: 'var(--font-display)',
            }}>
              {data[item.key]?.percentage || 0}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}