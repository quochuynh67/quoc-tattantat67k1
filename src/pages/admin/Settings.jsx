import React, { useEffect, useState } from "react";
import {
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
import { getSiteSetting, upsertSiteSetting } from "../../lib/phuTanApi";

const defaultHero = { image: "", title: "", subtitle: "", description: "" };

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

  const handleChange = (field) => (e) =>
    setHero((h) => ({ ...h, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await upsertSiteSetting("hero", hero);
    setSaving(false);
    if (error) {
      setSnack({ open: true, message: "Lưu thất bại: " + error.message, severity: "error" });
    } else {
      setSnack({ open: true, message: "Đã lưu Hero settings.", severity: "success" });
    }
  };

  return (
    <Box sx={{ maxWidth: 860 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Settings — Hero Section
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
