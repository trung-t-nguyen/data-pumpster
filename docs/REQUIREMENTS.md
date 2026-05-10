# Data Pumpster — Requirement Catalog

## Overview

High-performance CSV → PostgreSQL import pipeline for the `products` table.
Users move through a three-step wizard (Upload → Map → Progress) to bulk-import
product data, with real-time feedback streamed back during processing.

---

## Use-Case Tracker

| # | Use Case | Status |
|---|---|---|
| UC-01 | [Upload CSV File](use-cases/uc-01-upload-csv.md) | ✅ Complete — [PR #1](https://github.com/trung-t-nguyen/data-pumpster/pull/1) |
| UC-02 | [Map CSV Columns to DB Schema](use-cases/uc-02-map-columns.md) | ✅ Complete — [PR #2](https://github.com/trung-t-nguyen/data-pumpster/pull/2) |
| UC-03 | [Submit Import Job](use-cases/uc-03-submit-import.md) | ✅ Complete — [PR #3](https://github.com/trung-t-nguyen/data-pumpster/pull/3) |
| UC-04 | [Stream Import Progress (SSE)](use-cases/uc-04-progress-stream.md) | ⬜ Not started |
| UC-05 | [View Import History](use-cases/uc-05-import-history.md) | ⬜ Not started |

**Status key:** ⬜ Not started · 🔄 In progress · ✅ Complete · ❌ Blocked
