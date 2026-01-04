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
        flex-direction: column;
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        position: relative;
        z-index: 1;
        box-sizing: border-box;
        min-width: 0;
        transition:
            padding 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            background 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            border-radius 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        padding: var(--spectrum-global-dimension-size-200);
        padding-top: calc(var(--spectrum-global-dimension-size-300));
        background: rgb(255, 255, 255);
        border-radius: var(--spectrum-global-dimension-size-200);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        overflow: visible;
    }

    .tray-container.minimized {
        padding: 0;
        background: transparent;
        box-shadow: none;
        border-radius: 0;
        justify-content: flex-end;
        align-items: center;
        min-height: 0;
        height: auto;
        align-self: flex-end;
    }

    .tray-content {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: var(--spectrum-global-dimension-size-100);
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        min-height: 0;
        overflow: hidden;
        opacity: 1;
        transition:
            max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.25s ease-in-out 0.1s,
            margin 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        max-height: 2000px;
        margin: 0;
    }

    .tray-content.hidden {
        max-height: 0;
        opacity: 0;
        margin: 0;
        transition:
            max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.2s ease-in-out,
            margin 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
    }

    .tray-content.visible {
        max-height: 2000px;
        opacity: 1;
        pointer-events: all;
    }

    .minimize-button {
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

    .minimize-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .minimize-icon svg {
        width: 32px;
        height: 32px;
    }

    .expand-tab {
        width: 100%;
        max-width: 600px;
        height: 48px;
        padding: 0 var(--spectrum-global-dimension-size-200);
        background: white;
        color: var(--spectrum-global-color-gray-700);
        border: none;
        border-radius: var(--spectrum-global-dimension-size-200);
        cursor: pointer;
        transition:
            max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.3s ease-in-out,
            margin 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spectrum-global-dimension-size-100);
        box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
        box-sizing: border-box;
        max-height: 48px;
        opacity: 1;
        overflow: hidden;
        margin: 0;
        flex-shrink: 0;
    }

    .expand-tab.hidden {
        max-height: 0;
        opacity: 0;
        padding-top: 0;
        padding-bottom: 0;
        margin: 0;
        pointer-events: none;
    }

    .expand-tab.visible {
        max-height: 48px;
        opacity: 1;
        pointer-events: all;
    }

    .expand-tab:hover {
        background: var(--spectrum-global-color-gray-50);
        color: var(--spectrum-global-color-gray-900);
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
    }

    .expand-text {
        font-size: 14px;
        font-weight: 500;
        color: var(--spectrum-global-color-gray-700);
    }

    .expand-tab:hover .expand-text {
        color: var(--spectrum-global-color-gray-900);
    }

    .expand-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
    }

    .expand-icon svg {
        width: 24px;
        height: 24px;
    }

    .section {
        flex: 1 1 200px;
        min-width: 0;
        max-width: 100%;
        padding: var(--spectrum-global-dimension-size-150);
        background-color: var(--spectrum-global-color-gray-50);
        border-radius: var(--spectrum-global-dimension-size-100);
        border: 1px solid var(--spectrum-global-color-gray-200);
        box-sizing: border-box;
    }

    .section-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: var(--spectrum-global-dimension-size-100);
        color: var(--spectrum-global-color-gray-800);
    }

    .street-info {
        flex: 1 1 100%;
        background: #e7f3ff;
        padding: var(--spectrum-global-dimension-size-100);
        border-radius: var(--spectrum-global-dimension-size-100);
        font-size: 14px;
        font-weight: 500;
        color: #0056b3;
        margin-bottom: var(--spectrum-global-dimension-size-50);
    }

    .current-player {
        flex: 1 1 auto;
        background: var(--spectrum-global-color-gray-100);
        padding: var(--spectrum-global-dimension-size-100);
        border-radius: var(--spectrum-global-dimension-size-100);
        margin-right: var(--spectrum-global-dimension-size-150);
        min-width: 0;
    }

    .current-player-label {
        font-size: 11px;
        color: var(--spectrum-global-color-gray-600);
        margin-bottom: 2px;
    }

    .current-player-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--spectrum-global-color-gray-900);
    }

    .current-player-stats {
        font-size: 11px;
        color: var(--spectrum-global-color-gray-600);
        margin-top: 2px;
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
        gap: var(--spectrum-global-dimension-size-100);
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
        padding-top: var(--spectrum-global-dimension-size-100);
        border-top: 1px solid var(--spectrum-global-color-gray-200);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: var(--spectrum-global-dimension-size-150);
    }

    .submit-button {
        width: 48px;
        height: 48px;
        padding: 0;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .submit-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
    }

    .submit-icon svg {
        width: 24px;
        height: 24px;
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
        .submit-section {
            flex: 1 1 100%;
        }

        .submit-section {
            flex-direction: column;
            align-items: stretch;
        }

        .current-player {
            margin-right: 0;
            margin-bottom: var(--spectrum-global-dimension-size-100);
        }
    }
`;
