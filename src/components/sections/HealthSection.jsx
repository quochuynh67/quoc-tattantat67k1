// src/components/sections/HealthSection.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Typography, Box, Button } from "@mui/material";
import { getSectionCount, getSectionItems, getSectionItemsSync } from "../../lib/phuTanApi";
import { AlertSkeleton } from "../CardSkeleton";
import AgentChat from "../AgentChat";

const SEVERITY = {
  error:   { bg: "#fff5f5", border: "#fc8181", dot: "#e53e3e" },
  warning: { bg: "#fffbeb", border: "#f6ad55", dot: "#dd6b20" },
  info:    { bg: "#ebf8ff", border: "#63b3ed", dot: "#3182ce" },
  success: { bg: "#f0fff4", border: "#68d391", dot: "#38a169" },
};

const HealthCard = ({ item, showDesc = false }) => {
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
};

const HealthSection = () => {
  const [displayedHealth, setDisplayedHealth] = useState(() => getSectionItemsSync("health", 4) ?? []);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(() => getSectionItemsSync("health", 4) === null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getSectionItems("health", 4), getSectionCount("health")]).then(([items, count]) => {
      if (!isMounted) return;
      setDisplayedHealth(items);
      setTotalItems(count);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="content-section">
      <Container maxWidth={false} className="section-container">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontFamily: "var(--font-display)", color: "primary.main" }}
          >
            Sức khỏe & Y tế
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AgentChat section="health" variant="inline" />
            {totalItems > 4 && (
              <Button component={RouterLink} to="/health" className="section-more-button">
                Xem thêm
              </Button>
            )}
          </Box>
        </Box>
        <Typography
          variant="body1"
          gutterBottom
          sx={{ fontFamily: "var(--font-body)", color: "var(--color-text-subtle)", mb: 4 }}
        >
          Thông báo y tế, cảnh báo dịch bệnh và các nguồn lực chăm sóc sức khỏe cộng đồng.
        </Typography>
        {loading ? <AlertSkeleton count={4} /> : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {displayedHealth.map((item) => (
              <HealthCard key={item.id} item={item} />
            ))}
          </Box>
        )}
      </Container>
    </section>
  );
};

export default HealthSection;
