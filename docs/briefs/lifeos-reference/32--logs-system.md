# 32 · Logs (System)

> An activity/audit log page. Appears as `logs.md` in the creator's own Briefings folder (screenshot 181510).

## Purpose

A system-wide record of what the agents did and when — the audit trail behind the Task Board's Live Activity tracker and the various approval gates. Where Live Activity shows *current* work, Logs is the *historical* record for review, debugging, and accountability.

## What it covers (inferred)

- A chronological feed of agent actions across all workspaces: tasks executed, posts published, emails drafted/sent, PRs opened, security stops (e.g. Knox halting a credential leak), key rotations, deploys.
- Filtering by agent, workspace, action type, and time — useful when something needs tracing (e.g. a failed post in the Scheduler's failure triage, or confirming what Nexus deployed).
- Ties into the safety model: every gated/auto action leaves a log entry.

## Relationship to other screens

- Historical counterpart to the **Task Board** Live Activity tracker (`02`).
- Supports debugging surfaced elsewhere: Scheduler failure triage (`15`), Software Pipeline (`22`), Decision Queue security stops (`01`).

> **Confidence: Inferred.** Named in the creator's Briefings folder; no dedicated UI screenshot. Contents extrapolated from the activity-tracking and audit needs visible across the app.
