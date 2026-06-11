import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAdminAuth } from "../../contexts/AdminAuthContext";

export default function ProtectedTradingRoute({ children }) {
  const { isLoggedIn, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/trading-login" state={{ from: location }} replace />;
  }

  return children;
}
