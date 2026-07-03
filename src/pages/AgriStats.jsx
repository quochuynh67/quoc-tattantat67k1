// src/pages/AgriStats.jsx
// Thử nghiệm: biểu đồ biến động giá & sản lượng nông thuỷ sản theo tháng/năm.
// Dữ liệu MÔ PHỎNG (deterministic) — chưa nối nguồn thống kê thật.
import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Box, Container, Typography, Paper, Chip, ToggleButtonGroup, ToggleButton } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from "recharts";

// ── Mock data ────────────────────────────────────────────────────────────────
// Giá cơ sở (đ/kg), sản lượng cơ sở (tấn/tháng toàn huyện), hệ số mùa vụ 12 tháng,
// chu kỳ canh tác (tháng từ lúc xuống giống/thả nuôi đến khi bán) và động từ hiển thị.
const PRODUCTS = {
  lua: {
    name: "Lúa (thóc tươi)", emoji: "🌾",
    priceBase: 6800, prodBase: 18500, trend: 0.05, cycleMonths: 3, verb: "Gieo sạ",
    seasonal: [1.02, 1.05, 0.97, 0.93, 0.95, 1.0, 1.04, 1.08, 1.03, 0.96, 0.94, 0.99],
    prodSeasonal: [0.6, 1.6, 1.8, 0.7, 0.5, 0.9, 1.5, 1.7, 0.8, 0.5, 0.7, 0.7],
  },
  nep: {
    name: "Nếp Phú Tân", emoji: "🍚",
    priceBase: 7900, prodBase: 12800, trend: 0.06, cycleMonths: 3, verb: "Gieo sạ",
    seasonal: [1.06, 1.1, 1.0, 0.94, 0.92, 0.96, 1.02, 1.05, 1.0, 0.95, 0.97, 1.03],
    prodSeasonal: [0.7, 1.5, 1.9, 0.8, 0.5, 0.8, 1.4, 1.8, 0.9, 0.5, 0.6, 0.6],
  },
  bap: {
    name: "Bắp lai", emoji: "🌽",
    priceBase: 7200, prodBase: 2400, trend: 0.03, cycleMonths: 3, verb: "Xuống giống",
    seasonal: [0.98, 0.95, 0.93, 0.97, 1.02, 1.05, 1.08, 1.1, 1.06, 1.0, 0.96, 0.98],
    prodSeasonal: [0.8, 1.5, 1.6, 0.9, 0.7, 0.8, 1.4, 1.5, 0.9, 0.6, 0.7, 0.8],
  },
  daunanh: {
    name: "Đậu nành", emoji: "🫘",
    priceBase: 17500, prodBase: 850, trend: 0.04, cycleMonths: 3, verb: "Xuống giống",
    seasonal: [1.05, 1.03, 0.97, 0.94, 0.92, 0.95, 1.0, 1.03, 1.05, 1.06, 1.04, 1.06],
    prodSeasonal: [0.7, 0.8, 1.2, 1.6, 1.7, 1.2, 0.8, 0.7, 0.8, 0.9, 0.9, 0.8],
  },
  raumau: {
    name: "Rau màu", emoji: "🥬",
    priceBase: 13000, prodBase: 3100, trend: 0.03, cycleMonths: 1, verb: "Xuống giống",
    seasonal: [1.22, 1.05, 0.92, 0.88, 0.9, 0.95, 1.02, 1.1, 1.12, 1.02, 1.0, 1.18],
    prodSeasonal: [1.3, 1.2, 1.25, 1.1, 0.95, 0.85, 0.75, 0.7, 0.75, 0.9, 1.05, 1.2],
  },
  xoai: {
    name: "Xoài cát", emoji: "🥭",
    priceBase: 32000, prodBase: 950, trend: 0.03, cycleMonths: 5, verb: "Xử lý ra hoa",
    seasonal: [1.25, 1.15, 0.85, 0.7, 0.65, 0.75, 0.9, 1.05, 1.15, 1.2, 1.25, 1.3],
    prodSeasonal: [0.5, 0.7, 1.4, 1.9, 2.0, 1.5, 0.9, 0.6, 0.4, 0.4, 0.4, 0.5],
  },
  oi: {
    name: "Ổi lê", emoji: "🍐",
    priceBase: 14500, prodBase: 620, trend: 0.02, cycleMonths: 3, verb: "Bao trái",
    seasonal: [1.12, 1.08, 0.98, 0.94, 0.92, 0.95, 1.0, 1.02, 1.04, 1.02, 1.0, 1.1],
    prodSeasonal: [0.9, 0.95, 1.05, 1.15, 1.2, 1.15, 1.05, 1.0, 0.95, 0.9, 0.85, 0.85],
  },
  mit: {
    name: "Mít Thái", emoji: "🍈",
    priceBase: 18500, prodBase: 780, trend: 0.02, cycleMonths: 5, verb: "Xử lý ra hoa",
    seasonal: [1.2, 1.12, 0.85, 0.75, 0.72, 0.8, 0.95, 1.05, 1.12, 1.18, 1.22, 1.25],
    prodSeasonal: [0.6, 0.7, 1.4, 1.8, 1.9, 1.5, 1.0, 0.7, 0.5, 0.5, 0.6, 0.6],
  },
  catra: {
    name: "Cá tra", emoji: "🐟",
    priceBase: 27500, prodBase: 4200, trend: 0.04, cycleMonths: 7, verb: "Thả nuôi",
    seasonal: [1.03, 1.0, 0.96, 0.94, 0.97, 1.0, 1.02, 1.05, 1.07, 1.04, 1.0, 1.02],
    prodSeasonal: [0.9, 0.85, 0.95, 1.05, 1.1, 1.15, 1.1, 1.05, 1.0, 0.95, 0.95, 0.95],
  },
  caloc: {
    name: "Cá lóc", emoji: "🐠",
    priceBase: 48000, prodBase: 1350, trend: 0.05, cycleMonths: 5, verb: "Thả nuôi",
    seasonal: [1.18, 1.12, 1.0, 0.94, 0.9, 0.88, 0.92, 0.96, 1.0, 1.05, 1.1, 1.2],
    prodSeasonal: [0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.15, 1.05, 1.0, 0.95, 0.9],
  },
  tom: {
    name: "Tôm càng xanh", emoji: "🦐",
    priceBase: 195000, prodBase: 380, trend: 0.07, cycleMonths: 6, verb: "Thả nuôi",
    seasonal: [1.15, 1.1, 0.95, 0.9, 0.88, 0.92, 0.96, 1.0, 1.05, 1.08, 1.12, 1.2],
    prodSeasonal: [0.8, 0.7, 0.9, 1.05, 1.15, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.95],
  },
  ech: {
    name: "Ếch thịt", emoji: "🐸",
    priceBase: 47000, prodBase: 240, trend: 0.04, cycleMonths: 3, verb: "Thả nuôi",
    seasonal: [1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.85, 0.9, 1.0, 1.08, 1.15],
    prodSeasonal: [0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.3, 1.15, 1.0, 0.85, 0.8],
  },
};

