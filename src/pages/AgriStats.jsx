// src/pages/AgriStats.jsx
// Thử nghiệm: biểu đồ biến động giá & sản lượng nông thuỷ sản theo tháng/năm.
// Dữ liệu MÔ PHỎNG (deterministic) — chưa nối nguồn thống kê thật.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Box, Container, Typography, Paper, Chip, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from "recharts";

// ── Mock data ────────────────────────────────────────────────────────────────
// Danh mục & catalog nông thuỷ sản miền Tây. Giá cơ sở (đ/kg trừ khi ghi khác),
// hệ số mùa vụ 12 tháng: các loại chủ lực được chỉnh tay (OVERRIDES), phần còn lại
// sinh deterministic từ tên sản phẩm — cùng input luôn cho cùng dữ liệu.
const CATEGORIES = {
  luagao:   { name: "Lúa & ngũ cốc",          emoji: "🌾", cycle: 3, verb: "Gieo sạ" },
  traicay:  { name: "Cây ăn trái",             emoji: "🥭", cycle: 5, verb: "Xử lý ra hoa" },
  raucu:    { name: "Rau củ & hoa màu",        emoji: "🥬", cycle: 2, verb: "Xuống giống" },
  hoakieng: { name: "Hoa & cây cảnh",          emoji: "🌸", cycle: 4, verb: "Xuống giống" },
  cangot:   { name: "Cá nước ngọt",            emoji: "🐟", cycle: 6, verb: "Thả nuôi" },
  tomtep:   { name: "Tôm",                     emoji: "🦐", cycle: 5, verb: "Thả nuôi" },
  cuaghe:   { name: "Cua & ghẹ",               emoji: "🦀", cycle: 5, verb: "Thả nuôi" },
  ocso:     { name: "Ốc & nhuyễn thể",         emoji: "🐚", cycle: 8, verb: "Thả nuôi" },
  haisan:   { name: "Hải sản ven biển",        emoji: "🦑", cycle: 6, verb: "Thả nuôi" },
  nuocnoi:  { name: "Đặc sản mùa nước nổi",    emoji: "🌊", cycle: 0, verb: "Khai thác" },
};

