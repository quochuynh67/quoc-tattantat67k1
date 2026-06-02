// src/pages/admin/Sections.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Paper } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { getSections, createSection, deleteSection, updateSection } from "../../lib/supabaseClient";

export default function AdminSections() {
  const [sections, setSections] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", slug: "", route: "" });

  const fetchSections = async () => {
    try {
      const data = await getSections();
      setSections(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Generate slug and route automatically from title if not custom-edited
  const handleTitleChange = (titleVal) => {
    const cleanTitle = titleVal
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    setForm((prev) => ({
      ...prev,
      title: titleVal,
      slug: prev.slug === "" || prev.slug === prev.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") ? cleanTitle : prev.slug,
      route: prev.route === "" || prev.route === `/${prev.slug}` ? `/${cleanTitle}` : prev.route,
    }));
  };

  // Open edit dialog for a section
  const openEdit = (sec) => {
    setEditing(sec.id);
    setForm({
      title: sec.title || "",
      description: sec.description || "",
      slug: sec.slug || "",
      route: sec.route || "",
    });
    setOpen(true);
  };

  // Unified submit for add or edit
  const handleSubmit = async () => {
    if (!form.title) return;
    const finalSlug = form.slug || form.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    const finalRoute = form.route || `/${finalSlug}`;
    
    const payload = {
      title: form.title,
      description: form.description,
      slug: finalSlug,
      route: finalRoute,
    };

    try {
      if (editing) {
        await updateSection(editing, payload);
        setEditing(null);
      } else {
        await createSection(payload);
      }
      setForm({ title: "", description: "", slug: "", route: "" });
      setOpen(false);
      fetchSections();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa section này có thể ảnh hưởng đến các bài viết thuộc section. Bạn có chắc chắn muốn xóa?")) return;
    try {
      await deleteSection(id);
      fetchSections();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Sections Management
      </Typography>
      <Button variant="contained" onClick={() => { setEditing(null); setForm({ title: "", description: "", slug: "", route: "" }); setOpen(true); }} sx={{ mb: 3, px: 3, py: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
        Add Section
      </Button>
      <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sections.map((sec) => (
          <Paper key={sec.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: "divider", transition: "all 0.2s ease-in-out", '&:hover': { boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)", borderColor: "primary.main" } }}>
            <ListItem 
              disablePadding
              secondaryAction={
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <IconButton onClick={() => openEdit(sec)} size="small" color="primary" sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                    <EditIcon />
                  </IconButton>
                  <Button color="error" variant="outlined" size="small" onClick={() => handleDelete(sec.id)} sx={{ borderRadius: 2, textTransform: "none", px: 2 }}>
                    Delete
                  </Button>
                </Box>
              }
            >
              <ListItemText 
                primary={
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main", mb: 0.75 }}>
                    {sec.title || "Không có tên"}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2" sx={{ color: "text.primary", lineHeight: 1.6 }}>
                      {sec.description || "Không có mô tả"}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", bgcolor: "action.hover", px: 1.5, py: 0.5, borderRadius: 1.5, fontWeight: 500 }}>
                        Slug: {sec.slug || "N/A"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", bgcolor: "action.hover", px: 1.5, py: 0.5, borderRadius: 1.5, fontWeight: 500 }}>
                        Route: {sec.route || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          </Paper>
        ))}
      </List>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editing ? "Edit Section" : "Add New Section"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField label="Section Title" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} fullWidth variant="outlined" />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} fullWidth variant="outlined" />
          <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} fullWidth variant="outlined" />
          <TextField label="Route" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} fullWidth variant="outlined" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ px: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>{editing ? "Update" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
