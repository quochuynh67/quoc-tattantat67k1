import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FERRY_FARE, MAP_HEIGHT, MAP_WIDTH, TILE_SIZE, familyMembers, getRegionMapEntities, getRegionPortals, getRegionVegetation, getRegionWorldObjects, getSafeArrivalPosition, getTileType, getZoneName,
  interiors, jobs, marketItems, quests, regionalLocations, regionMapConfigs,
} from "../features/muaNuocNoi/mockData";
import { useMuaNuocNoiStore } from "../features/muaNuocNoi/useMuaNuocNoiStore";
import { loadEditorMap } from "../features/muaNuocNoi/mapEditorStorage";
import "./MuaNuocNoi.css";

const panelMeta = {
  inventory: ["Túi đồ", "Những vật dụng bạn đang mang theo"],
  market: ["Chợ Phú Lâm", "Giá hàng thay đổi theo con nước"],
  jobs: ["Việc làm hôm nay", "Làm một ca ngắn để nhận xu"],
  family: ["Gia đình", "Mái nhà và những mối quan hệ"],
  map: ["Bản đồ vùng Phú Tân", "An Giang · dữ liệu địa danh hiện hành"],
  settings: ["Tạm dừng", "Hành trình được lưu tự động"],
};

function PixelPerson({ color, player = false }) {
  return <span className={`mnn-person ${player ? "is-player" : ""}`} style={{ "--shirt": color }}><i /><b /><em /></span>;
}

