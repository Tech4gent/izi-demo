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
  },
  khv: {
    name: 'ХАБАРОВСК',
    clubs: 2,
    factName: 'В ХАБАРОВСКЕ',
    factText: 'Калинина и Краснореченская. Своя атмосфера - один уровень.',
    hud: 'KHV // 48.48 N · 135.07 E',
    vk: 'https://vk.ru/izicyber',
  },
};
const CLUBS = [
  { id: 'bel', city: 'msk', name: 'БЕЛОРУССКАЯ', addr: 'Большой Кондратьевский пер., 12с1', ll: [55.773965, 37.581563], ya: 'https://yandex.ru/maps/-/CTrNyO5Z' },
  { id: 'kur', city: 'msk', name: 'КУРСКАЯ', addr: 'ул. Земляной Вал, 36с2', ll: [55.755494, 37.655467], ya: 'https://yandex.ru/maps/-/CTrNyDyw' },
  { id: 'prof', city: 'msk', name: 'ПРОФСОЮЗНАЯ', addr: 'Нахимовский просп., 38', ll: [55.6777, 37.567235], ya: 'https://yandex.ru/maps/-/CTrNyTJE' },
  { id: 'p1905', city: 'msk', name: '1905 ГОДА', addr: 'ул. 1905 года, 9с1', ll: [55.763863, 37.560115], ya: 'https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%201905%20%D0%B3%D0%BE%D0%B4%D0%B0%2C%209%D1%811' },
  { id: 'kal', city: 'khv', name: 'КАЛИНИНА', addr: 'ул. Калинина, 80', ll: [48.475085, 135.063075], ya: 'https://yandex.ru/maps/-/CTrN5YM5' },
  { id: 'kras', city: 'khv', name: 'КРАСНОРЕЧЕНСКАЯ', addr: 'ул. Краснореченская, 94', ll: [48.429373, 135.111946], ya: 'https://yandex.ru/maps/-/CTrN5Vj0' },
];

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
  const marker = L.marker(club.ll, { icon }).bindPopup(
    `<div class="pop__name">IZI · ${club.name}</div>` +
    `<div class="pop__addr">${club.addr}</div>` +
    `<div class="pop__btns">` +
    `<a class="pop__book" href="${CITIES[club.city].vk}" target="_blank" rel="noopener">ЗАБРОНИРОВАТЬ</a>` +
    `<a class="pop__route" href="${club.ya}" target="_blank" rel="noopener">МАРШРУТ</a>` +
    `</div>`,
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
  netmap.panInside(L.latLng(club.ll), { padding: [50, 60] }); // сдвигаем минимально, только если окошко не влезает
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
