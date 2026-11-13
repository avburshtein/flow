# Reproducible planning-survey analysis

This directory is the single analysis pipeline for the Flow planning survey. It replaces manual spreadsheet transcription and competing ad-hoc recalculations.

## Files

- `ANALYSIS-protocol-v1.md` — cohort, denominator, inference and reporting rules.
- `CODEBOOK-v1.md` — closed and open category definitions.
- `analyze-planning.mjs` — dependency-free XLSX parser and deterministic analysis.
- `generated/analysis-report.md` — human-readable early-99 / full-166 comparison.
- `generated/analysis-manifest.json` — source SHA-256, cohort ranges and validation status.
- `generated/aggregates-*.csv` — closed-question distributions and metric denominators.
- `generated/open-themes-*.csv` — theme counts and exclusion summaries.
- `generated/open-audit-*.csv` — pseudonymous inclusion/exclusion decisions and codes, without response text.

## Run

From the repository root:

```bash
node docs/CURRENT/research/analyze-planning.mjs "path/to/original-survey.xlsx"
```

Or through npm:

```bash
npm run research:analyze -- "path/to/original-survey.xlsx"
```

An optional second argument changes the output directory. The default is `docs/CURRENT/research/generated`.

The source workbook is private and remains outside version control. Only aggregates and pseudonymous audits are generated here. No Submission IDs, emails, timestamps per respondent, source-row numbers or free-text responses are exported.

## Reproduce and verify

Run the command twice with the same source and compare the generated files. They must be byte-identical. The script fails if the source hash/content no longer satisfies the v1 invariants, if a category is unmapped, if Likert values are invalid, or if a generated file contains an email-shaped string, UUID-shaped Submission ID or local user path.

Full-166 is the primary analysis. Early-99 is a retrospective audit defined by the earliest submission timestamps; late-67 is exploratory only. Historical `docs/CURRENT/DEFINE.md` is not overwritten.