function ProgressBar({ value, tone = "green" }) {
  return <span className="mnn-progress"><i className={tone} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function MapOverview({ large = false, onExpand }) {
  const player = useMuaNuocNoiStore((s) => s.player);
  const regionId = useMuaNuocNoiStore((s) => s.regionId);
  const region = regionalLocations.find((item) => item.id === regionId) || regionalLocations[0];
  const config = regionMapConfigs[regionId] || regionMapConfigs["phu-lam"];
  const customObjects = useMemo(() => regionId === "phu-lam" ? loadEditorMap() : [], [regionId]);
  const hasBaseLayout = customObjects.some((object) => object.baseId);
  const buildings = useMemo(() => regionId === "phu-lam" && hasBaseLayout ? customObjects : getRegionWorldObjects(regionId), [customObjects, hasBaseLayout, regionId]);
  const additionalObjects = hasBaseLayout ? [] : customObjects;
  const mapEntities = useMemo(() => getRegionMapEntities(regionId), [regionId]);
  const vegetation = useMemo(() => getRegionVegetation(regionId), [regionId]);
  const percentX = (value) => `${(value / MAP_WIDTH) * 100}%`;
  const percentY = (value) => `${(value / MAP_HEIGHT) * 100}%`;
  const content = <>
    <span className={`overview-water water-${config.water}`} />
    <span className="overview-road road-horizontal" style={{ top: percentY(config.roadY) }} />
    <span className="overview-road road-vertical" style={{ left: percentX(config.roadX) }} />
    <span className="overview-road road-vertical second" style={{ left: percentX(config.roadX + 1) }} />
    {[...buildings, ...additionalObjects].map((object) => <span key={`${object.id}-${object.type}`} className={`overview-building building-${object.type}`} style={{ left: percentX(object.x + (object.offsetX || 0) / TILE_SIZE), top: percentY(object.y + (object.offsetY || 0) / TILE_SIZE), width: percentX(object.w), height: percentY(object.h), "--map-building": object.color }} title={object.name || object.label}><b>{object.icon || "▪"}</b>{large && <small>{object.name || object.label}</small>}</span>)}
    {vegetation.map((plant) => <span key={plant.id} className={`overview-plant plant-${plant.type}`} style={{ left: percentX(plant.x), top: percentY(plant.y), "--plant-color": plant.color }} title={plant.name}>{plant.icon}</span>)}
    {mapEntities.npcs.map((npc) => <span key={npc.id} className="overview-person overview-npc" style={{ left: percentX(npc.x), top: percentY(npc.y) }} title={`NPC · ${npc.name}`}><i />{large && <small>{npc.name}</small>}</span>)}
    {mapEntities.nearbyPlayers.map((other) => <span key={other.id} className="overview-person overview-other" style={{ left: percentX(other.x), top: percentY(other.y), "--person-color": other.color }} title={`Người chơi · ${other.name}`}><i />{large && <small>{other.name}</small>}</span>)}
    <span className="overview-person overview-current" style={{ left: percentX(player.x), top: percentY(player.y) }} title={`Bạn · ${player.name}`}><i />{large && <small>Bạn đang ở đây</small>}</span>
    {large && <span className="overview-region-name">XÃ {region.name.toUpperCase()}</span>}
  </>;

  if (!large) return <button type="button" className="mnn-minimap mnn-overview" onClick={onExpand} aria-label="Phóng to bản đồ" title="Bấm để mở bản đồ lớn">{content}<span className="minimap-expand">⤢</span></button>;
  return <div className="large-map detailed-map mnn-overview">{content}</div>;
}

function WorldMap({ onInteract, onOpenPanel, onEnter }) {
  const viewportRef = useRef(null);
  const player = useMuaNuocNoiStore((s) => s.player);
  const movePlayer = useMuaNuocNoiStore((s) => s.movePlayer);
  const relocatePlayer = useMuaNuocNoiStore((s) => s.relocatePlayer);
  const savePosition = useMuaNuocNoiStore((s) => s.savePosition);
  const farmStage = useMuaNuocNoiStore((s) => s.farmStage);
  const farm = useMuaNuocNoiStore((s) => s.farm);
  const weather = useMuaNuocNoiStore((s) => s.weather);
  const regionId = useMuaNuocNoiStore((s) => s.regionId);
  const warpToRegion = useMuaNuocNoiStore((s) => s.warpToRegion);
  const notify = useMuaNuocNoiStore((s) => s.notify);
  const currentRegion = regionalLocations.find((region) => region.id === regionId) || regionalLocations[0];
  const portals = useMemo(() => getRegionPortals(regionId), [regionId]);
  const [customObjects, setCustomObjects] = useState(loadEditorMap);
  const hasBaseLayout = regionId === "phu-lam" && customObjects.some((object) => object.baseId);
  const mapObjects = useMemo(() => regionId === "phu-lam" && hasBaseLayout ? customObjects : getRegionWorldObjects(regionId), [customObjects, hasBaseLayout, regionId]);
  const additionalObjects = hasBaseLayout ? [] : customObjects;
  const mapEntities = useMemo(() => getRegionMapEntities(regionId), [regionId]);
  const vegetation = useMemo(() => getRegionVegetation(regionId), [regionId]);
  const mapNpcs = mapEntities.npcs;
  const [viewport, setViewport] = useState({ w: 900, h: 560 });
  const playerRef = useRef(player);
  const heldDirections = useRef(new Set());
  const ferryLock = useRef(0);

  useEffect(() => { playerRef.current = player; }, [player]);

  useEffect(() => {
    const update = () => viewportRef.current && setViewport({ w: viewportRef.current.clientWidth, h: viewportRef.current.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const world = viewportRef.current;
    if (!world) return undefined;
    const preventNativeMenu = (event) => event.preventDefault();
    world.addEventListener("contextmenu", preventNativeMenu);
    world.addEventListener("selectstart", preventNativeMenu);
    world.addEventListener("dragstart", preventNativeMenu);
    return () => {
      world.removeEventListener("contextmenu", preventNativeMenu);
      world.removeEventListener("selectstart", preventNativeMenu);
      world.removeEventListener("dragstart", preventNativeMenu);
    };
  }, []);

  useEffect(() => {
    const refresh = () => setCustomObjects(loadEditorMap());
    window.addEventListener("mnn-map-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("mnn-map-updated", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const blocked = useMemo(() => {
    const points = new Set();
    mapObjects.filter((o) => !["field", "ferry"].includes(o.type)).forEach((o) => {
      for (let x = o.x; x < o.x + o.w; x++) for (let y = o.y; y < o.y + o.h; y++) points.add(`${x},${y}`);
    });
    additionalObjects.filter((object) => object.collidable).forEach((object) => {
      const startX = object.x + (object.offsetX || 0) / TILE_SIZE;
      const startY = object.y + (object.offsetY || 0) / TILE_SIZE;
      for (let x = Math.floor(startX); x < Math.ceil(startX + object.w); x++) for (let y = Math.floor(startY); y < Math.ceil(startY + object.h); y++) points.add(`${x},${y}`);
    });
    vegetation.forEach((plant) => points.add(`${plant.x},${plant.y}`));
    return points;
  }, [additionalObjects, mapObjects, regionId, vegetation]);

  const isBlocked = useCallback((x, y) => {
    const gridX = Math.round(x);
    const gridY = Math.round(y);
    return gridX < 0 || gridX >= MAP_WIDTH || gridY < 0 || gridY >= MAP_HEIGHT || getTileType(gridX, gridY, regionId) === "water" || blocked.has(`${gridX},${gridY}`);
  }, [blocked, regionId]);

  useEffect(() => {
    if (!isBlocked(player.x, player.y)) return;
    const safe = getSafeArrivalPosition(regionId, player.x, player.y);
    relocatePlayer(safe.x, safe.y);
  }, [isBlocked, player.x, player.y, regionId, relocatePlayer]);

  useEffect(() => {
    let animationFrame;
    let previousTime = performance.now();
    const speed = 4.6;
    const tick = (now) => {
      const elapsed = Math.min((now - previousTime) / 1000, 0.04);
      previousTime = now;
      let dx = 0;
      let dy = 0;
      if (heldDirections.current.has("left")) dx -= 1;
      if (heldDirections.current.has("right")) dx += 1;
      if (heldDirections.current.has("up")) dy -= 1;
      if (heldDirections.current.has("down")) dy += 1;
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        const current = playerRef.current;
        let nextX = current.x + (dx / length) * speed * elapsed;
        let nextY = current.y + (dy / length) * speed * elapsed;
        if (isBlocked(nextX, current.y)) nextX = current.x;
        if (isBlocked(nextX, nextY)) nextY = current.y;
        if (nextX !== current.x || nextY !== current.y) {
          playerRef.current = { ...current, x: nextX, y: nextY };
          movePlayer(nextX, nextY);
        }
      }
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [isBlocked, movePlayer]);

  const nearest = useMemo(() => {
    const localName = (object) => {
      if (regionId === "phu-lam") return object.name;
      if (object.type === "market") return `Chợ ${currentRegion.name}`;
      if (object.type === "school") return `Trường ${currentRegion.name}`;
      if (object.type === "clinic") return `Trạm y tế ${currentRegion.name}`;
      if (object.type === "temple") return `Nhà văn hóa ${currentRegion.name}`;
      if (object.type === "house") return `Nhà dân · ${currentRegion.center}`;
      return object.name;
    };
    const candidates = [
      ...mapNpcs.map((npc) => ({ ...npc, interaction: "npc", targetX: npc.x, targetY: npc.y })),
      ...mapObjects.filter((object) => ["field", "market", "ferry", "home", "temple", "school", "clinic", "police", "cafe"].includes(object.type)).map((object) => ({ ...object, name: localName(object), interaction: object.type, targetX: object.entry?.x ?? object.x, targetY: object.entry?.y ?? object.y })),
      ...additionalObjects.filter((object) => object.interactive || object.interior).map((object) => {
        const x = object.x + (object.offsetX || 0) / TILE_SIZE;
        const y = object.y + (object.offsetY || 0) / TILE_SIZE;
        return {
          ...object,
          name: object.label,
          interaction: "custom",
          targetX: object.interior ? x + object.w / 2 : Math.max(x, Math.min(player.x, x + object.w - 1)),
          targetY: object.interior ? y + object.h : Math.max(y, Math.min(player.y, y + object.h - 1)),
        };
      }),
      ...portals.map((portal) => ({ ...portal, id: `portal-${portal.direction}`, name: `${portal.requiresFerry ? `Qua đò · ${FERRY_FARE} xu` : "Đi đường bộ"} sang xã ${regionalLocations.find((region) => region.id === portal.targetId)?.name}`, interaction: "portal", targetX: portal.x, targetY: portal.y })),
    ];
    return candidates.map((target) => ({ ...target, distance: Math.hypot(target.targetX - player.x, target.targetY - player.y) })).sort((a, b) => a.distance - b.distance)[0];
  }, [additionalObjects, currentRegion, mapNpcs, mapObjects, player.x, player.y, portals, regionId]);

  const takeFerry = useCallback((portal, directClick = false) => {
    if (!portal || Date.now() < ferryLock.current) return;
    if (!directClick && Math.hypot(portal.x - playerRef.current.x, portal.y - playerRef.current.y) > 1.6) {
      notify(portal.requiresFerry ? "Hãy di chuyển tới bến đò để bắt chuyến." : "Hãy di chuyển tới lối đường bộ để sang xã.");
      return;
    }
    const target = regionalLocations.find((region) => region.id === portal.targetId);
    if (!target) return;
    ferryLock.current = Date.now() + 1200;
    heldDirections.current.clear();
    const arrival = getSafeArrivalPosition(target.id, portal.spawnX, portal.spawnY);
    warpToRegion(target, arrival.x, arrival.y, portal.requiresFerry ? FERRY_FARE : 0);
  }, [notify, warpToRegion]);

  const interact = useCallback(() => {
    if (!nearest || nearest.distance > 2) return;
    if (nearest.interaction === "portal") takeFerry(nearest);
    else if (nearest.entry || (nearest.interaction === "custom" && nearest.interior)) return;
    else if (nearest.interaction === "field") farm();
    else onInteract(nearest);
  }, [farm, nearest, onEnter, onInteract, takeFerry]);
  const interactRef = useRef(interact);
  useEffect(() => { interactRef.current = interact; }, [interact]);

  useEffect(() => {
    const building = mapObjects.find((object) => object.entry && Math.hypot(object.entry.x - player.x, object.entry.y - player.y) < 0.24);
    if (building) { savePosition(); onEnter(building); }
  }, [mapObjects, onEnter, player.x, player.y, savePosition]);

  useEffect(() => {
    if (regionId !== "phu-lam") return;
    const building = additionalObjects.find((object) => {
      if (!object.interior) return false;
      const doorX = object.x + (object.offsetX || 0) / TILE_SIZE + object.w / 2;
      const doorY = object.y + (object.offsetY || 0) / TILE_SIZE + object.h;
      return Math.hypot(doorX - player.x, doorY - player.y) < 0.3;
    });
    if (building) { savePosition(); onEnter({ ...building, id: `custom:${building.id}` }); }
  }, [additionalObjects, onEnter, player.x, player.y, regionId, savePosition]);

  useEffect(() => {
    if (Date.now() < ferryLock.current) return;
    const portal = portals.find((item) => Math.hypot(item.x - player.x, item.y - player.y) < 0.3);
    if (portal) takeFerry(portal);
  }, [player.x, player.y, portals, takeFerry]);

  useEffect(() => {
    const handleKey = (event) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const controls = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
      if (controls[event.key]) { event.preventDefault(); heldDirections.current.add(controls[event.key]); }
      if ((event.key === "e" || event.key === "E") && !event.repeat) interactRef.current();
    };
    const handleKeyUp = (event) => {
      const controls = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
      if (controls[event.key]) { heldDirections.current.delete(controls[event.key]); savePosition(); }
    };
    const stopMoving = () => { heldDirections.current.clear(); savePosition(); };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", stopMoving);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", stopMoving);
    };
  }, [savePosition]);

  const touchDirection = useCallback((direction, pressed) => {
    if (pressed) heldDirections.current.add(direction);
    else { heldDirections.current.delete(direction); savePosition(); }
  }, [savePosition]);

  const offsetX = Math.min(0, Math.max(viewport.w - MAP_WIDTH * TILE_SIZE, viewport.w / 2 - player.x * TILE_SIZE - TILE_SIZE / 2));
  const offsetY = Math.min(0, Math.max(viewport.h - MAP_HEIGHT * TILE_SIZE, viewport.h / 2 - player.y * TILE_SIZE - TILE_SIZE / 2));
  const tiles = useMemo(() => Array.from({ length: MAP_WIDTH * MAP_HEIGHT }, (_, i) => ({ x: i % MAP_WIDTH, y: Math.floor(i / MAP_WIDTH) })), []);
  const tileElements = useMemo(() => tiles.map(({ x, y }) => <span key={`${x}-${y}`} className={`mnn-tile tile-${getTileType(x, y, regionId)}`} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE }} />), [regionId, tiles]);
  const farmLabels = ["ĐẤT HOANG", "ĐÃ CUỐC", "ĐÃ GIEO", "ĐÃ TƯỚI", "LÚA NON", "SẴN SÀNG GẶT"];

  return (
    <section className="mnn-world" ref={viewportRef} aria-label="Bản đồ xã Phú Lâm và vùng Phú Tân cũ" onContextMenu={(event) => event.preventDefault()} onSelectStart={(event) => event.preventDefault()}>
      <div className="mnn-map" style={{ width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE, transform: `translate3d(${offsetX}px, ${offsetY}px, 0)` }}>
        {tileElements}
        <div className="mnn-river-lines"><i /><i /><i /><i /></div>
        {vegetation.map((plant) => <div key={plant.id} className={`mnn-vegetation vegetation-${plant.type}`} style={{ left: plant.x * TILE_SIZE, top: plant.y * TILE_SIZE, "--foliage": plant.color }} title={plant.name}><i /><b /><span>{plant.icon}</span></div>)}
        {mapObjects.map((object) => (
          <button
            key={object.id}
            className={`mnn-object object-${object.type} ${object.entry ? "has-interior" : ""} ${object.id === "field" ? `farm-stage-${farmStage}` : ""}`}
            style={{ left: object.x * TILE_SIZE, top: object.y * TILE_SIZE, width: object.w * TILE_SIZE, height: object.h * TILE_SIZE, "--building": object.color }}
            onClick={() => object.type === "field" ? farm() : !object.entry && onInteract({ ...object, interaction: object.type })}
            title={regionId === "phu-lam" ? object.name : `${object.type === "market" ? "Chợ" : object.type === "school" ? "Trường" : object.type === "clinic" ? "Trạm y tế" : object.name} · ${currentRegion.name}`}
          >
            <span>{object.icon}</span>
            {object.entry && <i className="mnn-building-door" />}
            {object.type === "field" && <small>{object.id === "field" ? farmLabels[farmStage] : "LÚA ĐANG TRỔ"}</small>}
            {!['field', 'pond'].includes(object.type) && <small>{regionId === "phu-lam" ? object.name : object.type === "market" ? `Chợ ${currentRegion.name}` : object.type === "school" ? `Trường ${currentRegion.name}` : object.type === "clinic" ? `Trạm y tế ${currentRegion.name}` : object.name}</small>}
          </button>
        ))}
        {regionId === "phu-lam" && additionalObjects.map((object) => <button key={object.id} className={`mnn-custom-object custom-${object.type} ${object.interior ? "has-custom-interior" : ""}`} style={{ left: object.x * TILE_SIZE + (object.offsetX || 0), top: object.y * TILE_SIZE + (object.offsetY || 0), width: object.w * TILE_SIZE, height: object.h * TILE_SIZE, "--custom-color": object.color }} onClick={() => !object.interior && object.interactive && onInteract({ name: object.label, icon: object.icon, type: "custom", interaction: "custom" })}><span>{object.icon}</span>{object.interior && <i className="mnn-custom-door" />}<small>{object.label}</small></button>)}
        {portals.map((portal) => <button key={portal.direction} className={`mnn-world-portal portal-${portal.requiresFerry ? "ferry" : "road"} portal-${portal.direction}`} style={{ left: portal.x * TILE_SIZE, top: portal.y * TILE_SIZE }} onClick={() => takeFerry(portal, true)}><b>{portal.direction === "north" ? "▲" : portal.direction === "east" ? "▶" : portal.direction === "south" ? "▼" : "◀"}</b><span>{portal.requiresFerry ? "BẾN ĐÒ" : "ĐƯỜNG BỘ"} · {portal.label}</span><small>{regionalLocations.find((region) => region.id === portal.targetId)?.name} · {portal.requiresFerry ? `${FERRY_FARE} xu` : "miễn phí"}</small></button>)}
        {mapNpcs.map((npc) => <button key={npc.id} className="mnn-entity npc" style={{ left: npc.x * TILE_SIZE, top: npc.y * TILE_SIZE }} onClick={() => onInteract({ ...npc, interaction: "npc" })}><span className="entity-name">{npc.name}</span><PixelPerson color={npc.color} /></button>)}
        {mapEntities.nearbyPlayers.map((other) => <div key={other.id} className="mnn-entity other-player" style={{ left: other.x * TILE_SIZE, top: other.y * TILE_SIZE }}><span className="entity-name">{other.name}</span><PixelPerson color={other.color} /></div>)}
        <div className="mnn-entity current-player" style={{ left: player.x * TILE_SIZE, top: player.y * TILE_SIZE }}><span className="entity-name">{player.name}</span><PixelPerson color="#f2a94a" player /></div>
        {weather.includes("Mưa") && <div className={`mnn-rain ${weather === "Mưa lớn" ? "heavy" : ""}`} />}
      </div>
      <div className="mnn-zone-label"><span>⌖</span>{getZoneName(player.x, player.y, regionId)}</div>
      <MapOverview onExpand={() => onOpenPanel("map")} />
      {nearest && nearest.distance <= 1.6 && (nearest.entry || (nearest.interaction === "custom" && nearest.interior) ? <div className="mnn-interact mnn-door-hint"><kbd>↑</kbd><span>Đi tới đúng cửa · {nearest.name}</span></div> : <button className="mnn-interact" onClick={interact}><kbd>E</kbd><span>{nearest.interaction === "portal" ? nearest.name : nearest.interaction === "field" ? farmLabels[Math.min(farmStage + 1, 5)] : `Tương tác · ${nearest.name}`}</span></button>)}
      <div className="mnn-dpad" aria-label="Điều hướng">
        {[["up", "▲"], ["left", "◀"], ["down", "▼"], ["right", "▶"]].map(([direction, label]) => <button key={direction} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); touchDirection(direction, true); }} onPointerUp={() => touchDirection(direction, false)} onPointerCancel={() => touchDirection(direction, false)}>{label}</button>)}
      </div>
    </section>
  );
}

