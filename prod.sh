#!/bin/bash
set -euo pipefail

if [ -f "$DB_PATH" ]; then
    NEW_DB=false
else
    NEW_DB=true
fi

./manage.py migrate

if [ "$NEW_DB" = true ]; then
    # create a default admin account if the database is new
    echo "Creating default superuser account"
    ./manage.py createsuperuser --username admin --email admin@example.org --noinput
fi

gunicorn -c config/gunicorn/prod.py
