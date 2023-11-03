import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes'
import Jwt from 'jsonwebtoken';
import ApiErrorHandler from '../utils/ApiErrorHandler';
import { LocalEnvironmentConfig } from '../utils/LocalEnv';
import { UserDTO } from '../interface/User.interface';
import sequelize from "../database/DBConnection";
import { CustomRequest } from '../helper/CommonHandler';
import asyncHander from '../helper/AsyncHandler.helper';
const { environmentVariables: { ACCESS_TOKEN_SECRET } } = new LocalEnvironmentConfig();
const { models: { users: UserModel } } = sequelize;

const useAuthHandler = asyncHander(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { cookies, headers } = req;
    const token = cookies?.['accessToken']
        || headers.authorization?.replace("Bearer ", "");

    if (!token) {
        throw new ApiErrorHandler(StatusCodes.UNAUTHORIZED, "Unauthorised request! access token is missing");
    }
    const decodeToken = Jwt.verify(token, ACCESS_TOKEN_SECRET);
    const { id } = decodeToken as UserDTO;
    const user = await UserModel.findOne({ where: { id } });
    if (!user) {
        throw new ApiErrorHandler(StatusCodes.UNAUTHORIZED, "Invalid user access token");
    }

    req.user = user.dataValues as UserDTO;
    next();
});

export default useAuthHandler;