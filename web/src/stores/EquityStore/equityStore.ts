import { action, makeObservable, observable, reaction } from "mobx";
import {
    EquityResult,
    CalculateEquityResponse,
    Card,
} from "@common/interfaces";
import { cardStore, settingsStore } from "../index";
import { pokerService } from "../../services/index";
import { holeToString, boardToString } from "../../components/utilities";

export class EquityStore {
    @observable
    equityResult: EquityResult | null = null;

    @observable
    isLoading: boolean = false;

    @observable
    error: string | null = null;

    // Separate results for Monte Carlo and Exact modes
    @observable
    equityResultMC: EquityResult | null = null;

    @observable
    equityResultExact: EquityResult | null = null;

    @observable
    isLoadingMC: boolean = false;

    @observable
    isLoadingExact: boolean = false;

    @observable
    errorMC: string | null = null;

    @observable
    errorExact: string | null = null;

    @observable
    players: Card[][] = [];

    @observable
    board: Card[] = [];

    @observable
    dead: Card[] = [];

    @observable
    samples: number = 0;

    @observable
    calculationTimeMC: number | null = null; // Time in milliseconds

    @observable
    calculationTimeExact: number | null = null; // Time in milliseconds

    @observable
    fromCacheMC: boolean = false;

    @observable
    fromCacheExact: boolean = false;

    // Cache keys to track which hand configuration each result is for
    private cacheKeyMC: string | null = null;
    private cacheKeyExact: string | null = null;

    private currentAbortController: AbortController | null = null;
    private currentAbortControllerMC: AbortController | null = null;
    private currentAbortControllerExact: AbortController | null = null;
    private reactionDisposer: (() => void) | null = null;

    constructor() {
        makeObservable(this);

        // Single centralized reaction that watches for card changes and equity calculation mode
        // This ensures only one reaction triggers calculations, even if multiple EquityDisplay components exist
        this.reactionDisposer = reaction(
            () => [
                cardStore.holeCards.length,
                cardStore.holeCards.map((h) => (h ? h.cards : null)),
                cardStore.boardCards.length,
                cardStore.boardCards,
                settingsStore.equityCalculationMode,
            ],
            () => {
                // Check if we have at least 2 players with hole cards
                const validHoles = cardStore.holeCards.filter(
                    (hole) => hole !== undefined && hole !== null
                );

                if (validHoles.length >= 2) {
                    // Trigger calculation - it will cancel any in-flight request
                    this.calculateEquity();
                }
            },
            { fireImmediately: true }
        );
    }

    dispose() {
        if (this.reactionDisposer) {
            this.reactionDisposer();
            this.reactionDisposer = null;
        }
    }

    @action
    reset() {
        // Cancel any in-flight requests
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
        if (this.currentAbortControllerMC) {
            this.currentAbortControllerMC.abort();
            this.currentAbortControllerMC = null;
        }
        if (this.currentAbortControllerExact) {
            this.currentAbortControllerExact.abort();
            this.currentAbortControllerExact = null;
        }

        // Clear all results
        this.equityResult = null;
        this.equityResultMC = null;
        this.equityResultExact = null;
        this.error = null;
        this.errorMC = null;
        this.errorExact = null;
        this.isLoading = false;
        this.isLoadingMC = false;
        this.isLoadingExact = false;
        this.calculationTimeMC = null;
        this.calculationTimeExact = null;
        this.fromCacheMC = false;
        this.fromCacheExact = false;
        this.players = [];
        this.board = [];
        this.dead = [];
        this.samples = 0;
        // Clear cache keys
        this.cacheKeyMC = null;
        this.cacheKeyExact = null;
    }

    /**
     * Generate a cache key for the current hand configuration
     */
    private getCacheKey(players: string[], board: string): string {
        return JSON.stringify({ players, board });
    }

    /**
     * Check if we have cached results for the current hand configuration
     */
    private hasCachedResult(
        mode: "mc" | "exact",
        currentCacheKey: string
    ): boolean {
        if (mode === "mc") {
            return (
                this.equityResultMC !== null &&
                this.cacheKeyMC === currentCacheKey &&
                !this.errorMC
            );
        } else {
            return (
                this.equityResultExact !== null &&
                this.cacheKeyExact === currentCacheKey &&
                !this.errorExact
            );
        }
    }

    @action
    parseEquityResponse(
        response: CalculateEquityResponse,
        mode?: "mc" | "exact",
        cacheKey?: string
    ) {
        // Store the equity result based on mode
        if (mode === "mc") {
            this.equityResultMC = response.equity;
            this.fromCacheMC = response.fromCache ?? false;
            if (cacheKey) {
                this.cacheKeyMC = cacheKey;
            }
        } else if (mode === "exact") {
            this.equityResultExact = response.equity;
            this.fromCacheExact = response.fromCache ?? false;
            if (cacheKey) {
                this.cacheKeyExact = cacheKey;
            }
        } else {
            // Backward compatibility: store in main equityResult
            this.equityResult = response.equity;
        }

        // Store additional information from the response
        this.players = response.players;
        this.board = response.board;
        this.dead = response.dead;
        this.samples = response.equity.samples;
    }

