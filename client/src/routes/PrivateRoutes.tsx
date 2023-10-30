import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute: React.FC<{ children:  React.ReactNode}> = ({ children }) => {
    const { context } = useAuthContext();
    console.log("context", context)
    if(!context?.accessToken) return <Navigate to={'/login'} replace/>
    
    return children;
}

export default PrivateRoute;