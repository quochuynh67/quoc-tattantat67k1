// src/pages/VlogFeed.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlaceIcon from "@mui/icons-material/Place";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { getSectionItems, getVlogReviews } from "../lib/phuTanApi";

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
};

const Equalizer = ({ playing }) => (
  <div className={`vlog-equalizer${playing ? " playing" : ""}`}>
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
    <div className="vlog-equalizer-bar" />
  </div>
);

const VlogFeed = () => {
  const videoRefs = useRef({});
  const slideRefs = useRef([]);
  const hasInteractedRef = useRef(false);

  const [activeSpotByVlog, setActiveSpotByVlog] = useState({});
  const [playingByVlog, setPlayingByVlog] = useState({});
  const [hasInteracted, setHasInteracted] = useState(false);
  const [vlogs, setVlogs] = useState([]);
  const [newsItems, setNewsItems] = useState([]);

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

  return (
    <main className="vlog-scroll-root">
      <Box className="vlog-scroll-shell">
        <Box className="vlog-scroll-header">
          <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} className="vlog-scroll-back">
            Trang chủ
          </Button>
          <span className="vlog-scroll-badge">Phú Tân vlog</span>
        </Box>

        <Box className="vlog-scroll-feed">
          {vlogs.map((vlog, idx) => {
            const news = newsItems.find((item) => String(item.id) === String(vlog.newsId));
            const activeTime = activeSpotByVlog[vlog.id] ?? vlog.locations[0]?.time;
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

                {/* Right side: equalizer + detail link */}
                <Box className="vlog-scroll-actions" aria-label="Vlog actions">
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

                <Box className="vlog-scroll-bottom-panel">
                  {(vlog.locations || []).length > 0 && (
                    <Box className="vlog-scroll-spots">
                      <Box className="vlog-scroll-spots-title">
                        <PlaceIcon fontSize="small" />
                        <span>Vị trí theo giây</span>
                      </Box>
                      <Box className="vlog-scroll-spot-list">
                        {(vlog.locations || []).map((location) => (
                          <button
                            key={`${vlog.id}-${location.time}`}
                            type="button"
                            className={`vlog-scroll-spot ${activeTime === location.time ? "active" : ""}`}
                            onClick={() => seekToSpot(vlog.id, location)}
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
      </Box>
    </main>
  );
};

export default VlogFeed;
