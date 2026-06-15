import React, { useEffect, useRef, useState } from "react";
import { Box, CircularProgress, IconButton, InputBase, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { getSiteSetting } from "../lib/phuTanApi";
import { callAgent, DEFAULT_AGENTS } from "../lib/agentApi";

const SECTIONS = [
  { key: "news", label: "Tin tức" },
  { key: "places", label: "Địa điểm" },
  { key: "food", label: "Ẩm thực" },
  { key: "beautyHealth", label: "Làm đẹp" },
  { key: "agriculture", label: "Nông nghiệp" },
  { key: "health", label: "Sức khỏe" },
];

const Avatar = ({ name, color, size = 32 }) => (
  <Box sx={{
    width: size, height: size, borderRadius: "50%",
    background: color, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.38, fontWeight: 900, color: "#fff",
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

export default function AgentChatDashboard() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [agent, setAgent] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const rootRef = useRef(null);

  // Load agent config when section is selected
  useEffect(() => {
    if (!selectedSection) return;
    getSiteSetting(`agent_${selectedSection}`).then((config) => {
      const def = DEFAULT_AGENTS[selectedSection];
      const resolved = config ? { ...def, ...config } : def;
      setAgent(resolved);
      setMessages([{ role: "assistant", content: resolved.greeting }]);
    });
  }, [selectedSection]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Click-outside closes picker
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  // Listen for inline section buttons dispatching 'phutan:open-agent'
  const selectAgentRef = useRef(null);
  useEffect(() => {
    selectAgentRef.current = selectAgent;
  });
  useEffect(() => {
    const handler = (e) => selectAgentRef.current?.(e.detail.section);
    window.addEventListener("phutan:open-agent", handler);
    return () => window.removeEventListener("phutan:open-agent", handler);
  }, []);

  const selectAgent = (sectionKey) => {
    if (sectionKey === selectedSection) {
      // same agent — just open chat
      setChatOpen(true);
      setPickerOpen(false);
      return;
    }
    setSelectedSection(sectionKey);
    setAgent(null);
    setChatOpen(true);
    setPickerOpen(false);
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
      const reply = await callAgent(next, selectedSection, agent);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      const errorMsg = err instanceof Error && err.message
        ? err.message.replace(/^\[ERROR_\d+\]\s*/, "")
        : "Hỏng kết nối được rồi cưng ơi, thử lại sau nha~";
      setMessages((m) => [...m, { role: "assistant", content: errorMsg }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const fabColor = agent?.color ?? "#333";

  return (
    <Box ref={rootRef} sx={{ position: "fixed", bottom: 24, left: 24, zIndex: 1400 }}>

      {/* Agent picker popup */}
      <Box sx={{
        position: "absolute", bottom: "calc(100% + 12px)", left: 0,
        width: 220,
        background: "#fff",
        borderRadius: 3,
        boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
        overflow: "hidden",
        pointerEvents: pickerOpen ? "auto" : "none",
        opacity: pickerOpen ? 1 : 0,
        transform: pickerOpen ? "translateY(0) scale(1)" : "translateY(10px) scale(0.96)",
        transition: "opacity 0.22s ease, transform 0.22s ease",
        transformOrigin: "bottom left",
      }}>
        <Box sx={{ px: 2, py: 1.2, borderBottom: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Chọn cán bộ địa phương =))
          </Typography>
        </Box>
        {SECTIONS.map(({ key, label }) => {
          const def = DEFAULT_AGENTS[key];
          const isActive = key === selectedSection;
          return (
            <Box
              key={key}
              onClick={() => selectAgent(key)}
              sx={{
                display: "flex", alignItems: "center", gap: 1.5,
                px: 2, py: 1.2,
                cursor: "pointer",
                background: isActive ? `${def.color}15` : "transparent",
                borderLeft: isActive ? `3px solid ${def.color}` : "3px solid transparent",
                transition: "background 0.15s",
                "&:hover": { background: `${def.color}10` },
              }}
            >
              <Avatar name={def.name} color={def.color} size={30} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.2, color: "text.primary" }}>
                  {def.name}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", lineHeight: 1 }}>
                  {label}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Chat panel */}
      <Box sx={{
        position: "absolute", bottom: "calc(100% + 12px)", left: 0,
        width: { xs: "calc(100vw - 32px)", sm: 350 },
        height: "560px",
        display: chatOpen && agent ? "flex" : "none",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        background: "#fff",
        opacity: chatOpen && agent ? 1 : 0,
        transform: chatOpen && agent ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.25s, transform 0.25s",
        pointerEvents: chatOpen && agent ? "auto" : "none",
      }}>
        {/* Panel header */}
        {agent && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, background: agent.color }}>
            <Avatar name={agent.name} color="rgba(255,255,255,0.25)" size={34} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography color="inherit" sx={{ fontWeight: 800, fontSize: "0.92rem", lineHeight: 1.2 }}>{agent.name}</Typography>
              <Typography color="inherit" sx={{ fontSize: "0.72rem", opacity: 0.85 }}>Trợ lý Phú Tân · Đang online</Typography>
            </Box>
            <IconButton size="small" onClick={() => { setChatOpen(false); setPickerOpen(true); }} sx={{ color: "#fff" }} title="Đổi trợ lý">
              <SwapHorizIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setChatOpen(false)} sx={{ color: "#fff" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Loading agent */}
        {!agent && chatOpen && (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {/* Messages */}
        {agent && (
          <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <Box key={i} sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 1 }}>
                  {!isUser && <Avatar name={agent.name} color={agent.color} size={28} />}
                  <Paper elevation={0} sx={{
                    px: 1.5, py: 1, maxWidth: "78%",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isUser ? agent.color : "#f3f4f6",
                    color: isUser ? "#fff" : "#1a1a1a",
                    fontSize: "0.875rem", lineHeight: 1.5, wordBreak: "break-word",
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
        )}

        {/* Input */}
        {agent && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
            <IconButton onClick={send} disabled={!input.trim() || loading}
              sx={{
                background: agent.color, color: "#fff", width: 38, height: 38,
                "&:hover": { background: agent.color, opacity: 0.88 },
                "&.Mui-disabled": { background: "#e0e0e0", color: "#bbb" },
              }}>
              {loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
            </IconButton>
            <InputBase
              inputRef={inputRef}
              fullWidth multiline maxRows={3}
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              sx={{ fontSize: "0.875rem", px: 1.5, py: 0.75, background: "#fff", borderRadius: 3, border: "1px solid #e0e0e0", flex: 1 }}
            />
          </Box>
        )}
      </Box>

      {/* FAB */}
      <Box
        onClick={() => {
          if (chatOpen) { setChatOpen(false); return; }
          setPickerOpen((v) => !v);
        }}
        sx={{
          display: "flex", alignItems: "center", gap: 1.2,
          px: 1.6, py: 1,
          borderRadius: "999px",
          background: fabColor,
          color: "#fff",
          cursor: "pointer",
          boxShadow: `0 4px 20px ${fabColor}77`,
          userSelect: "none",
          transition: "transform 0.2s, box-shadow 0.2s, background 0.3s",
          animation: (!pickerOpen && !chatOpen) ? "dash-fab-bounce 2.8s ease-in-out infinite" : "none",
          "@keyframes dash-fab-bounce": {
            "0%,100%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-5px)" },
          },
          "&:hover": { transform: "translateY(-2px)", boxShadow: `0 6px 24px ${fabColor}99` },
          "&:active": { transform: "scale(0.96)" },
        }}
      >
        {agent ? (
          <>
            <Avatar name={agent.name} color="rgba(255,255,255,0.22)" size={30} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", lineHeight: 1.1, color: "#fff !important" }}>
                Chat với {agent.name}
              </Typography>
              <Typography sx={{ fontSize: "0.66rem", opacity: 0.88, color: "#fff !important" }}>
                {chatOpen ? "Đang chat" : "Hỏi mình nha~"}
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <SmartToyIcon sx={{ fontSize: 22, color: "#fff" }} />
            <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: "#fff !important" }}>
              Chat với nông dân địa phương
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}
