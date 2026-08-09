/* ============================================================
   Страница выбора анимации блока контактов: шесть сцен на одних
   и тех же карточках клубов (данные - clubs.js). Каждая сцена
   перебирает клубы по кругу; невидимые сцены не тикают.
   ============================================================ */

const A_CLUBS = CLUBS.filter((c) => c.city === 'msk');

const animIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.target.__toggle) e.target.__toggle(e.isIntersecting); });
}, { rootMargin: '140px' });

/* Сцена тикает только когда её видно - шесть анимаций разом ни к чему */
function runner(el, step, period) {
  let timer = null;
  el.__toggle = (on) => {
    if (on && !timer) timer = setInterval(step, period);
    if (!on && timer) { clearInterval(timer); timer = null; }
  };
  animIO.observe(el);
}

/* Внутренности карточки без обёртки - для сцен, где элемент переиспользуется */
function cardInner(club) {
  const box = document.createElement('div');
  box.innerHTML = contactCard(club, false);
  return box.firstElementChild.innerHTML;
}

/* -------- 01. Сборка -------- */
function buildAssembly(root) {
  root.classList.add('asm');
  let i = 0;
  const render = () => { root.innerHTML = contactCard(A_CLUBS[i], false); };
  render();
  runner(root, () => {
    root.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % A_CLUBS.length;
      render(); // новая разметка - анимация сборки стартует сама
      root.classList.remove('is-out');
    }, 340);
  }, 4200);
}

/* -------- 02. Телепорт -------- */
function buildGlitch(root) {
  root.classList.add('tp');
  const scan = document.createElement('span');
  scan.className = 'tp__scan';
  let i = 0;
  const render = () => { root.innerHTML = contactCard(A_CLUBS[i], false); root.appendChild(scan); };
  render();
  runner(root, () => {
    root.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % A_CLUBS.length;
      render();
      root.classList.remove('is-out');
      root.classList.add('is-flash'); // луч развёртки проходит по сцене
      setTimeout(() => root.classList.remove('is-flash'), 600);
    }, 360);
  }, 3800);
}

/* -------- 03. Взрыв -------- */
function buildBoom(root) {
  root.classList.add('boom');
  const parts = document.createElement('div');
  parts.className = 'boom__parts';
  const COLS = 5;
  const ROWS = 3;
  let i = 0;

  const render = () => { root.innerHTML = contactCard(A_CLUBS[i], false); root.appendChild(parts); };
  const layout = () => {
    const card = root.querySelector('.ccard').getBoundingClientRect();
    parts.style.width = card.width + 'px';
    parts.style.height = card.height + 'px';
    parts.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = document.createElement('i');
        const w = card.width / COLS;
        const h = card.height / ROWS;
        // разлёт от центра карточки, чем дальше осколок - тем сильнее
        const dx = (c - (COLS - 1) / 2) * (90 + Math.abs(c - 2) * 40);
        const dy = (r - (ROWS - 1) / 2) * (110 + Math.abs(r - 1) * 40) - 20;
        t.style.cssText = `left:${c * w}px;top:${r * h}px;width:${w - 3}px;height:${h - 3}px;` +
          `--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--rot:${((c - 2) * 14 + (r - 1) * 9).toFixed(0)}deg;` +
          `animation-delay:${(Math.abs(c - 2) * 0.03 + Math.abs(r - 1) * 0.02).toFixed(2)}s`;
        parts.appendChild(t);
      }
    }
  };

  render();
  layout();
  runner(root, () => {
    layout();
    root.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % A_CLUBS.length;
      render();
      layout();
      root.classList.remove('is-out');
      root.classList.add('is-in'); // осколки слетаются обратно
      setTimeout(() => root.classList.remove('is-in'), 460);
    }, 480);
  }, 4000);
}

/* -------- 04. Загрузка карты -------- */
function buildLevel(root) {
  const box = document.createElement('div');
  box.className = 'lvl';
  root.appendChild(box);
  let i = 0;

  const render = () => {
    const club = A_CLUBS[i];
    box.innerHTML = contactCard(club, false) +
      `<div class="lvl__cover">` +
      `<div class="lvl__tag">КАРТА 0${i + 1} · IZI</div>` +
      `<div class="lvl__name">${club.name}</div>` +
      `<div class="lvl__bar"><i class="lvl__fill"></i></div>` +
      `<div class="lvl__row"><span>ЗАГРУЗКА КОНТАКТОВ</span><span>${club.addr}</span></div>` +
      `</div>`;
  };

  const play = () => {
    render();
    box.classList.remove('is-open');
    box.classList.add('is-load'); // полоса заполняется
    setTimeout(() => box.classList.add('is-open'), 1300); // заставка уезжает вверх
  };

  play();
  runner(root, () => { box.classList.remove('is-load'); i = (i + 1) % A_CLUBS.length; play(); }, 4600);
}

/* -------- 05. Колода -------- */
function buildDeck(root) {
  const deck = document.createElement('div'); // стопка - отдельная коробка, иначе сцена перестаёт центрировать
  deck.className = 'deck';
  root.appendChild(deck);
  const DEPTH = ['is-top', 'is-mid', 'is-back'];
  const cards = DEPTH.map((cls, k) => {
    const box = document.createElement('div');
    box.innerHTML = contactCard(A_CLUBS[k % A_CLUBS.length], false);
    const el = box.firstElementChild;
    el.classList.add(cls);
    deck.appendChild(el);
    return el;
  });
  let order = [0, 1, 2];
  let next = DEPTH.length % A_CLUBS.length;

  const apply = () => order.forEach((idx, pos) => { cards[idx].className = 'ccard ' + DEPTH[pos]; });

  runner(root, () => {
    const top = cards[order[0]];
    top.className = 'ccard is-gone'; // верхняя улетает с поворотом
    setTimeout(() => {
      top.innerHTML = cardInner(A_CLUBS[next]);
      next = (next + 1) % A_CLUBS.length;
      order = [order[1], order[2], order[0]];
      top.style.transition = 'none'; // возврат в конец стопки - без пролёта через экран
      apply();
      void top.offsetWidth;
      top.style.transition = '';
    }, 620);
  }, 3600);
}

