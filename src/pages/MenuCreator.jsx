// src/pages/MenuCreator.jsx – Responsive drag-drop menu board editor
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  Box, Typography, Paper, TextField, Button, IconButton,
  Tooltip, Tabs, Tab, Select, MenuItem as MuiMenuItem,
  FormControl, InputLabel, Slider, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  CircularProgress, Divider, Drawer, useMediaQuery, useTheme,
} from "@mui/material";
import DownloadIcon          from "@mui/icons-material/Download";
import AutoAwesomeIcon       from "@mui/icons-material/AutoAwesome";
import DeleteIcon            from "@mui/icons-material/Delete";
import AddIcon               from "@mui/icons-material/Add";
import UndoIcon              from "@mui/icons-material/Undo";
import RedoIcon              from "@mui/icons-material/Redo";
import EditIcon              from "@mui/icons-material/Edit";
import CloseIcon             from "@mui/icons-material/Close";
import FormatBoldIcon        from "@mui/icons-material/FormatBold";
import FormatItalicIcon      from "@mui/icons-material/FormatItalic";
import FormatAlignLeftIcon   from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon  from "@mui/icons-material/FormatAlignRight";
import ArrowUpwardIcon       from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon     from "@mui/icons-material/ArrowDownward";
import RestaurantMenuIcon    from "@mui/icons-material/RestaurantMenu";
import RemoveIcon            from "@mui/icons-material/Remove";
import ZoomOutMapIcon        from "@mui/icons-material/ZoomOutMap";

// ── Constants ─────────────────────────────────────────────────────────────────

const BOARD_SIZES = [
  { label: "Ngang A5",  w: 794,  h: 559  },
  { label: "Vuông",     w: 680,  h: 680  },
  { label: "Dọc A5",   w: 559,  h: 794  },
  { label: "Ngang A4", w: 1122, h: 794  },
];

const BG_PRESETS = [
  { label: "Trắng",          v: "#ffffff" },
  { label: "Kem ấm",         v: "#fff8f0" },
  { label: "Vàng nhẹ",       v: "#fffde7" },
  { label: "Xanh lá nhẹ",    v: "#f1f8e9" },
  { label: "Hồng phấn",      v: "#fce4ec" },
  { label: "Xanh dương nhẹ", v: "#e3f2fd" },
  { label: "Tím lavender",   v: "#ede7f6" },
  { label: "Nâu latte",      v: "#efebe9" },
  { label: "Gradient vàng",  v: "linear-gradient(135deg,#fff9e6 0%,#ffe082 100%)" },
  { label: "Gradient xanh",  v: "linear-gradient(135deg,#e8f5e9 0%,#a5d6a7 100%)" },
  { label: "Gradient hồng",  v: "linear-gradient(135deg,#fce4ec 0%,#f48fb1 100%)" },
  { label: "Gradient cam",   v: "linear-gradient(135deg,#fff3e0 0%,#ffcc80 100%)" },
  { label: "Gradient tím",   v: "linear-gradient(135deg,#ede7f6 0%,#ce93d8 100%)" },
  { label: "Đêm tối",        v: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)" },
  { label: "Gỗ tối",         v: "#3e2723" },
  { label: "Đen sang",       v: "#212121" },
];

const FONT_OPTIONS = [
  { label: "Inter – Hiện đại",         v: "Inter, sans-serif" },
  { label: "Merriweather – Cổ điển",   v: "'Merriweather', serif" },
  { label: "Dancing Script – Chữ đẹp", v: "'Dancing Script', cursive" },
  { label: "Great Vibes – Thư pháp",   v: "'Great Vibes', cursive" },
  { label: "Satisfy – Lãng mạn",       v: "'Satisfy', cursive" },
  { label: "Pacifico – Vui tươi",      v: "'Pacifico', cursive" },
  { label: "Lora – Trang nhã",         v: "'Lora', serif" },
];

const FOOD_EMOJIS = [
  "🍜","🍲","🥘","🍛","🍱","🥗","🍚","🍖","🍗","🥩","🍤","🦐","🦑","🦀",
  "🐟","🥚","🧆","🥙","🌮","🌯","🥪","🍔","🍕","🍣","🥡","🥟","🍢","🍡",
  "🍧","🍨","🍦","🧁","🎂","🍰","🍮","☕","🍵","🧋","🥤","🍹","🧃","🍺",
  "🎉","⭐","✨","🌟","💫","🔥","❤️","🌿","🌸","🍀","🌺","🌻","🏵️","🎊",
];

const SHAPE_OPTIONS = [
  { label: "Hộp chữ nhật", type: "rect",   color: "#ffd700", w: 200, h: 80  },
  { label: "Hình tròn",    type: "circle", color: "#ff6b6b", w: 100, h: 100 },
  { label: "Kẻ ngang",     type: "hline",  color: "#555555", w: 300, h: 3   },
  { label: "Kẻ dọc",       type: "vline",  color: "#555555", w: 3,   h: 120 },
];

const TEXT_PRESETS = [
  { label: "Tiêu đề lớn",   content: "THỰC ĐƠN",                  fontSize: 52, fontFamily: "'Dancing Script', cursive", bold: true,  italic: false, color: "#2d1b00", align: "center" },
  { label: "Tên mục",       content: "Món Chính",                  fontSize: 28, fontFamily: "'Merriweather', serif",     bold: true,  italic: false, color: "#c62828", align: "left"   },
  { label: "Phụ đề",        content: "Phong cách miền Tây Nam Bộ", fontSize: 18, fontFamily: "'Satisfy', cursive",        bold: false, italic: true,  color: "#6d4c41", align: "center" },
  { label: "Giá tiền",      content: "35,000đ",                    fontSize: 22, fontFamily: "'Dancing Script', cursive", bold: true,  italic: false, color: "#c62828", align: "right"  },
  { label: "Mô tả",         content: "Thêm mô tả món ăn tại đây", fontSize: 13, fontFamily: "Inter, sans-serif",          bold: false, italic: false, color: "#777",    align: "left"   },
  { label: "Chú thích nhỏ", content: "* Giá đã bao gồm VAT",      fontSize: 12, fontFamily: "Inter, sans-serif",          bold: false, italic: true,  color: "#aaa",    align: "right"  },
  { label: "Chữ tự do",     content: "Nhập văn bản",               fontSize: 20, fontFamily: "Inter, sans-serif",          bold: false, italic: false, color: "#333",    align: "left"   },
];

