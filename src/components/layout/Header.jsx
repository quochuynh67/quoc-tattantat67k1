// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";
import { TOOLS, openTool } from "../../lib/tools";

// Map from slug → { to, label } for nav rendering
const SECTION_NAV = [
  { slug: "news", to: "/news", label: "Tin tức" },
  { slug: "places", to: "/places", label: "Địa điểm" },
  { slug: "food", to: "/food", label: "Ẩm thực" },
  { slug: "beautyHealth", to: "/beauty-health", label: "Làm đẹp" },
  { slug: "agriculture", to: "/agriculture", label: "Nông nghiệp" },
  { slug: "health", to: "/health", label: "Sức khỏe" },
];

const Header = () => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef(null);
  const { showOtherTab, visibleSectionSlugs } = useSiteSettings();
  const navigate = useNavigate();

  const handleToolClick = (url) => {
    setToolsOpen(false);
    openTool(url, navigate);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    if (toolsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [toolsOpen]);

  return (
    <header className="header container">
      <div className="logo" style={{ display: "flex", alignItems: "center" }}>
        <span style={{ marginLeft: 8, fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-primary)" }}>
          Tất tần tật – Phú Tân 67K1
        </span>
      </div>
      <nav className="nav" style={{ display: "flex", gap: "var(--spacing-md)", alignItems: "center" }}>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Trang chủ</NavLink>
        {SECTION_NAV.filter((s) => !visibleSectionSlugs || visibleSectionSlugs.has(s.slug)).map((s) => (
          <NavLink key={s.slug} to={s.to} className={({ isActive }) => (isActive ? "active" : "")}>
            {s.label}
          </NavLink>
        ))}

        {/* Other Menu */}
        {showOtherTab && (
          <div ref={toolsRef} style={{ position: "relative" }}>
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "inherit",
                fontWeight: "inherit",
                padding: "0",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
              className={toolsOpen ? "active" : ""}
            >
              <span>⚙️</span>
              <span>Tiện ích</span>
            </button>
            {toolsOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  minWidth: "150px",
                  marginTop: "8px",
                  zIndex: 1000,
                }}
              >
                {TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.url)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      color: "var(--color-text)",
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      textAlign: "left",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "var(--color-background)"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  >
                    <span>{tool.icon}</span>
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
      <ThemeToggle />
    </header>
  );
};

export default Header;
