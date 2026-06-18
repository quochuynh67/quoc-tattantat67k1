// src/pages/GuestSubmit.jsx – Public page for guest post/vlog submission
import React, { useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Paper, Tabs, Tab, Alert, CircularProgress, Divider, InputAdornment, Card,
  CardContent, Grid, IconButton, Tooltip, Autocomplete,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import ArticleIcon from "@mui/icons-material/Article";
import VideocamIcon from "@mui/icons-material/Videocam";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getSections, uploadGuestPostImage, uploadGuestPosterImage,
  uploadGuestHlsFolder, uploadGuestTimelineImage, supabase,
} from "../lib/supabaseClient";

const VN_PHONE_RE = /^(0|\+84)(3[2-9]|5[6-9]|7[0-9]|8[0-9]|9[0-9])\d{7}$/;

const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const EMPTY_POST = { title: "", section_slug: "", excerpt: "", description: "", image_url: "" };
const EMPTY_VLOG = { title: "", subtitle: "", host: "", video_url: "", poster_url: "", content_item_id: "", duration_label: "" };

export default function GuestSubmit() {
  const [tab, setTab] = useState(0);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [sections, setSections] = useState([]);
  const [posts, setPosts] = useState([]);

  // Post form
  const [postForm, setPostForm] = useState(EMPTY_POST);
  const [imageSourceMode, setImageSourceMode] = useState("url");
  const [pendingImageFile, setPendingImageFile] = useState(null);

  // Vlog form
  const [vlogForm, setVlogForm] = useState(EMPTY_VLOG);
  const [videoSourceMode, setVideoSourceMode] = useState("url");
  const [posterSourceMode, setPosterSourceMode] = useState("url");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingFolderFiles, setPendingFolderFiles] = useState(null);
  const [pendingPosterFile, setPendingPosterFile] = useState(null);
  const [locations, setLocations] = useState([]);
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSections().then((data) => setSections(data || [])).catch(() => {});
    supabase.from("content_items").select("id, title").then(({ data }) => setPosts(data || []));
  }, []);

  const validatePhone = (val) => {
    if (!val) return "Số điện thoại là bắt buộc để định danh người đăng.";
    if (!VN_PHONE_RE.test(val.trim())) return "Số điện thoại không hợp lệ (VD: 0901234567).";
    return "";
  };

  // ── POST submit ──────────────────────────────────────────────────────────
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
        finalImageUrl = await uploadGuestPostImage(pendingImageFile);
        setPendingImageFile(null);
      }
      const { error: dbErr } = await supabase.from("content_items_guest").insert({
        title: postForm.title.trim(),
        section_slug: postForm.section_slug,
        excerpt: postForm.excerpt.trim() || null,
        description: postForm.description.trim() || null,
        image_url: finalImageUrl,
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

  // ── VLOG submit ──────────────────────────────────────────────────────────
  const handleSubmitVlog = async () => {
    const phoneErr = validatePhone(phone);
    if (phoneErr) { setPhoneError(phoneErr); return; }
    if (!vlogForm.title.trim()) { setError("Vui lòng nhập tiêu đề video."); return; }
    if (!vlogForm.video_url.trim() && !pendingFolderFiles) { setError("Vui lòng nhập đường dẫn hoặc chọn thư mục video."); return; }

    setLoading(true);
    setError("");
    try {
      let finalVideoUrl = vlogForm.video_url.trim();

      if (pendingFolderFiles) {
        setUploadProgress(0);
        finalVideoUrl = await uploadGuestHlsFolder(pendingFolderFiles, (uploaded, total) => {
          setUploadProgress(Math.round((uploaded / total) * 100));
        });
        setPendingFolderFiles(null);
      }

      let finalPosterUrl = vlogForm.poster_url.trim() || null;
      if (pendingPosterFile) {
        finalPosterUrl = await uploadGuestPosterImage(pendingPosterFile);
        setPendingPosterFile(null);
      }

      const sortedLocations = [...locations].sort((a, b) => Number(a.time_seconds) - Number(b.time_seconds));
      for (let i = 0; i < sortedLocations.length; i++) {
        if (sortedLocations[i].pending_image_file) {
          sortedLocations[i].image_url = await uploadGuestTimelineImage(sortedLocations[i].pending_image_file);
          delete sortedLocations[i].pending_image_file;
        }
      }

      const { error: dbErr } = await supabase.from("vlog_reviews_guest").insert({
        title: vlogForm.title.trim(),
        subtitle: vlogForm.subtitle.trim() || null,
        video_url: finalVideoUrl,
        poster_url: finalPosterUrl,
        host: vlogForm.host.trim() || phone.trim(),
        duration_label: vlogForm.duration_label || null,
        content_item_id: vlogForm.content_item_id || null,
        uploader_phone: phone.trim(),
        locations_json: sortedLocations.map(({ pending_image_file, ...loc }) => loc),
      });
      if (dbErr) throw dbErr;

      setSuccess(true);
      setVlogForm(EMPTY_VLOG);
      setLocations([]);
      setPendingPosterFile(null);
      setPosterSourceMode("url");
      setVideoSourceMode("url");
    } catch (e) {
      setError("Đã xảy ra lỗi khi gửi video: " + e.message);
    } finally {
      setLoading(false);
      setUploadingPoster(false);
    }
  };

  // ── Location helpers ─────────────────────────────────────────────────────
  const addLocation = () => setLocations((p) => [...p, { time_seconds: 0, name: "", note: "", image_url: "", latitude: "", longitude: "" }]);
  const removeLocation = (i) => setLocations((p) => p.filter((_, idx) => idx !== i));
  const updateLocation = (i, field, value) => setLocations((p) => p.map((loc, idx) => idx === i ? { ...loc, [field]: value } : loc));
  const handleMilestoneImage = (i, file) => {
    if (!file) return;
    setLocations((p) => p.map((loc, idx) => idx === i ? { ...loc, image_url: URL.createObjectURL(file), pending_image_file: file } : loc));
  };

  const handleImageFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    setPostForm((prev) => ({ ...prev, image_url: URL.createObjectURL(file) }));
  };

  const handleNewSubmit = () => {
    setSuccess(false);
    setError("");
    setPhoneError("");
    setImageSourceMode("url");
    setPendingImageFile(null);
    setPosterSourceMode("url");
    setPendingPosterFile(null);
    setVideoSourceMode("url");
    setPendingFolderFiles(null);
    setLocations([]);
  };

  if (success) {
    return (
      <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
        <Paper elevation={0} variant="outlined" sx={{ p: 5, borderRadius: 4, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>Đã gửi thành công!</Typography>
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
    <Box sx={{ maxWidth: 960, mx: "auto", py: 5, px: 2 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Đóng góp nội dung</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Bạn có thể đăng bài viết hoặc chia sẻ video về Phú Tân. Bài sẽ được admin xem xét trước khi hiển thị công khai.
      </Typography>

      {/* Phone field — shared */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: "action.hover" }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Thông tin người đăng</Typography>
        <TextField
          label="Số điện thoại *"
          placeholder="0901 234 567"
          value={phone}
          onChange={(e) => { setPhone(e.target.value.replace(/[^\d+]/g, "")); setPhoneError(""); }}
          inputProps={{ inputMode: "tel", maxLength: 15 }}
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

          {/* ── POST TAB ─────────────────────────────────────────────────── */}
          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Tiêu đề bài viết *"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                fullWidth variant="outlined"
              />
              <FormControl fullWidth variant="outlined">
                <InputLabel id="section-label">Chuyên mục *</InputLabel>
                <Select
                  labelId="section-label" label="Chuyên mục *"
                  value={postForm.section_slug}
                  onChange={(e) => setPostForm({ ...postForm, section_slug: e.target.value })}
                >
                  <MenuItem value=""><em>Chọn chuyên mục</em></MenuItem>
                  {sections.map((sec) => <MenuItem key={sec.id} value={sec.slug}>{sec.title}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Tóm tắt ngắn" placeholder="Một vài câu mô tả nội dung chính..."
                value={postForm.excerpt} onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                multiline rows={2} fullWidth variant="outlined"
              />
              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>Nội dung bài viết</Typography>
                <ReactQuill
                  theme="snow" value={postForm.description}
                  onChange={(value) => setPostForm({ ...postForm, description: value })}
                  modules={{ toolbar: [[{ header: [1, 2, 3, false] }], ["bold", "italic", "underline", "strike"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "link"], ["clean"]] }}
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
                  <TextField label="Link hình ảnh" placeholder="https://..." value={postForm.image_url} onChange={(e) => setPostForm({ ...postForm, image_url: e.target.value })} fullWidth variant="outlined" size="small" />
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small" sx={{ textTransform: "none", borderRadius: 1.5, whiteSpace: "nowrap" }}>
                      Chọn ảnh <input type="file" accept="image/*" hidden onChange={handleImageFilePick} />
                    </Button>
                    <Typography variant="caption" sx={{ color: pendingImageFile ? "warning.main" : "text.secondary" }}>
                      {pendingImageFile ? `${pendingImageFile.name} (sẽ upload khi gửi)` : "Chưa chọn file"}
                    </Typography>
                  </Box>
                )}
                {postForm.image_url && (
                  <Box sx={{ mt: 1.5, borderRadius: 1.5, overflow: "hidden", height: 140, border: "1px solid", borderColor: "divider" }}>
                    <img src={postForm.image_url} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = "https://placehold.co/600x140?text=Không+tải+được+ảnh"; }} />
                  </Box>
                )}
              </Paper>
              <Divider />
              <Button variant="contained" size="large" onClick={handleSubmitPost} disabled={loading}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.5 }}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArticleIcon />}>
                {loading ? "Đang gửi..." : "Gửi bài viết"}
              </Button>
            </Box>
          )}

          {/* ── VLOG TAB ─────────────────────────────────────────────────── */}
          {tab === 1 && (
            <Grid container spacing={3}>
              {/* Left column: basic info + video + poster */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>Thông tin cơ bản</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField label="Tiêu đề video *" value={vlogForm.title} onChange={(e) => setVlogForm({ ...vlogForm, title: e.target.value })} fullWidth variant="outlined" />
                  <TextField label="Phụ đề / Mô tả ngắn" value={vlogForm.subtitle} onChange={(e) => setVlogForm({ ...vlogForm, subtitle: e.target.value })} fullWidth variant="outlined" />
                  <TextField label="Người dẫn (Host)" placeholder="Tên người quay / dẫn chương trình" value={vlogForm.host} onChange={(e) => setVlogForm({ ...vlogForm, host: e.target.value })} fullWidth variant="outlined" />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField label="Độ dài (Duration)" value={vlogForm.duration_label} disabled fullWidth variant="outlined" placeholder="Tự động từ video" />
                    </Grid>
                  </Grid>

                  <Autocomplete
                    options={posts}
                    getOptionLabel={(p) => p.title || ""}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    value={posts.find((p) => p.id === vlogForm.content_item_id) || null}
                    onChange={(_, newVal) => setVlogForm({ ...vlogForm, content_item_id: newVal?.id || "" })}
                    renderInput={(params) => (
                      <TextField {...params} label="Liên kết bài viết (tùy chọn)" variant="outlined" size="small" placeholder="Tìm theo tiêu đề..." />
                    )}
                  />

                  {/* Video source */}
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Video Stream (HLS .m3u8)</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                      Dán link URL hoặc tải thư mục HLS để hỗ trợ phát trực tuyến tối ưu.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                      <Button size="small" variant={videoSourceMode === "url" ? "contained" : "outlined"} onClick={() => setVideoSourceMode("url")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Dán Link URL</Button>
                      <Button size="small" variant={videoSourceMode === "file" ? "contained" : "outlined"} onClick={() => setVideoSourceMode("file")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Tải File .mp4</Button>
                      <Button size="small" variant={videoSourceMode === "folder" ? "contained" : "outlined"} onClick={() => setVideoSourceMode("folder")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Thư mục HLS</Button>
                    </Box>

                    {videoSourceMode === "url" && (
                      <TextField
                        label="Video URL (HLS / MP4)" value={vlogForm.video_url}
                        onChange={(e) => setVlogForm({ ...vlogForm, video_url: e.target.value })}
                        fullWidth variant="outlined" size="small"
                        placeholder="https://..."
                      />
                    )}

                    {videoSourceMode === "file" && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small" disabled={uploadingVideo} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                            {uploadingVideo ? "Đang tải..." : "Chọn File Video"}
                            <input type="file" accept="video/*" hidden onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingVideo(true);
                              try {
                                const publicUrl = await uploadVlogFile(file);
                                setVlogForm((prev) => ({ ...prev, video_url: publicUrl }));
                              } catch (err) {
                                setError("Lỗi tải video lên: " + err.message);
                              } finally {
                                setUploadingVideo(false);
                              }
                            }} />
                          </Button>
                          <Typography variant="caption" sx={{ color: vlogForm.video_url ? "success.main" : "text.secondary", fontWeight: 600 }}>
                            {uploadingVideo ? "Đang upload..." : vlogForm.video_url ? "Đã tải lên!" : "Chưa chọn file"}
                          </Typography>
                        </Box>
                        {vlogForm.video_url && (
                          <TextField value={vlogForm.video_url} disabled size="small" variant="filled" fullWidth label="URL video" inputProps={{ style: { fontSize: "0.75rem", fontFamily: "monospace" } }} />
                        )}
                      </Box>
                    )}

                    {videoSourceMode === "folder" && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small" disabled={loading} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                            Chọn Thư Mục HLS
                            <input type="file" webkitdirectory="" directory="" hidden onChange={(e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              setPendingFolderFiles(files);
                              setVlogForm((prev) => ({ ...prev, video_url: `[Sẽ upload ${files.length} files khi gửi]` }));
                            }} />
                          </Button>
                          <Typography variant="caption" sx={{ color: pendingFolderFiles ? "warning.main" : vlogForm.video_url ? "success.main" : "text.secondary", fontWeight: 600 }}>
                            {pendingFolderFiles ? `Đã chọn (${pendingFolderFiles.length} files)` : vlogForm.video_url ? "Đã có HLS!" : "Chưa chọn"}
                          </Typography>
                        </Box>
                        {loading && uploadProgress > 0 && (
                          <Typography variant="caption" color="primary.main">Đang upload HLS... {uploadProgress}%</Typography>
                        )}
                        {vlogForm.video_url && (
                          <TextField value={vlogForm.video_url} disabled size="small" variant="filled" fullWidth label="Target HLS URL" inputProps={{ style: { fontSize: "0.75rem", fontFamily: "monospace" } }} />
                        )}
                      </Box>
                    )}
                  </Card>

                  {/* Poster */}
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Ảnh thumbnail (tùy chọn)</Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                      <Button size="small" variant={posterSourceMode === "url" ? "contained" : "outlined"} onClick={() => setPosterSourceMode("url")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Dán Link URL</Button>
                      <Button size="small" variant={posterSourceMode === "file" ? "contained" : "outlined"} onClick={() => setPosterSourceMode("file")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Tải File Lên</Button>
                    </Box>
                    {posterSourceMode === "url" ? (
                      <TextField placeholder="https://..." value={vlogForm.poster_url} onChange={(e) => setVlogForm({ ...vlogForm, poster_url: e.target.value })} fullWidth variant="outlined" size="small" />
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small" disabled={uploadingPoster} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                          {uploadingPoster ? "Đang tải..." : "Chọn ảnh"}
                          <input type="file" accept="image/*" hidden onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setPendingPosterFile(file);
                            setVlogForm((prev) => ({ ...prev, poster_url: URL.createObjectURL(file) }));
                          }} />
                        </Button>
                        <Typography variant="caption" sx={{ color: pendingPosterFile ? "warning.main" : "text.secondary" }}>
                          {pendingPosterFile ? `${pendingPosterFile.name} (sẽ upload khi gửi)` : "Chưa chọn file"}
                        </Typography>
                      </Box>
                    )}
                    {vlogForm.poster_url && (
                      <Box sx={{ mt: 1.5, borderRadius: 1.5, overflow: "hidden", height: 100, border: "1px solid", borderColor: "divider" }}>
                        <img src={vlogForm.poster_url} alt="poster preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = "https://placehold.co/600x120?text=Không+tải+được+ảnh"; }} />
                      </Box>
                    )}
                  </Card>
                </Box>
              </Grid>

              {/* Right column: video preview + timeline stages */}
              <Grid size={{ xs: 12, md: 7 }}>
                {vlogForm.video_url && !pendingFolderFiles && !vlogForm.video_url.startsWith("[") && (
                  <Box sx={{ mb: 3, borderRadius: 2, overflow: "hidden", bgcolor: "#000", border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" sx={{ display: "block", bgcolor: "rgba(255,255,255,0.08)", color: "#fff", p: 1, textAlign: "center" }}>
                      Video Preview — dùng để canh thời gian cho các giai đoạn
                    </Typography>
                    <video
                      ref={videoRef}
                      src={vlogForm.video_url}
                      controls
                      style={{ width: "100%", display: "block", maxHeight: "300px", objectFit: "contain" }}
                      onLoadedMetadata={(e) => {
                        if (e.target.duration) {
                          setVlogForm((prev) => ({ ...prev, duration_label: formatDuration(e.target.duration) }));
                        }
                      }}
                    />
                  </Box>
                )}

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>Các giai đoạn hành trình</Typography>
                  <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={addLocation} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}>
                    Thêm giai đoạn
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: "60vh", overflowY: "auto", pr: 0.5 }}>
                  {locations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 5, border: "2px dashed", borderColor: "divider", borderRadius: 3 }}>
                      Chưa có giai đoạn nào. Bấm "Thêm giai đoạn" để gắn địa danh tại các mốc thời gian trong video.
                    </Typography>
                  ) : (
                    locations.map((loc, index) => (
                      <Card key={index} variant="outlined" sx={{ borderRadius: 3, position: "relative", overflow: "visible" }}>
                        <Tooltip title="Xóa giai đoạn" arrow>
                          <IconButton
                            onClick={() => removeLocation(index)} size="small" color="error"
                            sx={{ position: "absolute", top: -12, right: -12, bgcolor: "background.paper", boxShadow: "0px 2px 8px rgba(0,0,0,0.12)", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "error.light", color: "white" } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 8 }}>
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Box sx={{ display: "flex", gap: 1 }}>
                                    <TextField
                                      label="Tại giây thứ" type="number" value={loc.time_seconds}
                                      onChange={(e) => updateLocation(index, "time_seconds", e.target.value)}
                                      sx={{ width: 100 }} size="small" variant="outlined"
                                    />
                                    <Button variant="outlined" size="small" title="Lấy thời gian hiện tại từ video"
                                      onClick={() => {
                                        if (videoRef.current) updateLocation(index, "time_seconds", Math.floor(videoRef.current.currentTime));
                                        else alert("Vui lòng tải video để lấy mốc thời gian!");
                                      }}
                                      sx={{ minWidth: 0, px: 1, borderRadius: 1.5 }}>⏱️</Button>
                                  </Box>
                                  <TextField
                                    label="Tên địa điểm / Sự kiện" value={loc.name}
                                    onChange={(e) => updateLocation(index, "name", e.target.value)}
                                    fullWidth size="small" variant="outlined"
                                  />
                                </Box>
                                <TextField
                                  label="Mô tả tại mốc này" value={loc.note || ""}
                                  onChange={(e) => updateLocation(index, "note", e.target.value)}
                                  multiline rows={2} fullWidth size="small" variant="outlined"
                                />
                                <Box sx={{ display: "flex", gap: 2 }}>
                                  <TextField label="Kinh độ (Lat)" type="number" inputProps={{ step: 0.000001 }} value={loc.latitude || ""} onChange={(e) => updateLocation(index, "latitude", e.target.value)} fullWidth size="small" variant="outlined" />
                                  <TextField label="Vĩ độ (Long)" type="number" inputProps={{ step: 0.000001 }} value={loc.longitude || ""} onChange={(e) => updateLocation(index, "longitude", e.target.value)} fullWidth size="small" variant="outlined" />
                                </Box>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%", justifyContent: "space-between" }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Ảnh mốc hành trình</Typography>
                                <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2, height: 80, overflow: "hidden", bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {loc.image_url ? (
                                    <img src={loc.image_url} alt="milestone" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    <Typography variant="caption" color="text.disabled" sx={{ textAlign: "center", p: 1 }}>Chưa có ảnh</Typography>
                                  )}
                                </Box>
                                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small" fullWidth sx={{ textTransform: "none", borderRadius: 1.5, py: 0.5 }}>
                                  Tải ảnh lên <input type="file" accept="image/*" hidden onChange={(e) => handleMilestoneImage(index, e.target.files?.[0])} />
                                </Button>
                                <TextField
                                  placeholder="Dán Link URL ảnh" value={loc.image_url || ""}
                                  onChange={(e) => updateLocation(index, "image_url", e.target.value)}
                                  fullWidth size="small" inputProps={{ style: { fontSize: "0.72rem", padding: "6px" } }} variant="outlined"
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>

                <Divider sx={{ mt: 3, mb: 2 }} />
                <Button
                  variant="contained" size="large" onClick={handleSubmitVlog}
                  disabled={loading}
                  fullWidth
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.5 }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <VideocamIcon />}
                >
                  {loading
                    ? (pendingFolderFiles ? `Đang upload HLS... ${uploadProgress}%` : "Đang gửi...")
                    : "Gửi video"}
                </Button>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
