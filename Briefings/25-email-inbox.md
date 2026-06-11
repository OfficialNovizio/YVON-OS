# 25 · Email Inbox (System)

> A unified inbox across **four email accounts** with **inline draft responses** — review, edit and send without leaving Mission Control — plus a one-by-one **triage mode** and a "reply now" queue of pre-drafted replies.

## Purpose

Manage all email from inside the dashboard and save the owner time. The big change in this build: an **inline response** — the owner can review the draft reply, edit it, and send **right from here**, never opening the actual email client. The agent (with Henry) pre-drafts replies for all emails and only asks for input when unsure.

## Page header

- Title: **Inbox**, breadcrumb `Vibe with AI / Inbox`.
- Sub-line: "Your single email surface — read, draft, send. This runs on Mail.app. Local AI reads everything; nothing leaves the machine on the read path."
- Buttons: **Draft email**, **Triage mode**.
- An **"Inbox Zero protocol · twice daily"** indicator, **X% done**, **next sweep** time, and an unread count (e.g. 21).
- **Account tabs/filters** for the **four connected accounts**, plus filters (All, Action, Reply, Flagged, Waiting, Archive…) and **Sort**.

## Message list (center)

- Email rows grouped/triaged, each showing sender, subject, a snippet, the **draft status**, and quick actions. Examples seen:
  - **Maria Solano · Brightwave Studio** — "Re: Cinematic site for the new collection — timeline?" with **Reply now** + **Draft ready** chips.
  - **Legal — Hartmann & Vogel** — "Revised SaaS retainer agreement" → action: **Escalate to Henry**.
  - **Stripe Billing** — "Action required — re: your payout account" (flagged).
  - **Café Mantra · events** — "Re: DJ booking availability — August dates."
- Each row offers inline **Reply now**, **Open draft**, **Escalate to Henry**, **Open in Mail**.

## Inline draft / response (the key feature)

- Selecting an email reveals the **pre-drafted reply inline**; the owner can **read, edit, and Send** directly, or **Send back/regenerate**.
- No need to switch to the external mail client.

## "What we know about [sender]" panel (right rail)

- A contact intelligence card, e.g. **Maria Solano**:
  - **Relationship / status** (e.g. "Prospect · warm"), **value** (e.g. ~€5k inquiry).
  - **Contact memory** — notes pulled from the memory system (history, preferences, e.g. "Prefers Spanish for small talk, English for business," "fashion drops," last interactions).
  - **Recent threads / timeline** of prior messages.
  - This is the memory system surfacing per-contact context to inform the reply.

## Triage mode (one-by-one)

- A focused, full-screen mode that steps through emails **one at a time** ("email X of Y"), showing the message and its draft with large action buttons: **Send**, **Edit**, **Escalate**, **Archive**, **Defer**, and **Exit triage**.
- Goal: get the inbox to zero quickly.

## "Reply now" automation model (design intent)

- The system **auto-drafts responses for all emails**; **unless the agent is unsure**, in which case the email goes to a **Review** section where the agent needs the owner's input on the draft.
- In the **"reply now"** section everything is pre-drafted, so the owner just reviews and sends across all four accounts.
- Long-term vision: as trust builds, most emails get sent automatically with less and less owner input (same draft→auto-send trajectory as social/newsletter).

## Integrations

- Runs on **Mail.app** locally; **local AI reads everything** on-device on the read path (privacy note). Four accounts connected. Henry handles escalations.