function InteriorMap({ locationId, onExit, onInteract, onOpenPanel }) {
  const regionId = useMuaNuocNoiStore((s) => s.regionId);
  const currentRegion = regionalLocations.find((region) => region.id === regionId) || regionalLocations[0];
  const customId = locationId.startsWith("custom:") ? locationId.slice(7) : null;
  const customObject = useMemo(() => customId ? loadEditorMap().find((object) => object.id === customId) : null, [customId]);
  const room = useMemo(() => customObject?.interior ? {
    title: customObject.label,
    subtitle: `Nội thất tự thiết kế · ${currentRegion.name}`,
    floor: "custom",
    accent: customObject.color,
    floorColor: customObject.interior.floorColor,
    wallColor: customObject.interior.wallColor,
    width: customObject.interior.width,
    height: customObject.interior.height,
    npc: null,
    furniture: (customObject.interior.items || []).map((item) => ({ ...item, kind: item.type })),
  } : interiors[locationId], [currentRegion.name, customObject, locationId]);
  const displayTitle = customObject ? room.title : regionId === "phu-lam" ? room.title : locationId === "market" ? `Chợ ${currentRegion.name}` : locationId === "school" ? `Trường ${currentRegion.name}` : locationId === "clinic" ? `Trạm y tế ${currentRegion.name}` : locationId === "dinh" ? `Nhà văn hóa ${currentRegion.name}` : room.title;
  const displaySubtitle = customObject ? room.subtitle : regionId === "phu-lam" ? room.subtitle : `${currentRegion.center} · An Giang`;
  const ROOM_W = room.width || 14;
  const ROOM_H = room.height || 10;
  const doorLeft = Math.floor(ROOM_W / 2) - 1;
  const doorRight = Math.floor(ROOM_W / 2) + 1;
  const [position, setPosition] = useState({ x: ROOM_W / 2, y: ROOM_H - 1.7 });
  const positionRef = useRef(position);
  const heldDirections = useRef(new Set());
  const exitStarted = useRef(false);

  useEffect(() => { positionRef.current = position; }, [position]);

  const isBlocked = useCallback((x, y) => {
    const gx = Math.round(x);
    const gy = Math.round(y);
    const atDoor = gy >= ROOM_H - 1 && gx >= doorLeft && gx <= doorRight;
    if (gx <= 0 || gx >= ROOM_W - 1 || gy <= 0 || (gy >= ROOM_H - 1 && !atDoor)) return true;
    return room.furniture.some((item) => gx >= item.x && gx < item.x + item.w && gy >= item.y && gy < item.y + item.h);
  }, [ROOM_H, ROOM_W, doorLeft, doorRight, room]);

  const nearest = useMemo(() => {
    const targets = [room.npc && { ...room.npc, interaction: "npc" }, ...room.furniture.map((item) => ({ ...item, interaction: "furniture" }))].filter(Boolean);
    return targets.map((target) => ({ ...target, distance: Math.hypot(target.x - position.x, target.y - position.y) })).sort((a, b) => a.distance - b.distance)[0];
  }, [position.x, position.y, room]);

  const interact = useCallback(() => {
    if (!nearest || nearest.distance > 2) return;
    if (locationId === "market" && nearest.interaction === "furniture") onOpenPanel("market");
    else onInteract(nearest.interaction === "npc" ? nearest : { name: nearest.label, icon: nearest.icon, type: "furniture", interaction: "furniture" });
  }, [locationId, nearest, onInteract, onOpenPanel]);
  const interactRef = useRef(interact);
  useEffect(() => { interactRef.current = interact; }, [interact]);

  useEffect(() => {
    let frame;
    let previousTime = performance.now();
    const tick = (now) => {
      const elapsed = Math.min((now - previousTime) / 1000, 0.04);
      previousTime = now;
      let dx = 0;
      let dy = 0;
      if (heldDirections.current.has("left")) dx--;
      if (heldDirections.current.has("right")) dx++;
      if (heldDirections.current.has("up")) dy--;
      if (heldDirections.current.has("down")) dy++;
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        const current = positionRef.current;
        let x = current.x + (dx / length) * 4.2 * elapsed;
        let y = current.y + (dy / length) * 4.2 * elapsed;
        if (isBlocked(x, current.y)) x = current.x;
        if (isBlocked(x, y)) y = current.y;
        if (!exitStarted.current && y > ROOM_H - 0.68 && x > doorLeft - 0.3 && x < doorRight + 0.3) {
          exitStarted.current = true;
          onExit();
          return;
        }
        positionRef.current = { x, y };
        setPosition({ x, y });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ROOM_H, doorLeft, doorRight, isBlocked, onExit]);

  useEffect(() => {
    const controls = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
    const down = (event) => { if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return; if (controls[event.key]) { event.preventDefault(); heldDirections.current.add(controls[event.key]); } if ((event.key === "e" || event.key === "E") && !event.repeat) interactRef.current(); };
    const up = (event) => controls[event.key] && heldDirections.current.delete(controls[event.key]);
    const stop = () => heldDirections.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", stop);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", stop); };
  }, []);

  const touchDirection = (direction, pressed) => pressed ? heldDirections.current.add(direction) : heldDirections.current.delete(direction);
  return <section className={`mnn-interior floor-${room.floor}`} style={{ "--interior-accent": room.accent, "--custom-floor": room.floorColor, "--custom-wall": room.wallColor }}>
    <div className="interior-heading"><small>BÊN TRONG</small><strong>{displayTitle}</strong><span>{displaySubtitle}</span></div>
    <div className="interior-room" style={{ width: ROOM_W * TILE_SIZE, height: ROOM_H * TILE_SIZE }}>
      <div className="interior-wall wall-top" /><div className="interior-wall wall-left" /><div className="interior-wall wall-right" /><div className="interior-wall wall-bottom" />
      {room.furniture.map((item) => <button key={item.id} className={`interior-furniture furniture-${item.kind}`} style={{ left: item.x * TILE_SIZE, top: item.y * TILE_SIZE, width: item.w * TILE_SIZE, height: item.h * TILE_SIZE }} onClick={() => locationId === "market" ? onOpenPanel("market") : onInteract({ name: item.label, icon: item.icon, type: "furniture", interaction: "furniture" })}><span>{item.icon}</span><small>{item.label}</small></button>)}
      {room.npc && <button className="mnn-entity npc interior-npc" style={{ left: room.npc.x * TILE_SIZE, top: room.npc.y * TILE_SIZE }} onClick={() => onInteract({ ...room.npc, interaction: "npc" })}><span className="entity-name">{room.npc.name}</span><PixelPerson color={room.npc.color} /></button>}
      <div className="mnn-entity current-player interior-player" style={{ left: position.x * TILE_SIZE, top: position.y * TILE_SIZE }}><span className="entity-name">Minh An</span><PixelPerson color="#f2a94a" player /></div>
      <div className="interior-exit">▼ RA NGOÀI</div>
    </div>
    {nearest && nearest.distance <= 2 && <button className="mnn-interact interior-action" onClick={interact}><kbd>E</kbd><span>{nearest.interaction === "npc" ? `Trò chuyện · ${nearest.name}` : `Xem · ${nearest.label}`}</span></button>}
    <button className="interior-exit-button" onClick={onExit}>← Trở ra {currentRegion.name}</button>
    <div className="mnn-dpad interior-dpad" aria-label="Điều hướng">{[["up", "▲"], ["left", "◀"], ["down", "▼"], ["right", "▶"]].map(([direction, label]) => <button key={direction} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); touchDirection(direction, true); }} onPointerUp={() => touchDirection(direction, false)} onPointerCancel={() => touchDirection(direction, false)}>{label}</button>)}</div>
  </section>;
}

