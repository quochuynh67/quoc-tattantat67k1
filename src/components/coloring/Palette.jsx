import React, { useRef } from 'react';
import useColoringStore from '../../store/useColoringStore';

// Colors organized by hue groups for better visual experience
const COLOR_GROUPS = [
  // Reds
  '#FF0000', '#FF4500', '#DC143C',
  // Oranges & Yellows
  '#FF8C00', '#FFD700', '#FFFF00',
  // Greens
  '#9ACD32', '#32CD32', '#00FA9A', '#228B22',
  // Blues & Cyans
  '#00CED1', '#1E90FF', '#0000FF', '#4169E1',
  // Purples & Pinks
  '#8A2BE2', '#FF00FF', '#FF69B4', '#FFB6C1',
  // Browns & Neutrals
  '#8B4513', '#A0522D', '#D2691E', '#F5DEB3',
  // Grayscale
  '#FFFFFF', '#D3D3D3', '#808080', '#000000',
];

// Vietnamese color names for accessibility
const COLOR_NAMES = {
  '#FF0000': 'Đỏ',
  '#FF4500': 'Cam đỏ',
  '#DC143C': 'Đỏ thẫm',
  '#FF8C00': 'Cam',
  '#FFD700': 'Vàng gold',
  '#FFFF00': 'Vàng',
  '#9ACD32': 'Xanh lá non',
  '#32CD32': 'Xanh lá',
  '#00FA9A': 'Xanh ngọc',
  '#228B22': 'Xanh rừng',
  '#00CED1': 'Xanh dương nhạt',
  '#1E90FF': 'Xanh dương',
  '#0000FF': 'Xanh đậm',
  '#4169E1': 'Xanh hoàng gia',
  '#8A2BE2': 'Tím',
  '#FF00FF': 'Hồng tím',
  '#FF69B4': 'Hồng',
  '#FFB6C1': 'Hồng nhạt',
  '#8B4513': 'Nâu đất',
  '#A0522D': 'Nâu',
  '#D2691E': 'Nâu cam',
  '#F5DEB3': 'Lúa mì',
  '#FFFFFF': 'Trắng',
  '#D3D3D3': 'Xám nhạt',
  '#808080': 'Xám',
  '#000000': 'Đen',
};

const Palette = () => {
  const currentColor = useColoringStore((state) => state.currentColor);
  const setCurrentColor = useColoringStore((state) => state.setCurrentColor);
  const tool = useColoringStore((state) => state.tool);
  const setTool = useColoringStore((state) => state.setTool);
  const currentPageId = useColoringStore((state) => state.currentPageId);
  const undo = useColoringStore((state) => state.undo);
  const redo = useColoringStore((state) => state.redo);
  const canUndo = useColoringStore((state) => state.canUndo);
  const canRedo = useColoringStore((state) => state.canRedo);

  const colorPickerRef = useRef(null);

  const hasUndo = canUndo(currentPageId);
  const hasRedo = canRedo(currentPageId);

  const handleCustomColor = (e) => {
    setCurrentColor(e.target.value);
    setTool('brush');
  };

  const toolBtnStyle = (isActive) => ({
    padding: '6px 12px',
    borderRadius: 12,
    border: isActive ? '2px solid #4338CA' : '2px solid #E2E8F0',
    background: isActive ? '#EDE9FE' : '#F8FAFC',
    color: isActive ? '#4338CA' : '#64748B',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  });

  const actionBtnStyle = (enabled) => ({
    padding: '6px 10px',
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    background: enabled ? '#F8FAFC' : '#F1F5F9',
    color: enabled ? '#475569' : '#CBD5E1',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: enabled ? 'pointer' : 'default',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    opacity: enabled ? 1 : 0.5,
  });

  return (
    <div style={{
      width: '100%',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #F1F5F9',
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Row 1: Tools & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}>
        {/* Tools */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setTool('brush')}
            style={toolBtnStyle(tool === 'brush')}
            title="Cọ tô màu"
          >
            🖌️ Cọ
          </button>
          <button
            onClick={() => setTool('eraser')}
            style={toolBtnStyle(tool === 'eraser')}
            title="Tẩy xóa"
          >
            🧹 Tẩy
          </button>

          {/* Separator */}
          <div style={{ width: 1, height: 24, background: '#E2E8F0', margin: '0 2px', flexShrink: 0 }} />

          {/* Undo/Redo */}
          <button
            onClick={() => hasUndo && undo(currentPageId)}
            style={actionBtnStyle(hasUndo)}
            title="Hoàn tác"
            disabled={!hasUndo}
          >
            ↩️
          </button>
          <button
            onClick={() => hasRedo && redo(currentPageId)}
            style={actionBtnStyle(hasRedo)}
            title="Làm lại"
            disabled={!hasRedo}
          >
            ↪️
          </button>
        </div>

        {/* Current color display & custom picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F8FAFC',
            padding: '4px 10px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
          }}>
            <span
              style={{
                display: 'inline-block',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: currentColor,
                border: '2px solid #CBD5E1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>
              {COLOR_NAMES[currentColor] || currentColor}
            </span>
          </div>

          {/* Custom color picker */}
          <button
            onClick={() => colorPickerRef.current?.click()}
            style={{
              padding: '5px 10px',
              borderRadius: 10,
              border: '1.5px dashed #A78BFA',
              background: 'linear-gradient(135deg, #EDE9FE, #FDE68A, #FBCFE8)',
              color: '#6D28D9',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}
            title="Chọn màu tùy ý"
          >
            🎨 Tùy chọn
          </button>
          <input
            type="color"
            ref={colorPickerRef}
            value={currentColor}
            onChange={handleCustomColor}
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Row 2: Color swatches */}
      <div style={{ position: 'relative' }}>
        <style>{`.palette-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div
          className="palette-scroll"
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: 6,
            paddingBottom: 4,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {COLOR_GROUPS.map((color) => {
            const isActive = currentColor === color && tool === 'brush';
            return (
              <button
                key={color}
                onClick={() => {
                  setCurrentColor(color);
                  setTool('brush');
                }}
                title={COLOR_NAMES[color] || color}
                style={{
                  flexShrink: 0,
                  width: isActive ? 38 : 32,
                  height: isActive ? 38 : 32,
                  borderRadius: '50%',
                  border: isActive
                    ? '3px solid #1E293B'
                    : color === '#FFFFFF'
                      ? '2px solid #D1D5DB'
                      : '2px solid transparent',
                  background: color,
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? '0 2px 8px rgba(0,0,0,0.2)'
                    : '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                }}
                aria-label={`Chọn màu ${COLOR_NAMES[color] || color}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Palette;
