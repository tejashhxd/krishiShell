# KrishiShell Backend

Flask and PostgreSQL backend for farmer authentication, crop listings, market data, and market recommendations.

## Requirements

- Python 3.13 or compatible
- PostgreSQL
- Government of India Data API key for market-price ingestion

## Setup

From the `backend` directory:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
DATA_GOV_API_KEY=YOUR_DATA_GOV_API_KEY
```

Never commit `.env`.

## Run

```powershell
.\venv\Scripts\python.exe app.py
```

The local server runs at `http://127.0.0.1:5000`.

Health check:

```text
GET /api/health
```

## Authentication

Farmer authentication uses:

```text
POST /api/auth/register
POST /api/auth/login
```

Passwords are hashed with bcrypt before being stored in the `farmers.password` column. Passwords are never returned to the frontend.

Example registration body:

```json
{
  "name": "Example Farmer",
  "phone": "9876543210",
  "password": "strong-password"
}
```

The current prototype has no cookies, sessions, or JWT. Listing requests send `farmer_id` from the frontend, so ownership verification is not production-secure yet.

## Crop Listings

Listings are stored in PostgreSQL:

```text
crop_listings
├── id
├── farmer_id
├── crop_id
├── quantity_kg
├── location
├── latitude
├── longitude
├── expected_date
└── created_at
```

Endpoints:

```text
GET    /api/listings?farmer_id=<id>
GET    /api/listings/<listing_id>?farmer_id=<id>
POST   /api/listings
DELETE /api/listings/<listing_id>
```

## Recommendation API

```text
POST /api/analyze
```

Example body:

```json
{
  "crop_id": 3,
  "quantity_kg": 500,
  "latitude": 18.5204,
  "longitude": 73.8567
}
```

The recommendation engine uses stored mandi prices, market coordinates, distance, and estimated transport costs.

Other endpoints:

```text
GET /api/crops
GET /api/geocode?location=Pune
GET /api/markets
GET /api/markets/<market_id>/prices
```

## Market Data

Run ingestion manually:

```powershell
.\venv\Scripts\python.exe scripts/ingest_market_data.py
```

The script fetches government market data and stores crops, markets, and prices in PostgreSQL.

## Deployment

Set `DATABASE_URL` and `DATA_GOV_API_KEY` as deployment environment variables. Deploy the complete `backend` directory so authentication and listing routes are available.
