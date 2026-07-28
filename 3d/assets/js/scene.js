// IZI 3D-вариант - кинематографичная сцена из v2, перекрашенная в фирстиль клиента:
// 3D-логотип IZI (fresnel-шейдер) → неоновый тоннель → плазменное ядро.
// Камера летит по сценарию по мере скролла. Всё в bloom-постобработке.
// Ключи палитры исторические (lime/violet/cyan) - значения уже клиентские.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// Токены палитры — синхронизированы с :root в style.css
const PALETTE = {
  bg: '#050507',
  lime: '#ffe600',   // жёлтый акцент фирстиля
  violet: '#2b59ff', // синий фирстиля
  cyan: '#8fb0ff',   // светло-синий (вместо циана)
};
const C = {
  bg: new THREE.Color(PALETTE.bg),
  lime: new THREE.Color(PALETTE.lime),
  violet: new THREE.Color(PALETTE.violet),
  cyan: new THREE.Color(PALETTE.cyan),
};

const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = C.bg;
scene.fog = new THREE.FogExp2(C.bg, 0.014);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 260);
camera.position.set(0, 0.5, 8.5);

// ---------- Постобработка: bloom ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.85,  // strength
  0.55,  // radius
  0.22   // threshold
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- GLSL: симплекс-шум (Ashima) ----------
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 Cc=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,Cc.yyy));
  vec3 x0=v-i+dot(i,Cc.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+Cc.xxx;
  vec3 x2=x0-i2+Cc.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

// ---------- 3D-логотип IZI ----------
const logoGroup = new THREE.Group();
scene.add(logoGroup);

const logoMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: C.lime },
    uColorB: { value: C.cyan },
    uColorC: { value: C.violet },
  },
  vertexShader: /* glsl */`
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec3 vPos;
    void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(mat3(modelMatrix) * normal);
      vView = normalize(cameraPosition - wp.xyz);
      vPos = position;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec3 vPos;
    void main(){
      float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.0);
      // вертикальный градиент лайм→циан по букве
      float g = smoothstep(-1.0, 1.4, vPos.y + sin(vPos.x * 0.8 + uTime * 0.6) * 0.2);
      vec3 base = mix(uColorA, uColorB, g) * 0.22;
      vec3 rim = mix(uColorC, uColorB, g);
      float pulse = 0.9 + 0.1 * sin(uTime * 1.6);
      vec3 color = base + rim * fres * 1.7 * pulse;
      // грани чуть светятся сами
      color += uColorA * 0.06;
      gl_FragColor = vec4(color, 1.0);
    }`,
});

let logoMesh = null;
fetch('assets/vendor/fonts/helvetiker_bold.typeface.json')
  .then((r) => r.json())
  .then((json) => {
    const font = new FontLoader().parse(json);
    const geo = new TextGeometry('IZI', {
      font,
      size: 2.1,
      height: 0.62,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.045,
      bevelSegments: 4,
    });
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -(bb.max.z + bb.min.z) / 2);
    logoMesh = new THREE.Mesh(geo, logoMaterial);
    logoGroup.add(logoMesh);

    // каркасный «призрак» чуть больше — глубина силуэта
    const ghost = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: C.violet, wireframe: true, transparent: true, opacity: 0.07,
    }));
    ghost.scale.setScalar(1.03);
    logoGroup.add(ghost);

    window.dispatchEvent(new CustomEvent('izi:ready'));
  })
  .catch(() => window.dispatchEvent(new CustomEvent('izi:ready')));

logoGroup.position.set(0, 0.75, 0);

