#!/bin/bash
set -e

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack not found. Installing..."
    # Install wasm-pack using cargo if available
    if command -v cargo &> /dev/null; then
        cargo install wasm-pack
    else
        echo "Error: Neither wasm-pack nor cargo is available."
        echo "Please install Rust and wasm-pack:"
        echo "  1. Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        echo "  2. Install wasm-pack: cargo install wasm-pack"
        exit 1
    fi
fi

# Build the WASM module
echo "Building WASM module..."
wasm-pack build --target nodejs --out-dir pkg

echo "WASM build complete!"

