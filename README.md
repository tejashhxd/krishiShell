# KrishiShell

KrishiShell is an agricultural market recommendation platform that helps farmers compare Maharashtra mandi markets based on crop prices, distance, transportation cost, and estimated net realisation.

## Features

- Farmer crop submission flow
- Dynamic crop list loaded from PostgreSQL
- Crop IDs fetched from the backend database
- Farmer-entered location converted to latitude and longitude
- Market recommendation based on:
  - Latest mandi price
  - Distance from farmer location
  - Transportation cost
  - Estimated net realisation
- Recommended market highlighted separately
- Alternative profitable markets displayed
- Unprofitable markets excluded from results
- Daily government market-price data ingestion
- Flask REST API backend
- Plain HTML, CSS, and JavaScript frontend

## Project Structure

```text
krishiShell/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── extentions.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── scripts/
│   │   └── ingest_market_data.py
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    └── my-app/
        ├── public/
        │   ├── pages/
        │   ├── js/
        │   └── css/
        └── package.json
```

## Technologies

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-CORS
- PostgreSQL
- psycopg2
- Requests
- Government of India Data API

### Frontend

- HTML
- CSS
- Vanilla JavaScript

The frontend farmer flow uses static HTML, CSS, and JavaScript. React is not used for the current farmer dashboard implementation.

## Requirements

- Python 3.13 or compatible Python version
- PostgreSQL database
- Government API key from data.gov.in
- Node.js and npm, if using the Vite development server

## Backend Setup

Navigate to the backend directory:

```powershell
cd backend
```

Create and activate a virtual environment if required:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install dependencies using the same Python interpreter that runs the application:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

Create a file named `.env` inside the `backend` directory:

```env
DATABASE_URL=postgresql+psycopg2://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
DATA_GOV_API_KEY=YOUR_DATA_GOV_API_KEY
```

> **Important:** Do not commit `.env` to Git.

Start the Flask backend:

```powershell
.\venv\Scripts\python.exe app.py
```

The backend runs at:

```text
http://127.0.0.1:5000
```

Check backend health:

```powershell
curl http://127.0.0.1:5000/api/health
```

Expected response:

```json
{
  "message": "KrishiSell backend is running"
}
```

## Frontend Setup

Navigate to the frontend directory:

```powershell
cd frontend/my-app
```

Install dependencies if required:

```powershell
npm install
```

Start the frontend development server:

```powershell
npm run dev
```

The frontend is usually available at:

```text
http://127.0.0.1:5173
```

The farmer pages are located in:

```text
frontend/my-app/public/pages/
```

Important pages:

- `login.html`
- `farmer-dashboard.html`
- `add-crop.html`
- `results.html`

## Farmer Recommendation Flow

1. The farmer opens the **Add Crop** page.
2. The frontend requests available crops from:

   ```text
   GET /api/crops
   ```

3. Crop names and database IDs are loaded dynamically.
4. The farmer selects a crop and enters:
   - Quantity
   - Farm or mandi location
5. The frontend sends the entered location to:

   ```text
   GET /api/geocode?location=Pune
   ```

6. The backend converts the location into latitude and longitude.
7. The frontend sends the recommendation request:

   ```text
   POST /api/analyze
   ```

Example request:

```json
{
  "crop_id": 3,
  "quantity_kg": 500,
  "latitude": 18.5204,
  "longitude": 73.8567
}
```

8. The backend evaluates available Maharashtra markets.
9. The results page displays:
   - Recommended market
   - Alternative profitable markets
   - Distance
   - Mandi modal price
   - Transport cost
   - Net price per kilogram
   - Estimated net realisation

If no market is profitable after transportation costs, the page displays:

```text
No Profitable Markets Found
```

Negative values are not shown to the farmer.

## API Endpoints

### Health Check

```text
GET /api/health
```

### Get Crops

```text
GET /api/crops
```

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Onion"
    }
  ]
}
```

### Geocode Farmer Location

```text
GET /api/geocode?location=Pune
```

### Analyze Market Recommendation

```text
POST /api/analyze
```

Request body:

```json
{
  "crop_id": 3,
  "quantity_kg": 500,
  "latitude": 18.5204,
  "longitude": 73.8567
}
```

### Get Markets

```text
GET /api/markets
```

### Get Market Prices

```text
GET /api/markets/<market_id>/prices
```

## Market Data Ingestion

Market prices are fetched from the Government of India Data API and stored in PostgreSQL.

Run the ingestion script manually:

```powershell
cd backend
.\venv\Scripts\python.exe scripts/ingest_market_data.py
```

The script:

- Fetches Maharashtra mandi records
- Creates missing crops
- Creates missing markets
- Stores market prices
- Avoids duplicate market-price records
- Uses arrival date, crop, market, variety, and grade for duplicate detection

The script requires:

```env
DATA_GOV_API_KEY=YOUR_DATA_GOV_API_KEY
```

The current script is configured to ingest Tomato data from Maharashtra. It can be extended to process additional commodities.

## Daily Data Updates

For production, run the ingestion script once daily using:

- Deployment platform cron jobs
- GitHub Actions scheduled workflows
- Windows Task Scheduler
- Linux cron

Recommended flow:

```text
Daily scheduler
      ↓
ingest_market_data.py
      ↓
Government market API
      ↓
Validate and normalize data
      ↓
PostgreSQL
      ↓
Farmer recommendation API
```

The ingestion script should run after the government API publishes the daily market data.

## Database

The application uses PostgreSQL through the `DATABASE_URL` environment variable.

SQLite is not used.

The backend must not be started without a valid PostgreSQL connection string:

```env
DATABASE_URL=postgresql+psycopg2://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
```

## Troubleshooting

### `ModuleNotFoundError: No module named 'requests'`

Install packages using the exact backend interpreter:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

### `DATABASE_URL must be set`

Create `backend/.env` and add your PostgreSQL connection string.

### `Failed to fetch`

Make sure:

1. Flask is running on port `5000`.
2. The frontend is using the correct backend URL.
3. PostgreSQL is reachable.
4. CORS is enabled.
5. The backend terminal does not show a database error.

### `SSL connection has been closed unexpectedly`

This indicates a PostgreSQL connection problem. Check:

- Database provider status
- SSL requirements
- Connection string
- Database connection limits
- Whether the connection has expired

### No profitable markets found

This means all available markets have a net price less than or equal to zero after transportation costs.

## Security

- Never commit `.env`.
- Never expose database passwords.
- Never expose the government API key.
- Use environment variables for secrets.
- Use a restricted PostgreSQL user in production.

## Current Scope

### Currently Implemented

- Farmer dashboard flow
- Farmer crop analysis
- Market recommendation
- Alternative market results
- PostgreSQL market data
- Government market data ingestion

### Currently Outside the Main Scope

- Backend authentication
- Buyer-side backend integration
- Buyer demand persistence
- Farmer listing persistence in PostgreSQL