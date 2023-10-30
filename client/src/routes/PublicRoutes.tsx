import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const PublicRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { context } = useAuthContext();
  console.log("context", context)
  if (context?.accessToken) return <Navigate to="/chat" replace />;

  return children;
};

export default PublicRoute;
