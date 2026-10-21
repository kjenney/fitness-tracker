# Fitness Tracker

Django + DRF backend, React (Vite) frontend.

## Running with Docker

```sh
docker compose up -d --build
```

- Web app: http://localhost:8080
- API (direct): http://localhost:8000/api/

The frontend (nginx) serves the built React app and proxies `/api/` to the
backend, mirroring the Vite dev proxy. The backend runs gunicorn and executes
`migrate` + `seed` on startup.

SQLite data lives in `./data/db.sqlite3` (bind-mounted into the container).
Back it up by copying that file; delete it and `docker compose up` re-seeds a
fresh database.

Stop with `docker compose down` (add `-v` if you ever switch to named volumes).

## Local development (without Docker)

Backend:

```sh
cd backend
../venv/bin/python manage.py runserver  # port 8000
```

Frontend:

```sh
cd frontend
npm run dev  # port 5173, proxies /api to 127.0.0.1:8000
```
