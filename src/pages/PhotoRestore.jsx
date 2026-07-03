// src/pages/PhotoRestore.jsx
// Tiện ích "Phục dựng ảnh cũ" — hiện chưa có AI service thật, toàn bộ xử lý được MOCK
// (progress giả lập + hiệu ứng CSS filter minh hoạ before/after).
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box, Container, Typography, Button, Chip, LinearProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ScienceIcon from "@mui/icons-material/Science";
import { useGlobalToast } from "../contexts/ToastContext";
import { useCarousel3D } from "../hooks/useCarousel3D";

const OLD_FILTER = "sepia(0.55) contrast(0.85) brightness(0.92) saturate(0.75) blur(0.3px)";
const ENHANCE_FILTER = "contrast(1.08) saturate(1.15) brightness(1.03)";

const PROCESSING_STEPS = [
  "Đang tải ảnh lên...",
  "Đang phân tích vết ố, trầy xước...",
  "Đang khôi phục màu sắc gốc...",
  "Đang làm nét chi tiết khuôn mặt...",
  "Đang hoàn thiện ảnh phục dựng...",
];

// Ảnh minh hoạ vẽ tay (SVG) — gia đình Việt Nam chụp ảnh xưa (áo dài, nón lá), dùng cho demo
// vì không có sẵn ảnh tư liệu thật để nhúng. Cùng cơ chế filter before/after như các ảnh mẫu khác.
const VIETNAM_FAMILY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <rect width="400" height="500" fill="#efe0c2"/>
  <rect x="0" y="440" width="400" height="60" fill="#d9c9a3"/>
  <ellipse cx="200" cy="465" rx="170" ry="14" fill="#00000022"/>
  <rect x="74" y="356" width="32" height="80" rx="10" fill="#f4d35e"/>
  <rect x="74" y="436" width="32" height="34" fill="#3a2f2a"/>
  <circle cx="90" cy="340" r="16" fill="#f0c79a"/>
  <ellipse cx="90" cy="330" rx="17" ry="12" fill="#241c1a"/>
  <circle cx="85" cy="341" r="1.6" fill="#241c1a"/>
  <circle cx="95" cy="341" r="1.6" fill="#241c1a"/>
  <path d="M130 300 L170 300 L150 270 Z" fill="#f5efe0" stroke="#cbb98a" stroke-width="2"/>
  <path d="M198 212 L232 212 L252 460 L178 460 Z" fill="#d9455f"/>
  <path d="M198 212 L232 212 L238 250 L192 250 Z" fill="#c93552"/>
  <circle cx="215" cy="185" r="27" fill="#eabb8d"/>
  <ellipse cx="215" cy="175" rx="28" ry="18" fill="#241c1a"/>
  <circle cx="215" cy="146" r="9" fill="#241c1a"/>
  <circle cx="207" cy="187" r="2" fill="#241c1a"/>
  <circle cx="223" cy="187" r="2" fill="#241c1a"/>
  <path d="M206 198 Q215 203 224 198" stroke="#241c1a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <rect x="266" y="202" width="68" height="190" rx="20" fill="#e7e2d5"/>
  <rect x="266" y="392" width="68" height="78" fill="#33404a"/>
  <circle cx="300" cy="170" r="32" fill="#e8b98a"/>
  <ellipse cx="300" cy="150" rx="34" ry="20" fill="#241c1a"/>
  <circle cx="291" cy="172" r="2.2" fill="#241c1a"/>
  <circle cx="309" cy="172" r="2.2" fill="#241c1a"/>
  <path d="M289 184 Q300 190 311 184" stroke="#241c1a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <rect x="314" y="356" width="32" height="80" rx="10" fill="#7fb3d5"/>
  <rect x="314" y="436" width="32" height="34" fill="#3a2f2a"/>
  <circle cx="330" cy="340" r="16" fill="#f0c79a"/>
  <ellipse cx="330" cy="330" rx="17" ry="12" fill="#241c1a"/>
  <circle cx="325" cy="341" r="1.6" fill="#241c1a"/>
  <circle cx="335" cy="341" r="1.6" fill="#241c1a"/>
  <rect x="8" y="8" width="384" height="484" fill="none" stroke="#ffffff66" stroke-width="14"/>
  <text x="360" y="486" font-family="Georgia, serif" font-size="15" fill="#00000055" text-anchor="end">1968</text>
