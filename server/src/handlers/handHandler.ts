import { Request, Response } from "express";
// import { LeagueInfo } from "@common/interfaces";

class HandHandler {
    getUserLeagues = async (_req: Request, res: Response) => {
        // const response: LeagueInfo[] = await yahoo.getUserLeagues();
        const response = {};
        res.status(200).json(response);
    };
}

export const handHandler = new HandHandler();
