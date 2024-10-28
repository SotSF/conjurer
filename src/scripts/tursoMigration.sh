#!/bin/bash

# Remove local database if it exists already
[ -f local.db ] && rm local.db

drizzle-kit migrate --config=drizzle-local.config.ts

ts-node -T --project tsconfig.script.json src/scripts/tursoMigration.ts

# Create dump of local database
sqlite3 local.db .dump > dump.sql

# Use with care. Load dump into prod database
# turso db shell conjurer-db < local.sql
