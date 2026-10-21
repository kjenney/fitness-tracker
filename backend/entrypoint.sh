#!/bin/sh
set -e

python manage.py migrate
python manage.py seed
exec gunicorn fitness_tracker.wsgi:application --bind 0.0.0.0:8000 --workers 2
