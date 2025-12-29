#!/bin/bash
# Pre-build WASM package for committing to repository
# This allows Vercel builds to skip the slow WASM compilation step

set -e

echo "🔨 Pre-building WASM package for repository..."
echo "   This will allow Vercel builds to skip WASM compilation (~2-3 min savings)"

cd "$(dirname "$0")/../server/wasm-equity"

# Run the build script
bash build.sh

# Verify the build output
if [ ! -f "pkg/wasm_equity.js" ] || [ ! -f "pkg/wasm_equity_bg.wasm" ]; then
    echo "❌ WASM build failed - required files not found"
    exit 1
fi

echo ""
echo "✅ WASM pre-build complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review the generated files in server/wasm-equity/pkg/"
echo "   2. Commit these files to the repository:"
echo "      git add server/wasm-equity/pkg/"
echo "      git commit -m 'chore: pre-build WASM package for faster Vercel builds'"
echo ""
echo "   After committing, Vercel builds will skip WASM compilation unless"
echo "   the source files (src/lib.rs or Cargo.toml) change."

