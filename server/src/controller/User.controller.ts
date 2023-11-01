import { Request, Response } from "express";
import sequelize from "../database/DBConnection";
import ApiErrorHandler from "../utils/ApiErrorHandler";
import { StatusCodes } from 'http-status-codes';
import { USER_ROLE } from "../constant/User.constant";
import ApiResponseHandler from "../utils/ApiResponseHandler";
import { UserDTO } from "../interface/User.interface";
import { generateAccessToken, generateRefreshToken } from "../helper/UserCommon.helper";
import asyncHander from "../helper/AsyncHandler.helper";
const { models: { users: UserModel } } = sequelize;

const loginUserController = asyncHander(async (req: Request, res: Response, next) => {
    const { body: { username, password } } = req;

    if (!username) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, 'Username is required')
    }

    const user = await UserModel.findOne({ where: { username: username } });
    if (!user) {
        throw new ApiErrorHandler(StatusCodes.NOT_FOUND, "User does not exists!")
    }

    const { password: UserPassword } = user.dataValues as UserDTO
    if (UserPassword !== password) {
        throw new ApiErrorHandler(StatusCodes.UNAUTHORIZED, "Invalid user credentials");
    }

    const accessToken = generateAccessToken(user.dataValues);
    const refreshToken = generateRefreshToken(user.dataValues);
    await UserModel.update({ refresh_token: refreshToken }, { where: { id: user.dataValues.id }});

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res.status(StatusCodes.OK)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .send(new ApiResponseHandler(StatusCodes.OK, "User logged in successfully", { accessToken, refreshToken, user }))
});

const registerUserController = asyncHander(async (req: Request, res: Response) => {
    const { body: { email, username, password, role } } = req;
    if (!username) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, 'Username is required')
    }
    if (!password) {
        throw new ApiErrorHandler(StatusCodes.BAD_REQUEST, 'Password is required')
    }

    const getExistingUser = await UserModel.findOne({ where: { username } });
    if (getExistingUser) {
        throw new ApiErrorHandler(StatusCodes.CONFLICT, "User with username already exists");
    }

    const user = await UserModel.create({
        email,
        username,
        password,
        role: role || USER_ROLE.USER
    })
    if (user) {
        return res.status(StatusCodes.CREATED).send(new ApiResponseHandler(StatusCodes.CREATED, "Users registered successfully", user))
    }
});

export {
    loginUserController,
    registerUserController
} 