// ---------- Пол: шейдерная неоновая сетка с пульсом ----------
const gridMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: C.violet },
    uColorB: { value: C.cyan },
  },
  vertexShader: /* glsl */`
    varying vec2 vXZ;
    void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vXZ = wp.xz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec2 vXZ;
    void main(){
      vec2 g = abs(fract(vXZ * 0.45) - 0.5);
      float line = 1.0 - smoothstep(0.0, 0.06, min(g.x, g.y));
      float dist = length(vXZ);
      // энергетические кольца, расходящиеся из центра
      float ring = 1.0 - smoothstep(0.0, 0.35, abs(fract(dist * 0.045 - uTime * 0.11) - 0.5));
      ring = pow(ring, 6.0);
      float fade = exp(-dist * 0.028);
      vec3 color = uColorA * line * 0.55 + uColorB * ring * 0.6;
      float alpha = (line * 0.45 + ring * 0.55) * fade;
      if (alpha < 0.003) discard;
      gl_FragColor = vec4(color, alpha);
    }`,
});
const grid = new THREE.Mesh(new THREE.PlaneGeometry(260, 260, 1, 1), gridMaterial);
grid.rotation.x = -Math.PI / 2;
grid.position.y = -2.7;
scene.add(grid);

// ---------- Частицы: шейдерные, с мерцанием ----------
const P_COUNT = 2600;
const pPos = new Float32Array(P_COUNT * 3);
const pColor = new Float32Array(P_COUNT * 3);
const pScale = new Float32Array(P_COUNT);
const pPhase = new Float32Array(P_COUNT);
const palette = [C.lime, C.violet, C.cyan, C.cyan];
for (let i = 0; i < P_COUNT; i++) {
  // 55% — вдоль всего пути камеры, 45% — вокруг логотипа
  // (чередуем, чтобы drawRange-срез на слабых машинах сохранял пропорцию)
  if (i % 20 < 11) {
    pPos[i * 3] = (Math.random() - 0.5) * 60;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 34;
    pPos[i * 3 + 2] = 15 - Math.random() * 115;
  } else {
    const r = 5 + Math.random() * 22;
    const a = Math.random() * Math.PI * 2;
    pPos[i * 3] = Math.cos(a) * r;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    pPos[i * 3 + 2] = Math.sin(a) * r * 0.7;
  }
  const c = palette[Math.floor(Math.random() * palette.length)];
  pColor[i * 3] = c.r; pColor[i * 3 + 1] = c.g; pColor[i * 3 + 2] = c.b;
  pScale[i] = 0.4 + Math.random() * 1.4;
  pPhase[i] = Math.random() * Math.PI * 2;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('aColor', new THREE.BufferAttribute(pColor, 3));
pGeo.setAttribute('aScale', new THREE.BufferAttribute(pScale, 1));
pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
const particlesMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  },
  vertexShader: /* glsl */`
    attribute vec3 aColor;
    attribute float aScale;
    attribute float aPhase;
    uniform float uTime;
    uniform float uPixelRatio;
    varying vec3 vColor;
    varying float vTwinkle;
    void main(){
      vec3 p = position;
      p.y += sin(uTime * 0.35 + aPhase) * 0.6;
      p.x += cos(uTime * 0.22 + aPhase * 1.7) * 0.4;
      vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
      gl_PointSize = 42.0 * aScale * uPixelRatio / max(-mv.z, 0.1);
      vColor = aColor;
      vTwinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aScale) + aPhase * 3.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    varying vec3 vColor;
    varying float vTwinkle;
    void main(){
      float d = distance(gl_PointCoord, vec2(0.5));
      float alpha = pow(max(1.0 - d * 2.0, 0.0), 3.0);
      gl_FragColor = vec4(vColor * vTwinkle, alpha * 0.9);
    }`,
});
scene.add(new THREE.Points(pGeo, particlesMaterial));

