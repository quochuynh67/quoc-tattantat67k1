// src/components/sections/VlogsMapSection.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { Container, Button, Card, CardActionArea, CardMedia, CardContent, Typography, Box, Snackbar, Alert } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getVlogReviews } from "../../lib/phuTanApi";
import { getVlogCategories } from "../../lib/supabaseClient";
import { getCurrentLocation, isInsideIframe, openCurrentPageInNewTab } from "../../utils/geolocation";
import { getUrlParams } from "../../utils/urlParams";

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getVlogDistance = (vlog, centerLat, centerLon) => {
  const coords = (vlog.locations || []).filter((l) => l.latitude && l.longitude);
  if (coords.length === 0) return Infinity;
  return Math.min(...coords.map((l) => getDistance(centerLat, centerLon, l.latitude, l.longitude)));
};

const CATEGORY_SHAPES = {
  "chill":       { icon: "🌿", shadow: "rgba(16,185,129,0.4)" },
  "real-estate": { icon: "🏠", shadow: "rgba(59,130,246,0.4)" },
  "helps":       { icon: "🤝", shadow: "rgba(245,158,11,0.4)" },
  "news":        { icon: "📰", shadow: "rgba(239,68,68,0.4)"  },
};

const createCategoryThumbIcon = (imageUrl, altText = "", catColor = "#82f3cf", catSlug = "") => {
  const shape = CATEGORY_SHAPES[catSlug] || { icon: "", shadow: "rgba(130,243,207,0.4)" };
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

const userIcon = L.divIcon({
  html: `<div style="position: relative; width: 24px; height: 24px;">
    <div style="position: absolute; inset: 0; background-color: rgba(244,67,54,0.4); border-radius: 50%; animation: vlog-pulse-ring 2s infinite ease-out;"></div>
    <div style="position: absolute; inset: 4px; background-color: #f44336; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
  </div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const MapTracker = ({ onBoundsChange }) => {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getCenter());
    },
  });
  useEffect(() => {
    onBoundsChange(map.getCenter());
  }, [map, onBoundsChange]);
  return null;
};

const UserTracker = ({ userLocation }) => {
  const map = useMap();
  const location = useLocation();

  useEffect(() => {
    if (userLocation && location.pathname === "/" && map.getSize().x > 0 && map.getSize().y > 0) {
      map.flyTo(userLocation, 14, { duration: 1.5 });
    }
  }, [userLocation, map, location.pathname]);
  return null;
};

const MapResizer = () => {
  const map = useMap();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, map]);

  return null;
};

const LocationButton = ({ userLocation, onRequestLocation, isLoading, onError }) => {
  const map = useMap();
  return (
    <Box sx={{ position: "absolute", bottom: 16, right: 16, zIndex: 1000 }}>
      <Button
        variant="contained"
        aria-label={userLocation ? "Về vị trí của tôi" : "Xác định vị trí của tôi"}
        onClick={(e) => {
          e.stopPropagation();
          if (userLocation) {
            map.flyTo(userLocation, 14, { duration: 1.5 });
          } else {
            onRequestLocation();
          }
        }}
        disabled={isLoading}
        sx={{ minWidth: 0, width: 48, height: 48, borderRadius: "50%", bgcolor: "#fff", color: "#1976d2", "&:hover": { bgcolor: "#f5f5f5" }, "&:disabled": { opacity: 0.6 }, p: 0, boxShadow: 4 }}
      >
        <MyLocationIcon />
      </Button>
    </Box>
  );
};

const VlogsMapSection = () => {
  const navigate = useNavigate();
  const [vlogs, setVlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mapCategorySlug, setMapCategorySlug] = useState("");
  const [mapCenter, setMapCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [limit, setLimit] = useState(4);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState({ open: false, message: "", code: null });

  useEffect(() => {
    let isMounted = true;
    getVlogReviews().then((data) => {
      if (isMounted) setVlogs(data);
    });
    getVlogCategories().then((data) => {
      if (isMounted) setCategories(data || []);
    }).catch(() => {});

    const { lat, long } = getUrlParams();
    if (lat && long) {
      setUserLocation([lat, long]);
    }

    return () => { isMounted = false; };
  }, []);

  const handleRequestLocation = useCallback(() => {
    setLocationLoading(true);
    getCurrentLocation()
      .then((loc) => {
        setUserLocation([loc.latitude, loc.longitude]);
        setError({ open: false, message: "", code: null });
      })
      .catch((err) => {
        setError({ open: true, message: err.message, code: err.code });
      })
      .finally(() => setLocationLoading(false));
  }, []);

  const handleBoundsChange = useCallback((center) => {
    setMapCenter(center);
  }, []);

  const sortedVlogs = useMemo(() => {
    if (!mapCenter) return vlogs;
    return [...vlogs].sort((a, b) => getVlogDistance(a, mapCenter.lat, mapCenter.lng) - getVlogDistance(b, mapCenter.lat, mapCenter.lng));
  }, [vlogs, mapCenter]);

  const displayedVlogs = sortedVlogs.slice(0, limit);

  const filteredMapVlogs = useMemo(() => {
    if (!mapCategorySlug) return vlogs;
    return vlogs.filter((v) => v.categorySlug === mapCategorySlug);
  }, [vlogs, mapCategorySlug]);

  // Count vlogs per category for badge display
  const categoryCounts = useMemo(() => {
    const counts = {};
    vlogs.forEach((v) => { if (v.categorySlug) counts[v.categorySlug] = (counts[v.categorySlug] || 0) + 1; });
    return counts;
  }, [vlogs]);

  // Default to somewhere in Phu Tan if userLocation is missing
  const defaultCenter = [10.6385, 105.2343];

  return (
    <section className="content-section" style={{ backgroundColor: "var(--color-background-alt)", padding: "var(--spacing-xl) 0" }}>
      <Container maxWidth={false} className="section-container">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h2" sx={{ fontFamily: "var(--font-display)", color: "primary.main" }}>
            Khám phá Vlog trên bản đồ
          </Typography>
        </Box>
        <Typography variant="body1" gutterBottom sx={{ fontFamily: "var(--font-body)", color: "var(--color-text-subtle)", mb: 4 }}>
          Kéo bản đồ để xem các địa điểm có vlog gần đó.
        </Typography>

        <Box sx={{
          height: 400, borderRadius: "12px", overflow: "hidden", mb: 4,
          border: "1px solid var(--color-border)", zIndex: 0, position: "relative",
          "& .leaflet-control-attribution": { display: "none !important" },
          "& .leaflet-popup-content-wrapper": {
            background: "rgba(10,12,18,0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(130,243,207,0.22)",
            borderRadius: "12px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
            color: "#fff",
            padding: 0,
          },
          "& .leaflet-popup-content": { margin: 0, width: "auto !important" },
          "& .leaflet-popup-tip-container": { display: "none" },
          "& .leaflet-popup-close-button": { color: "rgba(255,255,255,0.5)", right: "8px", top: "8px" },
          "& .leaflet-popup-close-button:hover": { color: "#82f3cf" },
        }}>
          {/* Category filter chips – floating above map */}
          {categories.length > 0 && (
            <Box sx={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              zIndex: 1000, display: "flex", gap: 0.75, flexWrap: "nowrap",
              bgcolor: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
              borderRadius: 20, px: 1.25, py: 0.75,
              boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
              maxWidth: "calc(100% - 32px)", overflowX: "auto",
              scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
            }}>
              <button
                type="button"
                onClick={() => setMapCategorySlug("")}
                style={{
                  padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
                  background: !mapCategorySlug ? "#1e293b" : "transparent",
                  color: !mapCategorySlug ? "#fff" : "#475569",
                  transition: "all 0.15s",
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
                      padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer",
                      fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: 4,
                      background: active ? cat.color : "transparent",
                      color: active ? "#fff" : count > 0 ? "#1e293b" : "#94a3b8",
                      transition: "all 0.15s",
                      opacity: count === 0 && !active ? 0.6 : 1,
                    }}
                  >
                    <span style={{
                      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                      background: active ? "rgba(255,255,255,0.7)" : cat.color,
                      flexShrink: 0,
                    }} />
                    {cat.name}
                    {count > 0 && (
                      <span style={{
                        background: active ? "rgba(255,255,255,0.25)" : cat.color,
                        color: "#fff", borderRadius: 10,
                        fontSize: "0.6rem", fontWeight: 800,
                        padding: "1px 5px", lineHeight: 1.4,
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </Box>
          )}

          <MapContainer
            center={userLocation || defaultCenter}
            zoom={13}
            scrollWheelZoom={false}
            style={{ width: "100%", height: "100%" }}
          >
            <MapResizer />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapTracker onBoundsChange={handleBoundsChange} />
            <UserTracker userLocation={userLocation} />
            <LocationButton userLocation={userLocation} onRequestLocation={handleRequestLocation} isLoading={locationLoading} />

            {userLocation && (
              <Marker position={userLocation} icon={userIcon} zIndexOffset={2000}>
                <Popup>
                  <div style={{ textAlign: "center", fontWeight: "bold" }}>Bạn ở đây</div>
                </Popup>
              </Marker>
            )}

            {filteredMapVlogs.map((vlog) => {
              const locations = (vlog.locations || []).filter((l) => l.latitude && l.longitude);
              const catColor = vlog.category?.color || "#82f3cf";
              const catSlug = vlog.categorySlug || "";
              return locations.map((loc, i) => (
                <Marker
                  key={`${vlog.id}-${loc.time}-${i}`}
                  position={[loc.latitude, loc.longitude]}
                  icon={createCategoryThumbIcon(loc.image || vlog.poster, loc.name || vlog.title, catColor, catSlug)}
                >
                  <Popup>
                    <div className="vlog-map-popup">
                      <img
                        src={loc.image || vlog.poster}
                        alt={loc.name || vlog.title}
                        className="vlog-map-popup-img"
                      />
                      {vlog.category && (
                        <span style={{
                          display: "inline-block", margin: "6px 12px 2px",
                          padding: "2px 8px", borderRadius: 10,
                          fontSize: "0.65rem", fontWeight: 700,
                          background: vlog.category.color, color: "#fff",
                        }}>
                          {vlog.category.name}
                        </span>
                      )}
                      <strong className="vlog-map-popup-name">{loc.name || vlog.title}</strong>
                      <span className="vlog-map-popup-sub">{vlog.title}</span>
                      <button
                        type="button"
                        className="vlog-map-popup-btn"
                        onClick={(e) => { e.stopPropagation(); navigate(`/post-detail/${vlog.newsId}`); }}
                      >
                        ▶ Xem Vlog
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ));
            })}
          </MapContainer>
        </Box>

        <Box
          sx={{
            display: "none",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
            gap: 4,
            alignItems: "stretch",
          }}
        >
          {displayedVlogs.map((vlog) => (
            <Box key={vlog.id} sx={{ minWidth: 0 }}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  transition: "box-shadow 0.2s, transform 0.2s",
                  "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.15)", transform: "translateY(-2px)" },
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={`/post-detail/${vlog.newsId}`}
                  sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
                >
                  <CardMedia component="img" image={vlog.poster} alt={vlog.title} sx={{ height: 200, objectFit: "cover" }} />
                  <CardContent sx={{ flexGrow: 1, padding: "var(--spacing-sm)", display: "flex", flexDirection: "column" }}>
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
                      }}
                    >
                      {vlog.title}
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
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical"
                      }}
                    >
                      {vlog.subtitle}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          ))}
        </Box>

        {false && limit < sortedVlogs.length && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Button variant="outlined" onClick={() => setLimit((l) => l + 4)}>
              Tải thêm
            </Button>
          </Box>
        )}

        <Snackbar
          open={error.open}
          autoHideDuration={6000}
          onClose={() => setError({ open: false, message: "", code: null })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setError({ open: false, message: "", code: null })}
            severity="error"
            action={error.code === 1 && isInsideIframe() ? (
              <Button color="inherit" size="small" onClick={openCurrentPageInNewTab}>
                Mở trong tab mới
              </Button>
            ) : null}
          >
            {error.message}
          </Alert>
        </Snackbar>
      </Container>
    </section>
  );
};

export default VlogsMapSection;
