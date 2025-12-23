import { html } from "lit";
import { styles } from "./styles.css";
import { customElement, state } from "lit/decorators.js";
import { MobxLitElement } from "@adobe/lit-mobx";
import { authStore } from "../../stores/index";
import { visibleIcon, invisibleIcon } from "../../assets/index";

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

    @state()
    private showPassword = false;

    @state()
    private showConfirmPassword = false;

    @state()
    private passwordMatchError = "";

    private togglePasswordVisibility(e: Event): void {
        e.stopPropagation();
        this.showPassword = !this.showPassword;
    }

    private toggleConfirmPasswordVisibility(e: Event): void {
        e.stopPropagation();
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    private validatePasswordMatch(): void {
        if (!this.isLoginMode && this.password && this.confirmPassword) {
            if (this.password !== this.confirmPassword) {
                this.passwordMatchError = "Passwords do not match";
            } else {
                this.passwordMatchError = "";
            }
        } else {
            this.passwordMatchError = "";
        }
    }

    private getPasswordValue(): string {
        // Get the actual value from the DOM element in case password manager
        // filled it without triggering input events
        // Query for the sp-textfield element itself (not its shadow root)
        const passwordField = this.shadowRoot?.querySelector(
            'sp-textfield[id="password"]'
        ) as any;
        // sp-textfield exposes .value property directly
        return passwordField?.value ?? this.password;
    }

    private getEmailValue(): string {
        // Get the actual value from the DOM element in case password manager
        // filled it without triggering input events
        const emailField = this.shadowRoot?.querySelector(
            'sp-textfield[id="email"]'
        ) as any;
        return emailField?.value ?? this.email;
    }

    private getConfirmPasswordValue(): string {
        const confirmField = this.shadowRoot?.querySelector(
            'sp-textfield[id="confirmPassword"]'
        ) as any;
        return confirmField?.value ?? this.confirmPassword;
    }

    private async handleSubmit(): Promise<void> {
        authStore.clearError();

        // Read values directly from DOM to catch password manager autofills
        const email = this.getEmailValue();
        const password = this.getPasswordValue();
        const confirmPassword = this.getConfirmPasswordValue();

        // Update state to keep it in sync
        this.email = email;
        this.password = password;
        this.confirmPassword = confirmPassword;

        if (this.isLoginMode) {
            try {
                await authStore.login(email, password);
            } catch (error) {
                // Error is handled by the store
            }
        } else {
            // Validate password match before submitting
            if (password !== confirmPassword) {
                this.passwordMatchError = "Passwords do not match";
                return;
            }
            this.passwordMatchError = "";
            try {
                await authStore.register(email, password);
            } catch (error) {
                // Error is handled by the store
            }
        }
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            this.handleSubmit();
        }
    }

    private toggleMode(): void {
        this.isLoginMode = !this.isLoginMode;
        this.email = "";
        this.password = "";
        this.confirmPassword = "";
        this.showPassword = false;
        this.showConfirmPassword = false;
        this.passwordMatchError = "";
        authStore.clearError();
    }

    render() {
        return html`
            <sp-theme system="spectrum" color="light" scale="medium" dir="ltr">
                <div class="login-container">
                    <div class="login-card">
                        <h1 class="login-title">Ship Inspector</h1>

                        ${authStore.error
                            ? html`<div
                                  style="background-color: var(--spectrum-global-color-red-100); color: var(--spectrum-global-color-red-700); padding: var(--spectrum-global-dimension-size-200); border-radius: var(--spectrum-global-dimension-size-100); margin-bottom: var(--spectrum-global-dimension-size-300);"
                              >
                                  ${authStore.error}
                              </div>`
                            : null}

                        <div class="auth-fields">
                            <sp-field-label for="email">Email</sp-field-label>
                            <sp-textfield
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                .value=${this.email}
                                @input=${(e: any) => {
                                    this.email = e.target.value;
                                }}
                                @change=${(e: any) => {
                                    this.email = e.target.value;
                                }}
                                @keydown=${this.handleKeyDown}
                                autocomplete="email"
                            ></sp-textfield>

                            <sp-field-label for="password"
                                >Password</sp-field-label
                            >
                            <div class="password-field-wrapper">
                                <sp-textfield
                                    id="password"
                                    type=${this.showPassword
                                        ? "text"
                                        : "password"}
                                    placeholder="Enter your password"
                                    .value=${this.password}
                                    @input=${(e: any) => {
                                        this.password = e.target.value;
                                        this.validatePasswordMatch();
                                    }}
                                    @change=${(e: any) => {
                                        this.password = e.target.value;
                                        this.validatePasswordMatch();
                                    }}
                                    @keydown=${this.handleKeyDown}
                                    autocomplete=${this.isLoginMode
                                        ? "current-password"
                                        : "new-password"}
                                    class="password-textfield"
                                ></sp-textfield>
                                <sp-action-button
                                    class="password-toggle-button"
                                    @click=${this.togglePasswordVisibility}
                                    quiet
                                    size="s"
                                    title=${this.showPassword
                                        ? "Hide password"
                                        : "Show password"}
                                >
                                    <span slot="icon"
                                        >${this.showPassword
                                            ? invisibleIcon
                                            : visibleIcon}</span
                                    >
                                </sp-action-button>
                            </div>

                            ${!this.isLoginMode
                                ? html`
                                      <sp-field-label for="confirmPassword"
                                          >Confirm Password</sp-field-label
                                      >
                                      <div class="password-field-wrapper">
                                          <sp-textfield
                                              id="confirmPassword"
                                              type=${this.showConfirmPassword
                                                  ? "text"
                                                  : "password"}
                                              placeholder="Confirm your password"
                                              .value=${this.confirmPassword}
                                              @input=${(e: any) => {
                                                  this.confirmPassword =
                                                      e.target.value;
                                                  this.validatePasswordMatch();
                                              }}
                                              @change=${(e: any) => {
                                                  this.confirmPassword =
                                                      e.target.value;
                                                  this.validatePasswordMatch();
                                              }}
                                              @keydown=${this.handleKeyDown}
                                              autocomplete="new-password"
                                              class="password-textfield"
                                          ></sp-textfield>
                                          <sp-action-button
                                              class="password-toggle-button"
                                              @click=${this
                                                  .toggleConfirmPasswordVisibility}
                                              quiet
                                              size="s"
                                              title=${this.showConfirmPassword
                                                  ? "Hide password"
                                                  : "Show password"}
                                          >
                                              <span slot="icon"
                                                  >${this.showConfirmPassword
                                                      ? invisibleIcon
                                                      : visibleIcon}</span
                                              >
                                          </sp-action-button>
                                      </div>
                                      ${this.passwordMatchError
                                          ? html`<sp-help-text
                                                variant="negative"
                                                id="password-match-error"
                                            >
                                                ${this.passwordMatchError}
                                            </sp-help-text>`
                                          : null}
                                  `
                                : null}

                            <sp-button
                                variant="accent"
                                ?disabled=${authStore.isLoading}
                                @click=${this.handleSubmit}
                                class="submit-button"
                            >
                                ${authStore.isLoading
                                    ? "Please wait..."
                                    : this.isLoginMode
                                      ? "Sign In"
                                      : "Sign Up"}
                            </sp-button>
                        </div>

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
