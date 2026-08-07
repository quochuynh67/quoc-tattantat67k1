// src/pages/KidsBrainLab.jsx - Góc Rèn Luyện Trí Nào & Trị Liệu Cho Bé
import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import {
  playPopSound,
  playDingSound,
  playFanfareSound,
  playWrongSound,
  speakText,
  stopSpeech,
} from "../utils/kidsAudio";
import { generateKidsExercise } from "../lib/agentApi";

// ── Built-in Fallback Exercises Bank ──────────────────────────────────────────

const OFFLINE_EMOTION_EXERCISES = [
  {
    title: "Nhận Diện Nụ Cười",
    question: "Bạn Bo vừa được mẹ thưởng một chiếc bánh ngon. Bạn Bo cảm thấy thế nào?",
    hint: "Hãy nhìn khuôn mặt bạn Bo đang tươi cười rạng rỡ nè!",
    explanation: "Đúng rồi! Khi được thưởng bánh ngon, bạn Bo cảm thấy RẤT VUI VẺ! 🥳",
    audioText: "Bạn Bo vừa được mẹ thưởng bánh ngon. Bạn Bo cảm thấy thế nào hả bé?",
    options: [
      { id: "A", label: "😄 Vui vẻ & Hạnh phúc", isCorrect: true },
      { id: "B", label: "😢 Buồn khóc", isCorrect: false },
      { id: "C", label: "😡 Giận dữ", isCorrect: false },
    ],
  },
  {
    title: "Ứng Xử Khi Bạn Té Pain",
    question: "Bé thấy bạn Miu lỡ bị vấp té đau ở sân trường. Bé nên làm gì nè?",
    hint: "Hãy thể hiện sự quan tâm và giúp đỡ bạn nhé!",
    explanation: "Bé ngoan lắm! Đỡ bạn đứng dậy và hỏi thăm là hành động đầy lòng nhân ái! ❤️",
    audioText: "Bạn Miu lỡ vấp té đau. Bé nên làm gì để giúp bạn nè?",
    options: [
      { id: "A", label: "🏃 Chạy đỡ bạn dậy và hỏi thăm", isCorrect: true },
      { id: "B", label: "😆 Cười chọc bạn", isCorrect: false },
      { id: "C", label: "🚶 Bỏ đi không quan tâm", isCorrect: false },
    ],
  },
  {
    title: "Bình Tĩnh Khi Tức Giận",
    question: "Khi bạn lấy mất đồ chơi của bé, làm sao để bé bình tĩnh lại?",
    hint: "Hít thở sâu 3 lần hoặc nhờ sự trợ giúp của người lớn nè.",
    explanation: "Tuyệt vời! Hít thở sâu giúp trái tim và bộ não của bé luôn bình tĩnh sáng suốt! 🧘‍♂️",
    audioText: "Khi bị lấy đồ chơi, làm sao để bé bình tĩnh lại nè?",
    options: [
      { id: "A", label: "🌬️ Hít thở sâu và nói chuyện hòa nhã", isCorrect: true },
      { id: "B", label: "💥 Giật lại và la lớn", isCorrect: false },
      { id: "C", label: "😭 Nằm khóc ăn vạ", isCorrect: false },
    ],
  },
  {
    title: "Chia Sẻ Đồ Chơi Cùng Bạn",
    question: "Bạn Tèo rất thích chiếc ô tô đỏ của bé và xin chơi chung. Bé sẽ làm gì?",
    hint: "Cùng chơi chung sẽ vui gấp đôi đó bé ơi!",
    explanation: "Hoan hô bé! Chia sẻ đồ chơi giúp bé có thêm nhiều bạn tốt! 🤝",
    audioText: "Bạn Tèo xin chơi chung đồ chơi. Bé sẽ làm gì nè?",
    options: [
      { id: "A", label: "🏎️ Cho bạn chơi chung vui vẻ", isCorrect: true },
      { id: "B", label: "🙅 Giấu đồ chơi đi", isCorrect: false },
      { id: "C", label: "😠 Đẩy bạn ra xa", isCorrect: false },
    ],
  },
  {
    title: "Ứng Xử Khi Nghe Tiếng Sấm",
    question: "Trời mưa to có tiếng sấm đùng đùng làm bé lo sợ. Bé nên làm gì?",
    hint: "Tìm vòng tay ấm áp của ba mẹ hoặc người lớn nhé!",
    explanation: "Đúng rồi! Ôm ba mẹ giúp bé cảm thấy an toàn và không còn sợ nữa! 🫂",
    audioText: "Trời mưa có tiếng sấm to làm bé sợ. Bé nên làm gì nè?",
    options: [
      { id: "A", label: "🫂 Ôm ba mẹ và hít thở nhẹ nhàng", isCorrect: true },
      { id: "B", label: "🏃 Chạy ra ngoài mưa", isCorrect: false },
      { id: "C", label: "La hét hoảng sợ", isCorrect: false },
    ],
  },
  {
    title: "Lễ Phép Nói Lời Cảm Ơn",
    question: "Được ông bà tặng cho bé món quà sinh nhật thật đẹp, bé nên nói gì?",
    hint: "Câu nói ngoan ngoãn thể hiện sự kính trọng với ông bà.",
    explanation: "Giỏi quá! Nói lời cảm ơn chân thành làm ông bà rất vui lòng! 💖",
    audioText: "Được tặng quà sinh nhật đẹp, bé nên nói gì nè?",
    options: [
      { id: "A", label: "💖 Dạ cháu cảm ơn ông bà ạ!", isCorrect: true },
      { id: "B", label: "Im lặng lấy quà", isCorrect: false },
      { id: "C", label: "Chê quà nhỏ", isCorrect: false },
    ],
  },
  {
    title: "Dũng Cảm Xin Lỗi",
    question: "Lỡ tay làm đổ ly nước ra sàn nhà, bé nên ứng xử thế nào?",
    hint: "Nhận lỗi dũng cảm và cùng dọn dẹp sạch sẽ.",
    explanation: "Bé rất dũng cảm! Biết nhận lỗi và sửa sai là bé ngoan tuyệt vời! 👏",
    audioText: "Lỡ tay làm đổ ly nước, bé nên ứng xử thế nào?",
    options: [
      { id: "A", label: "🙇 Xin lỗi và nhờ ba mẹ cùng dọn", isCorrect: true },
      { id: "B", label: "Chạy trốn mất", isCorrect: false },
      { id: "C", label: "Đổ lỗi cho mèo", isCorrect: false },
    ],
  },
  {
    title: "Chăm Sóc Vệ Sinh Bản Thân",
    question: "Trước khi ngồi vào bàn ăn cơm ngon lành, bé phải làm gì trước?",
    hint: "Giữ đôi tay luôn sạch khuẩn bảo vệ sức khỏe.",
    explanation: "Chính xác! Rửa tay xà phòng giúp bé đánh bay vi khuẩn bẩn! 🧼",
    audioText: "Trước khi ăn cơm ngon lành, bé phải làm gì trước nè?",
    options: [
      { id: "A", label: "🧼 Rửa tay sạch bằng xà phòng", isCorrect: true },
      { id: "B", label: "Ăn luôn bằng tay bẩn", isCorrect: false },
      { id: "C", label: "Lau tay vào quần", isCorrect: false },
    ],
  },
  {
    title: "Lắng Nghe & Tuân Thủ",
    question: "Khi cô giáo đang kể chuyện cổ tích cho cả lớp nghe, bé nên làm gì?",
    hint: "Giữ trật tự lắng nghe để hiểu câu chuyện hay.",
    explanation: "Tuyên dương bé! Lắng nghe tôn trọng cô giáo và các bạn! 📖",
    audioText: "Khi cô giáo kể chuyện cổ tích, bé nên làm gì nè?",
    options: [
      { id: "A", label: "🤫 Ngồi yên lặng lắng nghe", isCorrect: true },
      { id: "B", label: "Nói chuyện riêng ồn ào", isCorrect: false },
      { id: "C", label: "Chạy nhảy trong lớp", isCorrect: false },
    ],
  },
];

