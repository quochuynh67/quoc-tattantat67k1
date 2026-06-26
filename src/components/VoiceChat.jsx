import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, IconButton, Typography, Paper } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import CloseIcon from "@mui/icons-material/Close";
import { Conversation } from "@elevenlabs/client";

const CHARACTERS = {
  anhPhu: {
    name: "Anh Phú",
    agentId: import.meta.env.VITE_ELEVENLABS_ANH_PHU_AGENT_ID,
    color: "#1565c0",
    emoji: "👨‍🌾",
    tagline: "Hỏi Anh Phú về Phú Tân nha~",
  },
  chiTan: {
    name: "Chị Tân",
    agentId: import.meta.env.VITE_ELEVENLABS_CHI_TAN_AGENT_ID,
    color: "#c2185b",
    emoji: "👩‍💼",
    tagline: "Chị Tân ở đây, cưng hỏi gì nha~",
  },
};

const STATUS_LABEL = {
  disconnected: "Nhấn mic để bắt đầu",
  connecting: "Đang kết nối...",
  connected: "Đang nghe...",
  disconnecting: "Đang ngắt kết nối...",
};

function VoiceOrb({ color, volume, mode, status }) {
  const active = status === "connected";
  const isSpeaking = mode === "speaking";
  const scale = active ? 1 + volume * 0.6 : 1;

  return (
    <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", my: 2 }}>
      {/* Ripple rings */}
      {active && [1, 2, 3].map((i) => (
        <Box key={i} sx={{
          position: "absolute",
          width: 80 + i * 24,
          height: 80 + i * 24,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          opacity: isSpeaking ? 0.35 / i : 0.12 / i,
          animation: `voice-ripple-${i} ${1.2 + i * 0.3}s ease-out infinite`,
          [`@keyframes voice-ripple-${i}`]: {
            "0%": { transform: "scale(0.85)", opacity: 0.3 / i },
            "100%": { transform: "scale(1.15)", opacity: 0 },
          },
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      {/* Core orb */}
      <Box sx={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: active
          ? `radial-gradient(circle at 35% 35%, ${color}cc, ${color})`
          : "#e0e0e0",
        transform: `scale(${scale})`,
        transition: "transform 0.08s ease, background 0.3s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: active ? `0 0 32px ${color}66` : "none",
        cursor: status === "disconnected" ? "default" : "default",
      }}>
        {active
          ? <MicIcon sx={{ color: "#fff", fontSize: 32 }} />
          : <MicOffIcon sx={{ color: "#aaa", fontSize: 32 }} />
        }
      </Box>
    </Box>
  );
}

export default function VoiceChat() {
  const [open, setOpen] = useState(false);
  const [character, setCharacter] = useState(null); // "anhPhu" | "chiTan"
  const [status, setStatus] = useState("disconnected");
  const [mode, setMode] = useState("listening");
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState([]);

  const conversationRef = useRef(null);
  const rafRef = useRef(null);

  const char = character ? CHARACTERS[character] : null;

  const pollVolume = useCallback(() => {
    if (!conversationRef.current) return;
    const v = mode === "speaking"
      ? conversationRef.current.getOutputVolume()
      : conversationRef.current.getInputVolume();
    setVolume(v);
    rafRef.current = requestAnimationFrame(pollVolume);
  }, [mode]);

  useEffect(() => {
    if (status === "connected") {
      rafRef.current = requestAnimationFrame(pollVolume);
    } else {
      cancelAnimationFrame(rafRef.current);
      setVolume(0);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, pollVolume]);

  const startSession = async () => {
    // Tính năng đang phát triển — chưa kết nối agent
    setTranscript([{ role: "system", text: "🚧 Tính năng voice chat đang được phát triển, sắp ra mắt nha cưng~" }]);
  };

  const endSession = async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setStatus("disconnected");
    setMode("listening");
  };

  const handleClose = () => {
    endSession();
    setOpen(false);
    setCharacter(null);
    setTranscript([]);
  };

  const handleSelectCharacter = (key) => {
    setCharacter(key);
    setTranscript([]);
    setStatus("disconnected");
  };

  const handleMicToggle = () => {
    if (status === "disconnected") startSession();
    else endSession();
  };

  return (
    <>
      {/* Floating panel */}
      <Box sx={{
        position: "fixed",
        bottom: 96,
        right: { xs: "auto", sm: 24 },
        left: { xs: 16, sm: "auto" },
        zIndex: 1500,
        width: { xs: "calc(100vw - 32px)", sm: 320 },
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        background: "#fff",
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.5,
          px: 2, py: 1.5,
          background: char?.color ?? "#333",
          color: "#fff",
        }}>
          <Typography sx={{ fontSize: "1.4rem", lineHeight: 1 }}>
            {char?.emoji ?? "🎙️"}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", lineHeight: 1.2, color: "#fff" }}>
              {char?.name ?? "Voice Chat"}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", opacity: 0.85, color: "#fff" }}>
              Hỏi bằng giọng nói
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: "#fff" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Character selector */}
        {!character && (
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Chọn nhân vật
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {Object.entries(CHARACTERS).map(([key, c]) => (
                <Box
                  key={key}
                  onClick={() => handleSelectCharacter(key)}
                  sx={{
                    flex: 1, p: 1.5, borderRadius: 2,
                    border: `2px solid ${c.color}33`,
                    cursor: "pointer", textAlign: "center",
                    transition: "all 0.15s",
                    "&:hover": { background: `${c.color}12`, borderColor: c.color },
                  }}
                >
                  <Typography sx={{ fontSize: "2rem", lineHeight: 1.2 }}>{c.emoji}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: c.color, mt: 0.5 }}>{c.name}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Voice interface */}
        {character && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", px: 2, pb: 2 }}>
            <VoiceOrb color={char.color} volume={volume} mode={mode} status={status} />

            {/* Status */}
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1, fontStyle: "italic" }}>
              {mode === "speaking" && status === "connected"
                ? `${char.name} đang nói...`
                : STATUS_LABEL[status]}
            </Typography>

            {/* Mic button */}
            <IconButton
              onClick={handleMicToggle}
              disabled={status === "connecting" || status === "disconnecting"}
              sx={{
                width: 56, height: 56,
                background: status === "connected" ? "#f44336" : char.color,
                color: "#fff",
                boxShadow: status === "connected" ? "0 0 20px #f4433666" : `0 4px 16px ${char.color}55`,
                "&:hover": { background: status === "connected" ? "#d32f2f" : char.color, opacity: 0.9 },
                "&.Mui-disabled": { background: "#e0e0e0", color: "#bbb" },
                transition: "background 0.2s",
              }}
            >
              {status === "connected" ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.5 }}>
              {status === "connected" ? "Nhấn để dừng" : "Nhấn để nói"}
            </Typography>

            {/* Transcript */}
            {transcript.length > 0 && (
              <Box sx={{ width: "100%", mt: 2, maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.75 }}>
                {transcript.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";
                  return (
                    <Box key={i} sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                      <Paper elevation={0} sx={{
                        px: 1.2, py: 0.6,
                        maxWidth: "85%",
                        borderRadius: isUser ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                        background: isSystem ? "#fff3e0" : isUser ? char.color : "#f3f4f6",
                        color: isUser ? "#fff" : isSystem ? "#e65100" : "#1a1a1a",
                        fontSize: "0.78rem",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}>
                        {msg.text}
                      </Paper>
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Change character */}
            <Box
              onClick={() => { endSession(); setCharacter(null); }}
              sx={{ mt: 1.5, fontSize: "0.72rem", color: "text.secondary", cursor: "pointer", textDecoration: "underline", "&:hover": { color: char.color } }}
            >
              Đổi nhân vật
            </Box>
          </Box>
        )}
      </Box>

      {/* FAB trigger */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: { xs: "auto", sm: 24 },
          left: { xs: 16, sm: "auto" },
          zIndex: 1500,
          width: 52, height: 52,
          borderRadius: "50%",
          background: char?.color ?? "#333",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: `0 4px 20px ${char?.color ?? "#333"}77`,
          transition: "transform 0.2s, box-shadow 0.2s, background 0.3s",
          animation: !open ? "voice-fab-pulse 2.5s ease-in-out infinite" : "none",
          "@keyframes voice-fab-pulse": {
            "0%,100%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.08)" },
          },
          "&:hover": { transform: "scale(1.1)" },
          "&:active": { transform: "scale(0.94)" },
        }}
      >
        <MicIcon sx={{ fontSize: 24 }} />
      </Box>
    </>
  );
}
