import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import useColoringStore from '../../store/useColoringStore';
import Sparkles from './Sparkles';
import { playPopSound, playMagicSound } from '../../utils/kidsAudio';

const VALID_TAGS = ['path', 'polygon', 'rect', 'circle', 'ellipse', 'line', 'polyline'];

const ColoringPage = ({ svgRaw, pageId, isDrawingAnimated, onAnimationFinish }) => {
  const currentColor = useColoringStore((state) => state.currentColor);
  const tool = useColoringStore((state) => state.tool);
  const colorRegion = useColoringStore((state) => state.colorRegion);
  const eraseRegion = useColoringStore((state) => state.eraseRegion);
  const pageColors = useColoringStore((state) => state.pages[pageId]);
  
  const [activeSparkles, setActiveSparkles] = useState([]);
  const safePageColors = pageColors || {};

  // Trigger sound & particle effect
  const triggerSparkle = (x, y, color) => {
    const id = Date.now() + Math.random();
    setActiveSparkles((prev) => [...prev.slice(-4), { id, x, y, color }]);
    setTimeout(() => {
      setActiveSparkles((prev) => prev.filter((s) => s.id !== id));
    }, 1000);
  };

  const dynamicStyles = useMemo(() => {
    const colorRules = Object.entries(safePageColors)
      .map(([regionId, color]) => {
        const escapedId = CSS.escape(regionId);
        return `.svg-container svg #${escapedId} { fill: ${color} !important; animation: pathFillPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }`;
      })
      .join('\n');

    // Stroke drawing keyframes when animation is active
    const strokeAnimRule = isDrawingAnimated ? `
      .svg-container svg path,
      .svg-container svg polygon,
      .svg-container svg rect,
      .svg-container svg circle,
      .svg-container svg ellipse,
      .svg-container svg line,
      .svg-container svg polyline {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: drawStrokeMagic 2.2s ease-in-out forwards;
      }
    ` : '';

    return `
      .svg-container svg { 
        width: 100%; 
        height: auto; 
        max-height: 70vh; 
        max-width: 100%; 
        display: block; 
        margin: auto; 
        filter: drop-shadow(0 8px 16px rgba(0,0,0,0.06));
      }
      .svg-container svg path,
      .svg-container svg polygon,
      .svg-container svg rect,
      .svg-container svg circle,
      .svg-container svg ellipse,
      .svg-container svg line,
      .svg-container svg polyline {
        pointer-events: all !important;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: fill 0.25s ease, filter 0.15s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform-origin: center;
      }
      .svg-container svg path[id]:hover,
      .svg-container svg polygon[id]:hover,
      .svg-container svg rect[id]:hover,
      .svg-container svg circle[id]:hover,
      .svg-container svg ellipse[id]:hover,
      .svg-container svg line[id]:hover,
      .svg-container svg polyline[id]:hover {
        filter: brightness(0.95) drop-shadow(0 0 8px rgba(108, 92, 231, 0.6));
        stroke-width: 3.5px !important;
        cursor: ${tool === 'eraser' ? 'not-allowed' : 'crosshair'};
      }
      
      @keyframes pathFillPop {
        0% { transform: scale(0.97); }
        50% { transform: scale(1.03); }
        100% { transform: scale(1); }
      }

      @keyframes drawStrokeMagic {
        to {
          stroke-dashoffset: 0;
        }
      }

      ${strokeAnimRule}
      ${colorRules}
    `;
  }, [safePageColors, tool, isDrawingAnimated]);

  useEffect(() => {
    if (isDrawingAnimated) {
      const timer = setTimeout(() => {
        if (onAnimationFinish) onAnimationFinish();
      }, 2300);
      return () => clearTimeout(timer);
    }
  }, [isDrawingAnimated, onAnimationFinish]);

  const handleClick = useCallback((e) => {
    let target = e.target;
    let maxWalk = 5;
    
    while (target && maxWalk > 0) {
      const tagName = target.tagName?.toLowerCase();
      if (VALID_TAGS.includes(tagName) && target.id) {
        const clickX = e.clientX;
        const clickY = e.clientY;

        if (tool === 'eraser') {
          eraseRegion(pageId, target.id);
          playPopSound();
        } else {
          colorRegion(pageId, target.id, currentColor);
          playMagicSound();
          triggerSparkle(clickX, clickY, currentColor);
        }
        return;
      }
      if (tagName === 'g') {
        target = null;
        break;
      }
      target = target.parentElement;
      maxWalk--;
    }
  }, [pageId, currentColor, tool, colorRegion, eraseRegion]);

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden rounded-xl">
      <style>{dynamicStyles}</style>
      
      {/* Sparkles Particle Layer */}
      <Sparkles activeSparkles={activeSparkles} />

      {/* Tool indicator badge */}
      <div 
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: tool === 'eraser' 
            ? 'rgba(239,68,68,0.92)' 
            : 'rgba(108,92,231,0.92)',
          color: '#fff',
          padding: '5px 14px',
          borderRadius: 14,
          fontSize: '0.8rem',
          fontWeight: 800,
          backdropFilter: 'blur(6px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
        }}
      >
        {tool === 'eraser' ? '🧹 Chế Độ Tẩy' : '✨ Chế Độ Tô Magic'}
        {tool === 'brush' && (
          <span 
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: currentColor,
              border: '2px solid rgba(255,255,255,0.9)',
              boxShadow: '0 0 6px rgba(0,0,0,0.2)',
            }}
          />
        )}
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
          <div 
            className="svg-container w-full h-full touch-none flex items-center justify-center"
            style={{ cursor: tool === 'eraser' ? 'not-allowed' : 'crosshair' }}
            dangerouslySetInnerHTML={{ __html: svgRaw }} 
            onClick={handleClick}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default ColoringPage;
