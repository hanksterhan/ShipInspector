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
    }
`;
