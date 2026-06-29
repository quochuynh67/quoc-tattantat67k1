// src/components/sections/HeroAskSection.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Box, Container, Typography, Paper, InputBase,
  IconButton, CircularProgress, Chip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Conversation } from "@elevenlabs/client";

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_HERO_AGENT_ID;

const HERO_AGENT = {
  name: "Anh Phú & Chị Tân (Thổ địa Phú Tân)",
  color: "#2d6a4f",
  emoji: "🌾",
};

const SAMPLE_QA = [
  { q: "Số điện thoại chành xe Quốc Huỳnh là gì?", a: "Số điện thoại chành xe Quốc Huỳnh là 0762985555 đó bạn~" },
  { q: "Tôi vừa thấy 1 chú cún bị lạc tại X, có ai hay gần đây bị mất cún không?", a: "Để cô hỏi thăm giùm bạn nha~" },
  { q: "Tôi bị rơi cái ví ở đường về nhà tại khu phố X", a: "À, đã có người nhặt ở đây nè cưng~ để cô hỏi thăm giùm bạn nha~" },
  { q: "Đặc sản nổi tiếng của Phú Tân là gì?", a: "Phú Tân nổi tiếng với mắm, cá khô, bánh bò thốt nốt và các món miền Tây đặc trưng đó nha~" },
  { q: "Có gia đình nào khó khăn cần giúp đỡ không?", a: "Có chứ, để cô xem giúp gia đình cô X ở xã Y nha cưng~" },
  { q: "Ở Phú Tân có chùa hay di tích nào đẹp không?", a: "Phú Tân có chùa Phước Long, đình thần và nhiều điểm văn hóa đặc trưng miền Tây đó bạn~" },
];

const TypingDots = () => (
  <Box sx={{ display: "flex", gap: "5px", alignItems: "center", px: 1.5, py: 1 }}>
    {[0, 1, 2].map((i) => (
      <Box key={i} sx={{
        width: 7, height: 7, borderRadius: "50%", bgcolor: "#9e9e9e",
        animation: "ask-dot 1.2s ease-in-out infinite",
        animationDelay: `${i * 0.2}s`,
        "@keyframes ask-dot": {
          "0%,80%,100%": { transform: "scale(0.75)", opacity: 0.4 },
          "40%": { transform: "scale(1.2)", opacity: 1 },
        },
      }} />
    ))}
  </Box>
);

const SampleQADisplay = ({ onClickQuestion }) => {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = (i) => {
    setVisible(false);
    setTimeout(() => { setIdx(i); setVisible(true); }, 420);
  };

  useEffect(() => {
    if (SAMPLE_QA.length <= 1) return;
    const t = setInterval(() => goTo((idx + 1) % SAMPLE_QA.length), 5500);
    return () => clearInterval(t);
  }, [idx]);

  const qa = SAMPLE_QA[idx];

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="caption" sx={{
        display: "block", mb: 2, textAlign: "center",
        color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em",
        textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600,
      }}>
        ví dụ bạn có thể hỏi
      </Typography>
      <Box sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        maxWidth: 540, mx: "auto",
      }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
          <Paper elevation={0} onClick={() => onClickQuestion(qa.q)} sx={{
            px: 2.2, py: 1.3, bgcolor: "rgba(255,255,255,0.16)", backdropFilter: "blur(10px)",
            color: "#fff", borderRadius: "20px 20px 4px 20px",
            border: "1px solid rgba(255,255,255,0.28)", fontSize: "0.9rem", maxWidth: "80%",
            cursor: "pointer", transition: "all 0.2s",
            "&:hover": { bgcolor: "rgba(255,255,255,0.26)", transform: "translateY(-1px)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
          }}>
            {qa.q}
          </Paper>
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            bgcolor: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
          }}>
            {HERO_AGENT.emoji}
          </Box>
          <Paper elevation={0} sx={{
            px: 2.2, py: 1.3, bgcolor: "rgba(255,255,255,0.93)", color: "#1a1a1a",
            borderRadius: "20px 20px 20px 4px", fontSize: "0.9rem",
            maxWidth: "80%", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", lineHeight: 1.55,
          }}>
            {qa.a}
          </Paper>
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.8, mt: 3 }}>
        {SAMPLE_QA.map((_, i) => (
          <Box key={i} onClick={() => goTo(i)} sx={{
            width: i === idx ? 22 : 7, height: 7, borderRadius: 99,
            bgcolor: i === idx ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.32)",
            transition: "all 0.4s ease", cursor: "pointer",
            "&:hover": { bgcolor: "rgba(255,255,255,0.65)" },
          }} />
        ))}
      </Box>
    </Box>
  );
};

