// src/pages/FnBGames.jsx
// Trang Gamification: 8 mini-game giữ chân khách hàng F&B & Bán lẻ
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LS_POINTS_KEY = "pt_game_points";
const LS_PLAYED_KEY = "pt_game_played";

function getPoints() {
  try { return parseInt(localStorage.getItem(LS_POINTS_KEY) || "0", 10); } catch { return 0; }
}
function addPoints(n) {
  try { localStorage.setItem(LS_POINTS_KEY, String(getPoints() + n)); } catch {}
}
function getPlayed() {
  try { return JSON.parse(localStorage.getItem(LS_PLAYED_KEY) || "{}"); } catch { return {}; }
}
function markPlayed(gameId) {
  const p = getPlayed();
  p[gameId] = (p[gameId] || 0) + 1;
  try { localStorage.setItem(LS_PLAYED_KEY, JSON.stringify(p)); } catch {}
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const NEON_COLORS = {
  spin:    { from: "#f7971e", to: "#ffd200", glow: "#ffd200" },
  memory:  { from: "#6a11cb", to: "#2575fc", glow: "#818cf8" },
  quiz:    { from: "#11998e", to: "#38ef7d", glow: "#34d399" },
  dice:    { from: "#f953c6", to: "#b91d73", glow: "#f472b6" },
  puzzle:  { from: "#4facfe", to: "#00f2fe", glow: "#38bdf8" },
  slot:    { from: "#f7971e", to: "#f953c6", glow: "#fb923c" },
  price:   { from: "#43e97b", to: "#38f9d7", glow: "#2dd4bf" },
  board:   { from: "#fa709a", to: "#fee140", glow: "#fbbf24" },
};

const gameCardStyle = (colors) => ({
  background: `linear-gradient(135deg, ${colors.from}22 0%, ${colors.to}22 100%)`,
  border: `1.5px solid ${colors.from}55`,
  borderRadius: 20,
  padding: "28px 24px 24px",
  position: "relative",
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.22s, box-shadow 0.22s",
  boxShadow: `0 4px 24px ${colors.glow}22`,
});

const btnStyle = (colors, disabled) => ({
  background: disabled
    ? "#444"
    : `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "10px 26px",
  fontWeight: 700,
  fontSize: 15,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
  transition: "transform 0.15s, box-shadow 0.15s",
  boxShadow: disabled ? "none" : `0 4px 18px ${colors.glow}55`,
  letterSpacing: "0.02em",
});

// ─── 1. Vòng Quay May Mắn ─────────────────────────────────────────────────────

const SPIN_PRIZES = [
  { label: "Giảm 10%", color: "#f7971e", emoji: "🎁" },
  { label: "Free Trà", color: "#11998e", emoji: "🍵" },
  { label: "Thêm lần", color: "#6a11cb", emoji: "🔄" },
  { label: "Giảm 20%", color: "#f953c6", emoji: "💸" },
  { label: "Tặng Bánh", color: "#4facfe", emoji: "🧁" },
  { label: "Chúc Mừng!", color: "#43e97b", emoji: "🎉" },
  { label: "Giảm 5%", color: "#fa709a", emoji: "🌟" },
  { label: "Tặng Nước", color: "#ffd200", emoji: "🥤" },
];

function SpinWheelGame({ onEarn }) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const animRef = useRef(null);

  const drawWheel = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const r = cx - 6;
    const arc = (Math.PI * 2) / SPIN_PRIZES.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Shadow ring
    ctx.save();
    ctx.shadowBlur = 28;
    ctx.shadowColor = "#ffd20066";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffd200";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    SPIN_PRIZES.forEach((prize, i) => {
      const start = angle + i * arc - Math.PI / 2;
      const end = start + arc;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = prize.color + "cc";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#0008";
      ctx.fillText(prize.label, r - 8, 4);
      ctx.font = "16px serif";
      ctx.fillText(prize.emoji, r - 60, 5);
      ctx.restore();
    });

    // Center circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    const cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 22);
    cg.addColorStop(0, "#fff");
    cg.addColorStop(1, "#ffd200");
    ctx.fillStyle = cg;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#ffd200";
    ctx.fill();
    ctx.restore();

    // Pointer
    ctx.save();
    ctx.translate(cx, cy - r + 2);
    ctx.beginPath();
    ctx.moveTo(-11, -18);
    ctx.lineTo(11, -18);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#fff8";
    ctx.fill();
    ctx.restore();
  }, []);

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation, drawWheel]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const extra = 5 * Math.PI * 2 + Math.random() * Math.PI * 2;
    const targetRot = rotation + extra;
    const duration = 4000;
    const start = performance.now();
    const startRot = rotation;

    const animate = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const cur = startRot + extra * ease;
      setRotation(cur);
      drawWheel(cur);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const arc = (Math.PI * 2) / SPIN_PRIZES.length;
        const norm = (((-targetRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        const idx = Math.floor(norm / arc) % SPIN_PRIZES.length;
        const prize = SPIN_PRIZES[idx];
        setResult(prize);
        setSpinning(false);
        markPlayed("spin");
        const pts = prize.label.includes("20") ? 50 : prize.label.includes("10") ? 30 : 15;
        addPoints(pts);
        onEarn(pts);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} width={240} height={240} style={{ display: "block", margin: "0 auto 16px", borderRadius: "50%" }} />
      <button style={btnStyle(NEON_COLORS.spin, spinning)} onClick={spin} disabled={spinning}>
        {spinning ? "Đang quay…" : "🎯 Quay ngay!"}
      </button>
      {result && (
        <div style={{ marginTop: 14, padding: "10px 20px", borderRadius: 12, background: result.color + "33", border: `1.5px solid ${result.color}`, fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {result.emoji} {result.label} — Bạn nhận được!
        </div>
      )}
    </div>
  );
}

// ─── 2. Lật Thẻ Trùng (Memory Match) ─────────────────────────────────────────

const MEMORY_CARDS = [
  { id: 1, emoji: "🍜", label: "Hủ tiếu" },
  { id: 2, emoji: "🥗", label: "Gỏi cuốn" },
  { id: 3, emoji: "🍛", label: "Cơm tấm" },
  { id: 4, emoji: "🥥", label: "Nước dừa" },
  { id: 5, emoji: "🍌", label: "Chuối" },
  { id: 6, emoji: "🦐", label: "Tôm" },
];

function shuffle(arr) {
  return [...arr, ...arr.map(c => ({ ...c, uid: c.id + "_b" }))]
    .map(c => ({ ...c, uid: c.uid || c.id + "_a", flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
}

function MemoryGame({ onEarn }) {
  const [cards, setCards] = useState(() => shuffle(MEMORY_CARDS));
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleFlip = (uid) => {
    if (locked || won) return;
    setCards(prev => {
      const card = prev.find(c => c.uid === uid);
      if (card.flipped || card.matched) return prev;
      return prev.map(c => c.uid === uid ? { ...c, flipped: true } : c);
    });
    setSelected(prev => [...prev, uid]);
  };

  useEffect(() => {
    if (selected.length !== 2) return;
    setLocked(true);
    setMoves(m => m + 1);
    const [a, b] = selected;
    setCards(prev => {
      const ca = prev.find(c => c.uid === a);
      const cb = prev.find(c => c.uid === b);
      if (ca.id === cb.id) {
        const next = prev.map(c => c.uid === a || c.uid === b ? { ...c, matched: true } : c);
        if (next.every(c => c.matched)) {
          setTimeout(() => {
            setWon(true);
            const pts = Math.max(10, 80 - moves * 5);
            addPoints(pts);
            markPlayed("memory");
            onEarn(pts);
          }, 300);
        }
        setSelected([]);
        setLocked(false);
        return next;
      } else {
        setTimeout(() => {
          setCards(p => p.map(c => c.uid === a || c.uid === b ? { ...c, flipped: false } : c));
          setSelected([]);
          setLocked(false);
        }, 900);
        return prev;
      }
    });
  }, [selected]);

  const reset = () => {
    setCards(shuffle(MEMORY_CARDS));
    setSelected([]);
    setMoves(0);
    setWon(false);
    setLocked(false);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#a78bfa", fontWeight: 600, marginBottom: 12 }}>Lượt: {moves} | Tìm {MEMORY_CARDS.length} cặp đôi</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 60px)", gap: 8, justifyContent: "center", marginBottom: 16 }}>
        {cards.map(card => (
          <div
            key={card.uid}
            onClick={() => handleFlip(card.uid)}
            style={{
              width: 60, height: 60, borderRadius: 10,
              background: card.flipped || card.matched
                ? (card.matched ? "linear-gradient(135deg,#6a11cb,#2575fc)" : "linear-gradient(135deg,#6a11cb88,#2575fc88)")
                : "linear-gradient(135deg,#1e1b4b,#312e81)",
              border: card.matched ? "2px solid #818cf8" : "1.5px solid #4c1d95",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: card.flipped || card.matched ? 28 : 22,
              cursor: card.matched ? "default" : "pointer",
              transition: "all 0.22s",
              boxShadow: card.matched ? "0 0 14px #818cf844" : "none",
              userSelect: "none",
            }}
          >
            {card.flipped || card.matched ? card.emoji : "❓"}
          </div>
        ))}
      </div>
      {won && (
        <div style={{ color: "#34d399", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
          🏆 Xuất sắc! Hoàn thành trong {moves} lượt!
        </div>
      )}
      <button style={btnStyle(NEON_COLORS.memory, false)} onClick={reset}>🔄 Chơi lại</button>
    </div>
  );
}

// ─── 3. Đố Vui Ẩm Thực ───────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  { q: "Món gỏi nào là đặc sản miền Tây?", opts: ["Gỏi ngó sen", "Gỏi củ hũ dừa", "Cả hai"], ans: 2 },
  { q: "Nước mắm nổi tiếng nhất An Giang từ đâu?", opts: ["Phú Tân", "Châu Đốc", "Long Xuyên"], ans: 1 },
  { q: "Bánh bò thốt nốt có nguồn gốc từ dân tộc nào?", opts: ["Kinh", "Khmer", "Chăm"], ans: 1 },
  { q: "Cá linh mùa nước nổi xuất hiện tháng mấy?", opts: ["Tháng 5-6", "Tháng 8-10", "Tháng 12-1"], ans: 1 },
  { q: "Lẩu mắm ở miền Tây thường ăn kèm với?", opts: ["Bánh tráng", "Rau dừa bông súng", "Phở"], ans: 1 },
  { q: "Đặc sản cá sặc rằn Phú Tân thường chế biến thành?", opts: ["Khô cá sặc", "Kho tộ", "Cả hai"], ans: 2 },
  { q: "Rừng tràm Trà Sư thuộc huyện nào của An Giang?", opts: ["Phú Tân", "Tịnh Biên", "Châu Phú"], ans: 1 },
  { q: "Thịt bò Mỹ Hội Đông nổi tiếng ở tỉnh nào?", opts: ["An Giang", "Đồng Tháp", "Bến Tre"], ans: 0 },
];

function QuizGame({ onEarn }) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [done, setDone] = useState(false);

  const answer = (idx) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === QUIZ_QUESTIONS[qIndex].ans) setScore(s => s + 1);
    setTimeout(() => {
      if (qIndex + 1 >= QUIZ_QUESTIONS.length) {
        setDone(true);
        const pts = (score + (idx === QUIZ_QUESTIONS[qIndex].ans ? 1 : 0)) * 10;
        addPoints(pts);
        markPlayed("quiz");
        onEarn(pts);
      } else {
        setQIndex(q => q + 1);
        setAnswered(null);
      }
    }, 900);
  };

  const reset = () => { setQIndex(0); setScore(0); setAnswered(null); setDone(false); };
  const q = QUIZ_QUESTIONS[qIndex];

  if (done) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{score >= 6 ? "🏆" : score >= 4 ? "🌟" : "😅"}</div>
        <div style={{ fontWeight: 700, fontSize: 20, color: "#34d399", marginBottom: 4 }}>
          {score}/{QUIZ_QUESTIONS.length} câu đúng!
        </div>
        <div style={{ color: "#9ca3af", marginBottom: 16 }}>
          {score >= 6 ? "Bạn là chuyên gia ẩm thực miền Tây!" : "Hãy khám phá thêm về ẩm thực An Giang nhé!"}
        </div>
        <button style={btnStyle(NEON_COLORS.quiz, false)} onClick={reset}>🔄 Chơi lại</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: "#6ee7b7", fontSize: 13, fontWeight: 600 }}>Câu {qIndex + 1}/{QUIZ_QUESTIONS.length}</span>
        <span style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600 }}>✅ {score} đúng</span>
      </div>
      <div style={{ background: "rgba(17,153,142,0.12)", borderRadius: 12, padding: "14px 16px", marginBottom: 14, fontWeight: 600, fontSize: 15, color: "#fff", lineHeight: 1.5 }}>
        {q.q}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.opts.map((opt, i) => {
          let bg = "rgba(255,255,255,0.06)";
          let border = "1.5px solid rgba(255,255,255,0.12)";
          if (answered !== null) {
            if (i === q.ans) { bg = "rgba(52,211,153,0.2)"; border = "1.5px solid #34d399"; }
            else if (i === answered && answered !== q.ans) { bg = "rgba(248,113,113,0.2)"; border = "1.5px solid #f87171"; }
          }
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              style={{
                background: bg, border, borderRadius: 10, padding: "10px 14px",
                color: "#e5e7eb", fontWeight: 500, fontSize: 14, cursor: "pointer",
                textAlign: "left", transition: "all 0.18s",
              }}
            >
              {["A", "B", "C"][i]}. {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 4. Lắc Xúc Xắc Khuyến Mãi ───────────────────────────────────────────────

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function DiceGame({ onEarn }) {
  const [dice, setDice] = useState([1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [rolls, setRolls] = useState(0);

  const roll = () => {
    if (rolling || rolls >= 3) return;
    setRolling(true);
    setResult(null);
    const interval = setInterval(() => {
      setDice([
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ]);
    }, 80);
    setTimeout(() => {
      clearInterval(interval);
      const d = [
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
        Math.ceil(Math.random() * 6),
      ];
      setDice(d);
      const total = d.reduce((s, v) => s + v, 0);
      let msg = "";
      let pts = 0;
      if (d[0] === d[1] && d[1] === d[2]) { msg = "🎊 Ba giống nhau! Giảm 30%!"; pts = 60; }
      else if (total >= 16) { msg = "🌟 Điểm cao! Giảm 20%!"; pts = 40; }
      else if (total >= 12) { msg = "✅ Giảm 10% cho đơn tiếp theo!"; pts = 20; }
      else { msg = "😊 Chúc mừng! +5 điểm tích lũy"; pts = 5; }
      setResult({ msg, pts, total });
      setRolling(false);
      setRolls(r => r + 1);
      addPoints(pts);
      markPlayed("dice");
      onEarn(pts);
    }, 1200);
  };

  const reset = () => { setDice([1,1,1]); setRolls(0); setResult(null); };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#f9a8d4", fontSize: 13, marginBottom: 14 }}>Lắc tối đa 3 lần/ngày — Tổng điểm càng cao, ưu đãi càng lớn</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
        {dice.map((d, i) => (
          <div key={i} style={{
            width: 64, height: 64, borderRadius: 14,
            background: rolling ? "linear-gradient(135deg,#f953c6,#b91d73)" : "linear-gradient(135deg,#1f1f3a,#2d1b69)",
            border: "2px solid #f472b655",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
            boxShadow: rolling ? "0 0 24px #f472b666" : "0 4px 12px #0006",
            transition: "all 0.12s",
          }}>
            {DICE_FACES[d - 1]}
          </div>
        ))}
      </div>
      {result && (
        <div style={{ background: "rgba(249,79,198,0.15)", border: "1.5px solid #f472b6", borderRadius: 12, padding: "10px 16px", marginBottom: 14, color: "#fff", fontWeight: 600 }}>
          {result.msg} <span style={{ color: "#fbbf24" }}>(Tổng: {result.total})</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button style={btnStyle(NEON_COLORS.dice, rolling || rolls >= 3)} onClick={roll} disabled={rolling || rolls >= 3}>
          🎲 {rolls >= 3 ? "Hết lượt hôm nay" : `Lắc! (còn ${3 - rolls} lần)`}
        </button>
        <button style={{ ...btnStyle(NEON_COLORS.dice, false), background: "rgba(255,255,255,0.08)", boxShadow: "none" }} onClick={reset}>↩</button>
      </div>
    </div>
  );
}

// ─── 5. Xếp Hình Sản Phẩm (Puzzle Slide) ─────────────────────────────────────

const PUZZLE_SIZE = 3;
const TOTAL_TILES = PUZZLE_SIZE * PUZZLE_SIZE;

function initPuzzle() {
  const tiles = Array.from({ length: TOTAL_TILES }, (_, i) => i);
  // shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

function isSolved(tiles) {
  return tiles.every((t, i) => t === i);
}

function PuzzleGame({ onEarn }) {
  const [tiles, setTiles] = useState(() => initPuzzle());
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const EMOJI_GRID = ["🍜", "🌿", "🥥", "🦐", "🌾", "🍌", "🍛", "🧁", ""];

  const moveTile = (idx) => {
    if (won) return;
    const blank = tiles.indexOf(TOTAL_TILES - 1);
    const row = Math.floor(idx / PUZZLE_SIZE), col = idx % PUZZLE_SIZE;
    const bRow = Math.floor(blank / PUZZLE_SIZE), bCol = blank % PUZZLE_SIZE;
    const isAdj = (Math.abs(row - bRow) + Math.abs(col - bCol)) === 1;
    if (!isAdj) return;
    const next = [...tiles];
    [next[idx], next[blank]] = [next[blank], next[idx]];
    setTiles(next);
    setMoves(m => m + 1);
    if (isSolved(next)) {
      setWon(true);
      const pts = Math.max(10, 60 - moves);
      addPoints(pts);
      markPlayed("puzzle");
      onEarn(pts);
    }
  };

  const reset = () => { setTiles(initPuzzle()); setMoves(0); setWon(false); };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#7dd3fc", fontSize: 13, marginBottom: 12 }}>Xếp lại thành hình hoàn chỉnh — Lượt: {moves}</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${PUZZLE_SIZE}, 72px)`, gap: 4, justifyContent: "center", margin: "0 auto 16px" }}>
        {tiles.map((tile, idx) => (
          <div
            key={idx}
            onClick={() => moveTile(idx)}
            style={{
              width: 72, height: 72, borderRadius: 10,
              background: tile === TOTAL_TILES - 1 ? "rgba(0,0,0,0.2)" : "linear-gradient(135deg,#1e3a5f,#1e40af)",
              border: tile === TOTAL_TILES - 1 ? "1.5px dashed #334155" : "1.5px solid #3b82f655",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, cursor: tile === TOTAL_TILES - 1 ? "default" : "pointer",
              boxShadow: tile === TOTAL_TILES - 1 ? "none" : "0 2px 8px #1e40af44",
              transition: "all 0.12s", userSelect: "none",
            }}
          >
            {tile !== TOTAL_TILES - 1 ? EMOJI_GRID[tile] : ""}
          </div>
        ))}
      </div>
      {won && <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: 10 }}>🎊 Hoàn thành! {moves} nước đi!</div>}
      <button style={btnStyle(NEON_COLORS.puzzle, false)} onClick={reset}>🔄 Chơi lại</button>
    </div>
  );
}

