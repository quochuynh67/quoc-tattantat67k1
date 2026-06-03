import React from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAdminAuth } from "../contexts/AdminAuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { isLoggedIn, loading } = useAdminAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}
