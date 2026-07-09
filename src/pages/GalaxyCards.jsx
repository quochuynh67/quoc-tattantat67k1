// src/pages/GalaxyCards.jsx
// 3D Galaxy simulation with orbiting quote cards around diverse planets
import React, { useState, useRef, useMemo, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import { getSiteSetting } from "../lib/phuTanApi";

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_PLANET_KEY = "galaxy_planet";

const MOBILE_QUERY = "(max-width: 768px)";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_QUERY).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

// width > 0: trả về thumbnail Drive đúng kích thước (nhẹ hơn nhiều so với file gốc).
// width = 0: giữ link download gốc (dùng cho audio/bgm).
function processDriveUrl(url, width = 0) {
  if (!url) return url;
  let fileId = null;
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) {
    fileId = match1[1];
  } else {
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) fileId = match2[1];
  }
  if (fileId) {
    if (width > 0) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
    }
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

// ── Hàng đợi tải ảnh: tối đa N ảnh tải song song để không nghẽn mạng/giật hình ─

const imgQueue = { active: 0, max: 4, pending: [] };

// Resolve với chính element ảnh (hoặc null nếu lỗi) để có thể vẽ lên canvas.
// cors = true khi ảnh sẽ được upload lên WebGL texture (cần crossOrigin).
function requestImageLoad(url, cors = false) {
  return new Promise((resolve) => {
    const task = () => {
      imgQueue.active++;
      const img = new Image();
      const done = (result) => {
        imgQueue.active--;
        const next = imgQueue.pending.shift();
        if (next) next();
        resolve(result);
      };
      img.onload = () => done(img);
      img.onerror = () => done(null);
      img.decoding = "async";
      if (cors && !url.startsWith("data:")) img.crossOrigin = "anonymous";
      img.src = url;
    };
    if (imgQueue.active < imgQueue.max) task();
    else imgQueue.pending.push(task);
  });
}

function QueuedImage({ src, alt = "", style, placeholderStyle }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setLoaded(false);
    requestImageLoad(src).then((ok) => {
      if (!cancelled && ok) setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [src]);

  if (!loaded) {
    return (
      <div style={{
        ...style,
        background: "linear-gradient(110deg, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 70%)",
        backgroundSize: "200% 100%",
        animation: "imgShimmer 1.4s linear infinite",
        ...placeholderStyle,
      }} />
    );
  }

  return <img src={src} alt={alt} style={style} decoding="async" />;
}

// ── Thẻ bài → CanvasTexture ──────────────────────────────────────────────────
// Trước đây mỗi thẻ là 1 <Html> (DOM + backdrop-filter) bị cập nhật transform
// mỗi frame → 30 thẻ là 30 lần style-recalc/composite mỗi frame, gây lag nặng.
// Giờ mỗi thẻ được vẽ đúng 1 lần vào canvas rồi render bằng GPU sprite: 0 DOM.

const CARD_TEX_W = 140;
const CARD_TEX_IMG_H = 90;
const CARD_TEX_H = 168;
const CARD_TEX_SCALE = 2; // vẽ 2x cho nét

function pathRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  let truncated = false;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) {
        truncated = true;
        break;
      }
    } else {
      line = test;
    }
  }
  if (!truncated && line && lines.length < maxLines) lines.push(line);
  if (truncated) {
    let last = lines[maxLines - 1];
    while (last.length && ctx.measureText(last + "…").width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + "…";
    lines.length = maxLines;
  }
  return lines;
}

