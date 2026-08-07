// src/components/sections/GamesBannerSection.jsx
// Banner quảng bá khu game F&B trên trang chủ
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Button } from "@mui/material";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const GAME_PREVIEWS = [
  { emoji: "🎯", label: "Vòng Quay May Mắn", desc: "Spin để nhận voucher" },
  { emoji: "🃏", label: "Lật Thẻ Trùng",     desc: "Rèn trí nhớ · Tích điểm" },
  { emoji: "❓", label: "Đố Vui Ẩm Thực",    desc: "Kiến thức miền Tây" },
  { emoji: "🎰", label: "Máy Slot Voucher",   desc: "3 khớp → Jackpot!" },
];

// Nhỏ hơn — floating score pill animation
function FloatingPill({ value, color, delay }) {
  return (
    <Box
      sx={{
        display: "inline-flex", alignItems: "center", gap: 0.6,
        bgcolor: color + "22", border: `1.5px solid ${color}55`,
        borderRadius: 99, px: 1.5, py: 0.4,
        fontSize: "0.78rem", fontWeight: 700, color,
        animation: "pillFloat 3s ease-in-out infinite",
        animationDelay: delay,
        "@keyframes pillFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-5px)" },
        },
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </Box>
  );
}

export default function GamesBannerSection() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(0);

  // Auto-rotate preview card
  useEffect(() => {
    const id = setInterval(() => setActiveCard(i => (i + 1) % GAME_PREVIEWS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <Box
      sx={{
        py: { xs: 5, md: 7 },
        background: "linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0f1729 100%)",
        position: "relative",
        overflow: "hidden",
        // Subtle star-like dots
        "&::before": {
          content: '""',
          position: "absolute", inset: 0,
          backgroundImage: [
            "radial-gradient(ellipse at 15% 60%, rgba(249,115,22,0.18) 0%, transparent 45%)",
            "radial-gradient(ellipse at 85% 20%, rgba(168,85,247,0.18) 0%, transparent 45%)",
            "radial-gradient(ellipse at 50% 90%, rgba(59,130,246,0.12) 0%, transparent 40%)",
          ].join(","),
          pointerEvents: "none",
        },
        // Neon border-top accent
        "&::after": {
          content: '""',
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: "linear-gradient(90deg, #f7971e, #f953c6, #6a11cb, #2575fc)",
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          gap: { xs: 4, md: 6 },
        }}>

          {/* ── Left: copy ── */}
          <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>

            {/* Badge */}
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.8,
              px: 2, py: 0.6, borderRadius: 99, mb: 2,
              bgcolor: "rgba(249,115,22,0.15)",
              border: "1.5px solid rgba(249,115,22,0.4)",
            }}>
              <SportsEsportsIcon sx={{ fontSize: "0.85rem", color: "#f97316" }} />
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Gamification · F&B & Bán lẻ
              </Typography>
            </Box>

            <Typography variant="h3" sx={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 900,
              fontSize: { xs: "1.9rem", md: "2.6rem" },
              lineHeight: 1.15, mb: 1.5,
              background: "linear-gradient(90deg, #f7971e 0%, #f953c6 50%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Chơi Game 🎮<br />Nhận Ưu Đãi Thật
            </Typography>

            <Typography sx={{
              color: "rgba(255,255,255,0.65)", lineHeight: 1.7,
              fontSize: { xs: "0.9rem", md: "1rem" }, mb: 2.5, maxWidth: 400,
            }}>
              8 mini-game miễn phí dành cho khách hàng F&B và bán lẻ — tích điểm mỗi ngày,
              đổi voucher tại cửa hàng tham gia.
            </Typography>

            {/* Floating pills */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3, justifyContent: { xs: "center", md: "flex-start" } }}>
              <FloatingPill value="⭐ Tích điểm"     color="#fbbf24" delay="0s" />
              <FloatingPill value="🎁 Đổi voucher"    color="#34d399" delay="0.4s" />
              <FloatingPill value="🏆 Bảng xếp hạng"  color="#818cf8" delay="0.8s" />
              <FloatingPill value="🎲 Mỗi ngày chơi"  color="#f472b6" delay="1.2s" />
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={<SportsEsportsIcon />}
              onClick={() => navigate("/fnb-games")}
              sx={{
                background: "linear-gradient(135deg, #f7971e, #f953c6)",
                color: "#fff", fontWeight: 800, borderRadius: 99,
                px: 4, py: 1.5, fontSize: "1rem",
                textTransform: "none",
                boxShadow: "0 6px 32px rgba(249,115,22,0.45)",
                "&:hover": {
                  background: "linear-gradient(135deg, #f953c6, #6a11cb)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 40px rgba(249,83,198,0.45)",
                },
                transition: "all 0.25s",
              }}
            >
              Vào khu game ngay
            </Button>
          </Box>

          {/* ── Right: game preview cards ── */}
          <Box sx={{
            flex: 1, maxWidth: { xs: "100%", md: 380 },
            display: "flex", flexDirection: "column", gap: 1.5, position: "relative",
          }}>
            {/* Glow behind cards */}
            <Box sx={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 280, height: 280, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)",
              pointerEvents: "none",
              animation: "pulseGlow 3s ease-in-out infinite",
              "@keyframes pulseGlow": {
                "0%,100%": { opacity: 0.6, transform: "translate(-50%,-50%) scale(1)" },
                "50%":     { opacity: 1,   transform: "translate(-50%,-50%) scale(1.1)" },
              },
            }} />

            {GAME_PREVIEWS.map((g, i) => (
              <Box
                key={i}
                onClick={() => navigate("/fnb-games")}
                sx={{
                  display: "flex", alignItems: "center", gap: 2,
                  bgcolor: i === activeCard
                    ? "rgba(249,115,22,0.18)"
                    : "rgba(255,255,255,0.04)",
                  border: i === activeCard
                    ? "1.5px solid rgba(249,115,22,0.5)"
                    : "1.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 3, px: 2.5, py: 1.6,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  transform: i === activeCard ? "translateX(6px)" : "none",
                  boxShadow: i === activeCard ? "0 4px 24px rgba(249,115,22,0.25)" : "none",
                  "&:hover": { bgcolor: "rgba(249,115,22,0.12)", borderColor: "rgba(249,115,22,0.3)" },
                }}
              >
                <Box sx={{
                  width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                  background: i === activeCard
                    ? "linear-gradient(135deg, #f7971e, #f953c6)"
                    : "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem",
                  transition: "background 0.3s",
                }}>
                  {g.emoji}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{
                    fontWeight: 700, fontSize: "0.9rem",
                    color: i === activeCard ? "#fff" : "rgba(255,255,255,0.7)",
                    transition: "color 0.3s",
                  }}>
                    {g.label}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    {g.desc}
                  </Typography>
                </Box>
                {i === activeCard && (
                  <EmojiEventsIcon sx={{ color: "#fbbf24", fontSize: 20, flexShrink: 0 }} />
                )}
              </Box>
            ))}

            {/* Stat row */}
            <Box sx={{
              display: "flex", justifyContent: "space-around",
              bgcolor: "rgba(255,255,255,0.03)", borderRadius: 3,
              border: "1.5px solid rgba(255,255,255,0.06)",
              py: 1.5, mt: 0.5,
            }}>
              {[
                { label: "Mini-game", value: "8", color: "#f97316" },
                { label: "Miễn phí", value: "100%", color: "#34d399" },
                { label: "Hàng ngày", value: "∞", color: "#818cf8" },
              ].map((s) => (
                <Box key={s.label} sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: s.color }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{s.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

        </Box>
      </Container>
    </Box>
  );
}
