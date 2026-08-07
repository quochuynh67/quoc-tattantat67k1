// src/lib/tools.js – danh sách tiện ích theo nhóm (section), dùng chung cho Header dropdown và ToolsSection (trang chủ)

export const TOOL_SECTIONS = [
  {
    section: "🎨 Sáng tạo",
    tools: [
      {
        id: "newspaper",
        label: "Xuất bản báo riêng",
        icon: "📰",
        url: "/newspaper",
        tagline: "Tạo trang báo của bạn",
        gradient: "linear-gradient(135deg, #304352 0%, #d7d2cc 100%)",
      },
      {
        id: "wish",
        label: "Tạo văn lời chúc hay",
        icon: "🎉",
        url: "/wishes",
        tagline: "Lời chúc bằng AI",
        gradient: "linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)",
      },
      {
        id: "menu",
        label: "Tạo menu thực đơn",
        icon: "🍽️",
        url: "/menu",
        tagline: "Thiết kế thực đơn đẹp",
        gradient: "linear-gradient(135deg, #EB5757 0%, #F2994A 100%)",
      },
      {
        id: "restore",
        label: "Phục dựng ảnh cũ",
        icon: "🖼️",
        url: "/photo-restore",
        tagline: "Khôi phục ảnh xưa",
        gradient: "linear-gradient(135deg, #2193B0 0%, #6DD5ED 100%)",
      },
      {
        id: "galaxy",
        label: "Vũ trụ ký ức",
        icon: "🌌",
        url: "/galaxy",
        tagline: "Không gian 3D lãng mạn",
        gradient: "linear-gradient(135deg, #020111 0%, #3a007c 100%)",
      },
    ],
  },
  {
    section: "🌾 Nông nghiệp",
    tools: [
      {
        id: "trade",
        label: "Mua bán rau cải",
        icon: "🌿",
        url: "/trading",
        tagline: "Chợ nông sản online",
        gradient: "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)",
      },
      {
        id: "agristats",
        label: "Biến động nông thuỷ sản",
        icon: "📈",
        url: "/agri-stats",
        tagline: "Giá & sản lượng theo mùa",
        gradient: "linear-gradient(135deg, #0F2027 0%, #2C5364 100%)",
      },
      {
        id: "scale",
        label: "Tính toán cân lúa",
        icon: "🧮",
        url: "#",
        tagline: "Sắp ra mắt",
        gradient: "linear-gradient(135deg, #757F9A 0%, #D7DDE8 100%)",
      },
    ],
  },
  {
    section: "🎮 Giải trí",
    tools: [
      {
        id: "relax",
        label: "Relax",
        icon: "🧘",
        url: "https://quoc-research-retrogame.web.app/?feature=vlog",
        tagline: "Thư giãn cùng vlog",
        gradient: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
      },
      {
        id: "retro",
        label: "Chơi game thùng",
        icon: "🕹️",
        url: "https://quoc-research-retrogame.web.app/?feature=retro",
        tagline: "Game điện tử tuổi thơ",
        gradient: "linear-gradient(135deg, #F953C6 0%, #B91D73 100%)",
      },
      {
        id: "fnbgames",
        label: "Game Tích Điểm F&B",
        icon: "🎮",
        url: "/fnb-games",
        tagline: "Chơi game – nhận ưu đãi",
        gradient: "linear-gradient(135deg, #f7971e 0%, #f953c6 50%, #6a11cb 100%)",
      },
    ],
  },
];

// Flat list for carousel and backward-compatible consumers
export const TOOLS = TOOL_SECTIONS.flatMap((s) => s.tools);

// Điều hướng tiện ích — dùng chung: route nội bộ qua navigate, link ngoài qua window.open
// (window.open bị block trong webview/iframe → fallback về location.href)
export function openTool(url, navigate) {
  if (!url || url === "#") return;
  if (url.startsWith("/")) {
    navigate(url);
  } else {
    const popup = window.open(url, "_blank");
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      window.location.href = url;
    }
  }
}
