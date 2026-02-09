import { WasmModule } from "./types";
import * as path from "path";
import * as fs from "fs";

export interface WasmLoadResult {
    module: WasmModule;
    loadTimeMs: number;
}

let wasmModule: WasmModule | null = null;
let wasmModulePromise: Promise<WasmLoadResult> | null = null;

/**
 * Initialize the WASM module (lazy loading).
 * Returns the module and the time spent loading it (0 if already cached).
 */
export async function initWasmModule(): Promise<WasmLoadResult> {
    if (wasmModule) {
        return { module: wasmModule, loadTimeMs: 0 };
    }

    if (wasmModulePromise) {
        return wasmModulePromise;
    }

    wasmModulePromise = (async (): Promise<WasmLoadResult> => {
        const loadStart = Date.now();
        try {
            // Try to load WASM module from the wasm-equity/pkg directory
            // This will be built using wasm-pack build --target nodejs
            // From dist/lib/src/wasm/, go up 2 levels to dist/lib/
            // Path: dist/lib/src/wasm/ -> ../../ -> dist/lib/
            const wasmPath = path.resolve(
                __dirname,
                "../../wasm-equity/pkg/wasm_equity.js"
            );

            // wasm-pack with --target nodejs exports the module directly
            // Check if file exists first
            if (!fs.existsSync(wasmPath)) {
                throw new Error(
                    `WASM module not found at ${wasmPath}. Please run 'wasm-pack build --target nodejs' in the wasm-equity directory.`
                );
            }

            // wasm-pack with --target nodejs exports init function
            const wasmInit = require(wasmPath);
            // wasm-pack nodejs target exports init as default or directly
            const wasmInstance = wasmInit.default
                ? await wasmInit.default()
                : wasmInit;
            if (!wasmInstance) {
                throw new Error(
                    "WASM module initialization returned null/undefined"
                );
            }
            wasmModule = wasmInstance;
            const loadTimeMs = Date.now() - loadStart;
            return { module: wasmInstance, loadTimeMs };
        } catch (error: any) {
            throw new Error(
                `Failed to load WASM equity module: ${error.message || error}. Make sure to run 'wasm-pack build --target nodejs' in the wasm-equity directory.`
            );
        }
    })();

    return wasmModulePromise;
}
