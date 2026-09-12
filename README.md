# Student Wellbeing — Core product and grounded AI

React + TypeScript connects to the sibling `stressed-backend` FastAPI modular monolith and PostgreSQL. The five product sections are Today, Timeline, Patterns, Explore, and Settings. Numerical inference and personal analytics come exclusively from the backend.

## Start

Production runs at `https://stressdetect.netlify.app`. `netlify.toml` proxies `/api/*` to `https://studentstressdetector-backend.onrender.com/api/:splat` before the SPA fallback. The browser uses same-origin requests and host-only secure session cookies. Google credentials live only in Render environment variables; no frontend environment variables are needed. Production bundles cannot show the development-account button. The sibling backend's `docs/PRODUCTION-AUTH.md` contains the owner setup and hosted verification procedure, including the callback `https://stressdetect.netlify.app/api/auth/callback`.

Use Node 20.19+ or Node 22+. Start PostgreSQL and FastAPI by following the backend README, then run from this folder:

```powershell
npm ci
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` to http://127.0.0.1:8000. Keep the backend FRONTEND_ORIGIN at http://localhost:5173 for this setup. Google sign-in needs backend OIDC credentials; the optional local-development sign-in appears only when the backend advertises that it is enabled and restricted to loopback.

`start-dev.ps1` can start an already configured backend in a hidden process and run Vite in the current terminal. It assumes the backend uses `.venv`. It does not install dependencies or initialize the database. Do not run it if port 8000 is already in use.

## Implemented behavior

- No history writes on initial load, input changes, or result inspection.
- An explicit Save check-in action submits the entered values and a UUID mutation key.
- Self-reported strain must be deliberately selected or explicitly skipped before a calculated result is shown.
- A failed/uncertain save retains the draft. Retrying the same payload reuses the same key; changing the payload starts a new attempt.
- The form is frozen during requests, and duplicate submit events are ignored.
- Saved results render their own input snapshot, date, and revision, not the current draft.
- Load saved check-in reads the selected date without writing anything.
- Displayed numerical values and activated rules come from the backend; there is no browser inference engine.
- Logout/unmount aborts pending work and invalidates late responses. No personal data is retained in browser persistent storage.
- Unsupported fuzzy inputs remain valid saved observations with no fabricated numerical result.
- Accessible labels, keyboard controls, status/error text, rule table, and responsive layout.

The routine-based index is an unvalidated heuristic, not a probability, diagnosis, or replacement for reported strain.

## Phase 2 product

- Today collects an intentional report or explicit strain skip before a result is revealed. Unsaved edits trigger a leave-page warning; switching product sections asks before discarding a dirty observation.
- Results display their own saved revision, timezone, receipt timestamp, retrospective flag, actual input memberships and activated rule strengths. Chart.js displays the aggregated output membership; centroid, rounded score, thresholds and specification hash remain visible as text.
- Timeline provides bounded date filtering and cursor pagination. Detail actions support optimistic revision edits, explicit permanent deletion, immutable revision inspection, and opening a hypothetical scenario. Conflicts preserve the edit draft; cancel editing and reload latest before starting a new revision. Load-more requests include the history version and reject inconsistent pages.
- Patterns provides deterministic medians, minimum report counts, baseline deviations, three-day persistence and descriptive co-occurrence. Calendar charts preserve null gaps and show seven-day means only when enough reports exist. A data table accompanies each measure; strain and heuristic index never share an axis. No fuzzy-score trend is drawn across versions.
- Explore computes only on an explicit action, freezes inputs during calculation, and keeps displayed results bound to the submitted snapshot. Saved references are re-read and both sides are computed using the same current model. No scenario enters history and reported feelings are never predicted.
- Settings saves IANA timezone preferences without moving existing dates, downloads an owned-data JSON export, and requires typed DELETE confirmation for history/account deletion. Destructive actions use a freshly read history version. Account deletion requires a sign-in within 15 minutes.
- Loading/error/empty states, request cancellation and late-response guards apply across product screens. Uncertain observation/deletion retries retain their mutation key while the screen is open.

The five sections are local navigation within the existing application; deep-linked routes and browser-back navigation between sections are not implemented. No routing dependency, new infrastructure, browser persistence, or synchronization mechanism was introduced. Large JSON exports are buffered by the browser (server output is streamed); this may be unsuitable for extremely large histories. Minimal retry receipts remain after history deletion to prevent stale request resurrection; account deletion removes them.

## AI and production readiness

Check-in Results and Patterns now include explicitly requested grounded reflections. Optional AI chooses evidence and compatible reflection questions; every displayed factual statement and number is rendered from backend-verified facts. A labeled template fallback works without provider configuration or consent. Settings provides explicit data-sharing consent and revocation; it never enables AI automatically. Reflection requests have stable retry keys, source-version checks and late-response cancellation. Predictive serving is disabled until real data supports leakage-safe evaluation against baselines. The backend includes same-origin release staging, production security headers, structured logs and a test-database backup/restore rehearsal. See the sibling backend docs/PHASES-3-4.md for model policy, privacy, deployment instructions and remaining live-provider/host verification.

The old auto-saving calculator, browser weighted-average inference, duplicated visual rule logic, and medical-style recommendation components have been removed. Existing `stressHistory` browser data is not imported or modified; it is not treated as real daily observations or training labels.

There is no offline calculator or offline synchronization. Unsaved values exist only in the current tab and can be lost on reload; navigation warns when there is an unsaved draft. If the API/database is down, the app does not claim that a save succeeded. Session expiry clears account-specific state rather than exposing it to another account.

## Checks

```powershell
npm run test
npm run lint
npm run typecheck
npm run build
```

Component tests cover intentional saves, score/report separation, retries, double-submit protection, stale responses, explicit missing strain, deletion confirmation, conflicting edits, revision views, pagination snapshots, analytic empty states, scenario non-persistence, settings confirmation, draft navigation and session expiry. They mock HTTP boundaries; the backend separately tests real API and PostgreSQL transactions.

Vite and Vitest use the native config loader because the config is plain ESM JavaScript. This also avoids unnecessary configuration bundling in constrained Windows development environments. TypeScript is checked independently before production builds.

`npm run build` followed by `npm run preview` serves the compiled application on port 5173 and uses the same API proxy. Open http://localhost:5173 so the configured Origin matches. Stop the dev server first; only one server can occupy this port. This is a local verification path, not production hosting.

During Phase 1 verification, this Codex Windows sandbox blocked esbuild's development dependency optimizer while traversing parent directories, despite folder access grants. The compiled preview, component tests, type check, lint, and production build worked with the bundled Node runtime. The dev optimizer has not been verified outside that sandbox; its startup banner alone is not considered a passing browser check.

Legacy Netlify/Vercel files are not a same-origin production API configuration. Hosting consolidation and production verification are deferred to Phase 4. No production deployment is claimed.

## Current check-in redesign

Seven labelled native sliders: sleep 0–12h; workload, deadline pressure, other commitments, recovery and independently reported strain 0–10; screen time 0–16h. Hour steps are 0.25. Unanswered sliders require a deliberate value or midpoint acceptance; strain can be explicitly skipped. Slider changes only update a draft. Explicit save/revision is the only history write, and Calculate scenario remains read-only.

Results display backend-authored explanations, component distributions, actual rule activations and version provenance for fuzzy-3.0.0. Older revisions retain their original model and missing new values. Deadline/recovery are included in personal patterns and exports. The rest of Phases 1–4 is unchanged. See the sibling backend's `docs/FUZZY-3.md` for the 27 rules, product-sum inference and weighted fusion; this new model is not the previous min/max Mamdani algorithm.
