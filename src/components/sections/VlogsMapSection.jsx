// src/components/sections/VlogsMapSection.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { Container, Button, Card, CardActionArea, CardMedia, CardContent, Typography, Box, Snackbar, Alert } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getVlogReviews } from "../../lib/phuTanApi";
import { getCurrentLocation, isInsideIframe, openCurrentPageInNewTab } from "../../utils/geolocation";

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

const createThumbIcon = (imageUrl, altText = "") => {
  return L.divIcon({
    html: `<div style="width: 36px; height: 36px; border-radius: 8px; overflow: hidden; border: 2px solid #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.4); background: #1a1c24;">
      <img src="${imageUrl}" alt="${altText.replace(/"/g, "&quot;")}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
    </div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
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
          "& .leaflet-control-attribution": { display: "none !important" }
        }}>
          <MapContainer
            center={userLocation || defaultCenter}
            zoom={13}
            scrollWheelZoom={false}
            style={{ width: "100%", height: "100%" }}
          >
            <MapResizer />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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

            {vlogs.map((vlog) => {
              const locations = (vlog.locations || []).filter((l) => l.latitude && l.longitude);
              return locations.map((loc, i) => (
                <Marker
                  key={`${vlog.id}-${loc.time}-${i}`}
                  position={[loc.latitude, loc.longitude]}
                  icon={createThumbIcon(loc.image || vlog.poster, loc.name || vlog.title)}
                >
                  <Popup>
                    <div style={{ textAlign: "center", minWidth: 140 }}>
                      <img src={loc.image || vlog.poster} alt={loc.name} style={{ width: "100%", borderRadius: "6px", marginBottom: "8px", objectFit: "cover", aspectRatio: "16/9", display: "block" }} />
                      <strong style={{ display: "block", marginBottom: 4, fontSize: "0.9rem" }}>{loc.name}</strong>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/post-detail/${vlog.newsId}`);
                        }}
                        size="small" 
                        variant="contained" 
                        sx={{ mt: 1 }}
                      >
                        Xem Review
                      </Button>
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