const OFFLINE_PATTERN_EXERCISES = [
  {
    title: "Tìm Quy Luật Trái Cây",
    question: "Điền hình còn thiếu vào dấu hỏi chấm (?): 🍎 🍌 🍎 🍌 ❓",
    hint: "Quy luật lặp lại: Táo rồi đến Chuối...",
    explanation: "Đúng rồi! Tiếp theo phải là quả Táo 🍎!",
    audioText: "Điền hình còn thiếu vào dấu hỏi chấm: Táo, Chuối, Táo, Chuối, rồi tới gì?",
    options: [
      { id: "A", label: "🍎 Quả Táo", isCorrect: true },
      { id: "B", label: "🍌 Quả Chuối", isCorrect: false },
      { id: "C", label: "🍇 Quả Nho", isCorrect: false },
    ],
  },
  {
    title: "Quy Luật Màu Sắc",
    question: "Điền hình còn thiếu: 🔴 🔵 🔴 🔵 ❓",
    hint: "Đỏ rồi đến Xanh Dương...",
    explanation: "Chính xác! Tiếp theo là hình tròn Đỏ 🔴!",
    audioText: "Đỏ, Xanh Dương, Đỏ, Xanh Dương, tiếp theo là màu gì?",
    options: [
      { id: "A", label: "🔴 Tròn Đỏ", isCorrect: true },
      { id: "B", label: "🔵 Tròn Xanh", isCorrect: false },
      { id: "C", label: "🟡 Tròn Vàng", isCorrect: false },
    ],
  },
  {
    title: "Đếm Số Ngôi Sao",
    question: "Bé hãy đếm xem trên trời có bao nhiêu ngôi sao tỏa sáng: ⭐ ⭐ ⭐",
    hint: "Hãy đếm 1, 2, 3...",
    explanation: "Giỏi quá! Có đúng 3 ngôi sao vàng rực rỡ! 🌟",
    audioText: "Bé hãy đếm xem có bao nhiêu ngôi sao tỏa sáng trên màn hình nè?",
    options: [
      { id: "A", label: "3️⃣ Có 3 ngôi sao", isCorrect: true },
      { id: "B", label: "2️⃣ Có 2 ngôi sao", isCorrect: false },
      { id: "C", label: "5️⃣ Có 5 ngôi sao", isCorrect: false },
    ],
  },
  {
    title: "Dãy Số Liên Tiếp",
    question: "Điền số còn thiếu vào vị trí trống: 1, 2, 3, 4, ❓",
    hint: "Số tiếp theo ngay sau số 4 là gì nè?",
    explanation: "Chính xác! Đếm liên tiếp 1, 2, 3, 4 rồi tới 5! ✋",
    audioText: "Một, hai, ba, bốn, tiếp theo là số mấy bé ơi?",
    options: [
      { id: "A", label: "5️⃣ Số 5", isCorrect: true },
      { id: "B", label: "6️⃣ Số 6", isCorrect: false },
      { id: "C", label: "0️⃣ Số 0", isCorrect: false },
    ],
  },
  {
    title: "So Sánh Kích Thước",
    question: "Trong hai quả dưới đây, quả nào TO HƠN: Quả Dưa Hấu 🍉 hay Quả Dâu 🍓?",
    hint: "Dưa hấu rất to nặng, dâu tây xinh xắn nho nhỏ.",
    explanation: "Đúng rồi! Quả dưa hấu 🍉 to hơn quả dâu tây 🍓 rất nhiều!",
    audioText: "Quả dưa hấu và quả dâu tây, quả nào to hơn nè?",
    options: [
      { id: "A", label: "🍉 Quả Dưa Hấu (To hơn)", isCorrect: true },
      { id: "B", label: "🍓 Quả Dâu (To hơn)", isCorrect: false },
      { id: "C", label: "Bằng nhau", isCorrect: false },
    ],
  },
  {
    title: "Nhận Diện Hình Khối",
    question: "Hình nào có 3 góc nhọn xinh xắn và 3 cạnh thẳng?",
    hint: "Hình giống mái nhà hoặc miếng bánh pizza 🍕",
    explanation: "Tuyệt vời! Đó chính là Hình Tam Giác 🔺!",
    audioText: "Hình nào có 3 góc nhọn xinh xắn và 3 cạnh thẳng nè?",
    options: [
      { id: "A", label: "🔺 Hình Tam Giác", isCorrect: true },
      { id: "B", label: "🔴 Hình Tròn", isCorrect: false },
      { id: "C", label: "🟦 Hình Vuông", isCorrect: false },
    ],
  },
  {
    title: "Quy Luật Ngày & Đêm",
    question: "Ban ngày có Mặt Trời ☀️ tỏa sáng ấm áp. Ban đêm bầu trời có gì?",
    hint: "Vật tỏa sáng dịu êm vào ban đêm cùng vô số ngôi sao.",
    explanation: "Đúng rồi! Ban đêm có Mặt Trăng 🌙 xinh đẹp!",
    audioText: "Ban ngày có Mặt Trời tỏa sáng, ban đêm bầu trời có gì bé ơi?",
    options: [
      { id: "A", label: "🌙 Mặt Trăng & Ngôi sao", isCorrect: true },
      { id: "B", label: "☀️ Mặt Trời chói chang", isCorrect: false },
      { id: "C", label: "🌈 Cầu phồng rực rỡ", isCorrect: false },
    ],
  },
];

