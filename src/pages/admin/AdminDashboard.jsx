import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  LinearProgress,
  Tooltip as MuiTooltip,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import GridViewIcon from "@mui/icons-material/GridView";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PhoneIcon from "@mui/icons-material/Phone";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getSections, getPostsBySection, getVlogs, supabase } from "../../lib/supabaseClient";

// ─── helpers ──────────────────────────────────────────────────────────────────

const PERIOD_LABELS = {
  today: "Hôm nay",
  yesterday: "Hôm qua",
  week: "7 ngày qua",
  month: "30 ngày qua",
};

function getDateRange(period) {
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") return { start: sod, end: now };
  if (period === "yesterday") {
    const s = new Date(sod); s.setDate(s.getDate() - 1);
    return { start: s, end: sod };
  }
  if (period === "week") {
    const s = new Date(sod); s.setDate(s.getDate() - 7);
    return { start: s, end: now };
  }
  if (period === "month") {
    const s = new Date(sod); s.setMonth(s.getMonth() - 1);
    return { start: s, end: now };
  }
  return null;
}

function filterByPeriod(items, period) {
  const range = getDateRange(period);
  if (!range) return items;
  return items.filter((item) => {
    const d = new Date(item.created_at);
    return d >= range.start && d <= range.end;
  });
}

function formatDate(d) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(d));
}

// ─── stat card definitions ────────────────────────────────────────────────────

const STATS = [
  {
    label: "Tổng Vlog",
    icon: <OndemandVideoIcon sx={{ fontSize: 20, color: "#fff" }} />,
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    shadow: "rgba(99,102,241,0.35)",
    accent: "#eef2ff",
    accentText: "#4f46e5",
  },
  {
    label: "Vlog đã đăng",
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 20, color: "#fff" }} />,
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
    shadow: "rgba(16,185,129,0.35)",
    accent: "#d1fae5",
    accentText: "#065f46",
  },
  {
    label: "Bài viết",
    icon: <ArticleIcon sx={{ fontSize: 20, color: "#fff" }} />,
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    shadow: "rgba(245,158,11,0.35)",
    accent: "#fef3c7",
    accentText: "#92400e",
  },
  {
    label: "Chuyên mục",
    icon: <GridViewIcon sx={{ fontSize: 20, color: "#fff" }} />,
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    shadow: "rgba(59,130,246,0.35)",
    accent: "#dbeafe",
    accentText: "#1e40af",
  },
];

