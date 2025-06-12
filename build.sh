#!/bin/bash

# Build script for production deployment
set -e

echo "Building Guia Único Health Simulator for production..."

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist/
mkdir -p dist/

# Build client
echo "Building client application..."
npm run build:client

# Build server
echo "Building server application..."
npm run build:server

echo "Build completed successfully!"
echo "Ready for deployment!"