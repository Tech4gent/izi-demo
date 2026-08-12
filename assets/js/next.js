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
let switchingPopup = false; // открываем новое окошко - закрытие старого не должно гасить подсветку

function setActive(id) {
  const club = CLUBS.find((c) => c.id === id);
  if (!club) return;
  // Сначала окошко: Leaflet закроет предыдущее и выстрелит popupclose. Если красить
  // до этого, clearActive стирал подсветку, и работала только первая карточка.
  switchingPopup = true;
  markers[id].openPopup();
  switchingPopup = false;

  CLUBS.forEach((c) => {
    const el = markers[c.id].getElement(); // null, если маркер не на карте (другой город)
    if (!el) return;
    el.classList.toggle('is-active', c.id === id);
    el.classList.toggle('is-dim', c.id !== id);
  });
  document.querySelectorAll('.club[data-club]').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.club === id);
  });
  // сдвигаем минимально, только если окошко не влезает; сверху запас на всю его высоту
  netmap.panInside(L.latLng(club.ll), { paddingTopLeft: [60, 190], paddingBottomRight: [60, 40] });
}

function clearActive() {
  if (switchingPopup) return;
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

/* Чипы зон в карточках клубов берём из тех же данных, что и прайс:
   набор зон у каждого клуба свой, руками их дублировать нельзя */
document.querySelectorAll('.club[data-club]').forEach((card) => {
  const box = card.querySelector('.club__zones');
  if (!box) return;
  const { data, own } = clubPrices(card.dataset.club);
  box.innerHTML = own
    ? data.zones.map((z) => `<span>${z.name}</span>`).join('')
    : '<span class="club__soon">зоны уточняются</span>';
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

/* -------- Прайс: вкладки клубов, таблица собирается из данных -------- */
const priceTabs = document.getElementById('priceTabs');
const priceWrap = document.getElementById('priceWrap');
const priceNote = document.getElementById('priceNote');

function dayMode() { // будни или выходные - берём с активной кнопки
  const active = document.querySelector('[data-daytab].is-active');
  return active ? active.dataset.daytab : 'wd';
}

function renderPrices(id) {
  const club = CLUBS.find((c) => c.id === id);
  const { data, own } = clubPrices(id);
  const mode = dayMode();
  const duo = (i) => (data.zones[i].duo ? ' class="pricetable__duo"' : '');
  priceWrap.innerHTML =
    '<table class="pricetable" id="priceTable"><thead><tr><th class="pricetable__slot">ТАРИФ</th>' +
    data.zones.map((z, i) => `<th${duo(i)}><b>${z.name}</b><span>${z.spec}</span></th>`).join('') +
    '</tr></thead><tbody>' +
    data.rows.map((r) => `<tr><td><b>${r.name}</b><span>${r.time}</span></td>` +
      r.wd.map((v, i) => `<td${duo(i)} data-wd="${v}" data-we="${r.we[i]}">${mode === 'we' ? r.we[i] : v}</td>`).join('') +
      '</tr>').join('') +
    '</tbody></table>';
  // отдельные тарифы вроде OPEN и PRIVATE есть не везде
  const extra = own && data.extra
    ? '<span class="price__extra">Отдельно: ' + data.extra.map(([n, v]) => `<b>${n}</b> - ${v} ₽`).join(' · ') + '</span> '
    : '';
  priceNote.innerHTML = extra + (own
    ? `Прайс клуба «${club.name}». У других клубов сети свои зоны и цены - смотри соседние вкладки.`
    : `Для клуба «${club.name}» прайс уточняется - показан прайс клуба на Белорусской. Актуальные цены подскажут в группе VK.`);
}

function renderPriceTabs(code) {
  const list = CLUBS.filter((c) => c.city === code);
  priceTabs.innerHTML = list
    .map((c, i) => `<button class="clubtab${i ? '' : ' is-active'}" type="button" data-price-club="${c.id}">${c.name}</button>`)
    .join('');
  renderPrices(list[0].id);
}

priceTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-price-club]');
  if (!btn || btn.classList.contains('is-active')) return;
  [...priceTabs.children].forEach((b) => b.classList.toggle('is-active', b === btn));
  renderPrices(btn.dataset.priceClub);
  gsap.fromTo('#priceTable tbody td', { opacity: 0.25 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
});

/* -------- Контакты: лента карточек клубов, едет сама -------- */
const conveyor = document.getElementById('contactRail');
const convTrack = document.getElementById('contactTrack');
const CONV_BASE = 35; // px/сек - базовая скорость, когда гость ничего не делает
const CONV_BOOST_MAX = 620; // потолок разгона от прокрутки страницы
const CONV_FLING_MAX = 2600; // потолок скорости от броска
const CONV_REF = 250; // на таком отдалении от центра карточка уже полностью в наклоне
const CONV_PERSP = 1500; // перспектива для проекции карточек, считаем её сами
const CONV_DEPTH = 190; // на сколько отъезжает вглубь карточка в полном наклоне
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
let convOffsets = []; // у какой карточки заставка уезжает чуть раньше соседней

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
  // разнобой открытия: сдвиг повторяется с периодом набора, иначе клон
  // открывался бы не там, где оригинал, и шов стал бы заметен
  convOffsets = convCards.map((c, i) => (i % list.length) * 30);
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
    // Прокрутка страницы разгоняет ленту - в любую сторону крутишь, лента идёт
    // вперёд. Назад её не пускаем: карточка тогда возвращается к правому краю,
    // и заставка загрузки надевается на неё прямо на глазах.
    const pageSpeed = Math.abs((window.scrollY - convScrollY) / dt) * 1000;
    convScrollY = window.scrollY;
    const boost = Math.min(CONV_BOOST_MAX, pageSpeed * 0.4);
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
    // Загрузка привязана к ПУТИ и считается КАЖДЫЙ кадр от положения карточки:
    // полоса заполняется, пока та едет от правого края к середине. Состояние не
    // хранится у элемента - иначе на стыке в одной точке экрана оказывались то
    // загружающаяся карточка, то давно открытая, и часть клубов загрузку пропускала.
    const startAt = conveyor.clientWidth;
    convCards.forEach((card, i) => {
      const x = convCenters[i] - convPos;
      const d = Math.max(-1.4, Math.min(1.4, (x - mid) / ref));
      const flat = Math.abs(d);
      // Перспективу считаем сами, а не отдаём браузеру общую на всю ленту:
      // WebKit (Safari) сводит её иначе - соседние карточки разъезжались наружу
      // и наезжали друг на друга. Своя проекция ведёт себя одинаково везде.
      const z = flat * CONV_DEPTH;
      const shift = (-(x - mid) * z) / (CONV_PERSP + z); // сдвиг к центру, как при общей перспективе
      card.style.transform = `translateX(${shift.toFixed(1)}px) perspective(${CONV_PERSP}px) ` +
        `rotateY(${(-d * 50).toFixed(1)}deg) translateZ(${(-z).toFixed(0)}px)`;
      card.style.opacity = Math.max(0.14, 1 - flat * 0.6).toFixed(2);

      // сдвиг точки открытия повторяется вместе с набором, поэтому шов остаётся невидимым
      const openAt = mid + 120 - convOffsets[i];
      const p = Math.max(0, Math.min(1, (startAt - x) / Math.max(160, startAt - openAt)));
      card.classList.toggle('is-open', p >= 1);
      if (convFills[i]) convFills[i].style.width = (p * 100).toFixed(1) + '%';
    });
  }
  requestAnimationFrame(convTick);
});

// пересобираем ленту только когда меняется ШИРИНА: на мобиле resize стреляет
// каждый раз, когда браузер прячет адресную строку, и лента пересобиралась
// прямо во время просмотра - карточки на глазах снова одевались в заставку
let convResizeTimer = null;
let convWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === convWidth) return;
  convWidth = window.innerWidth;
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

  renderPriceTabs(code); // прайс: вкладки клубов этого города
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
