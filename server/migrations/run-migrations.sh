#!/bin/bash
# Simple script to run migrations against a Neon Postgres database
# Usage: ./run-migrations.sh

set -e

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "Running migrations..."

# Run migrations in order
psql "$DATABASE_URL" -f migrations/001_create_hand_replayer_schema.sql
echo "✅ Schema migration completed"

psql "$DATABASE_URL" -f migrations/002_seed_action_tags.sql
echo "✅ Seed migration completed"

echo "All migrations completed successfully!"

