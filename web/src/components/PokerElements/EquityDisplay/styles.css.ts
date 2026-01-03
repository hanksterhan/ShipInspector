import { css } from "lit";

export const styles = css`
    .equity-display {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        background-color: var(--spectrum-global-color-gray-100);
        border-radius: 0.25rem;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }

    .equity-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--spectrum-global-color-gray-800);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
    }

    .equity-display.loading {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        min-height: 4rem;
    }

    .equity-display.error {
        align-items: center;
        justify-content: center;
    }

    .equity-display.empty {
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0.75rem;
    }

    .loading-text {
        font-size: 0.875rem;
        color: var(--spectrum-global-color-gray-700);
    }

    .error-text {
        font-size: 0.875rem;
        color: var(--spectrum-global-color-red-600);
    }

    .empty-text {
        font-size: 0.875rem;
        color: var(--spectrum-global-color-gray-500);
        font-style: italic;
    }

    .equity-stats {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .equity-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;
    }

    .equity-stat.win .stat-value {
        color: var(--spectrum-global-color-green-600);
        font-weight: 600;
    }

    .equity-stat.tie .stat-value {
        color: var(--spectrum-global-color-orange-600);
        font-weight: 600;
    }

    .equity-stat.lose .stat-value {
        color: var(--spectrum-global-color-red-600);
        font-weight: 600;
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--spectrum-global-color-gray-700);
    }

    .stat-value {
        font-size: 0.875rem;
        font-weight: 500;
    }

    .equity-footer {
        margin-top: 0.25rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--spectrum-global-color-gray-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
    }

    .samples-text {
        font-size: 0.75rem;
        color: var(--spectrum-global-color-gray-600);
        white-space: nowrap;
        flex-shrink: 0;
    }

    .footer-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .cache-indicator {
        font-size: 0.75rem;
        color: var(--spectrum-global-color-blue-600);
        white-space: nowrap;
        flex-shrink: 0;
        font-weight: 500;
    }

    .time-text {
        font-size: 0.75rem;
        color: var(--spectrum-global-color-gray-600);
        white-space: nowrap;
        flex-shrink: 0;
    }
`;
