import { html } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { handReplayStore } from "../../stores";
import "@spectrum-web-components/button/sp-button.js";
import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/action-group/sp-action-group.js";

/**
 * ReplayControls - Playback controls for hand replay
 *
 * Provides play/pause, step forward/back, speed control, and street jump buttons.
 */
@customElement("replay-controls")
export class ReplayControls extends MobxLitElement {
    static readonly TAG_NAME = "replay-controls";
    static get styles() {
        return styles;
    }

    private handlePlay = () => {
        handReplayStore.play();
    };

    private handlePause = () => {
        handReplayStore.pause();
    };

    private handleStepForward = () => {
        handReplayStore.stepForward();
    };

    private handleStepBack = () => {
        handReplayStore.stepBack();
    };

    private handleReset = () => {
        handReplayStore.reset();
    };

    private handleSpeedChange = (speed: number) => {
        handReplayStore.setPlaybackSpeed(speed);
    };

    private handleStreetJump = (
        street: "preflop" | "flop" | "turn" | "river"
    ) => {
        handReplayStore.jumpToStreet(street);
    };

    private handleTimelineClick = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        const totalActions = handReplayStore.totalActions;
        const newIndex = Math.floor(percent * totalActions) - 1;
        handReplayStore.setActionIndex(newIndex);
    };

    render() {
        const isPlaying = handReplayStore.isPlaying;
        const currentIndex = handReplayStore.currentActionIndex;
        const totalActions = handReplayStore.totalActions;
        const currentStreet = handReplayStore.currentStreet;
        const isComplete = handReplayStore.isComplete;
        const playbackSpeed = handReplayStore.playbackSpeed;

        // Calculate progress percentage
        const progress =
            totalActions > 0 ? ((currentIndex + 1) / totalActions) * 100 : 0;

        // Speed options in milliseconds (lower = faster)
        const speedOptions = [
            { label: "0.5x", value: 1600 },
            { label: "1x", value: 800 },
            { label: "2x", value: 400 },
        ];

        return html`
            <div class="replay-controls">
                <!-- Timeline -->
                <div class="timeline-container">
                    <div
                        class="timeline"
                        @click=${this.handleTimelineClick}
                        role="slider"
                        aria-label="Action timeline"
                        aria-valuenow=${currentIndex + 1}
                        aria-valuemin="0"
                        aria-valuemax=${totalActions}
                    >
                        <div
                            class="timeline-progress"
                            style="width: ${progress}%"
                        ></div>
                        <div
                            class="timeline-thumb"
                            style="left: ${progress}%"
                        ></div>
                    </div>
                    <div class="timeline-labels">
                        <span
                            >Action ${currentIndex + 1} / ${totalActions}</span
                        >
                    </div>
                </div>

                <!-- Street Jump Buttons -->
                <div class="street-buttons">
                    <sp-action-group>
                        <sp-action-button
                            ?selected=${currentStreet === "preflop"}
                            @click=${() => this.handleStreetJump("preflop")}
                        >
                            Pre-flop
                        </sp-action-button>
                        <sp-action-button
                            ?selected=${currentStreet === "flop"}
                            @click=${() => this.handleStreetJump("flop")}
                        >
                            Flop
                        </sp-action-button>
                        <sp-action-button
                            ?selected=${currentStreet === "turn"}
                            @click=${() => this.handleStreetJump("turn")}
                        >
                            Turn
                        </sp-action-button>
                        <sp-action-button
                            ?selected=${currentStreet === "river"}
                            @click=${() => this.handleStreetJump("river")}
                        >
                            River
                        </sp-action-button>
                    </sp-action-group>
                </div>

                <!-- Playback Controls -->
                <div class="playback-controls">
                    <sp-action-group>
                        <sp-action-button
                            @click=${this.handleReset}
                            aria-label="Reset"
                        >
                            ⏮
                        </sp-action-button>
                        <sp-action-button
                            @click=${this.handleStepBack}
                            ?disabled=${currentIndex < 0}
                            aria-label="Step back"
                        >
                            ⏪
                        </sp-action-button>
                        ${isPlaying
                            ? html`
                                  <sp-action-button
                                      @click=${this.handlePause}
                                      aria-label="Pause"
                                  >
                                      ⏸
                                  </sp-action-button>
                              `
                            : html`
                                  <sp-action-button
                                      @click=${this.handlePlay}
                                      ?disabled=${isComplete}
                                      aria-label="Play"
                                  >
                                      ▶
                                  </sp-action-button>
                              `}
                        <sp-action-button
                            @click=${this.handleStepForward}
                            ?disabled=${isComplete}
                            aria-label="Step forward"
                        >
                            ⏩
                        </sp-action-button>
                    </sp-action-group>
                </div>

                <!-- Speed Controls -->
                <div class="speed-controls">
                    <span class="speed-label">Speed:</span>
                    <sp-action-group>
                        ${speedOptions.map(
                            (opt) => html`
                                <sp-action-button
                                    size="s"
                                    ?selected=${playbackSpeed === opt.value}
                                    @click=${() =>
                                        this.handleSpeedChange(opt.value)}
                                >
                                    ${opt.label}
                                </sp-action-button>
                            `
                        )}
                    </sp-action-group>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [ReplayControls.TAG_NAME]: ReplayControls;
    }
}
