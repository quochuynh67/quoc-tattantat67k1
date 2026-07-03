import React from "react";
import { Link } from "react-router-dom";
import FooterStats from "./FooterStats";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";

const SECTION_NAV = [
  { slug: "news",         to: "/news",          label: "Tin tức" },
  { slug: "places",       to: "/places",         label: "Địa điểm" },
  { slug: "food",         to: "/food",           label: "Ẩm thực" },
  { slug: "beautyHealth", to: "/beauty-health",  label: "Làm đẹp" },
  { slug: "agriculture",  to: "/agriculture",    label: "Nông nghiệp" },
  { slug: "health",       to: "/health",         label: "Sức khỏe" },
];

const Footer = () => {
  const { visibleSectionSlugs } = useSiteSettings();

  return (
    <footer style={{ background: "var(--color-surface)" }}>
      <FooterStats />

      <div
        style={{
          padding: "var(--spacing-lg)",
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <Link
            to="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              color: "var(--color-primary)",
              display: "block",
            }}
          >
            Tất tần tật – Phú Tân 67K1
          </Link>
          <span style={{ fontSize: "0.75rem", color: "var(--color-subtle)", display: "block", marginTop: "2px" }}>
            Cổng thông tin địa phương Phú Tân 67K1 (An Giang)
          </span>
        </div>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "4px 0" }}>
          <Link to="/" style={{ marginRight: "1rem" }}>Trang chủ</Link>
          {SECTION_NAV
            .filter((s) => !visibleSectionSlugs || visibleSectionSlugs.has(s.slug))
            .map((s) => (
              <Link key={s.slug} to={s.to} style={{ marginRight: "1rem" }}>{s.label}</Link>
            ))}
          <Link to="/wishes" style={{ marginRight: "1rem" }}>✨ Tạo lời chúc</Link>
          <Link to="/menu"   style={{ marginRight: "1rem" }}>🍽️ Tạo thực đơn</Link>
          <Link to="/photo-restore" style={{ marginRight: "1rem" }}>🖼️ Phục dựng ảnh cũ</Link>
          <Link to="/search">Tìm kiếm</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
