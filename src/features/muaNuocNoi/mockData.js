export const TILE_SIZE = 24;
export const MAP_WIDTH = 42;
export const MAP_HEIGHT = 30;
export const FERRY_FARE = 15;

export const regionalLocations = [
  { id: "phu-lam", name: "Phú Lâm", center: "Khu vực Phú Hòa B", distance: "Điểm xuất phát", travelCost: 0, color: "#d69a43", formedFrom: "Phú Lâm · Long Hòa · Phú Long", description: "Vùng nông nghiệp ven sông Cái Vừng, kênh rạch và ruộng lúa đan xen.", zones: ["Phú Hòa A", "Phú Hòa B", "Phú Thuận A", "Phú Thuận B", "Phú Lợi", "Tân Phú", "Long Hòa", "Phú Long"] },
  { id: "phu-tan", name: "Phú Tân", center: "Khu vực Phú Mỹ", distance: "Khoảng 25 phút", travelCost: 20, color: "#bd7345", formedFrom: "Phú Mỹ · Tân Hòa · Tân Trung · Phú Hưng", description: "Trung tâm giao thương và dịch vụ của khu vực Phú Tân cũ.", zones: ["Phú Mỹ", "Tân Hòa", "Tân Trung", "Phú Hưng"] },
  { id: "phu-an", name: "Phú An", center: "Khu vực Phú An", distance: "Khoảng 35 phút", travelCost: 25, color: "#75934d", formedFrom: "Phú An · Phú Thọ · Phú Xuân", description: "Không gian sản xuất nông nghiệp nối các vùng Phú An, Phú Thọ và Phú Xuân.", zones: ["Phú An", "Phú Thọ", "Phú Xuân"] },
  { id: "binh-thanh-dong", name: "Bình Thạnh Đông", center: "Khu vực Bình Thạnh Đông", distance: "Khoảng 40 phút", travelCost: 30, color: "#7b8f68", formedFrom: "Bình Thạnh Đông · Phú Bình · Hiệp Xương", description: "Vùng đồng ruộng, làng nghề và các tuyến kênh nội đồng.", zones: ["Bình Thạnh Đông", "Phú Bình", "Hiệp Xương"] },
  { id: "cho-vam", name: "Chợ Vàm", center: "Khu vực Chợ Vàm", distance: "Khoảng 30 phút", travelCost: 25, color: "#b45845", formedFrom: "Chợ Vàm · Phú Thạnh · Phú Thành", description: "Khu chợ, dịch vụ ven sông và đầu mối trao đổi nông sản.", zones: ["Chợ Vàm", "Phú Thạnh", "Phú Thành"] },
  { id: "hoa-lac", name: "Hòa Lạc", center: "Khu vực Hòa Lạc", distance: "Khoảng 35 phút", travelCost: 25, color: "#7d8450", formedFrom: "Hòa Lạc · Phú Hiệp", description: "Vùng sản xuất lúa gắn với hệ thống kênh và công trình thủy lợi.", zones: ["Hòa Lạc", "Phú Hiệp"] },
];

export const regionMapConfigs = {
  "phu-lam": { shift: { x: 0, y: 0 }, water: "west", roadX: 17, roadY: 11, portals: { north: "phu-tan", east: "cho-vam", south: "phu-an", west: "hoa-lac" } },
  "phu-tan": { shift: { x: 5, y: 3 }, water: "south", roadX: 20, roadY: 14, portals: { north: "hoa-lac", east: "phu-lam", south: "binh-thanh-dong", west: "phu-an" } },
  "phu-an": { shift: { x: 2, y: 6 }, water: "east", roadX: 14, roadY: 12, portals: { north: "phu-lam", east: "cho-vam", south: "binh-thanh-dong", west: "phu-tan" } },
  "binh-thanh-dong": { shift: { x: 7, y: 5 }, water: "north", roadX: 23, roadY: 16, portals: { north: "phu-tan", east: "phu-an", south: "hoa-lac", west: "cho-vam" } },
  "cho-vam": { shift: { x: 8, y: 2 }, water: "south", roadX: 21, roadY: 10, portals: { north: "phu-lam", east: "binh-thanh-dong", south: "phu-an", west: "hoa-lac" } },
  "hoa-lac": { shift: { x: 3, y: 5 }, water: "north", roadX: 16, roadY: 15, portals: { north: "phu-lam", east: "phu-tan", south: "binh-thanh-dong", west: "cho-vam" } },
};

