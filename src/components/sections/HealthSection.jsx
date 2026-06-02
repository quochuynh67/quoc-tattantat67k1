// src/components/sections/HealthSection.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Typography, Alert, AlertTitle, Stack, Box, Button } from "@mui/material";
import { mockHealth } from "../../mocks/data";
import { getSectionCount, getSectionItems } from "../../lib/phuTanApi";

const HealthSection = () => {
  const [displayedHealth, setDisplayedHealth] = useState(mockHealth.slice(0, 4));
  const [totalItems, setTotalItems] = useState(mockHealth.length);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getSectionItems("health", 4), getSectionCount("health")]).then(([items, count]) => {
      if (!isMounted) return;
      setDisplayedHealth(items);
      setTotalItems(count);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="content-section">
      <Container maxWidth={false} className="section-container">
        <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontFamily: "var(--font-display)", color: "primary.main" }}
          >
            Sức khỏe & Y tế
          </Typography>
          {totalItems > 4 && (
            <Button component={RouterLink} to="/health" className="section-more-button">
              Xem thêm
            </Button>
          )}
        </Box>
        <Typography
          variant="body1"
          gutterBottom
          sx={{ fontFamily: "var(--font-body)", color: "var(--color-text-subtle)", mb: 4 }}
        >
          Thông báo y tế, cảnh báo dịch bệnh và các nguồn lực chăm sóc sức khỏe cộng đồng.
        </Typography>
        <Stack spacing={3}>
          {displayedHealth.map((item) => (
            <Alert key={item.id} component={RouterLink} to={`/post-detail/${item.id}`} severity={item.severity || "info"} sx={{ fontFamily: "var(--font-body)", borderRadius: 2, color: "var(--color-text)", cursor: "pointer", textDecoration: "none" }}>
              <AlertTitle sx={{ fontFamily: "var(--font-body)", fontWeight: 'bold' }}>
                {item.title}
              </AlertTitle>
              {item.content || item.description}
            </Alert>
          ))}
        </Stack>
      </Container>
    </section>
  );
};

export default HealthSection;
