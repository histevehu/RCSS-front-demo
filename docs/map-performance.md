# 3D map performance check — 2026-10-31

The demo previously rendered each PGM floor/wall pixel as a box instance. Instancing reduced draw calls but did not reduce triangle count. Pale transparent boxes also produced unnecessary overlapping surfaces and shadow work. This cost exists independently of active robot count.

## Changes

- Merge adjacent occupied pixels into row rectangles and vertically join identical intervals. No sampling, hole filling, topology, coordinate or algorithm changes. Tests expand merged rectangles back into cells and verify instance transforms.
- Disable architectural shadow-map rendering: architecture is translucent context for the scheduling overlays.
- Index scheduled tasks by robot once per backend snapshot; use binary search for the latest started task instead of filtering/sorting full history on every animation frame.
- Render task records in pages of 30. All tasks remain in the snapshot, all filters/counts cover full history and selected-task details remain independent of pagination.

## Observed browser results

Local automated Chromium, 1440 × 900 viewport. The initial scene contained 9 tasks and 8 robots. Frame intervals sampled during repeated orbit motion, excluding the first five samples. These are short local samples, not sustained fleet benchmarks.

| Measurement | Before | After |
|---|---:|---:|
| Architecture instances | 609,000 | 12,704 |
| Submitted triangles per frame | 7,321,692 | 166,140 |
| Draw calls | 143 | 143 |
| Frame interval median / p95 at DPR 1 | 16.7 / 16.7 ms | 16.7 / 16.7 ms |
| CPU render-call median at DPR 1 | 0.5 ms | 1.2 ms |

The triangle count fell 97.7%. The local baseline already reached roughly 60 FPS, so this run does **not** demonstrate a measured FPS improvement or reproduce the user's intermittent stutter. CPU submission time fluctuated and did not improve in the initial pair; it does not measure GPU completion time.

A browser-only state-response fixture supplied 1,000 completed task histories with 8 robots. It did not create orders in the real backend. With pagination, 30 task cards were mounted; Next reached record LOAD30. At DPR 2, a 300-frame combined orbit/zoom sample had a median interval of 16.7 ms and p95 of 16.8 ms, with median robot animation JS of 0.1 ms. The fixture was removed and the real page reloaded afterwards.

## Boundaries

This validates frontend history display and geometry load, not scheduling 1,000 new tasks, 1,000 moving robots, physical robot execution, every browser/GPU, or long-running memory stability. The backend still returns full history/trajectories each second; very large histories will eventually require a separate incremental/paginated API and scheduler load test. No backend changes were made in this pass.

Regression checks: `npm test` (46 tests), `npm run build`, real-scene screenshots, and browser pagination/fixture removal checks.
