import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { outsStore } from "../../stores";
import { styles } from "./styles.css";
import { SUITS, RANKS } from "../utilities";

@customElement("outs-display")
export class OutsDisplay extends MobxLitElement {
    static readonly TAG_NAME = "outs-display";

    static styles = styles;

    @property({ type: Number })
    playerIndex: number = 0;

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    /**
     * Get category name for display
     */
    getCategoryName(category: number): string {
        const categoryMap: { [key: number]: string } = {
            0: "High Card",
            1: "Pair",
            2: "Two Pair",
            3: "Three of a Kind",
            4: "Straight",
            5: "Flush",
            6: "Full House",
            7: "Four of a Kind",
            8: "Straight Flush",
            9: "Royal Flush",
            10: "Flush",
            11: "Straight",
            12: "Pair",
            13: "Two Pair",
            14: "Set",
        };
        return categoryMap[category] || `Category ${category}`;
    }

    /**
     * Render a small card visual for outs display
     */
    renderOutCard(card: { rank: number; suit: string }): TemplateResult {
        const suitData = SUITS.find((s) => s.suit === card.suit);
        const rankData = RANKS.find((r) => r.rank === card.rank);

        return html`
            <div class="out-card">
                <span class="out-card-rank"
                    >${rankData?.label || card.rank}</span
                >
                <span
                    class="out-card-suit"
                    style="color: ${suitData?.color || "#000"}"
                >
                    ${suitData?.icon}
                </span>
            </div>
        `;
    }

    /**
     * Group outs by category
     */
    groupOutsByCategory(outs: any[]): Map<number, any[]> {
        const groups = new Map<number, any[]>();
        for (const out of outs) {
            if (!groups.has(out.category)) {
                groups.set(out.category, []);
            }
            groups.get(out.category)!.push(out);
        }
        return groups;
    }

    render(): TemplateResult {
        const result = outsStore.outsResult;
        const isLoading = outsStore.isLoading;
        const error = outsStore.error;

        // Show loading state
        if (isLoading) {
            return html`
                <div class="outs-display loading">
                    <sp-progress-circle
                        indeterminate
                        size="s"
                    ></sp-progress-circle>
                    <span class="loading-text">Calculating outs...</span>
                </div>
            `;
        }

        // Show error state
        if (error) {
            return html`
                <div class="outs-display error">
                    <span class="error-text">Error: ${error}</span>
                </div>
            `;
        }

        // Check if we have outs results
        if (!result) {
            return html`
                <div class="outs-display empty">
                    <span class="empty-text"
                        >Turn: 4 cards needed for outs</span
                    >
                </div>
            `;
        }

        // Check if outs are suppressed - don't display anything
        if (result.suppressed) {
            return html``;
        }

        // Display outs for the player
        const winOuts = result.win_outs_cards || [];
        const tieOuts = result.tie_outs_cards || [];

        // Group by category for better display
        const winOutsGrouped = this.groupOutsByCategory(result.win_outs);
        const sortedCategories = Array.from(winOutsGrouped.keys()).sort(
            (a, b) => b - a
        );

        return html`
            <div class="outs-display">
                <div class="outs-header">
                    <span class="outs-title">Outs to Win</span>
                    <span class="outs-count"
                        >${winOuts.length} / ${result.total_river_cards}</span
                    >
                </div>

                ${winOuts.length > 0
                    ? html`
                          <div class="outs-groups">
                              ${sortedCategories.map((category) => {
                                  const outs =
                                      winOutsGrouped.get(category) || [];

                                  return html`
                                      <div class="outs-group">
                                          <div class="outs-group-header">
                                              <span class="category-name"
                                                  >${this.getCategoryName(
                                                      category
                                                  )}</span
                                              >
                                              <span class="outs-group-count"
                                                  >${outs.length}</span
                                              >
                                          </div>
                                          <div class="outs-cards">
                                              ${outs.map((out: any) =>
                                                  this.renderOutCard({
                                                      rank: out.rank,
                                                      suit:
                                                          typeof out.suit ===
                                                          "number"
                                                              ? [
                                                                    "c",
                                                                    "d",
                                                                    "h",
                                                                    "s",
                                                                ][out.suit]
                                                              : out.suit,
                                                  })
                                              )}
                                          </div>
                                      </div>
                                  `;
                              })}
                          </div>
                      `
                    : html` <div class="no-outs">No outs to improve</div> `}
                ${tieOuts.length > 0
                    ? html`
                          <div class="tie-outs-section">
                              <div class="outs-header tie">
                                  <span class="outs-title">Outs to Tie</span>
                                  <span class="outs-count"
                                      >${tieOuts.length}</span
                                  >
                              </div>
                              <div class="outs-groups">
                                  ${(() => {
                                      const tieOutsGrouped =
                                          this.groupOutsByCategory(
                                              result.tie_outs
                                          );
                                      const tieSortedCategories = Array.from(
                                          tieOutsGrouped.keys()
                                      ).sort((a, b) => b - a);
                                      return tieSortedCategories.map(
                                          (category) => {
                                              const outs =
                                                  tieOutsGrouped.get(
                                                      category
                                                  ) || [];

                                              return html`
                                                  <div class="outs-group">
                                                      <div
                                                          class="outs-group-header"
                                                      >
                                                          <span
                                                              class="category-name"
                                                              >${this.getCategoryName(
                                                                  category
                                                              )}</span
                                                          >
                                                          <span
                                                              class="outs-group-count"
                                                              >${outs.length}</span
                                                          >
                                                      </div>
                                                      <div class="outs-cards">
                                                          ${outs.map(
                                                              (out: any) =>
                                                                  this.renderOutCard(
                                                                      {
                                                                          rank: out.rank,
                                                                          suit:
                                                                              typeof out.suit ===
                                                                              "number"
                                                                                  ? [
                                                                                        "c",
                                                                                        "d",
                                                                                        "h",
                                                                                        "s",
                                                                                    ][
                                                                                        out
                                                                                            .suit
                                                                                    ]
                                                                                  : out.suit,
                                                                      }
                                                                  )
                                                          )}
                                                      </div>
                                                  </div>
                                              `;
                                          }
                                      );
                                  })()}
                              </div>
                          </div>
                      `
                    : html``}

                <div class="baseline-equity">
                    <div class="equity-label">Current River Equity:</div>
                    <div class="equity-values">
                        <span class="equity-win"
                            >Win
                            ${(result.baseline_win * 100).toFixed(1)}%</span
                        >
                        <span class="equity-tie"
                            >Tie
                            ${(result.baseline_tie * 100).toFixed(1)}%</span
                        >
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [OutsDisplay.TAG_NAME]: OutsDisplay;
    }
}
