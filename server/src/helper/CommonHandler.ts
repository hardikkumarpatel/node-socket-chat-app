import { Request } from "express"
import { UserDTO } from "../interface/User.interface";

export interface CustomRequest extends Request {
    user: UserDTO;
}