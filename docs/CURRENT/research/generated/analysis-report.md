# Planning survey — reproducible analysis report

Protocol: **v1.0.0**. Full-166 is primary; early-99 is a retrospective audit; late-67 is exploratory only.
The survey followed earlier prototyping/dogfooding and does not establish product outcomes.

Source basename: `Исследование привычек планирования.xlsx`
Source SHA-256: `3f44578a4dc3139e2e62bf46516c8877759f15da9e2b3213d3cc2a602e591490`

## Cohorts

| Cohort | N | First submission | Last submission | Role |
|---|---:|---|---|---|
| Early-99 | 99 | 2026-05-03 | 2026-05-19 | Historical sensitivity audit |
| Late-67 | 67 | 2026-05-20 | 2026-07-17 | Exploratory composition check |
| Full-166 | 166 | 2026-05-03 | 2026-07-17 | Primary synthesis |

## Closed-question comparison

| Metric | Early-99 | Full-166 |
|---|---:|---:|
| Manual transfer | 57/97 (58.8%) | 92/163 (56.4%) |
| Accumulation | 31/97 (32%) | 60/163 (36.8%) |
| Manual AND accumulation | 12/97 (12.4%) | 23/163 (14.1%) |
| Manual OR accumulation | 76/97 (78.4%) | 129/163 (79.1%) |
| State-aware planning, 4–5 | 58/97 (59.8%) | 89/163 (54.6%) |
| Capacity difficulty, 4–5 | 49/97 (50.5%) | 86/163 (52.8%) |
| Small-task difficulty, 4–5 | 41/97 (42.3%) | 78/163 (47.9%) |
| List overload, 4–5 | 33/97 (34%) | 59/163 (36.2%) |
| Day-clarity difficulty, 4–5 | 22/97 (22.7%) | 39/163 (23.9%) |
| Voice task entry | 2/97 (2.1%) | 5/163 (3.1%) |
| Morning / fixed peaks | 29/70 (41.4%) | 48/120 (40%) |
| Evening / fixed peaks | 23/70 (32.9%) | 50/120 (41.7%) |
| No fixed peak / all valid focus responses | 27/97 (27.8%) | 43/163 (26.4%) |

Every percentage uses the valid non-empty denominator for that item and cohort. Multi-select branches are counted per respondent; the union is not a sum of percentages.

## Open-question bases

| Cohort | Question | Raw | Excluded | Thematic base | Other/unclear |
|---|---|---:|---:|---:|---:|
| early99 | frustrations | 51 | 18 | 33 | 2 |
| early99 | recovery | 50 | 10 | 40 | 1 |
| early99 | magic | 50 | 9 | 41 | 0 |
| full166 | frustrations | 95 | 27 | 68 | 3 |
| full166 | recovery | 99 | 18 | 81 | 4 |
| full166 | magic | 99 | 17 | 82 | 0 |

## Exploratory cohort composition — not a time trend

Rare/busy planning: early-99 31/99 (31.3%); late-67 38/67 (56.7%).
State-aware planning 4–5: early-99 58/97 (59.8%); late-67 31/66 (47%).
These are descriptive post-hoc comparisons. They do not establish temporal change, causality or a latent factor.

## Files

- `aggregates-*.csv`: closed-question distributions and explicit metric denominators.
- `open-themes-*.csv`: multi-label theme counts and exclusion summaries.
- `open-audit-*.csv`: pseudonymous inclusion decisions and codes without response text.
- `analysis-manifest.json`: source hash, cohort ranges and validation status.
