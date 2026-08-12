/* ============================================================
   Счётчики и цели. Номера задаются в index.html (IZI_METRIKA, IZI_GA).
   Пока номера пустые - ничего не грузится и не отправляется, сайт
   работает как обычно. Вписал номер - счётчик включился сам.

   Цели: звонок, WhatsApp, Telegram, онлайн-бронь, VK, смена города,
   просмотр прайса конкретного клуба.
   ============================================================ */
(function () {
  const МЕТРИКА = (window.IZI_METRIKA || '').trim();
  const GA = (window.IZI_GA || '').trim();

  /* -------- Яндекс.Метрика -------- */
  if (МЕТРИКА) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    ym(МЕТРИКА, 'init', {
      webvisor: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      defer: true,
    });
  }

  /* -------- Google Analytics 4 -------- */
  if (GA) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA);
  }

  /* -------- Отправка события в оба счётчика -------- */
  function цель(имя, данные) {
    if (МЕТРИКА && window.ym) ym(МЕТРИКА, 'reachGoal', имя, данные);
    if (GA && window.gtag) gtag('event', имя, данные || {});
  }
  window.iziGoal = цель; // чтобы дёргать из других скриптов при нужде

  /* -------- Что считаем конверсией -------- */
  const ЦЕЛИ = [
    { имя: 'call', тест: (h) => h.startsWith('tel:') },
    { имя: 'whatsapp', тест: (h) => h.includes('wa.me') },
    { имя: 'telegram', тест: (h) => h.includes('t.me') },
    { имя: 'booking', тест: (h) => h.includes('langame.ru') },
    { имя: 'vk', тест: (h) => h.includes('vk.ru') || h.includes('vk.com') },
    { имя: 'route', тест: (h) => h.includes('yandex.ru/maps') },
  ];

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const цельСсылки = ЦЕЛИ.find((c) => c.тест(href));
    if (!цельСсылки) return;
    // клуб, из карточки которого нажали - чтобы видеть, какой клуб приносит заявки
    const карточка = a.closest('.club[data-club], .ccard');
    const клуб = карточка
      ? (карточка.dataset.club || (карточка.querySelector('.ccard__club') || {}).textContent || '').replace('IZI · ', '').trim()
      : '';
    цель(цельСсылки.имя, клуб ? { club: клуб } : undefined);
  }, true);

  // смена города и просмотр прайса клуба - не конверсии, но показывают интерес
  document.addEventListener('click', (e) => {
    const city = e.target.closest('#cityPick');
    if (city) { цель('city_switch'); return; }
    const tab = e.target.closest('[data-price-club]');
    if (tab) цель('price_view', { club: tab.textContent.trim() });
  }, true);
})();