const AI_QUICK_PROMPTS = [
  "Quán cơm bình dân miền Tây, ấm cúng, giá rẻ",
  "Nhà hàng hải sản tươi sống cao cấp ven biển",
  "Quán bún bò Huế truyền thống, đặc trưng miền Trung",
  "Quán ăn chay Phật giáo, thanh đạm, tốt cho sức khỏe",
  "Quán cà phê & bánh ngọt phong cách vintage",
  "Nhà hàng nướng BBQ Hàn Quốc – Nhật Bản",
];

const DEFAULT_AI_PROMPT = `Bạn là chuyên gia thiết kế menu nhà hàng Việt Nam. Hãy tạo danh sách món ăn đặc sắc cho menu, phong cách miền Tây Nam Bộ, dân dã và ấm cúng. Tên món ngắn gọn, hấp dẫn. Giá từ 20,000đ đến 80,000đ. Mỗi món kèm emoji phù hợp và mô tả ngắn 5-8 từ.`;

// ── ID generator ──────────────────────────────────────────────────────────────

let _seq = 0;
const uid = () => `el-${Date.now()}-${++_seq}`;

// ── Element node renderer ─────────────────────────────────────────────────────

function ElementNode({ el, selected, onPointerDown }) {
  const base = {
    position:     "absolute",
    left:         el.x,
    top:          el.y,
    zIndex:       el.zIndex ?? 1,
    cursor:       "move",
    userSelect:   "none",
    outline:      selected ? "2px dashed #1976d2" : "2px solid transparent",
    outlineOffset: 3,
    boxSizing:    "border-box",
    touchAction:  "none",
  };

  const pd = (e) => { e.preventDefault(); e.stopPropagation(); onPointerDown(e, el.id); };

  if (el.type === "text") return (
    <div onPointerDown={pd} style={{
      ...base,
      width:         el.width ?? "auto",
      fontFamily:    el.fontFamily ?? "Inter, sans-serif",
      fontSize:      el.fontSize ?? 24,
      fontWeight:    el.bold ? 700 : 400,
      fontStyle:     el.italic ? "italic" : "normal",
      color:         el.color ?? "#333",
      textAlign:     el.align ?? "left",
      lineHeight:    el.lineHeight ?? 1.35,
      letterSpacing: el.tracking ? `${el.tracking}px` : 0,
      textShadow:    el.shadow ? "1px 1px 4px rgba(0,0,0,0.28)" : "none",
      whiteSpace:    "pre-wrap",
      wordBreak:     "break-word",
      padding:       "2px 4px",
    }}>
      {el.content}
    </div>
  );

  if (el.type === "emoji") return (
    <div onPointerDown={pd} style={{ ...base, fontSize: el.size ?? 48, lineHeight: 1 }}>
      {el.content}
    </div>
  );

  if (el.type === "menuItem") return (
    <div onPointerDown={pd} style={{
      ...base,
      width:        el.width ?? 320,
      padding:      `${el.padY ?? 10}px ${el.padX ?? 14}px`,
      background:   el.bgColor ?? "transparent",
      borderRadius: el.radius ?? 8,
      borderLeft:   el.accent ? `4px solid ${el.accentColor ?? "#c62828"}` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
          {el.emoji && <span style={{ fontSize: el.emojiSize ?? 22, lineHeight: 1.3, flexShrink: 0 }}>{el.emoji}</span>}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: el.nameFont ?? "'Merriweather', serif",
              fontSize:   el.nameSize ?? 15,
              fontWeight: 700,
              color:      el.nameColor ?? "#2d1b00",
              lineHeight: 1.3,
            }}>
              {el.name}
            </div>
            {el.desc && (
              <div style={{
                fontFamily: "Inter, sans-serif",
                fontSize:   (el.nameSize ?? 15) - 3,
                color:      el.descColor ?? "#888",
                lineHeight: 1.3,
                marginTop:  2,
              }}>
                {el.desc}
              </div>
            )}
          </div>
        </div>
        <div style={{
          fontFamily: el.priceFont ?? "'Dancing Script', cursive",
          fontSize:   el.priceSize ?? 18,
          fontWeight: 700,
          color:      el.priceColor ?? "#c62828",
          whiteSpace: "nowrap",
          flexShrink: 0,
          lineHeight: 1.3,
        }}>
          {el.price}
        </div>
      </div>
    </div>
  );

  if (el.type === "shape") {
    if (el.shape === "hline") return (
      <div onPointerDown={pd} style={{ ...base, width: el.width ?? 300, height: el.height ?? 3, background: el.color ?? "#555", borderRadius: 99 }} />
    );
    if (el.shape === "vline") return (
      <div onPointerDown={pd} style={{ ...base, width: el.width ?? 3, height: el.height ?? 120, background: el.color ?? "#555", borderRadius: 99 }} />
    );
    return (
      <div onPointerDown={pd} style={{
        ...base,
        width:        el.width ?? 200,
        height:       el.height ?? 80,
        background:   el.color ?? "#ffd700",
        borderRadius: el.shape === "circle" ? "50%" : (el.radius ?? 8),
        opacity:      el.opacity ?? 1,
        border:       el.bordered ? `${el.borderW ?? 2}px solid ${el.borderColor ?? "#333"}` : "none",
      }} />
    );
  }
  return null;
}

// ── Properties panel content ──────────────────────────────────────────────────

