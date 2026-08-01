/* ============================================================
   Страница выбора движения карусели: четыре сцены на одних и тех
   же карточках клубов (данные - clubs.js). Общий цикл кадров,
   невидимые сцены не считаются. Ни одна из каруселей не тормозит
   от наведения - только рука гостя может её придержать.
   ============================================================ */

const KAR_CLUBS = CLUBS.filter((c) => c.city === 'msk');
const scenes = [];

const karIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.target.__scene) e.target.__scene.on = e.isIntersecting; });
}, { rootMargin: '150px' });

function scene(el, update) {
  const item = { update, on: true };
  el.__scene = item;
  scenes.push(item);
  karIO.observe(el);
}

/* -------- 01. Кольцо: карточки идут по кругу на зрителя -------- */
function buildRing(root) {
  // восемь слотов: при четырёх соседние карточки вставали ребром и кольцо
  // выглядело одной карточкой; повторы разнесены на 180 градусов и не видны вместе
  const slots = [...KAR_CLUBS, ...KAR_CLUBS];
  const R = 470;
  const step = 360 / slots.length;
  root.innerHTML = `<div class="ring">${slots.map((c, i) => contactCard(c, i >= KAR_CLUBS.length)).join('')}</div>`;
  const ring = root.firstElementChild;
  const cards = [...ring.children];
  cards.forEach((card, i) => { card.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });

  let angle = 0;
  scene(root, (dt, boost) => {
    angle = (angle + ((14 + boost * 34) * dt) / 1000) % 360;
    ring.style.transform = `translateZ(${-R}px) rotateY(${-angle}deg)`;
    cards.forEach((card, i) => {
      const world = ((i * step - angle) * Math.PI) / 180;
      const front = Math.cos(world); // 1 - карточка лицом к зрителю
      card.style.opacity = (0.2 + 0.8 * Math.max(0, front)).toFixed(2);
    });
  });
}

/* -------- 02. Боковые наклоны: центр в фокусе, края в глубине -------- */
function buildCover(root) {
  const one = KAR_CLUBS.map((c) => contactCard(c, false)).join('');
  root.innerHTML = `<div class="cover-rail">${one}</div>`;
  const rail = root.firstElementChild;
  const setW = rail.scrollWidth;
  const copies = Math.max(2, Math.ceil(root.clientWidth / setW) + 1);
  rail.innerHTML = one + KAR_CLUBS.map((c) => contactCard(c, true)).join('').repeat(copies - 1);

  const cards = [...rail.children];
  const centers = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
  let pos = 0;
  scene(root, (dt, boost) => {
    pos = (pos + ((70 + boost * 260) * dt) / 1000 + setW) % setW;
    rail.style.transform = `translate3d(${-pos}px, 0, 0)`;
    const mid = root.clientWidth / 2;
    const ref = Math.min(mid, 420); // на таком отдалении от центра карточка уже полностью в наклоне
    cards.forEach((card, i) => {
      const d = Math.max(-1.4, Math.min(1.4, (centers[i] - pos - mid) / ref));
      const flat = Math.abs(d);
      card.style.transform = `perspective(1100px) rotateY(${(-d * 52).toFixed(1)}deg) ` +
        `translateZ(${(-flat * 210).toFixed(0)}px) scale(${(1.06 - flat * 0.1).toFixed(3)})`;
      card.style.opacity = Math.max(0.12, 1 - flat * 0.62).toFixed(2);
    });
  });
}

/* -------- 03. Тоннель: карточки летят из глубины на зрителя -------- */
function buildTunnel(root) {
  root.innerHTML = KAR_CLUBS.map((c) => contactCard(c, false)).join('');
  const cards = [...root.children];
  const lanes = [-260, 260, -95, 95]; // разводим по сторонам, иначе карточки наезжают друг на друга
  const FLY = 8200; // мс на полный пролёт мимо камеры
  const phase = cards.map((_, i) => i / cards.length);

  scene(root, (dt, boost) => {
    cards.forEach((card, i) => {
      phase[i] = (phase[i] + (dt * (1 + boost * 1.6)) / FLY + 1) % 1;
      const p = phase[i];
      // ближний край держим умеренным, иначе карточка раздувается и режется рамкой
      const z = -1700 + p * 1900;
      const x = lanes[i % lanes.length] * (1 - p * 0.4);
      const fade = p < 0.14 ? p / 0.14 : p > 0.78 ? Math.max(0, (1 - p) / 0.22) : 1;
      card.style.transform = `translate3d(${x.toFixed(0)}px, -50%, ${z.toFixed(0)}px)`;
      card.style.opacity = fade.toFixed(2);
    });
  });
}

/* -------- 04. Плоская лента: как сейчас на сайте -------- */
function buildFlat(rail) {
  const root = rail.parentElement;
  const one = KAR_CLUBS.map((c) => contactCard(c, false)).join('');
  rail.innerHTML = one;
  const setW = rail.scrollWidth;
  const copies = Math.max(2, Math.ceil(root.clientWidth / setW) + 1);
  rail.innerHTML = one + KAR_CLUBS.map((c) => contactCard(c, true)).join('').repeat(copies - 1);

  let pos = 0;
  scene(root, (dt, boost) => {
    const speed = 35 + boost * 580;
    pos = (pos + (speed * dt) / 1000 + setW) % setW;
    const skew = Math.max(-6, Math.min(6, boost * 6));
    rail.style.transform = `translate3d(${-pos}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
  });
}

buildRing(document.getElementById('ring'));
buildCover(document.getElementById('cover'));
buildTunnel(document.getElementById('tunnel'));
buildFlat(document.getElementById('flatRail'));

/* -------- Общий цикл кадров: скорость прокрутки подхватывают все сцены -------- */
let karLast = performance.now();
let karY = window.scrollY;
let karBoost = 0;
requestAnimationFrame(function karTick(now) {
  const dt = Math.min(80, now - karLast);
  karLast = now;
  const pageSpeed = ((window.scrollY - karY) / dt) * 1000;
  karY = window.scrollY;
  const target = Math.max(-1, Math.min(1, pageSpeed / 1600));
  karBoost += (target - karBoost) * (1 - Math.exp(-dt / 130));
  scenes.forEach((s) => { if (s.on) s.update(dt, karBoost); });
  requestAnimationFrame(karTick);
});
