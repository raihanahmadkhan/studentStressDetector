# Student Stress Detector

Understand your stress, see its contributors, and choose a practical next step.

[Try the app](https://stressdetect.netlify.app/) · [Backend](https://github.com/raihanahmadkhan/studentStressDetector-backend)

## Features

- Google sign-in and an editable account profile.
- Seven sliders covering sleep, workload, deadlines, screen time, other commitments, recovery, and reported strain.
- Explainable fuzzy stress estimates from six routine inputs; reported strain stays separate.
- Up to three practical suggestions grounded in active calculation rules.
- Daily history with revisions. Saving again for a date makes the latest submission current.
- Weekly averages and comparisons when sufficient records exist.
- What-if scenarios that never modify history.
- A visual report with charts and a daily-values table, printable as PDF; a complete data backup is also available.
- History and account deletion. Signing in after account deletion creates a new, empty account.

## How it works

React sends same-origin API requests to FastAPI. PostgreSQL stores account data and check-in revisions. The backend combines academic pressure, recovery deficit, and contextual pressure into an explainable fuzzy estimate.

This is an authored heuristic for reflection, not a clinically validated measurement. Trends describe recorded observations and do not establish causes. There is no chatbot, predictive model, or offline synchronization.

## Development

Use Node.js 22.12 or newer and run the companion backend on port 8000.

```sh
npm ci
npm run dev
```

The development server proxies /api to the local backend. No frontend credentials are required. Do not commit local environment files.

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm audit
```

## Stack

React, TypeScript, Vite, Chart.js, Axios, Vitest, and Testing Library. Netlify hosts the frontend; Render hosts the companion service.

## License

MIT — see [LICENSE](LICENSE).