const METRICS = {
  price: { label: "Giá bán", unit: "đ/kg", yearAgg: "Giá trung bình năm" },
  prod: { label: "Sản lượng", unit: "tấn", yearAgg: "Tổng sản lượng năm" },
};

// Mốc "hiện tại" theo thời gian thực — dữ liệu mô phỏng tự "mọc" thêm tháng mới
const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;
const MONTH_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];
const BAR_YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 6 + i);

// Nhiễu deterministic — cùng input luôn cho cùng output
const wobble = (seed) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.08; // ±4%
};

function monthlyValue(productKey, metric, year, month) {
  const p = PRODUCTS[productKey];
  const base = metric === "price" ? p.priceBase : p.prodBase;
  const season = metric === "price" ? p.seasonal[month - 1] : p.prodSeasonal[month - 1];
  const growth = 1 + p.trend * (year - 2023);
  const seed = productKey.length * 1000 + year * 12 + month + (metric === "price" ? 0 : 500);
  return Math.round(base * growth * season * (1 + wobble(seed)));
}

const fmt = (n) => n?.toLocaleString("vi-VN") ?? "—";

// Cộng/trừ tháng có xử lý chuyển năm
const addMonths = (year, month, delta) => {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
};

const stdev = (arr) => {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
};

// ── Gợi ý nuôi trồng ─────────────────────────────────────────────────────────
const HORIZONS = [
  { key: "now", label: "Bây giờ", offset: 0 },
  { key: "3m", label: "3 tháng tới", offset: 3 },
  { key: "6m", label: "6 tháng tới", offset: 6 },
  // Đầu quý dương lịch kế tiếp
  { key: "quy", label: "Quý tới", offset: 3 - ((CURRENT_MONTH - 1) % 3) },
];

