// frontend/src/services/api.js
//
// WHY THIS FILE:
// All API calls are centralized here.
// Instead of writing fetch() everywhere in components,
// we define each API call as a named function.
//
// BENEFITS:
// - One place to update if the URL changes
// - Easy to mock for testing
// - Consistent error handling
//
// WHY AXIOS over fetch():
// - Automatically parses JSON responses
// - Better error handling (throws on 4xx/5xx)
// - Supports request cancellation
// - Cleaner syntax

import axios from 'axios'

// Base URL — in development, Vite proxy forwards /api to localhost:8000
// In production, set VITE_API_URL in your Vercel environment variables
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Create axios instance with default settings
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,  // 30 second timeout — NLP can be slow
  headers: {
    'Content-Type': 'application/json'
  }
})

// === PROMISE ENDPOINTS ===

/**
 * Get all promises with optional filters
 * @param {Object} params - { party, topic, search, limit, offset }
 */
export const getPromises = (params = {}) =>
  api.get('/promises', { params }).then(res => res.data)

/**
 * Get promise statistics (counts by party and topic)
 * @param {string} party - Optional party filter
 */
export const getPromiseStats = (party = null) =>
  api.get('/promises/stats', { params: party ? { party } : {} }).then(res => res.data)

// === SENTIMENT ENDPOINTS ===

/**
 * Get sentiment breakdown for a party
 * @param {string} party - "DMK" or "AIADMK" or null for all
 */
export const getSentimentSummary = (party = null) =>
  api.get('/sentiment/summary', { params: party ? { party } : {} }).then(res => res.data)

/**
 * Get sentiment comparison side by side for all parties
 */
export const getSentimentComparison = () =>
  api.get('/sentiment/comparison').then(res => res.data)

/**
 * Get posts with optional filters
 * @param {Object} params - { party, sentiment, limit }
 */
export const getPosts = (params = {}) =>
  api.get('/posts', { params }).then(res => res.data)

// === ANALYTICS ENDPOINTS ===

/**
 * Get ALL dashboard data in one request
 * @param {string} party - Optional party filter
 */
export const getDashboardSummary = (party = null) =>
  api.get('/dashboard-summary', { params: party ? { party } : {} }).then(res => res.data)

/**
 * Get polarization gap scores for each party
 */
export const getPolarizationScore = () =>
  api.get('/polarization-score').then(res => res.data)

// === UPLOAD ===

/**
 * Upload a PDF manifesto for processing
 * @param {File} file - The PDF file
 * @param {string} party - Party name
 * @param {number} year - Manifesto year
 */
export const uploadManifesto = (file, party, year) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/promises/upload-manifesto?party=${party}&year=${year}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

export default api