function QuestPanel() {
  const progress = useMuaNuocNoiStore((s) => s.questProgress);
  const farmStage = useMuaNuocNoiStore((s) => s.farmStage);
  const active = quests[0];
  return <aside className="mnn-card mnn-quests"><div className="mnn-card-title"><span>NHIỆM VỤ</span><b>1 / 3</b></div><div className="quest-kind">◆ {active.kind}</div><h3>{active.title}</h3><p>{active.description}</p><ul>{active.objectives.slice(0, 3).map((item, index) => <li key={item} className={index < Math.max(progress, farmStage) ? "done" : index === Math.max(progress, farmStage) ? "active" : ""}><i>{index < Math.max(progress, farmStage) ? "✓" : index + 1}</i>{item}</li>)}</ul><div className="quest-reward">THƯỞNG <strong>{active.reward}</strong></div></aside>;
}

function ChatPanel() {
  const messages = useMuaNuocNoiStore((s) => s.messages);
  const sendMessage = useMuaNuocNoiStore((s) => s.sendMessage);
  const [text, setText] = useState("");
  const submit = (event) => { event.preventDefault(); if (text.trim()) { sendMessage(text.trim()); setText(""); } };
  return <aside className="mnn-card mnn-chat"><div className="mnn-card-title"><span>CHUYỆN XÓM</span><b className="online-dot">12 online</b></div><div className="chat-tabs"><button className="selected">Gần đây</button><button>Xã</button><button>Gia đình</button></div><div className="chat-list">{messages.slice(-4).map((message) => <div key={message.id}><span className="chat-avatar">{message.name.slice(-1)}</span><p><strong>{message.name}</strong><small>{message.time}</small><br />{message.text}</p></div>)}</div><form onSubmit={submit}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhắn với bà con..." maxLength={80} /><button>➤</button></form></aside>;
}