// Xuống giống tại thời điểm start → bán ra sau cycleMonths; chấm điểm theo:
// mùa giá lúc bán (so mức nền năm) + xu hướng giá dài hạn − độ biến động (rủi ro)
function buildRecommendations(offset) {
  const start = addMonths(CURRENT_YEAR, CURRENT_MONTH, offset);
  return Object.entries(PRODUCTS).map(([key, p]) => {
    const sale = addMonths(start.year, start.month, p.cycleMonths);
    const forecastPrice = monthlyValue(key, "price", sale.year, sale.month);
    const seasonalAdvPct = (p.seasonal[sale.month - 1] - 1) * 100;
    const riskPct = stdev(p.seasonal) * 100;
    const trendPct = p.trend * 100;
    const score = seasonalAdvPct + trendPct * 0.5 - riskPct * 0.35;

    const reasons = [];
    if (seasonalAdvPct >= 3) reasons.push(`Bán ra đúng mùa giá cao (+${seasonalAdvPct.toFixed(0)}% so mức nền năm)`);
    else if (seasonalAdvPct <= -3) reasons.push(`Rơi vào mùa giá thấp (${seasonalAdvPct.toFixed(0)}% so mức nền năm)`);
    else reasons.push("Giá lúc bán quanh mức nền năm");
    if (trendPct >= 5) reasons.push(`Xu hướng giá tăng ~${trendPct.toFixed(0)}%/năm`);
    if (riskPct <= 6) reasons.push("Giá ổn định, ít biến động");
    else if (riskPct >= 12) reasons.push("Giá biến động mạnh — cân nhắc rủi ro");

    return { key, product: p, start, sale, forecastPrice, seasonalAdvPct, score, reasons };
  }).sort((a, b) => b.score - a.score);
}
const compact = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
};

// ── Chart chrome ─────────────────────────────────────────────────────────────
const YEAR_COLORS = {
  2024: "var(--viz-series-1)",
  2025: "var(--viz-series-2)",
  2026: "var(--viz-series-3)",
};

const axisTick = { fill: "var(--viz-ink-muted)", fontSize: 11, fontFamily: "var(--font-body)" };

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      bgcolor: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-medium)", px: 1.5, py: 1,
    }}>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text)", mb: 0.4 }}>{label}</Typography>
      {payload.filter((e) => e.value != null).map((entry) => (
        <Box key={entry.dataKey} sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: entry.stroke || entry.fill, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.74rem", color: "var(--color-text-subtle)" }}>
            {entry.name}: <Box component="span" sx={{ fontWeight: 700, color: "var(--color-text)" }}>{fmt(entry.value)}</Box> {unit}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const ChartCard = ({ title, subtitle, children, legend }) => (
  <Paper elevation={0} sx={{
    p: { xs: 2, md: 2.5 }, borderRadius: "var(--radius-md)",
    bgcolor: "var(--color-surface)", border: "1px solid var(--color-border)",
  }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text)" }}>{title}</Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "var(--color-text-subtle)" }}>{subtitle}</Typography>
      </Box>
      {legend}
    </Box>
    {children}
  </Paper>
);

const StatTile = ({ label, value, unit, delta, deltaLabel }) => (
  <Paper elevation={0} sx={{
    p: 2, borderRadius: "var(--radius-md)", flex: 1, minWidth: 150,
    bgcolor: "var(--color-surface)", border: "1px solid var(--color-border)",
  }}>
    <Typography sx={{ fontSize: "0.74rem", color: "var(--viz-ink-muted)", mb: 0.4 }}>{label}</Typography>
    <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", lineHeight: 1.15 }}>
      {fmt(value)} <Box component="span" sx={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-subtle)" }}>{unit}</Box>
    </Typography>
    {delta != null && (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mt: 0.4 }}>
        {delta >= 0
          ? <ArrowUpwardIcon sx={{ fontSize: 13, color: "var(--viz-up)" }} />
          : <ArrowDownwardIcon sx={{ fontSize: 13, color: "var(--viz-down)" }} />}
        <Typography sx={{ fontSize: "0.74rem", fontWeight: 700, color: delta >= 0 ? "var(--viz-up)" : "var(--viz-down)" }}>
          {Math.abs(delta).toFixed(1)}%
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "var(--viz-ink-muted)" }}>{deltaLabel}</Typography>
      </Box>
    )}
  </Paper>
);

