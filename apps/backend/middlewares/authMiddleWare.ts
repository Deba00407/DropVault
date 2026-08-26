import type { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { StatusCodes } from "http-status-codes"
import { fromNodeHeaders } from "better-auth/node";


export async function authMiddleWare(
    req: Request, res: Response, next: NextFunction
) {

    console.log("Middleware was hit");

    try {
        // get user session data

        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        })

        if (!session) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                error: "Unauthorized access",
            });
        }

        // Attach the user id to the incoming request
        req.userId = session.user.id

        next();

    } catch (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            error: "Unauthorized access",
        });
    }
}