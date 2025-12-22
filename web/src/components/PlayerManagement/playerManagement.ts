import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { replayStore } from "../../stores/index";

@customElement("player-management")
export class PlayerManagement extends MobxLitElement {
    static readonly TAG_NAME = "player-management";
    static get styles() {
        return styles;
    }

    private newPlayerName: string = "";
    private newPlayerStack: number = 2000;
    private newPlayerPosition: number = 0;

    handleAddPlayer() {
        if (!replayStore.currentReplay) return;

        const currentPlayerCount = replayStore.currentReplay.players.length;
        if (currentPlayerCount >= replayStore.currentReplay.tableSize) {
            alert("Maximum number of players reached");
            return;
        }

        replayStore.addPlayer({
            name: this.newPlayerName || undefined,
            position: this.newPlayerPosition,
            stack: this.newPlayerStack,
            isActive: true,
        });

        // Reset form
        this.newPlayerName = "";
        this.newPlayerStack = 2000;
        this.newPlayerPosition = currentPlayerCount;
        this.requestUpdate();
    }

    handleNameChange(e: Event) {
        const target = e.target as HTMLInputElement;
        this.newPlayerName = target.value;
    }

    handleStackChange(e: Event) {
        const target = e.target as HTMLInputElement;
        this.newPlayerStack = parseFloat(target.value) || 2000;
    }

    handlePositionChange(e: Event) {
        const target = e.target as HTMLInputElement;
        this.newPlayerPosition = parseInt(target.value) || 0;
    }

    handleRemovePlayer(playerIndex: number) {
        replayStore.removePlayer(playerIndex);
    }

    handleToggleActive(playerIndex: number) {
        const player = replayStore.currentReplay?.players.find(
            (p) => p.index === playerIndex
        );
        if (player) {
            replayStore.updatePlayer(playerIndex, {
                isActive: !player.isActive,
            });
        }
    }

    render() {
        if (!replayStore.currentReplay) {
            return html``;
        }

        const players = replayStore.currentReplay.players;
        const maxPlayers = replayStore.currentReplay.tableSize;
        const canAddMore = players.length < maxPlayers;

        return html`
            <div class="player-management-container">
                <h4>Players (${players.length}/${maxPlayers})</h4>

                ${players.length > 0
                    ? html`
                          <div class="players-list">
                              ${players.map(
                                  (player) => html`
                                      <div class="player-item">
                                          <div class="player-info">
                                              <strong>Player ${player.index + 1}</strong>
                                              ${player.name
                                                  ? html`<span class="player-name">(${player.name})</span>`
                                                  : ""}
                                              <span class="player-details">
                                                  Position: ${player.position}, Stack: $${player.stack}
                                              </span>
                                          </div>
                                          <div class="player-actions">
                                              <button
                                                  @click=${() =>
                                                      this.handleToggleActive(
                                                          player.index
                                                      )}
                                                  class=${player.isActive
                                                      ? "active"
                                                      : "inactive"}
                                              >
                                                  ${player.isActive
                                                      ? "Active"
                                                      : "Inactive"}
                                              </button>
                                              <button
                                                  @click=${() =>
                                                      this.handleRemovePlayer(
                                                          player.index
                                                      )}
                                                  class="remove"
                                              >
                                                  Remove
                                              </button>
                                          </div>
                                      </div>
                                  `
                              )}
                          </div>
                      `
                    : html`<p class="no-players">No players added yet</p>`}

                ${canAddMore
                    ? html`
                          <div class="add-player-form">
                              <h5>Add Player</h5>
                              <div class="form-group">
                                  <label for="player-name">Name (optional):</label>
                                  <input
                                      type="text"
                                      id="player-name"
                                      .value=${this.newPlayerName}
                                      @input=${this.handleNameChange}
                                      placeholder="Player name"
                                  />
                              </div>
                              <div class="form-group">
                                  <label for="player-position">Position:</label>
                                  <input
                                      type="number"
                                      id="player-position"
                                      min="0"
                                      max=${maxPlayers - 1}
                                      .value=${this.newPlayerPosition.toString()}
                                      @change=${this.handlePositionChange}
                                  />
                              </div>
                              <div class="form-group">
                                  <label for="player-stack">Starting Stack:</label>
                                  <input
                                      type="number"
                                      id="player-stack"
                                      min="0"
                                      step="0.5"
                                      .value=${this.newPlayerStack.toString()}
                                      @change=${this.handleStackChange}
                                  />
                              </div>
                              <button @click=${this.handleAddPlayer}>
                                  Add Player
                              </button>
                          </div>
                      `
                    : html`<p class="max-players">Maximum players reached</p>`}
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [PlayerManagement.TAG_NAME]: PlayerManagement;
    }
}