// ── PECS Communication Cards ──────────────────────────────────────────────────

const PECS_CARDS = [
  { id: 1, label: "Uống nước", emoji: "🥛", color: "#E0F7FA", text: "Con muốn uống nước" },
  { id: 2, label: "Ăn cơm", emoji: "🍚", color: "#FFF8E1", text: "Con đói bụng, con muốn ăn cơm" },
  { id: 3, label: "Đi vệ sinh", emoji: "🚽", color: "#E8EAF6", text: "Con muốn đi vệ sinh" },
  { id: 4, label: "Đi ngủ", emoji: "🛌", color: "#EDE7F6", text: "Con buồn ngủ rồi" },
  { id: 5, label: "Muốn ôm", emoji: "🫂", color: "#FCE4EC", text: "Con muốn được ôm" },
  { id: 6, label: "Bị đau", emoji: "🩹", color: "#FFEBEE", text: "Con bị đau ở đây" },
  { id: 7, label: "Rất vui", emoji: "😊", color: "#E8F5E9", text: "Con đang rất vui" },
  { id: 8, label: "Cần yên tĩnh", emoji: "🤫", color: "#E0F2F1", text: "Con muốn không gian yên tĩnh" },
  { id: 9, label: "Đi chơi", emoji: "🎈", color: "#FFF3E0", text: "Con muốn đi ra ngoài chơi" },
  { id: 10, label: "Bật nhạc", emoji: "🎵", color: "#F3E5F5", text: "Con muốn nghe nhạc nhẹ" },
  { id: 11, label: "Xin lỗi", emoji: "🙏", color: "#FFF9C4", text: "Con xin lỗi ạ" },
  { id: 12, label: "Cảm ơn", emoji: "💖", color: "#F8BBD0", text: "Con cảm ơn ba mẹ rất nhiều" },
  { id: 13, label: "Giúp con", emoji: "🆘", color: "#FFCCBC", text: "Ba mẹ ơi giúp con với" },
  { id: 14, label: "Nóng quá", emoji: "🥵", color: "#FFE0B2", text: "Con cảm thấy nóng quá" },
  { id: 15, label: "Lạnh quá", emoji: "🥶", color: "#B2EBF2", text: "Con cảm thấy lạnh quá" },
  { id: 16, label: "Xem hoạt hình", emoji: "📺", color: "#D1C4E9", text: "Con muốn xem phim hoạt hình" },
  { id: 17, label: "Vẽ tranh", emoji: "🎨", color: "#DCEDC8", text: "Con muốn vẽ tranh tô màu" },
  { id: 18, label: "Tắm rửa", emoji: "🛁", color: "#B2DFDB", text: "Con muốn đi tắm rửa sạch sẽ" },
  { id: 19, label: "Kể chuyện", emoji: "📖", color: "#F0F4C3", text: "Con muốn nghe ba mẹ kể chuyện cổ tích" },
  { id: 20, label: "Con yêu ba mẹ", emoji: "❤️", color: "#FFCDD2", text: "Con yêu ba mẹ nhiều lắm" },
];