// [tên, giá cơ sở, tuỳ chọn {emoji, unit, cycle, verb, wild, trend}]
// wild = đánh bắt/khai thác tự nhiên → không đưa vào gợi ý "nên nuôi trồng"
const CATALOG = {
  luagao: [
    ["Lúa tẻ (thóc tươi)", 6800], ["Nếp Phú Tân", 7900, { tet: true }], ["Lúa thơm", 7600],
    ["Lúa Jasmine", 7400], ["Lúa ST24", 8600], ["Lúa ST25", 9200],
    ["Bắp (ngô)", 7200, { emoji: "🌽" }], ["Khoai lang", 9500, { emoji: "🍠" }],
    ["Khoai mì (sắn)", 4200, { emoji: "🥔" }],
  ],
  traicay: [
    ["Xoài cát Hòa Lộc", 38000, { emoji: "🥭", tet: true }], ["Xoài Cát Chu", 26000, { emoji: "🥭" }],
    ["Xoài tượng", 18000, { emoji: "🥭" }],
    ["Sầu riêng Ri6", 62000, { emoji: "🫒" }], ["Sầu riêng Monthong", 75000, { emoji: "🫒" }],
    ["Bưởi Năm Roi", 28000, { emoji: "🍊", tet: true }], ["Bưởi da xanh", 38000, { emoji: "🍊", tet: true }],
    ["Bưởi lông Cổ Cò", 22000, { emoji: "🍊" }],
    ["Nhãn xuồng cơm vàng", 42000, { emoji: "🟤" }], ["Nhãn tiêu", 25000, { emoji: "🟤" }],
    ["Vải thiều", 35000, { emoji: "🔴" }],
    ["Chôm chôm nhãn", 28000, { emoji: "🔴" }], ["Chôm chôm Java", 18000, { emoji: "🔴" }],
    ["Măng cụt", 45000, { emoji: "🟣" }],
    ["Thanh long ruột trắng", 12000, { emoji: "🐉" }], ["Thanh long ruột đỏ", 18000, { emoji: "🐉", tet: true }],
    ["Dừa xiêm", 8000, { emoji: "🥥", unit: "đ/trái" }], ["Dừa ta", 6000, { emoji: "🥥", unit: "đ/trái" }],
    ["Dừa sáp", 90000, { emoji: "🥥", unit: "đ/trái" }],
    ["Cam sành", 15000, { emoji: "🍊" }], ["Cam mật", 18000, { emoji: "🍊" }],
    ["Quýt đường", 28000, { emoji: "🍊" }], ["Quýt hồng", 35000, { emoji: "🍊", tet: true }],
    ["Chanh không hạt", 14000, { emoji: "🍋" }], ["Chanh giấy", 18000, { emoji: "🍋" }],
    ["Ổi xá lị", 12000, { emoji: "🍐" }], ["Ổi không hạt", 16000, { emoji: "🍐" }],
    ["Mận hồng đào", 20000, { emoji: "🍎" }], ["Mận An Phước", 25000, { emoji: "🍎" }],
    ["Chuối sứ", 9000, { emoji: "🍌" }], ["Chuối già", 7000, { emoji: "🍌" }],
    ["Chuối cau", 12000, { emoji: "🍌" }],
    ["Khóm Cầu Đúc", 8500, { emoji: "🍍", unit: "đ/trái" }], ["Khóm Bến Lức", 8000, { emoji: "🍍", unit: "đ/trái" }],
    ["Mít Thái", 18500, { emoji: "🍈" }], ["Mít tố nữ", 30000, { emoji: "🍈" }],
    ["Đu đủ", 8500, { emoji: "🧡" }],
    ["Mãng cầu xiêm", 28000, { emoji: "💚" }], ["Mãng cầu ta (na)", 40000, { emoji: "💚", tet: true }],
    ["Sa-bô-chê", 18000, { emoji: "🟫" }], ["Dâu da", 15000, { emoji: "🟡" }],
    ["Khế", 10000, { emoji: "⭐" }], ["Phật thủ", 60000, { emoji: "🖐️" }],
    ["Bồ quân", 20000, { emoji: "🟣" }], ["Mắc mật", 35000, { emoji: "🟢" }],
    ["Thốt nốt", 15000, { emoji: "🌴", unit: "đ/trái", wild: true }],
    ["Trái giác", 25000, { emoji: "🍇", wild: true }],
    ["Bình bát", 12000, { emoji: "🟠", wild: true }],
  ],
  raucu: [
    ["Rau muống", 12000], ["Rau nhút", 25000], ["Bông súng", 15000, { emoji: "🪷" }],
    ["Rau má", 18000], ["Rau dền", 12000], ["Rau lang", 10000],
    ["Cải bẹ", 12000], ["Cải ngọt", 13000], ["Cải thìa", 14000],
    ["Cà chua", 18000, { emoji: "🍅" }], ["Cà tím", 14000, { emoji: "🍆" }],
    ["Khổ qua", 16000, { emoji: "🥒" }],
    ["Bí đao", 10000, { emoji: "🥒" }], ["Bí rợ", 12000, { emoji: "🎃" }],
    ["Bí hồ lô", 14000, { emoji: "🎃" }], ["Mướp hương", 14000, { emoji: "🥒" }],
    ["Đậu đũa", 16000, { emoji: "🫛" }], ["Đậu cô ve", 20000, { emoji: "🫛" }],
    ["Đậu bắp", 15000, { emoji: "🫛" }], ["Đậu nành", 17500, { emoji: "🫘", cycle: 3 }],
    ["Khoai mỡ", 18000, { emoji: "🍠" }], ["Khoai môn", 22000, { emoji: "🍠" }],
    ["Củ sen", 30000, { emoji: "🪷" }], ["Ngó sen", 35000, { emoji: "🪷" }],
    ["Củ cải trắng", 10000], ["Củ cải đỏ", 12000], ["Cà rốt", 15000, { emoji: "🥕" }],
    ["Su hào", 14000], ["Dưa leo", 12000, { emoji: "🥒" }],
    ["Dưa hấu", 9000, { emoji: "🍉", cycle: 3, tet: true }], ["Dưa gang", 8000, { emoji: "🍈" }],
    ["Củ kiệu", 40000, { emoji: "🧅", tet: true }], ["Hành lá", 25000, { emoji: "🧅" }],
    ["Hành tây", 18000, { emoji: "🧅" }], ["Tỏi", 45000, { emoji: "🧄" }],
    ["Ớt", 35000, { emoji: "🌶️" }], ["Ngò gai", 30000, { emoji: "🌿" }],
    ["Rau răm", 20000, { emoji: "🌿" }], ["Húng quế", 25000, { emoji: "🌿" }],
    ["Tía tô", 30000, { emoji: "🌿" }], ["Kinh giới", 25000, { emoji: "🌿" }],
  ],
  hoakieng: [
    ["Hoa hồng", 5000, { emoji: "🌹", unit: "đ/cành", prodUnit: "nghìn cành" }],
    ["Hoa cúc", 3500, { emoji: "🌼", unit: "đ/cành", prodUnit: "nghìn cành" }],
    ["Hoa vạn thọ", 15000, { emoji: "🏵️", unit: "đ/chậu", prodUnit: "nghìn chậu" }],
    ["Hoa mai", 500000, { emoji: "🌸", unit: "đ/chậu", prodUnit: "nghìn chậu", cycle: 10 }],
    ["Lan hồ điệp", 150000, { emoji: "🌺", unit: "đ/chậu", prodUnit: "nghìn chậu", cycle: 9 }],
    ["Lan vũ nữ", 60000, { emoji: "🌺", unit: "đ/chậu", prodUnit: "nghìn chậu", cycle: 8 }],
    ["Địa lan", 200000, { emoji: "🌺", unit: "đ/chậu", prodUnit: "nghìn chậu", cycle: 10 }],
    ["Hoa giấy", 80000, { emoji: "🌸", unit: "đ/chậu", prodUnit: "nghìn chậu" }],
    ["Hoa sứ", 120000, { emoji: "🌸", unit: "đ/chậu", prodUnit: "nghìn chậu" }],
    ["Hoa đồng tiền", 4000, { emoji: "🌼", unit: "đ/cành", prodUnit: "nghìn cành" }],
    ["Hoa ly", 25000, { emoji: "🌷", unit: "đ/cành", prodUnit: "nghìn cành" }],
    ["Hoa cẩm chướng", 4500, { emoji: "🌸", unit: "đ/cành", prodUnit: "nghìn cành" }],
    ["Hoa oải hương", 90000, { emoji: "💜", unit: "đ/chậu", prodUnit: "nghìn chậu" }],
    ["Bonsai", 800000, { emoji: "🪴", unit: "đ/chậu", prodUnit: "nghìn chậu", cycle: 12 }],
    ["Kiểng lá", 60000, { emoji: "🪴", unit: "đ/chậu", prodUnit: "nghìn chậu", cycle: 6 }],
    ["Đinh lăng", 45000, { emoji: "🌿", cycle: 12 }],
    ["Sả", 12000, { emoji: "🌿", cycle: 4 }],
    ["Cam thảo đất", 40000, { emoji: "🌿", cycle: 6 }],
  ],
  cangot: [
    ["Cá tra", 27500], ["Cá basa", 26000],
    ["Cá lóc", 48000, { cycle: 5, tet: true }], ["Cá rô đồng", 55000, { cycle: 4 }],
    ["Cá trê vàng", 45000, { cycle: 4 }], ["Cá trê trắng", 40000, { cycle: 4 }],
    ["Cá trê phi", 32000, { cycle: 4 }],
    ["Cá chốt", 70000, { wild: true }], ["Cá he", 38000],
    ["Cá linh", 80000, { wild: true }], ["Cá cơm sông", 45000, { wild: true }],
    ["Cá sặc", 50000, { cycle: 5 }], ["Cá lau kính", 15000, { wild: true }],
    ["Cá chép", 40000], ["Cá trắm", 45000], ["Cá trôi", 32000], ["Cá mè", 25000],
    ["Cá hú", 45000], ["Cá bông lau", 120000, { wild: true }],
    ["Cá ngát", 85000, { wild: true }], ["Cá dứa", 110000],
    ["Cá cháy", 60000, { wild: true }], ["Cá lòng tong", 90000, { wild: true }],
    ["Cá dao", 50000, { wild: true }], ["Cá heo nước ngọt", 350000, { wild: true }],
    ["Cá bảy màu (cảnh)", 5000, { emoji: "🐠", unit: "đ/con", prodUnit: "nghìn con", cycle: 2 }],
    ["Cá vàng (cảnh)", 30000, { emoji: "🐠", unit: "đ/con", prodUnit: "nghìn con", cycle: 3 }],
  ],
  tomtep: [
    ["Tôm sú", 180000, { cycle: 4 }], ["Tôm thẻ chân trắng", 110000, { cycle: 3 }],
    ["Tôm càng xanh", 195000, { cycle: 6, tet: true }],
    ["Tôm đất", 160000, { wild: true }], ["Tôm bạc", 140000, { wild: true }],
    ["Tôm he", 200000, { wild: true }],
  ],
  cuaghe: [
    ["Cua gạch", 450000], ["Cua thịt", 280000], ["Cua yếm vuông", 250000],
    ["Cua đồng", 60000, { wild: true }],
    ["Ghẹ xanh", 350000, { wild: true }], ["Ghẹ ba chấm", 280000, { wild: true }],
  ],
  ocso: [
    ["Ốc bươu đen", 45000, { cycle: 5 }], ["Ốc nhồi", 60000, { cycle: 5 }],
    ["Ốc bươu vàng", 15000, { wild: true }],
    ["Ốc len", 55000], ["Ốc giác", 70000, { wild: true }], ["Ốc hương", 400000],
    ["Sò huyết", 120000], ["Sò lông", 60000, { wild: true }], ["Sò điệp", 90000, { wild: true }],
    ["Hàu", 35000], ["Nghêu", 45000], ["Trai", 30000, { wild: true }],
    ["Chem chép", 50000, { wild: true }],
  ],
  haisan: [
    ["Cá thu", 180000, { wild: true }], ["Cá ngừ", 90000, { wild: true }],
    ["Cá chim trắng", 140000], ["Cá tráp", 160000, { wild: true }],
    ["Cá đối", 90000, { wild: true }], ["Cá dìa", 180000],
    ["Cá bống cát", 120000, { wild: true }], ["Cá bống dừa", 130000, { wild: true }],
    ["Cá bống sao", 100000, { wild: true }], ["Cá bống kèo", 150000, { cycle: 4 }],
    ["Cá khoai", 130000, { wild: true }], ["Cá chình", 320000, { cycle: 12 }],
    ["Lươn", 130000, { cycle: 8 }], ["Lươn đồng", 160000, { wild: true }],
    ["Cá trạch", 180000, { cycle: 6 }], ["Cá chốt biển", 80000, { wild: true }],
  ],
  nuocnoi: [
    ["Bông điên điển", 60000, { emoji: "💛", wild: true }],
    ["Bông so đũa", 40000, { emoji: "🤍", wild: true }],
    ["Dừa nước", 25000, { emoji: "🌴", wild: true }],
    ["Cà cuống", 800000, { emoji: "🪲", wild: true }],
  ],
};