// ─── 6. Máy Slot Voucher ──────────────────────────────────────────────────────

const SLOT_SYMBOLS = ["🍜", "🥤", "🧁", "🌿", "🎁", "⭐"];

function SlotGame({ onEarn }) {
  const [reels, setReels] = useState([0, 1, 2]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [spins, setSpins] = useState(0);
  const intervalsRef = useRef([]);

  const pull = () => {
    if (spinning || spins >= 5) return;
    setSpinning(true);
    setResult(null);
    const delays = [0, 300, 600];
    const finals = delays.map(() => Math.floor(Math.random() * SLOT_SYMBOLS.length));

    delays.forEach((delay, ri) => {
      const iv = setInterval(() => {
        setReels(prev => {
          const n = [...prev];
          n[ri] = Math.floor(Math.random() * SLOT_SYMBOLS.length);
          return n;
        });
      }, 80);
      intervalsRef.current.push(iv);
      setTimeout(() => {
        clearInterval(iv);
        setReels(prev => { const n = [...prev]; n[ri] = finals[ri]; return n; });
        if (ri === 2) {
          setTimeout(() => {
            const [a, b, c] = finals;
            let msg = "", pts = 0;
            if (a === b && b === c) { msg = "🎰 JACKPOT! Voucher 50K!"; pts = 100; }
            else if (a === b || b === c || a === c) { msg = "✅ 2 giống nhau! Giảm 15%"; pts = 30; }
            else { msg = "😊 Chúc may mắn lần sau! +5 điểm"; pts = 5; }
            setResult({ msg, pts });
            setSpins(s => s + 1);
            setSpinning(false);
            addPoints(pts);
            markPlayed("slot");
            onEarn(pts);
          }, 200);
        }
      }, delay + 1200);
    });
  };

  const reset = () => { setReels([0,1,2]); setSpins(0); setResult(null); };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
        {reels.map((r, i) => (
          <div key={i} style={{
            width: 72, height: 80, borderRadius: 12,
            background: "linear-gradient(180deg,#1c1c2e,#16213e)",
            border: spinning ? "2px solid #f97316" : "2px solid #374151",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
            boxShadow: spinning ? "0 0 20px #f9731644" : "0 4px 12px #0006",
            transition: "border-color 0.1s, box-shadow 0.1s",
            overflow: "hidden",
          }}>
            {SLOT_SYMBOLS[r]}
          </div>
        ))}
      </div>
      {result && (
        <div style={{ background: "rgba(249,115,22,0.15)", border: "1.5px solid #f97316", borderRadius: 12, padding: "10px 16px", marginBottom: 14, color: "#fff", fontWeight: 600 }}>
          {result.msg}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button style={btnStyle(NEON_COLORS.slot, spinning || spins >= 5)} onClick={pull} disabled={spinning || spins >= 5}>
          🎰 {spins >= 5 ? "Hết lượt" : `Kéo! (còn ${5 - spins} lần)`}
        </button>
        <button style={{ ...btnStyle(NEON_COLORS.slot, false), background: "rgba(255,255,255,0.08)", boxShadow: "none" }} onClick={reset}>↩</button>
      </div>
    </div>
  );
}

// ─── 7. Đoán Giá ──────────────────────────────────────────────────────────────

const PRICE_ITEMS = [
  { name: "Tô hủ tiếu Nam Vang", emoji: "🍜", price: 45000 },
  { name: "Cà phê sữa đá", emoji: "☕", price: 25000 },
  { name: "1kg cá lóc tươi", emoji: "🐟", price: 75000 },
  { name: "Xôi gấc", emoji: "🍱", price: 20000 },
  { name: "Bánh mì thịt nướng", emoji: "🥖", price: 30000 },
  { name: "Nước dừa tươi", emoji: "🥥", price: 18000 },
  { name: "1kg chanh", emoji: "🍋", price: 28000 },
  { name: "Cơm tấm bì chả", emoji: "🍛", price: 55000 },
];

function PriceGame({ onEarn }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * PRICE_ITEMS.length));
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [count, setCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const check = () => {
    const guess = parseInt(input.replace(/\D/g, ""), 10);
    if (!guess) return;
    const actual = PRICE_ITEMS[idx].price;
    const diff = Math.abs(guess - actual) / actual;
    let msg = "", pts = 0;
    if (diff <= 0.05) { msg = "🎯 Chính xác! Trong 5%!"; pts = 50; }
    else if (diff <= 0.15) { msg = "✅ Rất gần! Trong 15%!"; pts = 30; }
    else if (diff <= 0.3) { msg = "😊 Chênh 30% — Bạn đoán khá!"; pts = 15; }
    else { msg = "😅 Chênh nhiều quá! Hãy thử lại!"; pts = 5; }
    setResult({ msg, pts, actual });
    setTotalScore(s => s + pts);
    setCount(c => c + 1);
    addPoints(pts);
    markPlayed("price");
    onEarn(pts);
  };

  const next = () => {
    setIdx(Math.floor(Math.random() * PRICE_ITEMS.length));
    setInput("");
    setResult(null);
  };

  const item = PRICE_ITEMS[idx];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
        <span style={{ color: "#6ee7b7" }}>Đã đoán: {count}</span>
        <span style={{ color: "#fbbf24" }}>Điểm: {totalScore}</span>
      </div>
      <div style={{ background: "rgba(67,233,123,0.1)", borderRadius: 14, padding: "16px", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 6 }}>{item.emoji}</div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{item.name}</div>
        <div style={{ color: "#9ca3af", fontSize: 12 }}>Ở Phú Tân giá bao nhiêu?</div>
      </div>
      {!result ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="Nhập giá (VNĐ)..."
            style={{
              flex: 1, background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(67,233,123,0.3)",
              borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 15,
              outline: "none",
            }}
          />
          <button style={btnStyle(NEON_COLORS.price, !input)} onClick={check} disabled={!input}>Đoán</button>
        </div>
      ) : (
        <div>
          <div style={{ background: "rgba(67,233,123,0.12)", border: "1.5px solid #43e97b", borderRadius: 12, padding: "12px 16px", marginBottom: 12, color: "#fff", fontWeight: 600 }}>
            {result.msg}<br />
            <span style={{ color: "#a3e635", fontSize: 13 }}>Giá thực: {result.actual.toLocaleString("vi-VN")}đ</span>
          </div>
          <button style={btnStyle(NEON_COLORS.price, false)} onClick={next}>➡ Câu tiếp</button>
        </div>
      )}
    </div>
  );
}

