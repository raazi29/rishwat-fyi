#!/usr/bin/env bash
set -euo pipefail
docker compose up -d db
echo "Waiting for Postgres..."
until docker exec rishwat-db pg_isready -U rishwat -d rishwat >/dev/null 2>&1; do sleep 1; done
echo "Postgres ready on localhost:5432"