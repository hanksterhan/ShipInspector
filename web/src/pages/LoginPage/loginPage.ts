import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { authStore } from "../../stores/index";

@customElement("login-page")
export class LoginPage extends MobxLitElement {
    static readonly TAG_NAME = "login-page";
    static get styles() {
        return styles;
    }

    @state()
    private isLoginMode = true;

    @state()
    private email = "";

    @state()
    private password = "";

    @state()
    private confirmPassword = "";

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();
        authStore.clearError();

        if (this.isLoginMode) {
            try {
                await authStore.login(this.email, this.password);
            } catch (error) {
                // Error is handled by the store
            }
        } else {
            if (this.password !== this.confirmPassword) {
                authStore.error = "Passwords do not match";
                return;
            }
            try {
                await authStore.register(this.email, this.password);
            } catch (error) {
                // Error is handled by the store
            }
        }
    }

    private toggleMode(): void {
        this.isLoginMode = !this.isLoginMode;
        this.email = "";
        this.password = "";
        this.confirmPassword = "";
        authStore.clearError();
    }

    render() {
        return html`
            <sp-theme system="spectrum" color="light" scale="medium" dir="ltr">
                <div class="login-container">
                    <div class="login-card">
                        <h1 class="login-title">Ship Inspector</h1>
                        <p class="login-subtitle">
                            ${this.isLoginMode
                                ? "Sign in to your account"
                                : "Create a new account"}
                        </p>

                        ${authStore.error
                            ? html`<div
                                  style="background-color: var(--spectrum-global-color-red-100); color: var(--spectrum-global-color-red-700); padding: var(--spectrum-global-dimension-size-200); border-radius: var(--spectrum-global-dimension-size-100); margin-bottom: var(--spectrum-global-dimension-size-300);"
                              >
                                  ${authStore.error}
                              </div>`
                            : null}

                        <form @submit=${this.handleSubmit} class="auth-form">
                            <sp-field-label for="email">Email</sp-field-label>
                            <sp-textfield
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                .value=${this.email}
                                @input=${(e: any) => {
                                    this.email = e.target.value;
                                }}
                                required
                                autocomplete="email"
                            ></sp-textfield>

                            <sp-field-label for="password"
                                >Password</sp-field-label
                            >
                            <sp-textfield
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                .value=${this.password}
                                @input=${(e: any) => {
                                    this.password = e.target.value;
                                }}
                                required
                                autocomplete=${this.isLoginMode
                                    ? "current-password"
                                    : "new-password"}
                            ></sp-textfield>

                            ${!this.isLoginMode
                                ? html`
                                      <sp-field-label for="confirmPassword"
                                          >Confirm Password</sp-field-label
                                      >
                                      <sp-textfield
                                          id="confirmPassword"
                                          type="password"
                                          placeholder="Confirm your password"
                                          .value=${this.confirmPassword}
                                          @input=${(e: any) => {
                                              this.confirmPassword =
                                                  e.target.value;
                                          }}
                                          required
                                          autocomplete="new-password"
                                      ></sp-textfield>
                                  `
                                : null}

                            <sp-button
                                type="submit"
                                variant="accent"
                                ?disabled=${authStore.isLoading}
                                class="submit-button"
                            >
                                ${authStore.isLoading
                                    ? "Please wait..."
                                    : this.isLoginMode
                                      ? "Sign In"
                                      : "Sign Up"}
                            </sp-button>
                        </form>

                        <div class="toggle-mode">
                            <span>
                                ${this.isLoginMode
                                    ? "Don't have an account? "
                                    : "Already have an account? "}
                            </span>
                            <sp-link
                                @click=${this.toggleMode}
                                class="toggle-link"
                            >
                                ${this.isLoginMode ? "Sign up" : "Sign in"}
                            </sp-link>
                        </div>
                    </div>
                </div>
            </sp-theme>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        [LoginPage.TAG_NAME]: LoginPage;
    }
}