// Slug không dấu, ổn định — làm key cho từng sản phẩm
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Hash chuỗi deterministic → [0,1)
const hash01 = (str, salt = 0) => {
  let h = salt;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return ((h % 10000) / 10000);
};

// Sinh hệ số mùa vụ: giá dao động sin quanh 1, sản lượng ngược pha (cung nhiều → giá thấp)
function genSeasonal(key, amp, phase) {
  return Array.from({ length: 12 }, (_, i) =>
    +(1 + amp * Math.sin(((i - phase) / 12) * Math.PI * 2) + (hash01(key, i + 7) - 0.5) * 0.04).toFixed(3));
}

// Mùa vụ chỉnh tay cho các loại chủ lực Phú Tân + đặc sản mùa nước nổi
const OVERRIDES = {
  "lua-te-thoc-tuoi": {
    seasonal: [1.02, 1.05, 0.97, 0.93, 0.95, 1.0, 1.04, 1.08, 1.03, 0.96, 0.94, 0.99],
    prodSeasonal: [0.6, 1.6, 1.8, 0.7, 0.5, 0.9, 1.5, 1.7, 0.8, 0.5, 0.7, 0.7], trend: 0.05,
  },
  "nep-phu-tan": {
    seasonal: [1.06, 1.1, 1.0, 0.94, 0.92, 0.96, 1.02, 1.05, 1.0, 0.95, 0.97, 1.03],
    prodSeasonal: [0.7, 1.5, 1.9, 0.8, 0.5, 0.8, 1.4, 1.8, 0.9, 0.5, 0.6, 0.6], trend: 0.06,
  },
  "ca-tra": {
    seasonal: [1.03, 1.0, 0.96, 0.94, 0.97, 1.0, 1.02, 1.05, 1.07, 1.04, 1.0, 1.02],
    prodSeasonal: [0.9, 0.85, 0.95, 1.05, 1.1, 1.15, 1.1, 1.05, 1.0, 0.95, 0.95, 0.95], trend: 0.04,
  },
  "tom-cang-xanh": {
    seasonal: [1.15, 1.1, 0.95, 0.9, 0.88, 0.92, 0.96, 1.0, 1.05, 1.08, 1.12, 1.2],
    prodSeasonal: [0.8, 0.7, 0.9, 1.05, 1.15, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.95], trend: 0.07,
  },
  "xoai-cat-hoa-loc": {
    seasonal: [1.25, 1.15, 0.85, 0.7, 0.65, 0.75, 0.9, 1.05, 1.15, 1.2, 1.25, 1.3],
    prodSeasonal: [0.5, 0.7, 1.4, 1.9, 2.0, 1.5, 0.9, 0.6, 0.4, 0.4, 0.4, 0.5], trend: 0.03,
  },
  "ca-loc": {
    seasonal: [1.18, 1.12, 1.0, 0.94, 0.9, 0.88, 0.92, 0.96, 1.0, 1.05, 1.1, 1.2],
    prodSeasonal: [0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.15, 1.05, 1.0, 0.95, 0.9], trend: 0.05,
  },
  // Mùa nước nổi: chỉ có hàng T8–T11 (âm lịch ~ T9–T12 dương), giá rẻ trong mùa
  "ca-linh": {
    seasonal: [1.4, 1.3, 1.2, 1.2, 1.25, 1.3, 1.15, 0.75, 0.6, 0.65, 0.8, 1.2],
    prodSeasonal: [0.05, 0.05, 0.05, 0.05, 0.1, 0.2, 0.6, 1.8, 2.6, 2.4, 1.6, 0.5],
  },
  "bong-dien-dien": {
    seasonal: [1.35, 1.3, 1.25, 1.25, 1.3, 1.2, 1.0, 0.7, 0.6, 0.65, 0.85, 1.2],
    prodSeasonal: [0.05, 0.05, 0.05, 0.05, 0.1, 0.3, 0.8, 2.0, 2.6, 2.3, 1.4, 0.3],
  },
  "cua-dong": {
    seasonal: [1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.8, 0.75, 0.8, 0.95, 1.15],
    prodSeasonal: [0.4, 0.4, 0.5, 0.6, 0.8, 1.0, 1.3, 1.8, 2.0, 1.8, 1.2, 0.6],
  },
};

