// src/pages/NotFound.jsx – simple 404 page
import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div style={{ textAlign: "center", padding: "var(--spacing-xxl)" }}>
    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem" }}>404 – Không tìm thấy</h1>
    <p style={{ fontFamily: "var(--font-body)", fontSize: "1.2rem" }}>
      Trang bạn đang tìm không tồn tại. <Link to="/" style={{ color: "var(--color-primary)" }}>Quay lại trang chủ</Link>
    </p>
  </div>
);

export default NotFound;
