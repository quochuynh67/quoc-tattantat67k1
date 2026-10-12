import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from "../features/muaNuocNoi/mockData";
import { createEditorObject, editorPalette, loadEditorMap, normalizeEditorMap, saveEditorMap } from "../features/muaNuocNoi/mapEditorStorage";
import "./MuaNuocNoiEditor.css";

const EDITOR_TILE = 22;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const INTERIOR_TYPES = new Set(["house", "stilt-house", "shop", "warehouse", "school"]);
const furniturePalette = [
  { type: "bed", label: "Giường", icon: "▥", w: 3, h: 2, color: "#78909c" },
  { type: "table", label: "Bàn", icon: "◫", w: 2, h: 2, color: "#795337" },
  { type: "chair", label: "Ghế", icon: "▪", w: 1, h: 1, color: "#8a6442" },
  { type: "altar", label: "Bàn thờ", icon: "♨", w: 3, h: 1, color: "#914a39" },
  { type: "stove", label: "Bếp", icon: "♨", w: 2, h: 2, color: "#5f493b" },
  { type: "cabinet", label: "Tủ", icon: "▥", w: 2, h: 1, color: "#9a754e" },
  { type: "counter", label: "Quầy", icon: "▤", w: 4, h: 1, color: "#6d4a32" },
  { type: "shelf", label: "Kệ hàng", icon: "≡", w: 3, h: 1, color: "#84603e" },
  { type: "desk", label: "Bàn học", icon: "▱", w: 2, h: 1, color: "#987044" },
  { type: "plant", label: "Chậu cây", icon: "♣", w: 1, h: 1, color: "#507546" },
];

