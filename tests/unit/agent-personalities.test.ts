import { describe, it, expect } from 'vitest'
import {
  AGENT_PERSONALITIES,
  AgentPersonality,
  getAgentPersonality,
  getPersonalityExtension,
} from '@/lib/agent-personalities'

describe('Agent Personalities', () => {
  it('should have exactly 13 agents', () => {
    expect(AGENT_PERSONALITIES).toHaveLength(13)
  })

  it('every agent should have a valid personality object', () => {
    for (const agent of AGENT_PERSONALITIES) {
      // Required fields must be non-empty strings
      expect(agent.shortId).toBeTruthy()
      expect(typeof agent.shortId).toBe('string')
      expect(agent.agentId).toBeTruthy()
      expect(typeof agent.agentId).toBe('string')
      expect(agent.name).toBeTruthy()
      expect(typeof agent.name).toBe('string')
      expect(agent.personality).toBeTruthy()
      expect(typeof agent.personality).toBe('string')
      expect(agent.model).toBeTruthy()
      expect(typeof agent.model).toBe('string')
    }
  })

  it('every agent personality should be at least 100 characters (meaningful)', () => {
    for (const agent of AGENT_PERSONALITIES) {
      expect(agent.personality.length).toBeGreaterThanOrEqual(100)
    }
  })

  it('all shortIds should be unique', () => {
    const ids = AGENT_PERSONALITIES.map((a) => a.shortId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all agentIds should be unique', () => {
    const ids = AGENT_PERSONALITIES.map((a) => a.agentId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all names should be unique', () => {
    const names = AGENT_PERSONALITIES.map((a) => a.name)
    expect(new Set(names).size).toBe(names.length)
  })

  describe('agents by department', () => {
    const ceoDept = ['marcus', 'diana']
    const techDept = ['dev', 'raj', 'mia', 'quinn']
    const marketingDept = ['kai', 'lena', 'rio', 'nate', 'atlas', 'pixel']
    const financeDept = ['felix']

    const allDepartments = [...ceoDept, ...techDept, ...marketingDept, ...financeDept]

    it('should have all 4 departments covered', () => {
      expect(ceoDept).toHaveLength(2)
      expect(techDept).toHaveLength(4)
      expect(marketingDept).toHaveLength(6)
      expect(financeDept).toHaveLength(1)
    })

    it('all expected shortIds should be present', () => {
      const actualIds = AGENT_PERSONALITIES.map((a) => a.shortId)
      for (const id of allDepartments) {
        expect(actualIds).toContain(id)
      }
    })
  })

  describe('getAgentPersonality', () => {
    it('should find agent by shortId', () => {
      const marcus = getAgentPersonality('marcus')
      expect(marcus).toBeDefined()
      expect(marcus!.name).toBe('Marcus')
      expect(marcus!.agentId).toBe('marcus-ceo')
    })

    it('should find agent by full agentId', () => {
      const diana = getAgentPersonality('diana-coo')
      expect(diana).toBeDefined()
      expect(diana!.name).toBe('Diana')
      expect(diana!.shortId).toBe('diana')
    })

    it('should return undefined for unknown agent', () => {
      expect(getAgentPersonality('nonexistent')).toBeUndefined()
    })
  })

  describe('getPersonalityExtension', () => {
    it('should return a formatted personality string', () => {
      const ext = getPersonalityExtension('quinn')
      expect(ext).toContain('[AGENT PERSONALITY — Quinn]')
      expect(ext).toContain('Quality is a system')
    })

    it('should return empty string for unknown agent', () => {
      expect(getPersonalityExtension('nobody')).toBe('')
    })
  })
})
