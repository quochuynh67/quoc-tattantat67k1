// src/pages/SectionList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Rating,
  Snackbar,
  Alert as MuiAlert,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getSectionItems, getSectionItemsSync } from "../lib/phuTanApi";
import { CardSkeletonGrid, AlertSkeleton } from "../components/CardSkeleton";
import { HealthCard } from "../components/HealthCard";
import AgentChat from "../components/AgentChat";
import { useSiteSettings } from "../contexts/SiteSettingsContext";

const sectionConfig = {
  news: {
    title: "Tin tức địa phương",
    description: "Toàn bộ sự kiện, hoạt động cộng đồng và thông tin mới nhất tại Phú Tân.",
    kind: "news",
  },
  places: {
    title: "Địa điểm nổi bật",
    description: "Những điểm đến không thể bỏ qua, từ di tích lịch sử đến cảnh quan thiên nhiên.",
    kind: "places",
  },
  food: {
    title: "Ẩm thực đặc sắc",
    description: "Khám phá hương vị độc đáo và các món ăn truyền thống của người dân địa phương.",
    kind: "food",
  },
  beautyHealth: {
    title: "Làm đẹp & Sức khỏe",
    description: "Các dịch vụ spa, phòng khám và mẹo vặt chăm sóc cơ thể tốt nhất tại Phú Tân.",
    kind: "beautyHealth",
  },
  agriculture: {
    title: "Nông nghiệp & Phát triển nông thôn",
    description: "Cập nhật kỹ thuật canh tác, thông tin mùa vụ và mô hình nông nghiệp hiệu quả.",
    kind: "agriculture",
  },
  health: {
    title: "Cảnh báo dịch bệnh",
    description: "Thông báo y tế khẩn cấp, cập nhật tình hình dịch bệnh và các biện pháp phòng ngừa.",
    kind: "health",
  },
};

const getTitle = (item, kind) => {
  if (kind === "place" || kind === "food" || kind === "beautyHealth") return item.name;
  return item.title;
};

const getDescription = (item, kind) => {
  if (kind === "news") return item.excerpt;
  if (kind === "health") return item.content;
  return item.description;
};

const SectionList = ({ sectionKey }) => {
  const params = useParams();
  const navigate = useNavigate();
  const key = sectionKey || params.section;
  const { canChatWithAi } = useSiteSettings();
  const section = sectionConfig[key];
  const [items, setItems] = useState(() => getSectionItemsSync(key) ?? []);
  const [loading, setLoading] = useState(() => getSectionItemsSync(key) === null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!section) return;
    let isMounted = true;

    getSectionItems(key).then((data) => {
      if (isMounted) { setItems(data); setLoading(false); }
    });

    return () => {
      isMounted = false;
    };
  }, [key, section]);

  const pageSection = useMemo(() => (section ? { ...section, items } : section), [section, items]);

  if (!pageSection) {
    return (
      <Container maxWidth={false} className="section-container list-page">
        <Typography variant="h4" component="h1" sx={{ fontFamily: "var(--font-display)", color: "var(--color-text)", mb: 2 }}>
          Chưa có dữ liệu
        </Typography>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} variant="contained">
          Quay lại trang chủ
        </Button>
      </Container>
    );
  }

  return (
    <main className="list-page">
      <Container maxWidth={false} className="section-container">
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} className="list-back-link">
          Trang chủ
        </Button>
        <Typography variant="h3" component="h1" className="list-page-title">
          {pageSection.title}
        </Typography>
        <Typography className="list-page-description">
          {pageSection.description}
        </Typography>

        {loading ? (
          pageSection.kind === "health"
            ? <AlertSkeleton count={4} />
            : <CardSkeletonGrid count={6} hasRating={pageSection.kind === "food" || pageSection.kind === "beautyHealth"} hasChip={pageSection.kind === "beautyHealth"} />
        ) : pageSection.kind === "health" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {pageSection.items.map((item) => (
              <HealthCard key={item.id} item={item} showDesc={true} />
            ))}
          </Box>
        ) : (
          <Box className="list-card-grid">
            {pageSection.items.map((item) => (
              <Card key={item.id} className="list-card" elevation={2} component={RouterLink} to={`/post-detail/${item.id}`} sx={{ cursor: 'pointer', textDecoration: 'none' }}>
                <CardMedia
                  component="img"
                  image={item.image}
                  alt={getTitle(item, pageSection.kind)}
                  className="list-card-media"
                />
                <CardContent className="list-card-content">
                  {item.severity && (
                    <Box sx={{ mb: 1 }}>
                      {item.severity === "urgent" && <span className="severity-badge urgent">Khẩn cấp</span>}
                      {item.severity === "warning" && <span className="severity-badge warning">Quan trọng</span>}
                      {item.severity === "normal" && <span className="severity-badge normal">Bình thường</span>}
                    </Box>
                  )}
                  <Typography variant="h6" component="h2" className="list-card-title">
                    {getTitle(item, pageSection.kind)}
                  </Typography>
                  <Typography className="list-card-description">
                    {getDescription(item, pageSection.kind)}
                  </Typography>
                  {pageSection.kind === "beautyHealth" && (
                    <Typography variant="caption" sx={{ color: "var(--color-primary)", fontWeight: 800, mt: "auto" }}>
                      {item.category} · {item.address}
                    </Typography>
                  )}
                  {(pageSection.kind === "food" || pageSection.kind === "beautyHealth") && (
                    <Box sx={{ display: "flex", alignItems: "center", mt: "auto" }}>
                      <Rating value={item.rating || 0} precision={0.5} readOnly size="small" />
                      <Typography variant="body2" sx={{ ml: 1, color: "var(--color-primary)", fontWeight: 800 }}>
                        {item.rating || 0}
                      </Typography>
                    </Box>
                  )}
                  {pageSection.kind === "news" && (
                    <Typography variant="caption" sx={{ color: "var(--color-text-subtle)", mt: "auto" }}>
                      {new Date(item.date).toLocaleDateString("vi-VN")}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
      <Snackbar open={toastOpen} autoHideDuration={3000} onClose={() => setToastOpen(false)}>
        <MuiAlert severity="error" sx={{ width: '100%' }} onClose={() => setToastOpen(false)}>
          {toastMessage}
        </MuiAlert>
      </Snackbar>
      {canChatWithAi && <AgentChat section={key} />}
    </main>
  );
};

export default SectionList;