    @action
    formatPlayerOdds(): string {
        if (!this.equityResult) {
            return "";
        }

        const { win } = this.equityResult;
        const oddsStrings = win.map((winPercentage, index) => {
            const percentage = Math.round(winPercentage * 100);
            return `player ${index + 1}: ${percentage}%`;
        });

        return oddsStrings.join(", ");
    }

    @action
    async calculateEquity() {
        // Cancel any in-flight requests
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
        if (this.currentAbortControllerMC) {
            this.currentAbortControllerMC.abort();
            this.currentAbortControllerMC = null;
        }
        if (this.currentAbortControllerExact) {
            this.currentAbortControllerExact.abort();
            this.currentAbortControllerExact = null;
        }

        // Only calculate if we have at least 2 players with hole cards
        const validHoles = cardStore.holeCards.filter(
            (hole) => hole !== undefined && hole !== null
        );

        if (validHoles.length < 2) {
            this.equityResult = null;
            this.equityResultMC = null;
            this.equityResultExact = null;
            this.error = null;
            this.errorMC = null;
            this.errorExact = null;
            this.isLoading = false;
            this.isLoadingMC = false;
            this.isLoadingExact = false;
            this.calculationTimeMC = null;
            this.calculationTimeExact = null;
            this.fromCacheMC = false;
            this.fromCacheExact = false;
            // Clear cache keys when we don't have enough players
            this.cacheKeyMC = null;
            this.cacheKeyExact = null;
            return;
        }

        // Only calculate for pre-flop (0 cards), full flop (3 cards), turn (4 cards), or river (5 cards)
        // Don't calculate during partial flop selection (1-2 cards)
        const boardCardsCount = cardStore.boardCards.length;
        if (boardCardsCount > 0 && boardCardsCount < 3) {
            this.equityResult = null;
            this.equityResultMC = null;
            this.equityResultExact = null;
            this.isLoading = false;
            this.isLoadingMC = false;
            this.isLoadingExact = false;
            this.calculationTimeMC = null;
            this.calculationTimeExact = null;
            this.fromCacheMC = false;
            this.fromCacheExact = false;
            // Clear cache keys when board is incomplete
            this.cacheKeyMC = null;
            this.cacheKeyExact = null;
            return;
        }

        // Convert holes to string format
        const players = validHoles.map(holeToString);

        // Convert board to string format
        const board = boardToString({ cards: cardStore.boardCards });

        // Generate cache key for current hand configuration
        const currentCacheKey = this.getCacheKey(players, board);

        // Get the calculation mode from settings
        const mode = settingsStore.equityCalculationMode;

        // Handle different calculation modes
        if (mode === "Monte Carlo") {
            // Check if we already have MC results for this configuration
            if (this.hasCachedResult("mc", currentCacheKey)) {
                // Results already exist, just update loading state
                this.isLoading = false;
                this.isLoadingMC = false;
                return;
            }
            await this.calculateEquitySingle("mc", currentCacheKey);
        } else if (mode === "Exact") {
            // Check if we already have Exact results for this configuration
            if (this.hasCachedResult("exact", currentCacheKey)) {
                // Results already exist, just update loading state
                this.isLoading = false;
                this.isLoadingExact = false;
                return;
            }
            await this.calculateEquitySingle("exact", currentCacheKey);
        } else if (mode === "Both") {
            await this.calculateEquityBoth(players, board, currentCacheKey);
        }
    }

    @action
    private async calculateEquitySingle(
        calculationMode: "mc" | "exact",
        cacheKey: string
    ) {
        // Cancel any in-flight request
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }

        const validHoles = cardStore.holeCards.filter(
            (hole) => hole !== undefined && hole !== null
        );
        const players = validHoles.map(holeToString);
        const board = boardToString({ cards: cardStore.boardCards });

        // Create a new AbortController for this request
        const abortController = new AbortController();
        this.currentAbortController = abortController;

        // Set loading and error states for both backward compatibility and mode-specific
        this.isLoading = true;
        this.error = null;
        if (calculationMode === "mc") {
            this.isLoadingMC = true;
            this.errorMC = null;
        } else {
            this.isLoadingExact = true;
            this.errorExact = null;
        }

