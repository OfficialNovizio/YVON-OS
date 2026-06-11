# 30 · People (System)

> A people/contacts directory. Appears as `people-page.md` in the creator's own Briefings folder (screenshot 181510).

## Purpose

A directory of the *humans* in the owner's world — partners, clients, leads, and collaborators — distinct from the *agents* (which live in Agents/Org Chart). It's the human counterpart to the agent roster, and the relationship layer behind the Inbox and Consulting CRM.

## What it covers (inferred)

- Contact records with relationship status, associated workspace, and history — the same kind of data the Inbox surfaces in its "What we know about [sender]" panel (e.g. Maria Solano: warm prospect, ~€5k, language preferences, recent threads).
- Likely links each person to their deals (Consulting CRM), their threads (Inbox), and any projects they're attached to (e.g. partner logins per workspace).
- Pulls contact memory from the Supabase-backed memory system.

## Relationship to other screens

- Underpins **Email Inbox** (`25`) contact intelligence and **Consulting CRM** (`23`) leads.
- Connects to the partner-login model in **Workspaces & Design System** (`26`).

> **Confidence: Inferred.** Named in the creator's Briefings folder; no dedicated UI screenshot. The contact-record details are extrapolated from the Inbox's contact panel, which clearly draws on this kind of people data.
