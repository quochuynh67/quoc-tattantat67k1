// src/components/layout/Header.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";

const Header = () => {
  return (
    <header className="header container">
      <div className="logo" style={{ display: "flex", alignItems: "center" }}>
        <span style={{ marginLeft: 8, fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-primary)" }}>
          Tất tần tất – Phú Tân
        </span>
      </div>
      <nav className="nav" style={{ display: "flex", gap: "var(--spacing-md)" }}>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Trang chủ</NavLink>
        <NavLink to="/news" className={({ isActive }) => (isActive ? "active" : "")}>Tin tức</NavLink>
        <NavLink to="/places" className={({ isActive }) => (isActive ? "active" : "")}>Địa điểm</NavLink>
        <NavLink to="/food" className={({ isActive }) => (isActive ? "active" : "")}>Ẩm thực</NavLink>
        <NavLink to="/beauty-health" className={({ isActive }) => (isActive ? "active" : "")}>Làm đẹp</NavLink>
        <NavLink to="/agriculture" className={({ isActive }) => (isActive ? "active" : "")}>Nông nghiệp</NavLink>
        <NavLink to="/health" className={({ isActive }) => (isActive ? "active" : "")}>Sức khỏe</NavLink>
      </nav>
      <ThemeToggle />
    </header>
  );
};

export default Header;
