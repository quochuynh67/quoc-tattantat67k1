import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography } from "@mui/material";

const SEVERITY = {
  error:   { bg: "#fff5f5", border: "#fc8181", dot: "#e53e3e" },
  warning: { bg: "#fffbeb", border: "#f6ad55", dot: "#dd6b20" },
  info:    { bg: "#ebf8ff", border: "#63b3ed", dot: "#3182ce" },
  success: { bg: "#f0fff4", border: "#68d391", dot: "#38a169" },
};

export function HealthCard({ item, showDesc = false }) {
  const s = SEVERITY[item.severity] ?? SEVERITY.info;
  const desc = item.content || item.description;
  return (
    <Box
      component={RouterLink}
      to={`/post-detail/${item.id}`}
      sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        px: 2, py: 1.2,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: 2,
        cursor: "pointer",
        textDecoration: "none",
        transition: "filter 0.15s",
        "&:hover": { filter: "brightness(0.96)" },
      }}
    >
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{
          fontWeight: 700, fontSize: "0.9rem", color: "text.primary",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.title}
        </Typography>
        {showDesc && desc && (
          <Typography sx={{
            fontSize: "0.78rem", color: "text.secondary", mt: 0.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {desc}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
