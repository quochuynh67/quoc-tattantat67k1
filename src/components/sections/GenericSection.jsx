import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Button, Card, CardActionArea, CardMedia, CardContent, Typography, Box } from "@mui/material";
import { getSectionCount, getSectionItems } from "../../lib/phuTanApi";
import { CardSkeletonGrid } from "../CardSkeleton";
import AgentChat from "../AgentChat";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";

export default function GenericSection({ slug, title }) {
  const { canChatWithAi } = useSiteSettings();
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([getSectionItems(slug, 4), getSectionCount(slug)]).then(([data, count]) => {
      setItems(data);
      setTotalItems(count);
      setLoading(false);
    });
  }, [slug]);

  return (
    <section className="content-section">
      <Container maxWidth={false} className="section-container">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ fontFamily: "var(--font-display)", color: "primary.main" }}
          >
            {title || slug}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {canChatWithAi && <AgentChat section={slug} variant="inline" />}
            {totalItems > 4 && (
              <Button component={RouterLink} to={`/${slug}`} className="section-more-button">
                Xem thêm
              </Button>
            )}
          </Box>
        </Box>

        {loading ? (
          <CardSkeletonGrid count={4} />
        ) : items.length === 0 ? (
          <Typography sx={{ color: "var(--color-text-subtle)", fontStyle: "italic", py: 4, textAlign: "center" }}>
            Chưa có bài viết nào trong mục này~
          </Typography>
        ) : (
          <Box
            className="card-scroll-row"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(4, 72vw)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
              gap: 4,
              alignItems: "stretch",
              overflowX: { xs: "auto", sm: "visible" },
              scrollSnapType: { xs: "x mandatory", sm: "none" },
              pb: { xs: 1, sm: 0 },
            }}
          >
            {items.map((item) => (
              <Box key={item.id} sx={{ minWidth: 0, scrollSnapAlign: { xs: "start", sm: "unset" } }}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    minHeight: 370,
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2,
                    transition: "box-shadow 0.2s, transform 0.2s",
                    "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.15)", transform: "translateY(-2px)" },
                    backgroundColor: "var(--color-surface)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardActionArea
                    component={RouterLink}
                    to={`/post-detail/${item.id}`}
                    sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
                  >
                    <CardMedia component="img" image={item.image} alt={item.title} sx={{ height: 200, objectFit: "cover" }} />
                    <CardContent sx={{ flexGrow: 1, padding: "var(--spacing-sm)", display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontFamily: "var(--font-body)",
                          color: "var(--color-text)",
                          mb: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          minHeight: "3.2rem",
                        }}
                      >
                        {item.title}
                      </Typography>
                      {item.excerpt && (
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
                          {item.excerpt}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </section>
  );
}
