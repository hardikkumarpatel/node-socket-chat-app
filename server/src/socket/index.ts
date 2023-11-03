import { Server, Socket } from "socket.io";
import HTTP from 'http';
import { CHAT_EVENT_ENUM } from "../constant/SocketConstant";
import ApiErrorHandler from "../utils/ApiErrorHandler";
import { StatusCodes } from "http-status-codes";
import Jwt from 'jsonwebtoken';
import cookie from "cookie";
import { LocalEnvironmentConfig } from "../utils/LocalEnv";
import sequelize from "../database/DBConnection";
import { UserDTO } from "../interface/User.interface";
import { CustomRequest, CustomSocket } from "../helper/CommonHandler";
const { environmentVariables: { ACCESS_TOKEN_SECRET } } = new LocalEnvironmentConfig();
const { models: { users: UserModel } } = sequelize;
export class SockerServer {
    public IO: Server;

    constructor(http: HTTP.Server) {
        this.IO = new Server(http, {
            cors: {
                origin: '*'
            },
            connectionStateRecovery: {},
            allowEIO3: true
        });
        this.initializeSocketIO();
    }

    initializeSocketIO = () => {
        console.log("Socket engine has been connected and initialized!")
        const socketSet = new Set();
        return this.IO.on('connection', async (socket: CustomSocket) => {
            try {
                const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
                let token = cookies?.accessToken;

                if (!token) {
                    token = socket.handshake.auth?.token;
                }
                if (!token) {
                    throw new ApiErrorHandler(StatusCodes.UNAUTHORIZED, "Un-authorized handshake. Token is missing");
                }

                const decodedToken = Jwt.verify(token, ACCESS_TOKEN_SECRET) as UserDTO;
                const user = await UserModel.findOne({
                    where: {
                        id: decodedToken.id
                    }
                });
                if (!user) {
                    throw new ApiErrorHandler(StatusCodes.UNAUTHORIZED, "Un-authorized handshake. Token is invalid");
                }
                const decodeUser = user.dataValues as UserDTO;
                socket.user = decodeUser;
                socket.join(decodeUser.id.toString())
                socket.emit(CHAT_EVENT_ENUM.CONNECTED_EVENT); // emit the connected event so that client is aware
                console.log("User connected UserID:", decodeUser.id.toString());
                this.mountJoinChatEvent(socket);
                this.mountParticipantTypingEvent(socket);
                this.mountParticipantStoppedTypingEvent(socket);

                socket.on(CHAT_EVENT_ENUM.DISCONNECT_EVENT, () => {
                    console.log("user has disconnected. UserID: " + socket.user?.id);
                    if (socket.user?.id) {
                        socket.leave(socket.user.id);
                    }
                });

                // socket.broadcast.emit(CHAT_EVENT_ENUM.USER_CONNECTED, {
                //     message: "User connected successfully",
                //     count: socketSet.size
                // });

                // socket.on(CHAT_EVENT_ENUM.DISCONNECT_EVENT, (reason) => {
                //     console.log(`socket ${socket.id} disconnected due to ${reason}`);
                //     socketSet.delete(socket.id);
                // });
            } catch (SocketException) {
                socket.emit(
                    CHAT_EVENT_ENUM.SOCKET_ERROR_EVENT,
                    SocketException?.message || "Something went wrong while connecting to the socket."
                );
            }
        })
    }


    mountJoinChatEvent = (socket: CustomSocket) => {
        socket.on(CHAT_EVENT_ENUM.JOIN_CHAT_EVENT, (ChatID) => {
            console.log(`User joined the chat 🤝. ChatID: `, ChatID);
            // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
            // E.g. When user types we don't want to emit that event to specific participant.
            // We want to just emit that to the chat where the typing is happening
            socket.join(ChatID);
        });
    };


    mountParticipantTypingEvent = (socket: CustomSocket) => {
        socket.on(CHAT_EVENT_ENUM.TYPING_EVENT, (ChatID) => {
            socket.in(ChatID).emit(CHAT_EVENT_ENUM.TYPING_EVENT, ChatID);
        });
    };

    mountParticipantStoppedTypingEvent = (socket: CustomSocket) => {
        socket.on(CHAT_EVENT_ENUM.STOP_TYPING_EVENT, (ChatID) => {
            socket.in(ChatID).emit(CHAT_EVENT_ENUM.STOP_TYPING_EVENT, ChatID);
        });
    };

    static emitSocketEvent = (req: CustomRequest, roomId: string, event, payload) => {
        req.app.get("IO").in(roomId).emit(event, payload);
    };
}