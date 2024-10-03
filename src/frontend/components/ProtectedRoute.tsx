import React from "react";
import { Navigate } from "react-router-dom";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";

interface Props {
  children: React.ReactNode;
}
const ProtectedRoute = ({ children }: Props) => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    console.log("Fuck you, you're not signed in");
    return <Navigate to="/signin" />;
  }

  return children;
};

export default ProtectedRoute;
