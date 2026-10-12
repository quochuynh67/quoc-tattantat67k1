import React, { useRef, useState } from 'react';
import useColoringStore from '../../store/useColoringStore';
import ColoringPage from './ColoringPage';
import Palette from './Palette';
import { playMagicSound, playFanfareSound } from '../../utils/kidsAudio';

import iceCreamSvg from '../../assets/coloring/ice-cream.svg?raw';
import gardenSvg from '../../assets/coloring/garden.svg?raw';
import butterflySvg from '../../assets/coloring/butterfly.svg?raw';
import houseSvg from '../../assets/coloring/house.svg?raw';
import fishSvg from '../../assets/coloring/fish.svg?raw';
import carSvg from '../../assets/coloring/car.svg?raw';
import starMoonSvg from '../../assets/coloring/star-moon.svg?raw';
import flowerPotSvg from '../../assets/coloring/flower-pot.svg?raw';
import rocketSvg from '../../assets/coloring/rocket.svg?raw';
import dinosaurSvg from '../../assets/coloring/dinosaur.svg?raw';
import teddyBearSvg from '../../assets/coloring/teddy-bear.svg?raw';
import airplaneSvg from '../../assets/coloring/airplane.svg?raw';

const BUILTIN_PAGES = [
  { id: 'ice-cream',  name: '🍦 Que Kem',       svg: iceCreamSvg,  emoji: '🍦' },
  { id: 'garden',     name: '🌻 Khu Vườn',      svg: gardenSvg,    emoji: '🌻' },
  { id: 'butterfly',  name: '🦋 Bươm Bướm',    svg: butterflySvg, emoji: '🦋' },
  { id: 'house',      name: '🏠 Ngôi Nhà',      svg: houseSvg,     emoji: '🏠' },
  { id: 'fish',       name: '🐟 Con Cá',        svg: fishSvg,      emoji: '🐟' },
  { id: 'car',        name: '🚗 Xe Ô Tô',      svg: carSvg,       emoji: '🚗' },
  { id: 'star-moon',  name: '🌙 Trăng Sao',    svg: starMoonSvg,  emoji: '🌙' },
  { id: 'flower-pot', name: '🌸 Chậu Hoa',     svg: flowerPotSvg, emoji: '🌸' },
  { id: 'rocket',     name: '🚀 Tên Lửa',      svg: rocketSvg,    emoji: '🚀' },
  { id: 'dinosaur',   name: '🦖 Khủng Long',    svg: dinosaurSvg,  emoji: '🦖' },
  { id: 'teddy-bear', name: '🧸 Gấu Bông',      svg: teddyBearSvg, emoji: '🧸' },
  { id: 'airplane',   name: '✈️ Máy Bay',      svg: airplaneSvg,  emoji: '✈️' },
];

const MAGIC_PALETTE = [
  '#FF7675', '#74B9FF', '#55E6C1', '#F39C12', '#A29BFE', '#FD79A8',
  '#00CEC9', '#FFEAA7', '#FAB1A0', '#E17055', '#6C5CE7', '#00B894'
];

