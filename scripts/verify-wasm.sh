#!/bin/bash
# Verify WASM package exists before deployment
# This ensures the build won't fail at runtime due to missing WASM files

set -e

WASM_PKG_DIR="server/wasm-equity/pkg"
REQUIRED_FILES=(
    "wasm_equity.js"
    "wasm_equity_bg.wasm"
    "wasm_equity.d.ts"
    "wasm_equity_bg.wasm.d.ts"
)

echo "🔍 Verifying WASM package..."

if [ ! -d "$WASM_PKG_DIR" ]; then
    echo "❌ ERROR: WASM package directory not found: $WASM_PKG_DIR"
    echo ""
    echo "   Solution: Run 'npm run prebuild:wasm' to build the WASM package"
    echo "   Or commit the pre-built WASM files to the repository"
    exit 1
fi

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$WASM_PKG_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "❌ ERROR: Missing required WASM files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $WASM_PKG_DIR/$file"
    done
    echo ""
    echo "   Solution: Run 'npm run prebuild:wasm' to build the WASM package"
    exit 1
fi

echo "✅ WASM package verified - all required files present"
exit 0