function StatCard({ stat, value, sub }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 16px 40px ${stat.shadow}`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        {/* Top row: icon + sub badge */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: stat.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 6px 16px ${stat.shadow}`,
            }}
          >
            {stat.icon}
          </Box>
          {sub && (
            <Box
              sx={{
                px: 1.25,
                py: 0.35,
                borderRadius: 10,
                bgcolor: stat.accent,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: stat.accentText, fontSize: "0.68rem", lineHeight: 1 }}
              >
                {sub}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Value */}
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{ lineHeight: 1, mb: 0.5, letterSpacing: "-2px", fontSize: { xs: "2rem", sm: "2.4rem" } }}
        >
          {value}
        </Typography>

        {/* Label */}
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {stat.label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        boxShadow: 4,
        minWidth: 110,
      }}
    >
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5} color="text.secondary">
        {label}
      </Typography>
      {payload.map((p) => (
        <Typography key={p.name} variant="body2" fontWeight={700} sx={{ color: p.color }}>
          {p.value} {p.name}
        </Typography>
      ))}
    </Box>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function fetchContributors() {
  const [
    { data: posts },
    { data: postsGuest },
    { data: vlogs },
    { data: vlogsGuest },
  ] = await Promise.all([
    supabase.from("content_items").select("uploader_phone, created_at").not("uploader_phone", "is", null),
    supabase.from("content_items_guest").select("uploader_phone, submitted_at").not("uploader_phone", "is", null),
    supabase.from("vlog_reviews").select("uploader_phone, created_at").not("uploader_phone", "is", null),
    supabase.from("vlog_reviews_guest").select("uploader_phone, submitted_at").not("uploader_phone", "is", null),
  ]);

  const map = {};
  const ensure = (phone) => {
    if (!map[phone]) map[phone] = { phone, posts: 0, postsGuest: 0, vlogs: 0, vlogsGuest: 0, lastDate: null };
  };
  const touch = (phone, dateStr) => {
    const d = new Date(dateStr);
    if (!map[phone].lastDate || d > map[phone].lastDate) map[phone].lastDate = d;
  };

  (posts || []).forEach(({ uploader_phone, created_at }) => {
    ensure(uploader_phone); map[uploader_phone].posts++; touch(uploader_phone, created_at);
  });
  (postsGuest || []).forEach(({ uploader_phone, submitted_at }) => {
    ensure(uploader_phone); map[uploader_phone].postsGuest++; touch(uploader_phone, submitted_at);
  });
  (vlogs || []).forEach(({ uploader_phone, created_at }) => {
    ensure(uploader_phone); map[uploader_phone].vlogs++; touch(uploader_phone, created_at);
  });
  (vlogsGuest || []).forEach(({ uploader_phone, submitted_at }) => {
    ensure(uploader_phone); map[uploader_phone].vlogsGuest++; touch(uploader_phone, submitted_at);
  });

  return Object.values(map).sort((a, b) => {
    const totalA = a.posts + a.vlogs + a.postsGuest + a.vlogsGuest;
    const totalB = b.posts + b.vlogs + b.postsGuest + b.vlogsGuest;
    return totalB - totalA || (b.lastDate - a.lastDate);
  });
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [allVlogs, setAllVlogs] = useState([]);
  const [period, setPeriod] = useState(null);
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    Promise.all([getSections(), getPostsBySection(""), getVlogs(), fetchContributors()])
      .then(([sec, pst, vlg, contrib]) => {
        setSections(sec || []);
        setAllPosts(pst || []);
        setAllVlogs(vlg || []);
        setContributors(contrib);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const posts = useMemo(
    () => (period ? filterByPeriod(allPosts, period) : allPosts),
    [allPosts, period]
  );
  const vlogs = useMemo(
    () => (period ? filterByPeriod(allVlogs, period) : allVlogs),
    [allVlogs, period]
  );

  const publishedVlogs = vlogs.filter((v) => v.is_published);
  const draftVlogs = vlogs.filter((v) => !v.is_published);

  const postsBySection = sections.map((sec) => ({
    name: (sec.title?.length > 14 ? sec.title.slice(0, 13) + "…" : sec.title) || "—",
    posts: posts.filter((p) => p.section_slug === sec.slug).length,
  }));

  const pieData = [
    { name: "Đã đăng", value: publishedVlogs.length },
    { name: "Nháp", value: draftVlogs.length },
  ].filter((d) => d.value > 0);

  const recentVlogs = [...allVlogs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const periodLabel = period ? PERIOD_LABELS[period] : "Toàn thời gian";

  const headline = {
    today: "Hôm nay", yesterday: "Hôm qua",
    week: "Tuần vừa qua", month: "Tháng vừa qua",
  }[period] ?? "Tổng quan";

  const storyLine = (() => {
    if (!period) return `${allVlogs.length} vlog · ${allPosts.length} bài viết · ${sections.length} chuyên mục`;
    const parts = [];
    if (vlogs.length) parts.push(`${vlogs.length} vlog`);
    if (posts.length) parts.push(`${posts.length} bài viết`);
    return parts.length ? parts.join(" · ") + " được thêm mới" : "Không có nội dung mới trong khoảng này";
  })();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const PIE_COLORS = ["#6366f1", "#cbd5e1"];

  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Hero banner ─────────────────────────────────────── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)",
          borderRadius: 4,
          p: { xs: 3, md: "28px 36px" },
          mb: 3,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative circles */}
        {[{ w: 220, h: 220, top: -70, right: -50, op: 0.06 },
          { w: 130, h: 130, bottom: -40, right: 140, op: 0.04 },
          { w: 80, h: 80, top: 20, right: 200, op: 0.05 }].map((c, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: c.w, height: c.h,
              borderRadius: "50%",
              background: `rgba(255,255,255,${c.op})`,
              top: c.top, bottom: c.bottom, right: c.right,
              pointerEvents: "none",
            }}
          />
        ))}

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="overline"
            sx={{ color: "rgba(255,255,255,0.5)", letterSpacing: 3, fontSize: "0.65rem" }}
          >
            ADMIN DASHBOARD
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5, mb: 0.75, lineHeight: 1.2 }}>
            {headline}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 3 }}>
            {storyLine}
          </Typography>

          {/* Filter buttons */}
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={(_, val) => setPeriod(val)}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.08)",
                borderRadius: "10px",
                p: 0.4,
                gap: 0.4,
                "& .MuiToggleButton-root": {
                  color: "rgba(255,255,255,0.65)",
                  border: "none",
                  borderRadius: "7px !important",
                  px: { xs: 1.5, sm: 2 },
                  py: 0.6,
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  "&.Mui-selected": {
                    bgcolor: "#fff",
                    color: "#312e81",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#f5f5ff" },
                  },
                  "&:hover:not(.Mui-selected)": {
                    bgcolor: "rgba(255,255,255,0.13)",
                  },
                },
              }}
            >
              <ToggleButton value="today">Hôm nay</ToggleButton>
              <ToggleButton value="yesterday">Hôm qua</ToggleButton>
              <ToggleButton value="week">7 ngày</ToggleButton>
              <ToggleButton value="month">30 ngày</ToggleButton>
            </ToggleButtonGroup>

            {period && (
              <Box
                onClick={() => setPeriod(null)}
                sx={{
                  px: 1.5, py: 0.6,
                  borderRadius: "7px",
                  bgcolor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
              >
                ✕ Xóa lọc
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Stat cards — MUI v9: use size prop ──────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            stat={STATS[0]}
            value={vlogs.length}
            sub={period && allVlogs.length !== vlogs.length ? `/ ${allVlogs.length} tổng` : null}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            stat={STATS[1]}
            value={publishedVlogs.length}
            sub={draftVlogs.length ? `${draftVlogs.length} nháp` : null}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            stat={STATS[2]}
            value={posts.length}
            sub={period && allPosts.length !== posts.length ? `/ ${allPosts.length} tổng` : null}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard stat={STATS[3]} value={sections.length} />
        </Grid>
      </Grid>

      {/* ── Charts ──────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/* Bar chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            elevation={0}
            sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
          >
            <CardContent sx={{ p: 3, pb: "16px !important" }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Bài viết theo chuyên mục
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                {periodLabel}
              </Typography>

              {postsBySection.every((d) => d.posts === 0) ? (
                <EmptyChart />
              ) : (
                <Box sx={{ width: "100%", height: 260, overflow: "hidden" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={postsBySection} margin={{ top: 4, right: 4, left: -20, bottom: 52 }}>
                      <defs>
                        <linearGradient id="bgrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        width={28}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc", radius: 4 }} />
                      <Bar dataKey="posts" name="bài viết" fill="url(#bgrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Donut chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            elevation={0}
            sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
          >
            <CardContent sx={{ p: 3, pb: "16px !important" }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Trạng thái Vlog
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                {periodLabel}
              </Typography>

              {vlogs.length === 0 ? (
                <EmptyChart />
              ) : (
                <>
                  <Box sx={{ width: "100%", height: 190, overflow: "hidden" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={5}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v}`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>

                  {/* Legend + progress */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 0.5 }}>
                    {[
                      { label: "Đã đăng", value: publishedVlogs.length, color: "#6366f1" },
                      { label: "Nháp", value: draftVlogs.length, color: "#cbd5e1" },
                    ].map((row) => (
                      <Box key={row.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: row.color, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                          {row.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>{row.value}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ minWidth: 34, textAlign: "right" }}>
                          {vlogs.length ? Math.round((row.value / vlogs.length) * 100) : 0}%
                        </Typography>
                      </Box>
                    ))}
                    <LinearProgress
                      variant="determinate"
                      value={vlogs.length ? (publishedVlogs.length / vlogs.length) * 100 : 0}
                      sx={{
                        mt: 0.25,
                        height: 5,
                        borderRadius: 4,
                        bgcolor: "#e2e8f0",
                        "& .MuiLinearProgress-bar": { bgcolor: "#6366f1", borderRadius: 4 },
                      }}
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Contributors ────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", mb: 3 }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Người cống hiến</Typography>
              <Typography variant="caption" color="text.secondary">
                Số điện thoại đã gửi bài viết hoặc vlog
              </Typography>
            </Box>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EmojiEventsIcon fontSize="small" sx={{ color: "#d97706" }} />
            </Box>
          </Box>

          {contributors.length === 0 ? (
            <Box sx={{ py: 5, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", borderRadius: 2 }}>
              <Typography variant="body2" color="text.disabled">Chưa có ai cống hiến</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Header row */}
              <Box sx={{ display: "grid", gridTemplateColumns: "32px 1fr 72px 72px 90px 80px", gap: 1, px: 1, pb: 1, alignItems: "center" }}>
                {["#", "Số điện thoại", "Bài viết", "Vlog", "Chờ duyệt", "Lần cuối"].map((h) => (
                  <Typography key={h} variant="caption" color="text.disabled" fontWeight={700} sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {h}
                  </Typography>
                ))}
              </Box>
              <Divider />

              {contributors.map((c, idx) => {
                const total = c.posts + c.vlogs + c.postsGuest + c.vlogsGuest;
                const pending = c.postsGuest + c.vlogsGuest;
                const rankColor = idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#b45309" : null;

                return (
                  <React.Fragment key={c.phone}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "32px 1fr 72px 72px 90px 80px",
                        gap: 1,
                        px: 1,
                        py: 1.25,
                        alignItems: "center",
                        borderRadius: 2,
                        mx: -1,
                        transition: "background 0.12s",
                        "&:hover": { bgcolor: "#f8fafc" },
                      }}
                    >
                      {/* Rank */}
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {rankColor ? (
                          <EmojiEventsIcon sx={{ fontSize: 18, color: rankColor }} />
                        ) : (
                          <Typography variant="caption" color="text.disabled" fontWeight={700}>{idx + 1}</Typography>
                        )}
                      </Box>

                      {/* Phone */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                        <PhoneIcon sx={{ fontSize: 14, color: "#94a3b8", flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap sx={{ fontFamily: "monospace", fontSize: "0.82rem" }}>
                            {c.phone}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {total} đóng góp
                          </Typography>
                        </Box>
                      </Box>

                      {/* Posts approved */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {c.posts > 0 ? (
                          <Chip label={c.posts} size="small" sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 800, fontSize: "0.72rem", height: 22 }} />
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </Box>

                      {/* Vlogs approved */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {c.vlogs > 0 ? (
                          <Chip label={c.vlogs} size="small" sx={{ bgcolor: "#ede9fe", color: "#7c3aed", fontWeight: 800, fontSize: "0.72rem", height: 22 }} />
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </Box>

                      {/* Pending (guest) */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                        {pending > 0 ? (
                          <MuiTooltip title={`${c.postsGuest} bài · ${c.vlogsGuest} vlog chờ duyệt`} arrow>
                            <Chip
                              label={`${pending} chờ duyệt`}
                              size="small"
                              sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.68rem", height: 22, cursor: "default" }}
                            />
                          </MuiTooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </Box>

                      {/* Last date */}
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {c.lastDate ? formatDate(c.lastDate) : "—"}
                      </Typography>
                    </Box>
                    {idx < contributors.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Recent vlogs ────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Vlog gần nhất</Typography>
              <Typography variant="caption" color="text.secondary">5 vlog được thêm mới nhất</Typography>
            </Box>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: 2,
                bgcolor: "#eef2ff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <EditNoteIcon fontSize="small" sx={{ color: "#6366f1" }} />
            </Box>
          </Box>

          {recentVlogs.length === 0 ? (
            <Box sx={{ py: 5, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", borderRadius: 2 }}>
              <Typography variant="body2" color="text.disabled">Chưa có vlog nào</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {recentVlogs.map((v, idx) => (
                <React.Fragment key={v.id}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      py: 1.5,
                      px: 1,
                      mx: -1,
                      borderRadius: 2,
                      transition: "background 0.12s",
                      "&:hover": { bgcolor: "#f8fafc" },
                    }}
                  >
                    {/* Thumbnail */}
                    {v.poster_url ? (
                      <Box
                        component="img"
                        src={v.poster_url}
                        alt=""
                        sx={{ width: 64, height: 44, objectFit: "cover", borderRadius: 1.5, flexShrink: 0 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 64, height: 44, borderRadius: 1.5,
                          bgcolor: "#f1f5f9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <OndemandVideoIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                      </Box>
                    )}

                    {/* Info */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap title={v.title}>
                        {v.title}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25, flexWrap: "wrap" }}>
                        {v.host && (
                          <Typography variant="caption" color="text.secondary" noWrap>{v.host}</Typography>
                        )}
                        {v.created_at && (
                          <Typography variant="caption" color="text.disabled">· {formatDate(v.created_at)}</Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Status */}
                    <Box
                      sx={{
                        px: 1.25, py: 0.35, borderRadius: 10, flexShrink: 0,
                        bgcolor: v.is_published ? "#d1fae5" : "#f1f5f9",
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          fontSize: "0.68rem",
                          color: v.is_published ? "#065f46" : "#64748b",
                          lineHeight: 1,
                        }}
                      >
                        {v.is_published ? "Đã đăng" : "Nháp"}
                      </Typography>
                    </Box>
                  </Box>
                  {idx < recentVlogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function EmptyChart() {
  return (
    <Box
      sx={{
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f8fafc",
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" color="text.disabled">Chưa có dữ liệu</Typography>
    </Box>
  );
}
