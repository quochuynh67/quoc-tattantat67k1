import { create } from "zustand";
import { FERRY_FARE, getSafeArrivalPosition, inventoryItems, initialMessages } from "./mockData";

const SAVE_KEY = "muanuocnoi-save";
const defaults = {
  player: { name: "Nguyễn Minh An", role: "Nông dân tập sự", x: 12, y: 11, money: 1280, energy: 92, reputation: 36, level: 3 },
  day: 12,
  time: "06:30",
  weather: "Mưa nhẹ",
  waterLevel: 2.4,
  regionId: "phu-lam",
  inventory: inventoryItems,
  farmStage: 0,
  questProgress: 0,
  completedQuests: [],
  messages: initialMessages,
};

function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    return saved ? { ...defaults, ...saved } : defaults;
  } catch {
    return defaults;
  }
}

function persist(state) {
  const { toast, ...saveable } = state;
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveable));
}

export const useMuaNuocNoiStore = create((set, get) => ({
  ...loadSave(),
  toast: "",
  movePlayer: (x, y) => set((state) => {
    return { player: { ...state.player, x, y }, toast: "" };
  }),
  relocatePlayer: (x, y) => set((state) => {
    const next = { ...state, player: { ...state.player, x, y }, toast: "Đã đưa bạn về vị trí an toàn." };
    persist(next);
    return next;
  }),
  savePosition: () => persist(get()),
  notify: (toast) => set({ toast }),
  clearToast: () => set({ toast: "" }),
  interactNpc: (npcId) => set((state) => {
    const progress = npcId === "bay" && state.questProgress === 0 ? 1 : state.questProgress;
    const next = { ...state, questProgress: progress, reputation: state.reputation, toast: progress > state.questProgress ? "Đã cập nhật: Gặp chú Bảy" : state.toast };
    persist(next);
    return next;
  }),
  farm: () => set((state) => {
    if (state.player.energy < 8) return { toast: "Bạn cần nghỉ ngơi để hồi năng lượng." };
    const stage = Math.min(5, state.farmStage + 1);
    const labels = ["", "Đã cuốc đất", "Đã gieo giống", "Ruộng đã được tưới", "Lúa đã lớn sau một ngày", "Thu hoạch 8 bó lúa!"];
    const inventory = stage === 5
      ? [...state.inventory.filter((item) => item.id !== "harvest"), { id: "harvest", name: "Lúa vừa gặt", icon: "🌾", qty: 8, value: 42 }]
      : state.inventory;
    const next = {
      ...state,
      farmStage: stage,
      questProgress: Math.max(state.questProgress, stage + 1),
      player: { ...state.player, energy: state.player.energy - 8 },
      inventory,
      toast: labels[stage],
    };
    persist(next);
    return next;
  }),
  buy: (item) => set((state) => {
    if (state.player.money < item.buy) return { toast: "Bạn chưa đủ xu." };
    const existing = state.inventory.find((entry) => entry.id === item.id);
    const inventory = existing
      ? state.inventory.map((entry) => entry.id === item.id ? { ...entry, qty: entry.qty + 1 } : entry)
      : [...state.inventory, { id: item.id, name: item.name, icon: item.icon, qty: 1, value: item.sell }];
    const next = { ...state, inventory, player: { ...state.player, money: state.player.money - item.buy }, toast: `Đã mua ${item.name}` };
    persist(next);
    return next;
  }),
  sell: (item) => set((state) => {
    const existing = state.inventory.find((entry) => entry.id === item.id && entry.qty > 0);
    if (!existing) return { toast: `Bạn không có ${item.name} để bán.` };
    const inventory = state.inventory.map((entry) => entry.id === item.id ? { ...entry, qty: entry.qty - 1 } : entry).filter((entry) => entry.qty > 0);
    const next = { ...state, inventory, player: { ...state.player, money: state.player.money + item.sell }, toast: `Đã bán ${item.name} +${item.sell} xu` };
    persist(next);
    return next;
  }),
  sendMessage: (text) => set((state) => {
    const next = { ...state, messages: [...state.messages, { id: Date.now(), channel: "Khu vực", name: "Minh An", text, time: state.time }] };
    persist(next);
    return next;
  }),
  nextDay: () => set((state) => {
    const weathers = ["Nắng", "Mưa nhẹ", "Mưa lớn"];
    const weather = weathers[(state.day + 1) % weathers.length];
    const next = { ...state, day: state.day + 1, time: "06:10", weather, waterLevel: weather === "Mưa lớn" ? 3.1 : weather === "Mưa nhẹ" ? 2.5 : 2.2, farmStage: state.farmStage === 3 ? 4 : state.farmStage, player: { ...state.player, energy: 100 }, toast: `Ngày mới bắt đầu · ${weather}` };
    persist(next);
    return next;
  }),
  takeJob: (job) => set((state) => {
    const next = { ...state, player: { ...state.player, money: state.player.money + job.pay, energy: Math.max(0, state.player.energy - 18) }, toast: `Hoàn thành ca ${job.title} · +${job.pay} xu` };
    persist(next);
    return next;
  }),
  travelToRegion: (region) => set((state) => {
    if (state.player.money < region.travelCost) return { toast: "Bạn chưa đủ xu cho chuyến đi này." };
    const arrival = getSafeArrivalPosition(region.id, 12, 11);
    const next = {
      ...state,
      regionId: region.id,
      player: { ...state.player, x: arrival.x, y: arrival.y, money: state.player.money - region.travelCost },
      toast: `Đã đến xã ${region.name}${region.travelCost ? ` · -${region.travelCost} xu` : ""}`,
    };
    persist(next);
    return next;
  }),
  warpToRegion: (region, x, y, fare = FERRY_FARE) => set((state) => {
    if (state.player.money < fare) return { toast: `Bạn cần ${fare} xu để qua đò.` };
    const next = {
      ...state,
      regionId: region.id,
      player: { ...state.player, x, y, money: state.player.money - fare },
      toast: fare ? `Đã qua đò đến xã ${region.name} · -${fare} xu` : `Đã đi đường bộ đến xã ${region.name}`,
    };
    persist(next);
    return next;
  }),
  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    set({ ...defaults, toast: "Đã tạo hành trình mới." });
  },
}));
