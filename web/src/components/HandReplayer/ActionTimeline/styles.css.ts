import { css } from "lit";

export const styles = css`
    :host {
        display: block;
        width: 100%;
    }

    .action-timeline-container {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-global-dimension-size-50);
        width: 100%;
    }

    .action-timeline-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: var(--spectrum-global-dimension-size-75);
        padding: var(--spectrum-global-dimension-size-50)
            var(--spectrum-global-dimension-size-100);
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--spectrum-global-color-gray-300);
        border-radius: var(--spectrum-global-dimension-size-150);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(4px);
        font-size: 11px;
        line-height: 1.3;
    }

    .action-text {
        flex: 1;
        color: var(--spectrum-global-color-gray-800);
        text-align: left;
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .street-tag {
        flex-shrink: 0;
        padding: 1px 4px;
        border-radius: var(--spectrum-global-dimension-size-75);
        font-size: 8px;
        font-weight: var(--spectrum-global-font-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.2px;
        color: white;
        min-width: 20px;
        text-align: center;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
    }

    .street-tag:hover {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transform: translateY(-1px);
    }

    /* Preflop - Blue */
    .street-tag-PF {
        background-color: #0066cc !important;
        border: 1px solid #0052a3 !important;
    }

    .street-tag-PF:hover {
        background-color: #0052a3 !important;
    }

    /* Flop - Green */
    .street-tag-F {
        background-color: #28a745 !important;
        border: 1px solid #218838 !important;
    }

    .street-tag-F:hover {
        background-color: #218838 !important;
    }

    /* Turn - Orange */
    .street-tag-T {
        background-color: #ff8800 !important;
        border: 1px solid #e67700 !important;
    }

    .street-tag-T:hover {
        background-color: #e67700 !important;
    }

    /* River - Red/Purple */
    .street-tag-R {
        background-color: #dc3545 !important;
        border: 1px solid #c82333 !important;
    }

    .street-tag-R:hover {
        background-color: #c82333 !important;
    }

    /* Showdown - Purple */
    .street-tag-SD {
        background-color: #6f42c1 !important;
        border: 1px solid #5a32a3 !important;
    }

    .street-tag-SD:hover {
        background-color: #5a32a3 !important;
    }

    /* Responsive adjustments */
    @media (max-width: 600px) {
        .action-timeline-item {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spectrum-global-dimension-size-50);
        }

        .action-text {
            text-align: center;
            white-space: normal;
        }

        .street-tag {
            align-self: flex-end;
            min-width: auto;
            width: fit-content;
        }
    }
`;
