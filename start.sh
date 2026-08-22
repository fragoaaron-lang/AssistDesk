#!/usr/bin/env bash

# Root start script used by Railpack to run the app
# Installs server deps and starts the server from the `server/` folder

set -euo pipefail

echo "Installing server dependencies..."
npm install --prefix server --no-fund --no-audit
 
if [ -d "client" ]; then
	echo "Installing client dependencies..."
	npm install --prefix client --no-fund --no-audit || true
	echo "Building client..."
	npm --prefix client run build || true
fi

echo "Starting server..."
npm start --prefix server
