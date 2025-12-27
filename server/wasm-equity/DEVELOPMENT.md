# Development Guide

## Git and Build Artifacts

### What to Commit

**DO commit:**
- Source code: `src/lib.rs`
- Configuration: `Cargo.toml`
- Documentation: `README.md`, `BUILD_AND_TEST.md`, etc.
- Benchmark scripts: `benchmark.js`, `compare-performance.js`
- **Pre-built WASM binaries**: `pkg/` directory

**DO NOT commit:**
- `target/` directory - Rust build artifacts (already in `.gitignore`)
- `Cargo.lock` - Dependency lock file (already in `.gitignore`)
- `*.rs.bk` - Rust backup files (already in `.gitignore`)

### Why Commit Pre-built WASM?

The `pkg/` directory contains the compiled WASM module and is **intentionally committed** to Git. This allows:

1. **Users don't need Rust toolchain** - They can run the application without installing Rust/wasm-pack
2. **Faster deployment** - CI/CD doesn't need to compile Rust
3. **Consistent builds** - Everyone uses the same compiled binary

### Development Workflow

#### When you modify `src/lib.rs`:

```bash
# 1. Build the WASM module
cd server
npm run build:wasm

# 2. Test it
cd wasm-equity
node benchmark.js

# 3. Commit both source and compiled output
git add wasm-equity/src/lib.rs
git add wasm-equity/pkg/
git commit -m "feat: optimize equity calculation"
```

#### For production deployment:

Users only need Node.js - the pre-built WASM in `pkg/` will be used automatically.

#### For development (modifying Rust code):

Install Rust toolchain:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Build
cd server
npm run build:wasm
```

## Build Artifacts Explained

### `target/` Directory (NOT committed)
- Contains intermediate build files
- Can be safely deleted (`rm -rf target`)
- Will be regenerated on next build
- Size: ~100-500 MB

### `pkg/` Directory (COMMITTED)
- Contains final WASM output
- Used by Node.js application
- Size: ~100-200 KB
- Must be committed after rebuilding

## Cleaning Up

If you accidentally committed `target/`:

```bash
# Remove from Git (already done)
git rm -r --cached server/wasm-equity/target/

# Add to .gitignore (already done)
echo "**/target/" >> .gitignore

# Commit the cleanup
git add .gitignore
git commit -m "chore: ignore Rust build artifacts"
```

## CI/CD Considerations

If you want to build WASM in CI instead of committing it:

1. Remove `pkg/` from Git
2. Add build step to CI:
   ```yaml
   - name: Install Rust
     uses: actions-rs/toolchain@v1
   - name: Install wasm-pack
     run: cargo install wasm-pack
   - name: Build WASM
     run: cd server && npm run build:wasm
   ```
3. Update deployment to include `pkg/` directory

**Current approach**: We commit `pkg/` for simplicity and faster deployments.