// ─── 8. Bảng Xếp Hạng Điểm Thưởng ───────────────────────────────────────────

const MOCK_LEADERBOARD = [
  { name: "Bà Hai Hoa", pts: 850, avatar: "👩" },
  { name: "Chú Ba Tài", pts: 720, avatar: "👨" },
  { name: "Cô Năm Lan", pts: 610, avatar: "👩‍🦳" },
  { name: "Anh Tư Bình", pts: 540, avatar: "🧑" },
  { name: "Em Sáu Ngọc", pts: 430, avatar: "👧" },
  { name: "Cô Bảy Hạnh", pts: 380, avatar: "👵" },
];

function LeaderboardGame() {
  const myPoints = getPoints();
  const played = getPlayed();
  const totalGames = Object.values(played).reduce((a, b) => a + b, 0);

  const board = [...MOCK_LEADERBOARD, { name: "Bạn", pts: myPoints, avatar: "⭐" }]
    .sort((a, b) => b.pts - a.pts);

  const myRank = board.findIndex(b => b.name === "Bạn") + 1;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "rgba(251,191,36,0.12)", border: "1.5px solid #fbbf24", borderRadius: 12, padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>⭐</div>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 22 }}>{myPoints}</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Điểm tích lũy</div>
        </div>
        <div style={{ background: "rgba(251,191,36,0.12)", border: "1.5px solid #fbbf24", borderRadius: 12, padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🎮</div>
          <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 22 }}>{totalGames}</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Lượt chơi</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {board.map((user, rank) => (
          <div key={rank} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: user.name === "Bạn" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
            border: user.name === "Bạn" ? "1.5px solid #fbbf24" : "1.5px solid transparent",
            borderRadius: 10, padding: "8px 12px",
          }}>
            <span style={{ fontWeight: 700, color: rank < 3 ? ["#ffd700","#c0c0c0","#cd7f32"][rank] : "#6b7280", width: 22, textAlign: "center", fontSize: 16 }}>
              {rank < 3 ? ["🥇","🥈","🥉"][rank] : `${rank+1}.`}
            </span>
            <span style={{ fontSize: 22 }}>{user.avatar}</span>
            <span style={{ flex: 1, color: user.name === "Bạn" ? "#fbbf24" : "#e5e7eb", fontWeight: user.name === "Bạn" ? 700 : 400 }}>{user.name}</span>
            <span style={{ color: "#fbbf24", fontWeight: 700 }}>{user.pts.toLocaleString()}đ</span>
          </div>
        ))}
      </div>
      {myRank > 0 && (
        <div style={{ textAlign: "center", marginTop: 12, color: "#9ca3af", fontSize: 12 }}>
          Bạn đang hạng #{myRank} — Chơi thêm để leo hạng! 🚀
        </div>
      )}
    </div>
  );
}

