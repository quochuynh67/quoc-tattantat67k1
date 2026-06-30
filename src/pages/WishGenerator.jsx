// src/pages/WishGenerator.jsx – AI wish generator, phone-gated, 2/day per phone via localStorage
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box, Container, Typography, Paper, TextField, Button,
  Chip, CircularProgress, Tooltip, Snackbar, Alert,
  ToggleButtonGroup, ToggleButton, InputAdornment, IconButton,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckIcon from "@mui/icons-material/Check";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import { generateWishes } from "../lib/agentApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 2;
const LS_PHONE_KEY = "wish_phone";
const LS_USAGE_KEY = "wish_usage";

// ── localStorage helpers ──────────────────────────────────────────────────────

function normalizePhone(raw) {
  return raw.replace(/[\s\-\.\(\)]/g, "").replace(/^(\+84)/, "0").replace(/^(84)(\d{9})$/, "0$2");
}

function isValidVNPhone(phone) {
  return /^(0[3-9]\d{8})$/.test(normalizePhone(phone));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getUsageCount(phone) {
  try {
    const norm = normalizePhone(phone);
    const raw = JSON.parse(localStorage.getItem(LS_USAGE_KEY) ?? "{}");
    const entry = raw[norm];
    if (!entry || entry.date !== getTodayKey()) return 0;
    return entry.count ?? 0;
  } catch { return 0; }
}

function incrementUsage(phone) {
  try {
    const norm = normalizePhone(phone);
    const raw = JSON.parse(localStorage.getItem(LS_USAGE_KEY) ?? "{}");
    const today = getTodayKey();
    const prev = raw[norm]?.date === today ? (raw[norm].count ?? 0) : 0;
    raw[norm] = { date: today, count: prev + 1 };
    localStorage.setItem(LS_USAGE_KEY, JSON.stringify(raw));
    return prev + 1;
  } catch { return 1; }
}

function getSavedPhone() {
  try { return localStorage.getItem(LS_PHONE_KEY) ?? ""; } catch { return ""; }
}

function savePhone(phone) {
  try { localStorage.setItem(LS_PHONE_KEY, normalizePhone(phone)); } catch {}
}

// ── Occasions ─────────────────────────────────────────────────────────────────

const OCCASIONS = [
  { key: "sinh-nhat",   label: "Sinh Nhật",     emoji: "🎂" },
  { key: "tet",         label: "Tết / Năm Mới", emoji: "🎊" },
  { key: "dam-cuoi",    label: "Đám Cưới",      emoji: "💍" },
  { key: "tot-nghiep",  label: "Tốt Nghiệp",    emoji: "🎓" },
  { key: "khai-truong", label: "Khai Trương",   emoji: "🏪" },
  { key: "tinh-yeu",    label: "Tình Yêu",      emoji: "❤️" },
  { key: "suc-khoe",    label: "Sức Khỏe",      emoji: "💪" },
  { key: "khac",        label: "Khác",           emoji: "✨" },
];

// ── Fonts ─────────────────────────────────────────────────────────────────────

const FONTS = [
  { key: "great-vibes",    label: "Thư Pháp",   family: "'Great Vibes', cursive",     size: "1.7rem",  preview: "Trân Trọng" },
  { key: "dancing-script", label: "Sang Trọng", family: "'Dancing Script', cursive",  size: "1.5rem",  preview: "Kính Chúc" },
  { key: "satisfy",        label: "Lãng Mạn",   family: "'Satisfy', cursive",         size: "1.45rem", preview: "Yêu Thương" },
  { key: "pinyon-script",  label: "Cổ Điển",    family: "'Pinyon Script', cursive",   size: "1.65rem", preview: "Chúc Mừng" },
  { key: "pacifico",       label: "Vui Tươi",   family: "'Pacifico', cursive",        size: "1.25rem", preview: "Hạnh Phúc" },
  { key: "lora",           label: "Trang Nhã",  family: "'Lora', Georgia, serif",     size: "1.15rem", preview: "Kính Gửi" },
];

const COUNT_OPTIONS = [1, 2, 3];

const OCCASION_GRADIENTS = {
  "sinh-nhat":   "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "tet":         "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "dam-cuoi":    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "tot-nghiep":  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "khai-truong": "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "tinh-yeu":    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "suc-khoe":    "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  "khac":        "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
};

// ── Phone Gate ────────────────────────────────────────────────────────────────

function PhoneGate({ onConfirm }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, []);

  const handleSubmit = () => {
    const norm = normalizePhone(phone);
    if (!isValidVNPhone(phone)) {
      setError("Số điện thoại không hợp lệ (VD: 0901234567)");
      return;
    }
    savePhone(norm);
    onConfirm(norm);
  };

  return (
    <Box sx={{
      minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--color-background)", px: 2,
    }}>
      <Paper elevation={0} sx={{
        maxWidth: 420, width: "100%", p: { xs: 3.5, md: 5 }, borderRadius: 5,
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 12px 48px rgba(0,0,0,0.10)",
        animation: "gate-in 0.45s cubic-bezier(0.22,1,0.36,1)",
        "@keyframes gate-in": { from: { opacity: 0, transform: "translateY(24px)" }, to: { opacity: 1, transform: "none" } },
      }}>
        {/* Icon */}
        <Box sx={{
          width: 64, height: 64, borderRadius: "50%", mx: "auto", mb: 3,
          background: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.8rem", boxShadow: "0 6px 20px rgba(161,140,209,0.4)",
        }}>
          ✨
        </Box>

        <Typography variant="h5" sx={{
          fontFamily: "'Dancing Script', cursive", fontWeight: 700,
          textAlign: "center", mb: 0.5, color: "var(--color-text)", fontSize: "1.8rem",
        }}>
          Tạo Lời Chúc AI
        </Typography>

        <Typography sx={{
          textAlign: "center", color: "var(--color-subtle)", fontSize: "0.9rem", mb: 3.5, lineHeight: 1.55,
        }}>
          Nhập số điện thoại để bắt đầu.
          <br />Miễn phí · <Box component="span" sx={{ fontWeight: 700, color: "var(--color-primary)" }}>{DAILY_LIMIT} lượt/ngày</Box> · Không cần đăng ký
        </Typography>

        <TextField
          inputRef={inputRef}
          fullWidth
          label="Số điện thoại"
          placeholder="VD: 0901 234 567"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ fontSize: 20, color: "var(--color-primary)" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2.5,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-primary)" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-primary)" },
            },
          }}
        />

        <Button
          fullWidth variant="contained" size="large"
          onClick={handleSubmit}
          sx={{
            borderRadius: 3, py: 1.5, fontWeight: 800, fontSize: "1rem",
            textTransform: "none",
            background: "linear-gradient(135deg, #a18cd1 0%, #f5576c 100%)",
            boxShadow: "0 6px 20px rgba(161,140,209,0.4)",
            "&:hover": { boxShadow: "0 8px 28px rgba(161,140,209,0.5)", transform: "translateY(-1px)" },
            transition: "all 0.2s",
          }}
        >
          Bắt đầu tạo lời chúc ✨
        </Button>

        <Typography sx={{ textAlign: "center", mt: 2, fontSize: "0.78rem", color: "var(--color-subtle)" }}>
          Số điện thoại chỉ lưu trên thiết bị của bạn, không gửi lên server.
        </Typography>
      </Paper>
    </Box>
  );
}

