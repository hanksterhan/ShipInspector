import { IRouter, Router as defineRouter } from "express";
import { handHandler } from "../handlers";

function createRouter(): IRouter {
    const router = defineRouter();

    router.get("/poker/hand", handHandler.getUserLeagues);
    return router;
}

export const handRouter = createRouter();
