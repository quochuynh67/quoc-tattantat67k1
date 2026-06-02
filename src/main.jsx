// src/main.jsx – React entry point
import React from "react";
import "./styles/global.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import muiTheme from "./theme/muiTheme";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container '#root' not found in index.html");
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <App />
    </MuiThemeProvider>
  </React.StrictMode>
);