function PropsPanel({ el, onUpdate, onDelete, onUp, onDown }) {
  if (!el) return (
    <Box sx={{ p: 2, textAlign: "center", mt: 3, color: "var(--color-subtle)" }}>
      <RestaurantMenuIcon sx={{ fontSize: 32, opacity: 0.25, display: "block", mx: "auto", mb: 1 }} />
      <Typography sx={{ fontSize: "0.82rem" }}>Click phần tử<br />để chỉnh sửa</Typography>
    </Box>
  );

  const set = (k, v) => onUpdate(el.id, { [k]: v });

  const colInput = (label, key, def) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography sx={{ fontSize: "0.78rem", color: "var(--color-subtle)", flex: 1 }}>{label}</Typography>
      <input type="color" value={el[key] ?? def}
        onChange={(e) => set(key, e.target.value)}
        style={{ width: 34, height: 26, border: "1px solid #ddd", borderRadius: 5, cursor: "pointer", padding: 1 }}
      />
    </Box>
  );

  const numInput = (label, key, def) => (
    <TextField label={label} type="number" size="small" value={el[key] ?? def}
      onChange={(e) => set(key, Number(e.target.value))}
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
    />
  );

  return (
    <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>

      {/* Position */}
      <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Vị trí & kích thước
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        {numInput("X", "x", 0)}
        {numInput("Y", "y", 0)}
        {el.width  != null && numInput("Rộng", "width",  el.width)}
        {el.height != null && numInput("Cao",  "height", el.height)}
      </Box>

      {/* ── TEXT ── */}
      {el.type === "text" && <>
        <Divider />
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Văn bản</Typography>
        <TextField multiline minRows={2} maxRows={5} size="small" label="Nội dung"
          value={el.content ?? ""}
          onChange={(e) => set("content", e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
        />
        <FormControl size="small" fullWidth>
          <InputLabel>Font chữ</InputLabel>
          <Select value={el.fontFamily ?? "Inter, sans-serif"} label="Font chữ"
            onChange={(e) => set("fontFamily", e.target.value)} sx={{ borderRadius: 1.5 }}>
            {FONT_OPTIONS.map((f) => <MuiMenuItem key={f.v} value={f.v} sx={{ fontFamily: f.v }}>{f.label}</MuiMenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          {numInput("Cỡ chữ", "fontSize", 24)}
          {numInput("Giãn",   "tracking", 0)}
        </Box>
        {colInput("Màu chữ", "color", "#333333")}
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {[
            [FormatBoldIcon,   () => set("bold",   !el.bold),   el.bold],
            [FormatItalicIcon, () => set("italic", !el.italic), el.italic],
          ].map(([Icon, fn, active], i) => (
            <IconButton key={i} size="small" onClick={fn}
              sx={{ borderRadius: 1, border: "1px solid rgba(0,0,0,0.1)", bgcolor: active ? "rgba(25,118,210,0.1)" : "transparent" }}>
              <Icon sx={{ fontSize: 17 }} />
            </IconButton>
          ))}
          {["left", "center", "right"].map((a) => {
            const Icon = a === "left" ? FormatAlignLeftIcon : a === "center" ? FormatAlignCenterIcon : FormatAlignRightIcon;
            return (
              <IconButton key={a} size="small" onClick={() => set("align", a)}
                sx={{ borderRadius: 1, border: "1px solid rgba(0,0,0,0.1)", bgcolor: (el.align ?? "left") === a ? "rgba(25,118,210,0.1)" : "transparent" }}>
                <Icon sx={{ fontSize: 17 }} />
              </IconButton>
            );
          })}
        </Box>
        <FormControlLabel sx={{ m: 0 }}
          control={<Switch size="small" checked={el.shadow ?? false} onChange={(e) => set("shadow", e.target.checked)} />}
          label={<Typography sx={{ fontSize: "0.82rem" }}>Bóng chữ</Typography>}
        />
      </>}

      {/* ── EMOJI ── */}
      {el.type === "emoji" && <>
        <Divider />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography sx={{ fontSize: "0.78rem", color: "var(--color-subtle)", flex: 1 }}>Emoji</Typography>
          <TextField size="small" value={el.content ?? "🍜"}
            onChange={(e) => set("content", e.target.value)}
            sx={{ width: 80, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
          />
        </Box>
        {numInput("Kích thước", "size", 48)}
      </>}

      {/* ── MENU ITEM ── */}
      {el.type === "menuItem" && <>
        <Divider />
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Món ăn</Typography>
        {[["Tên món","name"],["Giá","price"],["Mô tả","desc"],["Emoji","emoji"]].map(([l, k]) => (
          <TextField key={k} label={l} size="small" value={el[k] ?? ""}
            onChange={(e) => set(k, e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
          />
        ))}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          {numInput("Cỡ tên", "nameSize", 15)}
          {numInput("Cỡ giá", "priceSize", 18)}
        </Box>
        {colInput("Màu tên",   "nameColor",  "#2d1b00")}
        {colInput("Màu giá",   "priceColor", "#c62828")}
        {colInput("Màu mô tả", "descColor",  "#888888")}
        {colInput("Màu nền",   "bgColor",    "#fff8f0")}
        <FormControlLabel sx={{ m: 0 }}
          control={<Switch size="small" checked={el.accent ?? true} onChange={(e) => set("accent", e.target.checked)} />}
          label={<Typography sx={{ fontSize: "0.82rem" }}>Viền màu trái</Typography>}
        />
        {el.accent && colInput("Màu viền", "accentColor", "#c62828")}
        <FormControl size="small" fullWidth>
          <InputLabel>Font tên</InputLabel>
          <Select value={el.nameFont ?? "'Merriweather', serif"} label="Font tên"
            onChange={(e) => set("nameFont", e.target.value)} sx={{ borderRadius: 1.5 }}>
            {FONT_OPTIONS.map((f) => <MuiMenuItem key={f.v} value={f.v} sx={{ fontFamily: f.v }}>{f.label}</MuiMenuItem>)}
          </Select>
        </FormControl>
      </>}

      {/* ── SHAPE ── */}
      {el.type === "shape" && <>
        <Divider />
        {colInput("Màu", "color", "#ffd700")}
        {el.shape === "rect" && numInput("Bo góc", "radius", 8)}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: "0.78rem", color: "var(--color-subtle)", flex: 1 }}>Độ mờ</Typography>
          <Slider size="small" min={0.05} max={1} step={0.05}
            value={el.opacity ?? 1} onChange={(_, v) => set("opacity", v)} sx={{ width: 90 }} />
          <Typography sx={{ fontSize: "0.78rem", minWidth: 28 }}>{Math.round((el.opacity ?? 1) * 100)}%</Typography>
        </Box>
        <FormControlLabel sx={{ m: 0 }}
          control={<Switch size="small" checked={el.bordered ?? false} onChange={(e) => set("bordered", e.target.checked)} />}
          label={<Typography sx={{ fontSize: "0.82rem" }}>Viền</Typography>}
        />
        {el.bordered && colInput("Màu viền", "borderColor", "#333333")}
      </>}

      {/* Layer + delete */}
      <Divider />
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <Tooltip title="Lên trên">
          <IconButton size="small" onClick={() => onUp(el.id)} sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1 }}>
            <ArrowUpwardIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xuống dưới">
          <IconButton size="small" onClick={() => onDown(el.id)} sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1 }}>
            <ArrowDownwardIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button size="small" color="error" startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
          onClick={() => onDelete(el.id)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.8rem" }}>
          Xóa
        </Button>
      </Box>
    </Box>
  );
}

// ── Add-elements panel (shared between desktop sidebar & mobile drawer) ────────

function AddPanel({ tab, setTab, boardBg, setBoardBg, addText, addEmoji, addMenuItem, addShape }) {
  const isGrad = boardBg.includes("gradient");

  return (
    <>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons={false}
        sx={{
          borderBottom: "1px solid rgba(0,0,0,0.08)", minHeight: 40, flexShrink: 0,
          "& .MuiTab-root": { minHeight: 40, fontSize: "0.7rem", fontWeight: 700, py: 0.5, minWidth: 0, px: 1.2 },
        }}>
        <Tab label="🎨 Nền" />
        <Tab label="🔤 Chữ" />
        <Tab label="😊 Sticker" />
        <Tab label="🍽️ Món" />
        <Tab label="◻️ Hình" />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: "auto", p: 1.2 }}>

        {/* ── Tab 0: Backgrounds ── */}
        {tab === 0 && <>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--color-subtle)", mb: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Màu nền board
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.7, mb: 2 }}>
            {BG_PRESETS.map((p) => (
              <Tooltip key={p.v} title={p.label}>
                <Box onClick={() => setBoardBg(p.v)} sx={{
                  aspectRatio: "1", borderRadius: 1.5, cursor: "pointer",
                  background: p.v.includes("gradient") ? p.v : undefined,
                  backgroundColor: !p.v.includes("gradient") ? p.v : undefined,
                  backgroundImage: p.v.includes("gradient") ? p.v : undefined,
                  border: boardBg === p.v ? "2.5px solid var(--color-primary)" : "2px solid rgba(0,0,0,0.1)",
                  transition: "transform 0.15s",
                  "&:hover": { transform: "scale(1.12)" },
                }} />
              </Tooltip>
            ))}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "0.78rem", color: "var(--color-subtle)", flex: 1 }}>Tùy chỉnh màu</Typography>
            <input type="color" value={isGrad ? "#fff8f0" : boardBg}
              onChange={(e) => setBoardBg(e.target.value)}
              style={{ width: 34, height: 26, border: "1px solid #ddd", borderRadius: 5, cursor: "pointer", padding: 1 }}
            />
          </Box>
        </>}

        {/* ── Tab 1: Text ── */}
        {tab === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
            {TEXT_PRESETS.map((t) => (
              <Paper key={t.label} elevation={0} onClick={() => addText(t)}
                sx={{ p: 1.2, cursor: "pointer", borderRadius: 2,
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  "&:hover": { borderColor: "var(--color-primary)", bgcolor: "rgba(46,125,50,0.04)" },
                  transition: "all 0.15s" }}>
                <Typography sx={{
                  fontFamily: t.fontFamily, fontWeight: t.bold ? 700 : 400,
                  fontStyle: t.italic ? "italic" : "normal",
                  fontSize: Math.min(t.fontSize * 0.52, 17),
                  color: t.color, textAlign: t.align, lineHeight: 1.25,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {t.content}
                </Typography>
                <Typography sx={{ fontSize: "0.62rem", color: "var(--color-subtle)", mt: 0.2 }}>
                  {t.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* ── Tab 2: Emoji ── */}
        {tab === 2 && <>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--color-subtle)", mb: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Click để thêm
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.2 }}>
            {FOOD_EMOJIS.map((e) => (
              <Box key={e} onClick={() => addEmoji(e)} sx={{
                textAlign: "center", fontSize: "1.35rem", py: 0.5,
                borderRadius: 1.5, cursor: "pointer",
                "&:hover": { bgcolor: "rgba(0,0,0,0.06)", transform: "scale(1.25)" },
                transition: "all 0.12s",
              }}>
                {e}
              </Box>
            ))}
          </Box>
        </>}

        {/* ── Tab 3: Menu items ── */}
        {tab === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
            <Button fullWidth variant="contained" size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => addMenuItem()}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, bgcolor: "var(--color-primary)", fontSize: "0.82rem" }}>
              Thêm món ăn
            </Button>
            <Typography sx={{ fontSize: "0.68rem", color: "var(--color-subtle)", textAlign: "center", my: 0.5 }}>
              Hoặc dùng ✨ AI tạo tự động
            </Typography>
            <Divider />
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Mẫu nhanh
            </Typography>
            {[
              { emoji:"🍖", name:"Cơm tấm sườn",        price:"45,000đ", desc:"Sườn nướng, bì, chả" },
              { emoji:"🍜", name:"Bún bò Huế",           price:"35,000đ", desc:"Bún bò đặc trưng" },
              { emoji:"🥖", name:"Bánh mì thịt",         price:"20,000đ", desc:"Bánh giòn, thịt nguội" },
              { emoji:"🍛", name:"Cơm chiên dương châu", price:"40,000đ", desc:"Cơm chiên đặc biệt" },
            ].map((item) => (
              <Paper key={item.name} elevation={0} onClick={() => addMenuItem(item)}
                sx={{ p: 1, cursor: "pointer", borderRadius: 2,
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  "&:hover": { borderColor: "var(--color-primary)", bgcolor: "rgba(46,125,50,0.04)" },
                  transition: "all 0.15s" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <span style={{ fontSize: "1rem" }}>{item.emoji}</span>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#2d1b00", lineHeight: 1.2 }}>
                      {item.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "#c62828", fontWeight: 700 }}>{item.price}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* ── Tab 4: Shapes ── */}
        {tab === 4 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
            {SHAPE_OPTIONS.map((s) => (
              <Paper key={s.type} elevation={0} onClick={() => addShape(s)}
                sx={{ p: 1.3, cursor: "pointer", borderRadius: 2,
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  "&:hover": { borderColor: "var(--color-primary)", bgcolor: "rgba(46,125,50,0.04)" },
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 1.2 }}>
                <Box sx={{
                  width:  s.type === "vline" ? 4  : s.type === "hline" ? 42 : s.type === "circle" ? 26 : 42,
                  height: s.type === "hline" ? 4  : s.type === "vline" ? 26 : 26,
                  bgcolor: s.color,
                  borderRadius: s.type === "circle" ? "50%" : s.type.includes("line") ? 99 : 4,
                  flexShrink: 0,
                }} />
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text)" }}>{s.label}</Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MenuCreator() {
  const theme   = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [boardSizeIdx, setBoardSizeIdx] = useState(0);
  const [boardBg,      setBoardBg]      = useState("#fff8f0");
  const [elements,     setElements]     = useState([]);
  const [selectedId,   setSelectedId]   = useState(null);
  const [tab,          setTab]          = useState(0);
  const [aiOpen,       setAiOpen]       = useState(false);
  const [aiPrompt,     setAiPrompt]     = useState(DEFAULT_AI_PROMPT);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [exportPreview, setExportPreview] = useState(null); // data URL for WebView save dialog
  const [history,      setHistory]      = useState([[]]);
  const [hIdx,         setHIdx]         = useState(0);
  const [propsOpen,    setPropsOpen]    = useState(false); // mobile props drawer
  const [addOpen,      setAddOpen]      = useState(false); // mobile add drawer
  const [boardScale,   setBoardScale]   = useState(1);
  const [zoomLevel,    setZoomLevel]    = useState(1);    // user zoom multiplier

  const boardRef        = useRef(null);
  const containerRef    = useRef(null);
  const dragRef         = useRef({ active: false });
  const pinchTouches    = useRef(new Map()); // pointerId → {x,y}
  const pinchStartDist  = useRef(0);
  const pinchStartZoom  = useRef(1);
  const elemsRef     = useRef(elements);
  useEffect(() => { elemsRef.current = elements; }, [elements]);

  const boardSize     = BOARD_SIZES[boardSizeIdx];
  const selected      = elements.find((e) => e.id === selectedId) ?? null;
  const effectiveScale = boardScale * zoomLevel;

  // ── Auto-scale board to fit container ──

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const pad   = isMobile ? 16 : 48;
      const avail = containerRef.current.clientWidth - pad;
      setBoardScale(Math.min(1, avail / boardSize.w));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [boardSize.w, isMobile]);

  // ── History ──

  const snapshot = useCallback((els) => {
    setHistory((prev) => {
      const base = prev.slice(0, hIdx + 1);
      return [...base, els].slice(-40);
    });
    setHIdx((i) => Math.min(i + 1, 39));
  }, [hIdx]);

  const undo = () => {
    if (hIdx <= 0) return;
    const ni = hIdx - 1;
    setHIdx(ni); setElements(history[ni] ?? []); setSelectedId(null);
  };

  const redo = () => {
    if (hIdx >= history.length - 1) return;
    const ni = hIdx + 1;
    setHIdx(ni); setElements(history[ni] ?? []); setSelectedId(null);
  };

  // ── CRUD ──

  const addEl = (el) => {
    const next = [...elements, el];
    setElements(next); setSelectedId(el.id); snapshot(next);
    if (isMobile) setAddOpen(false);
  };

  const updateEl = (id, patch) => setElements((p) => p.map((e) => e.id === id ? { ...e, ...patch } : e));

  const deleteEl = (id) => {
    const next = elements.filter((e) => e.id !== id);
    setElements(next); setSelectedId(null); snapshot(next);
    if (isMobile) setPropsOpen(false);
  };

  const bringUp = (id) => setElements((p) => {
    const i = p.findIndex((e) => e.id === id);
    if (i >= p.length - 1) return p;
    const n = [...p]; [n[i], n[i + 1]] = [n[i + 1], n[i]];
    return n.map((e, j) => ({ ...e, zIndex: j }));
  });

  const sendDown = (id) => setElements((p) => {
    const i = p.findIndex((e) => e.id === id);
    if (i <= 0) return p;
    const n = [...p]; [n[i], n[i - 1]] = [n[i - 1], n[i]];
    return n.map((e, j) => ({ ...e, zIndex: j }));
  });

  // ── Prevent browser native pinch-zoom on mobile (iOS ignores user-scalable=no) ──
  // Only block 2-finger touchmove; single-finger scroll still works everywhere.

  useEffect(() => {
    if (!isMobile) return;
    const block = (e) => { if (e.touches && e.touches.length >= 2) e.preventDefault(); };
    document.addEventListener("touchmove", block, { passive: false });
    return () => document.removeEventListener("touchmove", block);
  }, [isMobile]);

  // ── Drag & Drop (pointer events — works on both touch & mouse) ──

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      // Cancel drag if a second finger arrived (pinch gesture takes over)
      if (pinchTouches.current.size >= 2) { dragRef.current.active = false; return; }
      const scale = boardRef.current
        ? boardRef.current.getBoundingClientRect().width / boardSize.w
        : 1;
      const dx = (e.clientX - d.startX) / scale;
      const dy = (e.clientY - d.startY) / scale;
      setElements((p) => p.map((el) =>
        el.id === d.id ? { ...el, x: Math.round(d.elX + dx), y: Math.round(d.elY + dy) } : el
      ));
    };
    const onUp = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
        snapshot(elemsRef.current);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, [boardSize.w, snapshot]);

  const handlePointerDown = useCallback((e, id) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedId(id);
    if (isMobile) setPropsOpen(false);
    const el = elemsRef.current.find((el) => el.id === id);
    if (!el) return;
    dragRef.current = { active: true, id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y };
  }, [isMobile]);

  // ── Pinch-to-zoom handlers (mobile board container) ──

  const handleContainerPD = useCallback((e) => {
    pinchTouches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchTouches.current.size === 2) {
      const [p1, p2] = [...pinchTouches.current.values()];
      pinchStartDist.current = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      pinchStartZoom.current = zoomLevel;
    }
  }, [zoomLevel]);

  const handleContainerPM = useCallback((e) => {
    if (!pinchTouches.current.has(e.pointerId)) return;
    pinchTouches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchTouches.current.size !== 2 || pinchStartDist.current === 0) return;
    const [p1, p2] = [...pinchTouches.current.values()];
    const dist  = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const ratio = dist / pinchStartDist.current;
    setZoomLevel(Math.min(4, Math.max(0.35, pinchStartZoom.current * ratio)));
  }, []);

  const handleContainerPU = useCallback((e) => {
    pinchTouches.current.delete(e.pointerId);
    if (pinchTouches.current.size < 2) {
      pinchStartDist.current = 0;
    }
  }, []);

  // ── Add helpers ──

  const addText = (preset = {}) => addEl({
    id: uid(), type: "text",
    x: 40, y: 40, width: 360,
    content: "Tiêu đề", fontSize: 36,
    fontFamily: "'Dancing Script', cursive",
    bold: true, italic: false,
    color: "#2d1b00", align: "center",
    shadow: false, tracking: 0,
    zIndex: elements.length,
    ...preset,
  });

  const addEmoji = (em) => addEl({
    id: uid(), type: "emoji",
    x: 60, y: 60, content: em, size: 52,
    zIndex: elements.length,
  });

  const addMenuItem = (preset = {}) => addEl({
    id: uid(), type: "menuItem",
    x: 30, y: 40 + elements.filter((e) => e.type === "menuItem").length * 68,
    width: Math.floor(boardSize.w * 0.6),
    emoji: "🍜", name: "Tên món ăn", price: "35,000đ",
    desc: "Mô tả ngắn món ăn",
    nameColor: "#2d1b00", priceColor: "#c62828", descColor: "#888",
    nameFont: "'Merriweather', serif",
    nameSize: 15, priceSize: 18, emojiSize: 22,
    accent: true, accentColor: "#c62828",
    bgColor: "rgba(255,248,240,0.65)",
    radius: 8, padX: 14, padY: 10,
    zIndex: elements.length,
    ...preset,
  });

  const addShape = (s) => addEl({
    id: uid(), type: "shape", shape: s.type,
    x: 50, y: 50,
    color: s.color, width: s.w, height: s.h,
    radius: 8, opacity: 1, bordered: false,
    zIndex: elements.length,
  });

  // ── AI generate ──

  const handleAI = async () => {
    setAiLoading(true);
    try {
      const key = (import.meta).env?.VITE_GEMINI_API_KEY;
      if (!key) throw new Error("Chưa cấu hình VITE_GEMINI_API_KEY");
      const prompt = `${aiPrompt}\n\nTạo 6 món ăn cho menu. CHỈ trả về một JSON array thuần túy, không giải thích, không markdown:\n[{"name":"Tên món","price":"XX,000đ","emoji":"🍜","desc":"Mô tả ngắn"}]`;
      const res  = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1200, temperature: 0.8, responseMimeType: "application/json" },
          }),
        }
      );
      const data  = await res.json();
      const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      // Strip markdown fences (```json ... ```) if present
      const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      // Greedy match – find the outermost [ ... ] array
      const match = stripped.match(/\[[\s\S]*\]/);
      if (!match) throw new Error(`AI không trả về JSON đúng định dạng.\nResponse: ${raw.slice(0, 200)}`);
      let items;
      try {
        items = JSON.parse(match[0]);
      } catch {
        // Last resort: try parsing stripped directly
        items = JSON.parse(stripped);
      }
      if (!Array.isArray(items) || items.length === 0) throw new Error("AI trả về danh sách rỗng");
      items = items.slice(0, 8);
      const colW   = Math.floor(boardSize.w * 0.62);
      const newEls = items.map((item, i) => ({
        id: uid(), type: "menuItem",
        x: Math.floor(boardSize.w * 0.04), y: 50 + i * 70,
        width: colW,
        emoji: item.emoji || "🍜", name: item.name || "Món ăn",
        price: item.price || "30,000đ", desc: item.desc || "",
        nameColor: "#2d1b00", priceColor: "#c62828", descColor: "#888",
        nameFont: "'Merriweather', serif",
        nameSize: 15, priceSize: 18, emojiSize: 22,
        accent: true, accentColor: "#c62828",
        bgColor: "rgba(255,248,240,0.65)",
        radius: 8, padX: 14, padY: 10,
        zIndex: elements.length + i,
      }));
      const merged = [...elements, ...newEls];
      setElements(merged); snapshot(merged); setAiOpen(false);
    } catch (err) {
      alert("Lỗi: " + (err.message ?? "Không tạo được menu"));
    } finally {
      setAiLoading(false);
    }
  };

  // ── Export PNG ──

  const handleExport = async () => {
    setSelectedId(null); setExporting(true);
    await new Promise((r) => setTimeout(r, 200));
    try {
      const { toPng } = await import("html-to-image");

      // Remove CSS transform + shadow before capture so html-to-image renders the
      // board at its natural dimensions (boardSize.w × boardSize.h).
      // Without this, on mobile the board has transform:scale(effectiveScale) and
      // the captured canvas contains the scaled-down content surrounded by empty space.
      const node = boardRef.current;
      const savedTransform = node.style.transform;
      const savedShadow    = node.style.boxShadow;
      node.style.transform = "none";
      node.style.boxShadow = "none";
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      let dataUrl;
      try {
        dataUrl = await toPng(node, { pixelRatio: 2, width: boardSize.w, height: boardSize.h });
      } finally {
        node.style.transform = savedTransform;
        node.style.boxShadow = savedShadow;
      }

      const filename = `menu-${Date.now()}.png`;

      // 1️⃣ Web Share API — iOS 15+ / Android Chrome / nhiều WebView hỗ trợ
      if (isMobile && navigator.share) {
        try {
          const blob  = await (await fetch(dataUrl)).blob();
          const file  = new File([blob], filename, { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "Menu thực đơn" });
            return;
          }
        } catch {
          // user dismissed share sheet hoặc WebView không hỗ trợ → fall through
        }
      }

      // 2️⃣ Desktop: <a download> hoạt động bình thường
      if (!isMobile) {
        const a = document.createElement("a");
        a.download = filename; a.href = dataUrl; a.click();
        return;
      }

      // 3️⃣ Fallback WebView: hiện ảnh trong dialog → user long-press để lưu
      setExportPreview(dataUrl);
    } catch (err) {
      alert("Không xuất được ảnh: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Keyboard shortcuts (desktop) ──

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) { e.preventDefault(); deleteEl(selectedId); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, hIdx, history]);

  // ── Board style ──

  const isGrad = boardBg.includes("gradient");
  const boardStyle = {
    width: boardSize.w, height: boardSize.h,
    position: "relative", overflow: "hidden", flexShrink: 0,
    ...(isGrad ? { backgroundImage: boardBg } : { backgroundColor: boardBg }),
    boxShadow: "0 4px 40px rgba(0,0,0,0.22)",
    transform: `scale(${effectiveScale})`,
    transformOrigin: "top left",
  };

  // Wrapper takes the visual (scaled) dimensions so parent scroll works correctly
  const boardWrapperStyle = {
    width:    boardSize.w * effectiveScale,
    height:   boardSize.h * effectiveScale,
    flexShrink: 0,
    overflow: "visible",
  };

  // ── Shared toolbar buttons ──

  const toolbarButtons = (
    <>
      <Tooltip title="Hoàn tác">
        <span><IconButton size="small" onClick={undo} disabled={hIdx <= 0}
          sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1.5 }}>
          <UndoIcon sx={{ fontSize: 18 }} />
        </IconButton></span>
      </Tooltip>
      <Tooltip title="Làm lại">
        <span><IconButton size="small" onClick={redo} disabled={hIdx >= history.length - 1}
          sx={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1.5 }}>
          <RedoIcon sx={{ fontSize: 18 }} />
        </IconButton></span>
      </Tooltip>
    </>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <title>Tạo Menu Thực Đơn – Tất tần tật Phú Tân</title>
        <meta name="description" content="Thiết kế menu thực đơn đẹp với AI, drag-drop, xuất ảnh PNG" />
      </Helmet>

      {/* ── Toolbar ── */}
      <Box sx={{
        bgcolor: "var(--color-surface)", borderBottom: "1px solid rgba(0,0,0,0.08)",
        px: { xs: 1.5, md: 2 }, py: 0.8,
        display: "flex", alignItems: "center", gap: { xs: 0.7, md: 1 }, flexWrap: "nowrap",
        position: "sticky", top: 0, zIndex: 200,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflowX: "auto",
      }}>
        <RestaurantMenuIcon sx={{ color: "var(--color-primary)", fontSize: 20, flexShrink: 0 }} />
        {!isMobile && (
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", mr: 0.5, color: "var(--color-text)", whiteSpace: "nowrap" }}>
            Tạo Menu
          </Typography>
        )}

        <FormControl size="small" sx={{ minWidth: isMobile ? 110 : 150, flexShrink: 0 }}>
          <Select value={boardSizeIdx} onChange={(e) => setBoardSizeIdx(Number(e.target.value))}
            sx={{ borderRadius: 2, fontSize: "0.8rem" }}>
            {BOARD_SIZES.map((s, i) => (
              <MuiMenuItem key={i} value={i}>{s.label}</MuiMenuItem>
            ))}
          </Select>
        </FormControl>

        {toolbarButtons}
        <Box sx={{ flex: 1 }} />

        <Button size="small" variant="outlined"
          startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
          onClick={() => setAiOpen(true)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, whiteSpace: "nowrap" }}>
          {isMobile ? "AI" : "✨ AI Tạo Menu"}
        </Button>

        <Button size="small" variant="contained"
          startIcon={exporting
            ? <CircularProgress size={13} color="inherit" />
            : <DownloadIcon sx={{ fontSize: 14 }} />}
          onClick={handleExport} disabled={exporting}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, whiteSpace: "nowrap", bgcolor: "var(--color-primary)" }}>
          {isMobile ? "PNG" : "Xuất PNG"}
        </Button>
      </Box>

      {/* ══════════════════ DESKTOP LAYOUT (md+) ══════════════════ */}
      {!isMobile && (
        <Box sx={{ display: "flex", height: "calc(100vh - 100px)", overflow: "hidden", bgcolor: "#e0e0e0" }}>

          {/* Left panel */}
          <Box sx={{
            width: 196, flexShrink: 0,
            bgcolor: "var(--color-surface)", borderRight: "1px solid rgba(0,0,0,0.08)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <AddPanel tab={tab} setTab={setTab} boardBg={boardBg} setBoardBg={setBoardBg}
              addText={addText} addEmoji={addEmoji} addMenuItem={addMenuItem} addShape={addShape} />
          </Box>

          {/* Canvas */}
          <Box ref={containerRef}
            sx={{
              flex: 1, overflow: "auto",
              display: "flex", alignItems: "flex-start", justifyContent: "center", p: 3,
              background: "repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(0,0,0,0.02) 12px,rgba(0,0,0,0.02) 24px), #d8d8d8",
            }}
            onClick={() => setSelectedId(null)}
          >
            <div style={boardWrapperStyle} onClick={(e) => e.stopPropagation()}>
              <div ref={boardRef} style={boardStyle}>
                {elements.map((el) => (
                  <ElementNode key={el.id} el={el} selected={selectedId === el.id} onPointerDown={handlePointerDown} />
                ))}
              </div>
            </div>
          </Box>

          {/* Right props panel */}
          <Box sx={{
            width: 212, flexShrink: 0,
            bgcolor: "var(--color-surface)", borderLeft: "1px solid rgba(0,0,0,0.08)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <Box sx={{ px: 1.5, py: 0.9, borderBottom: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Thuộc tính
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              <PropsPanel el={selected} onUpdate={updateEl} onDelete={deleteEl} onUp={bringUp} onDown={sendDown} />
            </Box>
          </Box>
        </Box>
      )}

      {/* ══════════════════ MOBILE LAYOUT (<md) ══════════════════ */}
      {isMobile && (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 100px)", bgcolor: "#d8d8d8", touchAction: "pan-x pan-y" }}>

          {/* Board area – pinch-to-zoom + scroll when zoomed in */}
          <Box ref={containerRef}
            onPointerDown={handleContainerPD}
            onPointerMove={handleContainerPM}
            onPointerUp={handleContainerPU}
            onPointerCancel={handleContainerPU}
            sx={{
              flex: "0 0 auto", p: 1, position: "relative",
              overflow: "auto",
              touchAction: "none",
              background: "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(0,0,0,0.025) 10px,rgba(0,0,0,0.025) 20px), #d0d0d0",
              height: Math.min(boardSize.h * boardScale + 16, 440),
            }}
            onClick={() => setSelectedId(null)}
          >
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", minWidth: boardSize.w * effectiveScale + 8 }}>
              <div style={boardWrapperStyle} onClick={(e) => e.stopPropagation()}>
                <div ref={boardRef} style={boardStyle}>
                  {elements.map((el) => (
                    <ElementNode key={el.id} el={el} selected={selectedId === el.id} onPointerDown={handlePointerDown} />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating zoom controls */}
            <Box sx={{
              position: "sticky", bottom: 8, right: 0,
              display: "flex", flexDirection: "column", alignItems: "flex-end",
              pointerEvents: "none", pr: 0.5,
            }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, pointerEvents: "all" }}>
                <IconButton size="small" onClick={() => setZoomLevel((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
                  sx={{ bgcolor: "rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", width: 34, height: 34, "&:hover": { bgcolor: "#fff" } }}>
                  <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Box sx={{ bgcolor: "rgba(0,0,0,0.65)", borderRadius: 1, px: 0.5, py: 0.25, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700, lineHeight: 1 }}>
                    {Math.round(effectiveScale * 100)}%
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setZoomLevel((z) => Math.max(0.35, +(z - 0.25).toFixed(2)))}
                  sx={{ bgcolor: "rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", width: 34, height: 34, "&:hover": { bgcolor: "#fff" } }}>
                  <RemoveIcon sx={{ fontSize: 18 }} />
                </IconButton>
                {zoomLevel !== 1 && (
                  <IconButton size="small" onClick={() => setZoomLevel(1)}
                    sx={{ bgcolor: "rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", width: 34, height: 34, "&:hover": { bgcolor: "#fff" } }}>
                    <ZoomOutMapIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>

          {/* Mobile action bar */}
          <Box sx={{
            display: "flex", gap: 1, px: 1.5, py: 1,
            bgcolor: "var(--color-surface)",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            alignItems: "center",
          }}>
            <Button fullWidth variant="contained" size="small"
              startIcon={<AddIcon sx={{ fontSize: 15 }} />}
              onClick={() => setAddOpen(true)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, bgcolor: "var(--color-primary)", fontSize: "0.82rem" }}>
              Thêm
            </Button>
            {selectedId && (
              <Button fullWidth variant="outlined" size="small"
                startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                onClick={() => setPropsOpen(true)}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: "0.82rem" }}>
                Chỉnh sửa
              </Button>
            )}
          </Box>

          {/* Selected element label */}
          {selectedId && selected && (
            <Box sx={{ px: 1.5, py: 0.6, bgcolor: "rgba(25,118,210,0.06)", display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1976d2", flexShrink: 0 }} />
              <Typography sx={{ fontSize: "0.78rem", color: "#1976d2", fontWeight: 600 }}>
                Đang chọn: {selected.type === "text" ? "Chữ" : selected.type === "emoji" ? "Sticker" : selected.type === "menuItem" ? `Món – ${selected.name}` : "Hình"}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton size="small" onClick={() => setSelectedId(null)} sx={{ p: 0.3 }}>
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
          )}
        </Box>
      )}

      {/* ── Mobile: Add elements Drawer (bottom) ── */}
      <Drawer anchor="bottom" open={isMobile && addOpen} onClose={() => setAddOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px 16px 0 0", maxHeight: "70vh", display: "flex", flexDirection: "column" } }}>
        <Box sx={{ display: "flex", alignItems: "center", px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", flex: 1, color: "var(--color-text)" }}>Thêm phần tử</Typography>
          <IconButton size="small" onClick={() => setAddOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </Box>
        <Divider sx={{ mb: 0 }} />
        <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <AddPanel tab={tab} setTab={setTab} boardBg={boardBg} setBoardBg={setBoardBg}
            addText={addText} addEmoji={addEmoji} addMenuItem={addMenuItem} addShape={addShape} />
        </Box>
      </Drawer>

      {/* ── Mobile: Properties Drawer (bottom) ── */}
      <Drawer anchor="bottom" open={isMobile && propsOpen} onClose={() => setPropsOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px 16px 0 0", maxHeight: "80vh", display: "flex", flexDirection: "column" } }}>
        <Box sx={{ display: "flex", alignItems: "center", px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", flex: 1, color: "var(--color-text)" }}>Thuộc tính phần tử</Typography>
          <IconButton size="small" onClick={() => setPropsOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <PropsPanel el={selected} onUpdate={updateEl} onDelete={deleteEl} onUp={bringUp} onDown={sendDown} />
        </Box>
      </Drawer>

      {/* ── Export Preview Dialog (WebView fallback) ── */}
      <Dialog
        open={!!exportPreview}
        onClose={() => setExportPreview(null)}
        maxWidth="sm" fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, m: isMobile ? 0 : 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <DownloadIcon sx={{ color: "var(--color-primary)", fontSize: 20 }} />
          <Typography sx={{ fontWeight: 800, flex: 1, fontSize: "1rem" }}>Lưu ảnh menu</Typography>
          <IconButton size="small" onClick={() => setExportPreview(null)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{
            p: 1.5, borderRadius: 2,
            bgcolor: "rgba(25,118,210,0.07)", border: "1px solid rgba(25,118,210,0.18)",
            display: "flex", alignItems: "flex-start", gap: 1,
          }}>
            <Typography sx={{ fontSize: "0.82rem", color: "primary.main", lineHeight: 1.55 }}>
              📱 <strong>Nhấn giữ vào ảnh</strong> bên dưới → chọn <strong>"Lưu ảnh"</strong> / <strong>"Tải xuống"</strong> để lưu về máy.
            </Typography>
          </Box>
          {exportPreview && (
            <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", bgcolor: "#f5f5f5" }}>
              <img
                src={exportPreview}
                alt="Menu preview"
                style={{ width: "100%", display: "block", userSelect: "none" }}
                onContextMenu={(e) => e.stopPropagation()}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setExportPreview(null)} sx={{ borderRadius: 2, textTransform: "none" }}>Đóng</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              if (!exportPreview) return;
              const a = document.createElement("a");
              a.download = `menu-${Date.now()}.png`;
              a.href = exportPreview;
              a.click();
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, bgcolor: "var(--color-primary)" }}
          >
            Tải xuống
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── AI Dialog ── */}
      <Dialog open={aiOpen} onClose={() => setAiOpen(false)} maxWidth="sm" fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4 } }}>
        <DialogTitle sx={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.55rem", fontWeight: 700, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
          ✨ AI Tạo Menu
          {isMobile && <IconButton sx={{ ml: "auto" }} onClick={() => setAiOpen(false)}><CloseIcon /></IconButton>}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: "0.87rem", color: "var(--color-subtle)", mb: 2, lineHeight: 1.55 }}>
            Mô tả phong cách quán, AI sẽ gợi ý 6 món và thêm thẳng vào board.
          </Typography>
          <TextField fullWidth multiline minRows={isMobile ? 4 : 5} maxRows={9}
            label="Prompt hệ thống (có thể chỉnh sửa)"
            value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
            sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 2.5, fontSize: "0.88rem" } }}
          />
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--color-subtle)", mb: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Gợi ý nhanh
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
            {AI_QUICK_PROMPTS.map((p) => (
              <Chip key={p} label={p} size="small"
                onClick={() => setAiPrompt(`Bạn là chuyên gia thiết kế menu nhà hàng. Tạo menu cho: ${p}. Tên món ngắn gọn, hấp dẫn, giá hợp lý (VNĐ), emoji phù hợp, mô tả ngắn 5-8 từ.`)}
                sx={{ cursor: "pointer", fontSize: "0.78rem",
                  "&:hover": { bgcolor: "rgba(46,125,50,0.1)", borderColor: "var(--color-primary)" },
                  border: "1px solid rgba(0,0,0,0.12)" }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {!isMobile && <Button onClick={() => setAiOpen(false)} sx={{ borderRadius: 2, textTransform: "none" }}>Hủy</Button>}
          <Button fullWidth={isMobile} variant="contained" onClick={handleAI} disabled={aiLoading}
            startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            sx={{
              borderRadius: 2, textTransform: "none", fontWeight: 800,
              background: "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
              color: "#1b3a1b", boxShadow: "none",
              "&:hover": { boxShadow: "0 4px 16px rgba(67,233,123,0.4)" },
            }}>
            {aiLoading ? "Đang tạo…" : "Tạo Menu"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
