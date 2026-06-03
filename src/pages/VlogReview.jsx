// src/pages/VlogReview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Container, Rating, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewDayIcon from "@mui/icons-material/ViewDay";
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

  // Tab mode: single video ref; scroll mode: ref map keyed by vlog id
  const tabVideoRef = useRef(null);
  const scrollVideoRefs = useRef({});

  const [vlogs, setVlogs] = useState([]);
  const [activeVlogIdx, setActiveVlogIdx] = useState(0);
  const [activeSpotByVlog, setActiveSpotByVlog] = useState({});
  const [playingByVlog, setPlayingByVlog] = useState({});
  const [newsItems, setNewsItems] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("tab"); // "tab" | "scroll"

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

  const newsForVlog = useMemo(
    () => (vlog) => newsItems.find((item) => String(item.id) === String(vlog?.newsId)),
    [newsItems]
  );

  // Tab mode handlers
  const handleSelectTab = (_, idx) => {
    setActiveVlogIdx(idx);
    setActiveSpotByVlog((s) => ({ ...s, [vlogs[idx]?.id]: undefined }));
  };

  const seekToLocation = (vlogId, location, isScroll) => {
    const video = isScroll
      ? scrollVideoRefs.current[vlogId]
      : tabVideoRef.current;
    if (video) {
      video.currentTime = location.time;
      video.play().catch(() => {});
    }
    setActiveSpotByVlog((s) => ({ ...s, [vlogId]: location.time }));
  };

  const handleTimeUpdate = (vlog, isScroll) => {
    const video = isScroll
      ? scrollVideoRefs.current[vlog.id]
      : tabVideoRef.current;
    const currentTime = video?.currentTime || 0;
    const active = [...(vlog.locations || [])].reverse().find((loc) => currentTime >= loc.time);
    if (active) setActiveSpotByVlog((s) => ({ ...s, [vlog.id]: active.time }));
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

  // No vlogs — content-only detail
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
                <Alert severity={post.severity || "info"} sx={{ fontSize: "1rem", borderRadius: 2 }}>{post.title}</Alert>
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

  // ── Shared header (back + toggle) ─────────────────────────────────────────
  const PageHeader = () => (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} className="vlog-back-link" sx={{ mb: "0 !important" }}>
        Quay lại
      </Button>
      <Tooltip title={viewMode === "tab" ? "Chuyển sang dạng cuộn" : "Chuyển sang dạng tab"}>
        <Button
          variant="outlined"
          size="small"
          startIcon={viewMode === "tab" ? <ViewDayIcon /> : <GridViewIcon />}
          onClick={() => setViewMode((v) => (v === "tab" ? "scroll" : "tab"))}
        >
          {viewMode === "tab" ? "Dạng cuộn" : "Dạng tab"}
        </Button>
      </Tooltip>
    </Box>
  );

  // ── SCROLL MODE ────────────────────────────────────────────────────────────
  if (viewMode === "scroll") {
    return (
      <main className="vlog-scroll-root" style={{ position: "fixed", inset: 0, zIndex: 1300 }}>
        <Box className="vlog-scroll-shell">
          <Box className="vlog-scroll-header" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} className="vlog-scroll-back">
              Quay lại
            </Button>
            <Tooltip title="Chuyển sang dạng tab">
              <Button variant="outlined" size="small" startIcon={<GridViewIcon />} onClick={() => setViewMode("tab")}
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)", "&:hover": { borderColor: "#fff", background: "rgba(255,255,255,0.1)" } }}>
                Dạng tab
              </Button>
            </Tooltip>
          </Box>

          <Box className="vlog-scroll-feed">
            {vlogs.map((vlog) => {
              const news = newsForVlog(vlog);
              const activeTime = activeSpotByVlog[vlog.id] ?? vlog.locations?.[0]?.time;

              return (
                <section className="vlog-scroll-slide" key={vlog.id}>
                  <Box className="vlog-scroll-video-wrap">
                    <video
                      ref={(node) => { if (node) scrollVideoRefs.current[vlog.id] = node; }}
                      className="vlog-scroll-video"
                      src={vlog.videoUrl}
                      poster={vlog.poster}
                      playsInline
                      controls
                      preload="metadata"
                      onTimeUpdate={() => handleTimeUpdate(vlog, true)}
                      onPlay={() => setPlayingByVlog((s) => ({ ...s, [vlog.id]: true }))}
                      onPause={() => setPlayingByVlog((s) => ({ ...s, [vlog.id]: false }))}
                      onEnded={() => setPlayingByVlog((s) => ({ ...s, [vlog.id]: false }))}
                    />
                    <div className={`vlog-play-hint${playingByVlog[vlog.id] ? " hidden" : ""}`}>
                      <div className="vlog-play-hint-btn">
                        <PlayCircleIcon sx={{ fontSize: 36 }} />
                      </div>
                      <span className="vlog-play-hint-label">Chạm để phát</span>
                    </div>
                  </Box>

                  <Box className="vlog-scroll-bottom-panel" sx={{ right: "14px" }}>
                    {vlog.locations?.length > 0 && (
                      <Box className="vlog-scroll-spots">
                        <Box className="vlog-scroll-spots-title">
                          <PlaceIcon fontSize="small" />
                          <span>Vị trí theo giây</span>
                        </Box>
                        <Box className="vlog-scroll-spot-list">
                          {vlog.locations.map((loc) => (
                            <button
                              key={`${vlog.id}-${loc.time}`}
                              type="button"
                              className={`vlog-scroll-spot ${activeTime === loc.time ? "active" : ""}`}
                              onClick={() => seekToLocation(vlog.id, loc, true)}
                            >
                              <img src={loc.image} alt={loc.name} />
                              <span>
                                <strong>{loc.name}</strong>
                                <small>{formatTime(loc.time)}</small>
                              </span>
                            </button>
                          ))}
                        </Box>
                      </Box>
                    )}
                    <Box className="vlog-scroll-info">
                      <Typography className="vlog-scroll-host">@{vlog.host}</Typography>
                      <Typography component="h2" className="vlog-scroll-title">{vlog.title}</Typography>
                      <Typography className="vlog-scroll-desc">{news?.excerpt || vlog.subtitle}</Typography>
                    </Box>
                  </Box>
                </section>
              );
            })}
          </Box>
        </Box>
      </main>
    );
  }

  // ── TAB MODE ───────────────────────────────────────────────────────────────
  const activeTime = activeSpotByVlog[activeVlog?.id];

  return (
    <main className="vlog-review-page">
      <Container maxWidth={false} className="section-container">
        <PageHeader />

        {vlogs.length > 1 && (
          <Tabs
            value={activeVlogIdx}
            onChange={handleSelectTab}
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
              ref={tabVideoRef}
              className="vlog-review-video"
              controls
              playsInline
              poster={activeVlog.poster}
              src={activeVlog.videoUrl}
              onTimeUpdate={() => handleTimeUpdate(activeVlog, false)}
              onPlay={() => setPlayingByVlog((s) => ({ ...s, [activeVlog.id]: true }))}
              onPause={() => setPlayingByVlog((s) => ({ ...s, [activeVlog.id]: false }))}
              onEnded={() => setPlayingByVlog((s) => ({ ...s, [activeVlog.id]: false }))}
            />
            <div className={`vlog-play-hint${playingByVlog[activeVlog.id] ? " hidden" : ""}`}>
              <div className="vlog-play-hint-btn">
                <PlayCircleIcon sx={{ fontSize: 36 }} />
              </div>
              <span className="vlog-play-hint-label">Chạm để phát</span>
            </div>
            <Box className="vlog-video-caption">
              <Typography className="vlog-host">{activeVlog.host}</Typography>
              <Typography className="vlog-duration">{activeVlog.durationLabel}</Typography>
            </Box>
          </Box>

          <Box className="vlog-info-panel">
            <Typography variant="overline" className="vlog-kicker">Review vlog</Typography>
            <Typography variant="h3" component="h1" className="vlog-title">{activeVlog.title}</Typography>
            <Typography className="vlog-subtitle">{activeVlog.subtitle}</Typography>

            {newsForVlog(activeVlog) && (
              <Box className="vlog-linked-article">
                <Typography className="vlog-linked-label">Bài viết liên kết</Typography>
                <Typography className="vlog-linked-title">{newsForVlog(activeVlog).title}</Typography>
                <Typography className="vlog-linked-excerpt">{newsForVlog(activeVlog).excerpt}</Typography>
              </Box>
            )}

            {activeVlog.locations?.length > 0 && (
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
                      onClick={() => seekToLocation(activeVlog.id, loc, false)}
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
