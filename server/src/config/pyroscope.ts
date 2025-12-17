const PYROSCOPE_SERVER_URL =
    process.env.PYROSCOPE_SERVER_URL || "http://localhost:4040";
const SERVICE_NAME = process.env.SERVICE_NAME || "ship-inspector-server";
const SERVICE_VERSION = process.env.SERVICE_VERSION || "1.0.0";
const ENVIRONMENT = process.env.NODE_ENV || "development";

/**
 * Initialize Pyroscope continuous profiling
 * Should be called early in the application startup
 */
export function initializePyroscope(): void {
    try {
        // Use dynamic import to handle ESM modules
        import("@pyroscope/nodejs")
            .then((pyroscope) => {
                pyroscope.init({
                    serverAddress: PYROSCOPE_SERVER_URL,
                    appName: SERVICE_NAME,
                    tags: {
                        version: SERVICE_VERSION,
                        environment: ENVIRONMENT,
                    },
                });

                pyroscope.start();

                console.log(
                    `Pyroscope initialized for service: ${SERVICE_NAME}`
                );
                console.log(`Pyroscope server: ${PYROSCOPE_SERVER_URL}`);
                console.log(`Profiling enabled`);
            })
            .catch((error: any) => {
                if (
                    error.code === "MODULE_NOT_FOUND" ||
                    error.message?.includes("Cannot find module")
                ) {
                    console.warn(
                        "Pyroscope package not found. Install with: npm install @pyroscope/nodejs"
                    );
                } else {
                    console.error("Failed to initialize Pyroscope:", error);
                }
            });
    } catch (error: any) {
        console.error("Failed to load Pyroscope:", error);
        // Don't crash the application if Pyroscope fails to initialize
    }
}

/**
 * Gracefully shutdown Pyroscope on process termination
 */
export function shutdownPyroscope(): void {
    import("@pyroscope/nodejs")
        .then((pyroscope) => {
            pyroscope.stop();
            console.log("Pyroscope stopped");
        })
        .catch((error: any) => {
            if (
                error.code !== "MODULE_NOT_FOUND" &&
                !error.message?.includes("Cannot find module")
            ) {
                console.error("Error stopping Pyroscope:", error);
            }
        });
}
