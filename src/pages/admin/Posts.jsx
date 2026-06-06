// src/pages/admin/Posts.jsx
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, List, ListItem, ListItemText } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";
import { getPostsBySection, createPost, updatePost, deletePost, getSections, uploadVideoForVlog, uploadPostVideo, getVlogByPost, supabase } from "../../lib/supabaseClient";
import VisibilityIcon from "@mui/icons-material/Visibility";

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
    is_published: true,
  });

  const [vlogDialogOpen, setVlogDialogOpen] = useState(false);
  const [currentVlog, setCurrentVlog] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false); // Deprecated, retained for potential future use.

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
      is_published: post.is_published !== false,
    });
    setOpen(true);
  };

  const resetForm = () => {
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
      is_published: true,
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.section_slug) {
      alert("Vui lòng điền tiêu đề và chọn chuyên mục!");
      return;
    }

    const payload = {
      title: form.title,
      section_slug: form.section_slug,
      excerpt: form.excerpt || null,
      description: form.description || null,
      content: form.content || null,
      image_url: form.image_url || null,

      category: form.category || null,
      address: form.address || null,
      rating: form.rating !== "" ? Number(form.rating) : null,
      severity: form.severity || null,
      published_date: form.published_date || null,
      is_featured: form.is_featured,
      is_published: form.is_published,
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
              <TableCell sx={{ fontWeight: 600 }}>Đặc sắc</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, pr: 3 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  Không tìm thấy bài viết nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 500 }}>{post.title}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ display: "inline-block", bgcolor: "primary.light", color: "primary.contrastText", px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: "0.75rem", fontWeight: 600 }}>
                      {sections.find(sec => sec.slug === post.section_slug)?.title || post.section_slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: post.is_featured ? "warning.main" : "text.disabled", fontWeight: 600 }}>
                      {post.is_featured ? "★ Có" : "Không"}
                    </Typography>
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
                <TextField label="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} fullWidth variant="outlined" />
                {form.image_url && (
                  <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider", height: "140px", display: "flex", justifyContent: "center", bgcolor: "#f5f5f5" }}>
                    <img src={form.image_url} alt="Post preview" style={{ height: "100%", width: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = "https://placehold.co/400x200?text=Không+thể+tải+ảnh"; }} />
                  </Box>
                )}
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
                    control={<Switch checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />}
                    label="Xuất bản công khai (Published)"
                  />
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none", fontWeight: 600 }}>Hủy bỏ</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ px: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>{editing ? "Cập nhật" : "Tạo bài viết"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
