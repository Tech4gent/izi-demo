/* ============================================================
   IZI next: выбор города (таймзона + ручной переключатель)
   и энерго-появление фактов. Подключается после main.js.
   ============================================================ */

/* -------- Город: автоопределение по часовому поясу + ручной выбор -------- */
const CITY_KEY = 'izi-city';
const CITIES = {
  msk: { name: 'МОСКВА', clubs: '3', hud: 'MSK // 55.75 N · 37.61 E' },
  khv: { name: 'ХАБАРОВСК', clubs: '2', hud: 'KHV // 48.48 N · 135.07 E' },
};

function detectCity() {
  const saved = localStorage.getItem(CITY_KEY);
  if (CITIES[saved]) return saved;
  // восточнее Красноярска (UTC+7 и дальше) - показываем Хабаровск
  return new Date().getTimezoneOffset() <= -420 ? 'khv' : 'msk';
}

let currentCity = detectCity();

function applyCity(code) {
  currentCity = code;
  const city = CITIES[code];
  document.getElementById('cityPickName').textContent = city.name;
  document.getElementById('statClubs').textContent = city.clubs;
  document.getElementById('statCity').textContent = city.name;
  document.getElementById('mapHudCity').textContent = city.hud;
  document.querySelectorAll('[data-citytab]').forEach((t) => {
    t.classList.toggle('is-active', t.dataset.citytab === code);
  });
  document.querySelectorAll('.doors').forEach((g) => { g.hidden = g.dataset.city !== code; });
  document.querySelectorAll('.citymap').forEach((m) => { m.hidden = m.dataset.map !== code; });
}

function setCity(code) {
  if (!CITIES[code] || code === currentCity) return;
  localStorage.setItem(CITY_KEY, code);
  applyCity(code);
  gsap.fromTo('.mapbox, .doors:not([hidden]) .door',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06 });
  ScrollTrigger.refresh();
}

applyCity(currentCity);

document.getElementById('cityPick').addEventListener('click', () => {
  setCity(currentCity === 'msk' ? 'khv' : 'msk');
});
document.querySelectorAll('[data-citytab]').forEach((tab) => {
  tab.addEventListener('click', () => {
    localStorage.setItem(CITY_KEY, tab.dataset.citytab);
    if (tab.dataset.citytab !== currentCity) setCity(tab.dataset.citytab);
  });
});

/* -------- Факты: выезд с зарядкой энерголиний -------- */
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
      setTimeout(() => f.classList.add('is-lit'), 320 + i * 190);
    });
  },
});