/* -------- 06. Голограмма -------- */
function buildHolo(root) {
  root.classList.add('holo');
  let i = 0;
  const render = () => { root.innerHTML = contactCard(A_CLUBS[i], false); };
  render();
  runner(root, () => {
    root.classList.add('is-out');
    setTimeout(() => {
      i = (i + 1) % A_CLUBS.length;
      render();
      root.classList.remove('is-out');
    }, 400);
  }, 4200);
}

/* -------- 07. Ретро-аркада: пиксельные сцены, в конце карточка -------- */
/* Всё рисуется кодом по мотивам ЖАНРОВ: механики свободны, а конкретные
   игры, их персонажи и названия защищены - в демо клиента им не место. */
const GAME_SCENES = [
  { tag: 'ПАДАЮЩИЕ БЛОКИ', cls: 'gs--blocks', art: '<i class="rt-well"></i><i class="rt-piece"></i><i class="rt-stack"></i><i class="rt-clear"></i>' },
  { tag: 'ЛАБИРИНТ И ТОЧКИ', cls: 'gs--maze', art: '<i class="rt-maze"></i><i class="rt-dots"></i><i class="rt-chomp"></i><i class="rt-hunter"></i>' },
  { tag: 'МОРСКОЙ БОЙ', cls: 'gs--navy', art: '<i class="rt-grid"></i><i class="rt-miss"></i><i class="rt-aim"></i><b class="rt-hit">ПОПАЛ</b>' },
  { tag: 'ПРЫЖКИ ПО ПЛАТФОРМАМ', cls: 'gs--jump', art: '<i class="rt-plat"></i><i class="rt-plat rt-plat--hi"></i><i class="rt-spikes"></i><i class="rt-coin"></i><i class="rt-hero"></i>' },
  { tag: 'ЗМЕЙКА', cls: 'gs--snake', art: '<i class="rt-grid rt-grid--sm"></i><i class="rt-snake"></i><i class="rt-apple"></i>' },
  { tag: 'ЗАХВАТЧИКИ', cls: 'gs--invaders', art: '<i class="rt-inv"></i><i class="rt-inv rt-inv--b"></i><i class="rt-inv rt-inv--c"></i><i class="rt-shot"></i><i class="rt-gun"></i>' },
  { tag: 'ПИНГ-ПОНГ', cls: 'gs--pong', art: '<i class="rt-pad"></i><i class="rt-pad rt-pad--r"></i><i class="rt-ball"></i><i class="rt-net"></i>' },
];
const GS_CUT = 620; // мс на кадр
const GS_HOLD = 3400; // мс на карточку в конце

function buildGames(root) {
  root.classList.add('gs');
  root.innerHTML = `<div class="gs__frame">` +
    GAME_SCENES.map((s) => `<div class="gs__scene ${s.cls}">${s.art}</div>`).join('') +
    `<div class="gs__card"></div><div class="gs__flash"></div>` +
    `<div class="gs__hud"><span id="gsTag"></span><span id="gsIdx"></span></div></div>`;

  const frame = root.firstElementChild;
  const scenes = [...frame.querySelectorAll('.gs__scene')];
  const cardBox = frame.querySelector('.gs__card');
  const tag = frame.querySelector('#gsTag');
  const idxLabel = frame.querySelector('#gsIdx');
  let club = 0;
  let i = 0;
  let alive = false;
  let timer = null;

  const flash = () => {
    root.classList.remove('is-flash');
    void root.offsetWidth;
    root.classList.add('is-flash');
  };

  const showScene = (n) => {
    scenes.forEach((s, k) => s.classList.toggle('is-on', k === n));
    // перезапускаем анимации сцены: без этого второй проход идёт статикой
    const live = scenes[n];
    live.querySelectorAll('i, b').forEach((el) => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
    tag.innerHTML = '// ' + GAME_SCENES[n].tag;
    idxLabel.innerHTML = '<b>' + String(n + 1).padStart(2, '0') + '</b> / ' + GAME_SCENES.length;
    flash();
  };

  const loop = () => {
    if (!alive) return;
    if (i < GAME_SCENES.length) {
      showScene(i);
      i += 1;
      timer = setTimeout(loop, GS_CUT);
      return;
    }
    // финал: из последнего кадра собирается карточка клуба
    cardBox.innerHTML = contactCard(A_CLUBS[club], false);
    cardBox.classList.add('is-on');
    root.classList.add('is-card');
    tag.innerHTML = '// IZI · ' + A_CLUBS[club].name;
    idxLabel.innerHTML = '<b>ГОТОВ КАТАТЬ?</b>';
    flash();
    timer = setTimeout(() => {
      cardBox.classList.remove('is-on');
      root.classList.remove('is-card');
      club = (club + 1) % A_CLUBS.length;
      i = 0;
      loop();
    }, GS_HOLD);
  };

  root.__toggle = (on) => {
    alive = on;
    clearTimeout(timer);
    if (on) loop();
  };
  animIO.observe(root);
}

buildAssembly(document.getElementById('stAssembly'));
buildGlitch(document.getElementById('stGlitch'));
buildBoom(document.getElementById('stBoom'));
buildLevel(document.getElementById('stLevel'));
buildDeck(document.getElementById('stDeck'));
buildHolo(document.getElementById('stHolo'));
buildGames(document.getElementById('stGames'));
