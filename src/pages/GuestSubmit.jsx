// src/pages/GuestSubmit.jsx – Public page for guest post/vlog submission
import React, { useEffect, useState, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Paper, Tabs, Tab, Alert, CircularProgress, Divider, InputAdornment,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import ArticleIcon from "@mui/icons-material/Article";
import VideocamIcon from "@mui/icons-material/Videocam";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { getSections, uploadPostImage, supabase } from "../lib/supabaseClient";

const VN_PHONE_RE = /^(0|\+84)(3[2-9]|5[6-9]|7[0-9]|8[0-9]|9[0-9])\d{7}$/;

const EMPTY_POST = {
  title: "",
  section_slug: "",
  excerpt: "",
  description: "",
  image_url: "",
};

const EMPTY_VLOG = {
  title: "",
  subtitle: "",
  video_url: "",
  poster_url: "",
};

export default function GuestSubmit() {
  const [tab, setTab] = useState(0);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [sections, setSections] = useState([]);
  const [postForm, setPostForm] = useState(EMPTY_POST);
  const [vlogForm, setVlogForm] = useState(EMPTY_VLOG);
  const [imageSourceMode, setImageSourceMode] = useState("url");
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSections().then((data) => setSections(data || [])).catch(() => {});
  }, []);

  const validatePhone = (val) => {
    if (!val) return "Số điện thoại là bắt buộc để định danh người đăng.";
    if (!VN_PHONE_RE.test(val.trim())) return "Số điện thoại không hợp lệ (VD: 0901234567).";
    return "";
  };

  const handleSubmitPost = async () => {
    const phoneErr = validatePhone(phone);
    if (phoneErr) { setPhoneError(phoneErr); return; }
    if (!postForm.title.trim()) { setError("Vui lòng nhập tiêu đề bài viết."); return; }
    if (!postForm.section_slug) { setError("Vui lòng chọn chuyên mục."); return; }

    setLoading(true);
    setError("");
    try {
      let finalImageUrl = postForm.image_url.trim() || null;
      if (pendingImageFile) {
        finalImageUrl = await uploadPostImage(pendingImageFile);
        setPendingImageFile(null);
      }

      const { error: dbErr } = await supabase.from("content_items").insert({
        title: postForm.title.trim(),
        section_slug: postForm.section_slug,
        excerpt: postForm.excerpt.trim() || null,
        description: postForm.description.trim() || null,
        image_url: finalImageUrl,
        hide: true,
        is_featured: false,
        uploader_phone: phone.trim(),
        published_date: new Date().toISOString().split("T")[0],
      });
      if (dbErr) throw dbErr;
      setSuccess(true);
      setPostForm(EMPTY_POST);
    } catch (e) {
      setError("Đã xảy ra lỗi khi gửi bài: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVlog = async () => {
    const phoneErr = validatePhone(phone);
    if (phoneErr) { setPhoneError(phoneErr); return; }
    if (!vlogForm.title.trim()) { setError("Vui lòng nhập tiêu đề video."); return; }
    if (!vlogForm.video_url.trim()) { setError("Vui lòng nhập đường dẫn video."); return; }

    setLoading(true);
    setError("");
    try {
      const { error: dbErr } = await supabase.from("vlog_reviews").insert({
        title: vlogForm.title.trim(),
        subtitle: vlogForm.subtitle.trim() || null,
        video_url: vlogForm.video_url.trim(),
        poster_url: vlogForm.poster_url.trim() || null,
        host: phone.trim(),
        uploader_phone: phone.trim(),
        is_published: false,
        display_order: 0,
      });
      if (dbErr) throw dbErr;
      setSuccess(true);
      setVlogForm(EMPTY_VLOG);
    } catch (e) {
      setError("Đã xảy ra lỗi khi gửi video: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPendingImageFile(file);
    setPostForm((prev) => ({ ...prev, image_url: localUrl }));
  };

  const handleNewSubmit = () => {
    setSuccess(false);
    setError("");
    setPhoneError("");
    setImageSourceMode("url");
    setPendingImageFile(null);
  };

  if (success) {
    return (
      <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
        <Paper elevation={0} variant="outlined" sx={{ p: 5, borderRadius: 4, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Đã gửi thành công!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Bài đăng của bạn đã được ghi nhận và đang chờ admin xem xét. Cảm ơn bạn đã đóng góp nội dung!
          </Typography>
          <Button variant="contained" onClick={handleNewSubmit} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            Đăng thêm bài khác
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", py: 5, px: 2 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Đóng góp nội dung
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Bạn có thể đăng bài viết hoặc chia sẻ video về Phú Tân. Bài sẽ được admin xem xét trước khi hiển thị công khai.
      </Typography>

      {/* Phone field — shared between post and vlog tabs */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: "action.hover" }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Thông tin người đăng
        </Typography>
        <TextField
          label="Số điện thoại *"
          placeholder="0901 234 567"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
          onBlur={() => setPhoneError(validatePhone(phone))}
          error={!!phoneError}
          helperText={phoneError || "Dùng để liên hệ và định danh bạn là người đăng bài."}
          fullWidth
          variant="outlined"
          InputProps={{
            startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>,
          }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setError(""); }}
          sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2 }}
        >
          <Tab icon={<ArticleIcon />} iconPosition="start" label="Bài viết" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab icon={<VideocamIcon />} iconPosition="start" label="Video / Vlog" sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {/* POST TAB */}
          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Tiêu đề bài viết *"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                fullWidth
                variant="outlined"
              />

              <FormControl fullWidth variant="outlined">
                <InputLabel id="section-label">Chuyên mục *</InputLabel>
                <Select
                  labelId="section-label"
                  label="Chuyên mục *"
                  value={postForm.section_slug}
                  onChange={(e) => setPostForm({ ...postForm, section_slug: e.target.value })}
                >
                  <MenuItem value=""><em>Chọn chuyên mục</em></MenuItem>
                  {sections.map((sec) => (
                    <MenuItem key={sec.id} value={sec.slug}>{sec.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Tóm tắt ngắn"
                placeholder="Một vài câu mô tả nội dung chính..."
                value={postForm.excerpt}
                onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                multiline
                rows={2}
                fullWidth
                variant="outlined"
              />

              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>Nội dung bài viết</Typography>
                <ReactQuill
                  theme="snow"
                  value={postForm.description}
                  onChange={(value) => setPostForm({ ...postForm, description: value })}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["blockquote", "code-block"],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                  style={{ height: "220px", marginBottom: "50px" }}
                />
              </Box>

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", display: "block", mb: 1 }}>Hình ảnh bài viết</Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                  <Button size="small" variant={imageSourceMode === "url" ? "contained" : "outlined"} onClick={() => setImageSourceMode("url")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Dán Link URL</Button>
                  <Button size="small" variant={imageSourceMode === "file" ? "contained" : "outlined"} onClick={() => setImageSourceMode("file")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Tải File Lên</Button>
                </Box>
                {imageSourceMode === "url" ? (
                  <TextField
                    label="Link hình ảnh"
                    placeholder="https://..."
                    value={postForm.image_url}
                    onChange={(e) => setPostForm({ ...postForm, image_url: e.target.value })}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small" sx={{ textTransform: "none", borderRadius: 1.5, whiteSpace: "nowrap" }}>
                      Chọn ảnh
                      <input type="file" accept="image/*" hidden onChange={handleImageFilePick} />
                    </Button>
                    <Typography variant="caption" sx={{ color: pendingImageFile ? "warning.main" : "text.secondary" }}>
                      {pendingImageFile ? `${pendingImageFile.name} (sẽ upload khi gửi)` : "Chưa chọn file"}
                    </Typography>
                  </Box>
                )}
                {postForm.image_url && (
                  <Box sx={{ mt: 1.5, borderRadius: 1.5, overflow: "hidden", height: 140, border: "1px solid", borderColor: "divider" }}>
                    <img
                      src={postForm.image_url}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "https://placehold.co/600x140?text=Không+tải+được+ảnh"; }}
                    />
                  </Box>
                )}
              </Paper>

              <Divider />
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmitPost}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.5 }}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArticleIcon />}
              >
                {loading ? "Đang gửi..." : "Gửi bài viết"}
              </Button>
            </Box>
          )}

          {/* VLOG TAB */}
          {tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Tiêu đề video *"
                value={vlogForm.title}
                onChange={(e) => setVlogForm({ ...vlogForm, title: e.target.value })}
                fullWidth
                variant="outlined"
              />

              <TextField
                label="Phụ đề / Mô tả ngắn"
                value={vlogForm.subtitle}
                onChange={(e) => setVlogForm({ ...vlogForm, subtitle: e.target.value })}
                fullWidth
                variant="outlined"
              />

              <TextField
                label="Đường dẫn video *"
                placeholder="https://youtube.com/watch?v=... hoặc link video trực tiếp"
                value={vlogForm.video_url}
                onChange={(e) => setVlogForm({ ...vlogForm, video_url: e.target.value })}
                fullWidth
                variant="outlined"
                helperText="Dán link YouTube, Facebook Video, hoặc link file video trực tiếp."
              />

              <TextField
                label="Link ảnh thumbnail (tùy chọn)"
                placeholder="https://..."
                value={vlogForm.poster_url}
                onChange={(e) => setVlogForm({ ...vlogForm, poster_url: e.target.value })}
                fullWidth
                variant="outlined"
              />
              {vlogForm.poster_url && (
                <Box sx={{ borderRadius: 2, overflow: "hidden", height: 160, border: "1px solid", borderColor: "divider" }}>
                  <img
                    src={vlogForm.poster_url}
                    alt="poster preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.src = "https://placehold.co/600x160?text=Không+tải+được+ảnh"; }}
                  />
                </Box>
              )}

              <Divider />
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmitVlog}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.5 }}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <VideocamIcon />}
              >
                {loading ? "Đang gửi..." : "Gửi video"}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