export const getRegionFerryPlacement = (regionId) => {
  const config = regionMapConfigs[regionId] || regionMapConfigs["phu-lam"];
  if (config.water === "west") return { x: 4, y: config.roadY + 2 };
  if (config.water === "east") return { x: MAP_WIDTH - 6, y: config.roadY + 2 };
  if (config.water === "north") return { x: config.roadX, y: 3 };
  return { x: config.roadX, y: MAP_HEIGHT - 5 };
};

export const getRegionBoatmanPosition = (regionId) => {
  const config = regionMapConfigs[regionId] || regionMapConfigs["phu-lam"];
  const ferry = getRegionFerryPlacement(regionId);
  if (config.water === "west") return { x: ferry.x + 2.4, y: ferry.y + 0.5 };
  if (config.water === "east") return { x: ferry.x - 0.8, y: ferry.y + 0.5 };
  if (config.water === "north") return { x: ferry.x + 0.5, y: ferry.y + 2.4 };
  return { x: ferry.x + 0.5, y: ferry.y - 0.8 };
};

export const getRegionPortals = (regionId) => {
  const config = regionMapConfigs[regionId] || regionMapConfigs["phu-lam"];
  return [
    { direction: "north", label: "BẮC", targetId: config.portals.north, x: 20.5, y: 0.35, spawnX: 20.5, spawnY: MAP_HEIGHT - 2.5, requiresFerry: config.water === "north" },
    { direction: "east", label: "ĐÔNG", targetId: config.portals.east, x: MAP_WIDTH - 1.35, y: 14.5, spawnX: 2.5, spawnY: 14.5, requiresFerry: config.water === "east" },
    { direction: "south", label: "NAM", targetId: config.portals.south, x: 20.5, y: MAP_HEIGHT - 1.35, spawnX: 20.5, spawnY: 2.5, requiresFerry: config.water === "south" },
    { direction: "west", label: "TÂY", targetId: config.portals.west, x: 0.35, y: 14.5, spawnX: MAP_WIDTH - 2.5, spawnY: 14.5, requiresFerry: config.water === "west" },
  ];
};

export const worldObjects = [
  { id: "home", type: "house", name: "Nhà An · Phú Hòa B", x: 9, y: 9, w: 3, h: 2, icon: "⌂", color: "#c78f62", entry: { x: 10.5, y: 11 } },
  { id: "market", type: "market", name: "Chợ Phú Lâm", x: 15, y: 5, w: 4, h: 3, icon: "CHỢ", color: "#b8463b", entry: { x: 17, y: 8 } },
  { id: "dinh", type: "temple", name: "Nhà văn hóa Phú Lâm", x: 24, y: 4, w: 3, h: 2, icon: "VH", color: "#a84b38", entry: { x: 25, y: 6 } },
  { id: "school", type: "school", name: "Trường Phú Lâm", x: 23, y: 13, w: 4, h: 2, icon: "TRƯỜNG", color: "#d59b45", entry: { x: 25, y: 15 } },
  { id: "clinic", type: "clinic", name: "Trạm Y tế Phú Lâm", x: 14, y: 16, w: 3, h: 2, icon: "+", color: "#e4ddd0", entry: { x: 15, y: 18 } },
  { id: "police", type: "police", name: "Điểm hỗ trợ hành chính", x: 19, y: 16, w: 3, h: 2, icon: "HC", color: "#7f9bad", entry: { x: 20, y: 18 } },
  { id: "cafe", type: "cafe", name: "Cà phê cuối xóm", x: 20, y: 9, w: 3, h: 2, icon: "☕", color: "#8f5f3e", entry: { x: 21, y: 11 } },
  { id: "warehouse", type: "warehouse", name: "Kho nông sản", x: 28, y: 8, w: 3, h: 3, icon: "KHO", color: "#7a5a43" },
  { id: "ferry", type: "ferry", name: "Bến sông Cái Vừng", x: 5, y: 15, w: 2, h: 2, icon: "ĐÒ", color: "#7a482f" },
  { id: "pump", type: "pump", name: "Trạm bơm", x: 27, y: 18, w: 2, h: 2, icon: "BƠM", color: "#68746a" },
  { id: "field", type: "field", name: "Ruộng của An", x: 10, y: 14, w: 4, h: 4, icon: "", color: "#9b7947" },
  { id: "field-east", type: "field", name: "Ruộng phía Đông", x: 27, y: 12, w: 4, h: 4, icon: "", color: "#c0a14c" },
  { id: "pond", type: "pond", name: "Ao cá nhà Chú Bảy", x: 7, y: 3, w: 4, h: 3, icon: "≈", color: "#4e91a6" },
];

