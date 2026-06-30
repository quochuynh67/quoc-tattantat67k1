// src/pages/admin/Vlogs.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, FormControlLabel, Switch, Divider, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Chip, Alert, Tabs, Tab, Autocomplete, Tooltip } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getVlogs, createVlog, updateVlog, deleteVlog, getSections, uploadVlogFile, uploadHlsFolder, uploadHlsFromExtracted, uploadTimelineImage, moveGuestFileToMain, deleteGuestFile, supabase, getVlogCategories, createVlogCategory, updateVlogCategory, deleteVlogCategory } from "../../lib/supabaseClient";
import { convertVideoToHls, extractTarGz } from "../../lib/hlsApi";
import { clearVlogCache } from "../../lib/phuTanApi";
import { useVlogCache } from "../../contexts/VlogCacheContext";

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
  const { refreshVlogs } = useVlogCache();
  const navigate = useNavigate();
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
  const [pendingMp4File, setPendingMp4File] = useState(null);
  const [convertStatus, setConvertStatus] = useState("");
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
    category_slug: "",
    is_published: true,
    display_order: 0,
  });

  // Timeline locations (giai đoạn) state inside dialog
  const [locations, setLocations] = useState([]);

  const [mainTab, setMainTab] = useState(0);
  const [guestVlogs, setGuestVlogs] = useState([]);
  const [guestActionLoading, setGuestActionLoading] = useState(null);
  const [guestDetailVlog, setGuestDetailVlog] = useState(null);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ slug: "", name: "", color: "#1976d2", description: "", display_order: 0 });
  const [catLoading, setCatLoading] = useState(false);
  const [filterCategorySlug, setFilterCategorySlug] = useState("");

  const getYouTubeId = (url) => {
    const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
    return m?.[1] || null;
  };

  const fetchGuestVlogs = async () => {
    try {
      const { data, error } = await supabase
        .from("vlog_reviews_guest")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      setGuestVlogs(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveGuestVlog = async (g) => {
    setGuestActionLoading(g.id);
    try {
      // Move files from guest bucket to main bucket before inserting
      const finalVideoUrl = g.video_url ? await moveGuestFileToMain(g.video_url) : null;
      const finalPosterUrl = g.poster_url ? await moveGuestFileToMain(g.poster_url) : null;

      const locations = Array.isArray(g.locations_json) ? g.locations_json : [];
      const movedLocations = await Promise.all(
        locations.map(async (loc) => ({
          ...loc,
          image_url: loc.image_url ? await moveGuestFileToMain(loc.image_url) : null,
        }))
      );

      const { data: vlogData, error: insertErr } = await supabase
        .from("vlog_reviews")
        .insert({
          title: g.title,
          subtitle: g.subtitle || null,
          video_url: finalVideoUrl,
          poster_url: finalPosterUrl,
          host: g.host || null,
          duration_label: g.duration_label || null,
          content_item_id: g.content_item_id || null,
          uploader_phone: g.uploader_phone || null,
          is_published: false,
          display_order: 0,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      if (movedLocations.length > 0) {
        const { error: locErr } = await supabase.from("vlog_locations").insert(
          movedLocations.map((loc) => ({
            vlog_review_id: vlogData.id,
            time_seconds: Number(loc.time_seconds) || 0,
            name: loc.name || "",
            note: loc.note || null,
            image_url: loc.image_url || null,
            latitude: loc.latitude !== "" && loc.latitude !== null ? Number(loc.latitude) : null,
            longitude: loc.longitude !== "" && loc.longitude !== null ? Number(loc.longitude) : null,
          }))
        );
        if (locErr) throw locErr;
      }

      const { error: delErr } = await supabase.from("vlog_reviews_guest").delete().eq("id", g.id);
      if (delErr) throw delErr;
      await Promise.all([fetchGuestVlogs(), fetchVlogs()]);
    } catch (e) {
      alert("Lỗi khi duyệt vlog: " + e.message);
    } finally {
      setGuestActionLoading(null);
    }
  };

  const handleRejectGuestVlog = async (g) => {
    if (!window.confirm(`Từ chối và xóa vlog "${g.title}"?`)) return;
    setGuestActionLoading(g.id);
    try {
      const { error } = await supabase.from("vlog_reviews_guest").delete().eq("id", g.id);
      if (error) throw error;

      // Delete uploaded files from guest bucket
      const fileUrls = [g.video_url, g.poster_url].filter(Boolean);
      const locations = Array.isArray(g.locations_json) ? g.locations_json : [];
      locations.forEach((loc) => { if (loc.image_url) fileUrls.push(loc.image_url); });
      await Promise.allSettled(fileUrls.map((url) => deleteGuestFile(url)));

      await fetchGuestVlogs();
    } catch (e) {
      alert("Lỗi khi từ chối: " + e.message);
    } finally {
      setGuestActionLoading(null);
    }
  };

  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPostId, setFilterPostId] = useState("");
  const [filterPhone, setFilterPhone] = useState(null);

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
      const { data, error } = await supabase.from("content_items").select("id, title");
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getVlogCategories();
      setCategories(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchVlogs();
    fetchPostsAndSections();
    fetchGuestVlogs();
    fetchCategories();
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
      category_slug: vlog.category_slug || "",
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
      category_slug: "",
      is_published: true,
      display_order: 0,
    });
    setLocations([]);
    setPendingFolderFiles(null);
    setPendingMp4File(null);
    setConvertStatus("");
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
    if (!form.title || (!form.video_url && !pendingFolderFiles && !pendingMp4File)) {
      alert("Vui lòng điền tiêu đề và đường dẫn/thư mục/file video!");
      return;
    }

    setIsSubmitting(true);
    let finalVideoUrl = form.video_url;

    if (pendingMp4File) {
      setUploadProgress(0);
      try {
        setConvertStatus("Đang gửi video lên server convert...");
        const { blob } = await convertVideoToHls(pendingMp4File, { maxSizeMb: 10, width: 1280 }, (phase) => {
          if (phase === "converting") setConvertStatus("Đang convert sang HLS, vui lòng đợi...");
        });
        setConvertStatus("Đang giải nén file HLS...");
        const extractedFiles = await extractTarGz(blob);
        setConvertStatus(`Đang upload HLS (${extractedFiles.length} files)...`);
        const folderName = `hls-${Date.now()}`;
        finalVideoUrl = await uploadHlsFromExtracted(extractedFiles, folderName, (uploaded, total) => {
          setUploadProgress(Math.round((uploaded / total) * 100));
        });
        setForm(prev => ({ ...prev, video_url: finalVideoUrl }));
        setPendingMp4File(null);
        setConvertStatus("");
      } catch (e) {
        console.error(e);
        alert("Lỗi convert video: " + e.message);
        setConvertStatus("");
        setIsSubmitting(false);
        return;
      }
    } else if (pendingFolderFiles) {
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
      category_slug: form.category_slug || null,
      is_published: form.is_published,
      display_order: Number(form.display_order) || 0,
    };

    try {
      if (editing) {
        await updateVlog(editing, vlogPayload, sortedLocations);
      } else {
        await createVlog(vlogPayload, sortedLocations);
      }
      clearVlogCache();
      refreshVlogs();
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
      clearVlogCache();
      refreshVlogs();
      fetchVlogs();
    } catch (e) {
      console.error(e);
    }
  };

  const phoneOptions = useMemo(
    () => [...new Set(vlogs.map((v) => v.uploader_phone).filter(Boolean))].sort(),
    [vlogs]
  );

  const filteredVlogs = vlogs.filter((vlog) => {
    const matchesSearch = (vlog.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (vlog.subtitle || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPost = filterPostId ? vlog.content_item_id === filterPostId : true;
    const matchesCategory = filterCategorySlug ? vlog.category_slug === filterCategorySlug : true;
    const matchesPhone = filterPhone ? vlog.uploader_phone === filterPhone : true;
    return matchesSearch && matchesPost && matchesCategory && matchesPhone;
  });

  // Category dialog helpers
  const openCatCreate = () => {
    setEditingCat(null);
    setCatForm({ slug: "", name: "", color: "#1976d2", description: "", display_order: categories.length + 1 });
    setCatDialog(true);
  };

  const openCatEdit = (cat) => {
    setEditingCat(cat);
    setCatForm({ slug: cat.slug, name: cat.name, color: cat.color || "#1976d2", description: cat.description || "", display_order: cat.display_order || 0 });
    setCatDialog(true);
  };

  const handleCatSubmit = async () => {
    if (!catForm.slug.trim() || !catForm.name.trim()) {
      alert("Vui lòng điền slug và tên danh mục!");
      return;
    }
    setCatLoading(true);
    try {
      if (editingCat) {
        await updateVlogCategory(editingCat.id, {
          slug: catForm.slug.trim(),
          name: catForm.name.trim(),
          color: catForm.color,
          description: catForm.description.trim() || null,
          display_order: Number(catForm.display_order) || 0,
        });
      } else {
        await createVlogCategory({
          slug: catForm.slug.trim(),
          name: catForm.name.trim(),
          color: catForm.color,
          description: catForm.description.trim() || undefined,
          display_order: Number(catForm.display_order) || 0,
        });
      }
      await fetchCategories();
      setCatDialog(false);
    } catch (e) {
      alert("Lỗi: " + e.message);
    } finally {
      setCatLoading(false);
    }
  };

  const handleCatDelete = async (cat) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"? Các vlog thuộc danh mục này sẽ không còn danh mục.`)) return;
    try {
      await deleteVlogCategory(cat.id);
      await fetchCategories();
    } catch (e) {
      alert("Lỗi: " + e.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Vlogs Management
      </Typography>

      <Tabs
        value={mainTab}
        onChange={(_, v) => setMainTab(v)}
        sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab label="Vlogs" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Chờ duyệt (Guest)
              {guestVlogs.length > 0 && (
                <Chip label={guestVlogs.length} size="small" color="warning" sx={{ fontWeight: 700, height: 20, fontSize: "0.7rem" }} />
              )}
            </Box>
          }
          sx={{ textTransform: "none", fontWeight: 600 }}
        />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Danh mục
              <Chip label={categories.length} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: "0.7rem" }} />
            </Box>
          }
          sx={{ textTransform: "none", fontWeight: 600 }}
        />
      </Tabs>

      {/* TAB 1: Guest Vlogs */}
      {mainTab === 1 && (
        <>
          {guestVlogs.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>Không có vlog nào đang chờ duyệt.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Table>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tiêu đề</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Số điện thoại</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Host</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Giai đoạn</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày gửi</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, pr: 3 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guestVlogs.map((g) => (
                    <TableRow key={g.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="subtitle2" sx={{
                          fontWeight: 600,
                          display: "-webkit-box", WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2, overflow: "hidden",
                        }}>
                          {g.title}
                        </Typography>
                        {g.subtitle && (
                          <Typography variant="caption" color="text.secondary" sx={{
                            display: "-webkit-box", WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 1, overflow: "hidden",
                          }}>
                            {g.subtitle}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={g.uploader_phone || "—"} size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                      </TableCell>
                      <TableCell>{g.host || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${Array.isArray(g.locations_json) ? g.locations_json.length : 0} giai đoạn`}
                          size="small" color="success" variant="outlined"
                          sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: "0.8rem" }}>
                        {g.submitted_at ? new Date(g.submitted_at).toLocaleDateString("vi-VN") : "—"}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                          <Tooltip title="Xem chi tiết" arrow>
                            <IconButton size="small" onClick={() => setGuestDetailVlog(g)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duyệt – chuyển vào danh sách Vlog (ẩn)" arrow>
                            <span>
                              <IconButton size="small" color="success" disabled={guestActionLoading === g.id} onClick={() => handleApproveGuestVlog(g)} sx={{ border: "1px solid", borderColor: "success.main", borderRadius: 2 }}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Từ chối và xóa" arrow>
                            <span>
                              <IconButton size="small" color="error" disabled={guestActionLoading === g.id} onClick={() => handleRejectGuestVlog(g)} sx={{ border: "1px solid", borderColor: "error.main", borderRadius: 2 }}>
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

      {/* Guest Vlog Detail Dialog */}
      <Dialog open={!!guestDetailVlog} onClose={() => setGuestDetailVlog(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        {guestDetailVlog && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Chi tiết vlog chờ duyệt</DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {/* Smart video player */}
              {(() => {
                const url = guestDetailVlog.video_url;
                if (!url || url.startsWith("[")) {
                  return guestDetailVlog.poster_url ? (
                    <Box sx={{ mb: 2.5, borderRadius: 2, overflow: "hidden", height: 200, border: "1px solid", borderColor: "divider" }}>
                      <img src={guestDetailVlog.poster_url} alt="poster" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                  ) : null;
                }
                const ytId = getYouTubeId(url);
                if (ytId) {
                  return (
                    <Box sx={{ mb: 2.5, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider", position: "relative", paddingTop: "56.25%" }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title="YouTube video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      />
                    </Box>
                  );
                }
                if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url) || url.includes("supabase")) {
                  return (
                    <Box sx={{ mb: 2.5, borderRadius: 2, overflow: "hidden", bgcolor: "#000", border: "1px solid", borderColor: "divider" }}>
                      <video
                        src={url} controls playsInline
                        poster={guestDetailVlog.poster_url || undefined}
                        style={{ width: "100%", display: "block", maxHeight: 360, objectFit: "contain" }}
                      />
                    </Box>
                  );
                }
                return (
                  <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Video URL (mở để xem)</Typography>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all", fontSize: "0.8rem" }}>{url}</a>
                  </Box>
                );
              })()}

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Chip label={guestDetailVlog.uploader_phone || "—"} color="warning" size="small" variant="outlined" />
                {guestDetailVlog.host && <Chip label={`Host: ${guestDetailVlog.host}`} size="small" variant="outlined" />}
                {guestDetailVlog.duration_label && <Chip label={guestDetailVlog.duration_label} size="small" variant="outlined" />}
                <Chip label={guestDetailVlog.submitted_at ? new Date(guestDetailVlog.submitted_at).toLocaleDateString("vi-VN") : "—"} size="small" variant="outlined" />
              </Box>

              <Typography variant="h5" fontWeight={700}>{guestDetailVlog.title}</Typography>
              {guestDetailVlog.subtitle && (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>{guestDetailVlog.subtitle}</Typography>
              )}

              {/* Linked post */}
              {guestDetailVlog.content_item_id && (() => {
                const linkedPost = posts.find((p) => p.id === guestDetailVlog.content_item_id);
                return linkedPost ? (
                  <Box sx={{ mt: 1.5, mb: 1, p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "primary.light", bgcolor: "primary.50", display: "flex", gap: 1, alignItems: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", whiteSpace: "nowrap" }}>Liên kết bài viết:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{linkedPost.title}</Typography>
                  </Box>
                ) : null;
              })()}

              {/* Timeline stages */}
              {Array.isArray(guestDetailVlog.locations_json) && guestDetailVlog.locations_json.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Giai đoạn hành trình ({guestDetailVlog.locations_json.length})
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {[...guestDetailVlog.locations_json]
                      .sort((a, b) => Number(a.time_seconds) - Number(b.time_seconds))
                      .map((loc, i) => (
                        <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: "flex", gap: 2, alignItems: "flex-start" }}>
                          {loc.image_url && (
                            <Box sx={{ width: 64, height: 64, flexShrink: 0, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                              <img src={loc.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </Box>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                              <Chip label={`${loc.time_seconds}s`} size="small" color="primary" sx={{ fontWeight: 700, fontSize: "0.7rem", height: 20 }} />
                              <Typography variant="subtitle2" fontWeight={600} noWrap>{loc.name || "—"}</Typography>
                            </Box>
                            {loc.note && <Typography variant="caption" color="text.secondary">{loc.note}</Typography>}
                            {(loc.latitude || loc.longitude) && (
                              <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                                {loc.latitude}, {loc.longitude}
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      ))}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button onClick={() => setGuestDetailVlog(null)} sx={{ textTransform: "none" }}>Đóng</Button>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="outlined" color="error" startIcon={<CloseIcon />}
                disabled={guestActionLoading === guestDetailVlog.id}
                onClick={() => { handleRejectGuestVlog(guestDetailVlog); setGuestDetailVlog(null); }}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Từ chối
              </Button>
              <Button
                variant="contained" color="success" startIcon={<CheckIcon />}
                disabled={guestActionLoading === guestDetailVlog.id}
                onClick={() => { handleApproveGuestVlog(guestDetailVlog); setGuestDetailVlog(null); }}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Duyệt vlog
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* TAB 2: Category Management */}
      {mainTab === 2 && (
        <>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCatCreate} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
              Thêm danh mục
            </Button>
          </Box>
          {categories.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>Chưa có danh mục nào. Bấm "Thêm danh mục" để tạo mới.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Table>
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Màu</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tên danh mục</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Slug</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Thứ tự</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Số vlog</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, pr: 3 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: cat.color, border: "2px solid", borderColor: "divider" }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={cat.name} size="small" sx={{ bgcolor: cat.color, color: "#fff", fontWeight: 700, fontSize: "0.8rem" }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", bgcolor: "action.hover", px: 1, py: 0.5, borderRadius: 1 }}>
                          {cat.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{cat.description || "—"}</Typography>
                      </TableCell>
                      <TableCell>{cat.display_order}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${vlogs.filter((v) => v.category_slug === cat.slug).length} vlog`}
                          size="small" variant="outlined"
                          sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                          <IconButton size="small" color="primary" onClick={() => openCatEdit(cat)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleCatDelete(cat)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Category create/edit dialog */}
          <Dialog open={catDialog} onClose={() => setCatDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ fontWeight: 700 }}>{editingCat ? "Sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
            <DialogContent sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Tên danh mục *" fullWidth value={catForm.name}
                      onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="Chill, Bất động sản..."
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Slug (mã định danh) *" fullWidth value={catForm.slug}
                      onChange={(e) => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                      placeholder="chill, real-estate..."
                      inputProps={{ style: { fontFamily: "monospace" } }}
                      helperText="Chữ thường, không dấu, dùng dấu gạch ngang"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <TextField
                    label="Màu sắc" type="color" value={catForm.color}
                    onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                    sx={{ width: 120 }} size="small"
                    inputProps={{ style: { height: 40, cursor: "pointer" } }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label={catForm.name || "Xem trước"} sx={{ bgcolor: catForm.color, color: "#fff", fontWeight: 700 }} />
                    <Typography variant="caption" color="text.secondary">Xem trước chip</Typography>
                  </Box>
                </Box>
                <TextField
                  label="Mô tả" fullWidth multiline rows={2} value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Mô tả ngắn về danh mục này..."
                />
                <TextField
                  label="Thứ tự hiển thị" type="number" value={catForm.display_order}
                  onChange={(e) => setCatForm({ ...catForm, display_order: e.target.value })}
                  sx={{ width: 160 }} size="small"
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button onClick={() => setCatDialog(false)} sx={{ textTransform: "none" }}>Hủy</Button>
              <Button variant="contained" onClick={handleCatSubmit} disabled={catLoading} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3 }}>
                {catLoading ? "Đang lưu..." : editingCat ? "Cập nhật" : "Tạo danh mục"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* TAB 0: Vlogs list + dialog */}
      {mainTab === 0 && <>

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

        <Autocomplete
          options={posts}
          getOptionLabel={(p) => p.title || ""}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          value={posts.find((p) => p.id === filterPostId) || null}
          onChange={(_, newVal) => setFilterPostId(newVal ? newVal.id : "")}
          renderInput={(params) => (
            <TextField {...params} label="Lọc theo bài viết" size="small" variant="outlined" placeholder="Tìm bài viết..." />
          )}
          sx={{ minWidth: "200px" }}
        />

        <Autocomplete
          options={categories}
          getOptionLabel={(cat) => cat.name || ""}
          isOptionEqualToValue={(opt, val) => opt.slug === val.slug}
          value={categories.find((c) => c.slug === filterCategorySlug) || null}
          onChange={(_, newVal) => setFilterCategorySlug(newVal ? newVal.slug : "")}
          renderOption={(props, cat) => (
            <li {...props} key={cat.slug}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: cat.color, flexShrink: 0 }} />
                {cat.name}
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Lọc theo danh mục" size="small" variant="outlined" placeholder="Tìm danh mục..." />
          )}
          sx={{ minWidth: "180px" }}
        />

        <Autocomplete
          options={phoneOptions}
          value={filterPhone}
          onChange={(_, newVal) => setFilterPhone(newVal)}
          renderInput={(params) => (
            <TextField {...params} label="Lọc theo SĐT" size="small" variant="outlined" placeholder="Nhập số điện thoại..." />
          )}
          sx={{ minWidth: "180px" }}
        />

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
              <TableCell sx={{ fontWeight: 600 }}>Danh mục</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Người đăng</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Host</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Linked Post</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Timeline Stages</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, pr: 3 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVlogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  Không tìm thấy vlog nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredVlogs.map((vlog) => (
                <TableRow key={vlog.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Typography variant="subtitle2" sx={{
                      fontWeight: 600,
                      display: "-webkit-box", WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2, overflow: "hidden",
                    }}>
                      {vlog.title}
                    </Typography>
                    {vlog.subtitle && (
                      <Typography variant="caption" sx={{
                        color: "text.secondary",
                        display: "-webkit-box", WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 1, overflow: "hidden",
                      }}>
                        {vlog.subtitle}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const cat = categories.find((c) => c.slug === vlog.category_slug);
                      return cat ? (
                        <Chip label={cat.name} size="small" sx={{ bgcolor: cat.color, color: "#fff", fontWeight: 700, fontSize: "0.72rem" }} />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {vlog.uploader_phone ? (
                      <Chip label={vlog.uploader_phone} size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                    ) : (
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Admin</Typography>
                    )}
                  </TableCell>
                  <TableCell>{vlog.host || "N/A"}</TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    {(() => {
                      const linked = posts.find((p) => p.id === vlog.content_item_id);
                      return linked ? (
                        <Tooltip title={`Xem: ${linked.title}`} arrow>
                          <Typography
                            variant="caption"
                            onClick={() => window.open(`/post-detail/${linked.id}`, "_blank")}
                            sx={{
                              display: "-webkit-box", WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2, overflow: "hidden",
                              color: "primary.main", fontWeight: 600,
                              cursor: "pointer",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            {linked.title}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      );
                    })()}
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
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}>
                Thông tin cơ bản Vlog
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField label="Tiêu đề Vlog" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth variant="outlined" />
                <TextField label="Phụ đề (Subtitle)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} fullWidth variant="outlined" />
                <TextField label="Người dẫn (Host)" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} fullWidth variant="outlined" />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
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
                  <Grid size={{ xs: 6 }}>
                    <TextField label="Thứ tự hiển thị" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} fullWidth variant="outlined" />
                  </Grid>
                </Grid>

                <Autocomplete
                  options={posts}
                  getOptionLabel={(p) => p.title || ""}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  value={posts.find((p) => p.id === form.content_item_id) || null}
                  onChange={(_, newVal) => setForm({ ...form, content_item_id: newVal?.id || "" })}
                  renderInput={(params) => (
                    <TextField {...params} label="Liên kết tới bài viết (Post)" variant="outlined" size="small" placeholder="Tìm theo tiêu đề..." />
                  )}
                />

                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="cat-select-label">Danh mục Vlog</InputLabel>
                  <Select
                    labelId="cat-select-label"
                    label="Danh mục Vlog"
                    value={form.category_slug}
                    onChange={(e) => setForm({ ...form, category_slug: e.target.value })}
                  >
                    <MenuItem value=""><em>Không phân loại</em></MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.slug} value={cat.slug}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: cat.color, flexShrink: 0 }} />
                          <span>{cat.name}</span>
                          {cat.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>— {cat.description}</Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {form.category_slug && (() => {
                  const cat = categories.find((c) => c.slug === form.category_slug);
                  return cat ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label={cat.name} sx={{ bgcolor: cat.color, color: "#fff", fontWeight: 700 }} size="small" />
                      <Typography variant="caption" color="text.secondary">Đã chọn danh mục</Typography>
                    </Box>
                  ) : null;
                })()}

                <Card variant="outlined" sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>Video Stream (HLS .m3u8)</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                    Hệ thống tự động đồng bộ hóa đường dẫn video `.mp4` sau khi upload sang luồng truyền phát phân đoạn `.m3u8` để tối ưu hóa tốc độ tải và chống giật lag.
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                    <Button size="small" variant={videoSourceMode === "url" ? "contained" : "outlined"} onClick={() => setVideoSourceMode("url")} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                      Dán Link URL
                    </Button>
                    <Button size="small" variant={videoSourceMode === "file" ? "contained" : "outlined"} onClick={() => setVideoSourceMode("file")} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                      Tải File .mp4 Lên
                    </Button>
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
                        <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small" disabled={isSubmitting} sx={{ textTransform: "none", borderRadius: 1.5 }}>
                          Chọn File MP4
                          <input type="file" accept="video/mp4,video/*" hidden onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setPendingMp4File(file);
                            setForm((prev) => ({ ...prev, video_url: `[Sẽ convert: ${file.name}]` }));
                          }} />
                        </Button>
                        <Typography variant="caption" sx={{ color: pendingMp4File ? "warning.main" : "text.secondary", fontWeight: 600 }}>
                          {pendingMp4File ? `${pendingMp4File.name} (sẽ convert khi Lưu)` : "Chưa chọn file"}
                        </Typography>
                      </Box>
                      {pendingMp4File && (
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                          Video sẽ được tự động convert sang HLS (.m3u8) khi nhấn "Lưu Vlog".
                        </Typography>
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
            <Grid size={{ xs: 12, md: 7 }}>
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
                          <Grid size={{ xs: 12, sm: 8 }}>
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
                          <Grid size={{ xs: 12, sm: 4 }}>
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
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexDirection: "column", alignItems: "stretch", gap: 1 }}>
          {isSubmitting && convertStatus && (
            <Typography variant="caption" color="primary.main" sx={{ textAlign: "center" }}>
              {convertStatus}{uploadProgress > 0 ? ` ${uploadProgress}%` : ""}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button onClick={() => setOpen(false)} disabled={isSubmitting} sx={{ textTransform: "none", fontWeight: 600 }}>Hủy bỏ</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} variant="contained" sx={{ px: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
              {isSubmitting
                ? (convertStatus
                    ? (uploadProgress > 0 ? `Upload HLS... ${uploadProgress}%` : "Đang xử lý video...")
                    : pendingFolderFiles
                      ? `Đang upload HLS... ${uploadProgress}%`
                      : "Đang lưu...")
                : (editing ? "Cập nhật" : "Lưu Vlog")}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      </>}
    </Box>
  );
}
