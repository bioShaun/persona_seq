#!/usr/bin/env sh
set -eu

PRISMA_BIN="./node_modules/.bin/prisma"

echo "Waiting for database..."
until "$PRISMA_BIN" db execute --schema prisma/schema.prisma --stdin <<'SQL' >/dev/null 2>&1
select 1;
SQL
do
  sleep 1
done

echo "Applying schema (db push)..."
"$PRISMA_BIN" db push --schema prisma/schema.prisma --accept-data-loss

echo "Seeding minimal users..."
node ./docker/seed.mjs

echo "Starting Next.js..."
exec node server.js
