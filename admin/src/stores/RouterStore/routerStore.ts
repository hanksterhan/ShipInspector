import { makeObservable, observable, action } from "mobx";

export type Route = "/" | "/signin" | "/invite-management" | "/swagger-docs";

export class RouterStore {
    @observable
    currentRoute: Route = "/";

    constructor() {
        makeObservable(this);
        this.init();
    }

    private init(): void {
        // Listen to browser navigation
        window.addEventListener("popstate", () => {
            this.setRouteFromPath(window.location.pathname);
        });

        // Set initial route from URL
        this.setRouteFromPath(window.location.pathname);
    }

    @action
    navigate(route: Route): void {
        if (this.currentRoute !== route) {
            this.currentRoute = route;
            window.history.pushState({}, "", route);
        }
    }

    @action
    private setRouteFromPath(path: string): void {
        // Map paths to routes
        if (path === "/" || path === "/signin" || path === "/login") {
            this.currentRoute = "/";
        } else if (path === "/invite-management") {
            this.currentRoute = "/invite-management";
        } else if (path === "/swagger-docs") {
            this.currentRoute = "/swagger-docs";
        } else {
            // Default to root
            this.currentRoute = "/";
        }
    }

    get isAuthenticatedRoute(): boolean {
        return this.currentRoute !== "/" && this.currentRoute !== "/signin";
    }
}