function GameModal({ panel, onClose }) {
  const player = useMuaNuocNoiStore((s) => s.player);
  const inventory = useMuaNuocNoiStore((s) => s.inventory);
  const buy = useMuaNuocNoiStore((s) => s.buy);
  const sell = useMuaNuocNoiStore((s) => s.sell);
  const takeJob = useMuaNuocNoiStore((s) => s.takeJob);
  const nextDay = useMuaNuocNoiStore((s) => s.nextDay);
  const resetGame = useMuaNuocNoiStore((s) => s.resetGame);
  const regionId = useMuaNuocNoiStore((s) => s.regionId);
  const travelToRegion = useMuaNuocNoiStore((s) => s.travelToRegion);
  const [title, subtitle] = panelMeta[panel] || ["", ""];
  return <div className="mnn-modal-backdrop" onMouseDown={onClose}><section className={`mnn-modal ${panel === "map" ? "map-modal" : ""}`} onMouseDown={(e) => e.stopPropagation()}><header><div><small>NHẬT KÝ BÌNH HÒA</small><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose}>×</button></header>
    {panel === "inventory" && <div className="inventory-grid">{inventory.map((item) => <article key={item.id}><span>{item.icon}</span><div><strong>{item.name}</strong><small>Giá trị {item.value} xu</small></div><b>×{item.qty}</b></article>)}</div>}
    {panel === "market" && <div className="market-list"><div className="wallet">Túi tiền của bạn <strong>{player.money.toLocaleString("vi-VN")} xu</strong></div>{marketItems.map((item) => <article key={item.id}><span>{item.icon}</span><div><strong>{item.name}</strong><small>Chợ đang thu mua {item.sell} xu</small></div><button onClick={() => sell(item)}>Bán</button><button className="buy" onClick={() => buy(item)}>Mua {item.buy}</button></article>)}</div>}
    {panel === "jobs" && <div className="job-list">{jobs.map((job) => <article key={job.title}><div><span>{job.title.slice(0, 1)}</span><strong>{job.title}<small>{job.place} · {job.shift}</small></strong></div><b>{job.pay} xu</b><button onClick={() => takeJob(job)}>Nhận ca</button></article>)}</div>}
    {panel === "family" && <><div className="family-summary"><span>⌂</span><div><small>GIA ĐÌNH NHÀ AN</small><strong>3 thành viên · Quỹ chung 2.450 xu</strong></div></div><div className="family-list">{familyMembers.map((member) => <article key={member.name}><span>{member.name.slice(-1)}</span><div><strong>{member.name}</strong><small>{member.relation} · {member.age} tuổi</small></div><b>{member.status}</b></article>)}</div><div className="relationship-road"><i className="done">Gặp gỡ</i><i className="done">Bạn bè</i><i>Hẹn hò</i><i>Ra mắt</i><i>Đám cưới</i></div></>}
    {panel === "map" && <><MapOverview large /><div className="map-legend"><span className="legend-current">◆ Vị trí hiện tại</span><span className="legend-building">■ Công trình</span><span className="legend-npc">● NPC</span><span className="legend-player">● Người chơi khác</span><span className="legend-road">━ Đường đi</span></div><div className="region-list">{regionalLocations.map((region) => <article key={region.id} className={region.id === regionId ? "current" : ""}><i style={{ background: region.color }} /><div><strong>Xã {region.name}</strong><small>{region.formedFrom}</small><p>{region.description}</p></div><span>{region.id === regionId ? "Đang ở đây" : region.distance}</span><button disabled={region.id === regionId} onClick={() => { const canTravel = player.money >= region.travelCost; travelToRegion(region); if (canTravel) onClose(); }}>{region.id === regionId ? "Hiện tại" : `Đi · ${region.travelCost} xu`}</button></article>)}</div></>}
    {panel === "settings" && <div className="settings-list"><button onClick={nextDay}><span>☀</span><strong>Ngủ đến ngày mai<small>Hồi năng lượng và giúp cây lớn</small></strong></button><button onClick={() => document.documentElement.requestFullscreen?.()}><span>⛶</span><strong>Toàn màn hình<small>Tập trung vào thế giới Phú Lâm</small></strong></button><button className="danger" onClick={() => { if (window.confirm("Bắt đầu lại từ đầu?")) resetGame(); }}><span>↺</span><strong>Chơi lại từ đầu<small>Xóa tiến trình đã lưu trên máy này</small></strong></button></div>}
  </section></div>;
}

