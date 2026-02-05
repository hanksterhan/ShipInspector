import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
        max-width: 1100px;
    }

    .hand-library {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 100%;
        background: #ffffff;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .filters-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
    }

    .section-subtitle {
        color: #6b7280;
        font-size: 0.9rem;
    }

    .filters-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    .filters-buttons {
        display: flex;
        gap: 8px;
    }

    .filters-toggle {
        display: none;
    }

    .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 12px;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .date-input {
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        font-size: 0.95rem;
        font-family: inherit;
    }

    .hand-list-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .hand-list {
        height: 520px;
        overflow: auto;
        display: block;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 8px;
        background: #ffffff;
    }

    .hand-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        margin-bottom: 8px;
        background: #ffffff;
        transition:
            box-shadow 0.2s ease,
            transform 0.2s ease;
    }

    .hand-item:last-child {
        margin-bottom: 0;
    }

    .hand-item:hover {
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }

    .hand-details {
        display: grid;
        grid-template-columns: repeat(4, minmax(120px, 1fr));
        gap: 16px;
        flex: 1;
    }

    .label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #6b7280;
    }

    .value {
        font-size: 0.95rem;
        font-weight: 600;
        color: #111827;
    }

    .value.muted {
        color: #9ca3af;
        font-weight: 500;
    }

    .hand-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .list-status {
        text-align: center;
        color: #6b7280;
        font-size: 0.9rem;
        padding: 8px 0;
    }

    .list-status.error {
        color: #dc2626;
    }

    @media (max-width: 900px) {
        .filters-toggle {
            display: inline-flex;
        }

        .filters.collapsed {
            display: none;
        }
    }

    @media (max-width: 768px) {
        .hand-item {
            flex-direction: column;
            align-items: flex-start;
        }

        .hand-details {
            grid-template-columns: repeat(2, minmax(120px, 1fr));
        }

        .hand-actions {
            width: 100%;
            justify-content: flex-end;
        }

        .hand-actions .delete-button {
            display: none;
        }

        .hand-item.swiped .hand-actions .delete-button {
            display: inline-flex;
        }
    }
`;
