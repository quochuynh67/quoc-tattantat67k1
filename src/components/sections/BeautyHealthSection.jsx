// src/components/sections/BeautyHealthSection.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, CardContent, CardMedia, Chip, Container, Rating, Typography } from "@mui/material";
import { getSectionCount, getSectionItems, getSectionItemsSync } from "../../lib/phuTanApi";
import { CardSkeletonGrid } from "../CardSkeleton";

const BeautyHealthSection = () => {
  const [displayedServices, setDisplayedServices] = useState(() => getSectionItemsSync("beautyHealth", 4) ?? []);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(() => getSectionItemsSync("beautyHealth", 4) === null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getSectionItems("beautyHealth", 4), getSectionCount("beautyHealth")]).then(([items, count]) => {
      if (!isMounted) return;
      setDisplayedServices(items);
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
            Làm đẹp & Sức khỏe
          </Typography>
          {totalItems > 4 && (
            <Button component={RouterLink} to="/beauty-health" className="section-more-button">
              Xem thêm
            </Button>
          )}
        </Box>
        <Typography
          variant="body1"
          gutterBottom
          sx={{ fontFamily: "var(--font-body)", color: "var(--color-text-subtle)", mb: 4 }}
        >
          Gợi ý spa, hair salon và trị liệu thư giãn để chăm sóc vẻ ngoài lẫn sức khỏe tinh thần.
        </Typography>
        {loading ? <CardSkeletonGrid count={4} hasRating hasChip /> : <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            gap: 4,
            alignItems: "stretch",
          }}
        >
          {displayedServices.map((item) => (
            <Box key={item.id} sx={{ minWidth: 0 }}>
              <Card
                elevation={2}
                component={RouterLink}
                to={`/post-detail/${item.id}`}
                sx={{
                  height: "100%",
                  minHeight: 390,
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
                <CardMedia component="img" image={item.image} alt={item.name || item.title} sx={{ height: 200, objectFit: "cover" }} />
                <CardContent sx={{ flexGrow: 1, padding: "var(--spacing-sm)", display: "flex", flexDirection: "column", gap: 1 }}>
                  <Chip
                    label={item.category}
                    size="small"
                    sx={{ alignSelf: "flex-start", color: "var(--color-primary)", fontWeight: 800, backgroundColor: "var(--color-background)" }}
                  />
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontFamily: "var(--font-body)",
                      color: "var(--color-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      minHeight: "3.2rem",
                    }}
                  >
                    {item.name || item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "var(--font-body)",
                      color: "var(--color-text-subtle)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {item.description}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--color-text-subtle)" }}>
                    {item.address}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mt: "auto" }}>
                    <Rating value={item.rating || 0} precision={0.5} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1, color: "var(--color-primary)", fontWeight: 800 }}>
                      {item.rating || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>}
      </Container>
    </section>
  );
};

export default BeautyHealthSection;
