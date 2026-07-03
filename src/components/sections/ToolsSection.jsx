// src/components/sections/ToolsSection.jsx – kho tiện ích dạng 3D gallery trên trang chủ
// Vòng xoay 3D: tự xoay, kéo để xoay, bấm ô ở xa để đưa ra trước, bấm ô chính diện để mở.
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Box, Button } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import { TOOLS, openTool } from "../../lib/tools";
import { useCarousel3D, normalizeAngle } from "../../hooks/useCarousel3D";

const STEP = 360 / TOOLS.length;
// Ô nằm trong khoảng ±(STEP/2) quanh chính diện thì coi là "đang ở trước"
const FRONT_THRESHOLD = STEP / 2;

const ToolsSection = () => {
  const navigate = useNavigate();
  const { viewportRef, rotation, rotationRef, viewportHandlers, rotateItemToFront } = useCarousel3D({
    autoSpeed: 0.011,
  });

  // Ô đang ở chính diện — để hiện tên + mô tả bên dưới vòng xoay
  const frontIndex = TOOLS.reduce((best, _, i) => {
    const dist = (a) => Math.min(normalizeAngle(rotation + a * STEP), 360 - normalizeAngle(rotation + a * STEP));
    return dist(i) < dist(best) ? i : best;
  }, 0);
  const frontTool = TOOLS[frontIndex];
  const frontComingSoon = !frontTool.url || frontTool.url === "#";

  const handleTileClick = useCallback((index) => {
    const itemAngle = index * STEP;
    const offset = normalizeAngle(rotationRef.current + itemAngle);
    const distFromFront = Math.min(offset, 360 - offset);
    if (distFromFront <= FRONT_THRESHOLD) {
      openTool(TOOLS[index].url, navigate);
    } else {
      rotateItemToFront(itemAngle);
    }
  }, [navigate, rotateItemToFront, rotationRef]);

  return (
    <section className="content-section" style={{ padding: "var(--spacing-xl) 0", overflow: "hidden" }}>
      <Container maxWidth={false} className="section-container">
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontFamily: "var(--font-display)", color: "primary.main", textAlign: "center", mb: 0.5 }}
        >
          Kho tiện ích
        </Typography>
        <Typography sx={{ color: "var(--color-text-subtle)", textAlign: "center", mb: 0.5, fontSize: "0.95rem" }}>
          Bộ công cụ nhỏ gọn dành riêng cho bà con Phú Tân
        </Typography>
        <Typography sx={{ color: "var(--color-subtle)", textAlign: "center", mb: 2, fontSize: "0.78rem", fontStyle: "italic" }}>
          🖱️ Kéo để xoay · Bấm ô phía sau để đưa ra trước · Bấm ô chính diện để mở
        </Typography>

        <Box ref={viewportRef} className="tools-carousel-viewport" {...viewportHandlers}>
          <Box className="tools-carousel-floor" />
          <Box className="tools-carousel-stage">
            {TOOLS.map((tool, i) => {
              const itemAngle = i * STEP;
              const totalAngle = rotation + itemAngle;
              const depth = Math.cos((totalAngle * Math.PI) / 180); // 1 = gần nhất
              const scale = 0.58 + 0.42 * ((depth + 1) / 2);
              const opacity = 0.3 + 0.7 * ((depth + 1) / 2);
              const comingSoon = !tool.url || tool.url === "#";
              return (
                <Box
                  key={tool.id}
                  className="tools-carousel-item"
                  style={{
                    // Billboard: xoay tới vị trí trên vòng rồi xoay ngược để ô luôn hướng về người xem,
                    // kèm counter-tilt để ô đứng thẳng dù cả sân khấu đang nghiêng.
                    transform: `rotateY(${totalAngle}deg) translateZ(var(--tools-orbit-radius)) rotateY(${-totalAngle}deg) rotateX(calc(-1 * var(--tools-tilt))) scale(${scale})`,
                    opacity,
                    zIndex: Math.round((depth + 1) * 500),
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    className="tools-carousel-card"
                    aria-label={tool.label}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleTileClick(i)}
                    sx={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.75,
                      fontFamily: "var(--font-body)",
                      filter: comingSoon ? "grayscale(0.35)" : "none",
                    }}
                  >
                    <Box className="tools-carousel-tile" sx={{ background: tool.gradient }}>
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
                    <Typography sx={{
                      fontSize: "0.74rem", fontWeight: 600, color: "var(--color-text)",
                      lineHeight: 1.25, textAlign: "center", maxWidth: 110,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {tool.label}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Thông tin ô đang ở chính diện */}
        <Box sx={{ textAlign: "center", mt: 1.5, minHeight: 84 }}>
          <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--color-text)" }}>
            {frontTool.icon} {frontTool.label}
          </Typography>
          <Typography sx={{ color: "var(--color-text-subtle)", fontSize: "0.85rem", mb: 1 }}>
            {frontTool.tagline}
          </Typography>
          <Button
            variant="contained"
            size="small"
            disabled={frontComingSoon}
            startIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
            onClick={() => openTool(frontTool.url, navigate)}
            sx={{
              bgcolor: "var(--color-primary)",
              borderRadius: "var(--radius-md)",
              px: 2.5,
              "&:hover": { bgcolor: "var(--color-secondary)" },
            }}
          >
            {frontComingSoon ? "Sắp ra mắt" : "Mở ngay"}
          </Button>
        </Box>
      </Container>
    </section>
  );
};

export default ToolsSection;
