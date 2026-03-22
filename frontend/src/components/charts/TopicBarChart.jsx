// frontend/src/components/charts/TopicBarChart.jsx
//
// WHY THIS FILE:
// Bar chart showing how many promises fall into each topic category.
// Uses Chart.js Bar component.
//
// PROPS:
// - data: { Economy: 12, Jobs: 18, Education: 15, ... }
// - title: "Promises by Topic"
// - party: "DMK" (affects color)

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

// Color for each topic — gives each bar a distinct color
const TOPIC_COLORS = {
  Economy:        '#7C3AED',   // purple
  Jobs:           '#2DC653',   // green
  Education:      '#457B9D',   // blue
  Healthcare:     '#E63946',   // red
  Welfare:        '#F4A261',   // amber
  Infrastructure: '#06B6D4',   // cyan
}

export default function TopicBarChart({ data, title = 'Promises by Topic', party }) {
  if (!data) return null

  const labels = Object.keys(data)
  const values = Object.values(data)

  const colors = labels.map(topic => TOPIC_COLORS[topic] || '#94A3B8')
  const bgColors = colors.map(c => c + 'BB')  // Add transparency

  const chartData = {
    labels,
    datasets: [{
      label: party ? `${party} Promises` : 'Promises',
      data: values,
      backgroundColor: bgColors,
      borderColor: colors,
      borderWidth: 2,
      borderRadius: 6,       // Rounded bar tops
      borderSkipped: false,  // Round all corners
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',   // ← Makes it a HORIZONTAL bar chart (easier to read labels)

    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161A23',
        borderColor: '#2A3045',
        borderWidth: 1,
        titleColor: '#F1F5F9',
        bodyColor: '#94A3B8',
        callbacks: {
          label: (context) => ` ${context.parsed.x} promises`
        }
      }
    },

    scales: {
      x: {
        grid: {
          color: 'rgba(42, 48, 69, 0.6)',
          drawTicks: false,
        },
        ticks: {
          color: '#64748B',
          font: { size: 12 },
          stepSize: 1,
        },
        border: { display: false }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#94A3B8',
          font: { size: 13, weight: '500' },
        },
        border: { display: false }
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
    </div>
  )
}