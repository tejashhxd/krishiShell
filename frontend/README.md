# KrishiShell Frontend

Static HTML, CSS, and vanilla JavaScript frontend for the farmer workflow. React and Vite are not used.

## Structure

```text
frontend/
├── index.html
└── public/
    ├── css/
    ├── js/
    └── pages/
```

Important pages:

- `index.html` - landing page
- `public/pages/login.html` - farmer registration and login
- `public/pages/add-crop.html` - crop listing form
- `public/pages/farmer-dashboard.html` - saved farmer listings
- `public/pages/results.html` - market recommendations
- `public/pages/buyer-unavailable.html` - temporary buyer placeholder

## Run

Open `frontend/index.html` directly, or serve the `frontend` directory with a static server such as VS Code Live Server.

Do not open files from the `public` directory as the site root. The relative paths expect `frontend` to be the root.

## Backend URL

The frontend currently calls the deployed backend:

```text
https://krishishell.onrender.com/api
```

For local development, change `API_BASE_URL` in `public/js/api.js` and `AUTH_API_URL` in `public/js/auth.js` to:

```text
http://127.0.0.1:5000/api
```

The backend must allow the frontend origin through CORS.

## Farmer Flow

1. Create a farmer account or sign in.
2. The frontend stores only basic user identity and `isLoggedIn` in `localStorage`.
3. Passwords are sent to Flask over `fetch()` and are never stored in the browser.
4. Enter crop, quantity, location, and expected date.
5. The location is geocoded by the backend.
6. The listing is saved in PostgreSQL through `POST /api/listings`.
7. The results page fetches the saved listing and calls `POST /api/analyze`.
8. Market matches are displayed with prices, distance, transport cost, and estimated realization.

## Persistence

Crop listings are stored in PostgreSQL. The dashboard fetches them from:

```text
GET /api/listings?farmer_id=<id>
```

The current prototype sends `farmer_id` from `localStorage`; this is convenient for development but is not secure ownership authentication.

The latest recommendation may also be held temporarily in `sessionStorage` for same-tab navigation. The results page can re-fetch the listing and run analysis again using its `listing_id`.

## Buyer Access

Buyer functionality is temporarily unavailable. The **I am a Buyer** button opens `buyer-unavailable.html`, which provides a link back to the main page.

## Troubleshooting

### CORS error

Confirm that:

1. The frontend API URLs point to the deployed backend.
2. The deployed backend includes the current auth and listing routes.
3. Flask-CORS is configured and the backend has been redeployed after changes.

### Results keep loading

Open the browser console and verify that:

- `GET /api/listings/<listing_id>` succeeds.
- `POST /api/analyze` succeeds.
- The browser is not blocking the request because of CORS or a mixed HTTP/HTTPS origin.
