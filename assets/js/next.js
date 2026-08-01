/* ============================================================
   IZI next: город - сквозной принцип (таймзона + переключатель
   в хедере), карта сети на Leaflet со связкой «карточка клуба ↔
   маркер», энерго-появление фактов и перф-карточек.
   Подключается после main.js (использует его lenis и gsap).
   ============================================================ */

/* -------- Данные городов и клубов -------- */
const CITY_KEY = 'izi-city';
const CITIES = {
  msk: {
    name: 'МОСКВА',
    clubs: 4,
    factName: 'В МОСКВЕ',
    factText: 'Белорусская, Курская, Профсоюзная и 1905 года. Своя атмосфера - один уровень.',
    hud: 'MSK // 55.75 N · 37.61 E',
    vk: 'https://vk.ru/izimsk',
    phone: '+7 (995) 900-50-17', // из описания группы VK: клуб на Белорусской
    phoneRaw: '79959005017',
  },
  khv: {
    name: 'ХАБАРОВСК',
    clubs: 2,
    factName: 'В ХАБАРОВСКЕ',
    factText: 'Калинина и Краснореченская. Своя атмосфера - один уровень.',
    hud: 'KHV // 48.48 N · 135.07 E',
    vk: 'https://vk.ru/izicyber',
    phone: '+7 (914) 421-00-12', // из описания группы VK: клуб на Калинина
    phoneRaw: '79144210012',
  },
};
// phone - номер конкретного клуба из описания группы VK; у нового клуба его пока нет
const CLUBS = [
  { id: 'bel', city: 'msk', name: 'БЕЛОРУССКАЯ', addr: 'Большой Кондратьевский пер., 12с1', ll: [55.773965, 37.581563], ya: 'https://yandex.ru/maps/-/CTrNyO5Z', phone: '+7 (995) 900-50-17', phoneRaw: '79959005017' },
  { id: 'kur', city: 'msk', name: 'КУРСКАЯ', addr: 'ул. Земляной Вал, 36с2', ll: [55.755494, 37.655467], ya: 'https://yandex.ru/maps/-/CTrNyDyw', phone: '+7 (995) 896-20-02', phoneRaw: '79958962002' },
  { id: 'prof', city: 'msk', name: 'ПРОФСОЮЗНАЯ', addr: 'Нахимовский просп., 38', ll: [55.6777, 37.567235], ya: 'https://yandex.ru/maps/-/CTrNyTJE', phone: '+7 (995) 900-85-30', phoneRaw: '79959008530' },
  { id: 'p1905', city: 'msk', name: '1905 ГОДА', addr: 'ул. 1905 года, 9с1', ll: [55.763863, 37.560115], ya: 'https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%201905%20%D0%B3%D0%BE%D0%B4%D0%B0%2C%209%D1%811', phone: null, phoneRaw: null },
  { id: 'kal', city: 'khv', name: 'КАЛИНИНА', addr: 'ул. Калинина, 80', ll: [48.475085, 135.063075], ya: 'https://yandex.ru/maps/-/CTrN5YM5', phone: '+7 (914) 421-00-12', phoneRaw: '79144210012' },
  { id: 'kras', city: 'khv', name: 'КРАСНОРЕЧЕНСКАЯ', addr: 'ул. Краснореченская, 94', ll: [48.429373, 135.111946], ya: 'https://yandex.ru/maps/-/CTrN5Vj0', phone: '+7 (914) 205-89-58', phoneRaw: '79142058958' },
];

const finePointerNext = window.matchMedia('(pointer: fine)').matches;

/* Иконки мессенджеров - одни и те же в окошке на карте и в ленте контактов */
const WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.16c-.24.68-1.2 1.26-1.98 1.42-.53.11-1.22.2-3.55-.76-2.98-1.23-4.9-4.25-5.05-4.45-.15-.2-1.2-1.6-1.2-3.05s.76-2.16 1.03-2.46c.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.24.6.83 2.05.9 2.2.08.15.13.32.03.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.37 1.46.3.15.47.13.64-.08.17-.2.74-.86.93-1.16.2-.3.39-.25.66-.15.27.1 1.71.81 2 .96.3.15.5.22.57.35.07.13.07.75-.17 1.41z"/></svg>';
const TG_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.5 4.3 2.9 11.5c-.9.35-.9.85-.15 1.08l4.75 1.48 1.83 5.6c.22.6.4.83.85.83.35 0 .5-.16.7-.35l2.28-2.22 4.75 3.5c.87.48 1.5.23 1.72-.8l3.1-14.6c.32-1.27-.48-1.85-1.3-1.5z"/></svg>';

