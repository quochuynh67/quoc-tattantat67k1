// src/components/sections/ToolsSection.jsx – lưới tiện ích kiểu App Store trên trang chủ
import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Box } from "@mui/material";
import { TOOLS, openTool } from "../../lib/tools";

const ToolsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="content-section" style={{ padding: "var(--spacing-xl) 0" }}>
      <Container maxWidth={false} className="section-container">
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontFamily: "var(--font-display)", color: "primary.main", textAlign: "center", mb: 0.5 }}
        >
          Kho tiện ích
        </Typography>
        <Typography sx={{ color: "var(--color-text-subtle)", textAlign: "center", mb: 4, fontSize: "0.95rem" }}>
          Bộ công cụ nhỏ gọn dành riêng cho bà con Phú Tân — chạm để mở
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)", md: "repeat(7, 1fr)" },
            gap: { xs: 2, md: 3 },
            maxWidth: 980,
            mx: "auto",
          }}
        >
          {TOOLS.map((tool) => {
            const comingSoon = !tool.url || tool.url === "#";
            return (
              <Box
                key={tool.id}
                component="button"
                type="button"
                onClick={() => openTool(tool.url, navigate)}
                aria-label={tool.label}
                disabled={comingSoon}
                sx={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  cursor: comingSoon ? "default" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  fontFamily: "var(--font-body)",
                  opacity: comingSoon ? 0.55 : 1,
                  "&:hover .tool-tile": comingSoon ? {} : {
                    transform: "translateY(-6px) scale(1.04)",
                    boxShadow: "var(--shadow-medium)",
                  },
                  "&:active .tool-tile": comingSoon ? {} : {
                    transform: "scale(0.94)",
                  },
                }}
              >
                <Box
                  className="tool-tile"
                  sx={{
                    position: "relative",
                    width: { xs: 72, md: 84 },
                    height: { xs: 72, md: 84 },
                    borderRadius: "26%",
                    background: tool.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: { xs: "2rem", md: "2.4rem" },
                    boxShadow: "var(--shadow-subtle)",
                    transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease",
                    // Ánh sáng mờ phía trên như icon iOS
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "inherit",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 48%)",
                      pointerEvents: "none",
                    },
                  }}
                >
                  <span role="img" aria-hidden="true">{tool.icon}</span>
                  {comingSoon && (
                    <Box sx={{
                      position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
                      bgcolor: "var(--color-text)", color: "var(--color-surface)",
                      fontSize: "0.55rem", fontWeight: 700, px: 0.9, py: 0.2,
                      borderRadius: 8, whiteSpace: "nowrap", letterSpacing: "0.02em",
                    }}>
                      Sắp ra mắt
                    </Box>
                  )}
                </Box>
                <Box sx={{ textAlign: "center", minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)",
                    lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {tool.label}
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "var(--color-text-subtle)", lineHeight: 1.3, display: { xs: "none", sm: "block" } }}>
                    {tool.tagline}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </section>
  );
};

export default ToolsSection;