        try {
            const options =
                calculationMode === "mc"
                    ? { mode: "mc" as const, iterations: 50000 }
                    : { mode: "exact" as const };

            // Track calculation start time
            const startTime = performance.now();

            // Call the API with abort signal
            const result = await pokerService.getHandEquity(
                players,
                board,
                options,
                [],
                abortController.signal
            );

            // Only parse the response if this request wasn't aborted
            if (!abortController.signal.aborted) {
                // Calculate duration
                const endTime = performance.now();
                const duration = endTime - startTime;

                // Store calculation time
                if (calculationMode === "mc") {
                    this.calculationTimeMC = duration;
                } else {
                    this.calculationTimeExact = duration;
                }

                this.parseEquityResponse(result, calculationMode, cacheKey);
            }
        } catch (err) {
            // Don't set error for aborted requests
            if (err instanceof Error && err.name === "AbortError") {
                // Request was cancelled, ignore the error
                return;
            }

            // Only set error if this request wasn't aborted
            if (!abortController.signal.aborted) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "Failed to calculate equity";
                this.error = errorMessage;
                this.equityResult = null;
                // Also clear mode-specific result and set error
                if (calculationMode === "mc") {
                    this.equityResultMC = null;
                    this.errorMC = errorMessage;
                } else {
                    this.equityResultExact = null;
                    this.errorExact = errorMessage;
                }
            }
        } finally {
            // Only update loading state if this is still the current request
            if (this.currentAbortController === abortController) {
                this.isLoading = false;
                this.currentAbortController = null;
                if (calculationMode === "mc") {
                    this.isLoadingMC = false;
                } else {
                    this.isLoadingExact = false;
                }
            }
        }
    }

    @action
    private async calculateEquityBoth(
        players: string[],
        board: string,
        cacheKey: string
    ) {
        // Cancel any in-flight requests
        if (this.currentAbortControllerMC) {
            this.currentAbortControllerMC.abort();
            this.currentAbortControllerMC = null;
        }
        if (this.currentAbortControllerExact) {
            this.currentAbortControllerExact.abort();
            this.currentAbortControllerExact = null;
        }

        // Check which results we already have cached
        const hasMCCached = this.hasCachedResult("mc", cacheKey);
        const hasExactCached = this.hasCachedResult("exact", cacheKey);

        // Create separate AbortControllers for each request (only if needed)
        const abortControllerMC = hasMCCached ? null : new AbortController();
        const abortControllerExact = hasExactCached
            ? null
            : new AbortController();
        if (!hasMCCached) {
            this.currentAbortControllerMC = abortControllerMC!;
        }
        if (!hasExactCached) {
            this.currentAbortControllerExact = abortControllerExact!;
        }

        // Set loading states only for modes that need calculation
        if (!hasMCCached) {
            this.isLoadingMC = true;
            this.errorMC = null;
        }
        if (!hasExactCached) {
            this.isLoadingExact = true;
            this.errorExact = null;
        }

        // Make parallel requests only for modes that don't have cached results
        const mcPromise = hasMCCached
            ? Promise.resolve()
            : (() => {
                  const startTime = performance.now();
                  return pokerService
                      .getHandEquity(
                          players,
                          board,
                          { mode: "mc" as const, iterations: 50000 },
                          [],
                          abortControllerMC!.signal
                      )
                      .then((result) => {
                          if (
                              abortControllerMC &&
                              !abortControllerMC.signal.aborted
                          ) {
                              const endTime = performance.now();
                              this.calculationTimeMC = endTime - startTime;
                              this.parseEquityResponse(result, "mc", cacheKey);
                          }
                      });
              })()
                  .catch((err) => {
                      if (
                          abortControllerMC &&
                          !abortControllerMC.signal.aborted &&
                          !(err instanceof Error && err.name === "AbortError")
                      ) {
                          this.errorMC =
                              err instanceof Error
                                  ? err.message
                                  : "Failed to calculate equity (Monte Carlo)";
                          this.equityResultMC = null;
                      }
                  })
                  .finally(() => {
                      if (
                          !hasMCCached &&
                          abortControllerMC &&
                          this.currentAbortControllerMC === abortControllerMC
                      ) {
                          this.isLoadingMC = false;
                          this.currentAbortControllerMC = null;
                      }
                  });

        const exactPromise = hasExactCached
            ? Promise.resolve()
            : (() => {
                  const startTime = performance.now();
                  return pokerService
                      .getHandEquity(
                          players,
                          board,
                          { mode: "exact" as const },
                          [],
                          abortControllerExact!.signal
                      )
                      .then((result) => {
                          if (
                              abortControllerExact &&
                              !abortControllerExact.signal.aborted
                          ) {
                              const endTime = performance.now();
                              this.calculationTimeExact = endTime - startTime;
                              this.parseEquityResponse(
                                  result,
                                  "exact",
                                  cacheKey
                              );
                          }
                      });
              })()
                  .catch((err) => {
                      if (
                          abortControllerExact &&
                          !abortControllerExact.signal.aborted &&
                          !(err instanceof Error && err.name === "AbortError")
                      ) {
                          this.errorExact =
                              err instanceof Error
                                  ? err.message
                                  : "Failed to calculate equity (Exact)";
                          this.equityResultExact = null;
                      }
                  })
                  .finally(() => {
                      if (
                          !hasExactCached &&
                          abortControllerExact &&
                          this.currentAbortControllerExact ===
                              abortControllerExact
                      ) {
                          this.isLoadingExact = false;
                          this.currentAbortControllerExact = null;
                      }
                  });

        // Wait for both requests to complete (or fail)
        await Promise.all([mcPromise, exactPromise]);
    }
}