// ── Page ─────────────────────────────────────────────────────────────────────
const AgriStats = () => {
  const [productKey, setProductKey] = useState("lua");
  const [metric, setMetric] = useState("price");
  const product = PRODUCTS[productKey];
  const metricInfo = METRICS[metric];

  const monthlyData = useMemo(() => (
    Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const row = { month: `T${month}` };
      MONTH_YEARS.forEach((y) => {
        row[y] = (y === CURRENT_YEAR && month > CURRENT_MONTH) ? null : monthlyValue(productKey, metric, y, month);
      });
      // Dự báo phần còn lại của năm hiện tại — nối từ điểm thực tế cuối cùng
      row.forecast = month >= CURRENT_MONTH ? monthlyValue(productKey, metric, CURRENT_YEAR, month) : null;
      return row;
    })
  ), [productKey, metric]);

  const yearlyData = useMemo(() => (
    BAR_YEARS.map((y) => {
      const vals = Array.from({ length: 12 }, (_, i) => monthlyValue(productKey, metric, y, i + 1));
      const sum = vals.reduce((a, b) => a + b, 0);
      return { year: String(y), value: metric === "price" ? Math.round(sum / 12) : sum };
    })
  ), [productKey, metric]);

  const nowVal = monthlyValue(productKey, metric, CURRENT_YEAR, CURRENT_MONTH);
  const prevMonth = addMonths(CURRENT_YEAR, CURRENT_MONTH, -1);
  const prevVal = monthlyValue(productKey, metric, prevMonth.year, prevMonth.month);
  const lastYearVal = monthlyValue(productKey, metric, CURRENT_YEAR - 1, CURRENT_MONTH);
  const momDelta = ((nowVal - prevVal) / prevVal) * 100;
  const yoyDelta = ((nowVal - lastYearVal) / lastYearVal) * 100;

  const [horizonKey, setHorizonKey] = useState("now");
  const horizon = HORIZONS.find((h) => h.key === horizonKey);
  const recommendations = useMemo(() => buildRecommendations(horizon.offset), [horizon.offset]);

  // Dự báo giá 6 tháng tới cho toàn bộ sản phẩm (từ mô hình mùa vụ)
  const FORECAST_MONTHS = 6;
  const forecastMonths = useMemo(() => (
    Array.from({ length: FORECAST_MONTHS }, (_, i) => addMonths(CURRENT_YEAR, CURRENT_MONTH, i + 1))
  ), []);
  const forecastTable = useMemo(() => (
    Object.entries(PRODUCTS).map(([key, p]) => {
      let prev = monthlyValue(key, "price", CURRENT_YEAR, CURRENT_MONTH);
      const cells = forecastMonths.map((m) => {
        const v = monthlyValue(key, "price", m.year, m.month);
        const delta = ((v - prev) / prev) * 100;
        prev = v;
        return { ...m, value: v, delta };
      });
      return { key, product: p, cells };
    })
  ), [forecastMonths]);

  const yearLegend = (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      {MONTH_YEARS.map((y) => (
        <Box key={y} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 14, height: 3, borderRadius: 2, bgcolor: YEAR_COLORS[y] }} />
          <Typography sx={{ fontSize: "0.74rem", color: "var(--color-text-subtle)", fontWeight: 600 }}>{y}</Typography>
        </Box>
      ))}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Box sx={{
          width: 14, height: 0, borderTop: `3px dashed ${YEAR_COLORS[CURRENT_YEAR]}`,
          borderRadius: 2, opacity: 0.85,
        }} />
        <Typography sx={{ fontSize: "0.74rem", color: "var(--color-text-subtle)", fontWeight: 600 }}>Dự báo</Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Helmet>
        <title>Biến động nông thuỷ sản – Tất tần tật Phú Tân</title>
        <meta name="description" content="Biểu đồ biến động giá và sản lượng nông thuỷ sản Phú Tân theo tháng, theo năm (bản thử nghiệm)." />
      </Helmet>

      {/* Hero */}
      <Box sx={{
        background: "linear-gradient(135deg, #2E7D32 0%, #00695C 100%)",
        py: { xs: 4, md: 5 }, textAlign: "center",
      }}>
        <Container maxWidth="md">
          <Chip
            icon={<ScienceIcon sx={{ color: "#fff !important" }} />}
            label="Bản thử nghiệm — dữ liệu mô phỏng, chưa phải số liệu thống kê chính thức"
            sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#fff", fontWeight: 600, mb: 2 }}
          />
          <Typography variant="h4" sx={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#fff", mb: 0.5 }}>
            📈 Biến động nông thuỷ sản
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem" }}>
            Theo dõi giá và sản lượng theo tháng, theo năm cho từng loại nông thuỷ sản Phú Tân
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 3, md: 4 }, background: "var(--color-background)" }}>
        <Container maxWidth="md">
          {/* Filter row */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", mb: 2.5 }}>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", flex: 1 }}>
              {Object.entries(PRODUCTS).map(([key, p]) => (
                <Chip
                  key={key}
                  label={`${p.emoji} ${p.name}`}
                  onClick={() => setProductKey(key)}
                  variant={key === productKey ? "filled" : "outlined"}
                  sx={{
                    fontWeight: 600,
                    ...(key === productKey
                      ? { bgcolor: "var(--color-primary)", color: "#fff", "&:hover": { bgcolor: "var(--color-secondary)" } }
                      : { color: "var(--color-text)", borderColor: "var(--color-border)" }),
                  }}
                />
              ))}
            </Box>
            <ToggleButtonGroup
              value={metric}
              exclusive
              size="small"
              onChange={(_, v) => v && setMetric(v)}
              sx={{
                "& .MuiToggleButton-root": {
                  px: 1.5, py: 0.4, fontSize: "0.78rem", fontWeight: 700, textTransform: "none",
                  color: "var(--color-text-subtle)", borderColor: "var(--color-border)",
                  "&.Mui-selected": { bgcolor: "var(--color-primary)", color: "#fff", "&:hover": { bgcolor: "var(--color-secondary)" } },
                },
              }}
            >
              <ToggleButton value="price">Giá bán</ToggleButton>
              <ToggleButton value="prod">Sản lượng</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Stat tiles */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2.5 }}>
            <StatTile
              label={`${metricInfo.label} tháng ${CURRENT_MONTH}/${CURRENT_YEAR}`}
              value={nowVal} unit={metricInfo.unit}
              delta={momDelta} deltaLabel="so tháng trước"
            />
            <StatTile
              label="So cùng kỳ năm trước"
              value={lastYearVal} unit={metricInfo.unit}
              delta={yoyDelta} deltaLabel={`so T${CURRENT_MONTH}/${CURRENT_YEAR - 1}`}
            />
          </Box>

          {/* Monthly line chart */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <ChartCard
              title={`${metricInfo.label} theo tháng — ${product.name}`}
              subtitle={`${metricInfo.unit} · năm 2026 có số liệu tới tháng ${CURRENT_MONTH}`}
              legend={yearLegend}
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData} margin={{ top: 8, right: 14, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
                  <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: "var(--viz-axis)" }} tickLine={false} />
                  <YAxis
                    tick={axisTick} axisLine={false} tickLine={false} width={48}
                    tickFormatter={compact}
                    domain={[(dataMin) => Math.floor(dataMin * 0.92), (dataMax) => Math.ceil(dataMax * 1.04)]}
                  />
                  <Tooltip content={<ChartTooltip unit={metricInfo.unit} />} />
                  {MONTH_YEARS.map((y) => (
                    <Line
                      key={y} dataKey={y} name={String(y)} type="monotone"
                      stroke={YEAR_COLORS[y]} strokeWidth={2} strokeLinecap="round"
                      connectNulls={false}
                      dot={{ r: 4, fill: YEAR_COLORS[y], stroke: "var(--color-surface)", strokeWidth: 2 }}
                      activeDot={{ r: 6, stroke: "var(--color-surface)", strokeWidth: 2 }}
                    />
                  ))}
                  <Line
                    dataKey="forecast" name="Dự báo" type="monotone"
                    stroke={YEAR_COLORS[CURRENT_YEAR]} strokeWidth={2} strokeLinecap="round"
                    strokeDasharray="6 5" connectNulls={false}
                    dot={{ r: 3.5, fill: "var(--color-surface)", stroke: YEAR_COLORS[CURRENT_YEAR], strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: "var(--color-surface)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Yearly bar chart — single series, sequential hue */}
            <ChartCard
              title={`${metricInfo.yearAgg} — ${product.name}`}
              subtitle={`${metricInfo.unit} · 2020–2025`}
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={yearlyData} margin={{ top: 22, right: 14, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
                  <XAxis dataKey="year" tick={axisTick} axisLine={{ stroke: "var(--viz-axis)" }} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} tickFormatter={compact} />
                  <Tooltip content={<ChartTooltip unit={metricInfo.unit} />} cursor={{ fill: "var(--viz-grid)", opacity: 0.4 }} />
                  <Bar dataKey="value" name={metricInfo.yearAgg} fill="var(--viz-series-1)" barSize={24} radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="value"
                      content={({ x, y, width, value, index }) => (
                        index === yearlyData.length - 1 ? (
                          <text
                            x={x + width / 2} y={y - 7} textAnchor="middle"
                            fill="var(--color-text)" fontSize={11} fontWeight={700}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {fmt(value)}
                          </text>
                        ) : null
                      )}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Gợi ý nuôi trồng theo mốc thời gian */}
            <ChartCard
              title="🧭 Nên nuôi trồng gì?"
              subtitle="Chấm điểm theo mùa giá lúc bán ra + xu hướng dài hạn − độ biến động (mô phỏng, chỉ để tham khảo)"
              legend={(
                <ToggleButtonGroup
                  value={horizonKey} exclusive size="small"
                  onChange={(_, v) => v && setHorizonKey(v)}
                  sx={{
                    "& .MuiToggleButton-root": {
                      px: 1.2, py: 0.3, fontSize: "0.72rem", fontWeight: 700, textTransform: "none",
                      color: "var(--color-text-subtle)", borderColor: "var(--color-border)",
                      "&.Mui-selected": { bgcolor: "var(--color-primary)", color: "#fff", "&:hover": { bgcolor: "var(--color-secondary)" } },
                    },
                  }}
                >
                  {HORIZONS.map((h) => <ToggleButton key={h.key} value={h.key}>{h.label}</ToggleButton>)}
                </ToggleButtonGroup>
              )}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 2 }}>
                {recommendations.slice(0, 3).map((rec, i) => (
                  <Box key={rec.key} sx={{
                    p: 1.75, borderRadius: "var(--radius-md)",
                    border: `1.5px solid ${i === 0 ? "var(--color-primary)" : "var(--color-border)"}`,
                    bgcolor: i === 0 ? "rgba(46,125,50,0.06)" : "transparent",
                    position: "relative",
                  }}>
                    <Box sx={{
                      position: "absolute", top: 10, right: 12,
                      fontSize: "0.68rem", fontWeight: 800, color: "var(--viz-ink-muted)",
                    }}>
                      #{i + 1}
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--color-text)", mb: 0.3 }}>
                      {rec.product.emoji} {rec.product.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "var(--color-text-subtle)", mb: 0.8 }}>
                      {rec.product.verb} T{rec.start.month}/{rec.start.year} → thu T{rec.sale.month}/{rec.sale.year} ({rec.product.cycleMonths} tháng)
                    </Typography>
                    <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text)", mb: 0.6 }}>
                      ≈{fmt(rec.forecastPrice)} <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--color-text-subtle)" }}>đ/kg lúc thu</Box>
                    </Typography>
                    {rec.reasons.map((r) => (
                      <Typography key={r} sx={{ fontSize: "0.7rem", color: "var(--color-text-subtle)", lineHeight: 1.45 }}>
                        · {r}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {recommendations.slice(3).map((rec, i) => (
                  <Chip
                    key={rec.key} size="small"
                    label={`#${i + 4} ${rec.product.emoji} ${rec.product.name} · thu T${rec.sale.month} ≈${compact(rec.forecastPrice)}đ`}
                    sx={{ fontSize: "0.7rem", color: "var(--color-text-subtle)", bgcolor: "transparent", border: "1px solid var(--color-border)" }}
                  />
                ))}
              </Box>
            </ChartCard>

            {/* Dự báo giá 6 tháng tới — toàn bộ sản phẩm */}
            <ChartCard
              title="🔮 Dự báo giá các tháng tới"
              subtitle={`đ/kg · ${FORECAST_MONTHS} tháng kế tiếp, mũi tên so với tháng liền trước (mô phỏng)`}
            >
              <Box sx={{ overflowX: "auto" }}>
                <Box component="table" sx={{
                  width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", minWidth: 560,
                  "& th, & td": { padding: "6px 8px", textAlign: "right", borderBottom: "1px solid var(--viz-grid)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" },
                  "& th": { color: "var(--viz-ink-muted)", fontWeight: 700 },
                  "& td": { color: "var(--color-text)" },
                  "& th:first-of-type, & td:first-of-type": { textAlign: "left" },
                }}>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      {forecastMonths.map((m) => <th key={`${m.year}-${m.month}`}>T{m.month}/{String(m.year).slice(2)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {forecastTable.map(({ key, product: p, cells }) => (
                      <tr key={key}>
                        <td>{p.emoji} {p.name}</td>
                        {cells.map((c) => (
                          <td key={`${c.year}-${c.month}`}>
                            {fmt(c.value)}
                            <Box component="span" sx={{
                              fontSize: "0.66rem", fontWeight: 700, ml: 0.4,
                              color: c.delta >= 0 ? "var(--viz-up)" : "var(--viz-down)",
                            }}>
                              {c.delta >= 0 ? "↑" : "↓"}{Math.abs(c.delta).toFixed(0)}%
                            </Box>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </ChartCard>

            {/* Data table — kênh đọc dự phòng cho màu khó phân biệt */}
            <Paper elevation={0} component="details" sx={{
              borderRadius: "var(--radius-md)", bgcolor: "var(--color-surface)",
              border: "1px solid var(--color-border)", overflow: "hidden",
              "& summary": { cursor: "pointer", px: 2.5, py: 1.5, fontWeight: 700, fontSize: "0.85rem", color: "var(--color-text)" },
            }}>
              <summary>📋 Xem bảng số liệu ({metricInfo.label.toLowerCase()} theo tháng, {metricInfo.unit})</summary>
              <Box sx={{ overflowX: "auto", px: 2.5, pb: 2 }}>
                <Box component="table" sx={{
                  width: "100%", borderCollapse: "collapse", fontSize: "0.78rem",
                  "& th, & td": { padding: "6px 10px", textAlign: "right", borderBottom: "1px solid var(--viz-grid)", color: "var(--color-text)", fontVariantNumeric: "tabular-nums" },
                  "& th": { color: "var(--viz-ink-muted)", fontWeight: 700 },
                  "& th:first-of-type, & td:first-of-type": { textAlign: "left" },
                }}>
                  <thead>
                    <tr>
                      <th>Tháng</th>
                      {MONTH_YEARS.map((y) => <th key={y}>{y}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        {MONTH_YEARS.map((y) => <td key={y}>{fmt(row[y])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default AgriStats;
