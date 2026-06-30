// src/components/sections/WishBannerSection.jsx – promotional banner for wish generator
import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Button } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const WISHES_PREVIEW = [
  { font: "'Dancing Script', cursive", size: "1.15rem", text: "Chúc bạn sinh nhật vui vẻ, tràn đầy hạnh phúc…" },
  { font: "'Great Vibes', cursive",    size: "1.3rem",  text: "Kính chúc gia đình năm mới an khang thịnh vượng…" },
  { font: "'Satisfy', cursive",        size: "1.1rem",  text: "Chúc mừng hôn lễ, trăm năm hạnh phúc bên nhau…" },
];

export default function WishBannerSection() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        py: { xs: 5, md: 7 },
        background: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 50%, #f093fb 100%)",
        position: "relative", overflow: "hidden",
        "&::before": {
          content: '""', position: "absolute", inset: 0,
          background: [
            "radial-gradient(ellipse at 10% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)",
            "radial-gradient(ellipse at 90% 20%, rgba(255,255,255,0.12) 0%, transparent 45%)",
          ].join(","),
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: { xs: 4, md: 6 } }}>

          {/* Left: text */}
          <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.8,
              px: 2, py: 0.6, borderRadius: 99, mb: 2,
              bgcolor: "rgba(255,255,255,0.22)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.35)",
            }}>
              <AutoAwesomeIcon sx={{ fontSize: "0.85rem", color: "#fff" }} />
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Tính năng mới
              </Typography>
            </Box>

            <Typography variant="h4" sx={{
              fontFamily: "'Dancing Script', cursive",
              fontWeight: 700, color: "#fff",
              textShadow: "0 2px 16px rgba(0,0,0,0.18)",
              fontSize: { xs: "2rem", md: "2.6rem" },
              lineHeight: 1.2, mb: 1.5,
            }}>
              Tạo Lời Chúc AI ✨
            </Typography>

            <Typography sx={{
              color: "rgba(255,255,255,0.9)", lineHeight: 1.65,
              fontSize: { xs: "0.9rem", md: "1rem" }, mb: 3,
            }}>
              Sinh nhật, Tết, đám cưới, tốt nghiệp… chỉ cần mô tả, AI tạo lời chúc
              chân thành & ý nghĩa với font chữ đẹp ngay lập tức.
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/wishes")}
              startIcon={<AutoAwesomeIcon />}
              sx={{
                bgcolor: "#fff", color: "#9c27b0", fontWeight: 800,
                borderRadius: 99, px: 3.5, py: 1.4, fontSize: "0.95rem",
                textTransform: "none", boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.9)", transform: "translateY(-2px)", boxShadow: "0 10px 32px rgba(0,0,0,0.2)" },
                transition: "all 0.25s",
              }}
            >
              Thử ngay miễn phí
            </Button>
          </Box>

          {/* Right: floating preview cards */}
          <Box sx={{
            flex: 1, display: "flex", flexDirection: "column", gap: 1.5,
            maxWidth: { xs: "100%", md: 320 },
          }}>
            {WISHES_PREVIEW.map((w, i) => (
              <Box
                key={i}
                sx={{
                  bgcolor: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)",
                  borderRadius: 3, px: 2.5, py: 2,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  border: "1px solid rgba(255,255,255,0.7)",
                  animation: "wish-float 0.5s ease",
                  animationDelay: `${i * 0.1}s`,
                  animationFillMode: "both",
                  "@keyframes wish-float": {
                    from: { opacity: 0, transform: "translateX(20px)" },
                    to:   { opacity: 1, transform: "translateX(0)" },
                  },
                }}
              >
                <Typography sx={{
                  fontFamily: w.font, fontSize: w.size,
                  color: "#3d2b6b", lineHeight: 1.5,
                  display: "-webkit-box", overflow: "hidden",
                  WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
                }}>
                  {w.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