function Dialogue({ target, onClose }) {
  const interactNpc = useMuaNuocNoiStore((s) => s.interactNpc);
  if (!target) return null;
  const isNpc = target.interaction === "npc";
  return <div className="mnn-dialogue"><div className="dialogue-portrait">{isNpc ? <PixelPerson color={target.color} /> : target.icon || "⌂"}</div><div><small>{isNpc ? target.role : "ĐỊA ĐIỂM"}</small><h3>{target.name}</h3><p>{target.dialogue || (target.type === "ferry" ? "Mặt nước sông Cái Vừng đang dâng chậm. Chuyến đò kế tiếp rời bến lúc 07:00." : "Một góc quen thuộc của vùng Phú Tân, An Giang.")}</p><button onClick={() => { if (isNpc) interactNpc(target.id); onClose(); }}>{isNpc ? "Trò chuyện" : "Đã hiểu"}</button></div><button className="dialogue-close" onClick={onClose}>×</button></div>;
}

export default function MuaNuocNoi() {
  const navigate = useNavigate();
  const player = useMuaNuocNoiStore((s) => s.player);
  const movePlayer = useMuaNuocNoiStore((s) => s.movePlayer);
  const savePosition = useMuaNuocNoiStore((s) => s.savePosition);
  const regionId = useMuaNuocNoiStore((s) => s.regionId);
  const currentRegion = regionalLocations.find((region) => region.id === regionId) || regionalLocations[0];
  const day = useMuaNuocNoiStore((s) => s.day);
  const time = useMuaNuocNoiStore((s) => s.time);
  const weather = useMuaNuocNoiStore((s) => s.weather);
  const waterLevel = useMuaNuocNoiStore((s) => s.waterLevel);
  const toast = useMuaNuocNoiStore((s) => s.toast);
  const clearToast = useMuaNuocNoiStore((s) => s.clearToast);
  const [panel, setPanel] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [scene, setScene] = useState(() => {
    const requestedScene = new URLSearchParams(window.location.search).get("scene");
    if (requestedScene && interiors[requestedScene]) return requestedScene;
    if (requestedScene?.startsWith("custom:") && loadEditorMap().some((object) => object.id === requestedScene.slice(7) && object.interior)) return requestedScene;
    return null;
  });

  const leaveInterior = useCallback(() => {
    const editorLayout = regionId === "phu-lam" ? loadEditorMap() : [];
    const building = (editorLayout.some((object) => object.baseId) ? editorLayout : getRegionWorldObjects(regionId)).find((object) => object.id === scene || object.baseId === scene);
    if (building?.entry) {
      movePlayer(building.entry.x, building.entry.y + 0.85);
      savePosition();
    } else if (scene?.startsWith("custom:")) {
      const custom = loadEditorMap().find((object) => object.id === scene.slice(7));
      if (custom) {
        movePlayer(custom.x + (custom.offsetX || 0) / TILE_SIZE + custom.w / 2, custom.y + (custom.offsetY || 0) / TILE_SIZE + custom.h + 0.85);
        savePosition();
      }
    }
    setScene(null);
  }, [movePlayer, regionId, savePosition, scene]);

  useEffect(() => { if (!toast) return; const id = setTimeout(clearToast, 2600); return () => clearTimeout(id); }, [clearToast, toast]);
  const nav = [{ id: "inventory", icon: "▣", label: "Túi đồ" }, { id: "market", icon: "¤", label: "Chợ" }, { id: "jobs", icon: "⚒", label: "Nghề" }, { id: "family", icon: "⌂", label: "Gia đình" }, { id: "map", icon: "⌖", label: "Bản đồ" }, { id: "editor", icon: "▦", label: "Soạn map" }, { id: "settings", icon: "⚙", label: "Khác" }];

  return <main className={`mnn-game ${weather === "Mưa lớn" ? "storm" : ""}`}>
    <header className="mnn-topbar"><button className="mnn-back" onClick={() => navigate("/")} title="Về trang chủ">←</button><div className="mnn-brand"><span className="brand-sun">◒</span><div><small>AN GIANG · XÃ {currentRegion.name.toUpperCase()}</small><strong>MÙA NƯỚC NỔI</strong></div></div><div className="mnn-clock"><span>{weather === "Nắng" ? "☀" : weather === "Mưa lớn" ? "☂" : "🌦"}</span><div><strong>Ngày {day} · {time}</strong><small>{weather} · Vùng Phú Tân cũ</small></div></div><div className="mnn-stats"><div><span>◉</span><p><small>XU</small><strong>{player.money.toLocaleString("vi-VN")}</strong></p></div><div><span>♥</span><p><small>NĂNG LƯỢNG</small><strong>{player.energy}/100</strong></p><ProgressBar value={player.energy} /></div><div><span>★</span><p><small>UY TÍN</small><strong>{player.reputation}</strong></p></div><div className="water"><span>≋</span><p><small>MỰC NƯỚC</small><strong>{waterLevel}m</strong></p></div></div><div className="mnn-profile"><PixelPerson color="#f2a94a" /><div><strong>{player.name}</strong><small>Cấp {player.level} · {player.role}</small></div></div></header>
    <div className="mnn-layout"><QuestPanel />{scene ? <InteriorMap locationId={scene} onExit={leaveInterior} onInteract={setDialogue} onOpenPanel={setPanel} /> : <WorldMap onInteract={setDialogue} onOpenPanel={setPanel} onEnter={(building) => setScene(building.id)} />}<ChatPanel /></div>
    <nav className="mnn-bottom-nav">{nav.map((item) => <button key={item.id} onClick={() => item.id === "editor" ? navigate("/mua-nuoc-noi/editor") : setPanel(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}<div className="mnn-help"><kbd>WASD</kbd><span>Di chuyển</span><kbd>E</kbd><span>Tương tác</span></div></nav>
    {dialogue && <Dialogue target={dialogue} onClose={() => setDialogue(null)} />}
    {panel && <GameModal panel={panel} onClose={() => setPanel(null)} />}
    {toast && <div className="mnn-toast"><span>✓</span>{toast}</div>}
  </main>;
}
