# DrinkSafe 💧

DrinkSafe is a real-time drinking-water quality monitoring dashboard for TDS,
water temperature, and water-quality score readings from an ESP32 sensor or a
Wokwi simulation.

The current application uses a React dashboard and a Node.js API. ThingSpeak
is the sensor-data gateway, while PostgreSQL can optionally persist readings
for history and CSV export.

## Current data flow

```text
ESP32 or Wokwi
    → ThingSpeak
    → Node.js/Express API
    → optional PostgreSQL persistence
    → React/Vite dashboard
```

The ESP32 currently publishes these ThingSpeak fields:

| Field | Meaning | Unit |
|-------|---------|------|
| `field1` | TDS | ppm |
| `field2` | Water temperature | °C |
| `field3` | Water-quality score | /100 |

The ThingSpeak read key is kept on the backend and is never exposed to the
frontend.

## Features

- React 19 dashboard built with Vite and Tailwind CSS.
- Live TDS, temperature, and water-quality score cards.
- Automatic classification of readings as safe, warning, or unsafe.
- Historical charts for `1h`, `6h`, and `24h` ranges.
- Automatic alerts for threshold violations.
- User registration, login, logout, and session restoration.
- Password hashing with bcrypt and JWTs stored in `httpOnly` cookies.
- User-owned ThingSpeak device setup.
- Server-side authorization checks for device data.
- Optional PostgreSQL persistence with duplicate-safe ThingSpeak upserts.
- CSV export for persisted readings with optional date filters.
- Retry and stale-reading states when the sensor service is unavailable.

## Project structure

```text
DrinkSafe/
├── backend/
│   ├── migrations/
│   │   ├── 001_initial.sql
│   │   └── 002_auth_device_ownership.sql
│   ├── src/
│   │   ├── config/             # Environment configuration
│   │   ├── db/                 # PostgreSQL connection pool
│   │   ├── middleware/         # Authentication and device authorization
│   │   ├── repositories/       # Database access
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Auth, ThingSpeak, classification, CSV
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Dashboard and authentication UI
│   │   ├── hooks/              # Dashboard data loading
│   │   ├── services/           # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   └── security.md
└── README.md
```

## Requirements

- Node.js 20 or newer
- npm
- ThingSpeak channel credentials
- PostgreSQL only if persistence or CSV export is required

## Local development

### 1. Install dependencies

From the repository root, install dependencies for both applications:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### 2. Configure the backend

Create `backend/.env` and set the values required for the features you want to
use:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

TS_CHANNEL_ID=your_thingspeak_channel_id
TS_READ_KEY=your_thingspeak_read_key
TS_TIMEOUT_MS=5000

JWT_SECRET=replace_with_at_least_32_random_characters
AUTH_COOKIE_NAME=drinksafe_token
AUTH_COOKIE_MAX_AGE_MS=86400000
```

Never commit `.env` files or put ThingSpeak keys, database credentials, JWT
secrets, or device tokens in frontend code.

### 3. Start the backend

```powershell
cd backend
npm run dev
```

The API runs at `http://localhost:3000`. Verify it with:

```text
http://localhost:3000/health
```

The response should contain `"status":"ok"`.

### 4. Start the frontend

In a second terminal:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`. During local development, Vite proxies `/api`
requests to `http://localhost:3000`.

The frontend can also be configured with:

```env
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=8000
```

These variables contain public API configuration only.

## Authentication and devices

Create an account in the dashboard or use the API:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

After signing in, create a device with its ThingSpeak channel ID:

```text
GET  /api/devices
POST /api/devices
```

Example request body:

```json
{
  "name": "Main water sensor",
  "thingspeak_channel_id": "3345213"
}
```

Reading, alert, and export requests require authentication. The backend
confirms that the requested device belongs to the signed-in user before
returning data.

## API routes

