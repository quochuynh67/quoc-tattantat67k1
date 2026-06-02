// src/components/ui/ThemeToggle.jsx – simple toggle button
import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useTheme } from "../../hooks/useTheme";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối";

  return (
    <Tooltip title={label}>
      <IconButton
        className="theme-toggle-button"
        onClick={toggleTheme}
        aria-label={label}
        size="small"
      >
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