// ---------- Адаптивное качество ----------
// Bloom — это ~12 полноэкранных проходов на кадр. На машинах без GPU
// (WebGL через SwiftShader/WARP, напр. RDP на Windows Server) это единицы fps.
// Рецепт: рендерим кадр в пониженном разрешении (bloom всё равно размывает),
// а если FPS всё ещё низкий — понижаем ступень дальше. Ступень только падает,
// чтобы картинка не «дышала» разрешением туда-сюда.
const BASE_PR = Math.min(window.devicePixelRatio, 1.5);
const TIERS = [
  { scale: 1.0,  particles: P_COUNT },
  { scale: 0.8,  particles: P_COUNT },
  { scale: 0.65, particles: 1800 },
  { scale: 0.5,  particles: 1200 },
  { scale: 0.4,  particles: 900 },
];
let glName = '';
try {
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  glName = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
} catch (e) { /* контекст мог не подняться — остаёмся на дефолте */ }
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(glName);
// ?q=N в URL — зафиксировать ступень (для скриншотов приёмки: ?q=0 = полное качество)
const qMatch = location.search.match(/[?&]q=(\d)/);
const FORCED_TIER = qMatch ? Math.min(+qMatch[1], TIERS.length - 1) : null;
let tier = FORCED_TIER !== null ? FORCED_TIER : (SOFTWARE_GL ? 3 : 0);

function applyTier() {
  const q = TIERS[tier];
  const pr = BASE_PR * q.scale;
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(pr);
  composer.setSize(window.innerWidth, window.innerHeight);
  particlesMaterial.uniforms.uPixelRatio.value = pr;
  pGeo.setDrawRange(0, q.particles);
  window.__IZI_QUALITY = { tier, scale: q.scale, particles: q.particles, softwareGL: SOFTWARE_GL, gl: glName };
}
applyTier();

// ---------- Неоновый тоннель ----------
const tunnel = new THREE.Group();
scene.add(tunnel);
const ringColors = [C.violet, C.cyan, C.lime];
const rings = [];
for (let i = 0; i < 22; i++) {
  const color = ringColors[i % 3];
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.4 + Math.sin(i * 0.7) * 0.5, 0.018, 8, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending })
  );
  ring.position.z = -14 - i * 1.85;
  ring.position.x = Math.sin(i * 0.5) * 0.4;
  ring.position.y = Math.cos(i * 0.4) * 0.3;
  ring.rotation.x = (Math.random() - 0.5) * 0.18;
  ring.rotation.y = (Math.random() - 0.5) * 0.18;
  ring.userData.spin = (Math.random() - 0.5) * 0.5;
  rings.push(ring);
  tunnel.add(ring);
}

// ---------- Плазменное ядро ----------
const CORE_Z = -80;
const coreMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: C.violet },
    uColorB: { value: C.cyan }, // сине-ледяное ядро: жёлтый с синим давал болотный микс
    uColorC: { value: C.cyan },
  },
  vertexShader: SNOISE + /* glsl */`
    varying vec3 vNormal;
    varying vec3 vView;
    varying float vNoise;
    uniform float uTime;
    void main(){
      float n = snoise(position * 0.55 + vec3(0.0, 0.0, uTime * 0.25));
      vNoise = n;
      vec3 displaced = position + normal * n * 0.32;
      vec4 wp = modelMatrix * vec4(displaced, 1.0);
      vNormal = normalize(mat3(modelMatrix) * normal);
      vView = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying vec3 vNormal;
    varying vec3 vView;
    varying float vNoise;
    void main(){
      float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 1.6);
      vec3 base = mix(uColorA * 0.3, uColorB * 0.65, smoothstep(0.15, 0.85, vNoise));
      vec3 color = base + mix(uColorA, uColorC, 0.4) * fres * 1.5;
      gl_FragColor = vec4(color, 1.0);
    }`,
});
const core = new THREE.Mesh(new THREE.SphereGeometry(2.3, 64, 64), coreMaterial);
core.position.set(0, 0, CORE_Z);
scene.add(core);

