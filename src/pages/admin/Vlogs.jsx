// src/pages/admin/Vlogs.jsx
import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, FormControlLabel, Switch, Divider, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { getVlogs, createVlog, updateVlog, deleteVlog, getSections, uploadVlogFile, uploadHlsFolder, uploadTimelineImage, supabase } from "../../lib/supabaseClient";

const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function AdminVlogs() {
  const [vlogs, setVlogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Media source modes: 'file' or 'url'
  const [videoSourceMode, setVideoSourceMode] = useState("url");
  const [posterSourceMode, setPosterSourceMode] = useState("url");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFolderFiles, setPendingFolderFiles] = useState(null);
  const [originalDuration, setOriginalDuration] = useState("");

  const videoRef = useRef(null);

  // Vlog Form State
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    video_url: "",
    poster_url: "",
    host: "",
    duration_label: "",
    content_item_id: "",
    is_published: true,
    display_order: 0,
  });

  // Timeline locations (giai đoạn) state inside dialog
  const [locations, setLocations] = useState([]);

  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPostId, setFilterPostId] = useState("");

  const fetchVlogs = async () => {
    try {
      const data = await getVlogs();
      setVlogs(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPostsAndSections = async () => {
    try {
      // Fetch all posts (content_items) to allow linking
      const { data, error } = await supabase.from("content_items").select("id, title");
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchVlogs();
    fetchPostsAndSections();
  }, []);

  const openEdit = (vlog) => {
    setEditing(vlog.id);
    setOriginalDuration(vlog.duration_label || "");
    setForm({
      title: vlog.title || "",
      subtitle: vlog.subtitle || "",
      video_url: vlog.video_url || "",
      poster_url: vlog.poster_url || "",
      host: vlog.host || "",
      duration_label: vlog.duration_label || "",
      content_item_id: vlog.content_item_id || "",
      is_published: vlog.is_published !== false,
      display_order: vlog.display_order || 0,
    });

    // Set locations (giai đoạn)
    const sortedLocs = [...(vlog.vlog_locations || [])].sort((a, b) => a.time_seconds - b.time_seconds);
    setLocations(sortedLocs);

    setVideoSourceMode("url");
    setPosterSourceMode("url");
    setOpen(true);
  };

  const resetForm = () => {
    setOriginalDuration("");
    setForm({
      title: "",
      subtitle: "",
      video_url: "",
      poster_url: "",
      host: "",
      duration_label: "",
      content_item_id: "",
      is_published: true,
      display_order: 0,
    });
    setLocations([]);
    setPendingFolderFiles(null);
    setVideoSourceMode("url");
    setPosterSourceMode("url");
  };

  // Video File upload handler
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const publicUrl = await uploadVlogFile(file, "videos");
      setForm((prev) => ({ ...prev, video_url: publicUrl }));
    } catch (err) {
      console.error(err);
      alert("Lỗi tải video lên: " + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  // Poster File upload handler
  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPoster(true);
    try {
      const publicUrl = await uploadVlogFile(file, "posters");
      setForm((prev) => ({ ...prev, poster_url: publicUrl }));
    } catch (err) {
      console.error(err);
      alert("Lỗi tải ảnh poster lên: " + err.message);
    } finally {
      setUploadingPoster(false);
    }
  };

  // Milestone Image upload handler
  const handleMilestoneImageUpload = (index, file) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setLocations((prev) =>
      prev.map((loc, i) => (i === index ? { ...loc, image_url: localUrl, pending_image_file: file } : loc))
    );
  };

  // Location array helpers
  const addLocationRow = () => {
    setLocations((prev) => [
      ...prev,
      {
        time_seconds: 0,
        name: "",
        note: "",
        image_url: "",
        latitude: "",
        longitude: "",
      },
    ]);
  };

  const removeLocationRow = (index) => {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLocationField = (index, field, value) => {
    setLocations((prev) =>
      prev.map((loc, i) => (i === index ? { ...loc, [field]: value } : loc))
    );
  };

  const handleSubmit = async () => {
    if (!form.title || (!form.video_url && !pendingFolderFiles)) {
      alert("Vui lòng điền tiêu đề và đường dẫn/thư mục video!");
      return;
    }

    setIsSubmitting(true);
    let finalVideoUrl = form.video_url;

    if (pendingFolderFiles) {
      setUploadProgress(0);
      try {
        finalVideoUrl = await uploadHlsFolder(pendingFolderFiles, (uploaded, total) => {
          setUploadProgress(Math.round((uploaded / total) * 100));
        });
        setForm(prev => ({ ...prev, video_url: finalVideoUrl }));
        setPendingFolderFiles(null);
      } catch (e) {
        console.error(e);
        alert("Lỗi tải thư mục HLS lên: " + e.message);
        setIsSubmitting(false);
        return;
      }
    }

    // Sort locations by time_seconds before saving
    const sortedLocations = [...locations].sort((a, b) => Number(a.time_seconds) - Number(b.time_seconds));

    // Upload any pending timeline stage images
    for (let i = 0; i < sortedLocations.length; i++) {
      if (sortedLocations[i].pending_image_file) {
        try {
          const publicUrl = await uploadTimelineImage(sortedLocations[i].pending_image_file);
          sortedLocations[i].image_url = publicUrl;
          delete sortedLocations[i].pending_image_file;
        } catch (e) {
          console.error(e);
          alert("Lỗi tải ảnh giai đoạn lên: " + e.message);
          setIsSubmitting(false);
          return;
        }
      }
    }

    const vlogPayload = {
      title: form.title,
      subtitle: form.subtitle || null,
      video_url: finalVideoUrl,
      poster_url: form.poster_url || null,
      host: form.host || null,
      duration_label: form.duration_label || null,
      content_item_id: form.content_item_id || null,
      is_published: form.is_published,
      display_order: Number(form.display_order) || 0,
    };

    try {
      if (editing) {
        await updateVlog(editing, vlogPayload, sortedLocations);
      } else {
        await createVlog(vlogPayload, sortedLocations);
      }
      resetForm();
      setOpen(false);
      fetchVlogs();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu Vlog: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Vlog này cùng tất cả giai đoạn của nó?")) return;
    try {
      await deleteVlog(id);
      fetchVlogs();
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered Vlogs List
  const filteredVlogs = vlogs.filter((vlog) => {
    const matchesSearch = (vlog.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (vlog.subtitle || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPost = filterPostId ? vlog.content_item_id === filterPostId : true;
    return matchesSearch && matchesPost;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Vlogs Management
      </Typography>

      {/* Filter and Control Bar */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <TextField
          label="Tìm kiếm vlog..."
          placeholder="Tìm theo tiêu đề hoặc phụ đề..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: "220px" }}
        />
        
        <FormControl size="small" sx={{ minWidth: "200px" }}>
          <InputLabel id="filter-post-label">Lọc theo bài viết</InputLabel>
          <Select
            labelId="filter-post-label"
            label="Lọc theo bài viết"
            value={filterPostId}
            onChange={(e) => setFilterPostId(e.target.value)}
          >
            <MenuItem value=""><em>Tất cả</em></MenuItem>
            {posts.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={() => { setEditing(null); resetForm(); setOpen(true); }}
          sx={{ px: 3, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600, height: "40px" }}
        >
          Add Vlog
        </Button>
      </Paper>

      {/* Vlogs List Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Vlog Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Host</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Linked Post</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Timeline Stages</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, pr: 3 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVlogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  Không tìm thấy vlog nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredVlogs.map((vlog) => (
                <TableRow key={vlog.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {vlog.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {vlog.subtitle}
                    </Typography>
                  </TableCell>
                  <TableCell>{vlog.host || "N/A"}</TableCell>
                  <TableCell>
                    {posts.find(p => p.id === vlog.content_item_id)?.title || (
                      <Typography variant="caption" color="text.disabled">Không liên kết</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ display: "inline-block", bgcolor: "success.light", color: "success.contrastText", px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: "0.75rem", fontWeight: 600 }}>
                      {vlog.vlog_locations?.length || 0} Giai đoạn
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <IconButton onClick={() => openEdit(vlog)} size="small" color="primary" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(vlog.id)} size="small" color="error" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Main Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editing ? "Hiệu chỉnh Vlog & Giai đoạn" : "Tạo Vlog mới & Thiết lập Giai đoạn"}</DialogTitle>
        <DialogContent sx={{ mt: 1, maxHeight: "75vh" }}>
          <Grid container spacing={3}>
            {/* Left Column: Vlog basic information */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Thông tin cơ bản Vlog
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField label="Tiêu đề Vlog" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth variant="outlined" />
                <TextField label="Phụ đề (Subtitle)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} fullWidth variant="outlined" />
                <TextField label="Người dẫn (Host)" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} fullWidth variant="outlined" />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField 
                      label="Độ dài (Duration)" 
                      placeholder="Tự động lấy từ video" 
                      value={form.duration_label} 
                      disabled 
                      fullWidth 
                      variant="outlined" 
                      color={originalDuration && form.duration_label && originalDuration !== form.duration_label ? "error" : "primary"}
                      sx={originalDuration && form.duration_label && originalDuration !== form.duration_label ? {
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#f44336",
                        }
                      } : {}}
                      helperText={originalDuration && form.duration_label && originalDuration !== form.duration_label ? `Lệch so với DB: ${originalDuration}` : ""}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Thứ tự hiển thị" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} fullWidth variant="outlined" />
                  </Grid>
                </Grid>

                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="post-select-label">Liên kết tới bài viết (Post)</InputLabel>
                  <Select
                    labelId="post-select-label"
                    label="Liên kết tới bài viết (Post)"
                    value={form.content_item_id || ""}
                    onChange={(e) => setForm({ ...form, content_item_id: e.target.value })}
                  >
                    <MenuItem value=""><em>Không liên kết bài viết</em></MenuItem>
                    {posts.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>Video Stream (HLS .m3u8)</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                    Hệ thống tự động đồng bộ hóa đường dẫn video `.mp4` sau khi upload sang luồng truyền phát phân đoạn `.m3u8` để tối ưu hóa tốc độ tải và chống giật lag.
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                    <Button size="small" variant={videoSourceMode === "url" ? "contained" : "outlined"} onClick={() => setVideoSourceMode("url")} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                      Dán Link URL
                    </Button>
                    {/* <Button size="small" variant={videoSourceMode === "file" ? "contained" : "outlined"} onClick={() => setVideoSourceMode("file")} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                      Tải File .mp4 Lên
                    </Button> */}
                    <Button size="small" variant={videoSourceMode === "folder" ? "contained" : "outlined"} onClick={() => setVideoSourceMode("folder")} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                      Tải Thư Mục HLS (.m3u8)
                    </Button>
                  </Box>

                  {videoSourceMode === "url" ? (
                    <TextField
                      label="Video URL (HLS / MP4)"
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  ) : videoSourceMode === "file" ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small" disabled={uploadingVideo} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                          {uploadingVideo ? "Đang xử lý..." : "Chọn File Video"}
                          <input type="file" accept="video/*" hidden onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingVideo(true);
                            try {
                              const publicUrl = await uploadVlogFile(file, "videos");

                              // Trigger local HLS conversion API
                              const sourcePath = publicUrl.split('/public/vlogs-posts/')[1] || publicUrl;
                              try {
                                const res = await fetch('/api/convert-hls', {
                                  method: 'POST',
                                  body: JSON.stringify({ sourcePath })
                                });
                                if (res.ok) {
                                  alert("Tự động convert HLS bằng local script thành công!");
                                }
                              } catch (apiErr) {
                                console.log("Local conversion API unavailable (expected if deployed).");
                              }

                              // Auto-translate to target HLS path .m3u8 matching convert-videos-to-hls.mjs
                              let hlsUrl = publicUrl;
                              if (publicUrl.includes("/public/vlogs-posts/")) {
                                hlsUrl = publicUrl
                                  .replace("/public/vlogs-posts/", "/public/video-hls/")
                                  .replace(/\.mp4$/i, "/index.m3u8");
                              } else {
                                hlsUrl = publicUrl.replace(/\.mp4$/i, "/index.m3u8");
                              }
                              setForm((prev) => ({ ...prev, video_url: hlsUrl }));
                              alert("Đã upload MP4 gốc lên storage. Đường dẫn video tự động tối ưu hóa sang HLS (.m3u8) để tương thích thiết bị di động!");
                            } catch (err) {
                              console.error(err);
                              alert("Lỗi tải video lên: " + err.message);
                            } finally {
                              setUploadingVideo(false);
                            }
                          }} />
                        </Button>
                        <Typography variant="caption" sx={{ color: form.video_url ? "success.main" : "text.secondary", fontWeight: 600 }}>
                          {form.video_url ? "Đã tối ưu sang HLS!" : "Chưa chọn file"}
                        </Typography>
                      </Box>
                      {form.video_url && (
                        <TextField
                          value={form.video_url}
                          disabled
                          size="small"
                          variant="filled"
                          fullWidth
                          label="Target HLS Playback URL"
                          inputProps={{ style: { fontSize: "0.75rem", fontFamily: "monospace" } }}
                        />
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small" disabled={isSubmitting} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                          Chọn Thư Mục HLS
                          <input type="file" webkitdirectory="" directory="" hidden onChange={(e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            setPendingFolderFiles(files);
                            setForm((prev) => ({ ...prev, video_url: `[Sẽ upload ${files.length} files khi Lưu Vlog]` }));
                          }} />
                        </Button>
                        <Typography variant="caption" sx={{ color: pendingFolderFiles ? "warning.main" : form.video_url ? "success.main" : "text.secondary", fontWeight: 600 }}>
                          {pendingFolderFiles ? `Đã chọn thư mục (${pendingFolderFiles.length} files)` : form.video_url ? "Đã có HLS!" : "Chưa chọn thư mục"}
                        </Typography>
                      </Box>
                      {(form.video_url || pendingFolderFiles) && (
                        <TextField
                          value={form.video_url}
                          disabled
                          size="small"
                          variant="filled"
                          fullWidth
                          label="Target HLS Playback URL"
                          inputProps={{ style: { fontSize: "0.75rem", fontFamily: "monospace" } }}
                        />
                      )}
                    </Box>
                  )}
                </Card>

                {/* Poster Source Switcher */}
                <Card variant="outlined" sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>Poster Image</Typography>
                  <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                    <Button size="small" variant={posterSourceMode === "url" ? "contained" : "outlined"} onClick={() => setPosterSourceMode("url")} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                      Dán Link URL
                    </Button>
                    <Button size="small" variant={posterSourceMode === "file" ? "contained" : "outlined"} onClick={() => setPosterSourceMode("file")} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                      Tải File Lên
                    </Button>
                  </Box>
                  {posterSourceMode === "url" ? (
                    <TextField label="Poster URL" value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} fullWidth variant="outlined" size="small" />
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small" disabled={uploadingPoster} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                        {uploadingPoster ? "Đang tải..." : "Tải Poster"}
                        <input type="file" accept="image/*" hidden onChange={handlePosterUpload} />
                      </Button>
                      <Typography variant="caption" sx={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                        {form.poster_url ? "Đã tải lên!" : "Chưa chọn file"}
                      </Typography>
                    </Box>
                  )}
                  {form.poster_url && (
                    <Box sx={{ mt: 1.5, borderRadius: 2, overflow: "hidden", height: "100px", border: "1px solid", borderColor: "divider" }}>
                      <img src={form.poster_url} alt="Poster preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                  )}
                </Card>

                <FormControlLabel
                  control={<Switch checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />}
                  label="Xuất bản công khai Vlog"
                />
              </Box>
            </Grid>

            {/* Right Column: Dynamic Stage Timeline Locations */}
            <Grid item xs={12} md={7}>
              {form.video_url && (
                <Box sx={{ mb: 3, borderRadius: 2, overflow: "hidden", bgcolor: "#000", border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ display: "block", bgcolor: "rgba(255,255,255,0.1)", color: "#fff", p: 1, textAlign: "center" }}>
                    Video Preview (Dùng để canh thời gian cho các giai đoạn)
                  </Typography>
                  <video
                    ref={videoRef}
                    src={form.video_url}
                    controls
                    style={{ width: "100%", display: "block", maxHeight: "350px", objectFit: "contain" }}
                    onLoadedMetadata={(e) => {
                      if (e.target.duration) {
                        setForm((prev) => ({ ...prev, duration_label: formatDuration(e.target.duration) }));
                      }
                    }}
                  />
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                  Các giai đoạn hành trình trong Video
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={addLocationRow} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}>
                  Thêm Giai đoạn
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: "55vh", overflowY: "auto", pr: 1 }}>
                {locations.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 6, border: "2px dashed", borderColor: "divider", borderRadius: 3 }}>
                    Chưa thiết lập giai đoạn nào. Bấm nút "Thêm Giai đoạn" để gắn địa danh hành trình tại các mốc giây tương ứng!
                  </Typography>
                ) : (
                  locations.map((loc, index) => (
                    <Card key={index} variant="outlined" sx={{ borderRadius: 3, position: "relative", overflow: "visible" }}>
                      {/* Absolute delete button at the top right of card */}
                      <IconButton
                        onClick={() => removeLocationRow(index)}
                        size="small"
                        color="error"
                        sx={{ position: "absolute", top: -12, right: -12, bgcolor: "background.paper", boxShadow: "0px 2px 8px rgba(0,0,0,0.12)", border: "1px solid", borderColor: "divider", '&:hover': { bgcolor: "error.light", color: "white" } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>

                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Grid container spacing={2}>

                          {/* Left inputs column (size 8) */}
                          <Grid item xs={12} sm={8}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <Box sx={{ display: "flex", gap: 2 }}>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <TextField
                                    label="Tại giây thứ"
                                    type="number"
                                    value={loc.time_seconds}
                                    onChange={(e) => updateLocationField(index, "time_seconds", e.target.value)}
                                    sx={{ width: "100px" }}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                      if (videoRef.current) {
                                        const currentTime = Math.floor(videoRef.current.currentTime);
                                        updateLocationField(index, "time_seconds", currentTime);
                                      } else {
                                        alert("Vui lòng tải video và bật video preview để lấy mốc thời gian!");
                                      }
                                    }}
                                    sx={{ minWidth: 0, px: 1, borderRadius: 1.5 }}
                                    title="Lấy thời gian hiện tại từ Video Preview"
                                  >
                                    ⏱️
                                  </Button>
                                </Box>
                                <TextField
                                  label="Tên địa điểm / Sự kiện"
                                  value={loc.name}
                                  onChange={(e) => updateLocationField(index, "name", e.target.value)}
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>

                              <TextField
                                label="Mô tả hành trình tại mốc thời gian này"
                                value={loc.note || ""}
                                onChange={(e) => updateLocationField(index, "note", e.target.value)}
                                multiline
                                rows={2}
                                fullWidth
                                size="small"
                                variant="outlined"
                              />

                              <Box sx={{ display: "flex", gap: 2 }}>
                                <TextField
                                  label="Kinh độ (Lat)"
                                  type="number"
                                  inputProps={{ step: 0.000001 }}
                                  value={loc.latitude || ""}
                                  onChange={(e) => updateLocationField(index, "latitude", e.target.value)}
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                />
                                <TextField
                                  label="Vĩ độ (Long)"
                                  type="number"
                                  inputProps={{ step: 0.000001 }}
                                  value={loc.longitude || ""}
                                  onChange={(e) => updateLocationField(index, "longitude", e.target.value)}
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          </Grid>

                          {/* Right Image/Upload column (size 4) */}
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%", justifyContent: "space-between" }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                Ảnh mốc hành trình
                              </Typography>

                              <Box sx={{
                                border: "1px dashed",
                                borderColor: "divider",
                                borderRadius: 2,
                                height: "80px",
                                overflow: "hidden",
                                position: "relative",
                                bgcolor: "action.hover",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}>
                                {loc.image_url ? (
                                  <img src={loc.image_url} alt="Milestone preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <Typography variant="caption" color="text.disabled" sx={{ textAlign: "center", p: 1 }}>
                                    Chưa có ảnh
                                  </Typography>
                                )}
                              </Box>

                              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small" fullWidth sx={{ textTransform: "none", borderRadius: 1.5, py: 0.5 }}>
                                Tải ảnh lên
                                <input type="file" accept="image/*" hidden onChange={(e) => handleMilestoneImageUpload(index, e.target.files?.[0])} />
                              </Button>

                              <TextField
                                placeholder="Dán Link URL ảnh"
                                value={loc.image_url || ""}
                                onChange={(e) => updateLocationField(index, "image_url", e.target.value)}
                                fullWidth
                                size="small"
                                inputProps={{ style: { fontSize: "0.72rem", padding: "6px" } }}
                                variant="outlined"
                              />
                            </Box>
                          </Grid>

                        </Grid>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={() => setOpen(false)} disabled={isSubmitting} sx={{ textTransform: "none", fontWeight: 600 }}>Hủy bỏ</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} variant="contained" sx={{ px: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            {isSubmitting
              ? (pendingFolderFiles ? `Đang upload thư mục HLS... ${uploadProgress}%` : "Đang lưu...")
              : (editing ? "Cập nhật" : "Lưu Vlog")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
