// src/components/sections/AgricultureSection.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Button, Card, CardMedia, CardContent, Typography, Box } from "@mui/material";
import { getSectionCount, getSectionItems, getSectionItemsSync } from "../../lib/phuTanApi";
import { CardSkeletonGrid } from "../CardSkeleton";

const AgricultureSection = () => {
  const [displayedAgri, setDisplayedAgri] = useState(() => getSectionItemsSync("agriculture", 4) ?? []);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(() => getSectionItemsSync("agriculture", 4) === null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getSectionItems("agriculture", 4), getSectionCount("agriculture")]).then(([items, count]) => {
      if (!isMounted) return;
      setDisplayedAgri(items);
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
        <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontFamily: "var(--font-display)", color: "primary.main" }}
          >
            Nông nghiệp & Phát triển nông thôn
          </Typography>
          {totalItems > 4 && (
            <Button component={RouterLink} to="/agriculture" className="section-more-button">
              Xem thêm
            </Button>
          )}
        </Box>
        <Typography
          variant="body1"
          gutterBottom
          sx={{ fontFamily: "var(--font-body)", color: "var(--color-text-subtle)", mb: 4 }}
        >
          Cập nhật tin tức, dự án và sáng kiến nông nghiệp của huyện Phú Tân.
        </Typography>
        {loading ? <CardSkeletonGrid count={4} /> : <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            gap: 4,
            alignItems: "stretch",
          }}
        >
          {displayedAgri.map((item) => (
            <Box key={item.id} sx={{ minWidth: 0 }}>
              <Card
                elevation={2}
                component={RouterLink}
                to={`/post-detail/${item.id}`}
                sx={{
                  height: "100%",
                  minHeight: 350,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  transition: "box-shadow 0.2s, transform 0.2s",
                  "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.15)", transform: "translateY(-2px)" },
                  backgroundColor: "var(--color-surface)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  textDecoration: "none"
                }}
              >
                <CardMedia component="img" image={item.image} alt={item.title} sx={{ height: 200, objectFit: "cover" }} />
                <CardContent sx={{ flexGrow: 1, padding: "var(--spacing-sm)", display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontFamily: "var(--font-body)",
                      color: "var(--color-text)",
                      marginBottom: "0.5rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      minHeight: "3.2rem"
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "var(--font-body)",
                      color: "var(--color-text-subtle)",
                      mb: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical"
                    }}
                  >
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>}
      </Container>
    </section>
  );
};

export default AgricultureSection;