const overlapsRect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function getRegionWorldObjects(regionId) {
  const config = regionMapConfigs[regionId] || regionMapConfigs["phu-lam"];
  const placed = [];
  const isValid = (object, x, y) => {
    if (x < 0 || y < 0 || x + object.w > MAP_WIDTH || y + object.h > MAP_HEIGHT) return false;
    for (let tileX = x; tileX < x + object.w; tileX++) {
      for (let tileY = y; tileY < y + object.h; tileY++) {
        const tile = getTileType(tileX, tileY, regionId);
        if (tile === "road" || tile === "water") return false;
      }
    }
    return !placed.some((other) => overlapsRect({ ...object, x, y }, other));
  };

  for (const object of worldObjects) {
    if (object.type === "ferry") {
      placed.push({ ...object, ...getRegionFerryPlacement(regionId) });
      continue;
    }
    const desiredX = object.x + config.shift.x;
    const desiredY = object.y + config.shift.y;
    let position = null;
    for (let radius = 0; radius <= Math.max(MAP_WIDTH, MAP_HEIGHT) && !position; radius++) {
      for (let dy = -radius; dy <= radius && !position; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
          const x = desiredX + dx;
          const y = desiredY + dy;
          if (isValid(object, x, y)) { position = { x, y }; break; }
        }
      }
    }
    const target = position || { x: Math.max(0, Math.min(MAP_WIDTH - object.w, desiredX)), y: Math.max(0, Math.min(MAP_HEIGHT - object.h, desiredY)) };
    const entryOffset = object.entry ? { x: object.entry.x - object.x, y: object.entry.y - object.y } : null;
    placed.push({ ...object, ...target, entry: entryOffset ? { x: target.x + entryOffset.x, y: target.y + entryOffset.y } : undefined });
  }
  return placed;
}

export const npcs = [
  { id: "bay", name: "Chú Bảy", role: "Nông dân", x: 13, y: 12, color: "#d8a35e", dialogue: "Con ruộng mới về làng hả? Chú để sẵn ít giống lúa. Ra ruộng làm thử nghen!" },
  { id: "sau", name: "Cô Sáu", role: "Tiểu thương", x: 17, y: 9, color: "#c66a72", dialogue: "Chợ hôm nay cá linh được giá lắm. Có nông sản cứ đem cô thu mua." },
  { id: "tam", name: "Chú Tám Đò", role: "Lái đò", x: 6, y: 14, color: "#7594a2", dialogue: "Con nước đang lên. Mai muốn qua cồn thì ghé chú từ sớm." },
  { id: "lan", name: "Y tá Lan", role: "Y tế", x: 15, y: 15, color: "#f1e8d8", dialogue: "Đi mưa nhớ giữ ấm. Trạm đang cần người chuyển thuốc qua xóm rạch." },
  { id: "thay", name: "Thầy Thành", role: "Giáo viên", x: 25, y: 16, color: "#7f735f", dialogue: "Trường sắp mở lớp an toàn đường sông cho tụi nhỏ, em ghé phụ nhé." },
  { id: "hoa", name: "Chị Hòa", role: "Công an xã", x: 20, y: 19, color: "#627f91", dialogue: "Mùa nước về, xã cần thêm người hỗ trợ điểm sơ tán và tìm người lạc." },
  { id: "ut", name: "Út Mận", role: "Thợ sửa xe", x: 22, y: 12, color: "#85604a", dialogue: "Chiếc máy bơm ngoài ruộng kêu lạ lắm. Rảnh thì mình đi coi chung." },
];

