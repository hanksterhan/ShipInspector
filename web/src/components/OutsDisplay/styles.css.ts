import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }

    .outs-display {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        background-color: var(--spectrum-global-color-gray-50);
        border-radius: 0.375rem;
        border: 1px solid var(--spectrum-global-color-gray-200);
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        overflow: hidden;
    }

    .outs-display.loading,
    .outs-display.error,
    .outs-display.empty {
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        min-height: 3rem;
        padding: 0.75rem;
    }

    .outs-display.suppressed {
        background-color: var(--spectrum-global-color-orange-100);
        border-color: var(--spectrum-global-color-orange-400);
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

    .suppressed-header {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--spectrum-global-color-orange-800);
        margin-bottom: 0.5rem;
    }

    .suppressed-reason {
        font-size: 0.8125rem;
        color: var(--spectrum-global-color-gray-700);
        margin-bottom: 0.75rem;
        line-height: 1.4;
    }

    .baseline-stats {
        display: flex;
        gap: 1rem;
        font-size: 0.8125rem;
        color: var(--spectrum-global-color-gray-600);
    }

    .stat-item {
        font-weight: 500;
    }

    .outs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--spectrum-global-color-gray-300);
    }

    .outs-header.tie {
        margin-top: 0.5rem;
        border-bottom: 1px solid var(--spectrum-global-color-gray-200);
    }

    .outs-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--spectrum-global-color-gray-800);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .outs-count {
        font-size: 1rem;
        font-weight: 700;
        color: var(--spectrum-global-color-blue-600);
    }

    .outs-groups {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
    }

    .outs-group {
        background-color: var(--spectrum-global-color-gray-75);
        border-radius: 0.25rem;
        padding: 0.5rem;
        border: 1px solid var(--spectrum-global-color-gray-200);
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        overflow: hidden;
    }

    .outs-group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .category-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--spectrum-global-color-gray-800);
    }

    .outs-group-count {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--spectrum-global-color-green-600);
        background-color: var(--spectrum-global-color-green-100);
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
    }

    .outs-cards {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-top: 0.25rem;
    }

    .out-card {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        width: 32px;
        height: 44px;
        background: white;
        border: 1px solid var(--spectrum-global-color-gray-400);
        border-radius: 0.25rem;
        padding: 0.125rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
    }

    .out-card-rank {
        font-size: 0.75rem;
        font-weight: 600;
        line-height: 1;
        color: var(--spectrum-global-color-gray-900);
    }

    .out-card-suit {
        width: 12px;
        height: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 0.125rem;
    }

    .out-card-suit svg {
        width: 100%;
        height: 100%;
    }

    .no-outs {
        font-size: 0.875rem;
        color: var(--spectrum-global-color-gray-500);
        font-style: italic;
        text-align: center;
        padding: 1rem 0;
    }

    .tie-outs-section {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--spectrum-global-color-gray-200);
    }

    .baseline-equity {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--spectrum-global-color-gray-300);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .equity-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--spectrum-global-color-gray-700);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .equity-values {
        display: flex;
        gap: 1rem;
        font-size: 0.8125rem;
    }

    .equity-win {
        color: var(--spectrum-global-color-green-600);
        font-weight: 600;
    }

    .equity-tie {
        color: var(--spectrum-global-color-orange-600);
        font-weight: 600;
    }
`;
