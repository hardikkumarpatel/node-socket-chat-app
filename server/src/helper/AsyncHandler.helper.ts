import { NextFunction, Request, Response } from "express";

const asyncHander = (handler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(handler(req, res, next)).catch(error => next(error));
    }
}

export default asyncHander;