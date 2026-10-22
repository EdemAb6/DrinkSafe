
# DrinkSafe 💧
> Real-time drinking water quality monitoring system

## Migration status

The original PHP dashboard remains in the repository while the application is
being migrated incrementally to a monorepo:

```text
DrinkSafe/
├── frontend/                 # React + Vite + Tailwind dashboard
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── docs/                     # Architecture, deployment, and security guides
├── api/                      # Existing PHP endpoints
├── config/                   # Existing PHP configuration
├── includes/                 # Existing PHP shared code
├── index.html                # Existing PHP-served dashboard
├── script.js
└── style.css
```

Deployment and hardware guidance is documented in:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/deployment.md`](docs/deployment.md)
- [`docs/security.md`](docs/security.md)

The Node.js backend currently provides a health check and ThingSpeak-backed
reading and alert routes. It does not yet connect to PostgreSQL, and it does
not replace the existing PHP dashboard.

### Run the React frontend

In a second terminal, from the repository root:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the Node
backend at `http://localhost:3000`, so start the backend separately. The
frontend does not contain ThingSpeak or database credentials.

### Authentication

The backend uses bcrypt password hashes and JWTs stored in an `httpOnly`,
`sameSite=lax` cookie. The frontend sends requests with credentials but does
not store tokens in localStorage or JavaScript state.

Set a random secret of at least 32 characters in `backend/.env`:

```env
JWT_SECRET=replace_with_at_least_32_random_characters
```

