// src/pages/VlogFeed.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Button, Switch, Typography, Snackbar, Alert, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ArticleIcon from "@mui/icons-material/Article";
import ShareIcon from "@mui/icons-material/Share";
import LinkIcon from "@mui/icons-material/Link";
import MapIcon from "@mui/icons-material/Map";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useVlogCache } from "../contexts/VlogCacheContext";
import { useGlobalToast } from "../contexts/ToastContext";
import { getVlogCategories } from "../lib/supabaseClient";
import { getVlogById } from "../lib/phuTanApi";
import { getCurrentLocation, isInsideIframe, openCurrentPageInNewTab } from "../utils/geolocation";
import { getUrlParams, getZaloVlogShareUrl } from "../utils/urlParams";

const SHEET_COLLAPSED = 120;
const SHEET_EXPANDED = 380;
const VIDEO_PRELOAD_BEHIND = 1;
const VIDEO_PRELOAD_AHEAD = 2;

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
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
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;width:${width}px;height:${height}px;">
      <div style="width:${imgSize}px;height:${imgSize}px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};margin-bottom:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4);background:#1a1c24;">
        <img src="${imageUrl}" alt="${altText.replace(/"/g, "&quot;")}" style="width:100%;height:100%;object-fit:cover;display:block;" />
      </div>
      <div style="background-color:${bgColor};border:${isActive ? 3 : 2}px solid ${borderColor};border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;color:${color};font-size:${fontSize}px;font-weight:bold;line-height:1;box-sizing:border-box;flex-shrink:0;">${number}</div>
    </div>`,
    className: "",
    iconSize: [width, height],
    iconAnchor: [width / 2, height - size / 2],
  });
};

const CAT_SHAPES = {
  "chill":       { icon: "🌿", shadow: "rgba(16,185,129,0.45)" },
  "real-estate": { icon: "🏠", shadow: "rgba(59,130,246,0.45)" },
  "helps":       { icon: "🤝", shadow: "rgba(245,158,11,0.45)" },
  "news":        { icon: "📰", shadow: "rgba(239,68,68,0.45)"  },
};

const createThumbIcon = (imageUrl, altText = "", catColor = "#82f3cf", catSlug = "") => {
  const shape = CAT_SHAPES[catSlug] || { icon: "", shadow: "rgba(130,243,207,0.4)" };
  return L.divIcon({
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <div style="
          width:44px;height:44px;border-radius:10px;overflow:hidden;
          border:3px solid ${catColor};
          box-shadow:0 4px 14px ${shape.shadow};
          background:#1a1c24;
        ">
          <img src="${imageUrl}" alt="${altText.replace(/"/g, "&quot;")}"
            style="width:100%;height:100%;object-fit:cover;display:block;" />
        </div>
        ${shape.icon
          ? `<div style="position:absolute;bottom:-5px;right:-5px;width:18px;height:18px;border-radius:50%;background:${catColor};border:2px solid #0d0f18;display:flex;align-items:center;justify-content:center;font-size:10px;line-height:1;">${shape.icon}</div>`
          : `<div style="position:absolute;bottom:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:${catColor};border:2px solid #0d0f18;"></div>`
        }
      </div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 49],
  });
};

const FitAllVlogsInView = ({ vlogs }) => {
  const map = useMap();
  useEffect(() => {
    const coords = vlogs.flatMap((v) =>
      (v.locations || []).filter((l) => l.latitude && l.longitude).map((l) => [l.latitude, l.longitude])
    );
    if (coords.length === 0) {
      map.setView([10.6385, 105.2343], 13, { animate: false });
      return;
    }
    map.fitBounds(coords, { padding: [48, 48], maxZoom: 14, animate: false });
  }, [vlogs, map]);
  return null;
};

const userLocationIcon = L.divIcon({
  html: `<div style="position:relative;width:20px;height:20px;">
    <div style="position:absolute;inset:0;background:rgba(130,243,207,0.35);border-radius:50%;animation:vlog-pulse-ring 2s infinite ease-out;"></div>
    <div style="position:absolute;inset:3px;background:#82f3cf;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.55);"></div>
  </div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const OverviewUserTracker = ({ userLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (!userLocation) return;
    map.flyTo(userLocation, 15, { duration: 1.2 });
  }, [userLocation, map]);
  return null;
};

