// src/components/sections/PlacesSection.jsx – featured places with consistent MUI styling
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Button, Card, CardMedia, CardContent, Typography, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getSectionCount, getSectionItems, getSectionItemsSync } from "../../lib/phuTanApi";
import { CardSkeletonGrid } from "../CardSkeleton";
import AgentChat from "../AgentChat";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";

const PlacesSection = () => {
  const { canChatWithAi } = useSiteSettings();
  const [displayedPlaces, setDisplayedPlaces] = useState(() => getSectionItemsSync("places", 4) ?? []);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(() => getSectionItemsSync("places", 4) === null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getSectionItems("places", 4), getSectionCount("places")]).then(([items, count]) => {
      if (!isMounted) return;
      setDisplayedPlaces(items);
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
            Địa điểm nổi bật
          </Typography>
          {canChatWithAi && <AgentChat section="places" variant="inline" />}
        </Box>
        <Typography
          variant="body1"
          gutterBottom
          sx={{ fontFamily: "var(--font-body)", color: "var(--color-text-subtle)", mb: 4 }}
        >
          Khám phá những địa danh đặc sắc của Phú Tân 67K1 AG, từ thiên nhiên hoang sơ tới di tích lịch sử.
        </Typography>
        {loading ? <CardSkeletonGrid count={4} /> : <Box
          className="card-scroll-row"
          sx={{
            display: "flex",
            gap: 4,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            pb: 1,
          }}
        >
          {displayedPlaces.map((place) => (
            <Box key={place.id} sx={{ flex: "0 0 auto", width: { xs: "72vw", sm: "45vw", md: "280px" }, scrollSnapAlign: "start" }}>
              <Card
                elevation={2}
                component={RouterLink}
                to={`/post-detail/${place.id}`}
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
                <CardMedia component="img" image={place.image} alt={place.name || place.title} sx={{ height: 200, objectFit: "cover" }} />
                <CardContent sx={{ flexGrow: 1, padding: "var(--spacing-sm)", display: "flex", flexDirection: "column" }}>
                  {place.severity && (
                    <Box sx={{ mb: 1 }}>
                      {place.severity === "urgent" && <span className="severity-badge urgent">Khẩn cấp</span>}
                      {place.severity === "warning" && <span className="severity-badge warning">Quan trọng</span>}
                      {place.severity === "normal" && <span className="severity-badge normal">Bình thường</span>}
                    </Box>
                  )}
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
                    {place.name || place.title}
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
                    {place.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
          {totalItems > 4 && (
            <Box sx={{ flex: "0 0 auto", width: { xs: "140px", md: "160px" }, scrollSnapAlign: "start", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Button
                component={RouterLink}
                to="/places"
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                className="section-more-button"
                sx={{ whiteSpace: "nowrap" }}
              >
                Xem thêm
              </Button>
            </Box>
          )}
        </Box>}
      </Container>
    </section>
  );
};

export default PlacesSection;
