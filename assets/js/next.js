/* ============================================================
   IZI next: город - сквозной принцип (таймзона + переключатель
   в хедере), карта сети на Leaflet со связкой «карточка клуба ↔
   маркер», энерго-появление фактов и перф-карточек.
   Данные клубов - в clubs.js, он подключается раньше.
   Подключается после main.js (использует его lenis и gsap).
   ============================================================ */

const finePointerNext = window.matchMedia('(pointer: fine)').matches;

/* -------- Определение города: сохранённый выбор или часовой пояс -------- */
function detectCity() {
  const saved = localStorage.getItem(CITY_KEY);
  if (CITIES[saved]) return saved;
  // восточнее Красноярска (UTC+7 и дальше) - показываем Хабаровск
  return new Date().getTimezoneOffset() <= -420 ? 'khv' : 'msk';
}

let currentCity = detectCity();
let factsRevealed = false;

/* -------- Карта сети: тёмные тайлы, свои маркеры, бронь в попапе -------- */
const netmap = L.map('netmap', {
  center: CLUBS[0].ll,
  zoom: 11,
  scrollWheelZoom: false, // колесо остаётся за прокруткой страницы
  attributionControl: true,
});
netmap.attributionControl.setPrefix(false); // только © OpenStreetMap · © CARTO
netmap.zoomControl.setPosition('bottomleft'); // кнопки масштаба уводим вниз, чтобы не спорили с окошком клуба
if (L.Browser.mobile) netmap.dragging.disable(); // на тач карту двигают кнопками зума, страница скроллится свободно
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd',
  maxZoom: 19,
  attribution: '© OpenStreetMap · © CARTO',
}).addTo(netmap);

const cityLayers = { msk: L.layerGroup(), khv: L.layerGroup() };
const markers = {};

