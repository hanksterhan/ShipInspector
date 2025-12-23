import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { inviteCodeStore } from "../../stores/index";
import {
    Header,
    Row,
    TableData,
    generateHeader,
} from "../../components/PlatformTable/tableInterfaces";

import "../index";
import "../../components/index";

@customElement("invite-management")
export class InviteManagement extends MobxLitElement {
    static readonly TAG_NAME = "invite-management";
    static get styles() {
        return styles;
    }

    connectedCallback() {
        super.connectedCallback();
        // Fetch invite codes when component is mounted
        inviteCodeStore.fetchInviteCodes();
    }

    private formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleDateString();
    }

    private async handleGenerateCode(): Promise<void> {
        try {
            await inviteCodeStore.createInviteCode();
        } catch (error) {
            // Error is already handled in the store
            console.error("Failed to create invite code:", error);
        }
    }

    private async handleDeleteCode(code: string): Promise<void> {
        if (
            !confirm(`Are you sure you want to delete invite code "${code}"?`)
        ) {
            return;
        }
        try {
            await inviteCodeStore.deleteInviteCode(code);
        } catch (error) {
            // Error is already handled in the store
            console.error("Failed to delete invite code:", error);
        }
    }

    private async handleRefresh(): Promise<void> {
        try {
            await inviteCodeStore.fetchInviteCodes();
        } catch (error) {
            console.error("Failed to refresh invite codes:", error);
        }
    }

    private getTableData(): TableData {
        const headers: Header[] = [
            generateHeader("Code", 15, true),
            generateHeader("Status", 10, true),
            generateHeader("Created By", 15, true),
            generateHeader("Created At", 20, true),
            generateHeader("Used By", 15, true),
            generateHeader("Used At", 20, true),
            generateHeader("Actions", 5, false),
        ];

        const rows: Row[] = inviteCodeStore.inviteCodes.map(
            (inviteCode, index) => {
                const codeCell: any = {
                    header: headers[0].id,
                    value: inviteCode.code,
                    render: () => {
                        return html`${inviteCode.code}`;
                    },
                };

                const statusCell: any = {
                    header: headers[1].id,
                    value: inviteCode.used ? "Used" : "Unused",
                    render: () => {
                        return html`${inviteCode.used ? "Used" : "Unused"}`;
                    },
                };

                const createdByCell: any = {
                    header: headers[2].id,
                    value: inviteCode.createdBy || "N/A",
                    render: () => {
                        return html`${inviteCode.createdBy || "N/A"}`;
                    },
                };

                const createdAtCell: any = {
                    header: headers[3].id,
                    value: this.formatDate(inviteCode.createdAt),
                    render: () => {
                        return html`${this.formatDate(inviteCode.createdAt)}`;
                    },
                };

                const usedByCell: any = {
                    header: headers[4].id,
                    value: inviteCode.usedByEmail || "N/A",
                    render: () => {
                        return html`${inviteCode.usedByEmail || "N/A"}`;
                    },
                };

                const usedAtCell: any = {
                    header: headers[5].id,
                    value: inviteCode.usedAt
                        ? this.formatDate(inviteCode.usedAt)
                        : "N/A",
                    render: () => {
                        return html`${inviteCode.usedAt
                            ? this.formatDate(inviteCode.usedAt)
                            : "N/A"}`;
                    },
                };

                const actionsCell: any = {
                    header: headers[6].id,
                    value: "",
                    render: () => {
                        return html`
                            <sp-action-button
                                size="s"
                                @click=${(e: Event) => {
                                    e.stopPropagation();
                                    this.handleDeleteCode(inviteCode.code);
                                }}
                            >
                                Delete
                            </sp-action-button>
                        `;
                    },
                };

                return {
                    rowId: index,
                    cells: [
                        codeCell,
                        statusCell,
                        createdByCell,
                        createdAtCell,
                        usedByCell,
                        usedAtCell,
                        actionsCell,
                    ],
                };
            }
        );

        return { headers, rows };
    }

    render(): TemplateResult {
        const isLoading = inviteCodeStore.isLoading;
        const error = inviteCodeStore.error;
        const total = inviteCodeStore.total;
        const used = inviteCodeStore.used;
        const unused = inviteCodeStore.unused;

        return html`
            <div class="invite-management-container">
                <div class="header-section">
                    <h1>Invite Code Management</h1>
                    <div class="stats-section">
                        <div class="stat-item">
                            <span class="stat-label">Total:</span>
                            <span class="stat-value">${total}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Used:</span>
                            <span class="stat-value used">${used}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Unused:</span>
                            <span class="stat-value unused">${unused}</span>
                        </div>
                    </div>
                </div>

                <div class="actions-section">
                    <sp-button
                        variant="primary"
                        @click=${this.handleGenerateCode}
                        ?disabled=${isLoading}
                    >
                        Generate New Code
                    </sp-button>
                    <sp-button
                        variant="secondary"
                        @click=${this.handleRefresh}
                        ?disabled=${isLoading}
                    >
                        Refresh
                    </sp-button>
                </div>

                ${error
                    ? html`
                          <sp-alert variant="negative" open>
                              ${error}
                              <sp-button
                                  slot="actions"
                                  variant="secondary"
                                  @click=${() => inviteCodeStore.clearError()}
                              >
                                  Dismiss
                              </sp-button>
                          </sp-alert>
                      `
                    : null}

                <div class="table-section">
                    <platform-table
                        .data=${this.getTableData()}
                        .isLoading=${isLoading}
                        .loadingFormat=${{ headers: 7, rows: 5 }}
                    ></platform-table>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [InviteManagement.TAG_NAME]: InviteManagement;
    }
}
