import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        padding: 24px;
    }

    .invite-management-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .header-section {
        margin-bottom: 24px;
    }

    .header-section h1 {
        font-size: 2rem;
        font-weight: 600;
        margin: 0 0 16px 0;
        color: #ffffff;
    }

    .stats-section {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--spectrum-global-color-gray-700);
        font-weight: 500;
    }

    .stat-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--spectrum-global-color-gray-900);
    }

    .stat-value.used {
        color: var(--spectrum-semantic-negative-color-default);
    }

    .stat-value.unused {
        color: var(--spectrum-semantic-positive-color-default);
    }

    .actions-section {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
    }

    .table-section {
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    sp-alert {
        margin-bottom: 24px;
    }

    platform-table {
        width: 100%;
    }

    sp-table-cell {
        vertical-align: middle;
    }
`;
