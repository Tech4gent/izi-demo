/* ============================================================
   IZI next: город - сквозной принцип (таймзона + переключатель
   в хедере), карта сети на Leaflet, энерго-появление фактов
   с окрашиванием текста. Подключается после main.js.
   ============================================================ */

/* -------- Данные городов и клубов -------- */
const CITY_KEY = 'izi-city';
const CITIES = {
  msk: {
    name: 'МОСКВА',
    clubs: 3,
    factName: 'В МОСКВЕ',
    factText: 'Белорусская, Курская и Профсоюзная. Своя атмосфера - один уровень.',
    hud: 'MSK // 55.75 N · 37.61 E',
    center: [55.728, 37.6],
    zoom: 11,
    vk: 'https://vk.ru/izimsk',
  },
  khv: {
    name: 'ХАБАРОВСК',
    clubs: 2,
    factName: 'В ХАБАРОВСКЕ',
    factText: 'Калинина и Краснореченская. Своя атмосфера - один уровень.',
    hud: 'KHV // 48.48 N · 135.07 E',
    center: [48.452, 135.088],
    zoom: 12,
    vk: 'https://vk.ru/izicyber',
  },
};
const CLUBS = [
  { city: 'msk', name: 'БЕЛОРУССКАЯ', addr: 'Большой Кондратьевский пер., 12с1', ll: [55.773965, 37.581563], ya: 'https://yandex.ru/maps/-/CTrNyO5Z' },
  { city: 'msk', name: 'КУРСКАЯ', addr: 'ул. Земляной Вал, 36с2', ll: [55.755494, 37.655467], ya: 'https://yandex.ru/maps/-/CTrNyDyw' },
  { city: 'msk', name: 'ПРОФСОЮЗНАЯ', addr: 'Нахимовский просп., 38', ll: [55.6777, 37.567235], ya: 'https://yandex.ru/maps/-/CTrNyTJE' },
  { city: 'khv', name: 'КАЛИНИНА', addr: 'ул. Калинина, 80', ll: [48.475085, 135.063075], ya: 'https://yandex.ru/maps/-/CTrN5YM5' },
  { city: 'khv', name: 'КРАСНОРЕЧЕНСКАЯ', addr: 'ул. Краснореченская, 94', ll: [48.429373, 135.111946], ya: 'https://yandex.ru/maps/-/CTrN5Vj0' },
];

/* -------- Определение города: сохранённый выбор или часовой пояс -------- */
function detectCity() {
  const saved = localStorage.getItem(CITY_KEY);
  if (CITIES[saved]) return saved;
  // восточнее Красноярска (UTC+7 и дальше) - показываем Хабаровск
  return new Date().getTimezoneOffset() <= -420 ? 'khv' : 'msk';
}

let currentCity = detectCity();
let netmap = null;
let factsRevealed = false;

function applyCity(code) {
  currentCity = code;
  const city = CITIES[code];
  document.getElementById('cityPickName').textContent = city.name;
  document.getElementById('heroTagCity').textContent = city.name;
  document.getElementById('statClubs').textContent = city.clubs;
  document.getElementById('statCity').textContent = city.name;
  document.getElementById('mapHudCity').textContent = city.hud;
  if (factsRevealed) document.getElementById('factClubsVal').textContent = city.clubs;
  document.getElementById('factClubsName').textContent = city.factName;
  document.getElementById('factClubsText').textContent = city.factText;
  const footerVk = document.getElementById('footerVk');
  footerVk.href = city.vk;
  footerVk.textContent = 'VK · ' + city.name;
  document.querySelectorAll('.doors').forEach((g) => { g.hidden = g.dataset.city !== code; });
  if (netmap) {
    netmap.closePopup();
    netmap.flyTo(city.center, city.zoom, { duration: 1.4 });
  }
}

function setCity(code) {
  if (!CITIES[code] || code === currentCity) return;
  localStorage.setItem(CITY_KEY, code);
  applyCity(code);
  gsap.fromTo('.doors:not([hidden]) .door',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06 });
  ScrollTrigger.refresh();
}

applyCity(currentCity);

document.getElementById('cityPick').addEventListener('click', () => {
  setCity(currentCity === 'msk' ? 'khv' : 'msk');
});

/* -------- Карта сети: тёмные тайлы, свои маркеры, бронь в попапе -------- */
netmap = L.map('netmap', {
  center: CITIES[currentCity].center,
  zoom: CITIES[currentCity].zoom,
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

CLUBS.forEach((club) => {
  const icon = L.divIcon({
    className: 'lmk-wrap',
    html: `<div class="lmk"><i></i><b>${club.name}</b></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
  L.marker(club.ll, { icon })
    .addTo(netmap)
    .bindPopup(
      `<div class="pop__name">IZI · ${club.name}</div>` +
      `<div class="pop__addr">${club.addr}</div>` +
      `<div class="pop__btns">` +
      `<a class="pop__book" href="${CITIES[club.city].vk}" target="_blank" rel="noopener">ЗАБРОНИРОВАТЬ</a>` +
      `<a class="pop__route" href="${club.ya}" target="_blank" rel="noopener">МАРШРУТ</a>` +
      `</div>`,
      { className: 'izi-pop', closeButton: true }
    );
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
