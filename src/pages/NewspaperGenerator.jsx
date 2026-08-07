import React, { useRef, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box, Container, Typography, Button, Paper,
  Grid, useTheme, useMediaQuery, TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Chip
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DownloadIcon from "@mui/icons-material/Download";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import StyleIcon from "@mui/icons-material/Style";
import PaletteIcon from "@mui/icons-material/Palette";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import { toPng } from "html-to-image";
import { useGlobalToast } from "../contexts/ToastContext";
import { generateNewspaperContent } from "../lib/agentApi";

const DEFAULT_CONTENT = {
  vi: {
    newspaperName: "BẢN TIN PHÚ TÂN",
    headline: "MỘT NGÀY ĐÁNG NHỚ TẠI PHÚ TÂN!",
    date: new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    price: "Giá: 5.000 VNĐ",
    subHeading1: "Tin tức chấn động: Sự kiện đặc biệt diễn ra",
    text1: "Hôm nay, một sự kiện vô cùng đặc biệt đã diễn ra tại trung tâm Phú Tân. Người dân địa phương đã không khỏi ngạc nhiên và vui mừng trước sự hiện diện này. Bức ảnh ghi lại khoảnh khắc lịch sử hiếm có mà chúng tôi may mắn ghi nhận được.",
    subHeading2: "Phát triển không ngừng",
    text2: "Bên cạnh sự kiện trên, vùng đất Phú Tân tiếp tục ghi nhận những bước chuyển mình mạnh mẽ trong nông nghiệp và du lịch. Người dân ngày càng hăng hái tham gia vào các hoạt động cộng đồng.",
    sidebarTitle: "TIN NGẮN ĐỊA PHƯƠNG",
    sidebarText: "Sản lượng nông sản Phú Tân đạt kỷ lục mới trong mùa thu hoạch năm nay, hứa hẹn mang lại niềm vui lớn cho bà con nông dân toàn huyện.",
    quote: "“Phú Tân không chỉ là điểm đến, đó là nơi tình yêu và ký ức đơm hoa.”",
    photoCaption: "Khoảnh khắc đáng nhớ được phóng viên ghi nhận tại Phú Tân."
  },
  en: {
    newspaperName: "PHU TAN DAILY TIMES",
    headline: "A HISTORIC & MEMORABLE DAY IN PHU TAN!",
    date: new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    price: "Price: $1.00",
    subHeading1: "Breaking News: Special Event Takes Place",
    text1: "Today, a truly special event took place right in the heart of Phu Tan. Locals were amazed and delighted by this presence. The exclusive photograph captures this rare historical moment.",
    subHeading2: "Continuous Development",
    text2: "In addition to the event, the Phu Tan region continues to see strong transformations in agriculture and tourism with enthusiastic resident participation.",
    sidebarTitle: "LOCAL QUICK FLASH",
    sidebarText: "Agricultural output in Phu Tan reached a new record harvest this season, bringing immense joy to local farmers.",
    quote: "“Phu Tan is not just a destination; it is where love and memories blossom.”",
    photoCaption: "A memorable moment captured on the front line in Phu Tan."
  }
};

const LANG_MAP = {
  vi: "Tiếng Việt",
  en: "English",
  fr: "Français (Pháp)",
  ja: "日本語 (Nhật)",
  ko: "한국어 (Hàn)",
  zh: "中文 (Trung Quốc)"
};

const LAYOUTS = [
  { id: "vintage", name: "📜 Báo Cổ Điển (2 Cột)", desc: "Trang báo truyền thống, phông chữ Serif cổ kính" },
  { id: "broadsheet", name: "📰 Nhật Báo Đa Cột (3 Cột + Tin Ngắn)", desc: "Layout broadsheet rộng với cột tin nhanh bên lề" },
  { id: "hero_photo", name: "🖼️ Tiêu Điểm Ảnh (Hero Photo)", desc: "Ảnh tiêu đề to góc trên, bài viết xếp 2 cột bên dưới" },
  { id: "modern", name: "💻 Báo Mạng Hiện Đại", desc: "Viền màu nổi bật, layout tối giản thanh lịch" },
  { id: "fashion_mag", name: "✨ Tạp Chí Bìa Đẹp", desc: "Ảnh full nền phủ chữ, phong cách thời trang nghệ thuật" },
  { id: "tabloid", name: "🔥 Báo Lá Cải Giật Gân", desc: "Tiêu đề đỏ rực siêu to, khung trích dẫn giật gân" }
];

const THEMES = [
  { id: "parchment", name: "Trang Giấy Cổ", bg: "#f4f1ea", text: "#2a2a2a", border: "#2a2a2a", pattern: 'radial-gradient(#e0d8c3 1px, transparent 1px)' },
  { id: "aged_sepia", name: "Giấy Ố Vàng", bg: "#e8dfc8", text: "#3e2723", border: "#4e342e", pattern: 'radial-gradient(#d7cbaf 1px, transparent 1px)' },
  { id: "clean_white", name: "Trắng Hiện Đại", bg: "#ffffff", text: "#111111", border: "#e2e8f0", pattern: 'none' },
  { id: "dark_editorial", name: "Đêm Huyền Bí", bg: "#181824", text: "#f0f0f5", border: "#33334d", pattern: 'none' },
  { id: "retro_pink", name: "Tạp Chí Retro Pink", bg: "#fff0f5", text: "#4a154b", border: "#e8a7c2", pattern: 'none' }
];

const FONTS = [
  { id: "serif", name: "Serif (Cổ điển)", main: "'Playfair Display', 'Times New Roman', serif", body: "'Lora', 'Times New Roman', serif" },
  { id: "sans", name: "Sans-Serif (Hiện đại)", main: "'Inter', sans-serif", body: "'Inter', sans-serif" },
  { id: "typewriter", name: "Typewriter (Máy đánh chữ)", main: "'Courier New', monospace", body: "'Courier New', monospace" }
];

const ACCENTS = [
  { id: "default", name: "Mặc định", color: "inherit" },
  { id: "red", name: "Đỏ Báo Chí", color: "#b71c1c" },
  { id: "blue", name: "Xanh Hải Quân", color: "#0d47a1" },
  { id: "green", name: "Xanh Lục Bảo", color: "#1b5e20" },
  { id: "gold", name: "Vàng Hoàng Gia", color: "#b78103" }
];

const NewspaperGenerator = () => {
  const [lang, setLang] = useState("vi");
  const [layout, setLayout] = useState("vintage");
  const [paperTheme, setPaperTheme] = useState("parchment");
  const [fontStyle, setFontStyle] = useState("serif");
  const [accentColor, setAccentColor] = useState("default");

  const [imageSrc, setImageSrc] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [content, setContent] = useState(DEFAULT_CONTENT.vi);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const newspaperRef = useRef(null);
  const toast = useGlobalToast();

  const theme = useTheme();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLangChange = (e, val) => {
    if (val) {
      setLang(val);
      if (DEFAULT_CONTENT[val] && !topic) {
        setContent(DEFAULT_CONTENT[val]);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.show("Vui lòng chọn file ảnh", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const COOLDOWN_SECONDS = 30;

  const handleGenerateAI = async () => {
    if (cooldown > 0) {
      toast.show(`Vui lòng chờ ${cooldown} giây nữa!`, "warning");
      return;
    }
    if (!topic.trim()) {
      toast.show("Vui lòng nhập chủ đề bạn muốn viết báo!", "error");
      return;
    }
    setIsGenerating(true);
    try {
      const languageName = LANG_MAP[lang] || "Tiếng Việt";
      const selectedLayoutObj = LAYOUTS.find(l => l.id === layout);
      const layoutName = selectedLayoutObj ? selectedLayoutObj.name : "Báo tiêu chuẩn";
      
      const aiContent = await generateNewspaperContent(topic, languageName, "Tờ báo chuyên nghiệp", layoutName);
      setContent(aiContent);
      toast.show("Tạo nội dung AI thành công!", "success");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      console.error(err);
      toast.show(err.message || "Có lỗi xảy ra khi tạo nội dung", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!newspaperRef.current) return;
    setIsExporting(true);
    
    try {
      const originalMaxWidth = newspaperRef.current.style.maxWidth;
      const originalMaxHeight = newspaperRef.current.style.maxHeight;
      const originalTransform = newspaperRef.current.style.transform;
      
      newspaperRef.current.style.maxWidth = '800px';
      newspaperRef.current.style.width = '800px';
      newspaperRef.current.style.transform = 'none';
      newspaperRef.current.style.maxHeight = 'none';

      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(newspaperRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: false,
        skipFonts: true,
        style: { margin: '0', boxShadow: 'none' }
      });
      
      newspaperRef.current.style.maxWidth = originalMaxWidth;
      newspaperRef.current.style.width = '100%';
      newspaperRef.current.style.transform = originalTransform;
      newspaperRef.current.style.maxHeight = originalMaxHeight;

      const link = document.createElement('a');
      link.download = `newspaper-${layout}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.show("Xuất ảnh thành công!", "success");
    } catch (err) {
      console.error(err);
      toast.show("Có lỗi xảy ra khi xuất ảnh", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Resolve style values
  const currentTheme = THEMES.find(t => t.id === paperTheme) || THEMES[0];
  const currentFont = FONTS.find(f => f.id === fontStyle) || FONTS[0];
  const primaryAccent = accentColor !== "default" ? accentColor : currentTheme.text;

  // Render Layouts
  const renderLayoutContent = () => {
    const commonContainerSx = {
      width: '100%', maxWidth: '800px',
      boxSizing: 'border-box',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      bgcolor: currentTheme.bg,
      color: currentTheme.text,
      backgroundImage: currentTheme.pattern,
      backgroundSize: '20px 20px',
      p: { xs: 1.5, sm: 3, md: 5 },
      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
      border: `1px solid ${currentTheme.border}`,
      transformOrigin: 'top center',
      transition: 'all 0.3s ease',
    };

    switch (layout) {
      case "broadsheet":
        return (
          <Box ref={newspaperRef} sx={commonContainerSx}>
            <Box sx={{ borderBottom: `4px double ${currentTheme.text}`, pb: 2, mb: 2, textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontFamily: currentFont.main, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em', color: primaryAccent, fontSize: { xs: '1.6rem', sm: '2.8rem', md: '4rem' } }}>
                {content.newspaperName}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderTop: `1px solid ${currentTheme.text}`, borderBottom: `1px solid ${currentTheme.text}`, py: 0.5, px: 1, mt: 1, gap: 0.5 }}>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontWeight: 600 }}>VOL. 102 - EDITION #12</Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{content.date}</Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontWeight: 600 }}>{content.price}</Typography>
              </Box>
            </Box>

            <Typography variant="h3" sx={{ fontFamily: currentFont.main, fontWeight: 900, textAlign: 'center', mb: 3, lineHeight: 1.15, fontSize: { xs: '1.3rem', sm: '2.2rem', md: '3.2rem' } }}>
              {content.headline}
            </Typography>

            <Grid container spacing={3}>
              {/* Left Column: Image & Subhead */}
              <Grid item xs={12} md={8}>
                <Box sx={{ border: `1px solid ${currentTheme.text}`, p: 0.5, mb: 2, bgcolor: '#fff' }}>
                  <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {imageSrc ? (
                      <img src={imageSrc} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Typography sx={{ color: '#888', fontStyle: 'italic', fontFamily: currentFont.body }}>[ Image Spotlight ]</Typography>
                    )}
                  </Box>
                  {content.photoCaption && (
                    <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontStyle: 'italic', color: currentTheme.text, mt: 0.5, px: 0.5 }}>
                      📷 {content.photoCaption}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.25rem', fontWeight: 700, mb: 1, color: primaryAccent }}>
                  {content.subHeading1}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '1rem', lineHeight: 1.6, textAlign: 'justify', mb: 2 }}>
                  {content.text1}
                </Typography>
              </Grid>

              {/* Right Column: Sidebar News Flash */}
              <Grid item xs={12} md={4}>
                <Box sx={{ borderLeft: `2px solid ${primaryAccent}`, pl: 2, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontFamily: currentFont.main, fontWeight: 800, textTransform: 'uppercase', color: primaryAccent, mb: 1, fontSize: '1.05rem' }}>
                    📌 {content.sidebarTitle || "TIN NGẮN BÊN LỀ"}
                  </Typography>
                  <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.9rem', lineHeight: 1.5, mb: 3 }}>
                    {content.sidebarText || content.text2}
                  </Typography>

                  {content.quote && (
                    <Box sx={{ borderTop: `1px solid ${currentTheme.text}`, borderBottom: `1px solid ${currentTheme.text}`, py: 2, my: 2, textAlign: 'center' }}>
                      <Typography sx={{ fontFamily: currentFont.main, fontStyle: 'italic', fontSize: '1.05rem', fontWeight: 700 }}>
                        {content.quote}
                      </Typography>
                    </Box>
                  )}

                  <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.1rem', fontWeight: 700, mb: 1, color: primaryAccent }}>
                    {content.subHeading2}
                  </Typography>
                  <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.9rem', lineHeight: 1.5, textAlign: 'justify' }}>
                    {content.text2}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      case "hero_photo":
        return (
          <Box ref={newspaperRef} sx={commonContainerSx}>
            <Typography variant="h2" sx={{ fontFamily: currentFont.main, fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', mb: 2, color: primaryAccent, fontSize: { xs: '1.6rem', sm: '2.8rem', md: '3.8rem' } }}>
              {content.newspaperName}
            </Typography>

            {/* Big Hero Photo at top */}
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: '#ccc', mb: 3, border: `2px solid ${currentTheme.text}`, overflow: 'hidden' }}>
              {imageSrc ? (
                <img src={imageSrc} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ddd' }}>
                  <Typography sx={{ fontFamily: currentFont.main, fontStyle: 'italic', color: '#666', fontSize: { xs: '0.8rem', sm: '1rem' } }}>[ Hero Photo Spotlight ]</Typography>
                </Box>
              )}
              <Box sx={{ position: 'absolute', bottom: 0, inset: 'auto 0 0 0', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', p: { xs: 1, sm: 2 }, color: '#fff' }}>
                <Typography variant="h4" sx={{ fontFamily: currentFont.main, fontWeight: 800, fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' } }}>
                  {content.headline}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.2rem', fontWeight: 700, mb: 1, color: primaryAccent }}>
                  {content.subHeading1}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '1rem', lineHeight: 1.6, textAlign: 'justify' }}>
                  {content.text1}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.2rem', fontWeight: 700, mb: 1, color: primaryAccent }}>
                  {content.subHeading2}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '1rem', lineHeight: 1.6, textAlign: 'justify' }}>
                  {content.text2}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );

      case "fashion_mag":
        return (
          <Box
            ref={newspaperRef}
            sx={{
              width: '100%', maxWidth: '800px', bgcolor: currentTheme.bg, color: currentTheme.text,
              aspectRatio: '3/4', position: 'relative', overflow: 'hidden',
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)", transformOrigin: 'top center',
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              {imageSrc ? (
                <img src={imageSrc} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Box sx={{ width: '100%', height: '100%', bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: '#718096', fontFamily: currentFont.main, fontSize: '1.5rem' }}>[ Upload Cover Image ]</Typography>
                </Box>
              )}
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 100%)' }} />
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 2, sm: 4, md: 5 } }}>
              <Typography variant="h1" sx={{ fontFamily: currentFont.main, fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', color: imageSrc ? '#fff' : primaryAccent, fontSize: { xs: '2rem', sm: '3.8rem', md: '5.5rem' }, letterSpacing: '0.05em', mt: 1 }}>
                {content.newspaperName}
              </Typography>

              <Box sx={{ mt: 'auto', mb: { xs: 2, sm: 4 }, color: imageSrc ? '#fff' : currentTheme.text }}>
                <Typography variant="h2" sx={{ fontFamily: currentFont.main, fontWeight: 800, lineHeight: 1.1, mb: 1.5, fontSize: { xs: '1.3rem', sm: '2.5rem', md: '3.8rem' } }}>
                  {content.headline}
                </Typography>
                <Box sx={{ maxWidth: { xs: '100%', sm: '80%' }, borderLeft: '4px solid', borderColor: primaryAccent, pl: 1.5, py: 0.5 }}>
                  <Typography sx={{ fontFamily: currentFont.body, fontSize: { xs: '0.85rem', sm: '1.1rem' }, fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>
                    {content.subHeading1}
                  </Typography>
                  <Typography sx={{ fontFamily: currentFont.main, fontSize: { xs: '0.8rem', sm: '1rem' }, fontStyle: 'italic', lineHeight: 1.4 }}>
                    {content.text1?.substring(0, 100)}...
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: imageSrc ? 'rgba(255,255,255,0.9)' : currentTheme.text }}>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {content.date}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.85rem', fontWeight: 700 }}>
                  {content.price}
                </Typography>
              </Box>
            </Box>
          </Box>
        );

      case "tabloid":
        return (
          <Box ref={newspaperRef} sx={commonContainerSx}>
            <Box sx={{ bgcolor: primaryAccent !== "inherit" ? primaryAccent : "#b71c1c", color: "#fff", p: { xs: 1.5, sm: 2 }, textTransform: 'uppercase', textAlign: 'center', mb: 2 }}>
              <Typography variant="h2" sx={{ fontFamily: currentFont.main, fontWeight: 900, fontSize: { xs: '1.6rem', sm: '3rem', md: '4.5rem' }, letterSpacing: '0.03em' }}>
                {content.newspaperName}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', fontSize: '0.75rem', mt: 0.5, borderTop: '1px solid rgba(255,255,255,0.3)', pt: 0.5, gap: 0.5 }}>
                <span>{content.date}</span>
                <span>🔥 EXCLUSIVE SPECIAL EDITION</span>
                <span>{content.price}</span>
              </Box>
            </Box>

            <Typography variant="h2" sx={{ fontFamily: currentFont.main, fontWeight: 900, color: primaryAccent !== "inherit" ? primaryAccent : "#b71c1c", textAlign: 'center', textTransform: 'uppercase', mb: 2, lineHeight: 1.05, fontSize: { xs: '1.4rem', sm: '2.5rem', md: '4rem' } }}>
              {content.headline}
            </Typography>

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ border: '3px solid #000', p: 0.5, bgcolor: '#fff', transform: 'rotate(-1deg)' }}>
                  <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: '#eee', overflow: 'hidden' }}>
                    {imageSrc ? (
                      <img src={imageSrc} alt="Tabloid" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#999', fontFamily: currentFont.main }}>[ Sensational Photo ]</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.3rem', fontWeight: 800, mb: 1, textTransform: 'uppercase', color: primaryAccent }}>
                  {content.subHeading1}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '1.05rem', lineHeight: 1.5, mb: 2 }}>
                  {content.text1}
                </Typography>
                {content.quote && (
                  <Box sx={{ bgcolor: '#fff3cd', borderLeft: '5px solid #ffc107', p: 1.5, my: 1, color: '#856404' }}>
                    <Typography sx={{ fontFamily: currentFont.main, fontWeight: 700, fontStyle: 'italic' }}>
                      {content.quote}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case "modern":
        return (
          <Box ref={newspaperRef} sx={commonContainerSx}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', mb: 2, borderBottom: `4px solid ${primaryAccent}`, pb: 1.5, gap: 1 }}>
              <Typography variant="h2" sx={{ fontFamily: currentFont.main, fontWeight: 900, textTransform: 'uppercase', color: primaryAccent, fontSize: { xs: '1.6rem', sm: '2.8rem', md: '3.5rem' } }}>
                {content.newspaperName}
              </Typography>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{content.date}</Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontWeight: 700 }}>{content.price}</Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h3" sx={{ fontFamily: currentFont.main, fontWeight: 900, lineHeight: 1.15, mb: 2, fontSize: { xs: '1.3rem', sm: '2.2rem', md: '3rem' } }}>
                  {content.headline}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.2rem', fontWeight: 700, mb: 1, color: primaryAccent }}>
                  {content.subHeading1}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '1rem', lineHeight: 1.6, mb: 3 }}>
                  {content.text1}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.2rem', fontWeight: 700, mb: 1, color: primaryAccent }}>
                  {content.subHeading2}
                </Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '1rem', lineHeight: 1.6 }}>
                  {content.text2}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ width: '100%', height: '100%', minHeight: '380px', bgcolor: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '12px', border: `1px solid ${currentTheme.border}` }}>
                  {imageSrc ? (
                    <img src={imageSrc} alt="Modern" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Typography sx={{ color: '#a0aec0', fontFamily: currentFont.body, fontWeight: 600 }}>[ Image space ]</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      case "vintage":
      default:
        return (
          <Box ref={newspaperRef} sx={commonContainerSx}>
            <Box sx={{ borderBottom: `3px solid ${currentTheme.text}`, borderTop: `3px solid ${currentTheme.text}`, py: 1.5, mb: 2, textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontFamily: currentFont.main, fontWeight: 900, letterSpacing: '0.03em', textTransform: 'uppercase', mb: 1, color: primaryAccent, fontSize: { xs: '1.6rem', sm: '2.8rem', md: '4rem' } }}>
                {content.newspaperName}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderTop: `1px solid ${currentTheme.text}`, borderBottom: `1px solid ${currentTheme.text}`, py: 0.5, px: 1, gap: 0.5 }}>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontWeight: 600 }}>VOL. 1 - NO. 1</Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{content.date}</Typography>
                <Typography sx={{ fontFamily: currentFont.body, fontSize: '0.75rem', fontWeight: 600 }}>{content.price}</Typography>
              </Box>
            </Box>

            <Typography variant="h3" sx={{ fontFamily: currentFont.main, fontWeight: 800, textAlign: 'center', textTransform: 'uppercase', mb: 3, lineHeight: 1.15, fontSize: { xs: '1.3rem', sm: '2.2rem', md: '3.2rem' } }}>
              {content.headline}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Box sx={{ columnCount: { xs: 1, sm: 2 }, columnGap: '20px', mb: 3 }}>
                  <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.2rem', fontWeight: 700, mb: 2, breakInside: 'avoid', color: primaryAccent }}>
                    {content.subHeading1}
                  </Typography>
                  <Typography sx={{ fontFamily: currentFont.body, fontSize: '1.05rem', lineHeight: 1.6, textAlign: 'justify', mb: 2, textIndent: '2em' }}>
                    <span style={{ fontSize: '3rem', float: 'left', lineHeight: '2.5rem', paddingTop: '0.2rem', paddingRight: '0.3rem', fontWeight: 900, color: primaryAccent }}>{content.text1?.charAt(0)}</span>
                    {content.text1?.substring(1)}
                  </Typography>
                  
                  <Typography sx={{ fontFamily: currentFont.main, fontSize: '1.2rem', fontWeight: 700, mb: 1, mt: 3, breakInside: 'avoid', color: primaryAccent }}>
                    {content.subHeading2}
                  </Typography>
                  <Typography sx={{ fontFamily: currentFont.body, fontSize: '1.05rem', lineHeight: 1.6, textAlign: 'justify', mb: 2 }}>
                    {content.text2}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box sx={{ border: `2px solid ${currentTheme.text}`, p: 1, bgcolor: '#fff', transform: 'rotate(1deg)', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }}>
                  <Box sx={{ width: '100%', aspectRatio: '3/4', bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #ccc' }}>
                    {imageSrc ? (
                      <img src={imageSrc} alt="News" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(80%) contrast(1.1)' }} />
                    ) : (
                      <Typography sx={{ color: '#888', textAlign: 'center', px: 2, fontFamily: currentFont.body, fontStyle: 'italic' }}>Image space</Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Tạo Báo AI – Tự Thiết Kế Bố Cục & Phong Cách</title>
        <meta name="description" content="Tự tạo trang báo riêng của bạn với AI, tùy chỉnh bố cục, phông chữ, màu sắc và ngôn ngữ." />
      </Helmet>

      <Box sx={{ background: "var(--color-background)", minHeight: "100vh", py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", textAlign: "center", mb: 1 }}>
            Xuất Bản Trang Báo Riêng Của Bạn
          </Typography>
          <Typography sx={{ color: "var(--color-text-subtle)", textAlign: "center", mb: 4 }}>
            Tùy biến bố cục, màu giấy, phông chữ và để AI Nhà Báo tự động soạn thảo bài viết!
          </Typography>

          {/* AI & Customization Control Panel */}
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: "var(--radius-lg)", border: "1px solid rgba(0,0,0,0.06)", bgcolor: "var(--color-surface)" }}>
            <Grid container spacing={3}>
              {/* AI Prompt Input */}
              <Grid item xs={12} md={7}>
                <TextField 
                  fullWidth
                  label="Chủ đề bài báo (AI sẽ tự động biên tập theo bố cục bạn chọn)"
                  placeholder="Ví dụ: Đám cưới của tôi, Đội bóng Phú Tân vô địch, Người dân trúng mùa lúa lớn..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  variant="outlined"
                  size="medium"
                  multiline
                  rows={3}
                />
              </Grid>

              {/* Language & Layout Pickers */}
              <Grid item xs={12} sm={6} md={5}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Ngôn ngữ bài báo</InputLabel>
                      <Select value={lang} onChange={(e) => handleLangChange(e, e.target.value)} label="Ngôn ngữ bài báo">
                        {Object.entries(LANG_MAP).map(([key, label]) => (
                          <MenuItem key={key} value={key}>{label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Bố cục trang báo (Layout)</InputLabel>
                      <Select value={layout} onChange={(e) => setLayout(e.target.value)} label="Bố cục trang báo (Layout)">
                        {LAYOUTS.map(l => (
                          <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Custom Styling Controls */}
              <Grid item xs={12}>
                <Box sx={{ borderTop: "1px solid var(--color-border)", pt: 2.5, mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🎨 Tùy chỉnh màu sắc &amp; Phông chữ:
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    {/* Paper Theme */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Màu giấy / Theme</InputLabel>
                        <Select value={paperTheme} onChange={(e) => setPaperTheme(e.target.value)} label="Màu giấy / Theme">
                          {THEMES.map(t => (
                            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Font Family */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Phông chữ (Font)</InputLabel>
                        <Select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)} label="Phông chữ (Font)">
                          {FONTS.map(f => (
                            <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Accent Color */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Màu nhấn (Accent Color)</InputLabel>
                        <Select value={accentColor} onChange={(e) => setAccentColor(e.target.value)} label="Màu nhấn (Accent Color)">
                          {ACCENTS.map(a => (
                            <MenuItem key={a.id} value={a.color}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: a.color === 'inherit' ? '#000' : a.color, border: '1px solid #ccc' }} />
                                {a.name}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Generate Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                    onClick={handleGenerateAI}
                    disabled={isGenerating || cooldown > 0}
                    sx={{
                      borderRadius: "var(--radius-md)",
                      background: cooldown > 0
                        ? "linear-gradient(135deg, #636e72 0%, #b2bec3 100%)"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      fontWeight: 700, px: 4, py: 1.5,
                      position: 'relative', overflow: 'hidden',
                      '&::after': cooldown > 0 ? {
                        content: '""',
                        position: 'absolute', left: 0, bottom: 0,
                        height: '3px',
                        width: `${(cooldown / 30) * 100}%`,
                        bgcolor: 'rgba(255,255,255,0.6)',
                        transition: 'width 1s linear',
                      } : {},
                    }}
                  >
                    {isGenerating
                      ? "AI Nhà Báo đang biên tập..."
                      : cooldown > 0
                        ? `⏳ Chờ ${cooldown}s`
                        : "✨ Biên Tập Bài Báo Bằng AI"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Photo Upload & Export Actions */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", mb: 4 }}>
            <Button
              variant="outlined"
              startIcon={<CameraAltIcon />}
              onClick={() => cameraInputRef.current?.click()}
              sx={{ borderRadius: "var(--radius-md)", bgcolor: "#fff" }}
            >
              Chụp ảnh
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ borderRadius: "var(--radius-md)", bgcolor: "#fff" }}
            >
              Tải ảnh lên
            </Button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleImageChange} />
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={isExporting}
              sx={{ borderRadius: "var(--radius-md)", px: 3 }}
            >
              {isExporting ? "Đang xuất..." : "Xuất File Ảnh PNG"}
            </Button>
          </Box>

          {/* Newspaper Preview Canvas */}
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', overflowX: 'auto', pb: 6, px: { xs: 0, sm: 2 } }}>
            {renderLayoutContent()}
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default NewspaperGenerator;
