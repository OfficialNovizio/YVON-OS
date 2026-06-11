'use client'

// Shared data-fetching hook for YVON-OS pages.
// Every page calls this instead of inline fetch + useState + useEffect.
// Handles loading, error, and mock-fallback uniformly.

import { useState, useEffect, useCallback } from 'react'

interface UseLiveDataOptions<T> {
  url: string
  mockData?: T
  pollIntervalMs?: number
  enabled?: boolean
}

interface UseLiveDataResult<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  refetch: () => void
  source: 'live' | 'mock' | 'error'
}

export function useLiveData<T = unknown>({
  url,
  mockData,
  pollIntervalMs,
  enabled = true,
}: UseLiveDataOptions<T>): UseLiveDataResult<T> {
  const [data, setData] = useState<T | undefined>(mockData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'mock' | 'error'>('mock')

  const fetchData = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json as T)
      setSource(json?.source === 'mock' ? 'mock' : 'live')
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setSource('error')
      // Keep mock data visible on error
      if (mockData) setData(mockData)
    } finally {
      setLoading(false)
    }
  }, [url, enabled])

  useEffect(() => {
    fetchData()
    if (pollIntervalMs && pollIntervalMs > 0) {
      const interval = setInterval(fetchData, pollIntervalMs)
      return () => clearInterval(interval)
    }
  }, [fetchData, pollIntervalMs])

  return { data, loading, error, refetch: fetchData, source }
}
// No aliases — prefer useLiveData directly.
