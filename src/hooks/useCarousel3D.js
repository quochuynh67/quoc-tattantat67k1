// src/hooks/useCarousel3D.js – vòng xoay 3D dùng chung (PhotoRestore gallery, ToolsSection...)
// Rotation chạy bằng rAF: tự xoay + quán tính sau khi kéo + xoay mượt tới mục được bấm.
import { useCallback, useEffect, useRef, useState } from "react";

export const normalizeAngle = (deg) => ((deg % 360) + 360) % 360;

export function useCarousel3D({ autoSpeed = 0.014, dragSensitivity = 0.4 } = {}) {
  const viewportRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(null);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const pausedRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const lastPointerTimeRef = useRef(0);

  useEffect(() => {
    let rafId;
    let lastTime = performance.now();
    const tick = (time) => {
      const dt = Math.min(time - lastTime, 48);
      lastTime = time;

      if (targetRotationRef.current !== null) {
        const diff = ((targetRotationRef.current - rotationRef.current + 540) % 360) - 180;
        if (Math.abs(diff) < 0.3) {
          rotationRef.current = targetRotationRef.current;
          targetRotationRef.current = null;
        } else {
          rotationRef.current += diff * 0.1;
        }
        setRotation(rotationRef.current);
      } else if (!draggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.0008) {
          rotationRef.current += velocityRef.current * dt;
          velocityRef.current *= Math.pow(0.94, dt / 16.67);
        } else if (!pausedRef.current) {
          rotationRef.current += autoSpeed * dt;
        }
        setRotation(rotationRef.current);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoSpeed]);

  const onPointerDown = useCallback((e) => {
    draggingRef.current = true;
    targetRotationRef.current = null;
    velocityRef.current = 0;
    lastPointerXRef.current = e.clientX;
    lastPointerTimeRef.current = e.timeStamp;
    viewportRef.current?.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointerXRef.current;
    const dt = Math.max(e.timeStamp - lastPointerTimeRef.current, 8);
    lastPointerXRef.current = e.clientX;
    lastPointerTimeRef.current = e.timeStamp;
    const deltaDeg = dx * dragSensitivity;
    rotationRef.current += deltaDeg;
    velocityRef.current = (deltaDeg / dt) * 14;
    setRotation(rotationRef.current);
  }, [dragSensitivity]);

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const onMouseEnter = useCallback(() => { pausedRef.current = true; }, []);
  const onMouseLeave = useCallback(() => {
    pausedRef.current = false;
    draggingRef.current = false;
  }, []);

  // Xoay mượt để item ở góc itemAngle ra chính diện
  const rotateItemToFront = useCallback((itemAngle) => {
    velocityRef.current = 0;
    targetRotationRef.current = normalizeAngle(-itemAngle);
  }, []);

  const viewportHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave: onMouseLeave,
    onMouseEnter,
    onMouseLeave,
  };

  return { viewportRef, rotation, rotationRef, viewportHandlers, rotateItemToFront };
}
