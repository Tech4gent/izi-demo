/* ============================================================
   IZI v3 - интерактив: прелоадер, плавный скролл, анимации,
   табы цен и городов. Без WebGL - только DOM и GSAP.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* -------- Lenis: плавный скролл -------- */
const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* -------- Сплит заголовков: слова не рвутся -------- */
function splitElement(el) {
  const chars = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((piece) => {
          if (!piece) return;
          if (/^\s+$/.test(piece)) { frag.appendChild(document.createTextNode(' ')); return; }
          const word = document.createElement('span');
          word.className = 'word';
          [...piece].forEach((ch) => {
            const c = document.createElement('span');
            c.className = 'char';
            c.textContent = ch;
            word.appendChild(c);
            chars.push(c);
          });
          frag.appendChild(word);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  return chars;
}

const splitTargets = new Map();
document.querySelectorAll('[data-split]').forEach((el) => {
  const chars = splitElement(el);
  gsap.set(chars, { yPercent: 112 });
  splitTargets.set(el, chars);
});

function playSplit(el, delay = 0) {
  const chars = splitTargets.get(el);
  if (!chars || el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  gsap.to(chars, {
    yPercent: 0,
    duration: 0.9,
    ease: 'power4.out',
    stagger: 0.024,
    delay,
  });
}

/* -------- Прелоадер: загрузка как в игре -------- */
const preloader = document.getElementById('preloader');
const preloaderFill = document.getElementById('preloaderFill');
const preloaderPct = document.getElementById('preloaderPct');
const preloaderStatus = document.getElementById('preloaderStatus');
const STATUSES = [
  'ЗАГРУЖАЕМ КЛУБ...',
  'ПРОГРЕВАЕМ RTX 5080...',
  'ЛОВИМ ПИНГ 0.5 MS...',
  'РАЗГОНЯЕМ 600 ГЦ...',
  "LET'S PLAY",
];

/* Прибиваем содержимое экрана загрузки к стартовой высоте окна.
   На мобиле высота меняется на ходу (браузер прячет адресную строку),
   и центрированный по ней блок уезжает - именно это и «прыгало». */
(function pinPreloader() {
  const inner = preloader.querySelector('.preloader__inner');
  const hint = preloader.querySelector('.preloader__hint');
  const h = window.innerHeight;
  inner.style.cssText = 'position:absolute;left:50%;top:' + Math.round(h / 2) + 'px;transform:translate(-50%,-50%)';
  hint.style.top = Math.round(h - 48) + 'px';
  hint.style.bottom = 'auto';
})();

const loadState = { p: 0 };
gsap.to(loadState, {
  p: 100,
  duration: 1.9,
  ease: 'power2.inOut',
  onUpdate() {
    const p = Math.round(loadState.p);
    preloaderFill.style.width = p + '%';
    preloaderPct.textContent = p + '%';
    preloaderStatus.textContent = STATUSES[Math.min(STATUSES.length - 1, Math.floor(p / (100 / STATUSES.length)))];
  },
  onComplete: hidePreloader,
});

/* Уходим растворением, а не сдвигом всего экрана: на слабых машинах
   проезд чёрной плашки на всю высоту идёт рывками */
function hidePreloader() {
  document.body.classList.remove('is-loading'); // возвращаем странице прокрутку
  gsap.timeline({
    delay: 0.2,
    onComplete() {
      preloader.style.display = 'none';
      ScrollTrigger.refresh();
    },
  })
    .to('.preloader__inner, .preloader__hint', { opacity: 0, y: -16, duration: 0.35, ease: 'power2.in' })
    .to(preloader, { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.12');
  introHero();
}

/* -------- Интро хиро -------- */
function introHero() {
  const tl = gsap.timeline({ delay: 0.45 });
  tl.to('.hero__tag', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
    .to('.hero__logo', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
    .add(() => playSplit(document.querySelector('.hero__title')), '-=0.35')
    .to('.hero__sub', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2')
    .to('.hero__actions', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.45')
    .to('.hero__stats', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.45');
}

/* -------- Появление блоков по скроллу -------- */
document.querySelectorAll('[data-reveal]').forEach((el) => {
  if (el.closest('.hero')) return; // хиро оживляет интро
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.85,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  });
});

document.querySelectorAll('[data-split]').forEach((el) => {
  if (el.closest('.hero')) return;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => playSplit(el),
  });
});

/* -------- Счётчики -------- */
document.querySelectorAll('[data-count]').forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  const state = { v: 0 };
  ScrollTrigger.create({
    trigger: el,
    start: 'top 88%',
    once: true,
    onEnter: () => {
      gsap.to(state, {
        v: target,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(state.v); },
      });
    },
  });
});

/* -------- Параллакс фона хиро -------- */
gsap.to('.hero__bg', {
  yPercent: 10,
  ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
});

/* -------- Хедер после скролла -------- */
const header = document.getElementById('header');
ScrollTrigger.create({
  start: 40,
  onUpdate: (self) => header.classList.toggle('is-scrolled', self.scroll() > 40),
});

/* -------- Якорная навигация через Lenis -------- */
document.querySelectorAll('[data-nav]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const hash = link.getAttribute('href');
    if (!hash || !hash.startsWith('#')) return;
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: hash === '#top' ? 0 : -70, duration: 1.4 });
  });
});

/* -------- Табы цен: будни / выходные -------- */
const dayTabs = document.querySelectorAll('[data-daytab]');
dayTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    if (tab.classList.contains('is-active')) return;
    dayTabs.forEach((t) => t.classList.toggle('is-active', t === tab));
    const mode = tab.dataset.daytab; // wd | we
    document.querySelectorAll('#priceTable td[data-wd]').forEach((td) => {
      td.textContent = td.dataset[mode];
    });
    gsap.fromTo('#priceTable tbody td', { opacity: 0.25 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
  });
});

/* -------- Табы городов -------- */
const cityTabs = document.querySelectorAll('[data-citytab]');
cityTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    if (tab.classList.contains('is-active')) return;
    cityTabs.forEach((t) => t.classList.toggle('is-active', t === tab));
    const city = tab.dataset.citytab;
    document.querySelectorAll('.doors').forEach((group) => {
      const show = group.dataset.city === city;
      group.hidden = !show;
      if (show) {
        gsap.fromTo(group.querySelectorAll('.door'),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07 });
      }
    });
    ScrollTrigger.refresh();
  });
});

/* -------- Магнитные кнопки -------- */
const finePointer = window.matchMedia('(pointer: fine)').matches;
if (finePointer) {
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    const strength = 18;
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      gsap.to(btn, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' });
    });
  });

  /* -------- Лёгкий tilt карточек -------- */
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      gsap.to(card, {
        rotateY: x * 4,
        rotateX: -y * 4,
        transformPerspective: 900,
        duration: 0.45,
        ease: 'power2.out',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
    });
  });
}
