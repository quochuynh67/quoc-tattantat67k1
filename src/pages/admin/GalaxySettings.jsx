import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { getSiteSetting, upsertSiteSetting } from "../../lib/phuTanApi";
import { uploadGalaxyImage, uploadGalaxyTimelineImage } from "../../lib/supabaseClient";

const DEFAULT_GALAXY = {
  memories: [],
  bgm: [],
  auto_switch_planet: true,
  timeline: [],
};

function MemoryCard({ memory, index, onUpdate, onDelete }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadGalaxyImage(file);
      onUpdate(index, "img", url);
    } catch (err) {
      alert("Upload ảnh thất bại: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        borderRadius: 2,
        "&:hover": { boxShadow: 2 },
      }}
    >
      <DragIndicatorIcon sx={{ color: "text.disabled", mt: 1, cursor: "grab" }} />

      {/* Image */}
      <Box sx={{ width: 120, flexShrink: 0 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        <Box
          onClick={() => fileRef.current?.click()}
          sx={{
            width: 120,
            height: 90,
            borderRadius: 1.5,
            overflow: "hidden",
            border: "2px dashed",
            borderColor: "divider",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.100",
            "&:hover": { borderColor: "primary.main" },
            position: "relative",
          }}
        >
          {uploading ? (
            <CircularProgress size={24} />
          ) : memory.img ? (
            <img src={memory.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Typography variant="caption" color="text.secondary" textAlign="center" px={1}>
              Click để chọn ảnh
            </Typography>
          )}
        </Box>
        <TextField
          size="small"
          fullWidth
          placeholder="Hoặc dán URL..."
          value={memory.img}
          onChange={(e) => onUpdate(index, "img", e.target.value)}
          sx={{ mt: 1 }}
          inputProps={{ style: { fontSize: 11 } }}
        />
      </Box>

      {/* Quote & Author */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <TextField
          label="Câu quote lãng mạn"
          fullWidth
          multiline
          rows={3}
          size="small"
          value={memory.quote || ""}
          onChange={(e) => onUpdate(index, "quote", e.target.value)}
        />
        <TextField
          label="Tác giả (không bắt buộc)"
          fullWidth
          size="small"
          value={memory.author || ""}
          onChange={(e) => onUpdate(index, "author", e.target.value)}
        />
      </Box>

      <Tooltip title="Xóa thẻ bài">
        <IconButton onClick={() => onDelete(index)} size="small" sx={{ color: "error.main" }}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}

function MilestoneCard({ milestone, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadGalaxyTimelineImage(file);
      onUpdate(index, "img", url);
    } catch (err) {
      alert("Upload ảnh thất bại: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, display: "flex", gap: 2, alignItems: "flex-start", borderRadius: 2, "&:hover": { boxShadow: 2 } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pt: 0.5 }}>
        <IconButton size="small" onClick={() => onMoveUp(index)} disabled={isFirst}>▲</IconButton>
        <IconButton size="small" onClick={() => onMoveDown(index)} disabled={isLast}>▼</IconButton>
      </Box>

      <Box sx={{ width: 110, flexShrink: 0 }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        <Box
          onClick={() => fileRef.current?.click()}
          sx={{
            width: 110, height: 80, borderRadius: 1.5, overflow: "hidden",
            border: "2px dashed", borderColor: "divider", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: "grey.100", "&:hover": { borderColor: "primary.main" },
          }}
        >
          {uploading ? <CircularProgress size={22} /> : milestone.img
            ? <img src={milestone.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Typography variant="caption" color="text.secondary" textAlign="center" px={1}>Chọn ảnh</Typography>
          }
        </Box>
        <TextField
          size="small" fullWidth placeholder="Hoặc dán URL..."
          value={milestone.img || ""} onChange={(e) => onUpdate(index, "img", e.target.value)}
          sx={{ mt: 0.5 }} inputProps={{ style: { fontSize: 10 } }}
        />
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            label="Mốc thời gian" size="small" placeholder="vd: Tháng 8/2022"
            value={milestone.year || ""} onChange={(e) => onUpdate(index, "year", e.target.value)}
            sx={{ width: "40%" }}
          />
          <TextField
            label="Tiêu đề giai đoạn" size="small" value={milestone.title || ""}
            onChange={(e) => onUpdate(index, "title", e.target.value)} sx={{ flex: 1 }}
          />
        </Box>
        <TextField
          label="Mô tả / Quote lãng mạn" fullWidth multiline rows={2} size="small"
          value={milestone.quote || ""} onChange={(e) => onUpdate(index, "quote", e.target.value)}
        />
      </Box>

      <Tooltip title="Xóa cột mốc">
        <IconButton onClick={() => onDelete(index)} size="small" sx={{ color: "error.main" }}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}

export default function GalaxySettings() {
  const [galaxy, setGalaxy] = useState(DEFAULT_GALAXY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [newBgm, setNewBgm] = useState("");

  useEffect(() => {
    getSiteSetting("galaxy").then((value) => {
      if (value && typeof value === "object") {
        setGalaxy({
          memories: value.memories ?? [],
          bgm: value.bgm ?? [],
          auto_switch_planet: value.auto_switch_planet ?? true,
          timeline: value.timeline ?? [],
        });
      }
      setLoading(false);
    });
  }, []);

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await upsertSiteSetting("galaxy", galaxy);
    setSaving(false);
    showSnack(
      error ? "Lưu thất bại: " + error.message : "✅ Đã lưu Galaxy settings!",
      error ? "error" : "success"
    );
  };

  // Memories handlers
  const addMemory = () =>
    setGalaxy((g) => ({ ...g, memories: [...g.memories, { img: "", quote: "", author: "" }] }));

  const updateMemory = (index, field, value) =>
    setGalaxy((g) => {
      const updated = [...g.memories];
      updated[index] = { ...updated[index], [field]: value };
      return { ...g, memories: updated };
    });

  const deleteMemory = (index) =>
    setGalaxy((g) => ({ ...g, memories: g.memories.filter((_, i) => i !== index) }));

  // BGM handlers
  const addBgm = () => {
    if (!newBgm.trim()) return;
    setGalaxy((g) => ({ ...g, bgm: [...g.bgm, newBgm.trim()] }));
    setNewBgm("");
  };

  const deleteBgm = (index) =>
    setGalaxy((g) => ({ ...g, bgm: g.bgm.filter((_, i) => i !== index) }));

  // Timeline handlers
  const addMilestone = () =>
    setGalaxy((g) => ({
      ...g,
      timeline: [...(g.timeline || []), { year: "", title: "", quote: "", img: "" }]
    }));

  const updateMilestone = (index, field, value) =>
    setGalaxy((g) => {
      const updated = [...(g.timeline || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...g, timeline: updated };
    });

  const deleteMilestone = (index) =>
    setGalaxy((g) => ({
      ...g,
      timeline: (g.timeline || []).filter((_, i) => i !== index)
    }));

  const moveMilestoneUp = (index) => {
    if (index === 0) return;
    setGalaxy((g) => {
      const updated = [...(g.timeline || [])];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return { ...g, timeline: updated };
    });
  };

  const moveMilestoneDown = (index) => {
    setGalaxy((g) => {
      const updated = [...(g.timeline || [])];
      if (index >= updated.length - 1) return g;
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return { ...g, timeline: updated };
    });
  };

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>🌌 Galaxy Settings</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Cấu hình thẻ bài ký ức, nhạc nền và hành vi của trang Galaxy
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading || saving}
          size="large"
        >
          {saving ? "Đang lưu…" : "Lưu tất cả"}
        </Button>
      </Box>

      {/* Auto switch planet toggle */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>⚙️ Cài đặt chung</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={galaxy.auto_switch_planet}
              onChange={(e) => setGalaxy((g) => ({ ...g, auto_switch_planet: e.target.checked }))}
              disabled={loading}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={500}>Tự động chuyển hành tinh</Typography>
              <Typography variant="caption" color="text.secondary">
                Bật để tự động chuyển giữa các hành tinh mỗi 8 giây
              </Typography>
            </Box>
          }
        />
      </Paper>

      {/* Memories */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>🃏 Thẻ bài ký ức</Typography>
            <Typography variant="caption" color="text.secondary">
              Mỗi thẻ gồm 1 ảnh + 1 câu quote. Chúng sẽ bay quanh hành tinh.
            </Typography>
          </Box>
          <Button startIcon={<AddIcon />} onClick={addMemory} disabled={loading} variant="outlined" size="small">
            Thêm thẻ bài ({galaxy.memories.length})
          </Button>
        </Box>

        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} height={120} sx={{ mb: 1, borderRadius: 2 }} />)
        ) : galaxy.memories.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Chưa có thẻ bài nào. Nhấn "+ Thêm thẻ bài" để bắt đầu.
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {galaxy.memories.map((mem, i) => (
              <MemoryCard
                key={i}
                memory={mem}
                index={i}
                onUpdate={updateMemory}
                onDelete={deleteMemory}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* BGM Playlist */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={0.5}>🎵 Nhạc nền (BGM Playlist)</Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Nhập URL trực tiếp đến file .mp3 hoặc .ogg. Galaxy sẽ phát theo thứ tự.
        </Typography>

        {loading ? (
          [1, 2].map((i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)
        ) : (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
              {galaxy.bgm.map((url, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MusicNoteIcon sx={{ color: "primary.main", fontSize: 18 }} />
                  <Typography variant="body2" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {url}
                  </Typography>
                  <IconButton size="small" onClick={() => deleteBgm(i)} sx={{ color: "error.main" }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {galaxy.bgm.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>Chưa có bài nhạc nào.</Alert>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="https://example.com/music.mp3"
                value={newBgm}
                onChange={(e) => setNewBgm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBgm()}
              />
              <Button variant="outlined" onClick={addBgm} startIcon={<AddIcon />} sx={{ flexShrink: 0 }}>
                Thêm
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Timeline Milestones */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>⏳ Cột mốc thời gian (Timeline)</Typography>
            <Typography variant="caption" color="text.secondary">
              Hiển thị các cột mốc kỷ niệm/giai đoạn đáng nhớ ở thanh bên phải của Galaxy.
            </Typography>
          </Box>
          <Button startIcon={<AddIcon />} onClick={addMilestone} disabled={loading} variant="outlined" size="small">
            Thêm cột mốc ({(galaxy.timeline || []).length})
          </Button>
        </Box>

        {loading ? (
          [1, 2].map((i) => <Skeleton key={i} height={120} sx={{ mb: 1, borderRadius: 2 }} />)
        ) : !galaxy.timeline || galaxy.timeline.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Chưa có cột mốc nào. Nhấn "+ Thêm cột mốc" để bắt đầu.
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {galaxy.timeline.map((milestone, i) => (
              <MilestoneCard
                key={i}
                milestone={milestone}
                index={i}
                onUpdate={updateMilestone}
                onDelete={deleteMilestone}
                onMoveUp={moveMilestoneUp}
                onMoveDown={moveMilestoneDown}
                isFirst={i === 0}
                isLast={i === galaxy.timeline.length - 1}
              />
            ))}
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