// ─── Game Definitions ─────────────────────────────────────────────────────────

const GAMES = [
  {
    id: "spin", emoji: "🎯", label: "Vòng Quay May Mắn",
    desc: "Quay vòng nhận voucher và ưu đãi mỗi ngày",
    tag: "F&B & Bán lẻ", tagColor: "#f7971e",
    colors: NEON_COLORS.spin,
    Component: SpinWheelGame,
  },
  {
    id: "memory", emoji: "🃏", label: "Lật Thẻ Trùng",
    desc: "Lật thẻ tìm cặp đôi — rèn luyện trí nhớ",
    tag: "F&B & Bán lẻ", tagColor: "#818cf8",
    colors: NEON_COLORS.memory,
    Component: MemoryGame,
  },
  {
    id: "quiz", emoji: "❓", label: "Đố Vui Ẩm Thực",
    desc: "Trắc nghiệm về ẩm thực và văn hoá miền Tây",
    tag: "F&B", tagColor: "#34d399",
    colors: NEON_COLORS.quiz,
    Component: QuizGame,
  },
  {
    id: "dice", emoji: "🎲", label: "Lắc Xúc Xắc Khuyến Mãi",
    desc: "Lắc dice để nhận ưu đãi ngẫu nhiên",
    tag: "Bán lẻ", tagColor: "#f472b6",
    colors: NEON_COLORS.dice,
    Component: DiceGame,
  },
  {
    id: "puzzle", emoji: "🧩", label: "Xếp Hình Sản Phẩm",
    desc: "Ghép ảnh món ăn/sản phẩm trong ít bước nhất",
    tag: "F&B", tagColor: "#38bdf8",
    colors: NEON_COLORS.puzzle,
    Component: PuzzleGame,
  },
  {
    id: "slot", emoji: "🎰", label: "Máy Slot Voucher",
    desc: "Kéo 3 cuộn khớp nhau để trúng jackpot",
    tag: "F&B & Bán lẻ", tagColor: "#fb923c",
    colors: NEON_COLORS.slot,
    Component: SlotGame,
  },
  {
    id: "price", emoji: "💰", label: "Đoán Giá",
    desc: "Đoán giá món ăn/sản phẩm địa phương gần đúng",
    tag: "F&B & Bán lẻ", tagColor: "#2dd4bf",
    colors: NEON_COLORS.price,
    Component: PriceGame,
  },
  {
    id: "board", emoji: "🏆", label: "Bảng Xếp Hạng",
    desc: "Xem tích điểm và thứ hạng của bạn",
    tag: "Tất cả", tagColor: "#fbbf24",
    colors: NEON_COLORS.board,
    Component: LeaderboardGame,
    noPoints: true,
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FnBGames() {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState(null);
  const [points, setPoints] = useState(getPoints);
  const [earnAnim, setEarnAnim] = useState(null);

  const handleEarn = useCallback((pts) => {
    setPoints(getPoints());
    setEarnAnim(pts);
    setTimeout(() => setEarnAnim(null), 2000);
  }, []);

  const game = GAMES.find(g => g.id === activeGame);

  return (
    <>
      <Helmet>
        <title>Game Tích Điểm – Phú Tân 67K1 | Vui chơi & Nhận ưu đãi</title>
        <meta name="description" content="Mini-game gamification cho ngành F&B và bán lẻ Phú Tân: vòng quay may mắn, lật thẻ trùng, đố vui ẩm thực, slot voucher và nhiều trò chơi hấp dẫn." />
      </Helmet>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 40%, #1a0a2e 100%)",
        color: "#e5e7eb",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(10,10,26,0.85)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => activeGame ? setActiveGame(null) : navigate(-1)}
              style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4 }}
            >
              ←
            </button>
            <span style={{ fontWeight: 700, fontSize: 17 }}>
              {game ? `${game.emoji} ${game.label}` : "🎮 Game Tích Điểm"}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(251,191,36,0.12)", border: "1.5px solid #fbbf2466",
              borderRadius: 99, padding: "5px 14px",
              fontWeight: 700, color: "#fbbf24", fontSize: 14,
            }}>
              ⭐ {points} điểm
            </div>
            {earnAnim && (
              <div style={{
                position: "absolute", top: -28, right: 0,
                color: "#34d399", fontWeight: 700, fontSize: 14,
                animation: "floatUp 2s ease forwards",
                whiteSpace: "nowrap", pointerEvents: "none",
              }}>
                +{earnAnim} điểm!
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-32px); }
          }
          @keyframes gameCardHover {
            from { transform: translateY(0) scale(1); }
            to { transform: translateY(-4px) scale(1.02); }
          }
          @keyframes shimmerBg {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Active game view */}
        {activeGame && game ? (
          <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
            {/* Game description */}
            <div style={{
              background: `linear-gradient(135deg, ${game.colors.from}18, ${game.colors.to}18)`,
              border: `1.5px solid ${game.colors.from}33`,
              borderRadius: 16, padding: "14px 18px", marginBottom: 20,
            }}>
              <div style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.6 }}>{game.desc}</div>
            </div>
            {/* Game component */}
            <div style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 20,
              border: "1.5px solid rgba(255,255,255,0.08)",
              padding: "24px 20px",
              boxShadow: `0 8px 40px ${game.colors.glow}18`,
              animation: "fadeInUp 0.3s ease",
            }}>
              <game.Component onEarn={game.noPoints ? () => {} : handleEarn} />
            </div>

            {/* Point info */}
            {!game.noPoints && (
              <div style={{ textAlign: "center", marginTop: 14, color: "#6b7280", fontSize: 12 }}>
                💡 Điểm tích lũy lưu trên thiết bị — Dùng để đổi ưu đãi tại cửa hàng
              </div>
            )}
          </div>
        ) : (
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 48px" }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeInUp 0.4s ease" }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🎮</div>
              <h1 style={{ fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, margin: "0 0 8px", background: "linear-gradient(90deg, #fbbf24, #f97316, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Game Tích Điểm
              </h1>
              <p style={{ color: "#9ca3af", fontSize: 15, margin: 0, maxWidth: 400, marginInline: "auto" }}>
                Vui chơi — tích điểm — đổi ưu đãi F&B & bán lẻ mỗi ngày 🎁
              </p>

              {/* Quick stats */}
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Game miễn phí", value: "8", emoji: "🎯" },
                  { label: "Điểm của bạn", value: points, emoji: "⭐" },
                  { label: "Lượt đã chơi", value: Object.values(getPlayed()).reduce((a, b) => a + b, 0), emoji: "🎲" },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "12px 20px",
                    border: "1.5px solid rgba(255,255,255,0.1)", textAlign: "center", minWidth: 100,
                  }}>
                    <div style={{ fontSize: 22 }}>{s.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: "#fbbf24" }}>{s.value}</div>
                    <div style={{ color: "#6b7280", fontSize: 11 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
              {GAMES.map((g, i) => (
                <div
                  key={g.id}
                  onClick={() => setActiveGame(g.id)}
                  style={{
                    ...gameCardStyle(g.colors),
                    animation: `fadeInUp ${0.2 + i * 0.06}s ease both`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.025)";
                    e.currentTarget.style.boxShadow = `0 16px 48px ${g.colors.glow}44`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = `0 4px 24px ${g.colors.glow}22`;
                  }}
                >
                  {/* Glow accent */}
                  <div style={{
                    position: "absolute", top: -30, right: -30,
                    width: 120, height: 120, borderRadius: "50%",
                    background: `radial-gradient(circle, ${g.colors.from}44 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }} />

                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 36 }}>{g.emoji}</span>
                      <span style={{
                        background: g.tagColor + "33", color: g.tagColor,
                        fontSize: 10, fontWeight: 700, padding: "3px 8px",
                        borderRadius: 99, border: `1px solid ${g.tagColor}55`,
                        letterSpacing: "0.04em",
                      }}>
                        {g.tag}
                      </span>
                    </div>
                    <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>{g.label}</h3>
                    <p style={{ margin: "0 0 16px", fontSize: 13, color: "#9ca3af", lineHeight: 1.5 }}>{g.desc}</p>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: `linear-gradient(135deg, ${g.colors.from}, ${g.colors.to})`,
                      borderRadius: 10, padding: "7px 16px",
                      fontWeight: 700, fontSize: 13, color: "#fff",
                      boxShadow: `0 4px 16px ${g.colors.glow}44`,
                    }}>
                      Chơi ngay →
                    </div>
                    {getPlayed()[g.id] > 0 && (
                      <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 11 }}>
                        Đã chơi {getPlayed()[g.id]} lần
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{
              marginTop: 40, textAlign: "center",
              background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(249,115,22,0.1))",
              border: "1.5px solid rgba(251,191,36,0.25)", borderRadius: 20, padding: "24px 20px",
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎁</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#fbbf24" }}>Đổi điểm lấy ưu đãi thật!</h3>
              <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 16px" }}>
                Tích đủ 100 điểm → Nhận voucher giảm giá tại quán F&B và cửa hàng bán lẻ tham gia
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#6b7280" }}>
                <span>100đ → Voucher 5K</span>
                <span>•</span>
                <span>300đ → Voucher 20K</span>
                <span>•</span>
                <span>500đ → Free item</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
