// frontend/src/components/charts/ComparisonBarChart.jsx
//
// WHY THIS FILE:
// Shows DMK vs AIADMK sentiment side by side.
// Each group of bars = one sentiment type (Positive/Neutral/Negative).
// Two bars per group = one per party.
//
// PROPS:
// - data: { DMK: {Positive: 45, Neutral: 30, Negative: 25}, AIADMK: {...} }

import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function ComparisonBarChart({ data, title = 'Party Sentiment Comparison' }) {
  if (!data) return null

  const parties = Object.keys(data)
  const sentiments = ['Positive', 'Neutral', 'Negative']

  const sentimentColors = {
    Positive: { bg: 'rgba(45, 198, 83, 0.75)', border: '#2DC653' },
    Neutral:  { bg: 'rgba(244, 162, 97, 0.75)', border: '#F4A261' },
    Negative: { bg: 'rgba(230, 57, 70, 0.75)', border: '#E63946' },
  }

  // Build dataset — one per sentiment label
  // Chart.js will group bars by label and show side by side
  const datasets = parties.map((party, i) => ({
    label: party,
    data: sentiments.map(s => data[party]?.[s] ?? 0),
    backgroundColor: i === 0 ? 'rgba(230, 57, 70, 0.8)' : 'rgba(69, 123, 157, 0.8)',
    borderColor: i === 0 ? '#E63946' : '#457B9D',
    borderWidth: 2,
    borderRadius: 5,
  }))

  const chartData = {
    labels: sentiments,
    datasets,
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,

    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94A3B8',
          font: { size: 13, family: 'DM Sans' },
          usePointStyle: true,
          pointStyleWidth: 10,
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: '#161A23',
        borderColor: '#2A3045',
        borderWidth: 1,
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`
        }
      }
    },

    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8', font: { size: 13 } },
        border: { display: false },
      },
      y: {
        max: 100,
        grid: { color: 'rgba(42, 48, 69, 0.6)' },
        ticks: {
          color: '#64748B',
          font: { size: 12 },
          callback: (val) => val + '%'
        },
        border: { display: false },
      }
    }
  }

  return (
    <div className="card fade-in">
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '16px',
        marginBottom: '20px',
        color: 'var(--color-text-primary)',
      }}>
        {title}
      </h3>

      <Bar data={chartData} options={options} />

      {/* Polarization Note */}
      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--color-border)',
        paddingTop: '12px',
      }}>
        ℹ️ Percentages show the share of analyzed posts per party. Higher positive % = more public approval for that party.
      </p>
    </div>
  )
}