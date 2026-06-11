# 17 · Newsletter (Posts)

> A full newsletter studio integrated with the **Kit** API — compose, design, broadcast, run sequences/automations, and analyze campaigns. The owner is starting a monthly newsletter as part of the Life OS.

## Purpose

Bring email newsletters into Mission Control. Integrated with **Kit** (formerly ConvertKit) via its API, it helps **analyze subscribers, compose/write/design** the newsletter, **manage and analyze campaigns**, and potentially write **automations/sequences**. The stated near-term goal is a **monthly newsletter**.

## Page header

- Title: **Newsletter**, breadcrumb `Vibe with AI / Newsletter`.
- Sub-line: "Mission Control → KIT · broadcasts · lifecycle sequences, measured on clicks, replies & conversions."
- **Connected to KIT** status, **Visit workspace**, **API healthy**, last-sync time.
- Buttons: **Open in Kit** and **New broadcast**.
- A note: "Matching powers Vahalla behind the same interface."

## Tabs

A horizontal tab bar drives the page: **Audience**, **Compose**, **Broadcasts**, **Sequences**, **Growth**, **Analytics**.

### Audience
- **Subscriber metrics** — total subscribers (e.g. **128**) with a trend sparkline, **new subscribers** (+12), unsubscribes (2), etc.
- **By tag / segment** breakdown — counts per audience segment: e.g. **Newsletter 128**, **Course waitlist 41**, **In subscribers / app users 63**, **Consulting leads**, **Dormant (90d) 11**, etc. — so the owner can target broadcasts to specific segments.

### Compose
- A draft editor for the issue. Example issue: **#13 "The cockpit, not the dashboard."**
- **Subject line** field and **preview text**, with the agent proposing options.
- **Block-based body** — content blocks (story summary, links, "By Design — ship while you sleep," CTA) with **+ Add a block**.
- **Approval gate explainer** — e.g. *"Posting a send to KIT … an external action … William can prep the draft + send, [but] schedule/send is gated until you review."* — drafts are prepared but the actual send is gated on the owner.
- Action buttons: **Approve & schedule via Kit**, **Approve & send now**, **Regenerate copy**, **Send test to myself**.

### Broadcasts
- **Performance of past sends** — a list of sent issues with **open rate**, **click rate**, and counts (e.g. #13 Meet the agent roster, #12 Now I plan with no code, #11 The memory architecture), each with open/click %.
- A **Top performer** callout and a learning note (e.g. *"#11 'Meet the agent roster' … X% click rate … Learning note: William [insight]; single clear CTA + free feature did best. Lean into narrower agent-centric next send."*).

### Sequences (lifecycle automations)
- Visual **automation flows**: **Welcome series**, **New app feature announce**, **Cart recapture (abandoned cart)**, etc., each a multi-step sequence with triggers (e.g. "has signed up," "tag applied," "cart abandoned") and timed steps.
- **Propose sequence** — the agent can design a new sequence ("designed in AI · authored in KIT via the API").

### Growth
- **Sign-up surfaces / what's driving the list** — sources feeding subscriber growth: **YouTube description link** (+9), **Course waitlist form** (+1), **viBweAtti.io landing page**, **By Design in-app capture**, etc., each with counts and conversion notes.

### Analytics
- Campaign analytics: opens, clicks, replies, conversions over time and by campaign, to "manage and analyze the different campaigns."

## Right rail (live preview)

- A **live email preview** of the current issue branded to the workspace ("Vibe with AI"), e.g. *"I stopped building dashboards…"* with a **Try in [Kit]** CTA — a WYSIWYG of what subscribers receive.

## Agents & integration

- **William** drafts/composes; the agent designs sequences and proposes copy.
- All sending flows through the **Kit API**; the send action is human-gated until trust is built (consistent with the email/social draft-first pattern).
