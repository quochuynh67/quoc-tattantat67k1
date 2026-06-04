import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, IconButton, InputBase, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import { getSiteSetting } from "../lib/phuTanApi";
import { callAgent, DEFAULT_AGENTS } from "../lib/agentApi";

const Avatar = ({ name, color, size = 36 }) => (
  <Box sx={{
    width: size, height: size, borderRadius: "50%",
    background: color, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.38, fontWeight: 900, color: "#fff",
    boxShadow: `0 2px 8px ${color}55`,
  }}>
    {name?.[0] ?? "U"}
  </Box>
);

const TypingDots = () => (
  <Box sx={{ display: "flex", gap: "5px", alignItems: "center", px: 1.5, py: 1 }}>
    {[0, 1, 2].map((i) => (
      <Box key={i} sx={{
        width: 7, height: 7, borderRadius: "50%", background: "rgba(0,0,0,0.25)",
        animation: "agent-dot 1.2s ease-in-out infinite",
        animationDelay: `${i * 0.2}s`,
        "@keyframes agent-dot": {
          "0%,80%,100%": { transform: "scale(0.8)", opacity: 0.4 },
          "40%": { transform: "scale(1.15)", opacity: 1 },
        },
      }} />
    ))}
  </Box>
);

// Global mutex: close previous panel when new one opens
let _closePrev = null;

export default function AgentChat({ section, variant = "float" }) {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!section) return;
    getSiteSetting(`agent_${section}`).then((config) => {
      const def = DEFAULT_AGENTS[section] ?? DEFAULT_AGENTS.news;
      const resolved = config ? { ...def, ...config } : def;
      setAgent(resolved);
      setMessages([{ role: "assistant", content: resolved.greeting }]);
    });
  }, [section]);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleOpen = () => {
    if (_closePrev) _closePrev();
    _closePrev = () => setOpen(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    _closePrev = null;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !agent) return;
    const userMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await callAgent(next, section, agent);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      let errorMsg = "Hỏng kết nối được rồi cưng ơi, thử lại sau nha~";
      if (err instanceof Error) {
        const msgMatch = err.message?.match(/\[ERROR_(\d+)\]/);
        const errorCode = msgMatch ? parseInt(msgMatch[1]) : null;
        if (errorCode === 429) {
          errorMsg = "🚫 API hết quota rồi cưng ơi, hãy chờ hoặc nâng cấp plan để tiếp tục nhé~";
        } else if (errorCode === 401) {
          errorMsg = "❌ API key không hợp lệ, liên hệ admin để kiểm tra nha~";
        } else if (errorCode === 403) {
          errorMsg = "🔒 Không có quyền sử dụng API này cưng, xin lỗi nha~";
        } else if (err.message) {
          errorMsg = err.message.replace(/^\[ERROR_\d+\]\s*/, "");
        }
      }
      setMessages((m) => [...m, { role: "assistant", content: errorMsg }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (!agent) return null;

  const panel = (
    <Box
      ref={panelRef}
      sx={{
        position: "fixed",
        bottom: variant === "float" ? 96 : 24,
        right: 24,
        zIndex: 1400,
        width: { xs: "calc(100vw - 32px)", sm: 350 },
        height: { xs: "calc(100vh - 120px)", sm: "560px" },
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        background: "#fff",
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, background: agent.color, color: "#fff" }}>
        <Avatar name={agent.name} color="rgba(255,255,255,0.25)" size={34} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography color="inherit" sx={{ fontWeight: 800, fontSize: "0.92rem", lineHeight: 1.2 }}>{agent.name}</Typography>
          <Typography color="inherit" sx={{ fontSize: "0.72rem", opacity: 0.85 }}>Trợ lý Phú Tân · Đang online</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: "#fff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <Box key={i} sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 1 }}>
              {!isUser && <Avatar name={agent.name} color={agent.color} size={28} />}
              <Paper elevation={0} sx={{
                px: 1.5, py: 1,
                maxWidth: "78%",
                borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isUser ? agent.color : "#f3f4f6",
                color: isUser ? "#fff" : "#1a1a1a",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}>
                {msg.content}
              </Paper>
            </Box>
          );
        })}
        {loading && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Avatar name={agent.name} color={agent.color} size={28} />
            <Paper elevation={0} sx={{ borderRadius: "16px 16px 16px 4px", background: "#f3f4f6" }}>
              <TypingDots />
            </Paper>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
        <InputBase
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={3}
          placeholder="Nhập câu hỏi..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          sx={{ fontSize: "0.875rem", px: 1.5, py: 0.75, background: "#fff", borderRadius: 3, border: "1px solid #e0e0e0", flex: 1 }}
        />
        <IconButton
          onClick={send}
          disabled={!input.trim() || loading}
          sx={{
            background: agent.color, color: "#fff", width: 38, height: 38,
            "&:hover": { background: agent.color, opacity: 0.88 },
            "&.Mui-disabled": { background: "#e0e0e0", color: "#bbb" },
          }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Box>
    </Box>
  );

  // ── Inline variant — delegates to AgentChatDashboard via custom event ─────
  if (variant === "inline") {
    const dispatch = () =>
      window.dispatchEvent(new CustomEvent("phutan:open-agent", { detail: { section } }));
    return (
      <Box
        onClick={dispatch}
        sx={{
          display: "inline-flex", alignItems: "center",
          px: 1.2, py: 0.5,
          border: `1.5px solid ${agent.color}`,
          borderRadius: "999px",
          cursor: "pointer",
          background: `${agent.color}18`,
          color: agent.color,
          transition: "background 0.2s, color 0.2s",
          "&:hover": {
            background: agent.color, color: "#fff",
            "& .agent-inline-text": { color: "#fff !important" }
          },
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <Typography
          className="agent-inline-text"
          sx={{ fontSize: "0.76rem", fontWeight: 700, lineHeight: 1, color: `${agent.color} !important` }}
        >
          Chat với {agent.name} {agent.emoji}
        </Typography>
      </Box>
    );
  }

  // ── Float variant (FAB) ────────────────────────────────────────────────────
  return (
    <>
      {panel}
      <Box
        ref={triggerRef}
        onClick={handleOpen}
        sx={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1400,
          display: "flex", alignItems: "center", gap: 1.2,
          px: 1.5, py: 1,
          borderRadius: "999px",
          background: agent.color,
          color: "#fff",
          cursor: "pointer",
          boxShadow: `0 4px 20px ${agent.color}77`,
          userSelect: "none",
          transition: "transform 0.2s, box-shadow 0.2s",
          animation: open ? "none" : "agent-fab-bounce 2.5s ease-in-out infinite",
          "@keyframes agent-fab-bounce": {
            "0%,100%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-5px)" },
          },
          "&:hover": { transform: "translateY(-2px)", boxShadow: `0 6px 24px ${agent.color}99` },
          "&:active": { transform: "scale(0.96)" },
        }}
      >
        <Avatar name={agent.name} color="rgba(255,255,255,0.22)" size={32} />
        <Box sx={{ mr: 0.5 }}>
          <Typography color="inherit" sx={{ fontWeight: 800, fontSize: "0.82rem", lineHeight: 1.1 }}>{agent.name}</Typography>
          <Typography color="inherit" sx={{ fontSize: "0.68rem", opacity: 0.88 }}>Hỏi mình nha cưng~</Typography>
        </Box>
      </Box>
    </>
  );
}
