# DrinkSafe 💧
> Real-time drinking water quality monitoring system

DrinkSafe is a web application that displays live TDS, temperature, and water quality score readings from an ESP32 IoT sensor (simulated on Wokwi) via ThingSpeak, visualized on a clean dashboard with automatic alerts.

---

## Live Data Flow

```
Wokwi (ESP32 simulation) → ThingSpeak → PHP API → Dashboard
```

---

## What You Need Before Starting

- A PC running Windows
- [XAMPP](https://www.apachefriends.org/) installed
- A [ThingSpeak](https://thingspeak.com) account with a channel set up (or use the one already configured)

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

## Step 4 — Configure ThingSpeak

Open `config/db.php` and set your ThingSpeak credentials:
```php
define('TS_CHANNEL_ID', 'your_channel_id');
define('TS_READ_KEY',   'your_read_api_key');
```

Your ThingSpeak channel must have:
- **Field 1** — TDS (ppm)
- **Field 2** — Temperature (°C)
- **Field 3** — Water Quality Score (0–100)

---

## Step 5 — Open the Dashboard

Go to:
```
http://localhost/drinksafe/
```

The dashboard will automatically pull live data from ThingSpeak every 5 seconds.

---

## Step 6 — Run the Simulation (Wokwi)

1. Open the Wokwi project link
2. Press the **Play** button to start the simulation
3. Turn the potentiometer knob to simulate different TDS levels
4. Click the DS18B20 sensor to adjust temperature
5. Data appears on ThingSpeak every 15 seconds, then on your dashboard automatically

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

## GitHub Description (one line)

```
Real-time IoT water quality monitoring dashboard — ESP32 (Wokwi) → ThingSpeak → PHP API → Live dashboard
```

---

*DrinkSafe — University Final Year Project 2026*
