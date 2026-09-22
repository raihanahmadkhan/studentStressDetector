# Sign-in startup

Production visits show Google sign-in immediately. Opening or reloading the
ordinary site does not call `/api/me` or `/api/auth/config`. This is the explicit
sign-in fallback for the project's free hosting requirement.

After a successful Google callback, the backend redirects to `/?signed_in=1`.
The frontend captures that marker, removes it from the address bar, and checks
the HttpOnly session cookie through `/api/me`. The marker is not proof of login:
the backend must verify the cookie before the account is rendered. Development
continues to restore local sessions automatically.

Session verification and sign-in configuration are independent. A successful
session check opens the account immediately; it never waits for configuration.
The configuration request can expose sign-in while verification is pending.
Each read has a five-second timeout and no automatic retry loop. A real failure
offers a deliberate retry. Writes are not automatically replayed.

## Hosting diagnosis and limits

On 2026-09-22, the public homepage returned HTTP 200 in approximately 0.95 seconds,
while the proxied `/api/auth/config` request returned no bytes before a 20-second
client timeout. Direct upstream probes also timed out, including before TCP
connection completion. These probes establish an API reachability problem but
do not by themselves prove a cold start; check Render logs for the exact event.
`/api/auth/config` uses neither a database query nor an application session, so
its failure cannot be repaired by deleting or extending login cookies.

The backend repository configures Render's free plan. Render documents that
free web services sleep after 15 minutes idle and take about a minute to wake:
https://render.com/docs/free#spinning-down-on-idle

The immediate sign-in page removes the frontend startup gate, not the hosting
limitation. Google login, its callback, and authenticated API operations still
require a reachable backend. No guaranteed instant login is claimed on this
hosting setup. Session lifetime and cookie security remain unchanged; fresh
sign-in on page entry is a UI policy, not server-side revocation of every cookie.

To remove idle wake-up latency reliably on Render, the backend needs an
always-running compute instance. This project remains on the free plan as
requested. No paid service, keep-alive monitor, or hosting migration was enabled.
Vercel's free Python hosting was considered but not migrated to: serverless
startup, dependency bundle limits, database pooling, distributed rate limiting,
and deployment behavior need verification before it can be called a fix.
