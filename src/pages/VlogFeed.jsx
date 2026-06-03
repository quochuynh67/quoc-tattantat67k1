// src/pages/VlogFeed.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlaceIcon from "@mui/icons-material/Place";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import MapIcon from "@mui/icons-material/Map";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getSectionItems, getVlogReviews } from "../lib/phuTanApi";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
};

const createPreviewIcon = (number, imageUrl, isActive, isVisited) => {
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
        <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
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

const Equalizer = ({ playing }) => (
  <div className={`vlog-equalizer${playing ? " playing" : ""}`}>
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
  </div>
);

/* ── Map auto-fit helper ─────────────────────────────────────────────── */
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

/* ── Highlight active marker ─────────────────────────────────────────── */
const ActiveMarkerHighlight = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    map.panTo([location.latitude, location.longitude], { animate: true, duration: 0.4 });
  }, [location, map]);
  return null;
};

/* ── Map resizer for bottom sheet ─────────────────────────────────────── */
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

/* ── Bottom-sheet snap heights ────────────────────────────────────────── */
const SHEET_COLLAPSED = 120;  // just the handle + timeline row
const SHEET_EXPANDED = 380;   // timeline row + map

const VlogFeed = () => {
  const videoRefs = useRef({});
  const slideRefs = useRef([]);
  const hasInteractedRef = useRef(false);

  const [activeSpotByVlog, setActiveSpotByVlog] = useState({});
  const [playingByVlog, setPlayingByVlog] = useState({});
  const [hasInteracted, setHasInteracted] = useState(false);
  const [vlogs, setVlogs] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [sheetHeight, setSheetHeight] = useState(SHEET_COLLAPSED);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, h: 0 });

  useEffect(() => {
    let isMounted = true;
    Promise.all([getVlogReviews(), getSectionItems("news")]).then(([vlogData, newsData]) => {
      if (!isMounted) return;
      setVlogs(vlogData);
      setNewsItems(newsData);
    });
    return () => { isMounted = false; };
  }, []);

  // Auto-play/pause via IntersectionObserver after first user interaction
  useEffect(() => {
    if (!hasInteracted || vlogs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.idx);
          const vlog = vlogs[idx];
          if (!vlog) return;
          const video = videoRefs.current[vlog.id];
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

    slideRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [hasInteracted, vlogs]);

  const handlePlay = (vlogId) => {
    setPlayingByVlog((s) => ({ ...s, [vlogId]: true }));
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
  };

  const handlePauseOrEnd = (vlogId) => {
    setPlayingByVlog((s) => ({ ...s, [vlogId]: false }));
  };

  const seekToSpot = (vlogId, location) => {
    const video = videoRefs.current[vlogId];
    if (video) {
      video.currentTime = location.time;
      video.play().catch(() => {});
    }
    setActiveSpotByVlog((current) => ({ ...current, [vlogId]: location.time }));
  };

  const handleTimeUpdate = (vlog) => {
    const video = videoRefs.current[vlog.id];
    const currentTime = video?.currentTime || 0;
    const activeLocation = [...vlog.locations]
      .reverse()
      .find((location) => currentTime >= location.time);
    if (activeLocation && activeSpotByVlog[vlog.id] !== activeLocation.time) {
      setActiveSpotByVlog((current) => ({ ...current, [vlog.id]: activeLocation.time }));
    }
  };

  /* ── Bottom-sheet drag logic ──────────────────────────────────────── */
  const handleDragStart = useCallback((clientY) => {
    setIsDragging(true);
    dragStartRef.current = { y: clientY, h: sheetHeight };
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY) => {
    if (!isDragging) return;
    const delta = dragStartRef.current.y - clientY;
    const next = Math.max(SHEET_COLLAPSED, Math.min(SHEET_EXPANDED, dragStartRef.current.h + delta));
    setSheetHeight(next);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    // Snap to nearest position
    const mid = (SHEET_COLLAPSED + SHEET_EXPANDED) / 2;
    setSheetHeight((h) => (h > mid ? SHEET_EXPANDED : SHEET_COLLAPSED));
  }, []);

  const toggleSheet = useCallback(() => {
    setSheetHeight((h) => (h >= SHEET_EXPANDED ? SHEET_COLLAPSED : SHEET_EXPANDED));
  }, []);

  const isExpanded = sheetHeight >= SHEET_EXPANDED;

  /* ── Derive current visible vlog (first in viewport or index 0) ──── */
  const [visibleVlogIdx, setVisibleVlogIdx] = useState(0);

  useEffect(() => {
    if (vlogs.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleVlogIdx(Number(entry.target.dataset.idx));
          }
        });
      },
      { threshold: 0.6 }
    );
    slideRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [vlogs]);

  const currentVlog = vlogs[visibleVlogIdx] || null;

  useEffect(() => {
    if (isExpanded && currentVlog) {
      const video = videoRefs.current[currentVlog.id];
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    }
  }, [isExpanded, currentVlog]);

  const currentLocations = currentVlog?.locations || [];
  const locationsWithCoords = currentLocations.filter((l) => l.latitude && l.longitude);
  const activeTime = currentVlog ? activeSpotByVlog[currentVlog.id] : undefined;
  const activeLocation = currentLocations.find((l) => l.time === activeTime);

  // Split route into traversed (up to activeTime) and upcoming
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
    <main className="vlog-scroll-root">
      <Box className="vlog-scroll-shell">
        <Box className="vlog-scroll-header">
          <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} className="vlog-scroll-back">
            Trang chủ
          </Button>
          <span className="vlog-scroll-badge">Phú Tân vlog</span>
        </Box>

        <Box className="vlog-scroll-feed" sx={{ pb: `${sheetHeight}px` }}>
          {vlogs.map((vlog, idx) => {
            const news = newsItems.find((item) => String(item.id) === String(vlog.newsId));
            const isPlaying = !!playingByVlog[vlog.id];

            return (
              <section
                className="vlog-scroll-slide"
                key={vlog.id}
                data-idx={idx}
                ref={(el) => { slideRefs.current[idx] = el; }}
              >
                <Box className="vlog-scroll-video-wrap">
                  <video
                    ref={(node) => { if (node) videoRefs.current[vlog.id] = node; }}
                    className="vlog-scroll-video"
                    src={vlog.videoUrl}
                    poster={vlog.poster}
                    playsInline
                    controls
                    preload="metadata"
                    onTimeUpdate={() => handleTimeUpdate(vlog)}
                    onPlay={() => handlePlay(vlog.id)}
                    onPause={() => handlePauseOrEnd(vlog.id)}
                    onEnded={() => handlePauseOrEnd(vlog.id)}
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

                {/* Right side actions */}
                <Box className="vlog-scroll-actions" aria-label="Vlog actions" sx={{ bottom: `${sheetHeight + 8}px` }}>
                  <Button
                    component={RouterLink}
                    to={`/post-detail/${vlog.newsId}`}
                    className="vlog-scroll-action"
                    aria-label="Xem chi tiết review"
                  >
                    <PlayCircleIcon />
                  </Button>
                  <span className="vlog-scroll-action-label">Review</span>
                  <span className={`vlog-scroll-action static${isPlaying ? " is-playing" : ""}`}>
                    <Equalizer playing={isPlaying} />
                  </span>
                </Box>

                {/* Simplified bottom info (no spots – they moved to bottom sheet) */}
                <Box className="vlog-scroll-bottom-panel" sx={{ bottom: `${sheetHeight + 8}px` }}>
                  <Box className="vlog-scroll-info">
                    <Typography className="vlog-scroll-host">@{vlog.host}</Typography>
                    <Typography component="h1" className="vlog-scroll-title">
                      {vlog.title}
                    </Typography>
                    <Typography className="vlog-scroll-desc">
                      {news?.excerpt || vlog.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </section>
            );
          })}
        </Box>

        {/* ── BOTTOM SHEET ────────────────────────────────────────── */}
        {currentVlog && (
          <Box
            className="vlog-bottom-sheet"
            sx={{
              height: `${sheetHeight}px`,
              transition: isDragging ? "none" : "height 0.3s cubic-bezier(.4,0,.2,1)",
            }}
          >
            {/* Drag handle */}
            <Box
              className="vlog-sheet-handle"
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
              onTouchEnd={handleDragEnd}
              onMouseDown={(e) => { handleDragStart(e.clientY); e.preventDefault(); }}
              onMouseMove={(e) => handleDragMove(e.clientY)}
              onMouseUp={handleDragEnd}
              onMouseLeave={() => { if (isDragging) handleDragEnd(); }}
              onClick={toggleSheet}
            >
              <div className="vlog-sheet-handle-bar" />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1 }}>
                <MapIcon sx={{ fontSize: 16, color: "#82f3cf" }} />
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, color: "#82f3cf", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Lộ trình
                </Typography>
                <KeyboardArrowDownIcon
                  sx={{
                    fontSize: 18,
                    color: "rgba(255,255,255,0.6)",
                    transition: "transform 0.3s",
                    transform: isExpanded ? "rotate(0deg)" : "rotate(180deg)",
                    ml: "auto",
                  }}
                />
              </Box>
            </Box>

            {/* Timeline spots row */}
            {currentLocations.length > 0 && (
              <Box className="vlog-sheet-timeline">
                <Box className="vlog-sheet-timeline-row">
                  {currentLocations.map((location) => (
                    <button
                      key={`${currentVlog.id}-${location.time}`}
                      type="button"
                      className={`vlog-scroll-spot ${activeTime === location.time ? "active" : ""}`}
                      onClick={() => seekToSpot(currentVlog.id, location)}
                    >
                      <img src={location.image} alt={location.name} />
                      <span>
                        <strong>{location.name}</strong>
                        <small>{formatTime(location.time)}</small>
                      </span>
                    </button>
                  ))}
                </Box>
              </Box>
            )}

            {/* Map */}
            {isExpanded && locationsWithCoords.length > 0 && (
              <Box className="vlog-sheet-map">
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

                  {/* Upcoming route – faint dashed */}
                  {upcomingCoords.length >= 2 && (
                    <Polyline
                      positions={upcomingCoords}
                      pathOptions={{
                        color: "#1976d2",
                        weight: 3,
                        opacity: 0.5,
                        dashArray: "6, 8",
                        lineCap: "round",
                      }}
                    />
                  )}

                  {/* Traversed route – solid bright */}
                  {traversedCoords.length >= 2 && (
                    <Polyline
                      positions={traversedCoords}
                      pathOptions={{
                        color: "#1976d2",
                        weight: 4,
                        opacity: 0.9,
                        lineCap: "round",
                        lineJoin: "round",
                      }}
                    />
                  )}

                  {/* Location markers */}
                  {locationsWithCoords.map((loc, i) => {
                    const isActive = activeTime === loc.time;
                    const isVisited = activeIdx >= 0 && i <= activeIdx;
                    return (
                      <Marker
                        key={`${loc.time}-${i}`}
                        position={[loc.latitude, loc.longitude]}
                        icon={createPreviewIcon(i + 1, loc.image, isActive, isVisited)}
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

                  {/* Pulsing current-position marker */}
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
            )}

            {isExpanded && locationsWithCoords.length === 0 && (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
                Chưa có tọa độ cho vlog này
              </Box>
            )}
          </Box>
        )}
      </Box>
    </main>
  );
};

export default VlogFeed;
