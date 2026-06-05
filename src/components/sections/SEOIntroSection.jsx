import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Container, Typography, Box, Grid, Paper, Chip, Stack } from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import ForestIcon from "@mui/icons-material/Forest";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ExploreIcon from "@mui/icons-material/Explore";

const HIGHLIGHTS = [
  {
    icon: <AccountBalanceIcon />,
    title: "Di tích lịch sử",
    items: ["Miếu bà chúa xứ núi sam", "Lăng thoại ngọc hầu", "Tây an cổ tự", "Nhà mồ ba chúc"],
    color: "#7c3aed",
    bg: "#f5f3ff",
    to: "/places",
  },
  {
    icon: <ForestIcon />,
    title: "Hệ sinh thái",
    items: ["Rừng tràm trà sư", "Cánh đồng ngập nước", "Khu vực bảo tồn thiên nhiên", "Hệ thống sông ngòi"],
    color: "#059669",
    bg: "#ecfdf5",
    to: "/places",
  },
  {
    icon: <PlaceIcon />,
    title: "Công trình kiến trúc",
    items: ["Còn được gọi là 'đất Phật'", "Khu vực núi Sam", "Long Xuyên tỉnh An Giang", "Thành phố Long Xuyên"],
    color: "#d97706",
    bg: "#fffbeb",
    to: "/places",
  },
  {
    icon: <ExploreIcon />,
    title: "Văn hóa và Hoạt động",
    items: ["Lễ hội vía bà", "Ẩm thực đặc biệt", "Nông nghiệp truyền thống", "Làng nghề địa phương"],
    color: "#0284c7",
    bg: "#f0f9ff",
    to: "/news",
  },
];

const TAGS = [
  "An Giang còn có", "Được mệnh danh là", "Việt Nam", "Hệ sinh thái",
  "Di tích lịch sử", "Khu vực", "Hoạt động", "Văn hóa và",
];

export default function SEOIntroSection() {
  return (
    <Box
      component="section"
      aria-label="Giới thiệu An Giang"
      sx={{ py: { xs: 5, md: 8 }, bgcolor: "background.default" }}
    >
      <Container maxWidth="lg">
        {/* Section heading – contains target keyword for h2 */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            component="h2"
            variant="h4"
            sx={{ fontFamily: "var(--font-display)", fontWeight: 800, mb: 1.5 }}
          >
            Khám phá An Giang – Vùng đất giàu bản sắc
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 720, mx: "auto", lineHeight: 1.8 }}
          >
            An Giang còn có nhiều di tích lịch sử, công trình kiến trúc và hệ sinh thái độc đáo
            được mệnh danh là điểm đến không thể bỏ lỡ tại miền Tây Việt Nam.
            Phú Tân – nằm trong tỉnh An Giang – là một trong những địa phương
            mang đậm văn hóa và bản sắc của vùng sông nước.
          </Typography>
        </Box>

        {/* Highlight cards */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {HIGHLIGHTS.map((h) => (
            <Grid item xs={12} sm={6} md={3} key={h.title}>
              <Paper
                component={RouterLink}
                to={h.to}
                elevation={0}
                sx={{
                  display: "block",
                  textDecoration: "none",
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: h.bg,
                  border: `1px solid ${h.color}22`,
                  height: "100%",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: `0 8px 24px ${h.color}22` },
                }}
              >
                <Box sx={{ color: h.color, mb: 1 }}>{h.icon}</Box>
                <Typography
                  component="h3"
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: h.color, mb: 1 }}
                >
                  {h.title}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {h.items.map((item) => (
                    <Typography
                      key={item}
                      component="li"
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5, lineHeight: 1.5 }}
                    >
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Rich descriptive paragraph – semantic keyword coverage */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            bgcolor: "var(--color-surface)",
            mb: 4,
          }}
        >
          <Typography
            component="h3"
            variant="h6"
            sx={{ fontWeight: 700, mb: 2, fontFamily: "var(--font-display)" }}
          >
            An Giang – Được mệnh danh là vùng đất thiêng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
            Tỉnh <strong>An Giang</strong> là một trong những tỉnh lớn nhất vùng đồng bằng sông Cửu Long,
            Việt Nam. <strong>Thành phố Long Xuyên</strong> – tỉnh lỵ của An Giang – là trung tâm kinh tế,
            văn hóa và hành chính của cả vùng. <strong>An Giang còn có</strong> nhiều điểm đến nổi bật như
            <strong> miếu bà chúa xứ núi sam</strong> – công trình kiến trúc tâm linh còn được gọi là biểu
            tượng của vùng đất này, thu hút hàng triệu du khách mỗi năm.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9, mb: 2 }}>
            Về <strong>di tích lịch sử</strong>, An Giang sở hữu <strong>lăng thoại ngọc hầu</strong>,
            <strong> tây an cổ tự</strong>, và <strong>nhà mồ ba chúc</strong> – những địa danh mang đậm
            dấu ấn lịch sử và văn hóa của dân tộc. Về <strong>hệ sinh thái</strong>,{" "}
            <strong>rừng tràm trà sư</strong> là khu vực bảo tồn thiên nhiên hiếm có với hệ thống
            sinh thái ngập nước phong phú, nơi cư trú của hàng trăm loài chim quý hiếm.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
            <strong>Phú Tân</strong> – <strong>Long Xuyên tỉnh An Giang</strong> – là một trong những
            địa phương năng động với hoạt động nông nghiệp sầm uất, đặc biệt là sản xuất lúa và
            nuôi trồng thủy sản. Trang tin <em>Tất tần tật 67K1</em> tổng hợp đầy đủ thông tin về
            văn hóa và các hoạt động địa phương, giúp kết nối cộng đồng và quảng bá hình ảnh
            của vùng đất An Giang đến bạn bè trong và ngoài nước.
          </Typography>
        </Paper>

        {/* Semantic keyword tags */}
        <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
          {TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.75rem", color: "text.secondary" }}
            />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
