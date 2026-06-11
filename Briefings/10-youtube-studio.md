# 10 · YouTube Studio (Long-form)

> The packaging cockpit for a finished video: title iteration, thumbnail design, the upload checklist, and — once the transcript is dropped — an auto-generated description with chapters.

## Purpose

Take a filmed/edited video and **package it for upload**: iterate titles, get thumbnail help, run a pre-publish checklist, and generate the description/chapters from the transcript. Henry/agents prepare the package; the owner can publish (Shorts may auto-upload; long-form is reviewed first).

## Page header

- Title: **YouTube Studio**, breadcrumb `Vibe with AI / YouTube Studio`.
- Buttons: **Open in Asset Lab** (jump to thumbnails/assets) and **Generate upload package**.
- A status line: **"Package · X finished video in upload-ready — the cockpit is the same flow when it's back."**
- Flow chips across the top: **While footage with the editor** → **When it's back** → **Then ready to upload / pre-publish** — i.e. the lifecycle of the video while editing, when it returns, and when it's ready.
- A note that **Shorts may auto-upload (private/list form)** while long-form is published manually after review.

## Left panel — packaging state & checklist

- **"Ready for packaging"** card listing the current video(s), e.g. "Claude ran my business for 7 days," "I planned an app with zero code."
- **Upload checklist** — a checklist of pre-publish items (thumbnail picked, title chosen, description ready, chapters, etc.) that must be green before upload.

## Center — title workshop

- **Title** field with the working title (e.g. *"I gave my entire business to AI agents for 7 days"*).
- **Title candidates / variants** — the agent proposes alternate titles to iterate on (e.g. "What happened when I gave my company to AI agents"), and notes which performed in past tests.
- **Henry's note** — e.g. *"Your best-testing titles with '7' + a number out-performed the last 3 / 4 for A vs the candidates; then we tune the working title/slogan you land on the thumbnail."* — i.e. data-informed title coaching, plus further title options.

## Thumbnail section

- **Thumbnail** builder with elements: **character**, **studio background**, and a **Change** action per element, plus **Add tags / hint**.
- A row of **thumbnail candidate frames** ("a wall of screens and small shots, view studio shot") to pick from — wired to Leonardo / Asset Lab.

## Description generator ("7 days on autopilot")

A second mode/section for the finished upload:
- **Drop the final transcript** → generates a **full description with chapters** that's "pretty much ready, only needs minor tweaking."
- **Full description** preview with **Copy full description** button.
- **Chapters** auto-extracted with timestamps (e.g. 00:00 Intro, 01:30 The cockpit, … 04:?? Decision Queue).
- **Pinned comment** generator ("Generate" a pinned first comment) and **A/B test** helper for title/thumbnail.
- Links onward to **Export thumbnail brief / follow-up Shorts**.

## Workflow

Content Pipeline (Ready) → YouTube Studio packaging (titles + thumbnail + checklist) → publish → drop transcript → auto description + chapters + pinned comment → feeds **Shorts** (follow-up shorts) and **YouTube Analytics**.
