// src/components/sections/AgricultureSection.jsx
import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Button, Card, CardMedia, CardContent, Typography, Box } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getSectionCount, getSectionItems, getSectionItemsSync } from "../../lib/phuTanApi";
import { CardSkeletonGrid } from "../CardSkeleton";
import AgentChat from "../AgentChat";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";
import { stripHtml } from "../../utils/stripHtml";

const AgricultureSection = ({ subtitle }) => {
  const { canChatWithAi } = useSiteSettings();
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
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mb={subtitle ? 1 : 4}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontFamily: "var(--font-display)", color: "primary.main" }}
          >
            Nông nghiệp & Phát triển nông thôn
          </Typography>
          {canChatWithAi && <AgentChat section="agriculture" variant="inline" />}
        </Box>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{ fontFamily: "var(--font-body)", color: "var(--color-text-subtle)", mb: 2 }}
          >
            {subtitle}
          </Typography>
        )}
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
          {displayedAgri.map((item) => (
            <Box key={item.id} sx={{ flex: "0 0 auto", width: { xs: "72vw", sm: "45vw", md: "280px" }, scrollSnapAlign: "start" }}>
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
                  {item.severity && (
                    <Box sx={{ mb: 1 }}>
                      {item.severity === "urgent" && <span className="severity-badge urgent">Khẩn cấp</span>}
                      {item.severity === "warning" && <span className="severity-badge warning">Quan trọng</span>}
                      {item.severity === "normal" && <span className="severity-badge normal">Bình thường</span>}
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
                    {stripHtml(item.description)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
          {totalItems > 4 && (
            <Box sx={{ flex: "0 0 auto", width: { xs: "140px", md: "160px" }, scrollSnapAlign: "start", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Button
                component={RouterLink}
                to="/agriculture"
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

export default AgricultureSection;
