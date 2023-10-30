import React, { useCallback, useEffect, useState } from 'react';
import SocketIO, { Socket } from 'socket.io-client';
import { useAuthContext } from './context/AuthContext';
import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './routes/PrivateRoutes';
import PublicRoute from './routes/PublicRoutes';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ChatPage from './pages/Chat';

function App() {
  const { context } = useAuthContext();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket>();

  const onConnect = () => setIsConnected(true);
  const onDisconnect = () => setIsConnected(false);

  const establishedSocketInstance = useCallback(() => {
    const socketConnectionURL: string = 'ws://localhost:3010'
    const socket: Socket = SocketIO(socketConnectionURL, {
      transports: ['websocket']
    });
    if (socket) {
      setSocket(socket);
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
    }
  }, []);

  useEffect(() => {
    establishedSocketInstance();
  }, [establishedSocketInstance]);

  const UserCreatedRoom = useCallback(() => {
    socket?.emit("ADMIN_CREATE_ROOM");
  }, [socket]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          context?.accessToken ? (
            <Navigate to="/chat" />
          ) : (
            <Navigate to="/login" />
          )
        }
      ></Route>
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="*" element={<p>404 Not found</p>} />
    </Routes>
  );
}

export default App;
