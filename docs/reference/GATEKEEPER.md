# Gatekeeper — Pre-Flight Validation Layer

Gatekeeper is a lightweight routing layer that classifies user intent and routes to the correct agent BEFORE any LLM call. This saves tokens and reduces errors from mis-routed queries.

## How It Works

1. **Intent Classification** — Analyzes the user's message using keyword matching
2. **Agent Selection** — Maps intent to the appropriate agent based on 4-department structure
3. **Context Validation** — Checks if required context (brand, platform, etc.) is present
4. **Reformulation Suggestion** — If context is missing, suggests how to improve the query

## API Endpoint

```
POST /api/gatekeeper
Body: { message: string, venture?: string }
```

### Response Shape

```typescript
interface GatekeeperResult {
  targetAgent: AgentId        // e.g. "marcus-ceo", "dev-lead"
  department: AgentDepartment // "ceo" | "technical" | "marketing" | "finance"
  confidence: number          // 0.0-1.0
  reasoning: string           // Why this routing decision was made
  missingContext: string[]    // What context is needed but missing
  suggestedReformulation?: string // How to improve the query
}
```

## Routing Rules

### CEO Department
| Intent | Primary Agent | Secondary |
|--------|---------------|-----------|
| strategy | marcus-ceo | diana-coo |
| operations | diana-coo | marcus-ceo |

### Technical Department
| Intent | Primary Agent | Secondary |
|--------|---------------|-----------|
| technical_backend | raj-backend | dev-lead |
| technical_frontend | mia-frontend | dev-lead |
| technical_general | dev-lead | quinn-qa |
| qa_review | quinn-qa | dev-lead |

### Marketing Department
| Intent | Primary Agent | Secondary |
|--------|---------------|-----------|
| marketing_content | lena-brand | kai-analyst |
| social_tactics | kai-analyst | lena-brand |
| advertising | rio-ads | marcus-ceo |
| growth_data | kai-analyst | nate-growth |
| competitor_intel | kai-analyst | rio-ads |
| trending_content | kai-analyst | lena-brand |

### Finance Department
| Intent | Primary Agent | Secondary |
|--------|---------------|-----------|
| product_roadmap | felix-finance | diana-coo |

## Context Requirements

Different intents require different context:

| Intent | Required Context |
|--------|-----------------|
| marketing_content | brand (Novizio/Hourbour) |
| social_tactics | brand, platform |
| competitor_intel | competitor name |
| advertising | product/offer, budget |
| growth_data | metric, time period |

## Integration

### Current Routes Using Gatekeeper Logic

- `/api/tech-chat` — Keyword-based routing (replaced by gatekeeper for new requests)
- `/api/team-chat` — War Room with intent classification
- `/api/route-intent` — LLM-based intent classifier (expensive)

### Future: Direct Gatekeeper Integration

The gatekeeper should become the single routing entry point:

```
User message → /api/gatekeeper → classify → route to correct agent
```

Benefits:
- Token savings (no LLM call for simple routing)
- Better error messages (missing context detected early)
- Consistent routing logic across all routes

## CLI Tool

Test the gatekeeper from command line:

```bash
curl -X POST http://localhost:3000/api/gatekeeper \
  -H "Content-Type: application/json" \
  -d '{"message": "Write a caption for Instagram", "venture": "Novizio"}'
```

## Example Responses

### Successful Routing
```json
{
  "targetAgent": "lena-brand",
  "department": "marketing",
  "confidence": 0.85,
  "reasoning": "marketing_content → routing to lena-brand",
  "missingContext": []
}
```

### Missing Context
```json
{
  "targetAgent": "kai-analyst",
  "department": "marketing",
  "confidence": 0.65,
  "reasoning": "competitor_intel → routing to kai-analyst. Missing context: competitor name",
  "missingContext": ["competitor name"],
  "suggestedReformulation": "Try adding: name the competitor you're researching. Original query: \"research competitor...\""
}
```