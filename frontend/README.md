# Daily CatchUp

Daily CatchUp is a Next.js frontend backed by the Express API in `../backend`.
The browser sends API requests to the frontend's own `/api` path. Next.js
forwards those requests to the backend, so auth cookies remain first-party in
both local development and production.

## Local development

1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. Copy `backend/.env.example` to `backend/.env` and set your MongoDB and AI
   service credentials. Use a random `JWT_SECRET` of at least 32 characters.
3. Start the API from `backend`:

   ```powershell
   npm install
   npm run dev
   ```

4. Start the frontend from `frontend`:

   ```powershell
   npm install
   npm run dev
   ```

   The frontend defaults to `http://localhost:3000`. If you run it on another
   port, add that exact origin to the comma-separated `FRONTEND_URL` in the
   backend environment and restart the API.

## Production configuration

- Set `BACKEND_URL` in the frontend deployment environment to the backend's
  origin, for example `https://api.example.com`. It is read by Next.js during
  the production build; do not expose it as a `NEXT_PUBLIC_*` variable.
- Set backend `NODE_ENV=production`, `JWT_SECRET` to a unique random value of
  at least 32 characters, `MONGO_URI`, `DB_NAME`, `GEMINI_API_KEY`, and
  `TAVILY_API_KEY`.
- Set backend `FRONTEND_URL` to the frontend's exact HTTPS origin, with no
  path, for example `https://daily-catchup.example.com`. Multiple allowed
  origins may be comma-separated.
- Do not set `NEXT_PUBLIC_API_URL`; browser requests must use the same-origin
  `/api` proxy for the secure auth cookie to work reliably across deployments.

## Validation

```powershell
npm run lint
npm run build
```
