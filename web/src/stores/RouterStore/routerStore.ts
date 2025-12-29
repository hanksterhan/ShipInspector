import { makeObservable, observable, action } from "mobx";

export type Route = "/" | "/signin" | "/poker-hands" | "/equity-calculator";

export class RouterStore {
    @observable
    currentRoute: Route = "/";

    // Callback for route changes - will be set by AuthStore
    private onRouteChange?: (route: Route) => void;

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

    /**
     * Register a callback to be called when route changes
     * Used by AuthStore to check authentication on route changes
     */
    setRouteChangeListener = (callback: (route: Route) => void): void => {
        this.onRouteChange = callback;
    }

    @action
    navigate(route: Route): void {
        if (this.currentRoute !== route) {
            const oldRoute = this.currentRoute;
            this.currentRoute = route;
            window.history.pushState({}, "", route);
            
            // Notify listener of route change (for auth checks)
            if (this.onRouteChange && oldRoute !== route) {
                this.onRouteChange(route);
            }
        }
    }

    @action
    private setRouteFromPath(path: string): void {
        const oldRoute = this.currentRoute;
        
        // Map paths to routes
        if (path === "/" || path === "/signin" || path === "/login") {
            this.currentRoute = "/";
        } else if (path === "/poker-hands") {
            this.currentRoute = "/poker-hands";
        } else if (path === "/equity-calculator") {
            this.currentRoute = "/equity-calculator";
        } else {
            // Default to root
            this.currentRoute = "/";
        }
        
        // Notify listener of route change (for auth checks)
        if (this.onRouteChange && oldRoute !== this.currentRoute) {
            this.onRouteChange(this.currentRoute);
        }
    }

    get isAuthenticatedRoute(): boolean {
        return this.currentRoute !== "/" && this.currentRoute !== "/signin";
    }
}
