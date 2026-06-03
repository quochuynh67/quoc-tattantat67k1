// src/pages/VlogReview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Container, Rating, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlaceIcon from "@mui/icons-material/Place";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { getSectionItems, getVlogReviewForPost } from "../lib/phuTanApi";
import { supabase } from "../lib/supabaseClient";
import { DetailSkeleton } from "../components/CardSkeleton";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const VlogReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [vlogs, setVlogs] = useState([]);
  const [activeVlogIdx, setActiveVlogIdx] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [newsItems, setNewsItems] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) { console.error("fetchPost error:", error); return null; }
      if (!data) return null;
      return {
        uuid: data.id,
        title: data.title,
        excerpt: data.excerpt,
        description: data.description || data.excerpt,
        content: data.content,
        image: data.image_url,
        category: data.category,
        address: data.address,
        rating: data.rating ? Number(data.rating) : undefined,
        severity: data.severity,
        date: data.published_date,
        section: data.section_slug,
      };
    };

    Promise.all([fetchPost(), getSectionItems("news"), getVlogReviewForPost(id)]).then(
      ([postData, newsData, vlogsData]) => {
        if (!isMounted) return;
        setPost(postData);
        setNewsItems(newsData);
        setVlogs(vlogsData);
        setActiveVlogIdx(0);
        setLoading(false);
      }
    );

    return () => { isMounted = false; };
  }, [id]);

  const activeVlog = vlogs[activeVlogIdx] ?? null;

  const news = useMemo(
    () => newsItems.find((item) => String(item.id) === String(activeVlog?.newsId)),
    [newsItems, activeVlog]
  );

  const handleSelectVlog = (_, idx) => {
    setActiveVlogIdx(idx);
    setActiveTime(0);
  };

  const seekToLocation = (location) => {
    if (videoRef.current) {
      videoRef.current.currentTime = location.time;
      videoRef.current.play().catch(() => {});
    }
    setActiveTime(location.time);
  };

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current?.currentTime || 0;
    const active = [...(activeVlog?.locations || [])]
      .reverse()
      .find((loc) => currentTime >= loc.time);
    if (active) setActiveTime(active.time);
  };

  if (loading) return <DetailSkeleton />;

  if (!post && vlogs.length === 0) {
    return (
      <Container maxWidth={false} className="section-container vlog-review-empty">
        <Typography variant="h4" component="h1" sx={{ fontFamily: "var(--font-display)", color: "var(--color-text)", mb: 2 }}>
          Không tìm thấy nội dung
        </Typography>
        <Typography sx={{ color: "var(--color-text-subtle)", mb: 3 }}>
          Nội dung bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </Typography>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} variant="contained">
          Quay lại trang chủ
        </Button>
      </Container>
    );
  }

  // No vlog — rich content-only view
  if (vlogs.length === 0 && post) {
    const isHealth = post.section === "health";
    return (
      <main className="vlog-review-page">
        <Container maxWidth={false} className="section-container">
          <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} className="vlog-back-link">
            Quay lại
          </Button>
          <Box className="vlog-review-layout">
            <Box className="vlog-video-panel">
              {isHealth ? (
                <Alert severity={post.severity || "info"} sx={{ fontSize: "1rem", borderRadius: 2 }}>
                  {post.title}
                </Alert>
              ) : post.image ? (
                <img src={post.image} alt={post.title} style={{ width: "100%", borderRadius: "12px", objectFit: "cover", maxHeight: 420 }} />
              ) : null}
            </Box>
            <Box className="vlog-info-panel">
              <Typography variant="overline" className="vlog-kicker">{post.category || "Chi tiết"}</Typography>
              <Typography variant="h3" component="h1" className="vlog-title">{post.title}</Typography>
              {(post.description || post.excerpt) && (
                <Typography className="vlog-subtitle">{post.description || post.excerpt}</Typography>
              )}
              {post.content && post.content !== post.description && (
                <Typography className="vlog-subtitle" sx={{ mt: 2 }}>{post.content}</Typography>
              )}
              {post.address && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 2, color: "var(--color-text-subtle)" }}>
                  <LocationOnIcon fontSize="small" />
                  <Typography variant="body2">{post.address}</Typography>
                </Box>
              )}
              {post.rating !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                  <Rating value={post.rating} precision={0.5} readOnly size="small" />
                  <Typography variant="body2" sx={{ color: "var(--color-primary)", fontWeight: 700 }}>{post.rating}</Typography>
                </Box>
              )}
              {post.date && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 2, color: "var(--color-text-subtle)" }}>
                  <CalendarTodayIcon fontSize="small" />
                  <Typography variant="caption">{new Date(post.date).toLocaleDateString("vi-VN")}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </main>
    );
  }

  // Vlog view (1 or multiple)
  return (
    <main className="vlog-review-page">
      <Container maxWidth={false} className="section-container">
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} className="vlog-back-link">
          Quay lại
        </Button>

        {vlogs.length > 1 && (
          <Tabs
            value={activeVlogIdx}
            onChange={handleSelectVlog}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            {vlogs.map((v, idx) => (
              <Tab key={v.id} label={v.title || `Vlog ${idx + 1}`} />
            ))}
          </Tabs>
        )}

        <Box className="vlog-review-layout">
          <Box className="vlog-video-panel">
            <video
              key={activeVlog.id}
              ref={videoRef}
              className="vlog-review-video"
              controls
              playsInline
              poster={activeVlog.poster}
              src={activeVlog.videoUrl}
              onTimeUpdate={handleTimeUpdate}
            />
            <Box className="vlog-video-caption">
              <Typography className="vlog-host">{activeVlog.host}</Typography>
              <Typography className="vlog-duration">{activeVlog.durationLabel}</Typography>
            </Box>
          </Box>

          <Box className="vlog-info-panel">
            <Typography variant="overline" className="vlog-kicker">Review vlog</Typography>
            <Typography variant="h3" component="h1" className="vlog-title">{activeVlog.title}</Typography>
            <Typography className="vlog-subtitle">{activeVlog.subtitle}</Typography>

            {news && (
              <Box className="vlog-linked-article">
                <Typography className="vlog-linked-label">Bài viết liên kết</Typography>
                <Typography className="vlog-linked-title">{news.title}</Typography>
                <Typography className="vlog-linked-excerpt">{news.excerpt}</Typography>
              </Box>
            )}

            {activeVlog.locations && activeVlog.locations.length > 0 && (
              <>
                <Box className="vlog-location-header">
                  <PlaceIcon fontSize="small" />
                  <Typography component="h2">Vị trí theo từng giây</Typography>
                </Box>
                <Box className="vlog-location-list">
                  {activeVlog.locations.map((loc) => (
                    <button
                      type="button"
                      key={`${loc.time}-${loc.name}`}
                      className={`vlog-location-item ${activeTime === loc.time ? "active" : ""}`}
                      onClick={() => seekToLocation(loc)}
                    >
                      <img src={loc.image} alt={loc.name} className="vlog-location-thumb" />
                      <span className="vlog-location-content">
                        <span className="vlog-location-name">{loc.name}</span>
                        <span className="vlog-location-note">{loc.note}</span>
                        <span className="vlog-location-time">
                          <PlayCircleIcon fontSize="inherit" />
                          Nhảy tới {formatTime(loc.time)}
                        </span>
                      </span>
                    </button>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </main>
  );
};

export default VlogReview;
