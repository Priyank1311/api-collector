# FastAPI backend (optional)

This backend provides:

- `GET /health` health check
- `GET /demo/users` a tiny demo endpoint
- `POST /proxy` a request runner proxy (helps avoid browser CORS when using the frontend)
- `GET/PUT /api/workspace` stores the frontend workspace snapshot (collections + draft)
- `GET /admin` password-protected dashboard for saved workspace + proxy logs

## Run

```bash
cd server
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
set ADMIN_USER=admin
set ADMIN_PASSWORD=admin
set CORS_ORIGINS=http://localhost:5173
uvicorn main:app --reload --port 8000
```

## Production environment

Set these variables on your hosting platform:

```bash
ADMIN_USER=your-admin-user
ADMIN_PASSWORD=your-strong-password
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

`CORS_ORIGINS` accepts a comma-separated list when you have multiple frontend domains.
On no-payment free hosting, leave `DB_PATH` unset. Local SQLite data can reset when the service restarts, sleeps, or redeploys.
Use a persistent disk/volume for `DB_PATH` only if you later move to a paid plan and want saved workspaces and proxy logs to survive redeploys.

## Admin dashboard

Open `http://localhost:8000/admin` and login using `ADMIN_USER` / `ADMIN_PASSWORD`.