// ── Wish Card ─────────────────────────────────────────────────────────────────

function WishCard({ text, fontFamily, fontSize, index, gradient, streaming }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <Paper elevation={0} sx={{
      position: "relative", p: { xs: 3, md: 4 }, borderRadius: 4,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.8)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
      transition: "transform 0.25s, box-shadow 0.25s",
      "&:hover": { transform: "translateY(-3px)", boxShadow: "0 16px 48px rgba(0,0,0,0.14)" },
      animation: "wish-in 0.5s ease",
      animationDelay: `${index * 0.12}s`,
      animationFillMode: "both",
      "@keyframes wish-in": {
        from: { opacity: 0, transform: "translateY(20px)" },
        to:   { opacity: 1, transform: "translateY(0)" },
      },
      overflow: "hidden",
      "&::before": {
        content: '""', position: "absolute",
        top: 0, left: 0, right: 0, height: 4,
        background: gradient, borderRadius: "16px 16px 0 0",
      },
    }}>
      <Typography sx={{
        position: "absolute", top: 8, left: 18,
        fontSize: "4rem", lineHeight: 1, opacity: 0.07,
        fontFamily: "'Georgia', serif", color: "#333", userSelect: "none",
      }}>
        "
      </Typography>

      <Typography sx={{
        fontFamily, fontSize, lineHeight: 1.75,
        color: "#2d2d2d", whiteSpace: "pre-wrap", minHeight: 60, pt: 0.5,
      }}>
        {text}
        {streaming && (
          <Box component="span" sx={{
            display: "inline-block", width: 2, height: "1em",
            bgcolor: "currentColor", ml: 0.5, verticalAlign: "middle",
            animation: "cursor-blink 1s step-end infinite",
            "@keyframes cursor-blink": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0 } },
          }} />
        )}
      </Typography>

      {!streaming && text && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Tooltip title={copied ? "Đã sao chép!" : "Sao chép lời chúc"}>
            <Button
              size="small"
              startIcon={copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
              onClick={handleCopy}
              sx={{
                borderRadius: 99, textTransform: "none", fontWeight: 700, fontSize: "0.8rem", px: 2,
                color: copied ? "#2e7d32" : "rgba(0,0,0,0.45)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.7)" },
              }}
            >
              {copied ? "Đã sao chép" : "Sao chép"}
            </Button>
          </Tooltip>
        </Box>
      )}
    </Paper>
  );
}