export const nearbyPlayers = [
  { id: "p1", name: "Hải Đăng", x: 12, y: 7, color: "#688cc4" },
  { id: "p2", name: "Ngọc Hân", x: 20, y: 6, color: "#c46f94" },
  { id: "p3", name: "Minh Triết", x: 8, y: 18, color: "#7c9c61" },
  { id: "p4", name: "Kim Oanh", x: 29, y: 17, color: "#ad6f51" },
];

export function getRegionMapEntities(regionId) {
  const objects = getRegionWorldObjects(regionId);
  const occupied = new Set();
  objects.filter((object) => object.type !== "ferry").forEach((object) => {
    for (let x = object.x; x < object.x + object.w; x++) for (let y = object.y; y < object.y + object.h; y++) occupied.add(`${x},${y}`);
  });
  getRegionVegetation(regionId).forEach((plant) => occupied.add(`${plant.x},${plant.y}`));
  const placePeople = (people) => people.map((person) => {
    const desired = person.id === "tam" ? getRegionBoatmanPosition(regionId) : person;
    const startX = Math.round(desired.x);
    const startY = Math.round(desired.y);
    for (let radius = 0; radius <= Math.max(MAP_WIDTH, MAP_HEIGHT); radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
          const x = startX + dx;
          const y = startY + dy;
          if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue;
          const tile = getTileType(x, y, regionId);
          if (tile === "road" || tile === "water" || occupied.has(`${x},${y}`)) continue;
          occupied.add(`${x},${y}`);
          return { ...person, x, y };
        }
      }
    }
    return person;
  });
  const placedNpcs = placePeople(npcs);
  const placedPlayers = placePeople(nearbyPlayers);
  return { npcs: placedNpcs, nearbyPlayers: placedPlayers };
}

export function getRegionVegetation(regionId) {
  const regionIndex = Math.max(0, regionalLocations.findIndex((region) => region.id === regionId));
  const occupied = new Set();
  getRegionWorldObjects(regionId).forEach((object) => {
    for (let x = Math.floor(object.x); x < Math.ceil(object.x + object.w); x++) for (let y = Math.floor(object.y); y < Math.ceil(object.y + object.h); y++) occupied.add(`${x},${y}`);
  });
  const species = [
    { type: "banana", name: "Bụi chuối", icon: "♣", color: "#6f943f" },
    { type: "coconut", name: "Cây dừa", icon: "♠", color: "#477644" },
    { type: "water-coconut", name: "Dừa nước", icon: "✹", color: "#527b45" },
    { type: "mango", name: "Cây xoài", icon: "♣", color: "#4e783b" },
    { type: "bamboo", name: "Bụi tre", icon: "╫", color: "#6f8741" },
  ];
  const plants = [];
  for (let step = 0; step < 180 && plants.length < 30; step++) {
    const x = 2 + ((step * 11 + regionIndex * 7) % (MAP_WIDTH - 4));
    const y = 2 + ((step * 17 + regionIndex * 5) % (MAP_HEIGHT - 4));
    const tile = getTileType(x, y, regionId);
    if (tile === "road" || tile === "water" || occupied.has(`${x},${y}`)) continue;
    if (getRegionPortals(regionId).some((portal) => Math.hypot(portal.x - x, portal.y - y) < 2.5)) continue;
    const template = species[(step + regionIndex) % species.length];
    occupied.add(`${x},${y}`);
    plants.push({ id: `plant-${regionId}-${plants.length}`, ...template, x, y });
  }
  return plants;
}

