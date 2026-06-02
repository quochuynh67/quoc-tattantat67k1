// src/components/sections/HealthSection.jsx
import React from "react";
import { Container, Typography, Alert, AlertTitle, Stack } from "@mui/material";
import { mockHealth } from "../../mocks/data";

const HealthSection = () => {
  return (
    <section className="content-section">
      <Container maxWidth={false} className="section-container">
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ fontFamily: "var(--font-display)", color: "primary.main" }}
        >
          Sức khỏe & Y tế
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
          sx={{ fontFamily: "var(--font-body)", color: "var(--color-text-subtle)", mb: 4 }}
        >
          Thông báo y tế, cảnh báo dịch bệnh và các nguồn lực chăm sóc sức khỏe cộng đồng.
        </Typography>
        <Stack spacing={3}>
          {mockHealth.map((item) => (
            <Alert key={item.id} severity={item.severity} sx={{ fontFamily: "var(--font-body)", borderRadius: 2, color: "var(--color-text)" }}>
              <AlertTitle sx={{ fontFamily: "var(--font-body)", fontWeight: 'bold' }}>
                {item.title}
              </AlertTitle>
              {item.content}
            </Alert>
          ))}
        </Stack>
      </Container>
    </section>
  );
};

export default HealthSection;
