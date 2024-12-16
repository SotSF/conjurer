#!/bin/bash

# If local.db already exists, exit
[ -f "local.db" ] && exit 0

echo "No database found, creating local.db..."
drizzle-kit migrate --config=drizzle-local.config.ts
