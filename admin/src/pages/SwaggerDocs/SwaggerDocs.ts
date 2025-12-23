import { html, TemplateResult } from "lit";
import { styles } from "./styles.css";
import { customElement } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";

import "../index";
import "../../components/index";

@customElement("swagger-docs")
export class SwaggerDocs extends MobxLitElement {
    static readonly TAG_NAME = "swagger-docs";
    static get styles() {
        return styles;
    }

    render(): TemplateResult {
        return html`
            <div class="swagger-docs-container">
                <iframe
                    src="http://localhost:3000/api-docs"
                    class="swagger-iframe"
                    title="API Documentation"
                ></iframe>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [SwaggerDocs.TAG_NAME]: SwaggerDocs;
    }
}
