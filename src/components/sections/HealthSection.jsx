// src/components/sections/HealthSection.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Typography, Alert, AlertTitle, Stack, Box, Button } from "@mui/material";
import { getSectionCount, getSectionItems, getSectionItemsSync } from "../../lib/phuTanApi";
import { AlertSkeleton } from "../CardSkeleton";
import AgentChat from "../AgentChat";

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
        {loading ? <AlertSkeleton count={4} /> : <Stack spacing={3}>
          {displayedHealth.map((item) => (
            <Alert key={item.id} component={RouterLink} to={`/post-detail/${item.id}`} severity={item.severity || "info"} sx={{ fontFamily: "var(--font-body)", borderRadius: 2, color: "var(--color-text)", cursor: "pointer", textDecoration: "none" }}>
              <AlertTitle sx={{ fontFamily: "var(--font-body)", fontWeight: 'bold' }}>
                {item.title}
              </AlertTitle>
              {item.content || item.description}
            </Alert>
          ))}
        </Stack>}
      </Container>
    </section>
  );
};

export default HealthSection;
