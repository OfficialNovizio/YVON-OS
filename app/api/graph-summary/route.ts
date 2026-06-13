// ── GET /api/graph-summary ────────────────────────────────────────────────────
// Reads .toon/graphs/graph.json and returns the top 30 nodes by degree
// plus their inter-edges. Keeps response under ~5KB for the CEO dashboard panel.

import { promises as fs } from 'fs'
import path from 'path'

interface RawNode {
  id: string
  label: string
  file_type: string
  community: number
  source_file?: string
}

interface RawEdge {
  source: string
  target: string
  weight?: number
}

interface RawGraph {
  nodes: RawNode[]
  edges: RawEdge[]
  links?: RawEdge[]
}

export interface GraphSummaryNode {
  id: string
  label: string
  community: number
  degree: number
  fileType: string
}

export interface GraphSummaryEdge {
  source: string
  target: string
}

export interface GraphSummaryResponse {
  nodes: GraphSummaryNode[]
  edges: GraphSummaryEdge[]
  totalNodes: number
  totalEdges: number
  totalCommunities: number
  generatedAt: string
}

// 10-minute TTL cache — refreshes automatically after `npm run graphify:build`
let cache: GraphSummaryResponse | null = null
let cacheExpiresAt = 0

export async function GET(): Promise<Response> {
  if (cache && Date.now() < cacheExpiresAt) {
    return Response.json(cache)
  }

  try {
    const graphPath = path.join(process.cwd(), '.toon/graphs', 'graph.json')
    const raw = await fs.readFile(graphPath, 'utf-8')
    const graph = JSON.parse(raw) as RawGraph

    const edges: RawEdge[] = graph.edges ?? graph.links ?? []

    // ── Count degree per node ─────────────────────────────────────────────────
    const degreeMap: Record<string, number> = {}
    for (const node of graph.nodes) {
      degreeMap[node.id] = 0
    }
    for (const edge of edges) {
      degreeMap[edge.source] = (degreeMap[edge.source] ?? 0) + 1
      degreeMap[edge.target] = (degreeMap[edge.target] ?? 0) + 1
    }

    // ── Pick top 40 nodes by degree ───────────────────────────────────────────
    const topNodes = [...graph.nodes]
      .sort((a, b) => (degreeMap[b.id] ?? 0) - (degreeMap[a.id] ?? 0))
      .slice(0, 40)

    const topIds = new Set(topNodes.map(n => n.id))

    // ── Keep only edges where both endpoints are in the top set ───────────────
    const filteredEdges = edges
      .filter(e => topIds.has(e.source) && topIds.has(e.target))
      .slice(0, 80)

    const communities = new Set(graph.nodes.map(n => n.community)).size

    const result: GraphSummaryResponse = {
      nodes: topNodes.map(n => ({
        id:        n.id,
        label:     n.label,
        community: n.community,
        degree:    degreeMap[n.id] ?? 0,
        fileType:  n.file_type,
      })),
      edges: filteredEdges.map(e => ({ source: e.source, target: e.target })),
      totalNodes:       graph.nodes.length,
      totalEdges:       edges.length,
      totalCommunities: communities,
      generatedAt: new Date().toISOString(),
    }

    cache = result
    cacheExpiresAt = Date.now() + 10 * 60 * 1000
    return Response.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Return empty-state so the UI can show a fallback gracefully
    return Response.json({
      nodes: [],
      edges: [],
      totalNodes: 0,
      totalEdges: 0,
      totalCommunities: 0,
      generatedAt: new Date().toISOString(),
      error: msg,
    })
  }
}
