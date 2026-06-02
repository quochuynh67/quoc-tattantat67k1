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
import { mockAgriculture, mockBeautyHealth, mockFood, mockHealth, mockNews, mockPlaces } from "../mocks/data";
import { getSectionItems } from "../lib/phuTanApi";

const sectionConfig = {
  news: {
    title: "Tin tức địa phương",
    description: "Toàn bộ sự kiện, hoạt động cộng đồng và thông tin mới nhất tại huyện Phú Tân.",
    items: mockNews,
    kind: "news",
  },
  places: {
    title: "Địa điểm nổi bật",
    description: "Khám phá đầy đủ các địa danh, điểm đến và không gian trải nghiệm tại Phú Tân.",
    items: mockPlaces,
    kind: "place",
  },
  food: {
    title: "Ẩm thực địa phương",
    description: "Danh sách món ngon, đặc sản và trải nghiệm ẩm thực nên thử khi ghé Phú Tân.",
    items: mockFood,
    kind: "food",
  },
  beautyHealth: {
    title: "Làm đẹp & Sức khỏe",
    description: "Danh sách spa, hair salon và dịch vụ trị liệu giúp chăm sóc vẻ ngoài, thư giãn và phục hồi năng lượng.",
    items: mockBeautyHealth,
    kind: "beautyHealth",
  },
  agriculture: {
    title: "Nông nghiệp & Phát triển nông thôn",
    description: "Các mô hình, dự án và sáng kiến đang thúc đẩy nông nghiệp địa phương.",
    items: mockAgriculture,
    kind: "agriculture",
  },
  health: {
    title: "Sức khỏe & Y tế",
    description: "Thông báo y tế, cảnh báo dịch bệnh và nguồn lực chăm sóc sức khỏe cộng đồng.",
    items: mockHealth,
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
  const section = sectionConfig[key];
  const [items, setItems] = useState(section?.items || []);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!section) return;
    let isMounted = true;

    getSectionItems(key).then((data) => {
      if (isMounted) setItems(data);
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
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} className="list-back-link">
          Trang chủ
        </Button>
        <Typography variant="h3" component="h1" className="list-page-title">
          {pageSection.title}
        </Typography>
        <Typography className="list-page-description">
          {pageSection.description}
        </Typography>

        {pageSection.kind === "health" ? (
          <Box className="list-alert-grid">
            {pageSection.items.map((item) => (
              <Alert
                key={item.id}
                severity={item.severity || "info"}
                className="list-health-alert"
                component={RouterLink}
                to={`/post-detail/${item.id}`}
                sx={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                <AlertTitle sx={{ fontWeight: 800 }}>{item.title}</AlertTitle>
                {item.content || item.description}
              </Alert>
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
    </main>
  );
};

export default SectionList;
