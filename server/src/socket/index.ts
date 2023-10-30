import { Server, Socket } from "socket.io";
import HTTP from 'http';
import { CHAT_EVENT_ENUM } from "../constant/SocketConstant";

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
        return this.IO.on('connection', async (socket: Socket) => {
            try {
                socketSet.add(socket.id);
                socket.broadcast.emit(CHAT_EVENT_ENUM.USER_CONNECTED, {
                    message: "User connected successfully",
                    count: socketSet.size
                });

                socket.on(CHAT_EVENT_ENUM.DISCONNECT_EVENT, (reason) => {
                    console.log(`socket ${socket.id} disconnected due to ${reason}`);
                    socketSet.delete(socket.id);
                });
            } catch (SocketException) {
                socket.emit(
                    CHAT_EVENT_ENUM.SOCKET_ERROR_EVENT,
                    SocketException?.message || "Something went wrong while connecting to the socket."
                );
            }
        })
    }
}