// ── Usage Badge ───────────────────────────────────────────────────────────────

function UsageBadge({ phone, usedToday, onChangePhone }) {
  const remaining = DAILY_LIMIT - usedToday;
  const color = remaining === 0 ? "#d32f2f" : remaining === 1 ? "#e65100" : "#2e7d32";

  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.5,
      flexWrap: "wrap",
    }}>
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1,
        px: 2, py: 0.7, borderRadius: 99,
        bgcolor: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}>
        <PhoneIcon sx={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.45)" }} />
        <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-text)" }}>
          {phone}
        </Typography>
        <Tooltip title="Đổi số điện thoại">
          <IconButton size="small" onClick={onChangePhone} sx={{ p: 0.3, ml: 0.5 }}>
            <EditIcon sx={{ fontSize: "0.85rem", color: "rgba(0,0,0,0.4)" }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{
        display: "flex", alignItems: "center", gap: 0.7,
        px: 1.8, py: 0.7, borderRadius: 99,
        bgcolor: remaining === 0 ? "rgba(211,47,47,0.08)" : "rgba(255,255,255,0.85)",
        border: `1px solid ${color}30`,
        backdropFilter: "blur(10px)",
      }}>
        {[...Array(DAILY_LIMIT)].map((_, i) => (
          <Box key={i} sx={{
            width: 10, height: 10, borderRadius: "50%",
            bgcolor: i < (DAILY_LIMIT - remaining) ? "rgba(0,0,0,0.18)" : color,
            transition: "background 0.3s",
          }} />
        ))}
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color, ml: 0.5 }}>
          {remaining === 0 ? "Hết lượt hôm nay" : `Còn ${remaining} lượt hôm nay`}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WishGenerator() {
  const [phone, setPhone] = useState(() => getSavedPhone());
  const [usedToday, setUsedToday] = useState(() => getSavedPhone() ? getUsageCount(getSavedPhone()) : 0);

  const [occasion, setOccasion] = useState("sinh-nhat");
  const [description, setDescription] = useState("");
  const [selectedFont, setSelectedFont] = useState("dancing-script");
  const [count, setCount] = useState(2);

  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState(-1);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState(false);

  const occasionObj = OCCASIONS.find((o) => o.key === occasion) ?? OCCASIONS[0];
  const fontObj = FONTS.find((f) => f.key === selectedFont) ?? FONTS[1];
  const gradient = OCCASION_GRADIENTS[occasion] ?? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  const isBlocked = usedToday >= DAILY_LIMIT;

  const handlePhoneConfirm = (norm) => {
    setPhone(norm);
    setUsedToday(getUsageCount(norm));
  };

  const handleChangePhone = () => {
    setPhone("");
    setWishes([]);
    setError("");
  };

  const handleGenerate = useCallback(async () => {
    if (loading || isBlocked) return;

    // Re-check usage at time of click (could have opened in another tab)
    const currentCount = getUsageCount(phone);
    if (currentCount >= DAILY_LIMIT) {
      setUsedToday(DAILY_LIMIT);
      setError(`Số ${phone} đã dùng hết ${DAILY_LIMIT} lượt hôm nay. Quay lại ngày mai nhé!`);
      return;
    }

    setLoading(true);
    setError("");
    setWishes(Array.from({ length: count }, () => ({ text: "" })));
    setStreamingIdx(0);

    try {
      await generateWishes(
        occasionObj.label,
        description.trim() || `${occasionObj.label} thông thường`,
        count,
        (partial) => {
          const parts = partial.split("---WISH---").map((s) => s.trim()).filter(Boolean);
          const cards = parts.slice(0, count).map((t) => ({ text: t }));
          while (cards.length < count) cards.push({ text: "" });
          setWishes([...cards]);
          setStreamingIdx(cards.reduce((acc, c, i) => (c.text ? i : acc), 0));
        }
      );

      // Increment only after successful generation
      const newCount = incrementUsage(phone);
      setUsedToday(newCount);
      setStreamingIdx(-1);
    } catch (err) {
      setError(err?.message ?? "Đã có lỗi xảy ra, vui lòng thử lại.");
      setWishes([]);
    } finally {
      setLoading(false);
      setStreamingIdx(-1);
    }
  }, [loading, isBlocked, phone, count, occasionObj, description]);

  const handleCopyAll = () => {
    const allText = wishes.map((w, i) => `— Lời chúc ${i + 1} —\n${w.text}`).join("\n\n");
    navigator.clipboard.writeText(allText).then(() => setSnack(true));
  };

  // Show phone gate if no phone saved
  if (!phone) {
    return (
      <>
        <Helmet>
          <title>Tạo Lời Chúc AI – Tất tần tật Phú Tân</title>
        </Helmet>
        <PhoneGate onConfirm={handlePhoneConfirm} />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Tạo Lời Chúc AI – Tất tần tật Phú Tân</title>
        <meta name="description" content="Tạo lời chúc sinh nhật, Tết, đám cưới bằng AI với font chữ đẹp" />
      </Helmet>

      {/* ── Hero ── */}
      <Box sx={{
        background: gradient, py: { xs: 4, md: 6 },
        transition: "background 0.5s ease",
        position: "relative", overflow: "hidden",
        "&::before": {
          content: '""', position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.22) 0%, transparent 55%)",
          pointerEvents: "none",
        },
      }}>
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{
                fontFamily: "'Dancing Script', cursive", fontWeight: 700, color: "#fff",
                textShadow: "0 2px 16px rgba(0,0,0,0.18)",
                fontSize: { xs: "2rem", md: "2.8rem" }, lineHeight: 1.2, mb: 0.5,
              }}>
                Tạo Lời Chúc {occasionObj.emoji}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem" }}>
                Mô tả → AI tạo lời chúc chân thành với font chữ đẹp
              </Typography>
            </Box>
            <UsageBadge phone={phone} usedToday={usedToday} onChangePhone={handleChangePhone} />
          </Box>
        </Container>
      </Box>

      {/* ── Blocked Banner ── */}
      {isBlocked && (
        <Box sx={{ background: "#fff3e0", borderBottom: "1px solid #ffe0b2", py: 1.5, px: 3, textAlign: "center" }}>
          <Typography sx={{ color: "#e65100", fontWeight: 700, fontSize: "0.92rem" }}>
            Số {phone} đã dùng hết {DAILY_LIMIT} lượt hôm nay 😊  Quay lại ngày mai hoặc{" "}
            <Box component="span" onClick={handleChangePhone}
              sx={{ textDecoration: "underline", cursor: "pointer", fontWeight: 800 }}>
              đổi số điện thoại
            </Box>
          </Typography>
        </Box>
      )}

      {/* ── Form ── */}
      <Box sx={{ background: "var(--color-background)", minHeight: "60vh", py: { xs: 4, md: 6 } }}>
        <Container maxWidth="md">
          <Paper elevation={0} sx={{
            p: { xs: 3, md: 4 }, borderRadius: 4,
            bgcolor: "var(--color-surface)",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            opacity: isBlocked ? 0.55 : 1,
            pointerEvents: isBlocked ? "none" : "auto",
            transition: "opacity 0.3s",
          }}>

            {/* Step 1 */}
            <Typography variant="overline" sx={{ fontWeight: 800, color: "var(--color-primary)", letterSpacing: "0.1em", display: "block", mb: 1.5 }}>
              1. Dịp gì?
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3.5 }}>
              {OCCASIONS.map((o) => (
                <Chip
                  key={o.key}
                  label={`${o.emoji} ${o.label}`}
                  onClick={() => setOccasion(o.key)}
                  sx={{
                    fontWeight: 700, borderRadius: 2, px: 0.5, fontSize: "0.88rem",
                    border: occasion === o.key ? "2px solid transparent" : "2px solid rgba(0,0,0,0.1)",
                    background: occasion === o.key ? gradient : "transparent",
                    color: occasion === o.key ? "#fff" : "var(--color-text)",
                    transition: "all 0.2s",
                    "&:hover": { transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" },
                  }}
                />
              ))}
            </Box>

            {/* Step 2 */}
            <Typography variant="overline" sx={{ fontWeight: 800, color: "var(--color-primary)", letterSpacing: "0.1em", display: "block", mb: 1.5 }}>
              2. Mô tả thêm (không bắt buộc)
            </Typography>
            <TextField
              fullWidth multiline minRows={3} maxRows={6}
              placeholder={`VD: Chúc mừng sinh nhật ba, 60 tuổi, giọng văn ấm áp con cái dành cho cha…\nHoặc: Chúc mừng đám cưới bạn thân, vui tươi hài hước, phong cách miền Tây…`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                mb: 3.5,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5, fontSize: "0.95rem",
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-primary)" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-primary)" },
                },
              }}
            />

            {/* Step 3 */}
            <Typography variant="overline" sx={{ fontWeight: 800, color: "var(--color-primary)", letterSpacing: "0.1em", display: "block", mb: 1.5 }}>
              3. Chọn font chữ
            </Typography>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
              gap: 1.5, mb: 3.5,
            }}>
              {FONTS.map((f) => (
                <Paper
                  key={f.key} elevation={0}
                  onClick={() => setSelectedFont(f.key)}
                  sx={{
                    p: 1.8, borderRadius: 2.5, cursor: "pointer", textAlign: "center",
                    border: selectedFont === f.key ? "2px solid var(--color-primary)" : "2px solid rgba(0,0,0,0.08)",
                    bgcolor: selectedFont === f.key ? "rgba(46,125,50,0.05)" : "var(--color-background)",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "var(--color-primary)", transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" },
                  }}
                >
                  <Typography sx={{ fontFamily: f.family, fontSize: f.size, color: "var(--color-text)", lineHeight: 1.3, mb: 0.5 }}>
                    {f.preview}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: selectedFont === f.key ? "var(--color-primary)" : "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {f.label}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Step 4 */}
            <Typography variant="overline" sx={{ fontWeight: 800, color: "var(--color-primary)", letterSpacing: "0.1em", display: "block", mb: 1.5 }}>
              4. Số lượng lời chúc
            </Typography>
            <ToggleButtonGroup
              value={count} exclusive
              onChange={(_, v) => v && setCount(v)}
              sx={{ mb: 3.5 }}
            >
              {COUNT_OPTIONS.map((n) => (
                <ToggleButton key={n} value={n} sx={{
                  fontWeight: 800, px: 3.5,
                  borderRadius: "8px !important",
                  border: "2px solid rgba(0,0,0,0.12) !important",
                  mx: 0.5,
                  "&.Mui-selected": {
                    background: gradient + " !important",
                    color: "#fff !important",
                    border: "2px solid transparent !important",
                  },
                }}>
                  {n} lời chúc
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {/* Generate */}
            <Button
              fullWidth variant="contained" size="large"
              onClick={handleGenerate}
              disabled={loading || isBlocked}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
              sx={{
                borderRadius: 3, py: 1.7, fontWeight: 800, fontSize: "1rem",
                textTransform: "none",
                background: loading || isBlocked ? undefined : gradient,
                boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                transition: "all 0.25s",
                "&:hover": { boxShadow: "0 8px 32px rgba(0,0,0,0.25)", transform: "translateY(-1px)" },
                "&.Mui-disabled": { background: "rgba(0,0,0,0.08)", boxShadow: "none" },
              }}
            >
              {loading ? "Đang tạo lời chúc…" : `✨ Tạo ${count} Lời Chúc ${occasionObj.emoji}`}
            </Button>

            {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
          </Paper>

          {/* ── Results ── */}
          {wishes.length > 0 && (
            <Box sx={{ mt: 5 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1.5 }}>
                <Typography variant="h5" sx={{
                  fontFamily: "'Dancing Script', cursive", fontWeight: 700,
                  color: "var(--color-text)", fontSize: { xs: "1.6rem", md: "2rem" },
                }}>
                  Lời chúc của bạn {occasionObj.emoji}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {wishes.every((w) => w.text) && (
                    <Button variant="outlined" size="small"
                      startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                      onClick={handleCopyAll}
                      sx={{ borderRadius: 99, textTransform: "none", fontWeight: 700, fontSize: "0.82rem" }}>
                      Sao chép tất cả
                    </Button>
                  )}
                  {!isBlocked && (
                    <Button variant="outlined" size="small"
                      startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                      onClick={handleGenerate} disabled={loading}
                      sx={{ borderRadius: 99, textTransform: "none", fontWeight: 700, fontSize: "0.82rem" }}>
                      Tạo lại
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "grid", gap: 3 }}>
                {wishes.map((w, i) => (
                  <WishCard
                    key={i} index={i} text={w.text}
                    fontFamily={fontObj.family} fontSize={fontObj.size}
                    gradient={gradient}
                    streaming={streamingIdx === i && loading}
                  />
                ))}
              </Box>

              {/* Font switcher */}
              <Box sx={{ mt: 4, p: 2.5, borderRadius: 3, textAlign: "center", bgcolor: "rgba(0,0,0,0.03)", border: "1px dashed rgba(0,0,0,0.1)" }}>
                <Typography sx={{ fontSize: "0.8rem", color: "var(--color-subtle)", mb: 1, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Thử font chữ khác
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                  {FONTS.map((f) => (
                    <Chip key={f.key} label={f.label} size="small"
                      onClick={() => setSelectedFont(f.key)}
                      sx={{
                        fontFamily: f.family, fontSize: "0.95rem",
                        border: selectedFont === f.key ? "2px solid var(--color-primary)" : "1px solid rgba(0,0,0,0.15)",
                        bgcolor: selectedFont === f.key ? "rgba(46,125,50,0.08)" : "transparent",
                        color: "var(--color-text)", fontWeight: selectedFont === f.key ? 700 : 400,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(46,125,50,0.05)" },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      <Snackbar open={snack} autoHideDuration={2500} onClose={() => setSnack(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack(false)} severity="success" sx={{ borderRadius: 3, fontWeight: 700 }}>
          Đã sao chép tất cả lời chúc!
        </Alert>
      </Snackbar>
    </>
  );
}
