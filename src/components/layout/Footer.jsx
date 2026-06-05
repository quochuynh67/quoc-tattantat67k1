import React from "react";
import { Link } from "react-router-dom";
import FooterStats from "./FooterStats";

const Footer = () => (
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
        <Link to="/news" style={{ marginRight: "1rem" }}>Tin tức</Link>
        <Link to="/places" style={{ marginRight: "1rem" }}>Địa điểm</Link>
        <Link to="/food" style={{ marginRight: "1rem" }}>Ẩm thực</Link>
        <Link to="/beauty-health" style={{ marginRight: "1rem" }}>Làm đẹp</Link>
        <Link to="/agriculture" style={{ marginRight: "1rem" }}>Nông nghiệp</Link>
        <Link to="/health" style={{ marginRight: "1rem" }}>Sức khỏe</Link>
        <Link to="/search">Tìm kiếm</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
