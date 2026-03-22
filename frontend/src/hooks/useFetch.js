// frontend/src/hooks/useFetch.js
//
// WHY THIS FILE:
// This is a "custom hook" — a reusable piece of stateful logic.
// Any component that needs to fetch data can use this instead of
// repeating the same useState + useEffect pattern everywhere.
//
// WHAT IT DOES:
// - Tracks loading state (show spinner while fetching)
// - Tracks error state (show error message if API fails)
// - Stores the fetched data
// - Re-fetches when dependencies change (e.g. party filter changes)
//
// USAGE in a component:
//   const { data, loading, error } = useFetch(getDashboardSummary, [selectedParty], selectedParty)

import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for API data fetching with loading and error states.
 *
 * @param {Function} fetchFn - The API function to call (from api.js)
 * @param {Array} deps - Re-fetch when any of these values change
 * @param {...any} args - Arguments to pass to fetchFn
 */
export function useFetch(fetchFn, deps = [], ...args) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchFn(...args)
      setData(result)
    } catch (err) {
      // Extract a human-readable error message
      const message =
        err.response?.data?.detail ||   // FastAPI error detail
        err.message ||                  // Network error
        'Something went wrong'
      setError(message)
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  // Run on mount and whenever deps change
  useEffect(() => {
    execute()
  }, [execute])

  return { data, loading, error, refetch: execute }
}

/**
 * Simpler hook for manual triggering (e.g. on button click)
 */
export function useManualFetch() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (fetchFn, ...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn(...args)
      setData(result)
      return result
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Error'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, execute }
}