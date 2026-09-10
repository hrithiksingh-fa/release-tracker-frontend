# Release Tracker — Frontend

React + TypeScript + Vite + Tailwind UI for the release-tracker platform. Talks
to [release-tracker-backend](../release-tracker-backend) (separate repo) over a
plain REST API.

## Pages

- **Clients** (`/`) — list/create clients, each with its Slack channel + Azure
  DevOps connection.
- **Client detail** (`/clients/:id`) — trackers for that client.
- **Tracker grid** (`/trackers/:id`) — the Excel-like view: one row per
  Requirement, sortable, showing derived status, linked ADO work items, and
  latest release note status.
- **Requirement detail** (`/requirements/:id`) — link/create ADO work items,
  see release note history.
- **Review queue** (`/review`) — every `DRAFT` release note waiting on you;
  edit the generated text, then Approve & send to Slack.

## Setup

```bash
cp .env.example .env   # point VITE_API_BASE_URL at the backend
npm install
npm run dev             # http://localhost:5173
```

You'll be prompted for the backend's `ADMIN_API_TOKEN` on first load (stored in
`localStorage`, attached as a Bearer token to every API call — see
`src/store/authStore.ts` / `src/api/client.ts`).

## Deploying

Meant for Vercel: `npm run build` produces a static `dist/` — set
`VITE_API_BASE_URL` as a Vercel project env var pointing at wherever the
backend ends up hosted.
