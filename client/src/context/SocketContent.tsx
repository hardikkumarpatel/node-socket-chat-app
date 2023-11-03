import React, { useEffect, useState } from 'react';
import { SocketDTO } from '../interface/Common.interface';
import SocketIO, { Socket } from 'socket.io-client';
import { LocalStorage } from '../Utils/LocalStorage';
import { USER_STORAGE } from '../constant/Constant';
import { useAuthContext } from './AuthContext';

const establishedSocketInstance = () => {
    const socketConnectionURL: string = 'ws://localhost:3010'
    const socket: Socket = SocketIO(socketConnectionURL, {
        transports: ['websocket'],
        withCredentials: true,
        auth: {
            token: LocalStorage.get(USER_STORAGE)?.['accessToken']
        }
    });
    if (socket) {
        socket.on('connect', () => { });
        socket.on('disconnect', () => { });
    }
    return socket as Socket;
};


const SocketContext = React.createContext<SocketDTO>({
    socket: null
});

const useSocketContext = () => React.useContext(SocketContext);

const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const { context } = useAuthContext();
    const [socket, setSocket] = useState<ReturnType<typeof SocketIO> | null>(null);
    
    useEffect(() => {
        if(!context?.accessToken) return;

        setSocket(establishedSocketInstance());
    }, [context]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    )
}

export { useSocketContext };
export default SocketProvider;