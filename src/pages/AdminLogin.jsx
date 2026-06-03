import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, TextField, Button, Typography, Alert } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useAdminAuth } from "../contexts/AdminAuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      navigate("/admin/sections");
    } else {
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background)" }}>
      <Container maxWidth="sm">
        <Box sx={{
          background: "var(--color-surface)",
          p: 4,
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}>
              <LockIcon sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--color-text-subtle)", mt: 1 }}>
              Vui lòng đăng nhập để tiếp tục
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error === "Invalid login credentials" ? "Email hoặc mật khẩu không đúng" : error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading || !email || !password}
              sx={{ textTransform: "none", fontSize: "1rem", fontWeight: 600 }}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <Typography variant="caption" sx={{ color: "var(--color-text-subtle)", display: "block", mt: 3, textAlign: "center" }}>
            Liên hệ admin để được cấp tài khoản
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