// Dựng PRODUCTS phẳng từ catalog
const PRODUCTS = {};
Object.entries(CATALOG).forEach(([catKey, items]) => {
  const cat = CATEGORIES[catKey];
  items.forEach(([name, priceBase, opts = {}]) => {
    const key = slugify(name);
    const ov = OVERRIDES[key] ?? {};
    const amp = 0.05 + hash01(key, 1) * 0.1;       // biên độ mùa giá 5–15%
    const phase = Math.floor(hash01(key, 2) * 12); // pha mùa vụ
    PRODUCTS[key] = {
      name,
      emoji: opts.emoji ?? cat.emoji,
      category: catKey,
      priceBase,
      prodBase: Math.round(priceBase > 100000 ? 30 + hash01(key, 3) * 300 : 300 + hash01(key, 3) * 6000),
      trend: ov.trend ?? +(0.02 + hash01(key, 4) * 0.05).toFixed(3),
      cycleMonths: opts.cycle ?? cat.cycle,
      verb: opts.verb ?? cat.verb,
      wild: !!opts.wild,
      tet: !!opts.tet || catKey === "hoakieng",
      unit: opts.unit ?? "đ/kg",
      prodUnit: opts.prodUnit ?? "tấn",
      seasonal: ov.seasonal ?? genSeasonal(key, amp, phase),
      prodSeasonal: ov.prodSeasonal ?? genSeasonal(key, amp * 4, phase + 6),
    };
  });
});

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

// "Làm mới dữ liệu": tăng salt → re-draw nhiễu của THÁNG HIỆN TẠI + DỰ BÁO.
// Lịch sử (tháng đã chốt) không đổi — mô phỏng việc kéo số liệu mới nhất về.
let REFRESH_SALT = 0;
export const bumpRefreshSalt = () => { REFRESH_SALT += 1; return REFRESH_SALT; };

