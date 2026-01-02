
# SKE Frontend (React + Vite)

This is the frontend app for the SKE monorepo.

For full project documentation (backend + frontend features, API overview, env vars), see the root README:

- ../README.md

## Run Locally

```bash
npm install
npm run dev
```

## Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

## Build

```bash
npm run build
npm run preview
```
