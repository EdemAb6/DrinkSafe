# DrinkSafe deployment guide

## Recommended student-project deployment

Use three managed pieces:

```text
Vercel or static hosting
    -> React/Vite frontend

Render or Railway
    -> Node.js/Express backend

Managed PostgreSQL
    -> Users, devices, readings, and future alerts
```

For a small final-year project, begin with one backend service and one
managed PostgreSQL database. Avoid Kubernetes, self-managed servers, and
multiple backend services until there is a measured need.

## Deployment responsibilities

### Frontend

Build the Vite application:

```powershell
cd frontend
npm ci
npm run build
```

Deploy the generated `frontend/dist` directory as a static site.

Set the frontend environment variable:

```env
VITE_API_BASE_URL=https://api.example.com/api
VITE_API_TIMEOUT_MS=8000
```

The frontend environment must contain public URLs only. It must not contain
ThingSpeak read/write keys, database credentials, JWT secrets, or device
tokens.

### Backend

Use the backend start command:

```text
npm start
```

The hosting platform must provide a `PORT` environment variable or the service
must use its configured port. Configure:

```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://app.example.com
TS_CHANNEL_ID=<server-side-channel-id>
TS_READ_KEY=<server-side-read-key>
TS_TIMEOUT_MS=5000
PERSIST_READINGS=true
DATABASE_URL=<managed-postgresql-url>
DB_SSL=true
JWT_SECRET=<long-random-secret>
AUTH_COOKIE_NAME=drinksafe_token
AUTH_COOKIE_MAX_AGE_MS=86400000
```

The exact port is platform-specific; use the platform-provided value when
required. Do not copy production values into `.env.example`.

The backend must expose:

```text
GET /health
```

Configure the platform health check to use this route. A deployment is not
ready until the health check and an authenticated API request both work.

### PostgreSQL

1. Create a managed PostgreSQL database in the same region as the backend.
2. Apply `backend/migrations/001_initial.sql`.
3. Apply `backend/migrations/002_auth_device_ownership.sql`.
4. Create the first user through the application.
5. Create a device associated with its ThingSpeak channel.
6. Set `PERSIST_READINGS=true` only after the schema is verified.
7. Confirm that readings are being inserted and duplicate polling is
   idempotent.

Use the provider's private connection URL where available. Keep the database
unreachable from the public internet if the provider supports private
networking.

## Platform options

### Render

- Deploy `backend` as a web service.
- Deploy `frontend` as a static site.
- Use Render PostgreSQL or another managed PostgreSQL provider.
- Set `CORS_ORIGIN` to the exact frontend origin.
- Configure health checks and environment secrets in the dashboard.

### Railway

- Deploy the backend from the repository with its root directory set to
  `backend`.
- Add a PostgreSQL service.
- Deploy the frontend separately or use a static host.
- Set the public backend URL as the frontend `VITE_API_BASE_URL`.

### Vercel

- Deploy the Vite frontend as a Vercel project.
- Host the long-running Express backend on Render, Railway, or another
  Node-compatible service.
- Configure the exact frontend origin in backend CORS settings.
- Do not assume that deploying the frontend to Vercel also deploys the
  Express server.

## Cookie and domain considerations

The current authentication cookie is `httpOnly` and `sameSite=lax`. Prefer
serving the frontend and API from the same parent domain, for example:

```text
app.example.com
api.example.com
```

If frontend and API are on unrelated sites, cookie policy and browser privacy
restrictions become more difficult. Re-evaluate cookie settings and CSRF
protection before using that arrangement in production.

## Deployment checklist

- [ ] Frontend and backend use HTTPS.
- [ ] `CORS_ORIGIN` is an exact production frontend origin.
- [ ] Production secrets exist only in the hosting provider's secret store.
- [ ] Database migrations have been applied.
- [ ] `/health` returns success.
- [ ] Registration and login work.
- [ ] A user can see only their own device data.
- [ ] ThingSpeak reads work from the deployed backend.
- [ ] PostgreSQL persistence is enabled and duplicate-safe.
- [ ] CSV export works for stored readings.
- [ ] Logs do not contain passwords, tokens, or API keys.
- [ ] Database backup and restore have been tested.