function monthlyValue(productKey, metric, year, month) {
  const p = PRODUCTS[productKey];
  const base = metric === "price" ? p.priceBase : p.prodBase;
  const season = metric === "price" ? p.seasonal[month - 1] : p.prodSeasonal[month - 1];
  const growth = 1 + p.trend * (year - 2023);
  const isFresh = year > CURRENT_YEAR || (year === CURRENT_YEAR && month >= CURRENT_MONTH);
  const seed = productKey.length * 1000 + year * 12 + month
    + (metric === "price" ? 0 : 500)
    + (isFresh ? REFRESH_SALT * 7919 : 0);
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

// ── Khí hậu & giai đoạn (mô phỏng theo chuẩn khí hậu An Giang) ───────────────
// Lượng mưa tương đối (mùa mưa T5–T11, đỉnh T9–T10), nhiệt độ (nóng nhất T4–T5),
// mực nước lũ/nước nổi (T8–T11, đỉnh T9–T10)
const CLIMATE = {
  rain:  [0.1, 0.1, 0.2, 0.5, 1.0, 1.2, 1.3, 1.4, 1.6, 1.5, 0.9, 0.3],
  heat:  [0.5, 0.7, 0.9, 1.0, 1.0, 0.8, 0.7, 0.7, 0.6, 0.6, 0.5, 0.4],
  flood: [0.1, 0.0, 0.0, 0.0, 0.1, 0.3, 0.6, 1.0, 1.4, 1.3, 0.8, 0.3],
};

// Chỉ số ENSO mô phỏng theo năm: >0.35 El Niño (khô hạn), <−0.35 La Niña (mưa lũ nhiều)
const ensoOf = (year) => +((hash01(`enso-${year}`, 9) - 0.5) * 2).toFixed(2);
const ensoLabel = (e) => (e >= 0.35 ? "El Niño — khô hạn, ít mưa hơn trung bình"
  : e <= -0.35 ? "La Niña — mưa & lũ nhiều hơn trung bình"
  : "Trung tính — thời tiết gần mức trung bình nhiều năm");

const stageOf = (month) => {
  if (month >= 11 || month <= 2) return "vụ Đông Xuân";
  if (month >= 4 && month <= 7) return "vụ Hè Thu";
  return "vụ Thu Đông";
};
const isTetWindow = (month) => month === 12 || month === 1;
const inFlood = (month) => CLIMATE.flood[month - 1] >= 0.8;

// Trung bình một chỉ số khí hậu trên cửa sổ canh tác [start → sale], có hiệu chỉnh ENSO
function climateAvg(kind, start, months) {
  let sum = 0;
  for (let i = 0; i < months; i++) {
    const m = addMonths(start.year, start.month, i);
    const enso = ensoOf(m.year);
    let v = CLIMATE[kind][m.month - 1];
    if (kind === "rain" || kind === "flood") v *= 1 - enso * 0.3; // El Niño → giảm mưa/lũ
    if (kind === "heat") v *= 1 + enso * 0.15; // El Niño → nóng hơn
    sum += v;
  }
  return sum / Math.max(months, 1);
}

// Xuống giống tại start → bán sau cycleMonths. Điểm = mùa giá lúc bán + xu hướng
// − biến động ± thời tiết (mưa/lũ/nóng × độ nhạy từng nhóm) ± lịch sử giá ± hiệu ứng Tết
function buildRecommendations(offset) {
  const start = addMonths(CURRENT_YEAR, CURRENT_MONTH, offset);
  return Object.entries(PRODUCTS).filter(([, p]) => !p.wild && p.cycleMonths > 0).map(([key, p]) => {
    const sale = addMonths(start.year, start.month, p.cycleMonths);
    const forecastPrice = monthlyValue(key, "price", sale.year, sale.month);
    const seasonalAdvPct = (p.seasonal[sale.month - 1] - 1) * 100;
    const riskPct = stdev(p.seasonal) * 100;
    const trendPct = p.trend * 100;
    const reasons = [];
    let score = seasonalAdvPct + trendPct * 0.5 - riskPct * 0.35;

    // 1) Mùa giá & xu hướng (như cũ)
    if (seasonalAdvPct >= 3) reasons.push(`Bán ra đúng mùa giá cao (+${seasonalAdvPct.toFixed(0)}% so mức nền năm)`);
    else if (seasonalAdvPct <= -3) reasons.push(`Rơi vào mùa giá thấp (${seasonalAdvPct.toFixed(0)}% so mức nền năm)`);
    if (trendPct >= 5) reasons.push(`Xu hướng giá tăng khoảng ${trendPct.toFixed(0)}%/năm`);

    // 2) Thời tiết trên cửa sổ canh tác — độ nhạy theo nhóm
    const rain = climateAvg("rain", start, p.cycleMonths);
    const heat = climateAvg("heat", start, p.cycleMonths);
    const flood = climateAvg("flood", start, p.cycleMonths);
    const cat = p.category;
    if ((cat === "raucu" || cat === "hoakieng") && rain >= 1.1) {
      score -= 5;
      reasons.push("⛈️ Vụ trồng trùng cao điểm mưa — rau/hoa dễ dập úng, tốn công che chắn");
    }
    if ((cat === "raucu" || cat === "hoakieng") && rain <= 0.5) {
      score += 3;
      reasons.push("☀️ Vụ trồng vào mùa khô — thuận lợi cho rau màu, hoa kiểng");
    }
    // Nước nổi chỉ lợi cho thuỷ sản thương phẩm (đ/kg) — không áp dụng cho cá cảnh
    if ((cat === "tomtep" || cat === "cangot") && p.unit === "đ/kg" && flood >= 0.7) {
      score += 4;
      reasons.push("🌊 Trùng mùa nước nổi — nguồn nước & thức ăn tự nhiên dồi dào cho thuỷ sản");
    }
    if ((cat === "tomtep" || cat === "cangot" || cat === "haisan") && heat >= 0.9) {
      score -= 4;
      reasons.push("🌡️ Cao điểm nắng nóng T4–T5 — ao nuôi dễ thiếu oxy, cần quạt nước");
    }
    if (cat === "luagao" && flood >= 0.9) {
      score -= 6;
      reasons.push("⚠️ Vụ 3 (Thu Đông) trùng đỉnh lũ — rủi ro vỡ đê bao, cân nhắc xả lũ");
    }
    if (cat === "traicay" && rain >= 1.3) {
      score -= 3;
      reasons.push("🌧️ Mưa dầm lúc xử lý ra hoa — tỉ lệ đậu trái giảm");
    }

    // 3) Lịch sử giá — hồi quy về trung bình 5 năm cùng kỳ + momentum 3 tháng
    const hist5 = Array.from({ length: 5 }, (_, i) => monthlyValue(key, "price", sale.year - 1 - i, sale.month));
    const histAvg = hist5.reduce((a, b) => a + b, 0) / 5;
    const expected = histAvg * (1 + p.trend); // mức "hợp lý" nếu tiếp đà tăng bình thường
    const vsHistPct = ((forecastPrice - expected) / expected) * 100;
    if (vsHistPct >= 6) {
      score -= 3;
      reasons.push(`📉 Giá dự báo cao hơn trung bình 5 năm cùng kỳ +${vsHistPct.toFixed(0)}% — coi chừng điều chỉnh`);
    } else if (vsHistPct <= -6) {
      score += 3;
      reasons.push(`📈 Giá dự báo thấp hơn trung bình 5 năm cùng kỳ ${vsHistPct.toFixed(0)}% — còn dư địa phục hồi`);
    }
    const ago3 = addMonths(CURRENT_YEAR, CURRENT_MONTH, -3);
    const momentumPct = ((monthlyValue(key, "price", CURRENT_YEAR, CURRENT_MONTH) - monthlyValue(key, "price", ago3.year, ago3.month))
      / monthlyValue(key, "price", ago3.year, ago3.month)) * 100;
    if (momentumPct >= 8) reasons.push(`🔥 Giá 3 tháng gần đây đang tăng +${momentumPct.toFixed(0)}%`);

    // 4) Giai đoạn — hiệu ứng cận Tết cho nhóm hàng chưng/biếu/tiêu dùng Tết
    if (isTetWindow(sale.month) && p.tet) {
      score += 6;
      reasons.push("🧧 Thu hoạch rơi đúng cận Tết — nhu cầu chưng, biếu, tiệc tăng mạnh");
    }
    if (riskPct >= 12) reasons.push("Giá biến động mạnh — cân nhắc rủi ro");

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

// Sticker mặt cười nổi — nhắc dữ liệu chỉ để tham khảo, không chịu trách nhiệm
const DisclaimerSticker = () => {
  const [open, setOpen] = useState(true);
  return (
    <Box sx={{
      position: "fixed", bottom: 20, right: 16, zIndex: 1300,
      display: "flex", alignItems: "flex-end", gap: 1, pointerEvents: "none",
    }}>
      {open && (
        <Box sx={{
          pointerEvents: "auto", position: "relative",
          maxWidth: { xs: 220, sm: 260 }, px: 1.75, py: 1.25,
          bgcolor: "var(--color-surface)", border: "1.5px solid var(--color-accent-gold)",
          borderRadius: "14px 14px 4px 14px", boxShadow: "var(--shadow-medium)",
          animation: "sticker-bubble-in 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          "@keyframes sticker-bubble-in": {
            from: { opacity: 0, transform: "translateY(10px) scale(0.9)" },
            to: { opacity: 1, transform: "none" },
          },
        }}>
          <Box
            component="button"
            type="button"
            aria-label="Đóng nhắc nhở"
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute", top: 4, right: 6, border: "none", background: "none",
              cursor: "pointer", fontSize: "0.7rem", color: "var(--viz-ink-muted)",
              p: 0.25, lineHeight: 1, "&:hover": { color: "var(--color-text)" },
            }}
          >
            ✕
          </Box>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--color-text)", lineHeight: 1.5, pr: 1.5 }}>
            Hì hì, mình chỉ là <b>số liệu mô phỏng để tham khảo</b> thôi nha —
            không chính xác và <b>không chịu trách nhiệm dưới mọi hình thức</b> cho
            quyết định canh tác, mua bán của bạn đâu đó! 🙏
          </Typography>
        </Box>
      )}
      <Box
        role="button"
        aria-label="Nhắc nhở: dữ liệu chỉ mang tính tham khảo"
        onClick={() => setOpen((v) => !v)}
        sx={{
          pointerEvents: "auto", cursor: "pointer", fontSize: "2.2rem",
          lineHeight: 1, userSelect: "none", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
          animation: "sticker-bob 2.4s ease-in-out infinite",
          "@keyframes sticker-bob": {
            "0%, 100%": { transform: "translateY(0) rotate(-6deg)" },
            "30%": { transform: "translateY(-7px) rotate(6deg)" },
            "60%": { transform: "translateY(-2px) rotate(-3deg)" },
          },
          "&:hover": { animationPlayState: "paused" },
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        😅
      </Box>
    </Box>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const REFRESH_COOLDOWN_SECS = 30;
const LS_REFRESH_UNTIL = "agri_refresh_until";

const AgriStats = () => {
  const [categoryKey, setCategoryKey] = useState("luagao");
  const [productKey, setProductKey] = useState("lua-te-thoc-tuoi");
  const [metric, setMetric] = useState("price");

  // Làm mới dữ liệu (mô phỏng kéo nguồn mới nhất) + cooldown chống bấm liên tục
  const [dataVersion, setDataVersion] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshCooldown, setRefreshCooldown] = useState(() => {
    try {
      const until = parseInt(localStorage.getItem(LS_REFRESH_UNTIL) ?? "0", 10);
      return Math.max(0, Math.ceil((until - Date.now()) / 1000));
    } catch { return 0; }
  });

  useEffect(() => {
    if (refreshCooldown <= 0) return;
    const t = setInterval(() => setRefreshCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [refreshCooldown]);

  const handleRefresh = () => {
    if (refreshCooldown > 0) return;
    setDataVersion(bumpRefreshSalt());
    setLastRefresh(new Date());
    setRefreshCooldown(REFRESH_COOLDOWN_SECS);
    try { localStorage.setItem(LS_REFRESH_UNTIL, String(Date.now() + REFRESH_COOLDOWN_SECS * 1000)); } catch { }
  };
  const product = PRODUCTS[productKey];
  const metricInfo = METRICS[metric];
  // Đơn vị theo từng sản phẩm (đ/kg, đ/trái, đ/chậu... / tấn, nghìn cành...)
  const unitFor = metric === "price" ? product.unit : product.prodUnit;

  const categoryProducts = useMemo(() => (
    Object.entries(PRODUCTS).filter(([, p]) => p.category === categoryKey)
  ), [categoryKey]);

  const handleCategoryChange = (key) => {
    setCategoryKey(key);
    const first = Object.entries(PRODUCTS).find(([, p]) => p.category === key);
    if (first) setProductKey(first[0]);
  };

  // Fade "còn nữa" ở mép phải hàng chips danh mục (mobile) — ẩn khi đã cuộn tới cuối
  const catRowRef = useRef(null);
  const [catAtEnd, setCatAtEnd] = useState(false);
  const handleCatScroll = () => {
    const el = catRowRef.current;
    if (!el) return;
    setCatAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };
  useEffect(() => { handleCatScroll(); }, []);

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
  ), [productKey, metric, dataVersion]);

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
  const recommendations = useMemo(() => buildRecommendations(horizon.offset), [horizon.offset, dataVersion]);

  // Bối cảnh thời tiết & giai đoạn tại thời điểm bắt đầu của mốc đang chọn
  const ctxStart = addMonths(CURRENT_YEAR, CURRENT_MONTH, horizon.offset);
  const ctxEnso = ensoOf(ctxStart.year);
  const contextChips = [
    { icon: "📅", text: `T${ctxStart.month}/${ctxStart.year} — ${stageOf(ctxStart.month)}` },
    { icon: "🌦️", text: ensoLabel(ctxEnso) },
    ...(inFlood(ctxStart.month) ? [{ icon: "🌊", text: "Đang mùa nước nổi (T8–T11)" }] : []),
    ...(CLIMATE.heat[ctxStart.month - 1] >= 0.9 ? [{ icon: "🌡️", text: "Cao điểm nắng nóng" }] : []),
    ...(ctxStart.month >= 10 || ctxStart.month === 1
      ? [{ icon: "🧧", text: "Giai đoạn chuẩn bị hàng Tết" }] : []),
  ];

  // Dự báo giá 6 tháng tới cho toàn bộ sản phẩm (từ mô hình mùa vụ)
  const FORECAST_MONTHS = 6;
  const forecastMonths = useMemo(() => (
    Array.from({ length: FORECAST_MONTHS }, (_, i) => addMonths(CURRENT_YEAR, CURRENT_MONTH, i + 1))
  ), []);
  // Chỉ hiện danh mục đang chọn — 150 dòng cho tất cả loại là không đọc nổi trên mobile
  const forecastTable = useMemo(() => (
    categoryProducts.map(([key, p]) => {
      let prev = monthlyValue(key, "price", CURRENT_YEAR, CURRENT_MONTH);
      const cells = forecastMonths.map((m) => {
        const v = monthlyValue(key, "price", m.year, m.month);
        const delta = ((v - prev) / prev) * 100;
        prev = v;
        return { ...m, value: v, delta };
      });
      return { key, product: p, cells };
    })
  ), [forecastMonths, categoryProducts, dataVersion]);

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
          {/* Filter row: danh mục → sản phẩm → chỉ số. Mobile: chips cuộn ngang 1 hàng,
              tràn lề phải để lộ một phần chip kế tiếp + fade gợi ý còn nữa */}
          <Box sx={{ position: "relative", mb: 1.5, mx: { xs: -2, sm: -3, md: 0 } }}>
            <Box
              ref={catRowRef}
              onScroll={handleCatScroll}
              sx={{
                display: "flex", gap: 0.75,
                flexWrap: { xs: "nowrap", md: "wrap" },
                overflowX: { xs: "auto", md: "visible" },
                px: { xs: 2, sm: 3, md: 0 },
                pb: { xs: 0.5, md: 0 },
                scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
                "& .MuiChip-root": { flexShrink: 0 },
              }}
            >
              {Object.entries(CATEGORIES).map(([key, c]) => (
                <Chip
                  key={key}
                  label={`${c.emoji} ${c.name}`}
                  onClick={() => handleCategoryChange(key)}
                  variant={key === categoryKey ? "filled" : "outlined"}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    ...(key === categoryKey
                      ? { bgcolor: "var(--color-primary)", color: "#fff", "&:hover": { bgcolor: "var(--color-secondary)" } }
                      : { color: "var(--color-text)", borderColor: "var(--color-border)" }),
                  }}
                />
              ))}
            </Box>
            {/* Fade mép phải — chỉ hiện trên mobile khi chưa cuộn tới cuối */}
            {!catAtEnd && (
              <Box sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center", justifyContent: "flex-end",
                position: "absolute", top: 0, right: 0, bottom: 0, width: 56,
                background: "linear-gradient(90deg, transparent, var(--color-background) 78%)",
                pointerEvents: "none", pr: 0.25,
              }}>
                <Typography component="span" sx={{
                  fontSize: "0.85rem", color: "var(--viz-ink-muted)", lineHeight: 1,
                  animation: "cat-hint-nudge 1.4s ease-in-out infinite",
                  "@keyframes cat-hint-nudge": {
                    "0%, 100%": { transform: "translateX(0)", opacity: 0.6 },
                    "50%": { transform: "translateX(3px)", opacity: 1 },
                  },
                }}>
                  ›
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", mb: 2.5 }}>
            <FormControl size="small" sx={{ minWidth: 240, flex: 1, maxWidth: 340 }}>
              <InputLabel id="agri-product-label">Sản phẩm ({categoryProducts.length} loại)</InputLabel>
              <Select
                labelId="agri-product-label"
                label={`Sản phẩm (${categoryProducts.length} loại)`}
                value={productKey}
                onChange={(e) => setProductKey(e.target.value)}
                sx={{ bgcolor: "var(--color-surface)" }}
              >
                {categoryProducts.map(([key, p]) => (
                  <MenuItem key={key} value={key}>{p.emoji} {p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              disabled={refreshCooldown > 0}
              onClick={handleRefresh}
              sx={{
                textTransform: "none", fontWeight: 700, fontSize: "0.78rem",
                borderRadius: "var(--radius-md)", borderColor: "var(--color-border)",
                color: "var(--color-text)", whiteSpace: "nowrap",
                "&.Mui-disabled": { color: "var(--viz-ink-muted)" },
              }}
            >
              {refreshCooldown > 0 ? `Chờ ${refreshCooldown}s` : "Làm mới dữ liệu"}
            </Button>
          </Box>
          {lastRefresh && (
            <Typography sx={{ fontSize: "0.7rem", color: "var(--viz-ink-muted)", mt: -1.5, mb: 2 }}>
              🔄 Đã kéo số liệu mới nhất lúc {lastRefresh.toLocaleTimeString("vi-VN")} — cập nhật tháng hiện tại &amp; dự báo (lịch sử giữ nguyên)
            </Typography>
          )}

          {/* Stat tiles */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2.5 }}>
            <StatTile
              label={`${metricInfo.label} tháng ${CURRENT_MONTH}/${CURRENT_YEAR}`}
              value={nowVal} unit={unitFor}
              delta={momDelta} deltaLabel="so tháng trước"
            />
            <StatTile
              label="So cùng kỳ năm trước"
              value={lastYearVal} unit={unitFor}
              delta={yoyDelta} deltaLabel={`so T${CURRENT_MONTH}/${CURRENT_YEAR - 1}`}
            />
          </Box>

          {/* Monthly line chart */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <ChartCard
              title={`${metricInfo.label} theo tháng — ${product.name}`}
              subtitle={`${unitFor} · năm 2026 có số liệu tới tháng ${CURRENT_MONTH}`}
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
                  <Tooltip content={<ChartTooltip unit={unitFor} />} />
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
              subtitle={`${unitFor} · 2020–2025`}
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={yearlyData} margin={{ top: 22, right: 14, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
                  <XAxis dataKey="year" tick={axisTick} axisLine={{ stroke: "var(--viz-axis)" }} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} tickFormatter={compact} />
                  <Tooltip content={<ChartTooltip unit={unitFor} />} cursor={{ fill: "var(--viz-grid)", opacity: 0.4 }} />
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
              subtitle="Chấm điểm theo mùa giá lúc bán + thời tiết (mưa/lũ/nóng, ENSO) + lịch sử giá 5 năm + hiệu ứng Tết − rủi ro biến động (mô phỏng, chỉ để tham khảo)"
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
              {/* Bối cảnh dự báo: giai đoạn + ENSO + nước nổi + nắng nóng + Tết */}
              <Box sx={{
                display: "flex", gap: 0.75, mb: 2,
                flexWrap: { xs: "nowrap", md: "wrap" },
                overflowX: { xs: "auto", md: "visible" },
                pb: { xs: 0.5, md: 0 },
                scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
              }}>
                {contextChips.map((c) => (
                  <Box key={c.text} sx={{
                    display: "flex", alignItems: "center", gap: 0.6, flexShrink: 0,
                    px: 1.25, py: 0.5, borderRadius: 99,
                    bgcolor: "var(--color-background-alt)", border: "1px solid var(--color-border)",
                  }}>
                    <span style={{ fontSize: "0.85rem" }}>{c.icon}</span>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-subtle)", whiteSpace: "nowrap" }}>
                      {c.text}
                    </Typography>
                  </Box>
                ))}
              </Box>

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
                      ≈{fmt(rec.forecastPrice)} <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--color-text-subtle)" }}>{rec.product.unit} lúc thu</Box>
                    </Typography>
                    {rec.reasons.slice(0, 4).map((r) => (
                      <Typography key={r} sx={{ fontSize: "0.7rem", color: "var(--color-text-subtle)", lineHeight: 1.45 }}>
                        · {r}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
              {/* Mobile: cuộn ngang 1 hàng thay vì wrap dài; desktop: wrap */}
              <Box sx={{
                display: "flex", gap: 0.75,
                flexWrap: { xs: "nowrap", md: "wrap" },
                overflowX: { xs: "auto", md: "visible" },
                pb: { xs: 0.5, md: 0 },
                scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
              }}>
                {recommendations.slice(3, 12).map((rec, i) => (
                  <Chip
                    key={rec.key} size="small"
                    label={`#${i + 4} ${rec.product.emoji} ${rec.product.name} · thu T${rec.sale.month} ≈${compact(rec.forecastPrice)}đ`}
                    sx={{ fontSize: "0.7rem", color: "var(--color-text-subtle)", bgcolor: "transparent", border: "1px solid var(--color-border)", flexShrink: 0 }}
                  />
                ))}
                <Typography sx={{ fontSize: "0.7rem", color: "var(--viz-ink-muted)", alignSelf: "center", flexShrink: 0, pl: 0.5 }}>
                  trong {recommendations.length} loại nuôi trồng được
                </Typography>
              </Box>
            </ChartCard>

            {/* Dự báo giá 6 tháng tới — theo danh mục đang chọn */}
            <ChartCard
              title="🔮 Dự báo giá các tháng tới"
              subtitle={`${CATEGORIES[categoryKey].name} (${forecastTable.length} loại) · ${FORECAST_MONTHS} tháng kế tiếp, giá theo đơn vị từng loại, mũi tên so với tháng liền trước (mô phỏng)`}
            >
              <Box sx={{ overflowX: "auto" }}>
                <Box component="table" sx={{
                  width: "100%", borderCollapse: "collapse", fontSize: "0.76rem", minWidth: 560,
                  "& th, & td": { padding: "6px 8px", textAlign: "right", borderBottom: "1px solid var(--viz-grid)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" },
                  "& th": { color: "var(--viz-ink-muted)", fontWeight: 700 },
                  "& td": { color: "var(--color-text)" },
                  // Cột tên sản phẩm dính bên trái khi cuộn ngang trên mobile
                  "& th:first-of-type, & td:first-of-type": {
                    textAlign: "left", position: "sticky", left: 0,
                    bgcolor: "var(--color-surface)", zIndex: 1,
                    boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                  },
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
              <summary>📋 Xem bảng số liệu ({metricInfo.label.toLowerCase()} theo tháng, {unitFor})</summary>
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

      <DisclaimerSticker />
    </>
  );
};

export default AgriStats;