export function getSafeArrivalPosition(regionId, preferredX, preferredY) {
  const occupied = new Set();
  getRegionWorldObjects(regionId).filter((object) => object.type !== "ferry").forEach((object) => {
    for (let x = object.x; x < object.x + object.w; x++) for (let y = object.y; y < object.y + object.h; y++) occupied.add(`${x},${y}`);
  });
  getRegionVegetation(regionId).forEach((plant) => occupied.add(`${plant.x},${plant.y}`));
  const portals = getRegionPortals(regionId);
  const startX = Math.round(preferredX);
  const startY = Math.round(preferredY);
  for (let radius = 0; radius <= Math.max(MAP_WIDTH, MAP_HEIGHT); radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
        const x = startX + dx;
        const y = startY + dy;
        if (x < 1 || x >= MAP_WIDTH - 1 || y < 1 || y >= MAP_HEIGHT - 1) continue;
        if (getTileType(x, y, regionId) === "water" || occupied.has(`${x},${y}`)) continue;
        if (portals.some((portal) => Math.hypot(portal.x - x, portal.y - y) < 1.8)) continue;
        return { x, y };
      }
    }
  }
  return { x: 12, y: 11 };
}

export const quests = [
  { id: "first-field", kind: "Chính tuyến", title: "Mảnh ruộng đầu tiên", description: "Khôi phục thửa ruộng ông bà để lại.", objectives: ["Gặp chú Bảy", "Cuốc đất", "Gieo hạt", "Tưới nước", "Thu hoạch"], reward: "350 xu · 20 uy tín" },
  { id: "medicine", kind: "Nhiệm vụ phụ", title: "Thuốc qua xóm rạch", description: "Giúp y tá Lan chuyển thuốc trước khi mưa lớn.", objectives: ["Gặp y tá Lan", "Mang thuốc đến bến đò"], reward: "180 xu · 8 uy tín" },
  { id: "lamp", kind: "Nhiệm vụ ẩn", title: "Ngọn đèn ngoài bến", description: "Một ánh đèn chập chờn xuất hiện lúc đêm mưa.", objectives: ["Đến bến đò lúc trời tối", "Tìm người cầm đèn"], reward: "Kỷ vật cũ · 15 uy tín", hidden: true },
];

export const initialMessages = [
  { id: 1, channel: "Phú Lâm", name: "Cô Sáu", text: "Chợ Phú Lâm mới về mớ cá linh tươi nghen bà con!", time: "06:24" },
  { id: 2, channel: "Liên xã", name: "Hải Đăng", text: "Ai phụ kiểm tra bờ bao phía Phú Long chiều nay không?", time: "06:27" },
  { id: 3, channel: "Phú Lâm", name: "Chú Tám Đò", text: "Bến Cái Vừng chuyến sớm còn hai chỗ.", time: "06:29" },
];

export const inventoryItems = [
  { id: "seed", name: "Giống lúa Nàng Nhen", icon: "🌾", qty: 6, value: 35 },
  { id: "hoe", name: "Cuốc cũ", icon: "⛏", qty: 1, value: 120 },
  { id: "fish", name: "Cá linh", icon: "🐟", qty: 3, value: 45 },
  { id: "water", name: "Bình nước", icon: "💧", qty: 1, value: 20 },
  { id: "rice", name: "Gạo thơm", icon: "🍚", qty: 2, value: 55 },
];

export const jobs = [
  { title: "Nông dân", place: "Ruộng phía Đông", pay: 180, shift: "06:00–10:00" },
  { title: "Lái ghe", place: "Bến sông Cái Vừng", pay: 220, shift: "07:00–11:00" },
  { title: "Công ích", place: "Kênh nội đồng Phú Lâm", pay: 160, shift: "14:00–17:00" },
  { title: "Phụ bán hàng", place: "Chợ Phú Lâm", pay: 140, shift: "15:00–19:00" },
];

