import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Paper } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArticleIcon from "@mui/icons-material/Article";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import { Link as RouterLink } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";

function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  // 0965...789 — first 4 + ... + last 3
  return phone.slice(0, 4) + "..." + phone.slice(-3);
}

async function fetchPublicContributors() {
  const [{ data: posts }, { data: vlogs }] = await Promise.all([
    supabase.from("content_items").select("uploader_phone").not("uploader_phone", "is", null),
    supabase.from("vlog_reviews").select("uploader_phone").not("uploader_phone", "is", null),
  ]);

  const map = {};
  (posts || []).forEach(({ uploader_phone: p }) => {
    if (!map[p]) map[p] = { phone: p, posts: 0, vlogs: 0 };
    map[p].posts++;
  });
  (vlogs || []).forEach(({ uploader_phone: p }) => {
    if (!map[p]) map[p] = { phone: p, posts: 0, vlogs: 0 };
    map[p].vlogs++;
  });

  return Object.values(map)
    .map((c) => ({ ...c, total: c.posts + c.vlogs }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

const RANK_ICON_COLOR = ["#f59e0b", "#94a3b8", "#cd7c2f"];
const RANK_BG = ["rgba(245,158,11,0.08)", "rgba(148,163,184,0.1)", "rgba(205,124,47,0.08)"];
const RANK_BORDER = ["rgba(245,158,11,0.3)", "rgba(148,163,184,0.3)", "rgba(205,124,47,0.25)"];

export default function ContributorsSection() {
  const [contributors, setContributors] = useState(null);
  const { canChatWithAi } = useSiteSettings();

  useEffect(() => {
    fetchPublicContributors().then(setContributors).catch(() => setContributors([]));
  }, []);

  if (!contributors || contributors.length === 0) return null;

  return (
    <Box component="section" sx={{ py: { xs: 5, md: 7 }, bgcolor: "background.default" }}>
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <EmojiEventsIcon sx={{ fontSize: 40, color: "#f59e0b", mb: 1 }} />
          <Typography
            component="h2"
            variant="h4"
            sx={{ fontFamily: "var(--font-display)", fontWeight: 800, mb: 1.5 }}
          >
            Người cống hiến
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            Cảm ơn những thành viên đã đóng góp nội dung cho cộng đồng Phú Tân.{" "}
            <strong>Bạn cũng có thể góp mặt tại đây!</strong>
          </Typography>
        </Box>

        {/* Leaderboard */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {contributors.map((c, i) => {
            const isTop3 = i < 3;
            const iconColor = RANK_ICON_COLOR[i];
            const rowBg = isTop3 ? RANK_BG[i] : "background.paper";
            const rowBorder = isTop3 ? RANK_BORDER[i] : "divider";

            return (
              <Paper
                key={c.phone}
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 2.5,
                  py: 1.75,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: rowBorder,
                  bgcolor: rowBg,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  "&:hover": {
                    transform: "translateX(5px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                  },
                }}
              >
                {/* Rank indicator */}
                <Box sx={{ width: 36, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  {isTop3 ? (
                    <EmojiEventsIcon sx={{ fontSize: 26, color: iconColor }} />
                  ) : (
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: "text.disabled", fontSize: "1rem", lineHeight: 1 }}
                    >
                      {i + 1}
                    </Typography>
                  )}
                </Box>

                {/* Identity + breakdown */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.95rem",
                      color: isTop3 ? iconColor : "text.primary",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {maskPhone(c.phone)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mt: 0.4, flexWrap: "wrap" }}>
                    {c.posts > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ArticleIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {c.posts} bài viết
                        </Typography>
                      </Box>
                    )}
                    {c.vlogs > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <OndemandVideoIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {c.vlogs} vlog
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Total badge */}
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    bgcolor: isTop3 ? iconColor + "22" : "action.hover",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    sx={{
                      lineHeight: 1,
                      color: isTop3 ? iconColor : "text.primary",
                      fontSize: "1.25rem",
                    }}
                  >
                    {c.total}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontSize: "0.62rem", lineHeight: 1.2, mt: 0.25 }}
                  >
                    cống hiến
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>

        {/* CTA */}
        {canChatWithAi && (
          <Box sx={{ textAlign: "center", mt: 5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Bạn có câu chuyện, địa điểm hay trải nghiệm về Phú Tân muốn chia sẻ?
            </Typography>
            <Box
              component={RouterLink}
              to="/submit"
              sx={{
                display: "inline-block",
                px: 4,
                py: 1.25,
                borderRadius: 3,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                transition: "opacity 0.15s",
                "&:hover": { opacity: 0.85 },
              }}
            >
              Gửi bài ngay →
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