const ColoringGame = () => {
  const currentPageId = useColoringStore((state) => state.currentPageId);
  const setCurrentPage = useColoringStore((state) => state.setCurrentPage);
  const customPages = useColoringStore((state) => state.customPages || {});
  const addCustomPage = useColoringStore((state) => state.addCustomPage);
  const deleteCustomPage = useColoringStore((state) => state.deleteCustomPage);
  const resetPage = useColoringStore((state) => state.resetPage);
  const colorRegion = useColoringStore((state) => state.colorRegion);

  const fileInputRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const [isDrawingAnimated, setIsDrawingAnimated] = useState(false);
  const [isAutoColoring, setIsAutoColoring] = useState(false);

  const allPages = [
    ...BUILTIN_PAGES,
    ...Object.entries(customPages).map(([id, data]) => ({
      id,
      name: data.name,
      svg: data.svgRaw,
      emoji: '📄',
      isCustom: true
    }))
  ];

  const currentPage = allPages.find(p => p.id === currentPageId) || BUILTIN_PAGES[0];

  const processSvgString = (rawSvg) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawSvg, "image/svg+xml");
      let counter = 0;

      const shapeSelectors = 'path, polygon, rect, circle, ellipse, line, polyline';
      doc.querySelectorAll(shapeSelectors).forEach(el => {
        if (!el.id) {
          el.id = 'region-' + counter;
        }
        counter++;
      });

      doc.querySelectorAll('use').forEach(useEl => {
        const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
        if (href && href.startsWith('#')) {
          const refEl = doc.querySelector(href);
          if (refEl) {
            const clone = refEl.cloneNode(true);
            clone.id = 'use-resolved-' + counter;
            counter++;
            const x = useEl.getAttribute('x') || '0';
            const y = useEl.getAttribute('y') || '0';
            const existingTransform = clone.getAttribute('transform') || '';
            if (x !== '0' || y !== '0') {
              clone.setAttribute('transform', `translate(${x}, ${y}) ${existingTransform}`);
            }
            useEl.parentNode.replaceChild(clone, useEl);
          }
        }
      });

      doc.querySelectorAll(shapeSelectors).forEach(el => {
        const fill = el.getAttribute('fill');
        if (fill && fill !== 'none' && fill !== '#000' && fill !== '#222' && fill !== '#000000' && fill !== '#222222' && fill !== 'black') {
          el.setAttribute('fill', '#ffffff');
        }
        if (!el.getAttribute('stroke')) {
          el.setAttribute('stroke', '#222');
          el.setAttribute('stroke-width', '2.5');
        }
      });

      let processed = doc.documentElement.outerHTML;
      const svgStartIndex = processed.indexOf('<svg');
      if (svgStartIndex !== -1) {
        processed = processed.substring(svgStartIndex);
      }
      return processed;
    } catch (e) {
      console.error("Lỗi parse SVG:", e);
      return rawSvg;
    }
  };

  // Magic Auto-Coloring Sequential Animation Mode
  const handleAutoMagicFill = () => {
    if (isAutoColoring) return;
    setIsAutoColoring(true);

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(currentPage.svg, "image/svg+xml");
      const shapeSelectors = 'path, polygon, rect, circle, ellipse';
      const elements = Array.from(doc.querySelectorAll(shapeSelectors)).filter(el => el.id);

      elements.forEach((el, index) => {
        setTimeout(() => {
          const randomColor = MAGIC_PALETTE[index % MAGIC_PALETTE.length];
          colorRegion(currentPageId, el.id, randomColor);
          playMagicSound();

          if (index === elements.length - 1) {
            setTimeout(() => {
              playFanfareSound();
              setIsAutoColoring(false);
            }, 300);
          }
        }, index * 250);
      });
    } catch (e) {
      console.warn("Auto color error:", e);
      setIsAutoColoring(false);
    }
  };

  const handleReplayDrawStroke = () => {
    setIsDrawingAnimated(true);
    playMagicSound();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.includes("svg") || file.name.toLowerCase().endsWith(".svg"))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const processedSvg = processSvgString(event.target.result);
        const id = 'custom-' + Date.now();
        addCustomPage(id, file.name.replace(/\.svg$/i, ''), processedSvg);
        setShowPicker(false);
      };
      reader.readAsText(file);
    } else if (file) {
      alert("Vui lòng chọn file .svg hợp lệ!");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlImport = () => {
    const url = prompt("Nhập đường dẫn (URL) tới file SVG:");
    if (url) {
      fetch(url)
        .then(res => res.text())
        .then(text => {
          if (text.includes('<svg')) {
            const processedSvg = processSvgString(text);
            const id = 'url-' + Date.now();
            addCustomPage(id, "Tải từ URL", processedSvg);
            setShowPicker(false);
          } else {
            alert("URL không trả về nội dung SVG hợp lệ.");
          }
        })
        .catch(err => alert("Không thể tải SVG từ URL: " + err.message));
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '85vh',
      maxHeight: '85vh',
      width: '100%',
      maxWidth: 1100,
      margin: '0 auto',
      padding: 8,
      gap: 8,
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
        padding: '8px 12px',
        borderRadius: 14,
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {/* Left: Current page info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowPicker(!showPicker)}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              border: '2px solid #A78BFA',
              background: showPicker ? '#7C3AED' : 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
              color: showPicker ? '#fff' : '#5B21B6',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            {showPicker ? '✕ Đóng' : '📋 Chọn Tranh'}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#fff',
            padding: '6px 14px',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
          }}>
            <span style={{ fontSize: '1.2rem' }}>{currentPage.emoji || '🖼️'}</span>
            <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>{currentPage.name}</span>
          </div>
        </div>

        {/* Center: Animation Controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={handleReplayDrawStroke}
            disabled={isDrawingAnimated}
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              border: '1.5px solid #FDBA74',
              background: '#FFF7ED',
              color: '#C2410C',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: isDrawingAnimated ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Phát lại hiệu ứng phác thảo nét vẽ"
          >
            🎬 Xem Vẽ Nét
          </button>

          <button
            onClick={handleAutoMagicFill}
            disabled={isAutoColoring}
            style={{
              padding: '7px 14px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #FF7675, #74B9FF)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: isAutoColoring ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(116,185,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Tự động tô màu hoạt họa nối tiếp"
          >
            {isAutoColoring ? '✨ Đang Tô Magic...' : '✨ Auto Tô Magic'}
          </button>
        </div>

        {/* Right: Import/Reset Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              border: '1.5px solid #93C5FD',
              background: '#EFF6FF',
              color: '#1D4ED8',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Nhập File SVG"
          >
            📁 <span className="hidden md:inline">Nhập SVG</span>
          </button>
          <input
            type="file"
            accept=".svg"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          <button
            onClick={handleUrlImport}
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              border: '1.5px solid #C4B5FD',
              background: '#F5F3FF',
              color: '#6D28D9',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Tải từ URL"
          >
            🔗 <span className="hidden md:inline">URL</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Xóa trắng toàn bộ tranh này?')) {
                resetPage(currentPageId);
              }
            }}
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              border: '1.5px solid #FCA5A5',
              background: '#FEF2F2',
              color: '#DC2626',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Xóa trắng"
          >
            🧹 <span className="hidden md:inline">Xóa trắng</span>
          </button>

          {currentPage.isCustom && (
            <button
              onClick={() => { if (window.confirm("Xóa tranh này?")) deleteCustomPage(currentPage.id); }}
              style={{
                padding: '7px 12px',
                borderRadius: 10,
                border: '1.5px solid #FCA5A5',
                background: '#FEF2F2',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              🗑️ Xóa tranh
            </button>
          )}
        </div>
      </div>

      {/* Page Picker Overlay */}
      {showPicker && (
        <div style={{
          background: '#F8FAFC',
          borderRadius: 16,
          padding: 16,
          border: '2px solid #E2E8F0',
          maxHeight: 240,
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 10,
          }}>
            {allPages.map((page) => {
              const isActive = page.id === currentPageId;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setCurrentPage(page.id);
                    setShowPicker(false);
                    setIsDrawingAnimated(true);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    borderRadius: 14,
                    border: isActive ? '3px solid #7C3AED' : '2px solid #E2E8F0',
                    background: isActive
                      ? 'linear-gradient(135deg, #EDE9FE, #DDD6FE)'
                      : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(124,58,237,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transform: isActive ? 'scale(1.03)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '2rem', marginBottom: 4 }}>{page.emoji || '📄'}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isActive ? '#5B21B6' : '#475569',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}>
                    {page.name.replace(/^[^\s]+ /, '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div style={{
        flexGrow: 1,
        border: '3px dashed #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 0,
      }}>
        {currentPage?.svg ? (
          <ColoringPage
            svgRaw={currentPage.svg}
            pageId={currentPage.id}
            isDrawingAnimated={isDrawingAnimated}
            onAnimationFinish={() => setIsDrawingAnimated(false)}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#94A3B8',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}>
            Không tìm thấy ảnh...
          </div>
        )}
      </div>

      {/* Palette */}
      <Palette />
    </div>
  );
};

export default ColoringGame;
