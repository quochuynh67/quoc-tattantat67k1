// src/pages/VlogReview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Box, Button, Container, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlaceIcon from "@mui/icons-material/Place";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { mockNews, mockVlogReviews } from "../mocks/data";
import { getSectionItems, getVlogReview } from "../lib/phuTanApi";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
};

const VlogReview = () => {
  const { id } = useParams();
  const videoRef = useRef(null);
  const [activeTime, setActiveTime] = useState(0);
  const [vlog, setVlog] = useState(() =>
    mockVlogReviews.find((item) => String(item.newsId) === String(id) || String(item.id) === String(id))
  );
  const [newsItems, setNewsItems] = useState(mockNews);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getVlogReview(id), getSectionItems("news")]).then(([vlogData, newsData]) => {
      if (!isMounted) return;
      setVlog(vlogData);
      setNewsItems(newsData);
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const news = useMemo(() => newsItems.find((item) => String(item.id) === String(vlog?.newsId)), [newsItems, vlog]);

  if (!vlog) {
    return (
      <Container maxWidth={false} className="section-container vlog-review-empty">
        <Typography variant="h4" component="h1" sx={{ fontFamily: "var(--font-display)", color: "var(--color-text)", mb: 2 }}>
          Chưa có review vlog
        </Typography>
        <Typography sx={{ color: "var(--color-text-subtle)", mb: 3 }}>
          Bài viết này hiện chưa được gắn vlog review.
        </Typography>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} variant="contained">
          Quay lại trang chủ
        </Button>
      </Container>
    );
  }

  const seekToLocation = (location) => {
    if (videoRef.current) {
      videoRef.current.currentTime = location.time;
      videoRef.current.play().catch(() => {});
    }
    setActiveTime(location.time);
  };

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current?.currentTime || 0;
    const activeLocation = [...(vlog.locations || [])]
      .reverse()
      .find((location) => currentTime >= location.time);

    if (activeLocation) {
      setActiveTime(activeLocation.time);
    }
  };

  return (
    <main className="vlog-review-page">
      <Container maxWidth={false} className="section-container">
        <Button
          component={RouterLink}
          to="/"
          startIcon={<ArrowBackIcon />}
          className="vlog-back-link"
        >
          Quay lại tin tức
        </Button>

        <Box className="vlog-review-layout">
          <Box className="vlog-video-panel">
            <video
              ref={videoRef}
              className="vlog-review-video"
              controls
              playsInline
              poster={vlog.poster}
              src={vlog.videoUrl}
              onTimeUpdate={handleTimeUpdate}
            />
            <Box className="vlog-video-caption">
              <Typography className="vlog-host">{vlog.host}</Typography>
              <Typography className="vlog-duration">{vlog.durationLabel}</Typography>
            </Box>
          </Box>

          <Box className="vlog-info-panel">
            <Typography variant="overline" className="vlog-kicker">
              Review vlog
            </Typography>
            <Typography variant="h3" component="h1" className="vlog-title">
              {vlog.title}
            </Typography>
            <Typography className="vlog-subtitle">
              {vlog.subtitle}
            </Typography>

            {news && (
              <Box className="vlog-linked-article">
                <Typography className="vlog-linked-label">Bài viết liên kết</Typography>
                <Typography className="vlog-linked-title">{news.title}</Typography>
                <Typography className="vlog-linked-excerpt">{news.excerpt}</Typography>
              </Box>
            )}

            <Box className="vlog-location-header">
              <PlaceIcon fontSize="small" />
              <Typography component="h2">Vị trí theo từng giây</Typography>
            </Box>

            <Box className="vlog-location-list">
              {(vlog.locations || []).map((location) => (
                <button
                  type="button"
                  key={`${location.time}-${location.name}`}
                  className={`vlog-location-item ${activeTime === location.time ? "active" : ""}`}
                  onClick={() => seekToLocation(location)}
                >
                  <img src={location.image} alt={location.name} className="vlog-location-thumb" />
                  <span className="vlog-location-content">
                    <span className="vlog-location-name">{location.name}</span>
                    <span className="vlog-location-note">{location.note}</span>
                    <span className="vlog-location-time">
                      <PlayCircleIcon fontSize="inherit" />
                      Nhảy tới {formatTime(location.time)}
                    </span>
                  </span>
                </button>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </main>
  );
};

export default VlogReview;