All routes below are served by the Node.js backend. Routes other than
`/health` require authentication and an authorized device where applicable.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend health check |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear the session cookie |
| GET | `/api/auth/me` | Return the current user |
| GET | `/api/devices` | List the user's devices |
| POST | `/api/devices` | Create a ThingSpeak-backed device |
| GET | `/api/latest` | Latest reading |
| GET | `/api/history?range=1h\|6h\|24h` | Historical readings |
| GET | `/api/alerts` | Recent threshold alerts |
| GET | `/api/readings/export.csv` | Export persisted readings as CSV |

The legacy `.php` paths `/api/latest.php`, `/api/history.php`, and
`/api/alerts.php` remain available as compatibility aliases for older clients.
They are handled by the Node.js API; the application no longer requires PHP or
XAMPP.

## PostgreSQL persistence

Persistence is disabled unless `PERSIST_READINGS=true`. Without persistence,
the dashboard can still read the current ThingSpeak feed and display live
history returned by ThingSpeak.

Apply both migrations in order:

```powershell
cd backend
psql "$env:DATABASE_URL" -f migrations/001_initial.sql
psql "$env:DATABASE_URL" -f migrations/002_auth_device_ownership.sql
```

Then configure either `DATABASE_URL` or all required `DB_*` variables:

```env
PERSIST_READINGS=true
DATABASE_URL=postgresql://user:password@localhost:5432/drinksafe
DB_SSL=false
```

When using the legacy global persistence configuration without a selected
device, set `PERSISTENCE_DEVICE_ID` to an existing device UUID. Normal
authenticated dashboard requests persist against the authorized device
automatically.

When persistence is enabled, ThingSpeak readings are upserted using the
device ID and ThingSpeak `entry_id`. Repeated polling therefore does not create
duplicate rows. CSV export reads from PostgreSQL:

```text
GET /api/readings/export.csv?deviceId=<owned-device-id>
GET /api/readings/export.csv?deviceId=<owned-device-id>&from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z
```

## Alert thresholds

| Metric | Warning | Unsafe |
|--------|---------|--------|
| TDS | ≥ 300 ppm | ≥ 500 ppm |
| Temperature | ≥ 25°C | ≥ 30°C |
| Water-quality score | ≤ 75 | ≤ 50 |

The thresholds are defined in the backend classification service and are used
by the latest-reading status fields and alert feed.

## Wokwi simulation

The project can be tested with the existing [Wokwi circuit simulation](https://wokwi.com/projects/461760647843685377):

1. Open the Wokwi project and press **Play**.
2. Adjust the potentiometer to simulate different TDS levels.
3. Adjust the DS18B20 sensor to change the temperature.
4. Confirm that values are published to the
   [ThingSpeak channel](https://thingspeak.mathworks.com/channels/3345213).
5. Sign in to the local dashboard and configure a device using the matching
   channel ID.

## Production deployment

Build the frontend:

```powershell
cd frontend
npm ci
npm run build
```

Deploy `frontend/dist` to a static host such as Vercel. Deploy the backend as a
Node.js service on a platform such as Render or Railway, and use a managed
PostgreSQL database when persistence is needed.

At minimum, production configuration should include:

```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://app.example.com
TS_CHANNEL_ID=your_thingspeak_channel_id
TS_READ_KEY=your_thingspeak_read_key
JWT_SECRET=your_long_random_secret
DATABASE_URL=your_managed_postgresql_url
DB_SSL=true
PERSIST_READINGS=true
```

Use HTTPS, set `CORS_ORIGIN` to the exact frontend origin, and store all
secrets in the hosting provider's secret manager.

For detailed guidance, see:

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)

## Project links

| Platform | Link |
|----------|------|
| Wokwi circuit simulation | [Open on Wokwi](https://wokwi.com/projects/461760647843685377) |
| ThingSpeak live data | [Open on ThingSpeak](https://thingspeak.mathworks.com/channels/3345213) |

---

*DrinkSafe — University Final Year Project 2026*
