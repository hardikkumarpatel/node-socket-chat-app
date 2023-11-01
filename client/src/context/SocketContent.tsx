import React, { useEffect, useState } from 'react';
import { SocketDTO } from '../interface/Common.interface';
import SocketIO, { Socket } from 'socket.io-client';

const establishedSocketInstance = () => {
    const socketConnectionURL: string = 'ws://localhost:3010'
    const socket: Socket = SocketIO(socketConnectionURL, {
        transports: ['websocket']
    });
    if (socket) {
        socket.on('connect', () => { });
        socket.on('disconnect', () => { });
    }
    return socket as Socket;
};


const SocketContext = React.createContext<SocketDTO | null>(null);

const useSocketContext = () => React.useContext(SocketContext);

const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [socket, setSocket] = useState<ReturnType<typeof SocketIO> | null>(null);
    useEffect(() => {
        setSocket(establishedSocketInstance());
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    )
}

export { useSocketContext };
export default SocketProvider;