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
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getSectionItems, getVlogReviewForPost } from "../lib/phuTanApi";
import { supabase } from "../lib/supabaseClient";
import { DetailSkeleton } from "../components/CardSkeleton";
import AgentChat from "../components/AgentChat";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const createPreviewIcon = (number, imageUrl, isActive, isVisited, altText = "") => {
  const bgColor = isActive ? "#1976d2" : isVisited ? "rgba(25,118,210,0.85)" : "rgba(25,118,210,0.2)";
  const borderColor = isActive ? "#fff" : isVisited ? "#1976d2" : "rgba(25,118,210,0.4)";
  const size = isActive ? 24 : isVisited ? 20 : 16;
  const fontSize = isActive ? 12 : isVisited ? 11 : 9;
  const color = "#fff";

  const imgSize = isActive ? 48 : 36;
  const width = Math.max(imgSize, size);
  const height = imgSize + 6 + size;

  return L.divIcon({
    html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: ${width}px; height: ${height}px;">
      <div style="
        width: ${imgSize}px; height: ${imgSize}px; border-radius: 8px; overflow: hidden; 
        border: 2px solid ${borderColor}; margin-bottom: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: #1a1c24;
      ">
        <img src="${imageUrl}" alt="${altText.replace(/"/g, "&quot;")}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
      </div>
      <div style="
        background-color: ${bgColor};
        border: ${isActive ? 3 : 2}px solid ${borderColor};
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        font-size: ${fontSize}px;
        font-weight: bold;
        line-height: 1;
        box-sizing: border-box;
        flex-shrink: 0;
      ">${number}</div>
    </div>`,
    className: "",
    iconSize: [width, height],
    iconAnchor: [width / 2, height - size / 2],
  });
};

const FitBounds = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    const pts = locations.filter((l) => l.latitude && l.longitude);
    if (pts.length === 0) return;
    const bounds = pts.map((l) => [l.latitude, l.longitude]);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [locations, map]);
  return null;
};

const ActiveMarkerHighlight = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    map.panTo([location.latitude, location.longitude], { animate: true, duration: 0.4 });
  }, [location, map]);
  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const VlogMap = ({ vlog, activeTime }) => {
  const locationsWithCoords = (vlog.locations || []).filter((l) => l.latitude && l.longitude);
  if (locationsWithCoords.length === 0) return null;
  
  const activeLocation = (vlog.locations || []).find((l) => l.time === activeTime);
  const activeIdx = activeLocation
    ? locationsWithCoords.findIndex((l) => l.time === activeTime)
    : -1;
  const traversedCoords = activeIdx >= 0
    ? locationsWithCoords.slice(0, activeIdx + 1).map((l) => [l.latitude, l.longitude])
    : [];
  const upcomingCoords = activeIdx >= 0
    ? locationsWithCoords.slice(activeIdx).map((l) => [l.latitude, l.longitude])
    : locationsWithCoords.map((l) => [l.latitude, l.longitude]);

  return (
    <Box sx={{ 
      mt: 2, height: 240, zIndex: 0, position: "relative",
      "& .leaflet-container": { background: "#1a1c24", border: "1px solid rgba(130, 243, 207, 0.12)", borderRadius: "12px" },
      "& .leaflet-popup-content-wrapper": { background: "rgba(20, 22, 30, 0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(130, 243, 207, 0.2)", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)", color: "#fff" },
      "& .leaflet-popup-tip": { background: "rgba(20, 22, 30, 0.92)", border: "1px solid rgba(130, 243, 207, 0.2)" },
      "& .leaflet-popup-close-button": { color: "rgba(255, 255, 255, 0.6)" },
      "& .leaflet-popup-close-button:hover": { color: "#82f3cf" }
    }}>
      <MapContainer
        center={[locationsWithCoords[0].latitude, locationsWithCoords[0].longitude]}
        zoom={14}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", borderRadius: "12px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapResizer />
        <FitBounds locations={locationsWithCoords} />
        {activeLocation?.latitude && <ActiveMarkerHighlight location={activeLocation} />}
        
        {upcomingCoords.length >= 2 && (
          <Polyline positions={upcomingCoords} pathOptions={{ color: "#1976d2", weight: 3, opacity: 0.5, dashArray: "6, 8", lineCap: "round" }} />
        )}
        {traversedCoords.length >= 2 && (
          <Polyline positions={traversedCoords} pathOptions={{ color: "#1976d2", weight: 4, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
        )}
        
        {locationsWithCoords.map((loc, i) => {
          const isActive = activeTime === loc.time;
          const isVisited = activeIdx >= 0 && i <= activeIdx;
          return (
            <Marker
              key={`${loc.time}-${i}`}
              position={[loc.latitude, loc.longitude]}
              icon={createPreviewIcon(i + 1, loc.image, isActive, isVisited, loc.name)}
              zIndexOffset={isActive ? 1000 : isVisited ? 500 : 0}
            >
              <Popup>
                <div style={{ textAlign: "center", minWidth: 140 }}>
                  <img src={loc.image} alt={loc.name} style={{ width: "100%", borderRadius: "6px", marginBottom: "8px", objectFit: "cover", aspectRatio: "16/9", display: "block" }} />
                  <strong style={{ display: "block", marginBottom: 4, color: "#fff", fontSize: "0.9rem" }}>{loc.name}</strong>
                  <span style={{ fontSize: "0.8rem", color: "#aaa" }}>{formatTime(loc.time)}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {activeLocation?.latitude && activeLocation?.longitude && (
          <CircleMarker
            center={[activeLocation.latitude, activeLocation.longitude]}
            radius={20}
            pathOptions={{
              color: "#1976d2",
              fillColor: "#1976d2",
              fillOpacity: 0.18,
              weight: 2,
              opacity: 0.5,
              className: "vlog-map-pulse",
            }}
          />
        )}
      </MapContainer>
    </Box>
  );
};

const VlogReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Tab mode: single video ref; scroll mode: ref map keyed by vlog id
  const tabVideoRef = useRef(null);
  const scrollVideoRefs = useRef({});
  const scrollSlideRefs = useRef([]);
  const hasInteractedRef = useRef(false);

  const [vlogs, setVlogs] = useState([]);
  const [activeVlogIdx, setActiveVlogIdx] = useState(0);
  const [activeSpotByVlog, setActiveSpotByVlog] = useState({});
  const [playingByVlog, setPlayingByVlog] = useState({});
  const [hasInteracted, setHasInteracted] = useState(false);
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

  // Auto-play/pause scroll slides after first user interaction
  useEffect(() => {
    if (!hasInteracted || vlogs.length === 0 || viewMode !== "scroll") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.idx);
          const vlog = vlogs[idx];
          if (!vlog) return;
          const video = scrollVideoRefs.current[vlog.id];
          if (!video) return;
          if (entry.isIntersecting && video.paused) {
            video.play().catch(() => {});
          } else if (!entry.isIntersecting && !video.paused) {
            video.pause();
          }
        });
      },
      { threshold: 0.75 }
    );

    scrollSlideRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [hasInteracted, vlogs, viewMode]);

  const handlePlayEvent = (vlogId, isScroll) => {
    setPlayingByVlog((s) => ({ ...s, [vlogId]: true }));
    if (isScroll && !hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
  };

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
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, mt: 2 }}>
            {isHealth ? (
              <Box sx={{ width: "66.666%" }}>
                <Alert severity={post.severity || "info"} sx={{ fontSize: "1rem", borderRadius: 2 }}>{post.title}</Alert>
              </Box>
            ) : post.image ? (
              <Box sx={{ width: "66.666%" }}>
                <img src={post.image} alt={post.title} style={{ width: "100%", height: "auto", objectFit: "contain", display: "block", borderRadius: 8 }} />
              </Box>
            ) : null}
            <Box sx={{ width: "100%", maxWidth: "800px" }}>
              <Typography variant="overline" className="vlog-kicker">{post.category || "Chi tiết"}</Typography>
              <Typography variant="h3" component="h1" className="vlog-title">{post.title}</Typography>
              {post.description ? (
                <Box className="vlog-subtitle quill-content" dangerouslySetInnerHTML={{ __html: post.description }} />
              ) : post.excerpt ? (
                <Typography className="vlog-subtitle">{post.excerpt}</Typography>
              ) : null}
              {post.content && post.content !== post.description && (
                <Box className="vlog-subtitle quill-content" sx={{ mt: 2 }} dangerouslySetInnerHTML={{ __html: post.content }} />
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
        <AgentChat section={post.section} />
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
            {vlogs.map((vlog, idx) => {
              const news = newsForVlog(vlog);
              const activeTime = activeSpotByVlog[vlog.id] ?? vlog.locations?.[0]?.time;
              const isPlaying = !!playingByVlog[vlog.id];

              return (
                <section
                  className="vlog-scroll-slide"
                  key={vlog.id}
                  data-idx={idx}
                  ref={(el) => { scrollSlideRefs.current[idx] = el; }}
                >
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
                      onPlay={() => handlePlayEvent(vlog.id, true)}
                      onPause={() => setPlayingByVlog((s) => ({ ...s, [vlog.id]: false }))}
                      onEnded={() => setPlayingByVlog((s) => ({ ...s, [vlog.id]: false }))}
                    />
                    {!hasInteracted && (
                      <div className={`vlog-play-hint${isPlaying ? " hidden" : ""}`}>
                        <div className="vlog-play-hint-btn">
                          <PlayCircleIcon sx={{ fontSize: 36 }} />
                        </div>
                        <span className="vlog-play-hint-label">Chạm để phát</span>
                      </div>
                    )}
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
                        <VlogMap vlog={vlog} activeTime={activeTime} />
                      </Box>
                    )}
                    <Box className="vlog-scroll-info">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography className="vlog-scroll-host">@{vlog.host}</Typography>
                        <div className={`vlog-equalizer${isPlaying ? " playing" : ""}`}>
                          <div className="vlog-equalizer-bar" />
                          <div className="vlog-equalizer-bar" />
                          <div className="vlog-equalizer-bar" />
                          <div className="vlog-equalizer-bar" />
                        </div>
                      </Box>
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
  const isHealth = post?.section === "health";

  return (
    <main className="vlog-review-page">
      <Container maxWidth={false} className="section-container">
        <PageHeader />

        {/* POST INFO SECTION */}
        {post && (
          <Box sx={{ mb: 4, pb: 3, borderBottom: "1px solid var(--color-border)" }}>
            {isHealth ? (
              <Alert severity={post.severity || "info"} sx={{ fontSize: "1rem", borderRadius: 2, mb: 2 }}>
                <Typography variant="h5">{post.title}</Typography>
              </Alert>
            ) : post.image ? (
              <img src={post.image} alt={post.title} style={{ width: "50%", height: "auto", borderRadius: 8, marginBottom: 16 }} />
            ) : null}
            <Typography variant="overline" sx={{ color: "var(--color-text-subtle)" }}>{post.category || "Chi tiết"}</Typography>
            <Typography variant="h4" sx={{ mt: 1, mb: 2, fontFamily: "var(--font-display)" }}>{post.title}</Typography>
            {post.description ? (
              <Box sx={{ mb: 2, color: "var(--color-text)" }} className="quill-content" dangerouslySetInnerHTML={{ __html: post.description }} />
            ) : post.excerpt ? (
              <Typography sx={{ mb: 2, color: "var(--color-text)" }}>{post.excerpt}</Typography>
            ) : null}
            {post.content && post.content !== post.description && (
              <Box sx={{ mb: 2, color: "var(--color-text)" }} className="quill-content" dangerouslySetInnerHTML={{ __html: post.content }} />
            )}
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {post.address && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "var(--color-text-subtle)" }}>
                  <LocationOnIcon fontSize="small" />
                  <Typography variant="body2">{post.address}</Typography>
                </Box>
              )}
              {post.rating !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating value={post.rating} precision={0.5} readOnly size="small" />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{post.rating}</Typography>
                </Box>
              )}
              {post.date && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "var(--color-text-subtle)" }}>
                  <CalendarTodayIcon fontSize="small" />
                  <Typography variant="caption">{new Date(post.date).toLocaleDateString("vi-VN")}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* VLOG SECTION */}
        {vlogs.length > 0 && (
          <>
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <div className={`vlog-equalizer${playingByVlog[activeVlog.id] ? " playing" : ""}`}>
                  <div className="vlog-equalizer-bar" />
                  <div className="vlog-equalizer-bar" />
                  <div className="vlog-equalizer-bar" />
                  <div className="vlog-equalizer-bar" />
                </div>
                <Typography className="vlog-duration">{activeVlog.durationLabel}</Typography>
              </Box>
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
                <VlogMap vlog={activeVlog} activeTime={activeTime} />
              </>
            )}
            </Box>
          </Box>
          </>
        )}
      </Container>
      <AgentChat section={post?.section} />
    </main>
  );
};

export default VlogReview;
