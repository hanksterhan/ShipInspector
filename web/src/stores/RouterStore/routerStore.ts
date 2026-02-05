import { makeObservable, observable, action } from "mobx";

export type Route =
    | "/"
    | "/signin"
    | "/equity-calculator"
    | "/hand-replayer"
    | "/hand-library"
    | "/replay"; // /replay/:handId route

export class RouterStore {
    @observable
    currentRoute: Route = "/";

    @observable
    replayHandId: string | null = null;

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
    };

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
            this.replayHandId = null;
        } else if (path === "/equity-calculator") {
            this.currentRoute = "/equity-calculator";
            this.replayHandId = null;
        } else if (path === "/hand-replayer") {
            this.currentRoute = "/hand-replayer";
            this.replayHandId = null;
        } else if (path === "/hand-library") {
            this.currentRoute = "/hand-library";
            this.replayHandId = null;
        } else if (path.startsWith("/replay/")) {
            // Extract hand ID from /replay/:handId
            const handId = path.slice("/replay/".length);
            if (handId) {
                this.currentRoute = "/replay";
                this.replayHandId = handId;
            } else {
                this.currentRoute = "/hand-library";
                this.replayHandId = null;
            }
        } else {
            // Default to root
            this.currentRoute = "/";
            this.replayHandId = null;
        }

        // Notify listener of route change (for auth checks)
        if (this.onRouteChange && oldRoute !== this.currentRoute) {
            this.onRouteChange(this.currentRoute);
        }
    }

    get isAuthenticatedRoute(): boolean {
        return this.currentRoute !== "/" && this.currentRoute !== "/signin";
    }

    /**
     * Navigate to replay a specific hand
     */
    @action
    navigateToReplay(handId: string): void {
        this.currentRoute = "/replay";
        this.replayHandId = handId;
        window.history.pushState({}, "", `/replay/${handId}`);

        if (this.onRouteChange) {
            this.onRouteChange("/replay");
        }
    }
}