// ── Memory Game Card Decks ────────────────────────────────────────────────────

const MEMORY_THEMES = {
  animals: [
    { name: "Mèo", emoji: "🐱" },
    { name: "Chó", emoji: "🐶" },
    { name: "Thỏ", emoji: "🐰" },
    { name: "Vịt", emoji: "🦆" },
    { name: "Voi", emoji: "🐘" },
    { name: "Hổ", emoji: "🐯" },
  ],
  fruits: [
    { name: "Dưa hấu", emoji: "🍉" },
    { name: "Xoài", emoji: "🥭" },
    { name: "Dừa", emoji: "🥥" },
    { name: "Chuối", emoji: "🍌" },
    { name: "Dâu", emoji: "🍓" },
    { name: "Cam", emoji: "🍊" },
  ],
  phutan: [
    { name: "Bông sen", emoji: "🪷" },
    { name: "Cây lúa", emoji: "🌾" },
    { name: "Thuyền cá", emoji: "🛶" },
    { name: "Cá lóc", emoji: "🐟" },
    { name: "Nón lá", emoji: "👒" },
    { name: "Mặt trời", emoji: "☀️" },
  ],
  vehicles: [
    { name: "Xe hơi", emoji: "🚗" },
    { name: "Xe buýt", emoji: "🚌" },
    { name: "Máy bay", emoji: "✈️" },
    { name: "Tàu hỏa", emoji: "🚂" },
    { name: "Xe đạp", emoji: "🚲" },
    { name: "Tàu thủy", emoji: "🚢" },
  ],
  shapes: [
    { name: "Hình tròn", emoji: "🔴" },
    { name: "Hình vuông", emoji: "🟦" },
    { name: "Tam giác", emoji: "🔺" },
    { name: "Ngôi sao", emoji: "⭐" },
    { name: "Trái tim", emoji: "💖" },
    { name: "Mặt trăng", emoji: "🌙" },
  ],
};

