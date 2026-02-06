import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }

    .page-wrapper {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 24px;
        box-sizing: border-box;
        overflow-y: auto;
    }

    .page-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 16px;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    .page-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
    }

    .page-header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .page-header p {
        margin: 0;
        font-size: 16px;
        color: #666;
    }

    .hand-info {
        display: flex;
        gap: 16px;
        align-items: center;
    }

    .pot-display {
        font-size: 18px;
        font-weight: bold;
        color: var(--spectrum-global-color-green-600);
        background: rgba(0, 128, 0, 0.1);
        padding: 4px 12px;
        border-radius: 4px;
    }

    .street-display {
        font-size: 16px;
        font-weight: 600;
        color: var(--spectrum-global-color-blue-600);
        background: rgba(0, 100, 200, 0.1);
        padding: 4px 12px;
        border-radius: 4px;
    }

    .page-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 16px;
    }

    .replay-content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 24px;
        align-items: start;
    }

    .replay-table {
        min-width: 0;
    }

    .replay-sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #ffffff;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }

    .step-counter {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px;
        background: #f7f7f7;
        border-radius: 8px;
    }

    .step-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--spectrum-global-color-gray-800);
    }

    .step-details {
        display: flex;
        gap: 8px;
        font-size: 14px;
        color: var(--spectrum-global-color-gray-600);
        align-items: center;
        flex-wrap: wrap;
    }

    .action-timeline {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 320px;
        overflow-y: auto;
        padding: 8px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fafafa;
    }

    .street-header {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: var(--spectrum-global-color-gray-700);
        padding: 8px 6px 4px;
        border-bottom: 1px solid #e0e0e0;
        margin-top: 6px;
    }

    .action-item {
        font-size: 14px;
        color: var(--spectrum-global-color-gray-700);
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
    }

    .action-item:hover {
        background: #eeeeee;
    }

    .action-item.active {
        background: rgba(59, 130, 246, 0.12);
        color: var(--spectrum-global-color-blue-700);
        font-weight: 600;
    }

    .placeholder-content,
    .loading-content,
    .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        background: #f5f5f5;
        border-radius: 8px;
        padding: 48px;
        gap: 16px;
    }

    .placeholder-content p,
    .loading-content p,
    .error-content p {
        font-size: 18px;
        color: #4a4a4a;
        text-align: center;
    }

    .error-detail {
        font-size: 14px;
        color: #777;
    }

    .placeholder-content a {
        color: var(--spectrum-global-color-blue-500);
        text-decoration: underline;
    }

    /* Table Container */
    .table-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
    }

    .table-svg-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        aspect-ratio: 16 / 10;
    }

    .table-svg-background {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .table-svg-background svg {
        width: 100%;
        height: 100%;
    }

    .table-content-overlay {
        position: absolute;
        inset: 0;
    }

    .player-position {
        position: absolute;
        z-index: 10;
    }

    .board-cards-wrapper {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 5;
    }

    /* Action Display */
    .action-display {
        display: flex;
        justify-content: center;
        padding: var(--spectrum-global-dimension-size-150);
        background: var(--spectrum-global-color-gray-100);
        border-radius: 8px;
    }

    .action-text {
        font-size: 18px;
        font-weight: 500;
        color: var(--spectrum-global-color-gray-800);
    }

    /* Responsive scaling */
    @media (max-width: 900px) {
        .page-wrapper {
            padding: 16px;
        }

        .page-header h1 {
            font-size: 24px;
        }

        .table-container {
            min-height: 300px;
        }

        .replay-content {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 600px) {
        .page-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .hand-info {
            flex-wrap: wrap;
        }

        .table-container {
            min-height: 250px;
        }

        .replay-sidebar {
            padding: 12px;
        }
    }
`;