function drawCardCanvas(ctx, card, img) {
  const s = CARD_TEX_SCALE;
  const W = CARD_TEX_W * s;
  const H = CARD_TEX_H * s;
  const IMG_H = CARD_TEX_IMG_H * s;
  const R = 14 * s;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  pathRoundRect(ctx, s, s, W - 2 * s, H - 2 * s, R);
  ctx.fillStyle = "rgba(10,10,30,0.94)";
  ctx.fill();
  ctx.clip();

  if (img) {
    // crop kiểu object-fit: cover
    const target = W / IMG_H;
    const ar = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (ar > target) {
      sw = sh * target;
      sx = (img.width - sw) / 2;
    } else {
      sh = sw / target;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, s, s, W - 2 * s, IMG_H - s);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, IMG_H);
    g.addColorStop(0, "rgba(124,77,255,0.30)");
    g.addColorStop(1, "rgba(20,20,60,0.85)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, IMG_H);
    ctx.font = `${28 * s}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨", W / 2, IMG_H / 2);
  }

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, IMG_H, W, s);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${11 * s}px 'Inter', -apple-system, sans-serif`;
  ctx.fillStyle = "#e0e0e0";
  const quote = `"${(card.quote || "...").slice(0, 60)}"`;
  const lines = wrapCanvasText(ctx, quote, W - 24 * s, 2);
  lines.forEach((line, i) => {
    ctx.fillText(line, 12 * s, IMG_H + (24 + i * 15) * s);
  });

  if (card.author) {
    ctx.font = `700 ${9 * s}px 'Inter', -apple-system, sans-serif`;
    ctx.fillStyle = "#a78bfa";
    ctx.fillText(`— ${card.author.toUpperCase().slice(0, 28)}`, 12 * s, H - 12 * s);
  }
  ctx.restore();

  pathRoundRect(ctx, s, s, W - 2 * s, H - 2 * s, R);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = s;
  ctx.stroke();
}

// Cache texture theo card.id: đổi hành tinh / re-render không vẽ lại,
// ảnh tải xong chỉ vẽ đè lên canvas + needsUpdate, không tạo re-render React.
const cardTextureCache = new Map();

function getCardTexture(card) {
  const cached = cardTextureCache.get(card.id);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_TEX_W * CARD_TEX_SCALE;
  canvas.height = CARD_TEX_H * CARD_TEX_SCALE;
  const ctx = canvas.getContext("2d");
  drawCardCanvas(ctx, card, null);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;

  if (card.imageUrl) {
    requestImageLoad(card.imageUrl, true).then((img) => {
      if (!img) return;
      drawCardCanvas(ctx, card, img);
      texture.needsUpdate = true;
    });
  }

  cardTextureCache.set(card.id, texture);
  return texture;
}

const MOCK_CARDS = [
  { id: "m1", imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80", quote: "Yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.", author: "Antoine de Saint-Exupéry" },
  { id: "m2", imageUrl: "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=400&q=80", quote: "Giữa hàng vạn người, anh chỉ nhìn thấy mình em.", author: "Khuyết danh" },
  { id: "m3", imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&q=80", quote: "Em là bình yên duy nhất giữa thế giới ồn ào này.", author: "Sưu tầm" },
  { id: "m4", imageUrl: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&q=80", quote: "Nếu biết có ngày anh yêu em nhiều như thế, anh sẽ yêu em từ cái nhìn đầu tiên.", author: "Tiêu Nại" },
  { id: "m5", imageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&q=80", quote: "Tình yêu là khi hạnh phúc của người đó quan trọng hơn hạnh phúc của chính bạn.", author: "H. Jackson Brown" },
];

function loadPlanet() {
  try {
    return localStorage.getItem(LS_PLANET_KEY) || "earth";
  } catch {
    return "earth";
  }
}

function savePlanet(p) {
  try {
    localStorage.setItem(LS_PLANET_KEY, p);
  } catch { }
}

// ── Planet definitions ───────────────────────────────────────────────────────

const PLANETS = [
  { key: "earth", label: "Trái Đất", emoji: "🌍", colors: ["#1a6fdb", "#2d8f4e", "#1565c0"], glow: "#4fc3f7", rings: false },
  { key: "mars", label: "Sao Hỏa", emoji: "🔴", colors: ["#c0392b", "#e67e22", "#b71c1c"], glow: "#ff7043", rings: false },
  { key: "jupiter", label: "Sao Mộc", emoji: "🟤", colors: ["#d4a373", "#c0884c", "#8d6e2e"], glow: "#ffb74d", rings: false },
  { key: "neptune", label: "Sao Hải Vương", emoji: "🔵", colors: ["#1565c0", "#0d47a1", "#42a5f5"], glow: "#64b5f6", rings: false },
  { key: "saturn", label: "Sao Thổ", emoji: "🪐", colors: ["#d4a24e", "#c9963a", "#b8860b"], glow: "#ffe082", rings: true },
  { key: "crystal", label: "Tinh Thể", emoji: "💎", colors: ["#9c27b0", "#e040fb", "#7b1fa2"], glow: "#ea80fc", rings: false },
];

// ── Planet vertex/fragment shaders ───────────────────────────────────────────

const planetVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function getPlanetFragShader(colors) {
  return `
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    // simplex noise approximation
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 color1 = vec3(${colors[0]});
      vec3 color2 = vec3(${colors[1]});
      vec3 color3 = vec3(${colors[2]});

      float n = fbm(vUv * 6.0 + uTime * 0.02);
      float n2 = fbm(vUv * 3.0 - uTime * 0.015 + 10.0);
      
      vec3 baseColor = mix(color1, color2, n);
      baseColor = mix(baseColor, color3, n2 * 0.5);

      // lighting
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      float diff = max(dot(vNormal, lightDir), 0.0);
      float ambient = 0.25;
      
      // fresnel for atmosphere edge
      float fresnel = pow(1.0 - max(dot(vNormal, normalize(-vPosition)), 0.0), 2.5);
      
      vec3 finalColor = baseColor * (ambient + diff * 0.75);
      finalColor += fresnel * 0.3;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;
}

function hexToGlsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return `${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}`;
}

// ── 3D Components ────────────────────────────────────────────────────────────

function Planet({ planetKey, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const planet = PLANETS.find((p) => p.key === planetKey) || PLANETS[0];
  const timeRef = useRef(0);

  const shaderMaterial = useMemo(() => {
    const colors = planet.colors.map(hexToGlsl);
    return new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: getPlanetFragShader(colors),
      uniforms: {
        uTime: { value: 0 },
      },
    });
  }, [planetKey]);

  const glowColor = useMemo(() => new THREE.Color(planet.glow), [planetKey]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.08;
      shaderMaterial.uniforms.uTime.value = timeRef.current;
    }
    if (glowRef.current) {
      const scale = 1.15 + Math.sin(timeRef.current * 0.5) * 0.02;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Atmosphere glow */}
      <mesh ref={glowRef} scale={1.15}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>

      {/* Planet body */}
      <mesh ref={meshRef} material={shaderMaterial} onClick={onClick}>
        <sphereGeometry args={[2, 64, 64]} />
      </mesh>

      {/* Saturn rings */}
      {planet.rings && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[2.8, 4.2, 64]} />
          <meshBasicMaterial
            color={planet.glow}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ── Cặp đôi nắm tay trên hành tinh ───────────────────────────────────────────

// Đèn scene ở xa bị suy giảm vật lý gần hết nên material thường sẽ tối;
// cho nhân vật tự phát sáng nhẹ theo màu gốc để luôn tươi sáng.
function ChibiMaterial({ color }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.45}
      roughness={0.6}
    />
  );
}

// Chi (tay/chân): capsule nối 2 điểm bất kỳ
function Limb({ from, to, radius = 0.025, color }) {
  const { pos, quat, len } = useMemo(() => {
    const s = new THREE.Vector3(...from);
    const e = new THREE.Vector3(...to);
    const d = e.clone().sub(s);
    const len = d.length();
    const pos = s.clone().add(e).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.normalize()
    );
    return { pos, quat, len };
  }, [from, to]);
  return (
    <mesh position={pos} quaternion={quat}>
      <capsuleGeometry args={[radius, len, 4, 10]} />
      <ChibiMaterial color={color} />
    </mesh>
  );
}

// Một nhân vật chibi. side = -1: đứng bên trái (tay phải đưa ra nắm),
// side = +1: đứng bên phải. dress = true: bé gái mặc váy, tóc dài.
function Person({ position, side, skin, hairColor, topColor, bottomColor, dress }) {
  return (
    <group position={position}>
      {/* Chân + thân */}
      {dress ? (
        <>
          <Limb from={[-0.04, 0.02, 0]} to={[-0.04, 0.1, 0]} radius={0.028} color={skin} />
          <Limb from={[0.04, 0.02, 0]} to={[0.04, 0.1, 0]} radius={0.028} color={skin} />
          <mesh position={[0, 0.2, 0]}>
            <coneGeometry args={[0.13, 0.26, 20]} />
            <ChibiMaterial color={topColor} />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <capsuleGeometry args={[0.065, 0.07, 4, 12]} />
            <ChibiMaterial color={topColor} />
          </mesh>
        </>
      ) : (
        <>
          <Limb from={[-0.045, 0.02, 0]} to={[-0.045, 0.15, 0]} radius={0.032} color={bottomColor} />
          <Limb from={[0.045, 0.02, 0]} to={[0.045, 0.15, 0]} radius={0.032} color={bottomColor} />
          <mesh position={[0, 0.24, 0]}>
            <capsuleGeometry args={[0.085, 0.12, 4, 12]} />
            <ChibiMaterial color={topColor} />
          </mesh>
        </>
      )}

      {/* Đầu — nghiêng nhẹ về phía người kia */}
      <group position={[0, 0.46, 0]} rotation={[0, 0, side * 0.1]}>
        <mesh>
          <sphereGeometry args={[0.115, 24, 24]} />
          <ChibiMaterial color={skin} />
        </mesh>
        {/* Tóc */}
        <mesh position={[0, 0.035, -0.015]} scale={[1.04, 0.78, 1.04]}>
          <sphereGeometry args={[0.115, 20, 20]} />
          <ChibiMaterial color={hairColor} />
        </mesh>
        {dress && (
          <mesh position={[0, -0.07, -0.09]} scale={[0.75, 1.5, 0.45]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <ChibiMaterial color={hairColor} />
          </mesh>
        )}
        {/* Mắt */}
        <mesh position={[-0.042, 0.01, 0.102]}>
          <sphereGeometry args={[0.013, 8, 8]} />
          <ChibiMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.042, 0.01, 0.102]}>
          <sphereGeometry args={[0.013, 8, 8]} />
          <ChibiMaterial color="#1a1a2e" />
        </mesh>
        {/* Má hồng cho bé gái */}
        {dress && (
          <>
            <mesh position={[-0.07, -0.025, 0.088]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <ChibiMaterial color="#ff9eb5" />
            </mesh>
            <mesh position={[0.07, -0.025, 0.088]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <ChibiMaterial color="#ff9eb5" />
            </mesh>
          </>
        )}
      </group>

      {/* Tay trong — đưa ra giữa nắm tay người kia */}
      <Limb from={[side * -0.08, 0.3, 0]} to={[side * -0.16, 0.185, 0.02]} color={skin} />
      <mesh position={[side * -0.165, 0.18, 0.02]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <ChibiMaterial color={skin} />
      </mesh>

      {/* Tay ngoài — buông xuôi tự nhiên */}
      <Limb from={[side * 0.08, 0.3, 0]} to={[side * 0.135, 0.16, 0.02]} color={skin} />
      <mesh position={[side * 0.14, 0.155, 0.02]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <ChibiMaterial color={skin} />
      </mesh>
    </group>
  );
}

function FloatingHeart() {
  const ref = useRef();
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(2.5, 2.5);
    shape.bezierCurveTo(2.5, 2.5, 2.0, 0, 0, 0);
    shape.bezierCurveTo(-3.0, 0, -3.0, 3.5, -3.0, 3.5);
    shape.bezierCurveTo(-3.0, 5.5, -1.0, 7.7, 2.5, 9.5);
    shape.bezierCurveTo(6.0, 7.7, 8.0, 5.5, 8.0, 3.5);
    shape.bezierCurveTo(8.0, 3.5, 8.0, 0, 5.0, 0);
    shape.bezierCurveTo(3.5, 0, 2.5, 2.5, 2.5, 2.5);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 1.6,
      bevelEnabled: true,
      bevelSize: 0.6,
      bevelThickness: 0.4,
      bevelSegments: 2,
    });
    geo.center();
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    // đập nhẹ như nhịp tim + trôi lên xuống + xoay chầm chậm
    ref.current.scale.setScalar(0.016 * (1 + Math.sin(t * 2.4) * 0.12));
    ref.current.position.y = 0.8 + Math.sin(t * 1.3) * 0.035;
    ref.current.rotation.set(0, t * 0.6, Math.PI);
  });

  return (
    <mesh ref={ref} geometry={geometry} position={[0, 0.8, 0]} rotation={[0, 0, Math.PI]}>
      <meshStandardMaterial color="#ff4d7e" emissive="#ff2e63" emissiveIntensity={0.6} />
    </mesh>
  );
}

function Couple() {
  const ref = useRef();
  // Xoay quanh trục Y cùng tốc độ với hành tinh (0.08 rad/s) như đang đứng trên đó
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });
  return (
    <group ref={ref}>
      <group position={[0, 2, 0]} scale={1.5}>
        {/* Đèn ấm riêng cho cặp đôi (đèn của scene ở quá xa, suy giảm gần hết) */}
        <pointLight position={[0, 1.4, 1.1]} intensity={8} distance={7} decay={2} color="#fff2dd" />
        <Person
          position={[-0.17, 0, 0]}
          side={-1}
          skin="#ffd9b3"
          hairColor="#2f2038"
          topColor="#4a90d9"
          bottomColor="#2c3e50"
        />
        <Person
          position={[0.17, 0, 0]}
          side={1}
          dress
          skin="#ffe0bd"
          hairColor="#4a2c2a"
          topColor="#ff7eb3"
        />
        <FloatingHeart />
      </group>
    </group>
  );
}

function OrbitRing({ radius, tilt = 0, color = "#ffffff" }) {
  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    return pts;
  }, [radius]);

  return (
    <group rotation={[tilt, 0, 0]}>
      <Line
        points={points}
        color={color}
        lineWidth={1.2}
        transparent
        opacity={0.4}
      />
    </group>
  );
}

const SPRITE_W = 1.6;
const SPRITE_H = SPRITE_W * (CARD_TEX_H / CARD_TEX_W);

function OrbitCard({ card, index, total, radius, speed, onSelect }) {
  const meshRef = useRef();
  const hoverRef = useRef(false);
  const scaleRef = useRef(1);
  const yawRef = useRef(0);
  const rollRef = useRef(0);
  const angleOffset = (index / Math.max(total, 1)) * Math.PI * 2;
  const texture = useMemo(() => getCardTexture(card), [card.id]);
  // Mỗi thẻ nghiêng ngẫu nhiên: yaw = xoay quanh trục Y (nghiêng phối cảnh 3D,
  // ±~26°), roll = nghiêng trong mặt phẳng (±~9°), kèm đung đưa nhẹ lệch pha.
  // Hover thì dựng thẳng mặt về camera cho dễ đọc.
  const tilt = useMemo(() => ({
    yaw: (Math.random() - 0.5) * 0.9,
    roll: (Math.random() - 0.5) * 0.3,
    swayAmp: 0.05 + Math.random() * 0.06,
    swaySpeed: 0.4 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
  }), [card.id]);

  useFrame(({ clock, camera }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = clock.getElapsedTime();
    const t = time * speed + angleOffset;
    mesh.position.set(
      Math.cos(t) * radius,
      Math.sin(t * 0.5) * 0.3,
      Math.sin(t) * radius
    );
    const hovered = hoverRef.current;
    const k = Math.min(1, delta * 8);

    const targetScale = hovered ? 1.12 : 1;
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, delta * 12);
    mesh.scale.setScalar(scaleRef.current);

    const sway = Math.sin(time * tilt.swaySpeed + tilt.phase) * tilt.swayAmp;
    yawRef.current += ((hovered ? 0 : tilt.yaw + sway) - yawRef.current) * k;
    rollRef.current += ((hovered ? 0 : tilt.roll) - rollRef.current) * k;

    // Billboard thủ công: hướng mặt về camera rồi cộng thêm góc nghiêng riêng
    mesh.quaternion.copy(camera.quaternion);
    mesh.rotateY(yawRef.current);
    mesh.rotateZ(rollRef.current);
  });

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => { e.stopPropagation(); onSelect(card); }}
      onPointerOver={(e) => {
        e.stopPropagation();
        hoverRef.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hoverRef.current = false;
        document.body.style.cursor = "";
      }}
    >
      <planeGeometry args={[SPRITE_W, SPRITE_H]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function GalaxyParticles() {
  const ref = useRef();
  const count = 3000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 15;
      pos[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 3;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function MilkyWay({ count = 15000 }) {
  const { positions, colors, texture } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Create a sprawling galaxy arm effect
      const radius = 10 + Math.random() * 160;
      const angle = (Math.random() * Math.PI * 2) + (radius * 0.05); // spiral twist
      // vertical spread based on distance from center (thicker in middle)
      const spread = Math.max(0, (120 - radius) * 0.2);
      const y = (Math.random() - 0.5) * spread * 2.5;

      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle) * 0.45; // elliptical

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Interpolate colors between bright cyan, blue and deep purple based on radius
      const mix = Math.random();
      if (mix > 0.6) {
        c.setHSL(0.55 + Math.random() * 0.1, 0.9, 0.5 + Math.random() * 0.4); // Cyan/Blue
      } else {
        c.setHSL(0.75 + Math.random() * 0.1, 0.8, 0.4 + Math.random() * 0.4); // Purplish/Pink
      }
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,0.8)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.2)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);

    return { positions: pos, colors: col, texture: tex };
  }, [count]);

  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y -= 0.00015;
    }
  });

  return (
    <points ref={ref} rotation={[Math.PI / 4, 0, Math.PI / 6]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        sizeAttenuation
        vertexColors
        map={texture}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Scene({ cards, selectedPlanet, onSelectCard, isMobile }) {
  const planet = PLANETS.find((p) => p.key === selectedPlanet) || PLANETS[0];
  const orbitRadii = [6.5, 10.5];

  // Split cards across orbits
  const orbit1Cards = cards.filter((_, i) => i % 2 === 0);
  const orbit2Cards = cards.filter((_, i) => i % 2 !== 0);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color={planet.glow} />

      {/* Starfield — 50k điểm là quá thừa cho nền, giảm mạnh vẫn dày đặc */}
      <Stars
        radius={120}
        depth={60}
        count={isMobile ? 6000 : 20000}
        factor={12}
        saturation={1}
        fade
        speed={1.5}
      />

      {/* Galaxy dust particles */}
      <GalaxyParticles />

      {/* Milky Way glowing band */}
      <MilkyWay count={isMobile ? 7000 : 15000} />

      {/* Planet */}
      <Planet planetKey={selectedPlanet} />

      {/* Cặp đôi nắm tay trên đỉnh hành tinh */}
      <Couple />

      {/* Orbit rings */}
      <OrbitRing radius={orbitRadii[0]} color={planet.glow} />
      <OrbitRing radius={orbitRadii[1]} color={planet.glow} tilt={0.15} />

      {/* Orbit cards - ring 1 */}
      {orbit1Cards.map((card, i) => (
        <OrbitCard
          key={card.id}
          card={card}
          index={i}
          total={orbit1Cards.length}
          radius={orbitRadii[0]}
          speed={0.12}
          onSelect={onSelectCard}
        />
      ))}

      {/* Orbit cards - ring 2 */}
      {orbit2Cards.map((card, i) => (
        <OrbitCard
          key={card.id}
          card={card}
          index={i}
          total={orbit2Cards.length}
          radius={orbitRadii[1]}
          speed={0.08}
          onSelect={onSelectCard}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={0.2}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

// ── 2D UI Components ─────────────────────────────────────────────────────────

function CardDetailModal({ card, onClose, onPrev, onNext, planetGlow, hasPrev, hasNext }) {
  if (!card) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      animation: "galaxyFadeIn 0.3s ease",
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(20px)",
        }}
      />

      {/* Card */}
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 520,
        width: "100%",
        borderRadius: 24,
        overflow: "hidden",
        background: "rgba(15,15,40,0.95)",
        border: `1px solid ${planetGlow}40`,
        boxShadow: `0 0 60px ${planetGlow}20, 0 20px 60px rgba(0,0,0,0.6)`,
        animation: "galaxySlideUp 0.4s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* Close btn */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(0,0,0,0.5)"}
        >
          ✕
        </button>

        {/* Image */}
        {card.imageUrl ? (
          <QueuedImage
            src={card.fullImageUrl || card.imageUrl}
            style={{
              width: "100%",
              height: 320,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: 320,
            background: `linear-gradient(135deg, ${planetGlow}25, rgba(20,20,60,0.9))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
          }}>
            ✨
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "28px 32px 32px" }}>
          <div style={{
            fontSize: 48,
            lineHeight: 1,
            opacity: 0.15,
            fontFamily: "Georgia, serif",
            color: planetGlow,
            marginBottom: -12,
          }}>
            "
          </div>
          <p style={{
            color: "#e8e8f0",
            fontSize: 18,
            lineHeight: 1.8,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            margin: "8px 0 16px",
            whiteSpace: "pre-wrap",
          }}>
            {card.quote}
          </p>
          {card.author && (
            <p style={{
              color: planetGlow,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: 0,
            }}>
              — {card.author}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 24px 20px",
        }}>
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            style={{
              padding: "8px 20px",
              borderRadius: 99,
              border: `1px solid ${hasPrev ? planetGlow + "60" : "rgba(255,255,255,0.1)"}`,
              background: "transparent",
              color: hasPrev ? "#fff" : "rgba(255,255,255,0.2)",
              fontSize: 13,
              fontWeight: 600,
              cursor: hasPrev ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            ← Trước
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            style={{
              padding: "8px 20px",
              borderRadius: 99,
              border: `1px solid ${hasNext ? planetGlow + "60" : "rgba(255,255,255,0.1)"}`,
              background: "transparent",
              color: hasNext ? "#fff" : "rgba(255,255,255,0.2)",
              fontSize: 13,
              fontWeight: 600,
              cursor: hasNext ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCardForm({ onAdd, onClose, planetGlow }) {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh quá lớn! Tối đa 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target.result);
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!quote.trim()) return;
    onAdd({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      quote: quote.trim(),
      author: author.trim(),
      imageUrl,
      createdAt: new Date().toISOString(),
    });
    setQuote("");
    setAuthor("");
    setImageUrl("");
    setPreview("");
    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e8e8f0",
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      animation: "galaxyFadeIn 0.3s ease",
    }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(16px)",
        }}
      />

      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 460,
        width: "100%",
        borderRadius: 24,
        background: "rgba(15,15,40,0.95)",
        border: `1px solid ${planetGlow}30`,
        boxShadow: `0 0 40px ${planetGlow}15, 0 20px 60px rgba(0,0,0,0.5)`,
        padding: 32,
        animation: "galaxySlideUp 0.4s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <h3 style={{
          margin: "0 0 24px",
          color: "#fff",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>🌟</span>
          Thêm thẻ bài mới
        </h3>

        {/* Image upload */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "block",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}>
            Hình ảnh (không bắt buộc)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          {preview ? (
            <div style={{ position: "relative" }}>
              <img
                src={preview}
                alt=""
                style={{
                  width: "100%",
                  height: 160,
                  objectFit: "cover",
                  borderRadius: 12,
                  display: "block",
                }}
              />
              <button
                onClick={() => { setPreview(""); setImageUrl(""); }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%",
                height: 100,
                borderRadius: 12,
                border: "2px dashed rgba(255,255,255,0.15)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                transition: "border-color 0.2s, color 0.2s",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = planetGlow;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              }}
            >
              <span style={{ fontSize: 24 }}>📷</span>
              Nhấn để chọn ảnh
            </div>
          )}
        </div>

        {/* Quote */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "block",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}>
            Câu nói hay <span style={{ color: planetGlow }}>*</span>
          </label>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Nhập câu nói hay, trích dẫn yêu thích..."
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 80,
            }}
            onFocus={(e) => e.target.style.borderColor = planetGlow}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
          />
        </div>

        {/* Author */}
        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: "block",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}>
            Tác giả (không bắt buộc)
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="VD: Albert Einstein"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = planetGlow}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#aaa",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!quote.trim()}
            style={{
              flex: 2,
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              background: quote.trim()
                ? `linear-gradient(135deg, ${planetGlow}, ${planetGlow}cc)`
                : "rgba(255,255,255,0.08)",
              color: quote.trim() ? "#000" : "rgba(255,255,255,0.3)",
              fontSize: 14,
              fontWeight: 700,
              cursor: quote.trim() ? "pointer" : "default",
              transition: "all 0.2s",
              boxShadow: quote.trim() ? `0 4px 20px ${planetGlow}40` : "none",
            }}
          >
            ✨ Thêm thẻ bài
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanetSelector({ selected, onChange, autoSwitch, onToggleAutoSwitch }) {
  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      display: "flex",
      gap: 8,
      padding: "10px 20px",
      borderRadius: 99,
      background: "rgba(10,10,30,0.8)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "galaxySlideUp 0.5s cubic-bezier(0.22,1,0.36,1)",
      alignItems: "center",
    }}>
      <button
        onClick={onToggleAutoSwitch}
        title={autoSwitch ? "Tắt tự động chuyển" : "Bật tự động chuyển"}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: autoSwitch ? "rgba(255,255,255,0.2)" : "transparent",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          marginRight: 8,
          transition: "background 0.2s"
        }}
      >
        {autoSwitch ? "⏸️" : "▶️"}
      </button>
      <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)", marginRight: 8 }} />

      {PLANETS.map((p) => {
        const isActive = selected === p.key;
        return (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            title={p.label}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: isActive ? `2px solid ${p.glow}` : "2px solid transparent",
              background: isActive
                ? `radial-gradient(circle, ${p.glow}40, transparent)`
                : "rgba(255,255,255,0.05)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              transition: "all 0.3s ease",
              transform: isActive ? "scale(1.15)" : "scale(1)",
              boxShadow: isActive ? `0 0 16px ${p.glow}50` : "none",
              position: "relative",
            }}
          >
            {p.emoji}
            {isActive && (
              <span style={{
                position: "absolute",
                bottom: -18,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 9,
                color: p.glow,
                fontWeight: 700,
                whiteSpace: "nowrap",
                letterSpacing: "0.05em",
              }}>
                {p.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TopBar({ cardCount, onAddCard, onDeleteAll, isPlaying, onToggleMusic, isAdmin, onBack, showTimeline, onToggleTimeline, hasTimeline }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "linear-gradient(180deg, rgba(0,0,8,0.9) 0%, transparent 100%)",
      pointerEvents: "none",
    }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          padding: "10px 18px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.05)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          pointerEvents: "auto",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          e.currentTarget.style.transform = "translateX(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <span>⬅️</span> Quay về Trang chủ
      </button>

      <div style={{ display: "flex", gap: 10, pointerEvents: "auto", alignItems: "center" }}>
        <button
          onClick={onToggleMusic}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: isPlaying ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: !isPlaying ? "musicPulse 2s infinite" : "none",
          }}
          title={isPlaying ? "Tắt nhạc" : "Bật nhạc"}
        >
          {isPlaying ? "🔊" : "🔇"}
        </button>

        {isAdmin && cardCount > 0 && (
          <button
            onClick={onDeleteAll}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,80,80,0.3)",
              background: "rgba(255,50,50,0.15)",
              color: "#ff6b6b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255,50,50,0.3)";
              e.target.style.borderColor = "rgba(255,80,80,0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255,50,50,0.15)";
              e.target.style.borderColor = "rgba(255,80,80,0.3)";
            }}
          >
            🗑️ Xoá tất cả
          </button>
        )}
        {isAdmin && (
          <button
            onClick={onAddCard}
            style={{
              padding: "10px 22px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #7c4dff, #536dfe)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(124,77,255,0.4)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 28px rgba(124,77,255,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,77,255,0.4)";
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> Thêm thẻ bài
          </button>
        )}
        {hasTimeline && (
          <button
            onClick={onToggleTimeline}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: showTimeline ? "rgba(124,77,255,0.25)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
            title={showTimeline ? "Ẩn cột mốc" : "Xem cột mốc"}
          >
            {showTimeline ? "⏳" : "📅"}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAddCard, planetGlow, isAdmin }) {
  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 50,
      textAlign: "center",
      pointerEvents: "none",
      animation: "galaxyFadeIn 1s ease 0.5s both",
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${planetGlow}30, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 36,
        margin: "0 auto 20px",
        border: `1px solid ${planetGlow}20`,
      }}>
        🌟
      </div>
      <h2 style={{
        color: "#fff",
        fontSize: 24,
        fontWeight: 700,
        margin: "0 0 8px",
        fontFamily: "'Inter', sans-serif",
        textShadow: "0 2px 16px rgba(0,0,0,0.5)",
      }}>
        Chưa có thẻ bài nào
      </h2>
      <p style={{
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
        margin: "0 0 24px",
        lineHeight: 1.6,
      }}>
        Thêm ảnh và câu nói hay để tạo<br />
        thẻ bài xoay quanh hành tinh
      </p>
      {isAdmin && (
        <button
          onClick={onAddCard}
          style={{
            padding: "14px 32px",
            borderRadius: 16,
            border: "none",
            background: `linear-gradient(135deg, ${planetGlow}, ${planetGlow}cc)`,
            color: "#000",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 6px 24px ${planetGlow}40`,
            pointerEvents: "auto",
            transition: "all 0.2s",
          }}
        >
          ✨ Thêm thẻ bài đầu tiên
        </button>
      )}
    </div>
  );
}



// ── Main Page Component ──────────────────────────────────────────────────────

export default function GalaxyCards() {
  const { isLoggedIn: isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  // ── Passcode gate ─────────────────────────────────────────────────────────
  const [isUnlocked, setIsUnlocked] = useState(
    () => isAdmin || sessionStorage.getItem("galaxy_unlocked") === "true"
  );
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  const handlePasscodeSubmit = useCallback((e) => {
    e.preventDefault();
    if (passcode === "quocs2tram") {
      sessionStorage.setItem("galaxy_unlocked", "true");
      setIsUnlocked(true);
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 1200);
    }
  }, [passcode]);

  // ── Galaxy state ──────────────────────────────────────────────────────────
  const [cards, setCards] = useState(MOCK_CARDS);
  const [selectedPlanet, setSelectedPlanet] = useState(loadPlanet);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [bgmList, setBgmList] = useState([]);
  const [bgmIndex, setBgmIndex] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const isMobile = useIsMobile();
  // Trên mobile mặc định ẩn timeline để không che hành tinh
  const [showTimeline, setShowTimeline] = useState(
    () => !(typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches)
  );
  const audioRef = useRef(null);

  const planet = PLANETS.find((p) => p.key === selectedPlanet) || PLANETS[0];

  // Fetch Galaxy settings from Supabase
  useEffect(() => {
    getSiteSetting("galaxy").then((value) => {
      if (!value || typeof value !== "object") return;

      // Memories → cards
      const memories = Array.isArray(value.memories) ? value.memories : [];
      if (memories.length > 0) {
        setCards(
          memories.map((m, i) => ({
            id: `sb_${i}`,
            imageUrl: processDriveUrl(m.img || "", 400),
            fullImageUrl: processDriveUrl(m.img || "", 1200),
            quote: m.quote || "",
            author: m.author || "",
          }))
        );
      }

      // BGM playlist
      const bgm = Array.isArray(value.bgm) ? value.bgm.filter(Boolean).map(processDriveUrl) : [];
      setBgmList(bgm);

      // Auto switch planet
      if (typeof value.auto_switch_planet === "boolean") {
        setAutoSwitch(value.auto_switch_planet);
      }

      // Timeline milestones
      if (Array.isArray(value.timeline)) {
        setTimeline(value.timeline);
      }
    });
  }, []);

  // Persist planet selection locally
  useEffect(() => { savePlanet(selectedPlanet); }, [selectedPlanet]);

  // Audio control (supports bgm playlist or single track)
  const currentBgmUrl = bgmList.length > 0 ? bgmList[bgmIndex] : null;

  useEffect(() => {
    if (!audioRef.current || !currentBgmUrl) return;
    audioRef.current.src = currentBgmUrl;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentBgmUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && currentBgmUrl) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleMusicEnded = useCallback(() => {
    if (bgmList.length > 1) {
      setBgmIndex((i) => (i + 1) % bgmList.length);
    }
  }, [bgmList.length]);

  const handleToggleMusic = useCallback(() => {
    setIsPlaying(p => !p);
  }, []);

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Auto-switch planets
  useEffect(() => {
    if (!autoSwitch) return;
    const interval = setInterval(() => {
      setSelectedPlanet((prev) => {
        const idx = PLANETS.findIndex((p) => p.key === prev);
        const nextIdx = (idx + 1) % PLANETS.length;
        return PLANETS[nextIdx].key;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [autoSwitch]);

  const handleAddCard = useCallback((card) => {
    setCards((prev) => {
      if (prev.length >= 24) {
        alert("Tối đa 24 thẻ bài!");
        return prev;
      }
      return [...prev, card];
    });
  }, []);

  const handleDeleteAll = useCallback(() => {
    if (window.confirm("Xoá tất cả thẻ bài?")) {
      setCards([]);
    }
  }, []);

  const handleSelectCard = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  const handlePrevCard = useCallback(() => {
    setSelectedCard((cur) => {
      if (!cur) return null;
      const idx = cards.findIndex((c) => c.id === cur.id);
      return idx > 0 ? cards[idx - 1] : cur;
    });
  }, [cards]);

  const handleNextCard = useCallback(() => {
    setSelectedCard((cur) => {
      if (!cur) return null;
      const idx = cards.findIndex((c) => c.id === cur.id);
      return idx < cards.length - 1 ? cards[idx + 1] : cur;
    });
  }, [cards]);

  const selectedIdx = selectedCard ? cards.findIndex((c) => c.id === selectedCard.id) : -1;

  // ── Passcode lock screen ─────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "radial-gradient(ellipse at 50% 60%, #0d0025 0%, #000005 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        zIndex: 9999,
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          @keyframes lockGlow { 0%,100%{box-shadow:0 0 24px #7c4dff40;} 50%{box-shadow:0 0 48px #7c4dff90;} }
          @keyframes lockShake { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-8px);} 40%,80%{transform:translateX(8px);} }
        `}</style>

        {/* Stars bg */}
        <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none" }}>
          {Array.from({length:80}).map((_,i)=>(
            <div key={i} style={{
              position:"absolute",
              width: Math.random()*2+1+"px",
              height: Math.random()*2+1+"px",
              borderRadius:"50%",
              background:"#fff",
              opacity: Math.random()*0.7+0.1,
              left: Math.random()*100+"%",
              top: Math.random()*100+"%",
            }}/>
          ))}
        </div>

        <div style={{ fontSize: 64, marginBottom: 8 }}>🌌</div>
        <h1 style={{ color:"#fff", fontSize: 26, fontWeight:800, margin:"0 0 6px", letterSpacing:"-0.5px" }}>
          Vũ Trụ Ký Ức
        </h1>
        <p style={{ color:"rgba(255,255,255,0.45)", fontSize:13, margin:"0 0 36px" }}>
          Chỉ dành cho người được chọn ✨
        </p>

        <form onSubmit={handlePasscodeSubmit} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, width:280 }}>
          <input
            type="password"
            placeholder="Nhập mã vũ trụ..."
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
            style={{
              width:"100%", padding:"14px 20px",
              borderRadius:14,
              border: passcodeError ? "1.5px solid #ff5252" : "1.5px solid rgba(255,255,255,0.15)",
              background:"rgba(255,255,255,0.06)",
              backdropFilter:"blur(12px)",
              color:"#fff", fontSize:16, outline:"none",
              textAlign:"center", letterSpacing:4,
              transition:"border 0.2s",
              animation: passcodeError ? "lockShake 0.4s ease" : "none",
              boxSizing:"border-box",
            }}
          />
          {passcodeError && (
            <p style={{ color:"#ff5252", fontSize:12, margin:"-6px 0 0", fontWeight:500 }}>
              ❌ Mã không đúng. Thử lại nhé!
            </p>
          )}
          <button type="submit" style={{
            width:"100%", padding:"14px",
            borderRadius:14, border:"none",
            background:"linear-gradient(135deg, #7c4dff, #536dfe)",
            color:"#fff", fontSize:15, fontWeight:700,
            cursor:"pointer", letterSpacing:0.5,
            animation:"lockGlow 2.5s infinite",
            transition:"transform 0.15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >
            🚀 Mở cửa vũ trụ
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          style={{
            marginTop:32, background:"none", border:"none",
            color:"rgba(255,255,255,0.4)", fontSize:13,
            cursor:"pointer", textDecoration:"underline",
          }}
        >
          ← Quay về Trang chủ
        </button>
      </div>
    );
  }

  return (
    <>

      {/* Global animations */}
      <style>{`
        @keyframes galaxyFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes galaxySlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes musicPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); transform: scale(1.1); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); transform: scale(1); }
        }
        @keyframes timelineFadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes timelineSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes imgShimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
        .galaxy-timeline::-webkit-scrollbar { width: 3px; }
        .galaxy-timeline::-webkit-scrollbar-track { background: transparent; }
        .galaxy-timeline::-webkit-scrollbar-thumb { background: rgba(124,77,255,0.4); border-radius: 3px; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

      `}</style>

      {/* Full-screen 3D Canvas */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#000011",
        zIndex: 0,
      }}>
        <Canvas
          camera={{
            position: [8.2, 21.65, 9.43],
            fov: 50,
            near: 0.1,
            far: 200,
          }}
          gl={{ antialias: !isMobile, alpha: false, powerPreference: "high-performance" }}
          dpr={isMobile ? [1, 1.25] : [1, 1.5]}
        >
          <Suspense fallback={null}>
            <Scene
              cards={cards}
              selectedPlanet={selectedPlanet}
              onSelectCard={handleSelectCard}
              isMobile={isMobile}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlays */}
      <TopBar
        cardCount={cards.length}
        onAddCard={() => setShowAddForm(true)}
        onDeleteAll={handleDeleteAll}
        isPlaying={isPlaying}
        onToggleMusic={handleToggleMusic}
        isAdmin={isAdmin}
        onBack={handleBack}
        showTimeline={showTimeline}
        onToggleTimeline={() => setShowTimeline(p => !p)}
        hasTimeline={timeline.length > 0}
      />

      {currentBgmUrl && (
        <audio ref={audioRef} src={currentBgmUrl} loop={bgmList.length === 1} onEnded={handleMusicEnded} />
      )}

      {/* Timeline Sidebar */}
      {timeline.length > 0 && showTimeline && (
        <div
          className="galaxy-timeline"
          style={{
            position: "fixed",
            zIndex: 90,
            overflowY: "auto",
            overflowX: "hidden",
            // Không dùng backdrop-filter: blur trên canvas WebGL động
            // bắt trình duyệt re-blur cả vùng lớn mỗi frame → rất tốn.
            background: isMobile ? "rgba(3,3,18,0.92)" : "rgba(3,3,18,0.82)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            ...(isMobile
              ? {
                  // Bottom-sheet: chừa chỗ phía trên cho hành tinh
                  left: 12,
                  right: 12,
                  bottom: 96,
                  maxHeight: "42vh",
                  borderRadius: 16,
                  padding: "14px 14px 18px",
                  animation: "timelineSlideUp 0.35s ease",
                }
              : {
                  top: 70,
                  right: 16,
                  bottom: 90,
                  width: 260,
                  borderRadius: 20,
                  padding: "20px 16px 24px",
                  animation: "timelineFadeIn 0.4s ease",
                }),
          }}
        >
          {isMobile && (
            <button
              onClick={() => setShowTimeline(false)}
              style={{
                position: "sticky",
                top: 0,
                float: "right",
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
              title="Ẩn cột mốc"
            >
              ✕
            </button>
          )}
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:600, letterSpacing:3, textTransform:"uppercase", margin:"0 0 20px", textAlign:"center" }}>
            ⏳ Hành trình ký ức
          </p>
          <div style={{ position:"relative" }}>
            {/* Vertical neon line */}
            <div style={{
              position:"absolute", left:13, top:8, bottom:8,
              width:2,
              background:"linear-gradient(to bottom, transparent, #7c4dff80, #7c4dff, #7c4dff80, transparent)",
              borderRadius:2,
            }} />

            {timeline.map((m, i) => (
              <div key={i} style={{
                display:"flex", gap:12, marginBottom:24, position:"relative",
                // Mốc nằm ngoài viewport không bị layout/paint/decode ảnh
                contentVisibility: "auto",
                containIntrinsicSize: "auto 175px",
              }}>
                {/* Dot */}
                <div style={{
                  width:14, height:14, borderRadius:"50%", flexShrink:0, marginTop:4,
                  background:"linear-gradient(135deg, #7c4dff, #536dfe)",
                  boxShadow:"0 0 8px #7c4dff80",
                  border:"2px solid rgba(255,255,255,0.2)",
                  zIndex:1,
                }} />
                {/* Content */}
                <div style={{ flex:1 }}>
                  {m.year && (
                    <span style={{
                      display:"inline-block", fontSize:9, fontWeight:700,
                      color:"#a78bfa", letterSpacing:1.5, textTransform:"uppercase",
                      marginBottom:3,
                    }}>{m.year}</span>
                  )}
                  {m.title && (
                    <p style={{ color:"#fff", fontSize:12, fontWeight:700, margin:"0 0 4px", lineHeight:1.4 }}>
                      {m.title}
                    </p>
                  )}
                  {m.img && (
                    <img
                      src={processDriveUrl(m.img, 480)}
                      alt={m.title || ""}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width:"100%", aspectRatio:"16/9", objectFit:"cover",
                        borderRadius:8, marginBottom:6,
                        border:"1px solid rgba(255,255,255,0.07)",
                      }}
                    />
                  )}
                  {m.quote && (
                    <p style={{
                      color:"rgba(255,255,255,0.55)", fontSize:11,
                      fontStyle:"italic", lineHeight:1.5, margin:0,
                    }}>
                      “{m.quote}”
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <EmptyState
          onAddCard={() => setShowAddForm(true)}
          planetGlow={planet.glow}
          isAdmin={isAdmin}
        />
      )}

      <PlanetSelector
        selected={selectedPlanet}
        onChange={setSelectedPlanet}
        autoSwitch={autoSwitch}
        onToggleAutoSwitch={() => setAutoSwitch((p) => !p)}
      />

      {/* Modals */}
      {showAddForm && (
        <AddCardForm
          onAdd={handleAddCard}
          onClose={() => setShowAddForm(false)}
          planetGlow={planet.glow}
        />
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onPrev={handlePrevCard}
          onNext={handleNextCard}
          planetGlow={planet.glow}
          hasPrev={selectedIdx > 0}
          hasNext={selectedIdx < cards.length - 1}
        />
      )}
    </>
  );
}