export const marketItems = [
  { id: "seed", name: "Giống lúa", icon: "🌾", buy: 35, sell: 22 },
  { id: "fish", name: "Cá linh", icon: "🐟", buy: 58, sell: 45 },
  { id: "veg", name: "Rau muống", icon: "🥬", buy: 26, sell: 18 },
  { id: "rice", name: "Gạo thơm", icon: "🍚", buy: 68, sell: 55 },
];

export const familyMembers = [
  { name: "Bà Tư Hạnh", relation: "Mẹ", age: 58, status: "Ở nhà" },
  { name: "Nguyễn Minh An", relation: "Bạn", age: 27, status: "Đang online" },
  { name: "Bé Nhi", relation: "Cháu", age: 8, status: "Đang đi học" },
];

export const interiors = {
  home: {
    title: "Nhà của An", subtitle: "Phú Hòa B · Phú Lâm", floor: "wood", accent: "#c78f62",
    npc: { name: "Bà Tư Hạnh", role: "Mẹ", x: 10, y: 3, color: "#b76f5a", dialogue: "Mưa rồi đó con. Ăn sáng xong hãy ra ruộng, nhớ ghé thắp nhang cho ông bà." },
    furniture: [
      { id: "altar", label: "Bàn thờ gia đình", icon: "♨", x: 5, y: 1, w: 4, h: 1, kind: "altar" },
      { id: "bed", label: "Giường ngủ", icon: "▥", x: 1, y: 2, w: 3, h: 2, kind: "bed" },
      { id: "table", label: "Bàn ăn", icon: "◫", x: 6, y: 5, w: 3, h: 2, kind: "table" },
      { id: "kitchen", label: "Bếp nhà", icon: "♨", x: 11, y: 2, w: 2, h: 3, kind: "kitchen" },
    ],
  },
  market: {
    title: "Chợ Phú Lâm", subtitle: "Khu mua bán Phú Lâm", floor: "market", accent: "#b8463b",
    npc: { name: "Cô Sáu", role: "Tiểu thương", x: 10, y: 3, color: "#c66a72", dialogue: "Vô chợ rồi thì coi hàng thong thả nghen. Cá linh sáng nay vừa cập bến!" },
    furniture: [
      { id: "fish-stall", label: "Sạp cá", icon: "🐟", x: 1, y: 2, w: 4, h: 2, kind: "stall" },
      { id: "veg-stall", label: "Sạp rau", icon: "🥬", x: 1, y: 6, w: 4, h: 2, kind: "stall" },
      { id: "rice-stall", label: "Sạp gạo", icon: "🌾", x: 9, y: 6, w: 4, h: 2, kind: "stall" },
    ],
  },
  dinh: {
    title: "Nhà văn hóa Phú Lâm", subtitle: "Không gian sinh hoạt cộng đồng", floor: "temple", accent: "#a84b38",
    npc: { name: "Ông Tư Lễ", role: "Nghệ nhân đình", x: 10, y: 4, color: "#94745c", dialogue: "Đình đang chuẩn bị lễ Kỳ Yên. Con muốn phụ trang trí cờ thì ghé sáng mai." },
    furniture: [{ id: "main-altar", label: "Gian thờ chính", icon: "♨", x: 4, y: 1, w: 6, h: 2, kind: "altar" }, { id: "drum", label: "Trống đình", icon: "◉", x: 1, y: 5, w: 2, h: 2, kind: "drum" }],
  },
  school: {
    title: "Trường Phú Lâm", subtitle: "Lớp học ven sông", floor: "school", accent: "#d59b45",
    npc: { name: "Thầy Thành", role: "Giáo viên", x: 10, y: 3, color: "#7f735f", dialogue: "Hôm nay lớp học về an toàn mùa lũ. Em có thể phụ thầy sắp sách." },
    furniture: [{ id: "board", label: "Bảng lớp", icon: "ABC", x: 4, y: 1, w: 6, h: 1, kind: "board" }, { id: "desks", label: "Bàn học", icon: "▤", x: 2, y: 4, w: 8, h: 3, kind: "desks" }],
  },
  clinic: {
    title: "Trạm y tế", subtitle: "Trực mùa nước nổi", floor: "clinic", accent: "#d8ded5",
    npc: { name: "Y tá Lan", role: "Y tế", x: 10, y: 3, color: "#f1e8d8", dialogue: "Trạm vẫn ổn. Nếu qua bến đò, em giúp chị mang túi thuốc này nhé." },
    furniture: [{ id: "exam", label: "Giường khám", icon: "+", x: 2, y: 2, w: 4, h: 2, kind: "clinic" }, { id: "medicine", label: "Tủ thuốc", icon: "✚", x: 10, y: 1, w: 2, h: 3, kind: "cabinet" }],
  },
  police: {
    title: "Công an xã", subtitle: "Điểm hỗ trợ cộng đồng", floor: "office", accent: "#7f9bad",
    npc: { name: "Chị Hòa", role: "Công an xã", x: 10, y: 3, color: "#627f91", dialogue: "Có cảnh báo nước dâng ở xóm dưới. Em xem bảng phân công nếu muốn hỗ trợ." },
    furniture: [{ id: "desk", label: "Bàn trực", icon: "▤", x: 5, y: 3, w: 4, h: 2, kind: "desk" }, { id: "notice", label: "Bảng thông báo", icon: "!", x: 1, y: 1, w: 3, h: 1, kind: "board" }],
  },
  cafe: {
    title: "Cà phê cuối xóm", subtitle: "Chuyện làng bên ly cà phê", floor: "cafe", accent: "#8f5f3e",
    npc: { name: "Dì Ba", role: "Chủ quán", x: 11, y: 2, color: "#ad7654", dialogue: "Ngồi nghỉ chút đi con. Sáng nay bà con đang bàn chuyện gia cố bờ bao." },
    furniture: [{ id: "counter", label: "Quầy cà phê", icon: "☕", x: 9, y: 1, w: 4, h: 2, kind: "counter" }, { id: "tables", label: "Bàn khách", icon: "◫", x: 2, y: 3, w: 5, h: 4, kind: "tables" }],
  },
};

