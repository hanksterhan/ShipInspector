import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .player-cards-container {
        padding: var(--spectrum-global-dimension-size-300);
        background: white;
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        margin: var(--spectrum-global-dimension-size-200);
    }

    h4 {
        margin: 0 0 var(--spectrum-global-dimension-size-100) 0;
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .instruction {
        font-size: var(--spectrum-global-dimension-font-size-200);
        color: var(--spectrum-global-color-gray-600);
        margin: 0 0 var(--spectrum-global-dimension-size-200) 0;
    }

    .players-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spectrum-global-dimension-size-200);
    }

    .player-card-section {
        padding: var(--spectrum-global-dimension-size-200);
        background: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 2px solid var(--spectrum-global-color-gray-300);
    }

    .player-card-section.selected {
        border-color: var(--spectrum-global-color-blue-600);
        background: var(--spectrum-global-color-blue-50);
    }

    .player-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spectrum-global-dimension-size-150);
    }

    .player-header h5 {
        margin: 0;
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-800);
    }

    .select-button {
        padding: var(--spectrum-global-dimension-size-75)
            var(--spectrum-global-dimension-size-150);
        background: var(--spectrum-global-color-blue-600);
        color: white;
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-200);
        cursor: pointer;
    }

    .select-button:hover {
        background: var(--spectrum-global-color-blue-700);
    }

    .cards-preview {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        justify-content: center;
        margin-bottom: var(--spectrum-global-dimension-size-150);
    }

    .card-display,
    .card-placeholder {
        width: 80px;
        height: 112px;
        min-width: 80px;
        max-width: 80px;
        min-height: 112px;
        max-height: 112px;
        aspect-ratio: 5 / 7;
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 2px solid var(--spectrum-global-color-gray-400);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .card-display {
        background: white;
    }

    .card-display:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .card-placeholder {
        background: var(--spectrum-global-color-gray-100);
        border-style: dashed;
    }

    .card-placeholder:hover {
        background: var(--spectrum-global-color-gray-200);
    }

    .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-75);
        width: 100%;
        height: 100%;
        padding: var(--spectrum-global-dimension-size-100);
    }

    .card-rank {
        font-size: var(--spectrum-global-dimension-font-size-400);
        font-weight: var(--spectrum-global-font-weight-bold);
        color: var(--spectrum-global-color-gray-900);
        line-height: 1;
    }

    .card-suit-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-suit-icon svg {
        width: 100%;
        height: 100%;
    }

    .card-placeholder span {
        font-size: var(--spectrum-global-dimension-font-size-200);
        color: var(--spectrum-global-color-gray-600);
        font-weight: var(--spectrum-global-font-weight-medium);
    }

    .card-actions {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        justify-content: center;
        margin-bottom: var(--spectrum-global-dimension-size-150);
    }

    .card-actions button {
        padding: var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-150);
        background: var(--spectrum-global-color-gray-600);
        color: white;
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-200);
        cursor: pointer;
    }

    .card-actions button:hover {
        background: var(--spectrum-global-color-gray-700);
    }

    .card-selection {
        margin-bottom: var(--spectrum-global-dimension-size-150);
    }

    .selection-instruction {
        text-align: center;
        font-size: var(--spectrum-global-dimension-font-size-300);
        color: var(--spectrum-global-color-gray-700);
        font-weight: var(--spectrum-global-font-weight-medium);
        margin-bottom: var(--spectrum-global-dimension-size-200);
    }

    .selection-actions {
        display: flex;
        justify-content: center;
        margin-top: var(--spectrum-global-dimension-size-100);
    }

    .selection-actions button {
        padding: var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-150);
        background: var(--spectrum-global-color-gray-400);
        color: white;
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-200);
        cursor: pointer;
    }

    .save-actions {
        display: flex;
        gap: var(--spectrum-global-dimension-size-100);
        justify-content: center;
    }

    .save-button {
        padding: var(--spectrum-global-dimension-size-150)
            var(--spectrum-global-dimension-size-200);
        background: var(--spectrum-global-color-green-600);
        color: white;
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-medium);
        cursor: pointer;
    }

    .save-button:hover {
        background: var(--spectrum-global-color-green-700);
    }

    .clear-button {
        padding: var(--spectrum-global-dimension-size-150)
            var(--spectrum-global-dimension-size-200);
        background: var(--spectrum-global-color-red-600);
        color: white;
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: var(--spectrum-global-dimension-font-size-300);
        font-weight: var(--spectrum-global-font-weight-medium);
        cursor: pointer;
    }

    .clear-button:hover {
        background: var(--spectrum-global-color-red-700);
    }

    .cards-status {
        text-align: center;
        font-size: var(--spectrum-global-dimension-font-size-200);
        color: var(--spectrum-global-color-green-700);
        font-weight: var(--spectrum-global-font-weight-medium);
        margin: var(--spectrum-global-dimension-size-100) 0 0 0;
    }

    .cards-status.unknown {
        color: var(--spectrum-global-color-gray-600);
        font-style: italic;
    }
`;

