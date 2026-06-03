import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Skeleton,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { getSiteSetting, upsertSiteSetting } from "../../lib/phuTanApi";
import { DEFAULT_AGENTS } from "../../lib/agentApi";

const defaultHero = { image: "", title: "", subtitle: "", description: "" };

const SECTION_LABELS = {
  news: "Tin tức địa phương",
  places: "Địa điểm nổi bật",
  food: "Ẩm thực đặc sắc",
  beautyHealth: "Làm đẹp & Sức khỏe",
  agriculture: "Nông nghiệp & Phát triển nông thôn",
  health: "Cảnh báo dịch bệnh",
};

function AgentRow({ sectionKey, label, onSnack }) {
  const def = DEFAULT_AGENTS[sectionKey];
  const [form, setForm] = useState({ name: def.name, greeting: def.greeting });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSetting(`agent_${sectionKey}`).then((v) => {
      if (v) setForm((f) => ({ ...f, ...v }));
      setLoaded(true);
    });
  }, [sectionKey]);

  const save = async () => {
    setSaving(true);
    const { error } = await upsertSiteSetting(`agent_${sectionKey}`, { ...def, ...form });
    setSaving(false);
    onSnack(error ? `Lưu thất bại: ${error.message}` : `Đã lưu agent "${form.name}".`, error ? "error" : "success");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: def.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
          {form.name?.[0] ?? "U"}
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Preview: <strong>{form.name}</strong></Typography>
      </Box>
      {!loaded ? <Skeleton height={40} /> : (
        <>
          <TextField label="Tên agent" value={form.name} size="small" fullWidth onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <TextField label="Lời chào" value={form.greeting} size="small" fullWidth multiline rows={2} onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))} />
        </>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button size="small" variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />} onClick={save} disabled={!loaded || saving}>
          {saving ? "Đang lưu…" : "Lưu"}
        </Button>
      </Box>
    </Box>
  );
}

export default function AdminSettings() {
  const [hero, setHero] = useState(defaultHero);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    getSiteSetting("hero").then((value) => {
      if (value) setHero({ ...defaultHero, ...value });
      setLoading(false);
    });
  }, []);

  const showSnack = (message, severity = "success") =>
    setSnack({ open: true, message, severity });

  const handleChange = (field) => (e) =>
    setHero((h) => ({ ...h, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await upsertSiteSetting("hero", hero);
    setSaving(false);
    showSnack(error ? "Lưu thất bại: " + error.message : "Đã lưu Hero settings.", error ? "error" : "success");
  };

  return (
    <Box sx={{ maxWidth: 860 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Settings
      </Typography>

      <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
        {/* Form */}
        <Paper variant="outlined" sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>Nội dung</Typography>

          {loading ? (
            <>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={80} />
              <Skeleton height={80} />
            </>
          ) : (
            <>
              <TextField
                label="Image URL"
                value={hero.image}
                onChange={handleChange("image")}
                fullWidth
                size="small"
                placeholder="https://..."
                helperText="URL ảnh nền của hero banner"
              />
              <TextField
                label="Title"
                value={hero.title}
                onChange={handleChange("title")}
                fullWidth
                size="small"
              />
              <TextField
                label="Subtitle"
                value={hero.subtitle}
                onChange={handleChange("subtitle")}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
              <TextField
                label="Description"
                value={hero.description}
                onChange={handleChange("description")}
                fullWidth
                size="small"
                multiline
                rows={3}
              />
            </>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
          </Box>
        </Paper>

        {/* Preview */}
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            overflow: "hidden",
            borderRadius: 2,
            minHeight: 280,
            position: "relative",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundImage: hero.image ? `url(${hero.image})` : "none",
            backgroundColor: hero.image ? undefined : "grey.200",
          }}
        >
          {/* overlay */}
          <Box sx={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

          {loading ? (
            <Box sx={{ position: "relative", zIndex: 1, p: 3 }}>
              <Skeleton variant="text" width="60%" sx={{ bgcolor: "grey.700" }} />
              <Skeleton variant="text" width="80%" sx={{ bgcolor: "grey.700", mt: 1 }} />
              <Skeleton variant="text" width="50%" sx={{ bgcolor: "grey.700", mt: 1 }} />
            </Box>
          ) : (
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                color: "#fff",
                gap: 1,
              }}
            >
              {!hero.image && (
                <Typography variant="caption" sx={{ opacity: 0.5, mb: 1 }}>
                  Nhập Image URL để xem preview
                </Typography>
              )}
              {hero.title && (
                <Typography variant="h5" fontWeight={700} sx={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
                  {hero.title}
                </Typography>
              )}
              {hero.subtitle && (
                <Typography variant="body1" sx={{ opacity: 0.9, textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}>
                  {hero.subtitle}
                </Typography>
              )}
              {hero.description && (
                <>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.3)", width: "40%", my: 0.5 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8, textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
                    {hero.description}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Agents */}
      <Box sx={{ mt: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>AI Agents — cấu hình từng section</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Mỗi section có 1 agent riêng. Chỉnh tên và lời chào — màu sắc theo section mặc định.
        </Typography>
        {Object.entries(SECTION_LABELS).map(([key, label]) => (
          <Accordion key={key} variant="outlined" sx={{ mb: 1, borderRadius: "8px !important", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: DEFAULT_AGENTS[key]?.color }} />
                <Typography fontWeight={600}>{label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  ({DEFAULT_AGENTS[key]?.name})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <AgentRow sectionKey={key} label={label} onSnack={showSnack} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

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
