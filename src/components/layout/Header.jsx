// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mui/material";
import ThemeToggle from "../ui/ThemeToggle";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";
import { TOOL_SECTIONS, openTool } from "../../lib/tools";

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
  const isMobile = useMediaQuery("(max-width: 768px)");

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
              <>
                {/* Backdrop on mobile */}
                {isMobile && (
                  <div
                    onClick={() => setToolsOpen(false)}
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(4px)",
                      zIndex: 9998,
                    }}
                  />
                )}
                <div
                  style={{
                    position: isMobile ? "fixed" : "absolute",
                    top: isMobile ? "70px" : "100%",
                    right: isMobile ? "16px" : 0,
                    left: isMobile ? "16px" : "auto",
                    margin: isMobile ? "0 auto" : "0",
                    maxWidth: isMobile ? "440px" : "640px",
                    width: isMobile ? "auto" : "640px",
                    maxHeight: isMobile ? "80vh" : "none",
                    overflowY: isMobile ? "auto" : "visible",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "16px",
                    boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
                    marginTop: isMobile ? 0 : "10px",
                    zIndex: isMobile ? 9999 : 1000,
                    padding: isMobile ? "16px" : "20px",
                  }}
                >
                  {/* Mobile header bar */}
                  {isMobile && (
                    <div
                      style={{
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        paddingBottom: "10px",
                        marginBottom: "12px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-text)" }}>
                        ⚙️ Kho tiện ích
                      </span>
                      <button
                        onClick={() => setToolsOpen(false)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          color: "var(--color-text-subtle)",
                          padding: "2px 8px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "16px" : "20px" }}>
                {TOOL_SECTIONS.map((group) => (
                  <div key={group.section} style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--color-text-subtle)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "10px",
                        paddingBottom: "6px",
                        borderBottom: "2px solid var(--color-border)",
                      }}
                    >
                      {group.section}
                    </div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      {group.tools.map((tool) => {
                        const comingSoon = !tool.url || tool.url === "#";
                        return (
                          <button
                            key={tool.id}
                            onClick={() => handleToolClick(tool.url)}
                            disabled={comingSoon}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              width: "100%",
                              padding: "10px 12px",
                              background: "var(--color-background)",
                              border: "1px solid transparent",
                              borderRadius: "10px",
                              color: "var(--color-text)",
                              cursor: comingSoon ? "default" : "pointer",
                              textAlign: "left",
                              transition: "all 0.2s ease",
                              opacity: comingSoon ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!comingSoon) {
                                e.currentTarget.style.borderColor = "var(--color-primary)";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "transparent";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.transform = "none";
                            }}
                          >
                            <span
                              style={{
                                fontSize: "1.6rem",
                                width: "40px",
                                height: "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "10px",
                                background: tool.gradient,
                                flexShrink: 0,
                              }}
                            >
                              {tool.icon}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.3 }}>
                                {tool.label}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--color-text-subtle)",
                                  lineHeight: 1.3,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {comingSoon ? "Sắp ra mắt" : tool.tagline}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
      <ThemeToggle />
    </header>
  );
};

export default Header;
