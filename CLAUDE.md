# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project rules

- This is a **process-mining dashboard** on the Olist e-commerce dataset (Kaggle/UCI).
- **Data source:** the CSVs in `data/`, produced by an offline verification pass. `VERIFICATION.md` holds the exclusion logic and is the authority on it: 8 orders marked `delivered` with no delivery timestamp, 1,373 orders with out-of-order timestamps, and 23 negative-transit records — 1,404 rows total — are excluded, leaving the clean case set of 95,082 orders. Note that `VERIFICATION.md` is **not yet present** in the repo; if a task depends on the exclusion logic and the file is still missing, ask rather than reconstructing it. Likewise, `data/` contains only the four post-verification outputs — the raw Olist tables (`olist_orders_dataset.csv` and friends) are not in the repo, so the exclusions cannot be re-derived or re-run here.
- **Every user-facing number must trace to the processed CSVs** — never invented, never estimated, never carried over from memory of the public dataset. If a figure cannot be computed from `data/`, say so instead of supplying one.
- **Bilingual UI is not required.** The data is Portuguese/Brazilian (state codes, product categories); the UI is English. Do not add translation layers or dual-language labels.

## Repository state

This repo currently contains **data only** — no source code, no build system, no tests, and no commits yet (`main` is unborn). Everything under `data/` is untracked. There is no README, no lint/test tooling, and no dependency manifest, so there are no build/test/run commands to document yet. When adding the first code, you are choosing the stack; ask before assuming one.

`data/olist_cases_clean.csv` is 16 MB. Decide deliberately whether it belongs in git (LFS / `.gitignore` / regenerate-from-source) before the first commit — the remote is `github.com/Mhmatar/olist-process-intelligence`.

## Domain

Process intelligence / process mining over the public **Olist Brazilian e-commerce** dataset. The unit of analysis is the **order as a case**, and the process is decomposed into three sequential stages between purchase and delivery. The analytical question the data is shaped around: *which stage causes late deliveries, and what does lateness cost in customer satisfaction?*

## The stage model (central abstraction)

Every derived metric follows from this decomposition of one order's lifecycle. Verify any new metric against it rather than re-deriving from raw timestamps:

| Stage | Column | Span |
|---|---|---|
| Approval | `approval_h` (hours) | `order_purchase_timestamp` → `order_approved_at` |
| Carrier handoff | `carrier_h` (hours) | `order_approved_at` → `order_delivered_carrier_date` |
| Transit | `transit_days` | `order_delivered_carrier_date` → `order_delivered_customer_date` |

`total_days` = purchase → delivery to customer, i.e. the sum of the three stages above (unit-converted).

`delay_days` = `order_delivered_customer_date` − `order_estimated_delivery_date`. **Negative means early**, positive means late. `late` is `delay_days > 0`. `delay_bucket` discretizes it into `on_time`, `late_1_3d`, `late_4_7d`, `late_8_14d`, `late_15d_plus` — note `on_time` absorbs all early deliveries, which is the large majority.

## Data files

`olist_cases_clean.csv` is the fact table; the other three are pre-aggregated rollups derived from it, each answering one question. They are outputs of an upstream pipeline that is **not in this repo** — treat them as read-only inputs and do not hand-edit them.

- **`olist_cases_clean.csv`** — 95,082 delivered orders, one row per case. Purchase timestamps span 2016-09-15 → 2018-08-29; 27 `customer_state` values. Already filtered to orders with a complete timestamp chain, so stage columns are non-null. `review_score` is empty for 639 rows.
- **`olist_monthly_stages.csv`** — per-month `orders`, mean stage durations, and `late_rate`. The 2016-09 and 2016-12 rows have `orders = 1`; their means are noise and must be excluded or annotated in any trend chart.
- **`olist_seller_bottlenecks.csv`** — 788 sellers ranked by `avg_carrier_h` (worst first), filtered to sellers with ≥ 20 orders. Isolates the carrier-handoff stage as the seller-attributable one.
- **`olist_review_by_delay.csv`** — mean `review_score` by `delay_bucket`. Counts here total 94,443, i.e. the 639 review-less cases are dropped; bucket counts therefore differ slightly from `olist_cases_clean.csv`. Mean score falls monotonically from 4.29 (on time) to 1.71 (15+ days late) — this is the headline finding the repo exists to support.

## Analysis conventions

- Overall late rate is ~8.2% (7,792 of 95,082), so late-vs-on-time comparisons are heavily imbalanced. Report rates and counts together, and don't let `on_time` dominate a shared color scale or axis.
- `carrier_h` is the long tail (top sellers exceed 400 h ≈ 17 days versus sub-hour typical approval). Stage comparisons need either a log scale or per-stage units, not a single linear axis.
- Because the case table is pre-filtered to completed deliveries, it cannot answer anything about cancelled or undelivered orders — say so rather than inferring from it.
