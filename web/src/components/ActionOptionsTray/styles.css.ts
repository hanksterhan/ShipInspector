import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
        max-width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
    }

    .tray-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: flex-start;
        padding: var(--spectrum-global-dimension-size-300);
        padding-top: calc(var(--spectrum-global-dimension-size-300));
        gap: var(--spectrum-global-dimension-size-200);
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        background: rgb(255, 255, 255);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        position: relative;
        z-index: 1;
        box-sizing: border-box;
        min-width: 0;
    }

    .close-button {
        position: absolute;
        top: var(--spectrum-global-dimension-size-50);
        right: var(--spectrum-global-dimension-size-50);
        z-index: 101;
        background: transparent;
        border-radius: 0;
        width: auto;
        height: auto;
        padding: 0;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
    }

    .close-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .close-icon svg {
        width: 32px;
        height: 32px;
    }

    .section {
        flex: 1 1 200px;
        min-width: 0;
        max-width: 100%;
        padding: var(--spectrum-global-dimension-size-200);
        background-color: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 1px solid var(--spectrum-global-color-gray-200);
        box-sizing: border-box;
    }

    .section-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: var(--spectrum-global-dimension-size-150);
        color: var(--spectrum-global-color-gray-800);
    }

    .street-info {
        flex: 1 1 100%;
        background: #e7f3ff;
        padding: var(--spectrum-global-dimension-size-150);
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: 14px;
        font-weight: 500;
        color: #0056b3;
    }

    .current-player {
        flex: 1 1 100%;
        background: var(--spectrum-global-color-gray-100);
        padding: var(--spectrum-global-dimension-size-200);
        border-radius: var(--spectrum-global-dimension-size-100);
    }

    .current-player-label {
        font-size: 12px;
        color: var(--spectrum-global-color-gray-600);
        margin-bottom: 4px;
    }

    .current-player-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--spectrum-global-color-gray-900);
    }

    .current-player-stats {
        font-size: 12px;
        color: var(--spectrum-global-color-gray-600);
        margin-top: 4px;
    }

    .action-buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--spectrum-global-dimension-size-100);
        width: 100%;
        max-width: 100%;
    }

    .action-button {
        padding: 10px 16px;
        border: 2px solid #007bff;
        background: white;
        color: #007bff;
        border-radius: var(--spectrum-global-dimension-size-100);
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        min-width: 80px;
        white-space: nowrap;
    }

    .action-button:hover {
        background: #007bff;
        color: white;
    }

    .action-button.selected {
        background: #007bff;
        color: white;
    }

    .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .bet-inputs {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: var(--spectrum-global-dimension-size-150);
        align-items: flex-end;
        width: 100%;
        max-width: 100%;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1 1 auto;
    }

    .input-group label {
        font-size: 12px;
        font-weight: 500;
        color: var(--spectrum-global-color-gray-700);
    }

    .input-group input {
        padding: var(--spectrum-global-dimension-size-100)
            var(--spectrum-global-dimension-size-150);
        border: 1px solid var(--spectrum-global-color-gray-300);
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: 14px;
    }

    .input-group input:focus {
        outline: none;
        border-color: #007bff;
    }

    .tags-section {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spectrum-global-dimension-size-100);
        width: 100%;
        max-width: 100%;
    }

    .tag-button {
        padding: 6px 12px;
        border: 1px solid var(--spectrum-global-color-gray-300);
        background: white;
        border-radius: 16px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
    }

    .tag-button:hover {
        border-color: #007bff;
    }

    .tag-button.selected {
        background: #007bff;
        color: white;
        border-color: #007bff;
    }

    .submit-section {
        flex: 1 1 100%;
        padding-top: var(--spectrum-global-dimension-size-300);
        border-top: 1px solid var(--spectrum-global-color-gray-200);
    }

    .submit-button {
        width: 100%;
        padding: var(--spectrum-global-dimension-size-200);
        background: #28a745;
        color: white;
        border: none;
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
    }

    .submit-button:hover:not(:disabled) {
        background: #218838;
    }

    .submit-button:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }

    .action-timeline {
        max-height: 200px;
        overflow-y: auto;
        font-size: 12px;
    }

    .action-timeline-item {
        padding: 4px 8px;
        margin: 2px 0;
        background: var(--spectrum-global-color-gray-100);
        border-radius: var(--spectrum-global-dimension-size-50);
    }

    @media (max-width: 768px) {
        .tray-container {
            flex-direction: column;
        }
        
        .section {
            min-width: 100%;
        }
        
        .street-info,
        .current-player,
        .submit-section {
            flex: 1 1 100%;
        }
    }
`;
