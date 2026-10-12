import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, getRegionWorldObjects, getTileType } from "./mockData";

export const EDITOR_MAP_KEY = "muanuocnoi-editor-map-v1";

export const editorPalette = [
  { type: "house", label: "Nhà mái ngói", category: "Công trình", icon: "⌂", w: 3, h: 2, color: "#c47d55", collidable: true },
  { type: "stilt-house", label: "Nhà sàn", category: "Công trình", icon: "⌂", w: 3, h: 2, color: "#9b6a47", collidable: true },
  { type: "shop", label: "Cửa hàng", category: "Công trình", icon: "CHỢ", w: 3, h: 2, color: "#b94f43", collidable: true },
  { type: "warehouse", label: "Kho nông sản", category: "Công trình", icon: "KHO", w: 3, h: 2, color: "#76553f", collidable: true },
  { type: "school", label: "Phòng học", category: "Công trình", icon: "ABC", w: 4, h: 2, color: "#d49b45", collidable: true },
  { type: "tree", label: "Cây xoài", category: "Cây cối", icon: "♣", w: 1, h: 1, color: "#47703c", collidable: true },
  { type: "palm", label: "Dừa nước", category: "Cây cối", icon: "♠", w: 1, h: 2, color: "#527b45", collidable: true },
  { type: "rice", label: "Ruộng lúa", category: "Nông nghiệp", icon: "///", w: 4, h: 3, color: "#9b9140", collidable: false },
  { type: "pond", label: "Ao cá", category: "Nông nghiệp", icon: "≈", w: 4, h: 3, color: "#4e91a6", collidable: true },
  { type: "garden", label: "Vườn rau", category: "Nông nghiệp", icon: "≋", w: 3, h: 3, color: "#648445", collidable: false },
  { type: "boat", label: "Ghe tam bản", category: "Sông nước", icon: "◢", w: 2, h: 1, color: "#795039", collidable: true },
  { type: "dock", label: "Cầu ván", category: "Sông nước", icon: "═", w: 3, h: 1, color: "#815a38", collidable: false },
  { type: "bridge", label: "Cầu gỗ", category: "Sông nước", icon: "═", w: 4, h: 1, color: "#8a623e", collidable: false },
  { type: "lamp", label: "Đèn đường", category: "Tiện ích", icon: "♦", w: 1, h: 1, color: "#e8b755", collidable: true },
  { type: "bench", label: "Ghế đá", category: "Tiện ích", icon: "▰", w: 2, h: 1, color: "#837667", collidable: true },
  { type: "fence", label: "Hàng rào", category: "Tiện ích", icon: "╫", w: 3, h: 1, color: "#80613f", collidable: true },
];

export function getDefaultEditorMap() {
  return getRegionWorldObjects("phu-lam").map((object) => ({
    ...object,
    baseId: object.id,
    label: object.name,
    offsetX: 0,
    offsetY: 0,
    collidable: !["field", "ferry"].includes(object.type),
    interactive: true,
  }));
}

export function normalizeEditorMap(objects) {
  return objects.map((object) => {
    const effectiveX = object.x + (object.offsetX || 0) / TILE_SIZE;
    const effectiveY = object.y + (object.offsetY || 0) / TILE_SIZE;
    const crossesRoad = (x, y) => {
      for (let tileX = Math.floor(x); tileX < Math.ceil(x + object.w); tileX++) {
        for (let tileY = Math.floor(y); tileY < Math.ceil(y + object.h); tileY++) {
          if (getTileType(tileX, tileY, "phu-lam") === "road") return true;
        }
      }
      return false;
    };
    if (!crossesRoad(effectiveX, effectiveY)) return object;
    for (let radius = 1; radius <= Math.max(MAP_WIDTH, MAP_HEIGHT); radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
          const x = Math.max(0, Math.min(MAP_WIDTH - object.w, object.x + dx));
          const y = Math.max(0, Math.min(MAP_HEIGHT - object.h, object.y + dy));
          if (!crossesRoad(x, y)) return { ...object, x, y, offsetX: 0, offsetY: 0 };
        }
      }
    }
    return object;
  });
}

export function loadEditorMap() {
  try {
    const data = JSON.parse(localStorage.getItem(EDITOR_MAP_KEY) || "null");
    if (!Array.isArray(data?.objects) || !data.objects.length) return getDefaultEditorMap();
    const saved = normalizeEditorMap(data.objects);
    // Dữ liệu editor cũ chỉ lưu vật thể thêm mới; ghép chúng lên nền mặc định.
    return saved.some((object) => object.baseId) ? saved : [...getDefaultEditorMap(), ...saved];
  } catch {
    return getDefaultEditorMap();
  }
}

export function saveEditorMap(objects) {
  const payload = { version: 2, mapId: "phu-lam", baseLayout: true, savedAt: new Date().toISOString(), objects: normalizeEditorMap(objects) };
  localStorage.setItem(EDITOR_MAP_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("mnn-map-updated", { detail: payload }));
  return payload;
}

export function createEditorObject(template, x, y) {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: template.type,
    label: template.label,
    icon: template.icon,
    x,
    y,
    offsetX: 0,
    offsetY: 0,
    w: template.w,
    h: template.h,
    color: template.color,
    collidable: template.collidable,
    interactive: true,
  };
}
