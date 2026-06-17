// src/pages/admin/Posts.jsx
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, List, ListItem, ListItemText, Tooltip, Chip, Alert, Tabs, Tab } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { getPostsBySection, createPost, updatePost, deletePost, getSections, uploadPostImage, getVlogByPost, supabase } from "../../lib/supabaseClient";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [sections, setSections] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // Fully mapped database model fields
  const [form, setForm] = useState({
    title: "",
    section_slug: "",
    excerpt: "",
    description: "",
    content: "",
    image_url: "",
    category: "",
    address: "",
    rating: "",
    severity: "",
    published_date: new Date().toISOString().split('T')[0],
    is_featured: false,
    hide: false,
  });

  const [imageSourceMode, setImageSourceMode] = useState("url");
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [vlogDialogOpen, setVlogDialogOpen] = useState(false);
  const [currentVlog, setCurrentVlog] = useState(null);

  const handleViewVlog = async (postId) => {
    try {
      const vlog = await getVlogByPost(postId);
      if (!vlog) {
        alert('No vlog linked to this post');
        return;
      }
      setCurrentVlog(vlog);
      setVlogDialogOpen(true);
    } catch (e) {
      console.error(e);
      alert('Error fetching vlog: ' + e.message);
    }
  };
// Removed video upload handler as posts no longer handle videos directly.
  // The uploadPostVideo function and related state have been deprecated.
  // If video functionality is needed in the future, it can be reimplemented.


  const [mainTab, setMainTab] = useState(0);
  const [guestPosts, setGuestPosts] = useState([]);
  const [guestActionLoading, setGuestActionLoading] = useState(null);
  const [guestDetailPost, setGuestDetailPost] = useState(null);

  const fetchGuestPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("content_items_guest")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      setGuestPosts(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveGuest = async (guest) => {
    setGuestActionLoading(guest.id);
    try {
      const { error: insertErr } = await supabase.from("content_items").insert({
        title: guest.title,
        section_slug: guest.section_slug,
        excerpt: guest.excerpt || null,
        description: guest.description || null,
        image_url: guest.image_url || null,
        uploader_phone: guest.uploader_phone || null,
        published_date: guest.published_date || new Date().toISOString().split("T")[0],
        hide: true,
        is_featured: false,
      });
      if (insertErr) throw insertErr;
      const { error: delErr } = await supabase.from("content_items_guest").delete().eq("id", guest.id);
      if (delErr) throw delErr;
      await Promise.all([fetchGuestPosts(), fetchPosts()]);
    } catch (e) {
      alert("Lỗi khi duyệt bài: " + e.message);
    } finally {
      setGuestActionLoading(null);
    }
  };

  const handleRejectGuest = async (guest) => {
    if (!window.confirm(`Từ chối và xóa bài "${guest.title}"?`)) return;
    setGuestActionLoading(guest.id);
    try {
      const { error } = await supabase.from("content_items_guest").delete().eq("id", guest.id);
      if (error) throw error;
      await fetchGuestPosts();
    } catch (e) {
      alert("Lỗi khi từ chối: " + e.message);
    } finally {
      setGuestActionLoading(null);
    }
  };

  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSections = async () => {
    try {
      const secs = await getSections();
      setSections(secs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSections();
    fetchGuestPosts();
  }, []);

  const openEdit = (post) => {
    setEditing(post.id);
    setForm({
      title: post.title || "",
      section_slug: post.section_slug || "",
      excerpt: post.excerpt || "",
      description: post.description || "",
      content: post.content || "",
      image_url: post.image_url || "",
      category: post.category || "",
      address: post.address || "",
      rating: post.rating !== null && post.rating !== undefined ? post.rating : "",
      severity: post.severity || "",
      published_date: post.published_date || "",
      is_featured: !!post.is_featured,
      hide: !!post.hide,
    });
    setImageSourceMode("url");
    setOpen(true);
  };

  const handleImageFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPendingImageFile(file);
    setForm((prev) => ({ ...prev, image_url: localUrl }));
  };

  const resetForm = () => {
    setImageSourceMode("url");
    setPendingImageFile(null);
    setForm({
      title: "",
      section_slug: "",
      excerpt: "",
      description: "",
      content: "",
      image_url: "",
      category: "",
      address: "",
      rating: "",
      severity: "",
      published_date: new Date().toISOString().split('T')[0],
      is_featured: false,
      hide: false,
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.section_slug) {
      alert("Vui lòng điền tiêu đề và chọn chuyên mục!");
      return;
    }

    let finalImageUrl = form.image_url;
    if (pendingImageFile) {
      setUploadingImage(true);
      try {
        finalImageUrl = await uploadPostImage(pendingImageFile);
      } catch (e) {
        alert("Lỗi tải ảnh lên: " + e.message);
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    const payload = {
      title: form.title,
      section_slug: form.section_slug,
      excerpt: form.excerpt || null,
      description: form.description || null,
      content: form.content || null,
      image_url: finalImageUrl || null,
      category: form.category || null,
      address: form.address || null,
      rating: form.rating !== "" ? Number(form.rating) : null,
      severity: form.severity || null,
      published_date: form.published_date || null,
      is_featured: form.is_featured,
      hide: form.hide,
    };

    try {
      if (editing) {
        await updatePost(editing, payload);
        setEditing(null);
      } else {
        await createPost(payload);
      }
      resetForm();
      setOpen(false);
      await fetchPosts();
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi lưu bài viết: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await deletePost(id);
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleHide = async (post) => {
    try {
      const newHide = !post.hide;
      const { error } = await supabase
        .from('content_items')
        .update({ hide: newHide })
        .eq('id', post.id);
      if (error) throw error;
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, hide: newHide } : p))
      );
    } catch (e) {
      console.error(e);
      alert('Không thể cập nhật trạng thái: ' + e.message);
    }
  };

  // Client-side search and category filtering
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      (post.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (post.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSection = selectedSection === "all" || post.section_slug === selectedSection;
    
    return matchesSearch && matchesSection;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Posts Management
      </Typography>

      <Tabs
        value={mainTab}
        onChange={(_, v) => setMainTab(v)}
        sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab label="Bài viết" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Chờ duyệt (Guest)
              {guestPosts.length > 0 && (
                <Chip label={guestPosts.length} size="small" color="warning" sx={{ fontWeight: 700, height: 20, fontSize: "0.7rem" }} />
              )}
            </Box>
          }
          sx={{ textTransform: "none", fontWeight: 600 }}
        />
      </Tabs>

      {/* TAB 0: Posts */}
      {mainTab === 0 && (
        <>
          {/* Filter and Search Bar */}
          <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            <TextField
              label="Tìm kiếm bài viết..."
              placeholder="Tìm theo tiêu đề, nội dung, tóm tắt..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: "220px" }}
            />
            <FormControl fullWidth size="small" variant="outlined" sx={{ minWidth: "200px" }}>
              <InputLabel id="filter-section-label">Lọc theo Chuyên mục</InputLabel>
              <Select
                labelId="filter-section-label"
                label="Lọc theo Chuyên mục"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all"><em>Tất cả Chuyên mục</em></MenuItem>
                {sections.map((sec) => (
                  <MenuItem key={sec.id} value={sec.slug}>{sec.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => { setEditing(null); resetForm(); setOpen(true); }}
              sx={{ px: 3, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600, height: "40px" }}
            >
              Add Post
            </Button>
          </Paper>

          {/* Posts Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Table>
              <TableHead sx={{ bgcolor: "action.hover" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Tiêu đề</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Chuyên mục</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Người đăng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Đặc sắc</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hiển thị</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, pr: 3 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      Không tìm thấy bài viết nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => (
                    <TableRow
                      key={post.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        opacity: post.hide ? 0.55 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{post.title}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ display: "inline-block", bgcolor: "primary.light", color: "primary.contrastText", px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: "0.75rem", fontWeight: 600 }}>
                          {sections.find((sec) => sec.slug === post.section_slug)?.title || post.section_slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {post.uploader_phone ? (
                          <Chip label={post.uploader_phone} size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                        ) : (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Admin</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: post.is_featured ? "warning.main" : "text.disabled", fontWeight: 600 }}>
                          {post.is_featured ? "★ Có" : "Không"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={!post.hide ? "Đang hiển thị – nhấn để ẩn" : "Đang ẩn – nhấn để hiện"} arrow>
                          <Chip
                            icon={!post.hide ? <VisibilityIcon sx={{ fontSize: "1rem !important" }} /> : <VisibilityOffIcon sx={{ fontSize: "1rem !important" }} />}
                            label={!post.hide ? "Hiện" : "Ẩn"}
                            size="small"
                            onClick={() => handleToggleHide(post)}
                            color={!post.hide ? "success" : "default"}
                            variant={!post.hide ? "filled" : "outlined"}
                            sx={{ cursor: "pointer", fontWeight: 600, fontSize: "0.72rem", transition: "all 0.2s" }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                          <IconButton onClick={() => openEdit(post)} size="small" color="primary" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(post.id)} size="small" color="error" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
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
        </>
      )}

      {/* TAB 1: Guest Submissions */}
      {mainTab === 1 && (
        <>
          {guestPosts.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>Không có bài viết nào đang chờ duyệt.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Table>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tiêu đề</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Chuyên mục</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Số điện thoại</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày gửi</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, pr: 3 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guestPosts.map((g) => (
                    <TableRow key={g.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 500, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</TableCell>
                      <TableCell>
                        <Chip label={sections.find((s) => s.slug === g.section_slug)?.title || g.section_slug || "—"} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={g.uploader_phone || "—"} size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: "0.8rem" }}>
                        {g.submitted_at ? new Date(g.submitted_at).toLocaleDateString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                          <Tooltip title="Xem chi tiết" arrow>
                            <IconButton size="small" onClick={() => setGuestDetailPost(g)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duyệt – chuyển vào danh sách bài viết (ẩn)" arrow>
                            <span>
                              <IconButton
                                size="small" color="success"
                                disabled={guestActionLoading === g.id}
                                onClick={() => handleApproveGuest(g)}
                                sx={{ border: "1px solid", borderColor: "success.main", borderRadius: 2 }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Từ chối và xóa" arrow>
                            <span>
                              <IconButton
                                size="small" color="error"
                                disabled={guestActionLoading === g.id}
                                onClick={() => handleRejectGuest(g)}
                                sx={{ border: "1px solid", borderColor: "error.main", borderRadius: 2 }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Guest Post Detail Dialog */}
      <Dialog open={!!guestDetailPost} onClose={() => setGuestDetailPost(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        {guestDetailPost && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              Chi tiết bài viết chờ duyệt
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {guestDetailPost.image_url && (
                <Box sx={{ mb: 2.5, borderRadius: 2, overflow: "hidden", height: 200, border: "1px solid", borderColor: "divider" }}>
                  <img src={guestDetailPost.image_url} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Box>
              )}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Chip label={sections.find((s) => s.slug === guestDetailPost.section_slug)?.title || guestDetailPost.section_slug || "Chưa chọn"} color="primary" size="small" />
                <Chip label={guestDetailPost.uploader_phone || "—"} color="warning" size="small" variant="outlined" />
                <Chip label={guestDetailPost.submitted_at ? new Date(guestDetailPost.submitted_at).toLocaleDateString("vi-VN") : "—"} size="small" variant="outlined" />
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>{guestDetailPost.title}</Typography>
              {guestDetailPost.excerpt && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>{guestDetailPost.excerpt}</Typography>
              )}
              {guestDetailPost.description && (
                <Box
                  sx={{ mt: 1, p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.default", "& img": { maxWidth: "100%" } }}
                  dangerouslySetInnerHTML={{ __html: guestDetailPost.description }}
                />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button onClick={() => setGuestDetailPost(null)} sx={{ textTransform: "none" }}>Đóng</Button>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined" color="error" startIcon={<CloseIcon />}
                disabled={guestActionLoading === guestDetailPost.id}
                onClick={() => { handleRejectGuest(guestDetailPost); setGuestDetailPost(null); }}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Từ chối
              </Button>
              <Button
                variant="contained" color="success" startIcon={<CheckIcon />}
                disabled={guestActionLoading === guestDetailPost.id}
                onClick={() => { handleApproveGuest(guestDetailPost); setGuestDetailPost(null); }}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Duyệt bài
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog for Add/Edit Post */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editing ? "Hiệu chỉnh bài viết" : "Thêm bài viết mới"}</DialogTitle>
        <DialogContent sx={{ mt: 1, pt: 1 }}>
          <Grid container spacing={2.5}>
            {/* Left side: Information */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                <TextField label="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth variant="outlined" />
                
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="section-select-label">Chuyên mục</InputLabel>
                  <Select
                    fullWidth
                    labelId="section-select-label"
                    id="section-select"
                    value={form.section_slug}
                    onChange={(e) => setForm({ ...form, section_slug: e.target.value })}
                    label="Chuyên mục"
                  >
                    <MenuItem value=""><em>Chọn chuyên mục</em></MenuItem>
                    {sections.map((sec) => (
                      <MenuItem key={sec.id} value={sec.slug}>
                        {sec.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField label="Phân loại phụ (Category)" placeholder="Ví dụ: ẩm thực, giải trí..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth variant="outlined" />
                
                <TextField label="Tóm tắt ngắn (Excerpt)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} multiline rows={2} fullWidth variant="outlined" />
                
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>Mô tả chi tiết (Description)</Typography>
                  <ReactQuill 
                    theme="snow" 
                    value={form.description || ""} 
                    onChange={(value) => setForm({ ...form, description: value })} 
                    style={{ height: "200px", marginBottom: "50px" }} 
                  />
                </Box>
                
                <TextField
                  label="Nội dung đầy đủ (Content HTML)"
                  placeholder="<p>Nhập HTML trực tiếp tại đây...</p>"
                  value={form.content || ""}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  multiline
                  rows={12}
                  fullWidth
                  variant="outlined"
                  inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
                />
              </Box>
            </Grid>

            {/* Right side: Media, location, metadata */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", display: "block", mb: 1 }}>Hình ảnh bài viết</Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                    <Button size="small" variant={imageSourceMode === "url" ? "contained" : "outlined"} onClick={() => setImageSourceMode("url")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Dán Link URL</Button>
                    <Button size="small" variant={imageSourceMode === "file" ? "contained" : "outlined"} onClick={() => setImageSourceMode("file")} sx={{ textTransform: "none", borderRadius: 1.5 }}>Tải File Lên</Button>
                  </Box>
                  {imageSourceMode === "url" ? (
                    <TextField label="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} fullWidth variant="outlined" size="small" />
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small" sx={{ textTransform: "none", borderRadius: 1.5, whiteSpace: "nowrap" }}>
                        Chọn ảnh
                        <input type="file" accept="image/*" hidden onChange={handleImageFilePick} />
                      </Button>
                      <Typography variant="caption" sx={{ color: pendingImageFile ? "warning.main" : "text.secondary" }}>
                        {pendingImageFile ? `${pendingImageFile.name} (sẽ upload khi lưu)` : "Chưa chọn file"}
                      </Typography>
                    </Box>
                  )}
                  {form.image_url && (
                    <Box sx={{ mt: 1.5, borderRadius: 1.5, overflow: "hidden", height: "120px", border: "1px solid", borderColor: "divider" }}>
                      <img src={form.image_url} alt="Post preview" style={{ height: "100%", width: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = "https://placehold.co/400x200?text=Không+thể+tải+ảnh"; }} />
                    </Box>
                  )}
                </Paper>
                <TextField label="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth variant="outlined" />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField 
                      label="Đánh giá (Rating)" 
                      type="number" 
                      inputProps={{ step: 0.1, min: 0, max: 5 }} 
                      value={form.rating} 
                      onChange={(e) => setForm({ ...form, rating: e.target.value })} 
                      fullWidth 
                      variant="outlined" 
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField 
                      label="Mức độ (Severity)" 
                      value={form.severity} 
                      onChange={(e) => setForm({ ...form, severity: e.target.value })} 
                      placeholder="normal/medium/urgent"
                      fullWidth 
                      variant="outlined" 
                    />
                  </Grid>
                </Grid>

                <TextField 
                  label="Ngày đăng" 
                  type="date" 
                  InputLabelProps={{ shrink: true }} 
                  value={form.published_date} 
                  onChange={(e) => setForm({ ...form, published_date: e.target.value })} 
                  fullWidth 
                  variant="outlined" 
                />

                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <FormControlLabel
                    control={<Switch checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />}
                    label="Bài viết nổi bật (Featured)"
                  />
                  <FormControlLabel
                    control={<Switch checked={!!form.hide} onChange={(e) => setForm({ ...form, hide: e.target.checked })} color="warning" />}
                    label="Ẩn bài viết (Hide)"
                  />
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none", fontWeight: 600 }}>Hủy bỏ</Button>
          <Button onClick={handleSubmit} disabled={uploadingImage} variant="contained" sx={{ px: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            {uploadingImage ? "Đang upload ảnh..." : (editing ? "Cập nhật" : "Tạo bài viết")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
