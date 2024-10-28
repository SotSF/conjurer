#!/bin/bash

# backup production database
turso db create conjurer-db-backup-$(date +%Y-%m-%d) --from-db conjurer-db