export default function KidsBrainLab() {
  const [activeTab, setActiveTab] = useState("memory"); // 'memory' | 'therapy' | 'sensory' | 'pecs'
  const [ageGroup, setAgeGroup] = useState("3-5");
  const [stars, setStars] = useState(() => {
    return parseInt(localStorage.getItem("kids_brain_stars") || "12", 10);
  });
  const [completedCount, setCompletedCount] = useState(() => {
    return parseInt(localStorage.getItem("kids_brain_count") || "5", 10);
  });

  // Sound & voice state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ── 1. Memory Game State ───────────────────────────────────────────────────
  const [memoryTheme, setMemoryTheme] = useState("animals");
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [memoryVictory, setMemoryVictory] = useState(false);

  // Initialize Memory Game
  const initMemoryGame = (themeKey = memoryTheme) => {
    const themeItems = MEMORY_THEMES[themeKey] || MEMORY_THEMES.animals;
    const duplicated = [...themeItems, ...themeItems];
    const shuffled = duplicated
      .map((item) => ({ ...item, id: Math.random() }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setMemoryVictory(false);
  };

  useEffect(() => {
    initMemoryGame(memoryTheme);
  }, [memoryTheme]);

  const handleCardClick = (index) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedPairs.includes(index)) {
      return;
    }

    if (soundEnabled) playPopSound();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        // Match!
        if (soundEnabled) playDingSound();
        const newMatched = [...matchedPairs, firstIdx, secondIdx];
        setMatchedPairs(newMatched);
        setFlippedIndices([]);

        if (newMatched.length === cards.length) {
          // Victory!
          setMemoryVictory(true);
          if (soundEnabled) playFanfareSound();
          addStars(5);
        }
      } else {
        // No match - flip back
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // ── 2. AI Therapy & Logic Exercise State ─────────────────────────────────────
  const [exerciseCategory, setExerciseCategory] = useState("emotion");
  const [currentExercise, setCurrentExercise] = useState(OFFLINE_EMOTION_EXERCISES[0]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [exerciseResult, setExerciseResult] = useState(null); // 'correct' | 'wrong'
  const [aiLoading, setAiLoading] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);

  const handleOptionSelect = (option) => {
    setSelectedOption(option.id);
    if (option.isCorrect) {
      setExerciseResult("correct");
      if (soundEnabled) playDingSound();
      if (soundEnabled) speakText(currentExercise.explanation);
      addStars(3);
    } else {
      setExerciseResult("wrong");
      if (soundEnabled) playWrongSound();
    }
  };

  const handleNextExercise = () => {
    setSelectedOption(null);
    setExerciseResult(null);
    stopSpeech();

    const bank = exerciseCategory === "emotion" ? OFFLINE_EMOTION_EXERCISES : OFFLINE_PATTERN_EXERCISES;
    const nextIdx = (exerciseIndex + 1) % bank.length;
    setExerciseIndex(nextIdx);
    setCurrentExercise(bank[nextIdx]);
  };

  const handleGenerateAiExercise = async () => {
    setAiLoading(true);
    setSelectedOption(null);
    setExerciseResult(null);
    stopSpeech();

    try {
      const data = await generateKidsExercise(exerciseCategory, ageGroup, "Dễ");
      setCurrentExercise(data);
      if (soundEnabled && data.audioText) {
        speakText(data.audioText);
      }
    } catch (err) {
      console.warn("AI generation failed, cycling offline exercises:", err);
      handleNextExercise();
    } finally {
      setAiLoading(false);
    }
  };

  // ── 3. Sensory Calming Sandbox State ─────────────────────────────────────────
  const [breathPhase, setBreathPhase] = useState("Hít vào..."); // 'Hít vào...' | 'Giữ nhịp...' | 'Thở ra...'
  const [bubbles, setBubbles] = useState([
    { id: 1, x: 20, y: 30, size: 60, color: "#FF9A9E" },
    { id: 2, x: 70, y: 20, size: 80, color: "#FECFEF" },
    { id: 3, x: 40, y: 60, size: 70, color: "#A1C4FD" },
    { id: 4, x: 85, y: 70, size: 65, color: "#C2E9FB" },
    { id: 5, x: 15, y: 80, size: 75, color: "#D4FC79" },
  ]);

  // Breathing loop timer
  useEffect(() => {
    if (activeTab !== "sensory") return;
    const phases = [
      { text: "🌬️ Hít vào từ từ...", duration: 4000 },
      { text: "😌 Giữ nhịp thở...", duration: 4000 },
      { text: "💨 Thở ra nhẹ nhàng...", duration: 4000 },
    ];
    let current = 0;
    setBreathPhase(phases[0].text);

    const interval = setInterval(() => {
      current = (current + 1) % phases.length;
      setBreathPhase(phases[current].text);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handlePopBubble = (id) => {
    if (soundEnabled) playPopSound();
    setBubbles((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
            ...b,
            x: Math.floor(Math.random() * 80) + 10,
            y: Math.floor(Math.random() * 70) + 15,
          }
          : b
      )
    );
    addStars(1);
  };

  // ── Helper to add stars & update local storage ────────────────────────────────
  const addStars = (amount) => {
    setStars((prev) => {
      const next = prev + amount;
      localStorage.setItem("kids_brain_stars", next.toString());
      return next;
    });
    setCompletedCount((prev) => {
      const next = prev + 1;
      localStorage.setItem("kids_brain_count", next.toString());
      return next;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F0F4FF 0%, #E8EEFF 100%)", paddingBottom: 60 }}>
      <Helmet>
        <title>Góc Rèn Luyện Trí Nào & Trị Liệu Cho Bé — Tất Tần Tật Phú Tân</title>
        <meta name="description" content="Vô tận game rèn luyện trí não, bài tập trí tuệ cảm xúc và trị liệu tự kỷ (ASD) hỗ trợ phát triển toàn diện cho trẻ em." />
      </Helmet>

      {/* Hero Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #6C5CE7 0%, #a29bfe 50%, #74B9FF 100%)",
          color: "#fff",
          padding: "36px 20px 28px",
          borderRadius: "0 0 32px 32px",
          boxShadow: "0 10px 30px rgba(108, 92, 231, 0.25)",
        }}
      >
        <div className="container" style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 20, fontSize: "0.85rem", fontWeight: 600, marginBottom: 8, backdropFilter: "blur(4px)" }}>
                <span>🐰 Thầy Thỏ AI Đồng Hành</span>
              </div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                Góc Rèn Trí Não & Trị Liệu Cho Bé 🎈
              </h1>
              <p style={{ margin: "6px 0 0", opacity: 0.95, fontSize: "0.95rem" }}>
                Trò chơi vô tận phát triển tư duy + Bài tập trị liệu tự kỷ & cảm xúc cho trẻ em
              </p>
            </div>

            {/* Stats Badge Bar */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "rgba(255,255,255,0.25)", padding: "10px 18px", borderRadius: 16, backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.5rem" }}>⭐</span>
                <div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.85, fontWeight: 700 }}>Ngôi sao</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{stars}</div>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.25)", padding: "10px 18px", borderRadius: 16, backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.5rem" }}>🔥</span>
                <div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.85, fontWeight: 700 }}>Đã hoàn thành</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{completedCount}</div>
                </div>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
                style={{
                  background: "rgba(255,255,255,0.25)",
                  border: "none",
                  borderRadius: 16,
                  padding: "12px",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                {soundEnabled ? "🔊" : "🔇"}
              </button>
            </div>
          </div>

          {/* Age Selection & Filters */}
          <div style={{ marginTop: 24, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, opacity: 0.9 }}>Độ tuổi:</span>
            {["3-5", "6-8", "9-12"].map((age) => (
              <button
                key={age}
                onClick={() => setAgeGroup(age)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  border: "none",
                  background: ageGroup === age ? "#FDCB6E" : "rgba(255,255,255,0.2)",
                  color: ageGroup === age ? "#2D3436" : "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  transition: "all 0.2s ease",
                }}
              >
                {age} tuổi
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container" style={{ maxWidth: 1000, margin: "24px auto 0", padding: "0 16px" }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { id: "memory", label: "🧩 Lật Thẻ Ghi Nhớ", color: "#FF6B6B" },
            { id: "therapy", label: "😃 Trị Liệu Cảm Xúc AI", color: "#4ECDC4" },
            { id: "sensory", label: "🌬️ Điều Hòa Cảm Giác", color: "#A8E6CF" },
            { id: "pecs", label: "🗣️ Thẻ Giao Tiếp PECS", color: "#FFD166" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  stopSpeech();
                }}
                style={{
                  padding: "14px 16px",
                  borderRadius: 18,
                  border: "none",
                  background: isActive ? tab.color : "#fff",
                  color: isActive ? (tab.id === "pecs" ? "#2D3436" : "#fff") : "#4A5568",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 8px 20px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
                  transform: isActive ? "scale(1.02)" : "none",
                  transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: MEMORY GAME ───────────────────────────────────────────── */}
        {activeTab === "memory" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#2D3436" }}>🧩 Trò Chơi Lật Thẻ Ghi Nhớ</h2>
                <p style={{ margin: "4px 0 0", color: "#636E72", fontSize: "0.88rem" }}>
                  Rèn luyện trí nhớ ngắn hạn và thị giác cho trẻ.
                </p>
              </div>

              {/* Theme Selector */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { key: "animals", label: "🐱 Động vật" },
                  { key: "fruits", label: "🍉 Trái cây" },
                  { key: "phutan", label: "🪷 Phú Tân" },
                  { key: "vehicles", label: "🚗 Xe cộ" },
                  { key: "shapes", label: "🔴 Hình khối" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setMemoryTheme(t.key)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 12,
                      border: "1px solid #DFE6E9",
                      background: memoryTheme === t.key ? "#6C5CE7" : "#F8F9FA",
                      color: memoryTheme === t.key ? "#fff" : "#2D3436",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Victory Celebration */}
            {memoryVictory && (
              <div
                style={{
                  background: "linear-gradient(135deg, #FFEAA7 0%, #FAB1A0 100%)",
                  padding: 20,
                  borderRadius: 20,
                  textAlign: "center",
                  marginBottom: 20,
                  animation: "popIn 0.4s ease",
                }}
              >
                <div style={{ fontSize: "2.5rem" }}>🎉 🥳 🎉</div>
                <h3 style={{ margin: "8px 0 4px", color: "#D63031", fontSize: "1.4rem" }}>Bé Đã Thắng Rồi! Hoan Hô!</h3>
                <p style={{ margin: 0, color: "#636E72", fontWeight: 600 }}>
                  Bé hoàn thành trong {moves} lượt lật! Nhận ngay 5 Ngôi Sao ⭐
                </p>
                <button
                  onClick={() => initMemoryGame()}
                  style={{
                    marginTop: 12,
                    padding: "10px 24px",
                    background: "#00B894",
                    color: "#fff",
                    border: "none",
                    borderRadius: 14,
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                  }}
                >
                  🔄 Chơi Lại Ván Mới
                </button>
              </div>
            )}

            {/* Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: 16,
              }}
            >
              {cards.map((card, idx) => {
                const isFlipped = flippedIndices.includes(idx) || matchedPairs.includes(idx);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    style={{
                      height: 120,
                      borderRadius: 18,
                      border: "none",
                      background: isFlipped
                        ? matchedPairs.includes(idx)
                          ? "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)"
                          : "#fff"
                        : "linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)",
                      boxShadow: isFlipped ? "0 4px 12px rgba(0,0,0,0.08)" : "0 8px 16px rgba(108,92,231,0.2)",
                      cursor: "pointer",
                      fontSize: isFlipped ? "2.8rem" : "1.8rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      transform: isFlipped ? "rotateY(180deg)" : "none",
                    }}
                  >
                    {isFlipped ? (
                      <span style={{ transform: "rotateY(180deg)" }}>{card.emoji}</span>
                    ) : (
                      <span style={{ opacity: 0.8 }}>❓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: AI THERAPY & EMOTION EXERCISES ────────────────────────── */}
        {activeTab === "therapy" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            {/* Category Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#2D3436" }}>😃 Trị Liệu Trí Tuệ Cảm Xúc & Logic AI</h2>
                <p style={{ margin: "4px 0 0", color: "#636E72", fontSize: "0.88rem" }}>
                  Bài tập nhận diện cảm xúc & tình huống ứng xử xã hội dành cho trẻ em.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    setExerciseCategory("emotion");
                    setCurrentExercise(OFFLINE_EMOTION_EXERCISES[0]);
                    setSelectedOption(null);
                    setExerciseResult(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: exerciseCategory === "emotion" ? "#FF7675" : "#F8F9FA",
                    color: exerciseCategory === "emotion" ? "#fff" : "#2D3436",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  😃 Cảm Xúc
                </button>
                <button
                  onClick={() => {
                    setExerciseCategory("pattern");
                    setCurrentExercise(OFFLINE_PATTERN_EXERCISES[0]);
                    setSelectedOption(null);
                    setExerciseResult(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: exerciseCategory === "pattern" ? "#0984E3" : "#F8F9FA",
                    color: exerciseCategory === "pattern" ? "#fff" : "#2D3436",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  🧩 Quy Luật Logic
                </button>
              </div>
            </div>

            {/* Question Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #F9F9FF 0%, #F0F4FF 100%)",
                border: "2px solid #E2E8F0",
                borderRadius: 20,
                padding: 24,
                marginBottom: 20,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ background: "#6C5CE7", color: "#fff", padding: "4px 12px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>
                  {currentExercise.title}
                </span>

                <button
                  onClick={() => speakText(currentExercise.question)}
                  style={{
                    background: "#E0E7FF",
                    border: "none",
                    color: "#4338CA",
                    padding: "6px 14px",
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  🔊 Cô Út Đọc Đố Bé Nghe 🌺
                </button>
              </div>

              <h3 style={{ fontSize: "1.25rem", color: "#1E293B", margin: "0 0 12px", lineHeight: 1.5 }}>
                {currentExercise.question}
              </h3>

              {currentExercise.hint && (
                <div style={{ fontSize: "0.88rem", color: "#D97706", background: "#FEF3C7", padding: "10px 14px", borderRadius: 12, fontWeight: 600 }}>
                  💡 Gợi ý: {currentExercise.hint}
                </div>
              )}
            </div>

            {/* Options Grid */}
            <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
              {currentExercise.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                let bg = "#fff";
                let borderColor = "#E2E8F0";

                if (isSelected) {
                  if (opt.isCorrect) {
                    bg = "#DCFCE7";
                    borderColor = "#22C55E";
                  } else {
                    bg = "#FEE2E2";
                    borderColor = "#EF4444";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 16,
                      border: `2px solid ${borderColor}`,
                      background: bg,
                      color: "#1E293B",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Result Feedback Banner */}
            {exerciseResult === "correct" && (
              <div style={{ background: "#DCFCE7", color: "#166534", padding: 16, borderRadius: 16, marginBottom: 20, fontWeight: 700 }}>
                {currentExercise.explanation}
              </div>
            )}

            {exerciseResult === "wrong" && (
              <div style={{ background: "#FEE2E2", color: "#991B1B", padding: 16, borderRadius: 16, marginBottom: 20, fontWeight: 700 }}>
                😅 Gần đúng rồi! Bé chọn lại thử xem nè!
              </div>
            )}

            {/* Controls Bar */}
            <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
              <button
                onClick={handleNextExercise}
                style={{
                  padding: "12px 24px",
                  borderRadius: 14,
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  color: "#334155",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                ➡️ Bài Tiếp Theo
              </button>

              <button
                onClick={handleGenerateAiExercise}
                disabled={aiLoading}
                style={{
                  padding: "12px 28px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: aiLoading ? "wait" : "pointer",
                  boxShadow: "0 6px 16px rgba(108,92,231,0.3)",
                  opacity: aiLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {aiLoading ? "🤖 AI Đang Tải Bài..." : "✨ Sinh Bài Tập AI Mới"}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: SENSORY CALMING SANDBOX ───────────────────────────────── */}
        {activeTab === "sensory" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", color: "#2D3436" }}>🌬️ Góc Điều Hòa Cảm Giác & Bình Tĩnh</h2>
            <p style={{ margin: "0 0 24px", color: "#636E72", fontSize: "0.88rem" }}>
              Giúp trẻ tự kỷ giải tỏa căng thẳng, tập trung điều hòa nhịp thở và thị giác.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {/* Breathing Circle Component */}
              <div
                style={{
                  background: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
                  borderRadius: 20,
                  padding: 32,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 280,
                }}
              >
                <h3 style={{ margin: "0 0 16px", color: "#0369A1", fontSize: "1.1rem" }}>🧘 Vòng Thở Bình Tĩnh (4-4-4)</h3>

                <div
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: "rgba(14, 165, 233, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0369A1",
                    fontWeight: 800,
                    fontSize: "1rem",
                    boxShadow: "0 0 40px rgba(14, 165, 233, 0.5)",
                    transition: "all 4s ease-in-out",
                    animation: "pulseBreathing 8s infinite ease-in-out",
                  }}
                >
                  <span style={{ textAlign: "center", padding: 10 }}>{breathPhase}</span>
                </div>
              </div>

              {/* Calming Bubble Sandbox */}
              <div
                style={{
                  background: "linear-gradient(135deg, #FCE7F3 0%, #F472B6 100%)",
                  borderRadius: 20,
                  padding: 20,
                  minHeight: 280,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <h3 style={{ margin: "0 0 8px", color: "#9D174D", fontSize: "1.1rem" }}>🫧 Đập Bong Bóng Thư Giãn</h3>
                <p style={{ margin: "0 0 16px", color: "#BE185D", fontSize: "0.82rem" }}>
                  Chạm nhẹ vào các bong bóng màu sắc để nghe âm thanh dịu êm.
                </p>

                <div style={{ position: "relative", width: "100%", height: 200 }}>
                  {bubbles.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handlePopBubble(b.id)}
                      style={{
                        position: "absolute",
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: b.size,
                        height: b.size,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 30% 30%, #fff, ${b.color})`,
                        border: "none",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "all 0.5s ease",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: PECS COMMUNICATION CARDS ─────────────────────────────── */}
        {activeTab === "pecs" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", color: "#2D3436" }}>🗣️ Thẻ Giao Tiếp Biểu Tượng PECS</h2>
            <p style={{ margin: "0 0 24px", color: "#636E72", fontSize: "0.88rem" }}>
              Hỗ trợ trẻ không nói hoặc hạn chế ngôn ngữ dễ dàng thể hiện cảm xúc & nhu cầu với cha mẹ.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 16,
              }}
            >
              {PECS_CARDS.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    if (soundEnabled) playPopSound();
                    speakText(card.text);
                  }}
                  style={{
                    background: card.color,
                    borderRadius: 20,
                    border: "2px solid rgba(0,0,0,0.04)",
                    padding: "20px 14px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                    transition: "transform 0.2s ease, boxShadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)";
                  }}
                >
                  <span style={{ fontSize: "3rem", marginBottom: 8 }}>{card.emoji}</span>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "#2D3436" }}>{card.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "#636E72", marginTop: 4 }}>🔊 Chạm để phát âm</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes pulseBreathing {
          0% { transform: scale(1); }
          50% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
