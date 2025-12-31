import { css } from "lit";

export const styles = css`
    :host {
        display: block;
    }

    .equity-results {
        padding: 20px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .equity-results.loading {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
    }

    .loading-text {
        color: #666;
        font-size: 14px;
    }

    .equity-results.error {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: #dc3545;
    }

    .error-text {
        font-size: 14px;
    }

    .retry-button {
        padding: 6px 12px;
        border: 1px solid #dc3545;
        border-radius: 4px;
        background: white;
        color: #dc3545;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }

    .retry-button:hover {
        background: #dc3545;
        color: white;
    }

    .equity-results.empty,
    .equity-results.idle {
        text-align: center;
        color: #666;
        font-size: 14px;
    }

    .equity-results.success {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .equity-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
    }

    .equity-players {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .equity-player {
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
    }

    .player-header {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
    }

    .equity-stats {
        display: flex;
        gap: 16px;
    }

    .equity-stat {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .stat-label {
        font-size: 12px;
        color: #666;
    }

    .stat-value {
        font-size: 18px;
        font-weight: 600;
    }

    .equity-stat.win .stat-value {
        color: #28a745;
    }

    .equity-stat.tie .stat-value {
        color: #ffc107;
    }

    .samples-info {
        font-size: 12px;
        color: #666;
        text-align: center;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
    }
`;
