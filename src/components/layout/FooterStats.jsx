import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getSections,
  getPostsBySection,
  getVlogs,
  getVisitorCount,
  incrementVisitorCount,
} from "../../lib/supabaseClient";

const fmt = (n) =>
  n >= 1000
    ? new Intl.NumberFormat("vi-VN").format(n)
    : String(n);

const CARDS = [
  {
    key: "visitors",
    label: "Lượt truy cập",
    icon: "👥",
    gradient: "linear-gradient(135deg,#1e3a5f,#2563eb)",
    shadow: "rgba(37,99,235,0.32)",
    badge: "Cộng đồng",
    badgeColor: "#dbeafe",
    badgeText: "#1e40af",
  },
  {
    key: "vlogs",
    label: "Video đã đăng",
    icon: "🎬",
    gradient: "linear-gradient(135deg,#4c1d95,#7c3aed)",
    shadow: "rgba(124,58,237,0.32)",
    badge: "Khám phá",
    badgeColor: "#ede9fe",
    badgeText: "#4c1d95",
  },
  {
    key: "posts",
    label: "Bài viết",
    icon: "📝",
    gradient: "linear-gradient(135deg,#78350f,#d97706)",
    shadow: "rgba(217,119,6,0.32)",
    badge: "Thông tin",
    badgeColor: "#fef3c7",
    badgeText: "#78350f",
  },
  {
    key: "sections",
    label: "Chuyên mục",
    icon: "📂",
    gradient: "linear-gradient(135deg,#064e3b,#059669)",
    shadow: "rgba(5,150,105,0.32)",
    badge: "Danh mục",
    badgeColor: "#d1fae5",
    badgeText: "#064e3b",
  },
];

export default function FooterStats() {
  const location = useLocation();
  const [stats, setStats] = useState({ visitors: null, vlogs: null, posts: null, sections: null });

  if (location.pathname.startsWith("/admin")) return null;

  useEffect(() => {
    const alreadyCounted = sessionStorage.getItem("_phuTanVisited");

    const fetchStats = async () => {
      try {
        const [sections, posts, vlogs, visitors] = await Promise.all([
          getSections(),
          getPostsBySection(""),
          getVlogs(),
          alreadyCounted ? getVisitorCount() : incrementVisitorCount(),
        ]);

        if (!alreadyCounted) sessionStorage.setItem("_phuTanVisited", "1");

        setStats({
          visitors,
          vlogs: (vlogs || []).filter((v) => v.is_published).length,
          posts: (posts || []).filter((p) => p.is_published !== false).length,
          sections: (sections || []).length,
        });
      } catch {
        // silently ignore – stats are non-critical
      }
    };

    fetchStats();
  }, []);

  return (
    <div style={styles.wrapper} className="footer-stats-wrapper">
      <div style={styles.inner}>
        {/* heading */}
        <div style={styles.heading}>
          <span style={styles.headingLine} />
          <span style={styles.headingText}>Thống kê website</span>
          <span style={styles.headingLine} />
        </div>

        {/* cards */}
        <div style={styles.grid} className="footer-stats-grid">
          {CARDS.map((card) => {
            const value = stats[card.key];
            return (
              <div
                key={card.key}
                className="footer-stats-card"
                style={{
                  ...styles.card,
                  boxShadow: `0 8px 28px ${card.shadow}`,
                  background: card.gradient,
                }}
              >
                <div style={styles.cardTop}>
                  <span style={styles.icon}>{card.icon}</span>
                  <span style={{ ...styles.badge, background: card.badgeColor, color: card.badgeText }}>
                    {card.badge}
                  </span>
                </div>
                <div style={styles.value}>
                  {value === null ? (
                    <span style={styles.skeleton} />
                  ) : (
                    fmt(value)
                  )}
                </div>
                <div style={styles.cardLabel}>{card.label}</div>
              </div>
            );
          })}
        </div>

        <p style={styles.sub}>
          Cập nhật theo thời gian thực · Tất tần tật Phú Tân 67K1
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        @media (max-width: 600px) {
          .footer-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        .footer-stats-card:hover {
          transform: translateY(-3px);
        }
        html.dark .footer-stats-wrapper {
          border-top-color: rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    background: "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.06) 100%)",
    borderTop: "1px solid rgba(0,0,0,0.08)",
    padding: "32px var(--spacing-lg) 0",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heading: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  headingLine: {
    flex: 1,
    height: "1px",
    background: "rgba(0,0,0,0.1)",
  },
  headingText: {
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-subtle)",
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "14px",
  },
  card: {
    borderRadius: "14px",
    padding: "18px 16px 16px",
    color: "#fff",
    transition: "transform 0.18s ease",
    cursor: "default",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  icon: {
    fontSize: "1.5rem",
    lineHeight: 1,
  },
  badge: {
    fontSize: "0.62rem",
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: "99px",
    letterSpacing: "0.04em",
  },
  value: {
    fontSize: "2rem",
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: "6px",
    letterSpacing: "-1px",
    minHeight: "2rem",
    display: "flex",
    alignItems: "center",
  },
  skeleton: {
    display: "inline-block",
    width: "60px",
    height: "28px",
    borderRadius: "6px",
    background: "linear-gradient(90deg,rgba(255,255,255,0.15) 25%,rgba(255,255,255,0.3) 50%,rgba(255,255,255,0.15) 75%)",
    backgroundSize: "200px 100%",
    animation: "shimmer 1.4s infinite linear",
  },
  cardLabel: {
    fontSize: "0.78rem",
    fontWeight: 600,
    opacity: 0.82,
  },
  sub: {
    textAlign: "center",
    fontSize: "0.72rem",
    color: "var(--color-subtle)",
    margin: "16px 0 0",
    paddingBottom: "0",
    opacity: 0.75,
  },
};
