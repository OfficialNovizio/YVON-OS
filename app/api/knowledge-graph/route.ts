// GET /api/knowledge-graph — brain & wiki data (nodes + edges + docs)
// Returns topic nodes for the 3D knowledge graph, plus Library documents.
// Reads from Supabase agent_memory and venture_documents tables.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface GraphNode {
  id: string
  label: string
  size: number
  color: string
  visibility: 'private' | 'team' | 'workspace' | 'cross-workspace'
  workspace: string
  connections: string[]
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
}

export interface LibraryDoc {
  id: string
  title: string
  category: string
  visibility: string
  workspace: string
  updatedAt: string
  answer: string
  findings: string
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const visibility = url.searchParams.get('visibility') ?? 'all'

  try {
    const { data: memories } = await supabase
      .from('agent_memory')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const docs: LibraryDoc[] = []

    if (memories && memories.length > 0) {
      const topicMap = new Map<string, { count: number; workspace: string; visibility: string }>()
      for (const m of memories) {
        const topic = m.topic ?? m.memory_type ?? 'general'
        const existing = topicMap.get(topic) ?? { count: 0, workspace: m.venture_slug ?? 'vibe', visibility: 'workspace' }
        existing.count++
        topicMap.set(topic, existing)

        docs.push({
          id: m.id,
          title: m.title ?? topic,
          category: m.memory_type ?? 'general',
          visibility: 'workspace',
          workspace: m.venture_slug ?? 'vibe',
          updatedAt: m.created_at,
          answer: m.content?.slice(0, 300) ?? 'No summary available.',
          findings: m.content?.slice(0, 500) ?? '',
        })
      }

      let idx = 0
      const colors = ['#abc7ff', '#5fd0b4', '#c08bff', '#5ee0ff', '#ffb693']
      for (const [topic, info] of topicMap) {
        nodes.push({
          id: `node-${idx}`,
          label: topic,
          size: Math.min(info.count * 10, 80),
          color: colors[idx % colors.length],
          visibility: info.visibility as GraphNode['visibility'],
          workspace: info.workspace,
          connections: [],
        })
        idx++
      }

      // Create edges between nodes in same workspace
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].workspace === nodes[j].workspace) {
            edges.push({ source: nodes[i].id, target: nodes[j].id, weight: 0.5 })
          }
        }
      }
    }

    // Filter by visibility
    const filteredNodes = visibility === 'all' ? nodes : nodes.filter((n) => n.visibility === visibility)

    return Response.json({
      nodes: filteredNodes.length > 0 ? filteredNodes : MOCK_NODES,
      edges: edges.length > 0 ? edges : MOCK_EDGES,
      docs: docs.length > 0 ? docs : MOCK_DOCS,
      topicsCount: filteredNodes.length || MOCK_NODES.length,
      documentsCount: docs.length || MOCK_DOCS.length,
      source: memories && memories.length > 0 ? 'live' : 'mock',
    })
  } catch (err) {
    return Response.json({
      nodes: MOCK_NODES, edges: MOCK_EDGES, docs: MOCK_DOCS,
      topicsCount: MOCK_NODES.length, documentsCount: MOCK_DOCS.length,
      source: 'mock', error: String(err),
    }, { status: 500 })
  }
}

const MOCK_NODES: GraphNode[] = [
  { id: 'n1', label: 'Agent Automation', size: 45, color: '#abc7ff', visibility: 'workspace', workspace: 'vibe', connections: ['n2', 'n3'] },
  { id: 'n2', label: 'Social Media Strategy', size: 32, color: '#5fd0b4', visibility: 'workspace', workspace: 'vibe', connections: ['n1'] },
  { id: 'n3', label: 'E-commerce Metrics', size: 38, color: '#c08bff', visibility: 'workspace', workspace: 'novizio', connections: ['n1', 'n4'] },
  { id: 'n4', label: 'Competitor Intelligence', size: 28, color: '#5ee0ff', visibility: 'workspace', workspace: 'novizio', connections: ['n3'] },
  { id: 'n5', label: 'Fintech SaaS', size: 25, color: '#ffb693', visibility: 'workspace', workspace: 'hourbour', connections: [] },
]

const MOCK_EDGES: GraphEdge[] = [
  { source: 'n1', target: 'n2', weight: 0.8 },
  { source: 'n1', target: 'n3', weight: 0.6 },
  { source: 'n3', target: 'n4', weight: 0.7 },
]

const MOCK_DOCS: LibraryDoc[] = [
  { id: 'd1', title: 'Is agent-as-a-service real demand?', category: 'research', visibility: 'workspace', workspace: 'vibe', updatedAt: new Date().toISOString(), answer: 'Yes — mentions up 3x in 30 days. Founders searching for done-for-you agent ops.', findings: 'Twitter/LinkedIn mentions growing. Window to claim the category name.' },
  { id: 'd2', title: 'Summer 2026 collection strategy', category: 'brand', visibility: 'workspace', workspace: 'novizio', updatedAt: new Date().toISOString(), answer: 'Focus on sustainable fabrics + bold colors. Instagram reels perform best.', findings: 'Analysis from 5 competitor collections. Reels = 3x engagement vs static.' },
  { id: 'd3', title: 'Hourbour pricing model analysis', category: 'finance', visibility: 'team', workspace: 'hourbour', updatedAt: new Date().toISOString(), answer: 'Current $29/mo is below market. Recommend $49/mo with 14-day trial.', findings: 'Competitors charge $39-79. Churn is 4.2%, below industry 5-7%.' },
]