/* Телефон клуба. У нового клуба на 1905 года своего номера пока нет -
   заглушка: показываем общий номер города и подписываем это честно.
   TODO: заменить на номер клуба, когда клиент его пришлёт. */
function clubPhone(club) {
  if (club.phone) return { phone: club.phone, raw: club.phoneRaw, stub: false };
  const city = CITIES[club.city];
  return { phone: city.phone, raw: city.phoneRaw, stub: true };
}

/* Кнопки мессенджеров на номере клуба: WhatsApp и Telegram есть на любом номере */
function msgBtns(raw, cls, clone) {
  const tail = clone ? ' tabindex="-1"' : '';
  return `<a class="${cls} ${cls}--wa" href="https://wa.me/${raw}" target="_blank" rel="noopener"${tail}>${WA_ICON}<span>WhatsApp</span></a>` +
    `<a class="${cls} ${cls}--tg" href="https://t.me/+${raw}" target="_blank" rel="noopener"${tail}>${TG_ICON}<span>Telegram</span></a>`;
}

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
const CONV_SPEED = 14; // px/сек - лента ползёт еле заметно
let convPos = 0;
let convSet = 0; // ширина одного набора карточек: на неё отматываем назад
let convPaused = false;
let convTimer = null;

function contactCard(club, clone) {
  const ph = clubPhone(club);
  return `<article class="ccard"${clone ? ' aria-hidden="true"' : ''}>` +
    `<i class="club__corner club__corner--tl" aria-hidden="true"></i>` +
    `<i class="club__corner club__corner--br" aria-hidden="true"></i>` +
    `<div class="ccard__club">IZI · ${club.name}</div>` +
    `<div class="ccard__addr">${club.addr}</div>` +
    `<a class="ccard__phone" href="tel:+${ph.raw}"${clone ? ' tabindex="-1"' : ''}>${ph.phone}</a>` +
    (ph.stub ? `<div class="ccard__stub">общий номер сети</div>` : '') +
    `<div class="ccard__btns">${msgBtns(ph.raw, 'cbtn', clone)}</div>` +
    `</article>`;
}

function buildContacts(code) {
  const list = CLUBS.filter((c) => c.city === code);
  convTrack.innerHTML = list.map((c) => contactCard(c, false)).join('');
  convSet = convTrack.scrollWidth; // у карточек margin-right, поэтому наборы стыкуются без шва
  // дублируем набор, пока лента не станет длиннее экрана - иначе прокручивать нечего
  const copies = Math.max(2, Math.ceil(conveyor.clientWidth / convSet) + 1);
  const clones = list.map((c) => contactCard(c, true)).join('');
  convTrack.innerHTML = convTrack.innerHTML + clones.repeat(copies - 1);
  conveyor.scrollLeft = 0;
  convPos = 0;
}

function convPause(resumeAfter) {
  convPaused = true;
  clearTimeout(convTimer);
  if (resumeAfter) convTimer = setTimeout(convResume, resumeAfter);
}
function convResume() {
  convPos = conveyor.scrollLeft; // пользователь мог утащить ленту - продолжаем с его места
  convPaused = false;
}

// пауза на действия пользователя, дальше едем сама
let convDrag = false;
conveyor.addEventListener('pointerdown', () => { convDrag = true; convPause(0); });
// отпустить палец могли уже за пределами ленты - слушаем окно, иначе пауза залипнет
window.addEventListener('pointerup', () => {
  if (!convDrag) return;
  convDrag = false;
  convPause(conveyor.matches(':hover') ? 0 : 3500);
});
window.addEventListener('pointercancel', () => { if (convDrag) { convDrag = false; convPause(3500); } });
conveyor.addEventListener('wheel', () => convPause(3500), { passive: true });
conveyor.addEventListener('focusin', () => convPause(0));
conveyor.addEventListener('focusout', () => convPause(1200));
if (finePointerNext) {
  conveyor.addEventListener('pointerenter', () => convPause(0));
  conveyor.addEventListener('pointerleave', () => convPause(600));
}

let convLast = performance.now();
requestAnimationFrame(function convTick(now) {
  const dt = Math.min(80, now - convLast); // после сворачивания вкладки не прыгаем
  convLast = now;
  if (!convPaused && convSet > 0) {
    convPos += (CONV_SPEED * dt) / 1000;
    if (convPos >= convSet) convPos -= convSet; // шов невидим: дальше идёт такой же набор
    conveyor.scrollLeft = convPos;
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
