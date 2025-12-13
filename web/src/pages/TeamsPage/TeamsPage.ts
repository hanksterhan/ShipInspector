import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, property } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";
import {
    generateHeader,
    Header,
    generateCell,
    Row,
    TableData,
} from "../../components";

@customElement("teams-page")
export class TeamsPage extends MobxLitElement {
    static readonly TAG_NAME = "teams-page";
    static get styles() {
        return styles;
    }

    @property({ type: String })
    placeholderProperty: string = "";

    defineHeaders(): Header[] {
        return [
            generateHeader("Team", 50),
            generateHeader("League", 50),
        ] as Header[];
    }

    defineRows(): Row[] {
        return [
            {
                rowId: 1,
                cells: [
                    generateCell("team", "10"),
                    generateCell("league", "10"),
                ],
            } as Row,
            {
                rowId: 2,
                cells: [
                    generateCell("team", "110"),
                    generateCell("league", "110"),
                ],
            } as Row,
        ] as Row[];
    }

    renderTable(): TableData {
        const headers = this.defineHeaders();
        const rows = this.defineRows();
        return {
            headers,
            rows,
        } as TableData;
    }

    render() {
        const tableData = this.renderTable();
        return html`
            <h2>TeamsPage page</h2>
            <p>Here's an example of a table with some data</p>
            <platform-table
                .data=${tableData}
                .draggable=${true}
            ></platform-table>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [TeamsPage.TAG_NAME]: TeamsPage;
    }
}
