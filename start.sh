#!/usr/bin/env bash

# Root start script used by Railpack to run the app
# Installs server deps and starts the server from the `server/` folder

set -euo pipefail

echo "Installing server dependencies..."
npm install --prefix server --no-fund --no-audit

echo "Starting server..."
npm start --prefix server
