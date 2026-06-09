/**
 * lib/validator-rubrics.ts — Department validator rubrics.
 *
 * Each rubric defines the pass/fail criteria for a department's QA validator.
 * These are injected into the validator agent's task prompt.
 */

// ─── Technical Validator Rubric (Quinn QA) ─────────────────────────────────

export const TECH_RUBRIC = `VALIDATION RUBRIC — TECHNICAL DEPARTMENT
────────────────────────────────────────────
You MUST verify ALL 5 rules below. For each rule, check the corresponding
boxes mentally. If ANY check fails, the verdict is FAIL.

1. TYPE SAFETY & SYNTAX
   □ No implicit 'any' types (TypeScript) or 'dynamic' abuse (Dart)
   □ All imports resolve to existing modules/files
   □ No undefined types, classes, functions, or variables
   □ For Dart: no null safety violations, correct package paths

2. KARPATHY COMPLIANCE
   □ Only files in the task brief were changed — no adjacent code touched
   □ No abstractions added for single-use code
   □ No speculative features beyond the task requirements
   □ Minimum code that solves the problem — no over-engineering

3. REGRESSION CHECK
   □ Existing files not in the task brief are untouched
   □ No accidental deletions of imports, exports, or required config
   □ Import paths changed ONLY as specified in the task
   □ No files moved or renamed without explicit instruction

4. PATTERN COMPLIANCE
   □ File structure matches existing project conventions
   □ Naming matches project style (camelCase, PascalCase, snake_case per language)
   □ Imports use project-standard paths (package:..., @/lib/..., relatives)
   □ Error handling follows existing patterns in the codebase

5. COMMIT & WRITE QUALITY
   □ Every write_file call has a descriptive commit message
   □ Commit format: "fix: [specific description]" or "feat: [description]"
   □ No commits with empty, vague, or placeholder messages
   □ Files are written to correct directories (lib/ for Dart, app/ for Next.js)
────────────────────────────────────────────

Return your verdict in EXACTLY this format:
---QA-VERDICT---
status: PASS | FAIL
errors:
- [file]: [rule violated] — [specific description with line numbers if possible]
- [file]: [another error]
recommendation: [one sentence — exactly what the specialist must change]
---END-QA---`

// ─── Marketing Validator Rubric (Daniel Kahneman) ──────────────────────────

export const MARKETING_RUBRIC = `VALIDATION RUBRIC — MARKETING DEPARTMENT (Kahneman)
────────────────────────────────────────────
You MUST verify ALL 5 rules below. If ANY check fails, the verdict is FAIL.

1. COGNITIVE BIAS CHECK
   □ No anchoring on recent trends without broader context
   □ No overconfidence in predictions or claims
   □ No framing errors that manipulate interpretation
   □ Loss aversion not exploited unethically
   □ Social proof claims are specific and verifiable

2. BRAND VOICE COMPLIANCE
   □ Matches the venture's BRAND.md tone, style, and vocabulary
   □ No urgency or discount language (if venture rule prohibits it)
   □ Audience-appropriate complexity and vocabulary
   □ Consistent with established brand personality

3. AUDIENCE FIT
   □ Appropriate for target demographic (age, gender, income tier)
   □ Platform-appropriate format, length, and tone
   □ No assumptions about audience knowledge or context
   □ Culturally appropriate and sensitive

4. PSYCHOLOGICAL INTEGRITY
   □ No dark patterns or deceptive framing
   □ Value proposition is honest and clearly stated
   □ Emotional appeal is authentic, not manipulative
   □ Call-to-action is proportionate to the claim made

5. KARPATHY COMPLIANCE
   □ Simplicity first — no unnecessary complexity or jargon
   □ No speculation beyond available data
   □ Clear, direct language — no hedging, padding, or filler
   □ Every claim is backed by data or explicitly labeled as assumption
────────────────────────────────────────────`

// ─── Finance Validator Rubric (Felix) ───────────────────────────────────────

export const FINANCE_RUBRIC = `VALIDATION RUBRIC — FINANCE DEPARTMENT (Felix)
────────────────────────────────────────────
You MUST verify ALL 4 rules below. If ANY check fails, the verdict is FAIL.

1. MODEL ACCURACY
   □ All assumptions explicitly stated and sourced
   □ Cohort segmentation applied — never flat averages
   □ Time periods clearly defined with start/end dates
   □ Sensitivity analysis on key variables (price, volume, conversion)

2. DATA INTEGRITY
   □ Data sources dated and within acceptable freshness window
   □ Currency conversions stated with exchange rates and dates
   □ Rounding consistent and appropriate (2 decimal places for currency)
   □ No mixing of actual and projected data without clear labels

3. RISK ASSESSMENT
   □ All material risks enumerated with specific descriptions
   □ Probabilities assigned to risks (not "could happen" — estimate likelihood)
   □ Worst-case AND best-case scenarios modeled
   □ Mitigation strategies identified for top 3 risks

4. KARPATHY COMPLIANCE
   □ No speculative revenue without explicit caveats
   □ Clear distinction between analysis (facts) and recommendation (opinion)
   □ Numbers are specific ("$47,200" not "~$50K" or "approximately $50K")
   □ Growth projections include the methodology used
────────────────────────────────────────────`
