#!/bin/bash
set -e

# Ensure PATH includes cargo bin (for Vercel and other CI environments)
export PATH="$HOME/.cargo/bin:$PATH"

# Check if Rust is available (Vercel should have it when Cargo.toml is detected)
if ! command -v cargo &> /dev/null; then
    echo "⚠️  Rust/cargo not found. Installing Rust (this may take a few minutes)..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    export PATH="$HOME/.cargo/bin:$PATH"
    # Try to source cargo env if available
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi
    # Verify installation
    if ! command -v cargo &> /dev/null; then
        echo "❌ Failed to install Rust. Please ensure Rust is available in your build environment."
        exit 1
    fi
    echo "✅ Rust installed successfully"
else
    echo "✅ Rust/cargo is available"
fi

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "⚠️  wasm-pack not found. Installing via cargo (this may take a few minutes)..."
    cargo install wasm-pack --locked
    export PATH="$HOME/.cargo/bin:$PATH"
    # Verify installation
    if ! command -v wasm-pack &> /dev/null; then
        echo "❌ Failed to install wasm-pack"
        exit 1
    fi
    echo "✅ wasm-pack installed successfully"
else
    echo "✅ wasm-pack is available"
fi

# Build the WASM module
echo "🔨 Building WASM module..."
wasm-pack build --target nodejs --out-dir pkg

echo "✅ WASM build complete!"