// кольцо-орбита частиц вокруг ядра
const ORBIT_COUNT = 500;
const oPos = new Float32Array(ORBIT_COUNT * 3);
for (let i = 0; i < ORBIT_COUNT; i++) {
  const a = Math.random() * Math.PI * 2;
  const r = 3.4 + Math.random() * 1.6;
  oPos[i * 3] = Math.cos(a) * r;
  oPos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
  oPos[i * 3 + 2] = Math.sin(a) * r;
}
const orbitGeo = new THREE.BufferGeometry();
orbitGeo.setAttribute('position', new THREE.BufferAttribute(oPos, 3));
const orbit = new THREE.Points(orbitGeo, new THREE.PointsMaterial({
  color: C.cyan, size: 0.05, transparent: true, opacity: 0.85,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
orbit.position.copy(core.position);
orbit.rotation.x = 0.5;
scene.add(orbit);

// гало за ядром и логотипом
function makeGlow(rgba, size) {
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = 256;
  const ctx = cnv.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, rgba);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(cnv), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sprite.scale.setScalar(size);
  return sprite;
}
const logoHalo = makeGlow('rgba(43,89,255,0.28)', 16);
logoHalo.position.set(0, 0.5, -3);
scene.add(logoHalo);
const coreHalo = makeGlow('rgba(43,89,255,0.18)', 13);
coreHalo.position.set(0, 0, CORE_Z - 2);
scene.add(coreHalo);

// ---------- Сценарий камеры ----------
// t — доля прокрутки страницы 0..1
const KEYFRAMES = [
  { t: 0.00, pos: [0, 0.5, 8.5],   look: [0, 0.4, 0],    fov: 55 }, // hero: логотип фронтально
  { t: 0.08, pos: [2.8, 1.3, 7.2], look: [0, 0.4, 0],    fov: 55 }, // лёгкая орбита
  { t: 0.16, pos: [-3.4, 1.7, 6.2],look: [0, 0.3, 0],    fov: 55 }, // о нас: с другого борта
  { t: 0.24, pos: [0, 0.4, 3.6],   look: [0, 0.2, -30],  fov: 62 }, // разворот в тоннель
  { t: 0.46, pos: [0, 0, -48],     look: [0, 0, -82],    fov: 72 }, // пролёт тоннеля (зоны)
  { t: 0.58, pos: [3.6, 0.7, -71], look: [0, 0, -80],    fov: 58 }, // ядро: орбита справа (железо)
  { t: 0.68, pos: [-3.6, 1.5, -73],look: [0, 0, -80],    fov: 58 }, // ядро: орбита слева (цены)
  { t: 0.78, pos: [0, 5.5, -64],   look: [0, -0.5, -80], fov: 64 }, // над ядром (клубы)
  { t: 0.88, pos: [0, 1.3, -26],   look: [0, 0.4, 0],    fov: 74 }, // гиперпрыжок назад (бронь)
  { t: 1.00, pos: [0, 0.45, 4.8],  look: [0, 0.4, 0],    fov: 55 }, // финал: логотип крупно
];

function smoothstep(x) { return x * x * (3 - 2 * x); }
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const lookCurrent = new THREE.Vector3(0, 0.4, 0);
let fovTarget = 55;

function sampleCamera(t) {
  let a = KEYFRAMES[0], b = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (t >= KEYFRAMES[i].t && t <= KEYFRAMES[i + 1].t) {
      a = KEYFRAMES[i]; b = KEYFRAMES[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const k = smoothstep(Math.min(Math.max((t - a.t) / span, 0), 1));
  camPos.set(
    a.pos[0] + (b.pos[0] - a.pos[0]) * k,
    a.pos[1] + (b.pos[1] - a.pos[1]) * k,
    a.pos[2] + (b.pos[2] - a.pos[2]) * k
  );
  camLook.set(
    a.look[0] + (b.look[0] - a.look[0]) * k,
    a.look[1] + (b.look[1] - a.look[1]) * k,
    a.look[2] + (b.look[2] - a.look[2]) * k
  );
  fovTarget = a.fov + (b.fov - a.fov) * k;
}

// ---------- Мышь ----------
const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

// ---------- Цикл ----------
// Все сглаживания нормированы на dt: на 30 fps и на 144 Гц сцена движется
// с одинаковой скоростью (раньше коэффициенты были «на кадр» и зависели от FPS).
const clock = new THREE.Clock();
let t = 0;
let scrollT = 0;
let prevScrollT = 0;
let running = true;
let qTime = -2; // первые ~2с не меряем: компиляция шейдеров даёт ложную просадку
let qFrames = 0;
// крайняя мера после всех TIERS: 3D через кадр — рендер перестаёт душить
// главный поток, DOM-анимации и скролл становятся вдвое отзывчивее
let frameSkip = false;
let skipPhase = false;

function getScrollT() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

// эквивалент лерпа «k за кадр при 60 fps», независимый от частоты кадров
function damp(k, dt) { return 1 - Math.exp(-k * 60 * dt); }

function render() {
  if (frameSkip) {
    skipPhase = !skipPhase;
    if (skipPhase) {
      if (running) requestAnimationFrame(render);
      return; // dt пропущенного кадра доберётся из clock.getDelta() на следующем
    }
  }
  const dt = Math.min(clock.getDelta(), 0.1);
  t += dt;

  scrollT += (getScrollT() - scrollT) * damp(0.07, dt);
  const velocity = Math.abs(scrollT - prevScrollT) / Math.max(dt, 1e-3); // долей страницы в секунду
  prevScrollT = scrollT;

  // логотип: дыхание + отклик на мышь
  logoGroup.position.y = 0.75 + Math.sin(t * 0.8) * 0.07;
  logoGroup.rotation.y += ((mouse.x * 0.3) - logoGroup.rotation.y) * damp(0.04, dt);
  logoGroup.rotation.x += ((-mouse.y * 0.16) - logoGroup.rotation.x) * damp(0.04, dt);
  logoMaterial.uniforms.uTime.value = t;

  // пол, частицы
  gridMaterial.uniforms.uTime.value = t;
  particlesMaterial.uniforms.uTime.value = t;

  // тоннель дышит
  for (let i = 0; i < rings.length; i++) {
    const r = rings[i];
    r.rotation.z += r.userData.spin * 0.24 * dt;
    const s = 1 + Math.sin(t * 1.4 + i * 0.4) * 0.025;
    r.scale.setScalar(s);
  }

  // ядро
  coreMaterial.uniforms.uTime.value = t;
  core.rotation.y = t * 0.12;
  orbit.rotation.y = t * 0.25;
  const corePulse = 1 + Math.sin(t * 1.8) * 0.04;
  core.scale.setScalar(corePulse);

  // гало логотипа прячем, когда камера уходит за него (иначе молочная дымка на пролёте)
  logoHalo.visible = camera.position.z > 1.5;

  // камера: сценарий + мышь + лёгкий органический дрейф
  sampleCamera(scrollT);
  const driftX = Math.sin(t * 0.4) * 0.08;
  const driftY = Math.cos(t * 0.33) * 0.06;
  const camK = damp(0.06, dt);
  camera.position.x += (camPos.x + mouse.x * 0.55 + driftX - camera.position.x) * camK;
  camera.position.y += (camPos.y - mouse.y * 0.35 + driftY - camera.position.y) * camK;
  camera.position.z += (camPos.z - camera.position.z) * camK;
  lookCurrent.lerp(camLook, camK);
  camera.lookAt(lookCurrent);

  // FOV-панч от скорости скролла + bloom-отклик
  const fovKick = Math.min(velocity * 15, 16);
  camera.fov += (fovTarget + fovKick - camera.fov) * damp(0.08, dt);
  camera.updateProjectionMatrix();
  bloom.strength = 0.85 + Math.min(velocity * 0.67, 0.5);

  composer.render();

  // не тянет — снижаем ступень качества (см. TIERS), дальше — рендер через кадр
  if (FORCED_TIER === null) {
    qTime += dt; qFrames++;
    if (qTime >= 2) {
      const fps = qFrames / qTime;
      if (fps < 42) {
        if (tier < TIERS.length - 1) { tier++; applyTier(); }
        else if (!frameSkip) { frameSkip = true; window.__IZI_QUALITY.frameSkip = true; }
      }
      qTime = 0; qFrames = 0;
    }
  }

  if (running) requestAnimationFrame(render);
}
requestAnimationFrame(render);

// ---------- Ресайз / видимость ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  applyTier();
});

document.addEventListener('visibilitychange', () => {
  const wasRunning = running;
  running = !document.hidden;
  if (running && !wasRunning) requestAnimationFrame(render);
});
