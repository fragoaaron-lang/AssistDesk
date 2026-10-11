#!/usr/bin/env bash

# Root start script used by Railpack to run the app
# Reproducibly installs dependencies and starts the server from the `server/` folder

set -euo pipefail

echo "Installing server dependencies..."
npm ci --prefix server --omit=dev --no-fund --no-audit
 
if [ -d "client" ]; then
	echo "Installing client dependencies..."
	npm ci --prefix client --no-fund --no-audit
	echo "Building client..."
	npm --prefix client run build
fi

echo "Starting server..."
npm start --prefix server
