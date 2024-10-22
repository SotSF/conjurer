#!/bin/bash

# If local.db already exists, exit
[ -f "local.db" ] && exit 0

drizzle-kit migrate --config=drizzle-local.config.ts
