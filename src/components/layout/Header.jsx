// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";
import { TOOL_SECTIONS, openTool } from "../../lib/tools";
import logo67k1 from "../../assets/logo-67k1.jpg";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toolsRef = useRef(null);
  const { showOtherTab, visibleSectionSlugs } = useSiteSettings();
  const navigate = useNavigate();

  const handleToolClick = (url) => {
    setToolsOpen(false);
    setMobileMenuOpen(false);
    openTool(url, navigate);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setToolsOpen(false);
    };
    if (toolsOpen) document.addEventListener("mousedown", handleClickOutside);
    if (toolsOpen) document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [toolsOpen]);

  return (
    <header className="site-header">
      <div className="header container">
      <NavLink to="/" className="brand" onClick={closeMobileMenu} aria-label="Về trang chủ">
        <span className="brand-mark" aria-hidden="true">
          <img src={logo67k1} alt="" />
        </span>
        <span className="brand-copy">
          <strong>Tất tần tật Phú Tân</strong>
          <small>An Giang · 67K1</small>
        </span>
      </NavLink>
      <button className="mobile-menu-button" onClick={() => setMobileMenuOpen((value) => !value)} aria-expanded={mobileMenuOpen} aria-label="Mở menu">
        <span /> <span /> <span />
      </button>
      <nav className={`nav ${mobileMenuOpen ? "is-open" : ""}`}>
        <NavLink to="/" end onClick={closeMobileMenu} className={({ isActive }) => (isActive ? "active" : "")}>Trang chủ</NavLink>
        <NavLink to="/phu-tan-hom-nay" onClick={closeMobileMenu} aria-label="Phú Tân hôm nay" title="Phú Tân hôm nay" className={({ isActive }) => (isActive ? "active" : "")}>☀️</NavLink>
        {SECTION_NAV.filter((s) => !visibleSectionSlugs || visibleSectionSlugs.has(s.slug)).map((s) => (
          <NavLink key={s.slug} to={s.to} onClick={closeMobileMenu} className={({ isActive }) => (isActive ? "active" : "")}>
            {s.label}
          </NavLink>
        ))}

        {/* Other Menu */}
        {showOtherTab && (
          <div ref={toolsRef} className="tools-menu-wrap">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className={`tools-trigger ${toolsOpen ? "active" : ""}`}
              aria-expanded={toolsOpen}
              aria-haspopup="dialog"
            >
              <span>Tiện ích</span>
            </button>
            {toolsOpen && (
              <>
                <div className="tools-backdrop" onClick={() => setToolsOpen(false)} />
                <div className="tools-popover" role="dialog" aria-label="Kho tiện ích">
                  <div className="tools-popover-head">
                    <div><strong>Kho tiện ích</strong><small>Công cụ hữu ích cho bà con</small></div>
                    <button onClick={() => setToolsOpen(false)} aria-label="Đóng kho tiện ích">✕</button>
                  </div>
                  <div className="tools-groups">
                {TOOL_SECTIONS.map((group) => (
                  <section key={group.section} className="tools-group">
                    <h3>{group.section}</h3>
                    <div className="tools-list">
                      {group.tools.map((tool) => {
                        const comingSoon = !tool.url || tool.url === "#";
                        return (
                          <button
                            key={tool.id}
                            onClick={() => handleToolClick(tool.url)}
                            disabled={comingSoon}
                            className="tool-item"
                          >
                            <span className="tool-item-icon" style={{ background: tool.gradient }}>
                              {tool.icon}
                            </span>
                            <span className="tool-item-copy">
                              <strong>{tool.label}</strong>
                              <small>
                                {comingSoon ? "Sắp ra mắt" : tool.tagline}
                              </small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
      <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
