import Jwt from "jsonwebtoken";
import { UserDTO } from "../interface/User.interface";
import { LocalEnvironmentConfig } from "../utils/LocalEnv";
const {
    environmentVariables: { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY },
} = new LocalEnvironmentConfig();

const generateAccessToken = (user: UserDTO): string => {
    const { id, email, username, role } = user;
    return Jwt.sign(
        {
            id,
            email,
            username,
            role,
        },
        ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        }
    );
};

const generateRefreshToken = (user: UserDTO): string => {
    const { id } = user;
    return Jwt.sign(
        {
            id,
        },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
}

export {
    generateAccessToken,
    generateRefreshToken
}