</svg>`;
const VIETNAM_FAMILY_PHOTO = `data:image/svg+xml,${encodeURIComponent(VIETNAM_FAMILY_SVG)}`;

const EXAMPLES = [
  { id: "ex-family-vn", label: "Gia đình Việt Nam xưa", img: VIETNAM_FAMILY_PHOTO },
  { id: "ex-1027", label: "Ảnh chân dung", img: "https://picsum.photos/id/1027/500/650" },
  { id: "ex-1025", label: "Ảnh cưới xưa", img: "https://picsum.photos/id/1025/500/650" },
  { id: "ex-1012", label: "Ảnh phong cảnh quê", img: "https://picsum.photos/id/1012/500/650" },
];

const ORBIT_PHOTOS = [
  "https://picsum.photos/id/1002/200/200",
  "https://picsum.photos/id/1003/200/200",
  "https://picsum.photos/id/1004/200/200",
  "https://picsum.photos/id/1006/200/200",
  "https://picsum.photos/id/1008/200/200",
  "https://picsum.photos/id/1010/200/200",
  "https://picsum.photos/id/1013/200/200",
  "https://picsum.photos/id/1016/200/200",
];

const CAROUSEL_RADIUS = 150; // px — khoảng cách translateZ tạo chiều sâu 3D

const PhotoRestore = () => {
  const toast = useGlobalToast();
  const fileInputRef = useRef(null);
  const demoRef = useRef(null);
  const timersRef = useRef(null);

  const [sourceImage, setSourceImage] = useState(null);
  const [isExample, setIsExample] = useState(false);
  const [stage, setStage] = useState("idle"); // idle | processing | done
  const [stepIndex, setStepIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [dragActive, setDragActive] = useState(false);

  // ── 3D gallery carousel — logic xoay dùng chung từ hook ──
  const {
    viewportRef: carouselRef,
    rotation: carouselRotation,
    viewportHandlers: carouselHandlers,
    rotateItemToFront,
  } = useCarousel3D();

  const handleCarouselItemClick = useCallback((index) => {
    rotateItemToFront((360 / ORBIT_PHOTOS.length) * index);
  }, [rotateItemToFront]);

  useEffect(() => () => {
    if (timersRef.current) {
      clearInterval(timersRef.current.stepTimer);
      clearTimeout(timersRef.current.doneTimer);
    }
    if (sourceImage && sourceImage.startsWith("blob:")) URL.revokeObjectURL(sourceImage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSource = useCallback((url, { example }) => {
    setSourceImage((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
    setIsExample(example);
    setStage("idle");
    setSliderPos(50);
  }, []);

  const handleFilePick = useCallback((e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.show("Vui lòng chọn file ảnh", "error");
      return;
    }
    loadSource(URL.createObjectURL(file), { example: false });
  }, [loadSource, toast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.show("Vui lòng chọn file ảnh", "error");
      return;
    }
    loadSource(URL.createObjectURL(file), { example: false });
  }, [loadSource, toast]);

  const handleExampleClick = useCallback((example) => {
    loadSource(example.img, { example: true });
    requestAnimationFrame(() => {
      demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [loadSource]);

  const handleRestore = useCallback(() => {
    if (!sourceImage) return;
    setStage("processing");
    setStepIndex(0);
    let i = 0;
    const stepTimer = setInterval(() => {
      i += 1;
      if (i < PROCESSING_STEPS.length) setStepIndex(i);
    }, 550);
    const doneTimer = setTimeout(() => {
      clearInterval(stepTimer);
      setStage("done");
      setSliderPos(50);
    }, 550 * PROCESSING_STEPS.length + 400);
    timersRef.current = { stepTimer, doneTimer };
  }, [sourceImage]);

  const handleReset = useCallback(() => {
    setSourceImage((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setIsExample(false);
    setStage("idle");
  }, []);

  const handleDownload = useCallback(() => {
    if (!sourceImage) return;
    const filterCss = isExample ? "none" : ENHANCE_FILTER;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.filter = filterCss;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.show("Không thể tải ảnh, vui lòng thử lại", "error");
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "phuc-dung-anh.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          toast.show("Đã tải ảnh phục dựng!", "success");
        }, "image/png");
      } catch {
        toast.show("Không thể tải ảnh, vui lòng thử lại", "error");
      }
    };
    img.onerror = () => toast.show("Không thể tải ảnh, vui lòng thử lại", "error");
    img.src = sourceImage;
  }, [sourceImage, isExample, toast]);

  const beforeFilter = isExample ? OLD_FILTER : "none";
  const afterFilter = isExample ? "none" : ENHANCE_FILTER;

  return (
    <>
      <Helmet>
        <title>Phục dựng ảnh cũ – Tất tần tật Phú Tân</title>
        <meta name="description" content="Phục dựng, làm nét và khôi phục màu sắc ảnh cũ, ảnh gia đình xưa bằng AI (bản demo)." />
      </Helmet>

      {/* ── Hero ── */}
      <Box sx={{
        background: "linear-gradient(135deg, #2E7D32 0%, #00695C 100%)",
        py: { xs: 5, md: 7 },
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""', position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 15% 20%, rgba(255,255,255,0.16) 0%, transparent 55%)",
          pointerEvents: "none",
        },
      }}>
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Chip
            icon={<ScienceIcon sx={{ color: "#fff !important" }} />}
            label="Bản Demo — AI phục dựng thực tế đang được phát triển"
            sx={{
              bgcolor: "rgba(255,255,255,0.16)", color: "#fff", fontWeight: 600,
              mb: 2, "& .MuiChip-icon": { color: "#fff" },
            }}
          />
          <Typography variant="h3" sx={{
            fontFamily: "var(--font-display)", fontWeight: 700, color: "#fff",
            fontSize: { xs: "1.9rem", md: "2.6rem" }, mb: 1.5,
          }}>
            ✨ Phục dựng ảnh cũ
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.88)", fontFamily: "var(--font-body)", fontSize: { xs: "0.95rem", md: "1.05rem" }, maxWidth: 560, mx: "auto" }}>
            Khôi phục màu sắc, làm nét chi tiết và xoá vết ố cho những tấm ảnh gia đình, ảnh xưa của bạn —
            chỉ với một cú chạm.
          </Typography>
        </Container>
      </Box>

      {/* ── Demo area ── */}
      <Box ref={demoRef} sx={{ py: { xs: 4, md: 6 }, background: "var(--color-background)" }}>
        <Container maxWidth="sm">
          {!sourceImage && (
            <Box
              className={`restore-dropzone${dragActive ? " drag-active" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              sx={{ p: { xs: 4, md: 6 }, textAlign: "center" }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: "var(--color-primary)", mb: 1 }} />
              <Typography sx={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", fontSize: "1.15rem", mb: 0.5 }}>
                Kéo thả ảnh vào đây, hoặc bấm để chọn ảnh
              </Typography>
              <Typography sx={{ color: "var(--color-text-subtle)", fontSize: "0.85rem" }}>
                Hỗ trợ JPG, PNG · Hoặc chọn một ảnh mẫu bên dưới để dùng thử ngay
              </Typography>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFilePick} />
            </Box>
          )}

          {sourceImage && (
            <Box className="restore-fade-in">
              {stage !== "done" && (
                <Box sx={{
                  position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden",
                  boxShadow: "var(--shadow-medium)", aspectRatio: "4/3", bgcolor: "#000",
                }}>
                  <img
                    src={sourceImage}
                    alt="Ảnh đã chọn"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  {stage === "processing" && (
                    <Box sx={{
                      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 2, px: 3,
                      background: "rgba(10,12,18,0.55)", backdropFilter: "blur(2px)",
                    }}>
                      <AutoFixHighIcon sx={{ fontSize: 40, color: "var(--color-accent-gold)", animation: "spin-slow 2.2s linear infinite" }} />
                      <Typography sx={{ color: "#fff", fontWeight: 600, textAlign: "center" }}>
                        {PROCESSING_STEPS[stepIndex]}
                      </Typography>
                      <Box sx={{ width: "100%", maxWidth: 280 }}>
                        <LinearProgress
                          variant="determinate"
                          value={((stepIndex + 1) / PROCESSING_STEPS.length) * 100}
                          sx={{
                            height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.2)",
                            "& .MuiLinearProgress-bar": { bgcolor: "var(--color-accent-gold)" },
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {stage === "done" && (
                <Box sx={{
                  position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden",
                  boxShadow: "var(--shadow-medium)", aspectRatio: "4/3", userSelect: "none",
                }}>
                  <img
                    src={sourceImage}
                    alt="Kết quả phục dựng"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: afterFilter }}
                  />
                  <Box sx={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                    <img
                      src={sourceImage}
                      alt="Ảnh trước khi phục dựng"
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: beforeFilter, display: "block" }}
                    />
                  </Box>
                  <Box sx={{
                    position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: "3px",
                    bgcolor: "#fff", boxShadow: "0 0 8px rgba(0,0,0,0.5)", transform: "translateX(-1.5px)",
                    display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
                  }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: "50%", bgcolor: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-subtle)",
                    }}>
                      <CompareArrowsIcon sx={{ fontSize: 18, color: "var(--color-text)" }} />
                    </Box>
                  </Box>
                  <input
                    type="range" min={0} max={100} value={sliderPos}
                    onChange={(e) => setSliderPos(Number(e.target.value))}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", margin: 0 }}
                    aria-label="So sánh trước và sau"
                  />
                  <Chip label="Trước" size="small" sx={{ position: "absolute", top: 10, left: 10, bgcolor: "rgba(0,0,0,0.55)", color: "#fff", fontWeight: 700 }} />
                  <Chip label="Sau" size="small" sx={{ position: "absolute", top: 10, right: 10, bgcolor: "var(--color-primary)", color: "#fff", fontWeight: 700 }} />
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1.5, mt: 2.5, flexWrap: "wrap", justifyContent: "center" }}>
                {stage === "idle" && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AutoFixHighIcon />}
                    onClick={handleRestore}
                    sx={{ bgcolor: "var(--color-primary)", "&:hover": { bgcolor: "var(--color-secondary)" }, borderRadius: "var(--radius-md)", px: 3 }}
                  >
                    Phục dựng ngay
                  </Button>
                )}
                {stage === "done" && (
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    sx={{ bgcolor: "var(--color-primary)", "&:hover": { bgcolor: "var(--color-secondary)" }, borderRadius: "var(--radius-md)" }}
                  >
                    Tải ảnh về
                  </Button>
                )}
                {stage !== "processing" && (
                  <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon />}
                    onClick={handleReset}
                    sx={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-subtle)", color: "var(--color-text)" }}
                  >
                    Chọn ảnh khác
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      {/* ── Example templates ── */}
      <Box sx={{ py: { xs: 4, md: 6 }, background: "var(--color-surface)" }}>
        <Container maxWidth="md">
          <Typography variant="h5" sx={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", textAlign: "center", mb: 0.5 }}>
            Chưa có ảnh? Thử ngay với ảnh mẫu
          </Typography>
          <Typography sx={{ color: "var(--color-text-subtle)", textAlign: "center", mb: 3, fontSize: "0.9rem" }}>
            Bấm vào một ảnh mẫu bên dưới để xem thử hiệu ứng phục dựng
          </Typography>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
          }}>
            {EXAMPLES.map((example) => (
              <Box
                key={example.id}
                className="restore-example-card"
                onClick={() => handleExampleClick(example)}
                sx={{
                  position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden",
                  cursor: "pointer", aspectRatio: "3/4", boxShadow: "var(--shadow-subtle)",
                }}
              >
                <img
                  src={example.img}
                  alt={example.label}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: OLD_FILTER, display: "block" }}
                />
                <Box className="restore-example-overlay" sx={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Chip
                    icon={<AutoFixHighIcon sx={{ color: "#fff !important" }} />}
                    label="Dùng ảnh này"
                    sx={{ bgcolor: "var(--color-primary)", color: "#fff", fontWeight: 700 }}
                  />
                </Box>
                <Typography sx={{
                  position: "absolute", bottom: 0, left: 0, right: 0, p: 1,
                  color: "#fff", fontSize: "0.78rem", fontWeight: 600,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.65))",
                }}>
                  {example.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Gallery — 3D carousel "đã phục dựng" showcase ── */}
      <Box sx={{ py: { xs: 5, md: 7 }, background: "var(--color-background)", overflow: "hidden" }}>
        <Container maxWidth="md">
          <Typography variant="h5" sx={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", textAlign: "center", mb: 0.5 }}>
            Thư viện ảnh đã phục dựng
          </Typography>
          <Typography sx={{ color: "var(--color-text-subtle)", textAlign: "center", mb: 0.5, fontSize: "0.9rem" }}>
            Một vài ảnh minh hoạ đã được cộng đồng phục dựng gần đây
          </Typography>
          <Typography sx={{ color: "var(--color-subtle)", textAlign: "center", mb: 3, fontSize: "0.78rem", fontStyle: "italic" }}>
            🖱️ Kéo để xoay vòng quay · Bấm vào một ảnh để xoay ảnh đó ra phía trước
          </Typography>

          <Box
            ref={carouselRef}
            className="restore-carousel-viewport"
            {...carouselHandlers}
          >
            <Box className="restore-carousel-floor" />
            <Box className="restore-carousel-stage">
              {ORBIT_PHOTOS.map((src, i) => {
                const itemAngle = (360 / ORBIT_PHOTOS.length) * i;
                const totalAngle = carouselRotation + itemAngle;
                const totalRad = (totalAngle * Math.PI) / 180;
                const depth = Math.cos(totalRad); // 1 = gần nhất, -1 = xa nhất
                const scale = 0.62 + 0.38 * ((depth + 1) / 2);
                const opacity = 0.35 + 0.65 * ((depth + 1) / 2);
                return (
                  <Box
                    key={src}
                    className="restore-carousel-item"
                    style={{
                      // Xoay tới vị trí trên vòng tròn rồi xoay ngược lại đúng góc đó
                      // để ảnh luôn "billboard" hướng về người xem (không bị xoay cạnh/úp mặt sau).
                      transform: `rotateY(${totalAngle}deg) translateZ(${CAROUSEL_RADIUS}px) rotateY(${-totalAngle}deg) scale(${scale})`,
                      opacity,
                      zIndex: Math.round((depth + 1) * 500),
                    }}
                  >
                    <Box
                      className="restore-carousel-card"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => handleCarouselItemClick(i)}
                    >
                      <img src={src} alt="" loading="lazy" />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default PhotoRestore;
