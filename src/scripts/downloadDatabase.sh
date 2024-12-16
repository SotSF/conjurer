#!/bin/bash

# Remove local database if it exists already
[ -f local.db ] && rm local.db

# Download the database from the server
turso db shell conjurer-db .dump | sqlite3 local.db