Authentication endpoints are:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/devices
POST /api/devices
```

Reading and alert routes require authentication and select the requested
`deviceId` only when that device belongs to the authenticated user. Without a
`deviceId`, the first owned device is used. Create a device with its
ThingSpeak channel before opening the dashboard.

### CSV export

Authenticated users can export persisted readings for an owned device:

```text
GET /api/readings/export.csv?deviceId=<owned-device-id>
GET /api/readings/export.csv?deviceId=<owned-device-id>&from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z
```

The response is a downloadable CSV containing the external ThingSpeak entry
ID, TDS, temperature, water-quality score, and UTC timestamp. Export data comes
from PostgreSQL, so `PERSIST_READINGS=true` must be enabled for readings to be
available. The dashboard's **Export CSV** button downloads the active device's
stored history.

### Run the backend skeleton

Requirements:

- Node.js 20 or newer
- npm

From the repository root:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Set the ThingSpeak values in `backend/.env` before calling the reading routes:

```env
TS_CHANNEL_ID=your_thingspeak_channel_id
TS_READ_KEY=your_thingspeak_read_key
TS_TIMEOUT_MS=5000
```

Never commit the `.env` file or place the read key in frontend code.

Available Node API routes:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend health check |
| GET | `/api/latest` | Latest ThingSpeak reading |
| GET | `/api/history?range=1h\|6h\|24h` | Historical ThingSpeak readings |
| GET | `/api/alerts` | Recent threshold alerts |

Temporary compatibility aliases are also available at `/api/latest.php`,
`/api/history.php`, and `/api/alerts.php` so the current dashboard can be
migrated without changing its data contract immediately.

### PostgreSQL persistence

PostgreSQL persistence is optional during this migration. It is disabled unless
`PERSIST_READINGS=true`, so the ThingSpeak routes can still be used without a
database.

The initial schema is in
[`backend/migrations/001_initial.sql`](backend/migrations/001_initial.sql).
Apply it using your PostgreSQL client, for example:

```powershell
psql "$env:DATABASE_URL" -f migrations/001_initial.sql
```

The migration creates `users`, `devices`, and `readings`. Before enabling
persistence, create a device and use its UUID as `PERSISTENCE_DEVICE_ID`:

```sql
INSERT INTO devices (name, thingspeak_channel_id)
VALUES ('Primary ThingSpeak device', 'your_thingspeak_channel_id')
RETURNING id;
```

Then configure either `DATABASE_URL` or the individual `DB_*` variables:

```env
PERSIST_READINGS=true
PERSISTENCE_DEVICE_ID=the-device-uuid
DATABASE_URL=postgresql://postgres:password@localhost:5432/drinksafe
```

The latest and history ThingSpeak fetches upsert readings into PostgreSQL using
`(device_id, external_id)` as a unique key. ThingSpeak `entry_id` is used as
the external ID, so repeated polling does not create duplicate readings.

Verify the backend is running:

```text
http://localhost:3000/health
```

The expected response is JSON containing `"status":"ok"`. Keep the existing
PHP application running separately through XAMPP while the migration is in
progress.

DrinkSafe is a web application that displays live TDS, temperature, and water quality score readings from an ESP32 IoT sensor (simulated on Wokwi) via ThingSpeak, visualized on a clean dashboard with automatic alerts.

---

## 🔗 Project Links

| Platform | Link |
|----------|------|
| 🔌 Wokwi Circuit Simulation | [Open on Wokwi](https://wokwi.com/projects/461760647843685377) |
| 📊 ThingSpeak Live Data | [Open on ThingSpeak](https://thingspeak.mathworks.com/channels/3345213) |

---

## Live Data Flow

```
Wokwi (ESP32 simulation) → ThingSpeak → PHP API → Dashboard
```

---

## What You Need Before Starting

- A PC running Windows
- [XAMPP](https://www.apachefriends.org/) installed

---

## Step 1 — Download the Project

Click the green **Code** button → **Download ZIP** and extract it, or run:
```bash
git clone https://github.com/your-username/drinksafe.git
```

---

## Step 2 — Move into XAMPP

Copy the `drinksafe` folder into:
```
C:\xampp\htdocs\drinksafe\
```

---

## Step 3 — Start XAMPP

1. Open **XAMPP Control Panel**
2. Start **Apache** only (no MySQL needed)

---

## Step 4 — Open the Dashboard

Go to:
```
http://localhost/drinksafe/
```

The dashboard will automatically pull live data from ThingSpeak every 5 seconds.

---

## Step 5 — Run the Simulation

1. Open the [Wokwi project](https://wokwi.com/projects/461760647843685377)
2. Press the **Play** button to start the simulation
3. Turn the potentiometer knob to simulate different TDS levels
4. Click the DS18B20 sensor to adjust the temperature value
5. Data appears on [ThingSpeak](https://thingspeak.mathworks.com/channels/3345213) every 15 seconds
6. The dashboard updates automatically

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/latest.php` | Most recent reading from ThingSpeak |
| GET | `/api/history.php?range=1h\|6h\|24h` | Historical data for charts |
| GET | `/api/alerts.php` | Auto-generated alerts from threshold violations |

---

## Alert Thresholds

| Metric | Warning | Unsafe |
|--------|---------|--------|
| TDS | ≥ 300 ppm | ≥ 500 ppm |
| Temperature | ≥ 25°C | ≥ 30°C |
| Water Quality Score | ≤ 75 | ≤ 50 |

Thresholds can be adjusted in `config/db.php`.

---

## Project Structure

```
drinksafe/
├── index.html               # Dashboard UI
├── style.css                # Styles
├── script.js                # Frontend logic + API calls
├── config/
│   └── db.php               # ThingSpeak credentials + thresholds
├── includes/
│   ├── helpers.php          # Shared functions + classifiers
│   └── thingspeak.php       # ThingSpeak API integration
└── api/
    ├── latest.php           # GET — latest reading
    ├── history.php          # GET — historical data
    └── alerts.php           # GET — alerts list
```

---

## Built With

- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Backend:** PHP 8
- **IoT Platform:** ThingSpeak
- **Simulation:** Wokwi (ESP32 + TDS sensor + DS18B20)
- **Local server:** XAMPP

---

*DrinkSafe — University Final Year Project 2026*
