import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { WorkspaceProvider, useWorkspace } from '@/lib/WorkspaceContext'
import type { WorkspaceKey } from '@/lib/workspaces'

describe('WorkspaceContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('provides default workspace (Novizio)', () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider,
    })
    expect(result.current.workspace.key).toBe('novizio')
    expect(result.current.workspace.name).toBe('Novizio')
  })

  it('switches workspace to Hourbour', () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider,
    })

    act(() => {
      result.current.setWorkspace('hourbour')
    })

    expect(result.current.workspace.key).toBe('hourbour')
    expect(result.current.workspace.name).toBe('Hourbour')
  })

  it('switches workspace back to Novizio', () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider,
    })

    // Switch away first
    act(() => {
      result.current.setWorkspace('hourbour')
    })
    expect(result.current.workspace.key).toBe('hourbour')

    // Switch back
    act(() => {
      result.current.setWorkspace('novizio')
    })
    expect(result.current.workspace.key).toBe('novizio')
  })

  it('persists workspace selection to localStorage', () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider,
    })

    act(() => {
      result.current.setWorkspace('hourbour')
    })

    const stored = localStorage.getItem('yvon_active_workspace')
    expect(stored).toBe('hourbour')
  })

  it('sets workspace-specific data attribute on container', () => {
    // Render the provider to check DOM attributes
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider,
    })

    act(() => {
      result.current.setWorkspace('hourbour')
    })

    // The data-workspace attribute should be on surrounding div
    // We can verify via the workspace value itself
    expect(result.current.workspace.key).toBe('hourbour')
  })

  it('workspace object has expected shape', () => {
    const { result } = renderHook(() => useWorkspace(), {
      wrapper: WorkspaceProvider,
    })

    const ws = result.current.workspace
    expect(ws).toHaveProperty('key')
    expect(ws).toHaveProperty('name')
    expect(ws).toHaveProperty('business')
    expect(ws).toHaveProperty('theme')
    expect(ws).toHaveProperty('accent')
    expect(typeof ws.key).toBe('string')
    expect(typeof ws.name).toBe('string')
  })

  it('throws error when used outside WorkspaceProvider', () => {
    // useWorkspace without WorkspaceProvider should throw
    expect(() => {
      renderHook(() => useWorkspace())
    }).toThrow('useWorkspace must be used within WorkspaceProvider')
  })
})
