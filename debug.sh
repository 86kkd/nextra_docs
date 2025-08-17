#!/bin/bash

# Debug script for maximum logging output
echo "🐛 Starting debug mode with maximum verbosity..."

# Set all debug environment variables
export NODE_ENV=development
export DEBUG=*
export NEXT_DEBUG=1
export TURBOPACK_LOG_LEVEL=debug
export RUST_LOG=debug,info,warn,error
export NEXT_TELEMETRY_DISABLED=1

# Clear cache first
echo "🧹 Clearing Next.js cache..."
rm -rf .next

# Enable TypeScript strict mode checking
echo "🔍 Checking TypeScript..."
bunx tsc --noEmit --strict || echo "⚠️ TypeScript warnings found (continuing anyway)"

# Start with verbose logging
echo "🚀 Starting development server with debug logging..."
echo "📝 Watch your terminal for detailed error messages!"
echo "📝 Also check browser console at http://localhost:3000"
echo "═══════════════════════════════════════════════════════"

# Run with maximum verbosity
bun dev 2>&1 | tee debug.log