# Example — How proposals work

When an agent wants to make a change, it creates a JSON file here:

```json
{
  "id": "mia-font-fix-2026-05-14",
  "agent": "Mia",
  "type": "edit",
  "target": "app/screens/ceo-command-dashboard/_overview.tsx",
  "summary": "Increase KPI label font from 10px to 12px, weight 700→800",
  "rationale": "feedback.md Rule 2 specifies min 12px/800 for section labels",
  "risk": "low",
  "status": "pending",
  "createdAt": "2026-05-14T15:30:00Z"
}
```

## To approve:
1. Move the file to `requests/approved/`
2. The agent will see it on next cycle and execute

## To reject:
1. Move the file to `requests/rejected/`
2. Add a note if you want to explain why

## To modify:
1. Edit the proposal
2. Move to approved/ or rejected/