CLUBS.forEach((club) => {
  const icon = L.divIcon({
    className: 'lmk-wrap',
    html: `<div class="lmk"><i></i><b>${club.name}</b></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
  const ph = clubPhone(club);
  const marker = L.marker(club.ll, { icon }).bindPopup(
    `<div class="pop__name">IZI · ${club.name}</div>` +
    `<div class="pop__addr">${club.addr}</div>` +
    `<a class="pop__phone" href="tel:+${ph.raw}">${ph.phone}</a>` +
    (ph.stub ? `<div class="pop__stub">общий номер сети</div>` : '') +
    `<div class="pop__btns">${msgBtns(ph.raw, 'pop__msg')}</div>`,
    { className: 'izi-pop', closeButton: true }
  );
  marker.on('mouseover', () => { cancelClose(); setActive(club.id); });
  marker.on('mouseout', () => { if (finePointerNext) scheduleClose(); });
  marker.on('click', () => { cancelClose(); setActive(club.id); });
  markers[club.id] = marker;
  marker.addTo(cityLayers[club.city]);
});

netmap.on('popupclose', clearActive);

function cityBounds(code) {
  return L.latLngBounds(CLUBS.filter((c) => c.city === code).map((c) => c.ll));
}

/* -------- Связка «карточка клуба ↔ маркер на карте» -------- */
function setActive(id) {
  const club = CLUBS.find((c) => c.id === id);
  if (!club) return;
  CLUBS.forEach((c) => {
    const el = markers[c.id].getElement(); // null, если маркер не на карте (другой город)
    if (!el) return;
    el.classList.toggle('is-active', c.id === id);
    el.classList.toggle('is-dim', c.id !== id);
  });
  document.querySelectorAll('.club[data-club]').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.club === id);
  });
  markers[id].openPopup();
  // сдвигаем минимально, только если окошко не влезает; сверху запас на всю его высоту
  netmap.panInside(L.latLng(club.ll), { paddingTopLeft: [60, 190], paddingBottomRight: [60, 40] });
}

function clearActive() {
  CLUBS.forEach((c) => {
    const el = markers[c.id].getElement();
    if (el) el.classList.remove('is-active', 'is-dim');
  });
  document.querySelectorAll('.club[data-club]').forEach((card) => card.classList.remove('is-active'));
}

/* Уводим мышь - окошко гаснет. Пауза перед закрытием, чтобы можно было
   перевести курсор на само окошко и нажать «Забронировать». */
let closeTimer = null;
function scheduleClose() {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => { netmap.closePopup(); }, 260);
}
function cancelClose() { clearTimeout(closeTimer); }

netmap.on('popupopen', (e) => {
  if (!finePointerNext) return;
  const el = e.popup.getElement();
  if (!el) return;
  el.addEventListener('pointerenter', cancelClose);
  el.addEventListener('pointerleave', scheduleClose);
});

document.querySelectorAll('.club[data-club]').forEach((card) => {
  const id = card.dataset.club;
  if (finePointerNext) {
    card.addEventListener('pointerenter', () => { cancelClose(); setActive(id); });
    card.addEventListener('pointerleave', scheduleClose);
  }
  card.addEventListener('focusin', () => { cancelClose(); setActive(id); });
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // клик по кнопке карточки - не перехватываем
    setActive(id);
    if (!finePointerNext) {
      // на тач карта выше карточек - подтягиваем её к экрану, чтобы окошко было видно
      lenis.scrollTo(document.querySelector('.mapbox'), { offset: -80, duration: 0.9 });
    }
  });
});

/* -------- Контакты: лента карточек клубов, едет сама -------- */
const conveyor = document.getElementById('contactRail');
const convTrack = document.getElementById('contactTrack');
const CONV_BASE = 35; // px/сек - базовая скорость, когда гость ничего не делает
const CONV_BOOST_MAX = 620; // потолок разгона от прокрутки страницы
const CONV_FLING_MAX = 2600; // потолок скорости от броска
const CONV_REF = 250; // на таком отдалении от центра карточка уже полностью в наклоне
const CONV_HOLD = 2600; // мс паузы после нажатия на карточку
let convPos = 0; // сдвиг ленты в px, всегда внутри [0, convSet)
let convSet = 0; // ширина одного набора карточек: на неё отматываем назад
let convExtra = 0; // добавка скорости от прокрутки страницы
let convFling = 0; // добавка от броска пальцем или мышью
let convHoldUntil = 0; // нажали на карточку - до этого момента лента придержана
let convHold = 0; // 0..1: чтобы вставать и трогаться плавно, а не рывком
let convCards = [];
let convCenters = [];
let convFills = []; // полосы загрузки в заставках
let convArmed = []; // карточка за правым краем ждёт своей «загрузки»

function buildContacts(code) {
  const list = CLUBS.filter((c) => c.city === code);
  convTrack.innerHTML = list.map((c) => contactCard(c, false)).join('');
  // дробная ширина набора: по целой (scrollWidth) на каждой перемотке набегал сдвиг
  convSet = convTrack.getBoundingClientRect().width;
  // копий берём с запасом на ОБА края: перемотка отматывает ленту ровно на набор,
  // и слева от экрана всегда должна оставаться карточка, иначе на стыке она пропадает
  const copies = Math.max(3, Math.ceil(conveyor.clientWidth / convSet) + 2);
  const clones = list.map((c) => contactCard(c, true)).join('');
  convTrack.innerHTML = convTrack.innerHTML + clones.repeat(copies - 1);
  // центры карточек внутри ленты: по ним считается разворот каждой относительно середины экрана
  convCards = [...convTrack.children];
  convCenters = convCards.map((c) => c.offsetLeft + c.offsetWidth / 2);
  // выравниваем шаг: ширина карточки дробная, из-за округлений соседние шаги
  // отличались на пиксель и перемотка на набор давала микроскачок
  if (convCards.length > 1) {
    const step = (convCenters[convCards.length - 1] - convCenters[0]) / (convCards.length - 1);
    const first = convCenters[0];
    convCenters = convCards.map((c, i) => first + i * step);
    convSet = step * list.length;
  }
  convFills = convCards.map((c) => c.querySelector('.ccard__fill'));
  convArmed = convCards.map(() => true);
  convPos = convSet; // держим ленту на набор правее нуля - слева остаётся запас
}

/* Бросок: тянем ленту за курсором или пальцем, на отпускании она
   докручивается по инерции и возвращается к базовой скорости */
let convGrab = null;
let convClickGuard = false;

conveyor.addEventListener('pointerdown', (e) => {
  if (e.button > 0) return;
  convGrab = { x: e.clientX, lastX: e.clientX, pos: convPos, t: performance.now(), v: 0, moved: 0 };
  convFling = 0;
  convClickGuard = false;
  conveyor.setPointerCapture(e.pointerId);
  conveyor.classList.add('is-drag');
});

conveyor.addEventListener('pointermove', (e) => {
  if (!convGrab) return;
  const shift = e.clientX - convGrab.x;
  convPos = convGrab.pos - shift;
  convGrab.moved = Math.max(convGrab.moved, Math.abs(shift));
  const now = performance.now();
  const dt = now - convGrab.t;
  if (dt > 0) {
    convGrab.v = ((convGrab.lastX - e.clientX) / dt) * 1000; // px/сек в сторону хода ленты
    convGrab.t = now;
    convGrab.lastX = e.clientX;
  }
});

function convRelease() {
  if (!convGrab) return;
  convFling = Math.max(-CONV_FLING_MAX, Math.min(CONV_FLING_MAX, convGrab.v));
  convClickGuard = convGrab.moved > 6; // тащили, а не нажимали - клик не засчитываем
  // нажали на карточку, а не потянули ленту - придерживаем, чтобы успеть прочитать
  if (!convClickGuard) convHoldUntil = performance.now() + CONV_HOLD;
  convGrab = null;
  conveyor.classList.remove('is-drag');
}
conveyor.addEventListener('pointerup', convRelease);
conveyor.addEventListener('pointercancel', convRelease);
conveyor.addEventListener('click', (e) => {
  if (!convClickGuard) return;
  convClickGuard = false;
  e.preventDefault();
  e.stopPropagation();
}, true);

// лента не останавливается ни от наведения, ни после броска - только рука гостя
// на ней может её придержать; фокус клавиатурой не должен смещать ленту вбок
conveyor.addEventListener('focusin', () => { conveyor.scrollLeft = 0; });

let convLast = performance.now();
let convScrollY = window.scrollY;
requestAnimationFrame(function convTick(now) {
  const dt = Math.min(80, now - convLast); // после сворачивания вкладки не прыгаем
  convLast = now;
  if (convSet > 0) {
    // прокрутка страницы подхватывает ленту: вниз - разгон вперёд, вверх - назад
    const pageSpeed = ((window.scrollY - convScrollY) / dt) * 1000;
    convScrollY = window.scrollY;
    const boost = Math.max(-CONV_BOOST_MAX, Math.min(CONV_BOOST_MAX, pageSpeed * 0.4));
    // сглаживания нормированы по dt: одинаково на 30 и на 144 Гц
    convExtra += (boost - convExtra) * (1 - Math.exp(-dt / 130));
    convFling *= Math.exp(-dt / 320);
    // пауза после нажатия: гасим собственный ход ленты, реакция на прокрутку остаётся
    convHold += ((now < convHoldUntil ? 1 : 0) - convHold) * (1 - Math.exp(-dt / 170));

    if (!convGrab) convPos += (((CONV_BASE + convFling) * (1 - convHold) + convExtra) * dt) / 1000;
    // держим сдвиг в пределах [convSet, 2*convSet): шов невидим, а слева всегда есть запасная карточка
    convPos = convSet + ((((convPos - convSet) % convSet) + convSet) % convSet);
    convTrack.style.transform = `translate3d(${-convPos}px, 0, 0)`;

    // боковые наклоны: центральная карточка развёрнута к зрителю, края уходят в глубину
    const mid = conveyor.clientWidth / 2;
    const ref = Math.min(mid, CONV_REF); // на таком отдалении от центра карточка уже полностью в наклоне
    // Загрузка привязана к ПУТИ, а не к таймеру: полоса заполняется, пока карточка
    // едет от правого края к середине, там заставка и уезжает. По времени эффект
    // проходил почти весь за краем экрана - лента медленная.
    const startAt = conveyor.clientWidth;
    const armAt = conveyor.clientWidth + 140;
    convCards.forEach((card, i) => {
      const x = convCenters[i] - convPos;
      const d = Math.max(-1.4, Math.min(1.4, (x - mid) / ref));
      const flat = Math.abs(d);
      card.style.transform = `rotateY(${(-d * 50).toFixed(1)}deg) translateZ(${(-flat * 190).toFixed(0)}px)`;
      card.style.opacity = Math.max(0.14, 1 - flat * 0.6).toFixed(2);

      if (x > armAt) {
        // ушла за правый край (или лента перемоталась) - возвращаем заставку
        if (!convArmed[i]) {
          convArmed[i] = true;
          card.classList.remove('is-open');
          if (convFills[i]) convFills[i].style.width = '0%';
        }
        return;
      }
      convArmed[i] = false;
      if (card.classList.contains('is-open')) return;
      const openAt = mid - (i % 3) * 34; // соседние открываются не в одной точке
      const p = Math.max(0, Math.min(1, (startAt - x) / Math.max(160, startAt - openAt)));
      if (convFills[i]) convFills[i].style.width = (p * 100).toFixed(1) + '%';
      if (p >= 1) card.classList.add('is-open');
    });
  }
  requestAnimationFrame(convTick);
});

let convResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(convResizeTimer);
  convResizeTimer = setTimeout(() => buildContacts(currentCity), 250);
});

/* -------- Применение города ко всему сайту -------- */
function applyCity(code, animate) {
  currentCity = code;
  const city = CITIES[code];
  document.getElementById('cityPickName').textContent = city.name;
  document.getElementById('heroTagCity').textContent = city.name;
  document.getElementById('mapHudCity').textContent = city.hud;
  if (factsRevealed) document.getElementById('factClubsVal').textContent = city.clubs;
  document.getElementById('factClubsName').textContent = city.factName;
  document.getElementById('factClubsText').textContent = city.factText;
  const footerVk = document.getElementById('footerVk');
  footerVk.href = city.vk;
  footerVk.textContent = 'VK · ' + city.name;

  buildContacts(code); // лента контактов: карточка на каждый клуб города
  document.querySelectorAll('.doors').forEach((g) => { g.hidden = g.dataset.city !== code; });

  netmap.closePopup();
  clearActive();
  Object.entries(cityLayers).forEach(([key, layer]) => {
    if (key === code) layer.addTo(netmap);
    else netmap.removeLayer(layer);
  });
  const bounds = cityBounds(code).pad(0.25);
  if (animate) netmap.flyToBounds(bounds, { duration: 1.3 });
  else netmap.fitBounds(bounds);
}

function setCity(code) {
  if (!CITIES[code] || code === currentCity) return;
  localStorage.setItem(CITY_KEY, code);
  applyCity(code, true);
  gsap.fromTo('.doors:not([hidden]) .club',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06 });
  ScrollTrigger.refresh();
}

applyCity(currentCity, false);

document.getElementById('cityPick').addEventListener('click', () => {
  setCity(currentCity === 'msk' ? 'khv' : 'msk');
});

/* -------- Перф-карточки: эффектный выход -------- */
/* цифры значения крутятся как слот-машина и «защёлкиваются» на финале */
function scrambleDigits(el, duration) {
  const node = el.childNodes[0]; // текст до <em>
  const final = node.textContent;
  const start = performance.now();
  (function tick(now) {
    const p = (now - start) / duration;
    if (p >= 1) { node.textContent = final; return; }
    node.textContent = final.replace(/\d/g, (d) => (Math.random() < p ? d : Math.floor(Math.random() * 10)));
    requestAnimationFrame(tick);
  })(start);
}

const perfcards = gsap.utils.toArray('.perfcards .perfcard');
gsap.set(perfcards, { opacity: 0, x: (i) => (i === 0 ? -90 : 90), rotateY: (i) => (i === 0 ? 10 : -10), transformPerspective: 900 });
gsap.set('.perfcard__corner', { scale: 2.4, opacity: 0 });
ScrollTrigger.create({
  trigger: '.perfcards',
  start: 'top 80%',
  once: true,
  onEnter: () => {
    const tl = gsap.timeline();
    tl.to(perfcards, { opacity: 1, x: 0, rotateY: 0, duration: 0.85, ease: 'power4.out', stagger: 0.16 })
      .to('.perfcard__corner', { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.07 }, '-=0.45')
      .add(() => {
        perfcards.forEach((c, i) => {
          setTimeout(() => {
            c.classList.add('is-on');
            scrambleDigits(c.querySelector('.perfcard__value'), 800);
          }, i * 160);
        });
      }, '-=0.35');
  },
});

/* -------- Факты: выезд + энергия окрашивает текст (жёлтый → обычный) -------- */
const facts = gsap.utils.toArray('.facts .fact');
gsap.set(facts, { opacity: 0, y: 44 });
ScrollTrigger.create({
  trigger: '.facts',
  start: 'top 85%',
  once: true,
  onEnter: () => {
    gsap.to(facts, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.14,
    });
    facts.forEach((f, i) => {
      setTimeout(() => {
        f.classList.add('is-lit');
        // текст «прогорает» энергией: вспыхивает жёлтым и гаснет до обычного цвета
        gsap.from(f.querySelectorAll('.fact__num, .fact__value, .fact__name, p'), {
          color: '#ffe600',
          duration: 1.15,
          ease: 'power2.out',
          stagger: 0.09,
        });
      }, 300 + i * 190);
    });
    // счётчик клубов города в факте 04
    const val = document.getElementById('factClubsVal');
    const state = { v: 0 };
    gsap.to(state, {
      v: CITIES[currentCity].clubs,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => { val.textContent = Math.round(state.v); },
      onComplete: () => { factsRevealed = true; },
    });
  },
});
