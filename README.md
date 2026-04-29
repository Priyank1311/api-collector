# API Collection Runner

A lightweight Postman-style API workspace:

- Collections + saved requests (persisted to localStorage)
- Request builder (method, URL, query params, headers, JSON body)
- Response viewer (status, time, headers/body tabs)
- Loading/empty/error states
- Optional dark mode

## Prereqs

- Node.js 18+
- (Optional) Python 3.10+ for the FastAPI backend proxy

## Run (frontend)

```bash
npm install
npm run dev
```

## Run (backend proxy, FastAPI)

The backend is optional, but recommended if you hit browser CORS when calling real APIs.

```bash
cd server
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then copy `.env.example` to `.env` in the project root:

```bash
copy .env.example .env
```

This enables proxy mode via `VITE_BACKEND_URL=http://localhost:8000`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:run
```

## Deploy

Recommended production setup:

- Deploy the FastAPI backend as a web service.
- Deploy the Vite frontend as a static site.
- Point the frontend to the backend with `VITE_BACKEND_URL`.
- Set `CORS_ORIGINS` on the backend to the exact frontend URL.

### Backend on Render

This repo includes `render.yaml` for the backend service.

1. Push the project to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Set these backend environment variables:

```bash
ADMIN_USER=your-admin-user
ADMIN_PASSWORD=your-strong-password
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

The backend start command is:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Render stores SQLite data at `/var/data/data.sqlite3` using the disk configured in `render.yaml`.

### Frontend on Vercel

This repo includes `vercel.json` for the frontend build.

1. Import the same GitHub repo into Vercel.
2. Keep the project root as the repo root.
3. Set this frontend environment variable:

```bash
VITE_BACKEND_URL=https://your-backend-domain.onrender.com
```

4. Deploy.

If you deploy only the frontend, leave `VITE_BACKEND_URL` unset. Direct browser requests will work only for APIs that allow browser CORS.

## Demo URLs

- `https://jsonplaceholder.typicode.com/users`
- `https://jsonplaceholder.typicode.com/posts`

## Notes

- If `VITE_BACKEND_URL` is **unset**, requests are sent directly from the browser.
- If `VITE_BACKEND_URL` is set, requests go through `POST /proxy` on the backend.
