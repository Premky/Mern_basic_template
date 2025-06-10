import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";

const LoggedIn = () => {
  const { state } = useAuth();
  const isValidUser = !!state?.valid; // Ensure boolean check

  return isValidUser ? <Navigate to="/" replace /> : <Outlet />;
};

export default LoggedIn;