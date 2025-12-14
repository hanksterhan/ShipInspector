import { IRouter, Router as defineRouter } from "express";
import { handHandler } from "../handlers";

function createRouter(): IRouter {
    const router = defineRouter();

    // Hand evaluation endpoints
    router.post("/poker/hand/evaluate", handHandler.evaluateHand);
    router.post("/poker/hand/compare", handHandler.compareHands);
    
    // Equity calculation endpoint
    router.post("/poker/equity/calculate", handHandler.calculateEquity);

    return router;
}

export const handRouter = createRouter();
