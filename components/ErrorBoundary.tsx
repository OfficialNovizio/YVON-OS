'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md w-full text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h1 className="mb-2 text-xl font-bold text-on-surface">Something went wrong</h1>
            <p className="mb-4 text-sm text-on-surface-variant">
              A component crashed. The rest of YVON OS is unaffected.
            </p>
            <pre className="mb-4 max-h-32 overflow-auto rounded-lg bg-white/[0.04] p-3 text-left text-[11px] font-mono text-red-400">
              {this.state.error?.message ?? 'Unknown error'}
            </pre>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-accent px-4 py-2 text-sm"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm text-on-surface-variant hover:bg-white/[0.05] transition"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
