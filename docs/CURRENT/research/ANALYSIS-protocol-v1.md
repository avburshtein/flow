# Flow planning survey — analysis protocol v1

- **Status:** frozen before the unified reanalysis
- **Scope:** retrospective audit of the first 99 submissions and primary synthesis of all 166 submissions
- **Implementation:** `analyze-planning.mjs`
- **Codebook:** `CODEBOOK-v1.md`

## 1. Research role and chronology

Flow began with the author's personal planning difficulty, early prototyping and dogfooding. The survey did not originate the application and does not prove its effectiveness. Its role is to examine whether comparable needs occur outside the author's experience and to refine product hypotheses. Existing features, post-survey refinements and untested hypotheses must be reported separately.

The n=99 cohort is retained only for a retrospective sensitivity audit. The n=166 cohort is the sole basis for current personas, affinity mapping and HMW questions. Historical `docs/CURRENT/DEFINE.md` remains unchanged.

## 2. Source and reproducibility

- Source: the original multilingual XLSX, supplied to the script as a local path. The source and direct identifiers are not published.
- The manifest stores the source basename, SHA-256, response counts and submission-date ranges.
- The analysis uses Node.js built-ins only. No manual transcription or external spreadsheet is required.
- Repeated runs with the same source and protocol must produce byte-identical generated files.
- Generated outputs contain aggregates and pseudonymous audit keys, never Submission IDs, email addresses or free-text responses.

## 3. Cohorts

1. Responses are sorted by Excel `Submission time`, with original row order as a stable tie-breaker.
2. **Early-99:** the earliest 99 submissions; retrospective audit only.
3. **Late-67:** all remaining submissions; exploratory composition check only, not a time trend.
4. **Full-166:** all unique submissions; primary analysis.

Submission ID is used only in memory to verify uniqueness. Duplicate IDs would be an error, not silently counted twice.

## 4. Missingness and denominators

There is no blanket deletion of respondents. Each metric uses its own valid, non-empty denominator:

- demographic and frequency questions: their own answered count;
- Likert and behavioural items: their own answered count;
- gender: answered count, expected n=164 for Full-166;
- main Likert/behavioural items: expected n=163 for Full-166;
- open questions: separate raw and thematic bases.

Three respondents under 18 completed only initial fields. They remain in applicable demographic distributions and are missing for unavailable downstream items.

Every aggregate row contains `numerator`, `denominator`, `percent` and a metric definition. Rounded percentages are for presentation; calculations use unrounded ratios.

## 5. Closed-question rules

### 5.1 Likert items

- Valid values are 1–5.
- `Top2` means a rating of 4 or 5, divided by non-empty responses to that item.
- `Low2` means 1 or 2.
- Likert distributions are exported in full; Top2 is not substituted for the distribution.
- Pearson correlations, if exported, are exploratory complete-pair associations and do not establish a latent factor or causality.

### 5.2 Multi-select unfinished tasks

Language-specific options are mapped to branch indicators before counting. One respondent is counted once per branch and once in the union:

- manual next-day transfer;
- accumulation;
- review/reprioritization;
- forgetting;
- rarely happens;
- other.

Primary union: `manual OR accumulation`. Also exported: each branch and their intersection. No branch percentages are summed.

### 5.3 Focus peaks

Two denominators are reported separately:

- all valid focus responses;
- only responses with a fixed morning/afternoon/evening peak.

`No fixed peak` combines variable patterns and respondents who had not considered the question. These groups are also exported separately.

### 5.4 Demographics and segments

- Age: under 18, 18–25, 26–35, 36–45, 46+.
- Occupation: students/employees (A), autonomous/freelance/managerial (B), other. Spanish `Freelance / Autónomo` is included in B.
- Small segments are directional and must not be generalized.
- ADHD, diagnoses and population prevalence cannot be inferred from this survey.

## 6. Open questions

Two bases are always reported:

1. **Raw base:** every non-empty extracted response.
2. **Thematic base:** raw responses to which the codebook can apply at least one substantive code.

Exclusion reasons are explicit: technical/no content, explicit satisfaction/non-use without a request, or strategy-free recovery confirmation. Short substantive answers remain eligible. `Other/unclear` stays in the thematic denominator.

Coding is multi-label; one respondent is counted once per theme, and percentages within a question need not sum to 100%. Exact inclusion rules and reviewed overrides are versioned in the script and `CODEBOOK-v1.md`. No LLM clustering is presented as statistical evidence. Intercoder reliability has not been measured.

## 7. Reporting hierarchy

- **Primary:** Full-166 descriptive metrics, transparent open coding, personas as illustrative archetypes, current HMW questions.
- **Historical audit:** Early-99 recalculation using identical definitions.
- **Exploratory:** correlations, age/cohort comparisons and small segments; not headline evidence.
- **Not evidence of outcomes:** dogfooding, shipped features, survey interest or planned targets. External moderated usability and longitudinal outcomes remain separate research steps.

## 8. Validation

The script fails on source/cohort count mismatch, duplicate Submission IDs, invalid Likert values, unexpected Full-166 headline counts, open-base mismatches or output containing direct identifiers. Privacy checks cover email-shaped strings, UUID-shaped Submission IDs and local user paths. The historical Define file must remain unchanged.