const ConversationDisplay = ({ messages, loading }) => {
  const lastMessages = messages.slice(-4);
  return (
    <Box sx={{ mt: 3, maxWidth: 560, mx: "auto" }}>
      {lastMessages.map((msg, i) => {
        const isUser = msg.role === "user";
        return (
          <Box key={i} sx={{
            display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
            mb: 1.5, gap: 1.2,
            animation: i >= lastMessages.length - 2 ? "msg-in 0.4s ease" : "none",
            "@keyframes msg-in": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
          }}>
            {!isUser && (
              <Box sx={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                bgcolor: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
              }}>
                {HERO_AGENT.emoji}
              </Box>
            )}
            <Paper elevation={0} sx={{
              px: 2.2, py: 1.3, maxWidth: "80%",
              borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
              bgcolor: isUser ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.93)",
              color: isUser ? "#fff" : "#1a1a1a", fontSize: "0.9rem",
              border: isUser ? "1px solid rgba(255,255,255,0.25)" : "none",
              backdropFilter: isUser ? "blur(10px)" : "none",
              boxShadow: isUser ? "none" : "0 4px 20px rgba(0,0,0,0.1)", lineHeight: 1.6,
            }}>
              {msg.content}
            </Paper>
          </Box>
        );
      })}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
          }}>
            {HERO_AGENT.emoji}
          </Box>
          <Paper elevation={0} sx={{ bgcolor: "rgba(255,255,255,0.93)", borderRadius: "20px 20px 20px 4px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <TypingDots />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

const COOLDOWN_SECS = 45;
const DAILY_LIMIT = 5;
const SESSION_LIMIT = 5;
const LS_COOLDOWN = "phutan_hero_cooldown_until";
const LS_DAILY = "phutan_hero_daily";

function getInitialCooldown() {
  try {
    const until = parseInt(localStorage.getItem(LS_COOLDOWN) ?? "0", 10);
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  } catch { return 0; }
}

function getDailyCount() {
  try {
    const today = new Date().toDateString();
    const raw = JSON.parse(localStorage.getItem(LS_DAILY) ?? "{}");
    return raw.date === today ? (raw.count ?? 0) : 0;
  } catch { return 0; }
}

function incrementDailyCount() {
  try {
    const today = new Date().toDateString();
    const raw = JSON.parse(localStorage.getItem(LS_DAILY) ?? "{}");
    const count = (raw.date === today ? raw.count : 0) + 1;
    localStorage.setItem(LS_DAILY, JSON.stringify({ date: today, count }));
    return count;
  } catch { return 1; }
}

function saveCooldown() {
  try {
    localStorage.setItem(LS_COOLDOWN, String(Date.now() + COOLDOWN_SECS * 1000));
  } catch { }
}

export default function HeroAskSection() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(getInitialCooldown);
  const [dailyCount, setDailyCount] = useState(getDailyCount);
  const inputRef = useRef(null);
  const convRef = useRef(null);
  const pendingRef = useRef(false);
  const connectingRef = useRef(false);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  // Cleanup session on unmount only
  useEffect(() => {
    return () => {
      convRef.current?.endSession();
      convRef.current = null;
    };
  }, []);

  const isCooling = cooldownLeft > 0;
  const isDailyMaxed = dailyCount >= DAILY_LIMIT;
  const isSessionMaxed = messages.filter((m) => m.role === "user").length >= SESSION_LIMIT;
  const isBlocked = isCooling || isDailyMaxed || isSessionMaxed;

  const getOrCreateSession = async () => {
    if (convRef.current) return convRef.current;
    if (connectingRef.current) return null;
    if (!AGENT_ID) return null;

    connectingRef.current = true;
    try {
      const conv = await Conversation.startSession({
        agentId: AGENT_ID,
        textOnly: true,
        onMessage: ({ role, message }) => {
          if (role === "agent") {
            setLoading(false);
            pendingRef.current = false;
            setMessages((m) => [...m, { role: "assistant", content: message }]);
          }
        },
        onError: (msg) => {
          setLoading(false);
          pendingRef.current = false;
          setMessages((m) => [...m, { role: "assistant", content: msg ?? "Hỏng kết nối được, thử lại sau nha~" }]);
        },
      });
      convRef.current = conv;
      return conv;
    } catch (err) {
      console.error("[ElevenLabs] session error:", err);
      setMessages((m) => [...m, { role: "assistant", content: "Hỏng kết nối được, thử lại sau nha~" }]);
      return null;
    } finally {
      connectingRef.current = false;
    }
  };

  const send = async (questionOverride) => {
    const question = (questionOverride ?? input).trim();
    if (!question || loading || isBlocked) return;

    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    pendingRef.current = true;
    saveCooldown();
    setCooldownLeft(COOLDOWN_SECS);
    const newCount = incrementDailyCount();
    setDailyCount(newCount);

    const conv = await getOrCreateSession();
    if (conv) {
      conv.sendUserMessage(question);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const hasConversation = messages.length > 0;
  const notReady = !AGENT_ID;

  const placeholderText = () => {
    if (isDailyMaxed) return `Hết ${DAILY_LIMIT} lượt hỏi hôm nay rồi nha, mai quay lại~`;
    if (isSessionMaxed) return `Hết ${SESSION_LIMIT} lượt/phiên rồi, tải lại trang để hỏi tiếp~`;
    if (isCooling) return `Đang chờ ${cooldownLeft}s…`;
    return "Hỏi về Phú Tân… chành xe, đặc sản, địa điểm, sự kiện…";
  };

  return (
    <Box sx={{
      background: "linear-gradient(145deg, #1b4332 0%, #2d6a4f 55%, #40916c 100%)",
      py: { xs: 5, md: 7 }, position: "relative", overflow: "hidden",
      "&::before": {
        content: '""', position: "absolute", inset: 0,
        backgroundImage: [
          "radial-gradient(ellipse at 15% 60%, rgba(95,184,120,0.18) 0%, transparent 55%)",
          "radial-gradient(ellipse at 85% 15%, rgba(27,67,50,0.45) 0%, transparent 50%)",
          "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.2) 0%, transparent 60%)",
        ].join(","),
        pointerEvents: "none",
      },
    }}>
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: "0.85rem !important", color: "#ffd700 !important" }} />}
            label="Trợ lý AI Phú Tân: Anh Phú & Chị Tân (Thổ địa Phú Tân)"
            size="small"
            sx={{
              mb: 2, bgcolor: "rgba(255,255,255,0.13)", color: "#fff",
              backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)",
              fontWeight: 600, letterSpacing: "0.02em", "& .MuiChip-label": { px: 1 },
            }}
          />
          <Typography variant="h4" sx={{
            color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700,
            mb: 1, textShadow: "0 2px 14px rgba(0,0,0,0.35)",
            fontSize: { xs: "1.65rem", md: "2.2rem" },
          }}>
            Hỏi bất cứ điều gì về Phú Tân
          </Typography>
          <Typography variant="body1" sx={{
            color: "rgba(255,255,255,0.72)", fontFamily: "var(--font-body)",
            fontSize: { xs: "0.9rem", md: "1rem" },
          }}>
            {HERO_AGENT.name} {HERO_AGENT.emoji} sẵn sàng giải đáp mọi thắc mắc về huyện Phú Tân, An Giang
          </Typography>
        </Box>

        <Paper elevation={0} sx={{
          display: "flex", alignItems: "center", gap: 1,
          pl: 2, pr: 1, py: 0.75, borderRadius: "999px",
          bgcolor: "rgba(255,255,255,0.96)", backdropFilter: "blur(16px)",
          boxShadow: "0 8px 36px rgba(0,0,0,0.22)", border: "2px solid rgba(255,255,255,0.75)",
          transition: "box-shadow 0.25s, border-color 0.25s",
          "&:focus-within": {
            boxShadow: "0 8px 48px rgba(0,0,0,0.3), 0 0 0 3px rgba(64,145,108,0.4)",
            borderColor: "rgba(64,145,108,0.5)",
          },
        }}>
          <Box sx={{ width: 26, height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.05rem" }}>
            {HERO_AGENT.emoji}
          </Box>
          <InputBase
            inputRef={inputRef}
            fullWidth
            disabled={isBlocked}
            placeholder={placeholderText()}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            sx={{
              fontSize: "0.95rem", color: "#1a1a1a",
              "& input::placeholder": { color: isBlocked ? "#e57373" : "#aaa", fontSize: "0.92rem" },
              "& input:disabled": { WebkitTextFillColor: "#9e9e9e" },
            }}
          />
          {hasConversation && (
            <IconButton size="small" onClick={reset} title="Hỏi câu mới" sx={{ color: "#9e9e9e", "&:hover": { color: HERO_AGENT.color } }}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            onClick={() => send()}
            disabled={!input.trim() || loading || isBlocked || notReady}
            sx={{
              bgcolor: HERO_AGENT.color, color: "#fff", width: 44, height: 44,
              transition: "all 0.2s",
              "&:hover": { bgcolor: "#1b4332", transform: "scale(1.06)" },
              "&:active": { transform: "scale(0.95)" },
              "&.Mui-disabled": { bgcolor: "#d0d0d0", color: "#b0b0b0" },
            }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Paper>

        {/* Daily / session limit notice */}
        {(isDailyMaxed || isSessionMaxed) && (
          <Box sx={{ mt: 1.5, mx: "auto", maxWidth: 480 }}>
            <Box sx={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 1, px: 2, py: 0.9, borderRadius: "999px",
              bgcolor: "rgba(0,0,0,0.28)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
              <Typography sx={{ color: "rgba(255,255,255,0.88)", fontSize: "0.82rem", fontFamily: "var(--font-body)", textAlign: "center" }}>
                {isDailyMaxed
                  ? `Hết ${DAILY_LIMIT} lượt hỏi hôm nay rồi nha cưng, quay lại vào ngày mai nhé~ 😄`
                  : `Hết ${SESSION_LIMIT} lượt/phiên rồi, tải lại trang để tiếp tục hỏi nha~ 🔄`}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Cooldown notice */}
        {!isDailyMaxed && !isSessionMaxed && isCooling && (
          <Box sx={{
            mt: 1.5, mx: "auto", maxWidth: 480,
            animation: "cd-in 0.35s ease",
            "@keyframes cd-in": { from: { opacity: 0, transform: "translateY(-6px)" }, to: { opacity: 1, transform: "translateY(0)" } },
          }}>
            <Box sx={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 1, px: 2, py: 0.9, borderRadius: "999px",
              bgcolor: "rgba(0,0,0,0.28)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
              <Box sx={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Box sx={{
                  width: 6, height: 6, borderRadius: "50%", bgcolor: "#fff",
                  animation: "cd-pulse 1s ease-in-out infinite",
                  "@keyframes cd-pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                }} />
              </Box>
              <Typography sx={{ color: "rgba(255,255,255,0.88)", fontSize: "0.82rem", fontFamily: "var(--font-body)" }}>
                Hãy đợi <Box component="span" sx={{ fontWeight: 700, color: "#fff" }}>{cooldownLeft}s</Box> rồi hỏi tiếp nhé, nhiều người hỏi quá ahihi 😄
              </Typography>
            </Box>
            <Box sx={{ mt: 0.8, height: 3, borderRadius: 99, bgcolor: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <Box sx={{
                height: "100%", borderRadius: 99, bgcolor: "rgba(255,255,255,0.65)",
                width: `${(cooldownLeft / COOLDOWN_SECS) * 100}%`,
                transition: "width 1s linear",
              }} />
            </Box>
          </Box>
        )}

        {!hasConversation
          ? <SampleQADisplay onClickQuestion={(q) => { if (!isBlocked) { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); } }} />
          : <ConversationDisplay messages={messages} loading={loading} />
        }
      </Container>
    </Box>
  );
}
