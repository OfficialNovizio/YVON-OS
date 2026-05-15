# Agent Requests

When agents work autonomously and need to make a change, they write a proposal here and wait for approval.

## Directory Structure

```
requests/
├── pending/    → Proposals waiting for your review
├── approved/   → Proposals you approved (agent executes on next cycle)
└── rejected/   → Proposals you rejected (agent logs and moves on)
```

## How to Review

1. Check `requests/pending/` for `.json` files
2. Each file contains: agent name, proposed action, target file, rationale, risk level
3. Move the file to `approved/` or `rejected/` based on your decision
4. The approving agent picks up approved items on its next scheduled cycle

## Future Channels

- Email delivery via Resend (already in dependencies)
- Dashboard panel showing pending requests
- SMS notifications for urgent items

For now, the pending queue is the single source of truth.
