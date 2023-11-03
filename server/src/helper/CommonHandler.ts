import { Request } from "express"
import { UserDTO } from "../interface/User.interface";
import { Socket } from "socket.io";

export interface CustomRequest extends Request {
    user: UserDTO;
}

export interface CustomSocket extends Socket {
    user?: UserDTO;
}