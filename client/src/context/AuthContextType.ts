import { User } from "../interface/User.interface"
export interface AuthContextDTO {
    accessToken: string;
    refreshToken: string;
    user: User,
}