function InteriorEditor({ object, onClose, onSave }) {
  const initial = object.interior || { width: 14, height: 10, floorColor: "#a1774e", wallColor: "#4b3224", items: [] };
  const [draft, setDraft] = useState(() => ({ ...initial, items: (initial.items || []).map((item) => ({ ...item })) }));
  const [selectedItemId, setSelectedItemId] = useState(null);
  const roomRef = useRef(null);
  const dragRef = useRef(null);
  const ROOM_TILE = 30;

  const addFurniture = (template) => {
    const index = draft.items.length;
    const item = { ...template, id: `furniture-${Date.now()}-${index}`, x: 1 + (index * 2) % Math.max(2, draft.width - template.w - 1), y: 1 + (index * 2) % Math.max(2, draft.height - template.h - 2) };
    setDraft((current) => ({ ...current, items: [...current.items, item] }));
    setSelectedItemId(item.id);
  };

  useEffect(() => {
    const move = (event) => {
      if (!dragRef.current || !roomRef.current) return;
      const rect = roomRef.current.getBoundingClientRect();
      const item = draft.items.find((entry) => entry.id === dragRef.current.id);
      if (!item) return;
      const x = clamp(Math.floor((event.clientX - rect.left) / ROOM_TILE), 1, draft.width - item.w - 1);
      const y = clamp(Math.floor((event.clientY - rect.top) / ROOM_TILE), 1, draft.height - item.h - 1);
      setDraft((current) => ({ ...current, items: current.items.map((entry) => entry.id === item.id ? { ...entry, x, y } : entry) }));
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [draft.height, draft.items, draft.width]);

  const removeFurniture = () => {
    if (!selectedItemId) return;
    setDraft((current) => ({ ...current, items: current.items.filter((item) => item.id !== selectedItemId) }));
    setSelectedItemId(null);
  };

  return <div className="interior-editor-backdrop" onMouseDown={onClose}><section className="interior-editor-modal" onMouseDown={(event) => event.stopPropagation()}>
    <header><div><small>THIẾT KẾ KHÔNG GIAN</small><h2>Nội thất · {object.label}</h2><p>Chọn đồ bên trái, kéo trực tiếp trong phòng để sắp xếp.</p></div><button onClick={onClose}>×</button></header>
    <div className="interior-editor-layout">
      <aside><strong>Đồ nội thất</strong>{furniturePalette.map((item) => <button key={item.type} onClick={() => addFurniture(item)}><span style={{ background: item.color }}>{item.icon}</span><div>{item.label}<small>{item.w}×{item.h} ô</small></div><b>+</b></button>)}</aside>
      <div className="interior-editor-stage"><div ref={roomRef} className="interior-editor-room" style={{ width: draft.width * ROOM_TILE, height: draft.height * ROOM_TILE, backgroundColor: draft.floorColor, borderColor: draft.wallColor, "--room-tile": `${ROOM_TILE}px` }}>
        {draft.items.map((item) => <button key={item.id} className={`decor-item ${selectedItemId === item.id ? "selected" : ""}`} style={{ left: item.x * ROOM_TILE, top: item.y * ROOM_TILE, width: item.w * ROOM_TILE, height: item.h * ROOM_TILE, background: item.color }} onPointerDown={(event) => { event.preventDefault(); dragRef.current = { id: item.id }; setSelectedItemId(item.id); }}><span>{item.icon}</span><small>{item.label}</small></button>)}
        <div className="interior-door">▼ CỬA RA</div>
      </div></div>
      <aside className="interior-config"><strong>Cấu hình phòng</strong><label>Chiều rộng<input type="number" min="8" max="20" value={draft.width} onChange={(event) => setDraft((current) => ({ ...current, width: clamp(+event.target.value, 8, 20) }))} /></label><label>Chiều cao<input type="number" min="6" max="14" value={draft.height} onChange={(event) => setDraft((current) => ({ ...current, height: clamp(+event.target.value, 6, 14) }))} /></label><label>Màu sàn<input type="color" value={draft.floorColor} onChange={(event) => setDraft((current) => ({ ...current, floorColor: event.target.value }))} /></label><label>Màu tường<input type="color" value={draft.wallColor} onChange={(event) => setDraft((current) => ({ ...current, wallColor: event.target.value }))} /></label><div className="decor-count">{draft.items.length}<small>vật trang trí</small></div><button className="remove-decor" disabled={!selectedItemId} onClick={removeFurniture}>Xóa đồ đang chọn</button></aside>
    </div>
    <footer><button onClick={onClose}>Hủy</button><button className="save-interior" onClick={() => onSave(draft)}>Lưu nội thất</button></footer>
  </section></div>;
}

export default function MuaNuocNoiEditor() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [objects, setObjects] = useState(loadEditorMap);
  const [selectedId, setSelectedId] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [saved, setSaved] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [dragGhost, setDragGhost] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);
  const [interiorObjectId, setInteriorObjectId] = useState(null);
  const dragRef = useRef(null);

  const selected = objects.find((object) => object.id === selectedId);
  const interiorObject = objects.find((object) => object.id === interiorObjectId);
  const categories = useMemo(() => ["Tất cả", ...new Set(editorPalette.map((item) => item.category))], []);
  const visiblePalette = editorPalette.filter((item) => (category === "Tất cả" || item.category === category) && item.label.toLowerCase().includes(query.toLowerCase()));

  const commit = (next) => {
    setPast((history) => [...history.slice(-39), objects]);
    setObjects(normalizeEditorMap(next));
    setFuture([]);
    setSaved(false);
  };

  const beginPointerDrag = (event, payload) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    dragRef.current = { ...payload, startX: event.clientX, startY: event.clientY };
    setDragGhost({ ...payload, clientX: event.clientX, clientY: event.clientY });
  };

  useEffect(() => {
    const move = (event) => {
      if (!dragRef.current) return;
      event.preventDefault();
      setDragGhost((ghost) => ghost ? { ...ghost, clientX: event.clientX, clientY: event.clientY } : null);
      const rect = canvasRef.current?.getBoundingClientRect();
      const drag = dragRef.current;
      const item = drag.kind === "template" ? drag.item : objects.find((object) => object.id === drag.id);
      if (!rect || !item || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        setDropPreview(null);
      } else {
        const point = gridPosition(event, item.w, item.h);
        const safePoint = normalizeEditorMap([{ ...item, ...point, offsetX: 0, offsetY: 0 }])[0];
        setDropPreview({ x: safePoint.x, y: safePoint.y, w: item.w, h: item.h, label: item.label, color: item.color });
      }
    };
    const end = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      setDragGhost(null);
      setDropPreview(null);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      if (drag.kind === "template") {
        const point = gridPosition(event, drag.item.w, drag.item.h);
        const created = createEditorObject(drag.item, point.x, point.y);
        commit([...objects, created]);
        setSelectedId(created.id);
      } else {
        const moving = objects.find((item) => item.id === drag.id);
        if (!moving) return;
        const point = gridPosition(event, moving.w, moving.h);
        commit(objects.map((item) => item.id === drag.id ? { ...item, ...point, offsetX: 0, offsetY: 0 } : item));
        setSelectedId(drag.id);
      }
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); };
  }, [objects]);

  const updateSelected = (patch) => {
    if (!selected) return;
    commit(objects.map((object) => object.id === selected.id ? { ...object, ...patch } : object));
  };

  const nudgeSelected = (dx, dy) => {
    if (!selected) return;
    const pixelX = selected.x * TILE_SIZE + (selected.offsetX || 0);
    const pixelY = selected.y * TILE_SIZE + (selected.offsetY || 0);
    const nextPixelX = clamp(pixelX + dx, 0, (MAP_WIDTH - selected.w) * TILE_SIZE);
    const nextPixelY = clamp(pixelY + dy, 0, (MAP_HEIGHT - selected.h) * TILE_SIZE);
    const nextX = Math.floor(nextPixelX / TILE_SIZE);
    const nextY = Math.floor(nextPixelY / TILE_SIZE);
    updateSelected({ x: nextX, y: nextY, offsetX: nextPixelX - nextX * TILE_SIZE, offsetY: nextPixelY - nextY * TILE_SIZE });
  };

  const gridPosition = (event, width = 1, height = 1) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clamp(Math.floor((event.clientX - rect.left) / EDITOR_TILE), 0, MAP_WIDTH - width),
      y: clamp(Math.floor((event.clientY - rect.top) / EDITOR_TILE), 0, MAP_HEIGHT - height),
    };
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const objectId = event.dataTransfer.getData("application/x-mnn-object");
    if (objectId) {
      const moving = objects.find((item) => item.id === objectId);
      if (!moving) return;
      const point = gridPosition(event, moving.w, moving.h);
      commit(objects.map((item) => item.id === objectId ? { ...item, ...point, offsetX: 0, offsetY: 0 } : item));
      setSelectedId(objectId);
      return;
    }
    try {
      const template = JSON.parse(event.dataTransfer.getData("application/x-mnn-template"));
      const point = gridPosition(event, template.w, template.h);
      const created = createEditorObject(template, point.x, point.y);
      commit([...objects, created]);
      setSelectedId(created.id);
    } catch { /* Ignore unrelated drops. */ }
  };

  const undo = () => {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setFuture((items) => [objects, ...items]);
    setObjects(previous);
    setPast((items) => items.slice(0, -1));
    setSelectedId(null);
    setSaved(false);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setPast((items) => [...items, objects]);
    setObjects(next);
    setFuture((items) => items.slice(1));
    setSelectedId(null);
    setSaved(false);
  };

  const save = () => { saveEditorMap(objects); setSaved(true); };
  const duplicate = () => {
    if (!selected) return;
    const clone = { ...selected, id: `custom-${Date.now()}`, x: clamp(selected.x + 1, 0, MAP_WIDTH - selected.w), y: clamp(selected.y + 1, 0, MAP_HEIGHT - selected.h), label: `${selected.label} bản sao` };
    commit([...objects, clone]);
    setSelectedId(clone.id);
  };
  const removeSelected = () => { if (selected) { commit(objects.filter((item) => item.id !== selected.id)); setSelectedId(null); } };

  const exportMap = () => {
    const payload = saveEditorMap(objects);
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "phu-lam-map.json"; link.click(); URL.revokeObjectURL(url); setSaved(true);
  };
  const importMap = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.objects)) throw new Error("invalid");
      commit(data.objects);
      setSelectedId(null);
    } catch { window.alert("Tệp bản đồ không hợp lệ."); }
    event.target.value = "";
  };

  return <main className="map-editor">
    <header className="editor-topbar">
      <div className="editor-title"><button onClick={() => navigate("/mua-nuoc-noi")}>←</button><span>▦</span><div><small>AN GIANG · VÙNG PHÚ TÂN CŨ</small><strong>TRÌNH SOẠN BẢN ĐỒ PHÚ LÂM</strong></div></div>
      <div className="editor-history"><button onClick={undo} disabled={!past.length} title="Hoàn tác">↶</button><button onClick={redo} disabled={!future.length} title="Làm lại">↷</button><i /> <span>{objects.length} vật thể</span></div>
      <div className="editor-actions"><span className={saved ? "saved" : "unsaved"}>{saved ? "● Đã lưu" : "● Chưa lưu"}</span><button onClick={() => fileRef.current?.click()}>Nhập JSON</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={importMap} /><button onClick={exportMap}>Xuất JSON</button><button className="primary" onClick={save}>Lưu bản đồ</button><button onClick={() => { saveEditorMap(objects); navigate("/mua-nuoc-noi"); }}>▶ Chơi thử</button></div>
    </header>

    <div className="editor-layout">
      <aside className="object-library">
        <div className="editor-panel-heading"><small>THƯ VIỆN</small><strong>Vật thể</strong></div>
        <input className="library-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nhà, cây, ruộng..." />
        <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="palette-list">{visiblePalette.map((item) => <article key={item.type} onPointerDown={(event) => beginPointerDrag(event, { kind: "template", item })}><span style={{ "--item-color": item.color }}>{item.icon}</span><div><strong>{item.label}</strong><small>{item.w}×{item.h} ô · {item.collidable ? "Có va chạm" : "Đi xuyên"}</small></div><b>⋮⋮</b></article>)}</div>
        <div className="library-tip"><b>+</b><p>Kéo vật thể vào bản đồ. Kéo vật thể đã đặt để di chuyển.</p></div>
      </aside>

      <section className="editor-workspace">
        <div className="workspace-ruler"><span>XÃ PHÚ LÂM · SÔNG CÁI VỪNG</span><p>Lưới {MAP_WIDTH} × {MAP_HEIGHT} · Mỗi ô 24px trong game</p></div>
        <div className="canvas-scroll">
          <div
            ref={canvasRef}
            className="editor-canvas"
            style={{ width: MAP_WIDTH * EDITOR_TILE, height: MAP_HEIGHT * EDITOR_TILE, "--editor-tile": `${EDITOR_TILE}px` }}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
            onDrop={handleDrop}
            onClick={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}
          >
            <div className="editor-base-river"><span>SÔNG CÁI VỪNG</span></div><div className="editor-base-road horizontal" /><div className="editor-base-road vertical" />
            {objects.map((object) => <button
              key={object.id}
              className={`placed-object placed-${object.type} ${selectedId === object.id ? "selected" : ""}`}
              style={{ left: object.x * EDITOR_TILE + (object.offsetX || 0) * (EDITOR_TILE / TILE_SIZE), top: object.y * EDITOR_TILE + (object.offsetY || 0) * (EDITOR_TILE / TILE_SIZE), width: object.w * EDITOR_TILE, height: object.h * EDITOR_TILE, "--object-color": object.color }}
              onPointerDown={(event) => { event.stopPropagation(); setSelectedId(object.id); beginPointerDrag(event, { kind: "object", id: object.id, item: object }); }}
              onClick={(event) => { event.stopPropagation(); setSelectedId(object.id); }}
              title={`${object.label} (${object.x}, ${object.y})`}
            ><span>{object.icon}</span><small>{object.label}</small>{object.collidable && <i title="Có va chạm">◆</i>}</button>)}
            {dropPreview && <div className="editor-drop-preview" style={{ left: dropPreview.x * EDITOR_TILE, top: dropPreview.y * EDITOR_TILE, width: dropPreview.w * EDITOR_TILE, height: dropPreview.h * EDITOR_TILE, "--preview-color": dropPreview.color }}><span>{dropPreview.w} × {dropPreview.h} ô</span><small>{dropPreview.label}</small></div>}
            {!objects.length && <div className="empty-canvas"><span>▦</span><strong>Bản đồ đang trống</strong><p>Kéo một vật thể từ thư viện vào đây</p></div>}
          </div>
        </div>
        <footer className="canvas-status"><span>⌖ {selected ? `${selected.x}, ${selected.y}` : "Chưa chọn"}</span><span>Nam châm lưới: Bật</span><span>Thu phóng: 100%</span></footer>
      </section>

      <aside className="object-inspector">
        <div className="editor-panel-heading"><small>THUỘC TÍNH</small><strong>{selected ? selected.label : "Chưa chọn vật thể"}</strong></div>
        {!selected ? <div className="inspector-empty"><span>◇</span><p>Chọn một vật thể trên bản đồ để chỉnh sửa.</p></div> : <div className="inspector-form">
          <label>Tên hiển thị<input value={selected.label} onChange={(event) => updateSelected({ label: event.target.value })} /></label>
          <div className="field-row"><label>Tọa độ X<input type="number" min="0" max={MAP_WIDTH - selected.w} value={selected.x} onChange={(event) => updateSelected({ x: clamp(+event.target.value, 0, MAP_WIDTH - selected.w) })} /></label><label>Tọa độ Y<input type="number" min="0" max={MAP_HEIGHT - selected.h} value={selected.y} onChange={(event) => updateSelected({ y: clamp(+event.target.value, 0, MAP_HEIGHT - selected.h) })} /></label></div>
          <div className="pixel-nudge"><div><small>TINH CHỈNH TỪNG PIXEL</small><strong>X {selected.x * TILE_SIZE + (selected.offsetX || 0)}px · Y {selected.y * TILE_SIZE + (selected.offsetY || 0)}px</strong></div><div className="nudge-pad"><button onClick={() => nudgeSelected(0, -1)} title="Lên 1 pixel">▲</button><button onClick={() => nudgeSelected(-1, 0)} title="Trái 1 pixel">◀</button><button onClick={() => nudgeSelected(0, 1)} title="Xuống 1 pixel">▼</button><button onClick={() => nudgeSelected(1, 0)} title="Phải 1 pixel">▶</button></div><p>Mỗi lần bấm dịch đúng 1 pixel trong game.</p></div>
          <div className="field-row"><label>Rộng<input type="number" min="1" max="10" value={selected.w} onChange={(event) => updateSelected({ w: clamp(+event.target.value, 1, 10) })} /></label><label>Cao<input type="number" min="1" max="10" value={selected.h} onChange={(event) => updateSelected({ h: clamp(+event.target.value, 1, 10) })} /></label></div>
          <label>Màu vật thể<div className="color-input"><input type="color" value={selected.color} onChange={(event) => updateSelected({ color: event.target.value })} /><code>{selected.color}</code></div></label>
          <label className="switch-row"><span><strong>Va chạm</strong><small>Nhân vật không thể đi xuyên</small></span><input type="checkbox" checked={selected.collidable} onChange={(event) => updateSelected({ collidable: event.target.checked })} /></label>
          <label className="switch-row"><span><strong>Có thể tương tác</strong><small>Hiện nút tương tác khi đến gần</small></span><input type="checkbox" checked={selected.interactive} onChange={(event) => updateSelected({ interactive: event.target.checked })} /></label>
          {INTERIOR_TYPES.has(selected.type) && <button className="open-interior-editor" onClick={() => setInteriorObjectId(selected.id)}><span>⌂</span><div><strong>Chỉnh nội thất</strong><small>{selected.interior?.items?.length || 0} vật trang trí · có thể bước vào</small></div><b>→</b></button>}
          <div className="object-summary"><span style={{ "--item-color": selected.color }}>{selected.icon}</span><div><small>LOẠI VẬT THỂ</small><strong>{selected.type}</strong><p>ID: {selected.id}</p></div></div>
          <div className="inspector-buttons"><button onClick={duplicate}>⧉ Nhân bản</button><button className="danger" onClick={removeSelected}>⌫ Xóa</button></div>
        </div>}
      </aside>
    </div>
    {dragGhost && <div className="editor-drag-ghost" style={{ left: dragGhost.clientX, top: dragGhost.clientY, "--ghost-color": dragGhost.item?.color }}><span>{dragGhost.item?.icon || "◆"}</span><small>{dragGhost.item?.label || "Di chuyển vật thể"}</small></div>}
    {interiorObject && <InteriorEditor object={interiorObject} onClose={() => setInteriorObjectId(null)} onSave={(interior) => { commit(objects.map((object) => object.id === interiorObject.id ? { ...object, interior, interactive: true } : object)); setInteriorObjectId(null); }} />}
  </main>;
}