const OverviewLocationBtn = ({ userLocation, onRequest }) => {
  const map = useMap();
  return (
    <div
      style={{ position: "absolute", bottom: 20, left: 16, zIndex: 1000 }}
    >
      <button
        type="button"
        className="vlog-location-btn"
        aria-label={userLocation ? "Về vị trí của tôi" : "Xác định vị trí"}
        onClick={() => {
          if (userLocation) {
            map.flyTo(userLocation, 15, { duration: 1.2 });
          } else {
            onRequest();
          }
        }}
      >
        <MyLocationIcon sx={{ fontSize: 20, color: userLocation ? "#82f3cf" : "#fff" }} />
      </button>
    </div>
  );
};

const Equalizer = ({ playing }) => (
  <div className={`vlog-equalizer${playing ? " playing" : ""}`}>
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
  </div>
);

const FitBounds = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    const pts = locations.filter((l) => l.latitude && l.longitude);
    if (pts.length === 0) return;
    map.fitBounds(pts.map((l) => [l.latitude, l.longitude]), { padding: [32, 32], maxZoom: 15 });
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
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

/* ── Tap-only video overlay ───────────────────────────────────────────── */
const TapVideoOverlay = ({ vlogId, videoRefs, isPlaying, onToggle }) => {
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef(null);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const handleTap = () => {
    const video = videoRefs.current[vlogId];
    if (!video) return;
    const nextAction = video.paused ? "play" : "pause";
    onToggle(vlogId, nextAction);
    setFlash(nextAction);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 620);
  };

  return (
    <button
      type="button"
      className="vlog-tap-overlay"
      onClick={handleTap}
      aria-label={isPlaying ? "Chạm để tạm dừng" : "Chạm để phát"}
    >
      <span className={`vlog-center-flash ${flash ? "is-visible" : ""}`}>
        {flash === "pause" ? <PauseIcon sx={{ fontSize: 58 }} /> : <PlayArrowIcon sx={{ fontSize: 58 }} />}
      </span>
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────────────── */

const VlogFeed = () => {
  const toast = useGlobalToast();
  const hasInitializedFromUrl = useRef(false);
  const {
    vlogs,
    newsItems,
    loading,
    ensureLoaded,
    prependVlog,
    activeSpotByVlog,
    setActiveSpotByVlog,
    visibleVlogIdx,
    setVisibleVlogIdx,
    sheetHeight: cachedSheetHeight,
    setSheetHeight: setCachedSheetHeight,
    hasInteracted,
    setHasInteracted,
    scrollTopRef,
  } = useVlogCache();

  // Local — never persisted in context to avoid stale playing state across renders
  const [playingByVlog, setPlayingByVlog] = useState({});

  const sheetHeight = cachedSheetHeight ?? SHEET_COLLAPSED;
  const setSheetHeight = setCachedSheetHeight;

  const videoRefs = useRef({});
  const slideRefs = useRef([]);
  const hasInteractedRef = useRef(hasInteracted);
  const feedRef = useRef(null);
  const manuallyPausedRef = useRef({});
  // Resets every mount — gates ALL programmatic play() calls.
  // Prevents autoplay triggered by cached context state on re-enter.
  const sessionInteractedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ y: 0, h: 0 });
  const mapPlayerVideoRef = useRef(null);
  const location = useLocation();
  const isActive = location.pathname === "/vlogs";
  const [autoNext, setAutoNext] = useState(true);
  const [mapView, setMapView] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapPlayerVlog, setMapPlayerVlog] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState({ open: false, message: "", code: null });
  const [categories, setCategories] = useState([]);
  const [mapCategorySlug, setMapCategorySlug] = useState("");

  const handleRequestLocation = useCallback(() => {
    setLocationLoading(true);
    getCurrentLocation()
      .then((loc) => {
        setUserLocation([loc.latitude, loc.longitude]);
        setLocationError({ open: false, message: "", code: null });
      })
      .catch((err) => {
        setLocationError({ open: true, message: err.message, code: err.code });
      })
      .finally(() => setLocationLoading(false));
  }, []);

  const newsById = useMemo(() => {
    const map = new Map();
    newsItems?.forEach((item) => map.set(String(item.id), item));
    return map;
  }, [newsItems]);

  const displayedVlogs = vlogs || [];

  const filteredMapVlogs = useMemo(() => {
    if (!vlogs) return [];
    if (!mapCategorySlug) return vlogs;
    return vlogs.filter((v) => v.categorySlug === mapCategorySlug);
  }, [vlogs, mapCategorySlug]);

  // Count vlogs per category for badge display
  const categoryCounts = useMemo(() => {
    const counts = {};
    (vlogs || []).forEach((v) => { if (v.categorySlug) counts[v.categorySlug] = (counts[v.categorySlug] || 0) + 1; });
    return counts;
  }, [vlogs]);

  const hydratedVideoStart = Math.max(0, visibleVlogIdx - VIDEO_PRELOAD_BEHIND);
  const hydratedVideoEnd = Math.min((displayedVlogs?.length ?? 0) - 1, visibleVlogIdx + VIDEO_PRELOAD_AHEAD);


  useEffect(() => { ensureLoaded(); }, []);

  useEffect(() => {
    getVlogCategories().then((data) => setCategories(data || [])).catch(() => {});
  }, []);

  // Initialize URL params (location, map mode, shared vlog)
  useEffect(() => {
    const { lat, long, map, v } = getUrlParams();
    if (lat && long) setUserLocation([lat, long]);
    if (map) setMapView(true);

    // If a specific vlog ID is in the URL:
    // - ensureLoaded (in VlogCacheContext) already moves it to index 0 after the full list loads.
    // - We just need to make sure visibleVlogIdx is reset to 0 and scrollTop is 0.
    if (v) {
      setVisibleVlogIdx(0);
      scrollTopRef.current = 0;
      if (feedRef.current) feedRef.current.scrollTop = 0;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [shareMenuAnchor, setShareMenuAnchor] = useState(null);
  const [shareMenuTarget, setShareMenuTarget] = useState(null);

  const openShareMenu = useCallback((e, vlogId, lat, long) => {
    e.stopPropagation?.();
    setShareMenuAnchor(e.currentTarget);
    setShareMenuTarget({ vlogId, lat, long });
  }, []);

  const closeShareMenu = useCallback(() => {
    setShareMenuAnchor(null);
    setShareMenuTarget(null);
  }, []);

  const handleCopyShareLink = useCallback(() => {
    if (!shareMenuTarget) return;
    const { vlogId, lat, long } = shareMenuTarget;
    const shareUrl = lat && long
      ? `${window.location.origin}/vlogs?v=${vlogId}&map=1&lat=${lat}&long=${long}`
      : `${window.location.origin}/vlogs?v=${vlogId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.show(lat && long ? "Đã copy link vị trí Vlog" : "Đã copy link Vlog", "success"))
      .catch(() => toast.show("Không thể copy link", "error"));
    closeShareMenu();
  }, [shareMenuTarget, toast, closeShareMenu]);

  const handleCopyShareLinkZalo = useCallback(() => {
    if (!shareMenuTarget) return;
    const shareUrl = getZaloVlogShareUrl(shareMenuTarget.vlogId);
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.show("Đã copy link chia sẻ Zalo Mini App", "success"))
      .catch(() => toast.show("Không thể copy link", "error"));
    closeShareMenu();
  }, [shareMenuTarget, toast, closeShareMenu]);

  // Pause all videos when navigating away
  useEffect(() => {
    if (!isActive) {
      Object.values(videoRefs.current).forEach((v) => { if (v && !v.paused) v.pause(); });
      mapPlayerVideoRef.current?.pause();
    }
  }, [isActive]);


  // Restore scroll position (skip if opened via a shared ?v= URL — priority vlog is at index 0)
  useEffect(() => {
    const { v } = getUrlParams();
    if (!v && feedRef.current && scrollTopRef.current > 0) {
      feedRef.current.scrollTop = scrollTopRef.current;
    }
  }, [vlogs]);

  const handleFeedScroll = useCallback((e) => {
    scrollTopRef.current = e.currentTarget.scrollTop;
  }, [scrollTopRef]);

  const playVideo = useCallback((vlogId) => {
    // Block programmatic autoplay until user has interacted in this mount cycle
    if (!sessionInteractedRef.current) return;
    const video = videoRefs.current[vlogId];
    if (!video) return;
    video.play().catch(() => { });
  }, []);

  const pauseVideo = useCallback((vlogId) => {
    const video = videoRefs.current[vlogId];
    if (!video) return;
    video.pause();
  }, []);

  // Auto-play/pause via IntersectionObserver
  useEffect(() => {
    if (!isActive || !displayedVlogs || displayedVlogs.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.idx);
          const vlog = displayedVlogs[idx];
          if (!vlog) return;
          const video = videoRefs.current[vlog.id];
          if (!video) return;
          if (entry.isIntersecting && video.paused && !manuallyPausedRef.current[vlog.id]) {
            playVideo(vlog.id);
          } else if (!entry.isIntersecting && !video.paused) {
            pauseVideo(vlog.id);
          }
        });
      },
      { threshold: 0.75 }
    );
    slideRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [isActive, pauseVideo, playVideo, displayedVlogs]);

  const handlePlay = useCallback((vlogId) => {
    sessionInteractedRef.current = true; // Unlock autoplay for scroll/transitions
    setPlayingByVlog((s) => ({ ...s, [vlogId]: true }));
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
  }, [setPlayingByVlog, setHasInteracted]);

  const handlePauseOrEnd = useCallback((vlogId) => {
    setPlayingByVlog((s) => ({ ...s, [vlogId]: false }));
  }, [setPlayingByVlog]);

  const handleVideoToggle = useCallback((vlogId, action) => {
    if (action === "play") {
      sessionInteractedRef.current = true; // User explicitly tapped play
      manuallyPausedRef.current[vlogId] = false;
      playVideo(vlogId);
      handlePlay(vlogId);
      return;
    }

    manuallyPausedRef.current[vlogId] = true;
    pauseVideo(vlogId);
    handlePauseOrEnd(vlogId);
  }, [handlePauseOrEnd, handlePlay, pauseVideo, playVideo]);

  const handleVideoEnded = useCallback((vlog, idx) => {
    manuallyPausedRef.current[vlog.id] = false;
    handlePauseOrEnd(vlog.id);

    if (!autoNext || idx >= displayedVlogs.length - 1) return;

    const nextVlog = displayedVlogs[idx + 1];
    manuallyPausedRef.current[nextVlog.id] = false;
    slideRefs.current[idx + 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setVisibleVlogIdx(idx + 1);
    window.setTimeout(() => playVideo(nextVlog.id), 360);
  }, [autoNext, handlePauseOrEnd, playVideo, setVisibleVlogIdx, displayedVlogs]);

  const seekToSpot = (vlogId, location) => {
    const video = videoRefs.current[vlogId];
    manuallyPausedRef.current[vlogId] = false;
    if (video) { video.currentTime = location.time; video.play().catch(() => { }); }
    setActiveSpotByVlog((current) => ({ ...current, [vlogId]: location.time }));
  };

  const handleTimeUpdate = (vlog) => {
    const video = videoRefs.current[vlog.id];
    const currentTime = video?.currentTime || 0;
    const activeLocation = [...vlog.locations].reverse().find((loc) => currentTime >= loc.time);
    if (activeLocation && activeSpotByVlog[vlog.id] !== activeLocation.time) {
      setActiveSpotByVlog((current) => ({ ...current, [vlog.id]: activeLocation.time }));
    }
  };

  /* ── Bottom-sheet drag ────────────────────────────────── */
  const handleDragStart = useCallback((clientY) => {
    isDraggingRef.current = true;
    dragStartRef.current = { y: clientY, h: sheetHeight };
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY) => {
    if (!isDraggingRef.current) return;
    const delta = dragStartRef.current.y - clientY;
    const next = Math.max(SHEET_COLLAPSED, Math.min(SHEET_EXPANDED, dragStartRef.current.h + delta));
    setSheetHeight(next);
  }, [setSheetHeight]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    const mid = (SHEET_COLLAPSED + SHEET_EXPANDED) / 2;
    setSheetHeight((h) => ((h ?? SHEET_COLLAPSED) > mid ? SHEET_EXPANDED : SHEET_COLLAPSED));
  }, [setSheetHeight]);

  const toggleSheet = useCallback(() => {
    setSheetHeight((h) => ((h ?? SHEET_COLLAPSED) >= SHEET_EXPANDED ? SHEET_COLLAPSED : SHEET_EXPANDED));
  }, [setSheetHeight]);

  const isExpanded = sheetHeight >= SHEET_EXPANDED;

  /* ── Visible vlog tracker ────────────────────────────── */
  useEffect(() => {
    if (!displayedVlogs || displayedVlogs.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisibleVlogIdx(Number(entry.target.dataset.idx));
        });
      },
      { threshold: 0.6 }
    );
    slideRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [displayedVlogs]);

  const currentVlog = displayedVlogs?.[visibleVlogIdx] || null;

  useEffect(() => {
    if (!isActive || !currentVlog || mapView) return;

    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (String(id) !== String(currentVlog.id) && video && !video.paused) {
        video.pause();
      }
    });

    if (!manuallyPausedRef.current[currentVlog.id]) {
      playVideo(currentVlog.id);
    }
  }, [currentVlog, isActive, mapView, playVideo]);

  useEffect(() => {
    if (isExpanded && currentVlog && !mapView) {
      const video = videoRefs.current[currentVlog.id];
      if (video && video.paused && !manuallyPausedRef.current[currentVlog.id]) playVideo(currentVlog.id);
    }
  }, [isExpanded, currentVlog, mapView, playVideo]);

  const currentLocations = currentVlog?.locations || [];
  const locationsWithCoords = currentLocations.filter((l) => l.latitude && l.longitude);
  const activeTime = currentVlog ? activeSpotByVlog[currentVlog.id] : undefined;
  const activeLocation = currentLocations.find((l) => l.time === activeTime);

  const activeIdx = activeLocation ? locationsWithCoords.findIndex((l) => l.time === activeTime) : -1;
  const traversedCoords = activeIdx >= 0
    ? locationsWithCoords.slice(0, activeIdx + 1).map((l) => [l.latitude, l.longitude]) : [];
  const upcomingCoords = activeIdx >= 0
    ? locationsWithCoords.slice(activeIdx).map((l) => [l.latitude, l.longitude])
    : locationsWithCoords.map((l) => [l.latitude, l.longitude]);

  if (loading || !vlogs) {
    return (
      <main className="vlog-scroll-root">
        <Box className="vlog-scroll-shell" sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>Đang tải...</Typography>
        </Box>
      </main>
    );
  }


  return (
    <main className="vlog-scroll-root">
      <Box className="vlog-scroll-shell">
        <Box className="vlog-scroll-header">
          {!mapView && (
            <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} className="vlog-scroll-back">
              Trang chủ
            </Button>
          )}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              className="vlog-scroll-back"
              onClick={() => {
                if (!mapView) {
                  Object.values(videoRefs.current).forEach((v) => { if (v && !v.paused) v.pause(); });
                  vlogs?.forEach((v) => { manuallyPausedRef.current[v.id] = true; });
                  setPlayingByVlog({});
                } else {
                  vlogs?.forEach((v) => { manuallyPausedRef.current[v.id] = false; });
                  setMapPlayerVlog(null);
                }
                setMapView((v) => !v);
              }}
              aria-label={mapView ? "Xem dạng cuộn" : "Xem bản đồ"}
              sx={{ minWidth: 0, px: 1.5 }}
            >
              <MapIcon fontSize="small" sx={{ color: mapView ? "#82f3cf" : "inherit" }} />
            </Button>
            {!mapView && (
              <Box className="vlog-auto-next-toggle" component="label">
                <span>Tự chuyển</span>
                <Switch size="small" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} />
              </Box>
            )}
          </Box>
        </Box>

        {/* ── Map category chips — absolute, below header, only in map mode ── */}
        {mapView && categories.length > 0 && (
          <div style={{
            position: "absolute", top: 66, left: "50%", transform: "translateX(-50%)",
            zIndex: 7, display: "flex", gap: 6,
            background: "rgba(13,15,24,0.82)", backdropFilter: "blur(10px)",
            borderRadius: 24, padding: "6px 10px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
            maxWidth: "calc(100% - 32px)", overflowX: "auto",
            scrollbarWidth: "none", pointerEvents: "auto",
          }}>
            <button
              type="button"
              onClick={() => setMapCategorySlug("")}
              style={{
                padding: "4px 12px", borderRadius: 16, border: "none", cursor: "pointer",
                fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap",
                background: !mapCategorySlug ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)",
                color: !mapCategorySlug ? "#111" : "rgba(255,255,255,0.65)",
              }}
            >
              Tất cả
            </button>
            {categories.map((cat) => {
              const count = categoryCounts[cat.slug] || 0;
              const active = mapCategorySlug === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setMapCategorySlug(active ? "" : cat.slug)}
                  style={{
                    padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer",
                    fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 5,
                    background: active ? cat.color : "rgba(255,255,255,0.1)",
                    color: active ? "#fff" : count > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)",
                    opacity: count === 0 && !active ? 0.65 : 1,
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                    background: active ? "rgba(255,255,255,0.7)" : cat.color,
                  }} />
                  {cat.name}
                  {count > 0 && (
                    <span style={{
                      background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                      color: active ? "#fff" : "rgba(255,255,255,0.7)",
                      borderRadius: 10, fontSize: "0.6rem", fontWeight: 800,
                      padding: "1px 5px", lineHeight: 1.4,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── MAP OVERVIEW ─────────────────────────────────────── */}
        {mapView && (
          <Box className="vlog-map-overview">
            <MapContainer
              key="vlog-overview"
              center={userLocation || [10.6385, 105.2343]}
              zoom={13}
              scrollWheelZoom={true}
              zoomControl={false}
              attributionControl={false}
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                maxZoom={19}
              />
              <FitAllVlogsInView vlogs={filteredMapVlogs} />
              <OverviewUserTracker userLocation={userLocation} />
              <OverviewLocationBtn userLocation={userLocation} onRequest={handleRequestLocation} />

              {userLocation && (
                <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={2000}>
                  <Popup>
                    <div style={{ textAlign: "center", fontWeight: 700, fontSize: "0.82rem", padding: "4px 8px", color: "#333" }}>
                      Vị trí của bạn
                    </div>
                  </Popup>
                </Marker>
              )}

              {filteredMapVlogs.map((vlog) => {
                const catColor = vlog.category?.color || "#82f3cf";
                const catSlug = vlog.categorySlug || "";
                const geoLocs = (vlog.locations || []).filter((l) => l.latitude && l.longitude);

                const popupContent = (img, title, sub, lat, long) => (
                  <div className="vlog-map-popup">
                    <img src={img} alt={title} className="vlog-map-popup-img" />
                    {vlog.category && (
                      <span style={{
                        display: "inline-block", marginBottom: 4, padding: "2px 8px",
                        borderRadius: 10, fontSize: "0.65rem", fontWeight: 700,
                        background: vlog.category.color, color: "#fff",
                      }}>
                        {vlog.category.name}
                      </span>
                    )}
                    <strong className="vlog-map-popup-name">{title}</strong>
                    <span className="vlog-map-popup-sub">{sub}</span>
                    <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                      <button type="button" className="vlog-map-popup-btn" onClick={() => setMapPlayerVlog(vlog)} style={{ flex: 1 }}>
                        ▶ Xem Vlog
                      </button>
                      {lat && long && (
                        <button type="button" className="vlog-map-popup-btn" onClick={(e) => openShareMenu(e, vlog.id, lat, long)} style={{ background: "#2c2f3f", flex: 1, padding: "6px 4px" }}>
                          <ShareIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} /> Chia sẻ
                        </button>
                      )}
                    </div>
                  </div>
                );

                if (geoLocs.length === 0) {
                  return (
                    <Marker
                      key={`overview-${vlog.id}-noloc`}
                      position={[10.6385, 105.2343]}
                      icon={createThumbIcon(vlog.poster, vlog.title, catColor, catSlug)}
                    >
                      <Popup>{popupContent(vlog.poster, vlog.title, "Chưa có vị trí cụ thể")}</Popup>
                    </Marker>
                  );
                }

                return geoLocs.map((loc, i) => (
                  <Marker
                    key={`overview-${vlog.id}-${loc.time}-${i}`}
                    position={[loc.latitude, loc.longitude]}
                    icon={createThumbIcon(loc.image || vlog.poster, loc.name || vlog.title, catColor, catSlug)}
                  >
                    <Popup>{popupContent(loc.image || vlog.poster, loc.name || vlog.title, vlog.title, loc.latitude, loc.longitude)}</Popup>
                  </Marker>
                ));
              })}
            </MapContainer>
          </Box>
        )}

        {/* ── MAP VIDEO PLAYER OVERLAY ──────────────────────────── */}
        {mapView && mapPlayerVlog && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1500,
              background: "#0d0f18",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1,
                py: 0.5,
                gap: 1,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}
            >
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setMapPlayerVlog(null)}
                className="vlog-scroll-back"
              >
                Bản đồ
              </Button>
              <Typography
                noWrap
                sx={{ flex: 1, color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}
              >
                {mapPlayerVlog.title}
              </Typography>
              <Button
                component={RouterLink}
                to={`/post-detail/${mapPlayerVlog.newsId}`}
                className="vlog-scroll-back"
                aria-label="Xem chi tiết"
                onClick={() => {
                  mapPlayerVideoRef.current?.pause();
                  setMapPlayerVlog(null);
                }}
              >
                <ArticleIcon sx={{ fontSize: 18 }} />
              </Button>
            </Box>
            <video
              ref={mapPlayerVideoRef}
              key={mapPlayerVlog.id}
              src={mapPlayerVlog.videoUrl}
              poster={mapPlayerVlog.poster}
              autoPlay
              playsInline
              controls
              style={{
                flex: 1,
                width: "100%",
                objectFit: "contain",
                display: "block",
                background: "#000",
                minHeight: 0,
              }}
            />
          </Box>
        )}

        <Box
          ref={feedRef}
          className="vlog-scroll-feed"
          sx={{ pb: `${sheetHeight}px`, display: mapView ? "none" : undefined }}
          onScroll={handleFeedScroll}
        >
          {displayedVlogs.map((vlog, idx) => {
            const news = newsById.get(String(vlog.newsId));
            const isPlaying = !!playingByVlog[vlog.id];
            const isVisible = idx === visibleVlogIdx;
            const shouldHydrateVideo = idx >= hydratedVideoStart && idx <= hydratedVideoEnd;
            const preloadMode = isVisible || idx === visibleVlogIdx + 1 ? "auto" : "metadata";

            return (
              <section
                className="vlog-scroll-slide"
                key={vlog.id}
                data-idx={idx}
                ref={(el) => { slideRefs.current[idx] = el; }}
              >
                <Box className="vlog-scroll-video-wrap">
                  {shouldHydrateVideo ? (
                    <>
                      {/* Video — NO native controls */}
                      <video
                        ref={(node) => { if (node) videoRefs.current[vlog.id] = node; }}
                        className="vlog-scroll-video"
                        src={isActive ? vlog.videoUrl : undefined}
                        poster={vlog.poster}
                        playsInline
                        preload={preloadMode}
                        onCanPlay={() => {
                          // Only autoplay after user has interacted in this mount
                          if (isVisible && !manuallyPausedRef.current[vlog.id]) playVideo(vlog.id);
                        }}
                        onTimeUpdate={() => handleTimeUpdate(vlog)}
                        onPlay={() => handlePlay(vlog.id)}
                        onPause={() => handlePauseOrEnd(vlog.id)}
                        onEnded={() => handleVideoEnded(vlog, idx)}
                      />

                      {/* Tap-only play/pause overlay */}
                      <TapVideoOverlay
                        vlogId={vlog.id}
                        videoRefs={videoRefs}
                        isPlaying={isPlaying}
                        onToggle={handleVideoToggle}
                      />
                    </>
                  ) : (
                    <div className="vlog-scroll-video vlog-scroll-video-placeholder" aria-hidden="true" />
                  )}

                  {/* Tap hint when autoplay cannot start or the user pauses */}
                  {isVisible && !isPlaying && (
                    <div className={`vlog-play-hint${isPlaying ? " hidden" : ""}`} style={{ pointerEvents: "none" }}>
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
                    className="vlog-scroll-action"
                    aria-label="Chia sẻ Vlog"
                    onClick={(e) => openShareMenu(e, vlog.id)}
                  >
                    <ShareIcon />
                  </Button>
                  <span className="vlog-scroll-action-label">Chia sẻ</span>
                  <Button
                    component={RouterLink}
                    to={`/post-detail/${vlog.newsId}`}
                    className="vlog-scroll-action"
                    aria-label="Xem chi tiết"
                    onClick={() => {
                      Object.values(videoRefs.current).forEach((v) => { if (v && !v.paused) v.pause(); });
                    }}
                  >
                    <ArticleIcon />
                  </Button>
                  <span className="vlog-scroll-action-label">Chi tiết</span>
                  <span className={`vlog-scroll-action static${isPlaying ? " is-playing" : ""}`}>
                    <Equalizer playing={isPlaying} />
                  </span>
                </Box>

                {/* Bottom info panel */}
                <Box className="vlog-scroll-bottom-panel" sx={{ bottom: `${sheetHeight + 8}px` }}>
                  <Box className="vlog-scroll-info">
                    <Typography className="vlog-scroll-host">@{vlog.host}</Typography>
                    <Typography component="h1" className="vlog-scroll-title">{vlog.title}</Typography>
                    <Typography className="vlog-scroll-desc">{news?.excerpt || vlog.subtitle}</Typography>
                  </Box>
                </Box>
              </section>
            );
          })}
        </Box>

        {/* ── BOTTOM SHEET ──────────────────────────────────────── */}
        {!mapView && currentVlog && (
          <Box
            className="vlog-bottom-sheet"
            sx={{
              height: `${sheetHeight}px`,
              transition: isDraggingRef.current ? "none" : "height 0.3s cubic-bezier(.4,0,.2,1)",
            }}
          >
            <Box
              className="vlog-sheet-handle"
              onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
              onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
              onTouchEnd={handleDragEnd}
              onMouseDown={(e) => { handleDragStart(e.clientY); e.preventDefault(); }}
              onMouseMove={(e) => handleDragMove(e.clientY)}
              onMouseUp={handleDragEnd}
              onMouseLeave={() => { if (isDraggingRef.current) handleDragEnd(); }}
              onClick={toggleSheet}
            >
              <div className="vlog-sheet-handle-bar" />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1 }}>
                <MapIcon sx={{ fontSize: 16, color: "#82f3cf" }} />
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, color: "#82f3cf", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Lộ trình
                </Typography>
                <KeyboardArrowDownIcon sx={{
                  fontSize: 18, color: "rgba(255,255,255,0.6)", transition: "transform 0.3s",
                  transform: isExpanded ? "rotate(0deg)" : "rotate(180deg)", ml: "auto",
                }} />
              </Box>
            </Box>

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

            {isExpanded && locationsWithCoords.length > 0 && (
              <Box className="vlog-sheet-map">
                <MapContainer
                  center={[locationsWithCoords[0].latitude, locationsWithCoords[0].longitude]}
                  zoom={14} scrollWheelZoom={false} dragging={true}
                  zoomControl={false} attributionControl={false}
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
                    const isActiveMarker = activeTime === loc.time;
                    const isVisited = activeIdx >= 0 && i <= activeIdx;
                    return (
                      <Marker key={`${loc.time}-${i}`} position={[loc.latitude, loc.longitude]}
                        icon={createPreviewIcon(i + 1, loc.image, isActiveMarker, isVisited, loc.name)}
                        zIndexOffset={isActiveMarker ? 1000 : isVisited ? 500 : 0}
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
                    <CircleMarker center={[activeLocation.latitude, activeLocation.longitude]} radius={20}
                      pathOptions={{ color: "#1976d2", fillColor: "#1976d2", fillOpacity: 0.18, weight: 2, opacity: 0.5, className: "vlog-map-pulse" }}
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

      <Snackbar
        open={locationError.open}
        autoHideDuration={6000}
        onClose={() => setLocationError({ open: false, message: "", code: null })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setLocationError({ open: false, message: "", code: null })}
          severity="error"
          action={locationError.code === 1 && isInsideIframe() ? (
            <Button color="inherit" size="small" onClick={openCurrentPageInNewTab}>
              Mở trong tab mới
            </Button>
          ) : null}
        >
          {locationError.message}
        </Alert>
      </Snackbar>

      <Menu anchorEl={shareMenuAnchor} open={!!shareMenuAnchor} onClose={closeShareMenu}>
        <MenuItem onClick={handleCopyShareLink}>
          <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Sao chép link</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyShareLinkZalo}>
          <ListItemIcon><ShareIcon fontSize="small" sx={{ color: "#0068ff" }} /></ListItemIcon>
          <ListItemText>Chia sẻ qua Zalo Mini App</ListItemText>
        </MenuItem>
      </Menu>
    </main>
  );
};

export default VlogFeed;