export function getTileType(x, y, regionId = "phu-lam") {
  const config = regionMapConfigs[regionId] || regionMapConfigs["phu-lam"];
  const onPortal = (y <= 1 && x >= 19 && x <= 22) || (y >= MAP_HEIGHT - 2 && x >= 19 && x <= 22) || (x <= 1 && y >= 13 && y <= 16) || (x >= MAP_WIDTH - 2 && y >= 13 && y <= 16);
  if (onPortal) return "road";
  if (config.water === "west" && x <= 4) return "water";
  if (config.water === "east" && x >= MAP_WIDTH - 5) return "water";
  if (config.water === "north" && y <= 3) return "water";
  if (config.water === "south" && y >= MAP_HEIGHT - 4) return "water";
  if ((config.water === "west" && x === 5) || (config.water === "east" && x === MAP_WIDTH - 6) || (config.water === "north" && y === 4) || (config.water === "south" && y === MAP_HEIGHT - 5)) return "bank";
  if (y === config.roadY || x === config.roadX || x === config.roadX + 1) return "road";
  if ((x + y * 3) % 13 === 0) return "grass-light";
  return "grass";
}

export const getZoneName = (x, y, regionId = "phu-lam") => {
  if (regionId !== "phu-lam") {
    const region = regionalLocations.find((item) => item.id === regionId) || regionalLocations[0];
    const index = Math.abs(Math.floor((x + y) / 6)) % region.zones.length;
    return `Khu vực ${region.zones[index]}`;
  }
  if (x <= 6) return "Bờ sông Cái Vừng";
  if (x >= 14 && x <= 21 && y <= 10) return "Chợ Phú Lâm";
  if (y >= 13 && x >= 9 && x <= 17) return "Ruộng Phú Hòa B";
  if (x >= 23 && y <= 8) return "Khu văn hóa Phú Lâm";
  if (x >= 22 && y >= 12) return "Khu trường học";
  return "Phú Hòa B · Phú Lâm";
};
