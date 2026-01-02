import { TemplateResult, nothing } from "lit";

export {};

declare global {
    type TemplateResultOrNothing =
        | TemplateResult
        | TemplateResult[]
        | typeof nothing;
}
