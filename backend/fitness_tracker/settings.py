import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-fitness-tracker-local-2026"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_ALL_ORIGINS = DEBUG

ROOT_URLCONF = "fitness_tracker.urls"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        # Override with FITNESS_DB_PATH (docker-compose points this at the mounted /data dir)
        "NAME": Path(os.environ.get("FITNESS_DB_PATH", str(BASE_DIR / "db.sqlite3"))),
    }
}

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_TZ = True

# Daily calorie target for dashboard progress (from Ken's macro plan ~2250 kcal)
CALORIE_TARGET = 2250
PROTEIN_TARGET = 170
