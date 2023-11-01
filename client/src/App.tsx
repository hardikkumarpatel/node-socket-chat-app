import React from 'react';
import { useAuthContext } from './context/AuthContext';
import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './routes/PrivateRoutes';
import PublicRoute from './routes/PublicRoutes';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ChatPage from './pages/Chat';

function App() {
  const { context } = useAuthContext();

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
