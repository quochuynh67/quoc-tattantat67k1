import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Paper, Tooltip, Chip,
  Select, MenuItem, InputLabel, FormControl, CircularProgress,
  Alert, Snackbar, Skeleton,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { getAiAgents, getSectionsAll, upsertAiAgent, deleteAiAgent } from "../../lib/supabaseClient";
import { DEFAULT_AGENTS } from "../../lib/agentApi";

const EMPTY_FORM = {
  agentRowId: null,           // existing ai_agents.id (null = new)
  content_section_id: "",     // FK to content_sections
  template: "news",           // which DEFAULT_AGENTS key to base on
  name: "",
  greeting: "",
};

function AgentAvatar({ color, emoji, size = 40 }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: "50%",
      background: color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, boxShadow: `0 2px 8px ${color}55`,
    }}>
      {emoji}
    </Box>
  );
}

export default function AiAgents() {
  const [agents, setAgents] = useState([]);   // raw rows: { id, content_section_id, value, content_sections }
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const fetchAll = async () => {
    try {
      const [ag, sec] = await Promise.all([getAiAgents(), getSectionsAll()]);
      setAgents(ag);
      setSections(sec ?? []);
    } catch (e) {
      showSnack("Lỗi tải dữ liệu: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = (prefilledSectionId = "") => {
    const tpl = DEFAULT_AGENTS.news;
    setForm({
      agentRowId: null,
      content_section_id: prefilledSectionId,
      template: "news",
      name: tpl.name,
      greeting: tpl.greeting,
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    const cfg = row.payload ?? {};
    const matchKey = Object.keys(DEFAULT_AGENTS).find(
      (k) => DEFAULT_AGENTS[k].color === cfg.color && DEFAULT_AGENTS[k].emoji === cfg.emoji
    ) ?? "news";
    setForm({
      agentRowId: row.id,
      content_section_id: row.content_section_id,
      template: matchKey,
      name: cfg.name ?? "",
      greeting: cfg.greeting ?? "",
    });
    setOpen(true);
  };

  const applyTemplate = (key) => {
    const tpl = DEFAULT_AGENTS[key] ?? DEFAULT_AGENTS.news;
    setForm((f) => ({
      ...f,
      template: key,
      name: f.name || tpl.name,
      greeting: f.greeting || tpl.greeting,
    }));
  };

  const handleSubmit = async () => {
    if (!form.content_section_id || !form.name) return;
    setSaving(true);
    try {
      const tpl = DEFAULT_AGENTS[form.template] ?? DEFAULT_AGENTS.news;
      await upsertAiAgent({
        ...(form.agentRowId ? { id: form.agentRowId } : {}),
        content_section_id: form.content_section_id,
        value: {
          name: form.name,
          greeting: form.greeting,
          color: tpl.color,
          emoji: tpl.emoji,
        },
      });
      showSnack(`Đã lưu agent "${form.name}"`);
      setOpen(false);
      fetchAll();
    } catch (e) {
      showSnack("Lưu thất bại: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const name = row.payload?.name ?? "agent này";
    if (!window.confirm(`Xóa agent "${name}"?`)) return;
    try {
      await deleteAiAgent(row.id);
      showSnack(`Đã xóa agent "${name}"`);
      fetchAll();
    } catch (e) {
      showSnack("Xóa thất bại: " + e.message, "error");
    }
  };

  const configuredSectionIds = new Set(agents.map((a) => a.content_section_id));
  const previewTpl = DEFAULT_AGENTS[form.template] ?? DEFAULT_AGENTS.news;

  // When adding: only show sections without an agent; when editing: show all (dropdown is disabled)
  const availableSections = form.agentRowId
    ? sections
    : sections.filter((s) => !configuredSectionIds.has(s.id));

  return (
    <Box sx={{ p: 3, maxWidth: 860 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <SmartToyIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" fontWeight={800}>Nông dân AI</Typography>
            <Typography variant="body2" color="text.secondary">
              Cấu hình AI agent cho từng section — bảng <code>ai_agents</code>
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAdd()}
          disabled={!loading && sections.length > 0 && configuredSectionIds.size >= sections.length}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
          Thêm agent
        </Button>
      </Box>

      {/* Agent list */}
      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={80} />)}
        </Box>
      ) : agents.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
          <SmartToyIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">Chưa có agent nào. Nhấn "Thêm agent" để bắt đầu.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {agents.map((row) => {
            const cfg = row.payload ?? {};
            const sec = row.content_sections;
            return (
              <Paper key={row.id} variant="outlined" sx={{
                p: 2, borderRadius: 3, display: "flex", alignItems: "center", gap: 2,
                transition: "box-shadow 0.15s",
                "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
              }}>
                <AgentAvatar color={cfg.color ?? "#888"} emoji={cfg.emoji ?? "🤖"} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25, flexWrap: "wrap" }}>
                    <Typography fontWeight={700} noWrap>{cfg.name ?? "—"}</Typography>
                    {sec && (
                      <>
                        <Chip label={sec.slug} size="small" variant="outlined"
                          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }} />
                        <Chip label={sec.title} size="small"
                          sx={{ fontSize: "0.7rem", background: `${cfg.color ?? "#888"}18`, color: cfg.color ?? "#888", fontWeight: 600 }} />
                      </>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{
                    display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {cfg.greeting ?? "—"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                  <Tooltip title="Sửa" arrow>
                    <IconButton size="small" onClick={() => openEdit(row)}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa" arrow>
                    <IconButton size="small" color="error" onClick={() => handleDelete(row)}
                      sx={{ border: "1px solid", borderColor: "error.light", borderRadius: 1.5 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Sections without an agent */}
      {!loading && sections.filter((s) => !configuredSectionIds.has(s.id)).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
            Sections chưa có agent
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
            {sections.filter((s) => !configuredSectionIds.has(s.id)).map((s) => (
              <Chip key={s.id} label={`${s.title} (${s.slug})`} size="small" variant="outlined"
                onClick={() => openAdd(s.id)}
                sx={{ cursor: "pointer", "&:hover": { borderColor: "primary.main" } }} />
            ))}
          </Box>
        </Box>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {form.agentRowId ? "Sửa agent" : "Thêm AI Agent mới"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>

          {/* Live preview */}
          <Box sx={{
            display: "flex", alignItems: "center", gap: 2, p: 1.5, borderRadius: 2,
            background: `${previewTpl.color}12`, border: `1px solid ${previewTpl.color}33`,
          }}>
            <AgentAvatar color={previewTpl.color} emoji={previewTpl.emoji} size={44} />
            <Box>
              <Typography fontWeight={700} sx={{ color: previewTpl.color }}>
                {form.name || previewTpl.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {form.greeting || previewTpl.greeting}
              </Typography>
            </Box>
          </Box>

          {/* Section dropdown */}
          <FormControl fullWidth size="small" disabled={!!form.agentRowId}>
            <InputLabel>Liên kết section</InputLabel>
            <Select
              value={form.content_section_id}
              label="Liên kết section"
              onChange={(e) => setForm((f) => ({ ...f, content_section_id: e.target.value }))}
            >
              {availableSections.length === 0 ? (
                <MenuItem disabled value="">
                  <Typography variant="caption" color="text.secondary">
                    Tất cả sections đã có agent
                  </Typography>
                </MenuItem>
              ) : (
                availableSections.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography fontWeight={600}>{s.title}</Typography>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        ({s.slug})
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Template */}
          <FormControl fullWidth size="small">
            <InputLabel>Template (màu & emoji)</InputLabel>
            <Select value={form.template} label="Template (màu & emoji)"
              onChange={(e) => applyTemplate(e.target.value)}>
              {Object.entries(DEFAULT_AGENTS).map(([key, ag]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: "50%", background: ag.color, flexShrink: 0 }} />
                    <span>{ag.emoji} {ag.name}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label="Tên agent" value={form.name} size="small" fullWidth
            placeholder={previewTpl.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

          <TextField label="Lời chào" value={form.greeting} size="small" fullWidth multiline rows={2}
            placeholder={previewTpl.greeting}
            onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))} />

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: "none" }}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained"
            disabled={!form.content_section_id || !form.name || saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ px: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            {saving ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
