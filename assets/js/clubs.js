/* ============================================================
   Данные клубов и карточка контактов - общие для сайта и для
   страницы выбора карусели. Телефоны живут только здесь.
   Подключать ПЕРЕД next.js.
   ============================================================ */

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
  { id: 'bel', city: 'msk', name: 'БЕЛОРУССКАЯ', addr: 'Большой Кондратьевский пер., 12с1', ll: [55.773965, 37.581563], ya: 'https://yandex.ru/maps/-/CTrNyO5Z', phone: '+7 (995) 900-50-17', phoneRaw: '79959005017' , book: 'https://langame.ru/799456992_computerniy_club_izi-belorusskaya_moskva/booking' },
  { id: 'kur', city: 'msk', name: 'КУРСКАЯ', addr: 'ул. Земляной Вал, 36с2', ll: [55.755494, 37.655467], ya: 'https://yandex.ru/maps/-/CTrNyDyw', phone: '+7 (995) 896-20-02', phoneRaw: '79958962002' , book: 'https://langame.ru/799452722_computerniy_club_izi-kurskaya_moskva/booking' },
  { id: 'prof', city: 'msk', name: 'ПРОФСОЮЗНАЯ', addr: 'Нахимовский просп., 38', ll: [55.6777, 37.567235], ya: 'https://yandex.ru/maps/-/CTrNyTJE', phone: '+7 (995) 900-85-30', phoneRaw: '79959008530' , book: 'https://langame.ru/799454355_computerniy_club_izi-profsoyuznaya_moskva/booking' },
  { id: 'p1905', city: 'msk', name: '1905 ГОДА', addr: 'ул. 1905 года, 9с1', ll: [55.763863, 37.560115], ya: 'https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%201905%20%D0%B3%D0%BE%D0%B4%D0%B0%2C%209%D1%811', phone: null, phoneRaw: null },
  { id: 'kal', city: 'khv', name: 'КАЛИНИНА', addr: 'ул. Калинина, 80', ll: [48.475085, 135.063075], ya: 'https://yandex.ru/maps/-/CTrN5YM5', phone: '+7 (914) 421-00-12', phoneRaw: '79144210012' , book: 'https://langame.ru/799450551_computerniy_club_izi-kalinina_habarovsk/booking' },
  { id: 'kras', city: 'khv', name: 'КРАСНОРЕЧЕНСКАЯ', addr: 'ул. Краснореченская, 94', ll: [48.429373, 135.111946], ya: 'https://yandex.ru/maps/-/CTrN5Vj0', phone: '+7 (914) 205-89-58', phoneRaw: '79142058958' , book: 'https://langame.ru/799451789_computerniy_club_izi-krasnorecenskaya_habarovsk/booking' },
];

/* ============================================================
   Прайс и зоны по клубам. У каждого клуба свои зоны и свои цены, поэтому
   таблица строится из этих данных, а не лежит в разметке.
   Данные собраны 12.08.2026 из карточек клубов в системе бронирования
   LANGAME (там прайс выложен постером, цифры перенесены с него).
   У клуба на 1905 года данных пока нет - ему показывается образец.
   ============================================================ */
const PRICE_REF = 'bel'; // чей прайс показываем как образец, пока нет своего
const СТРОКИ_ПРАЙСА = [
  ['Почасовая · день', '08:00-14:00'],
  ['Пакет · день 3 часа', '08:00-14:00'],
  ['Пакет · день 5 часов', '08:00-13:00'],
  ['Почасовая · вечер и ночь', '14:00-08:00'],
  ['Пакет · вечер 3 часа', '14:00-08:00'],
  ['Пакет · вечер 5 часов', '13:00-08:00'],
  ['Пакет · ночь 10 часов', '23:00-09:00'],
];

/* набор строк один и тот же во всех клубах - собираем из двух матриц цен */
function прайс(zones, wd, we, extra) {
  return {
    zones,
    extra,
    rows: СТРОКИ_ПРАЙСА.map(([name, time], i) => ({ name, time, wd: wd[i], we: we[i] })),
  };
}

const PRICES = {
  bel: прайс(
    [
      { name: 'COMFORT', spec: 'RTX 3070 · 280 Гц · 29 ПК' },
      { name: 'VIP', spec: 'RTX 4070 SUPER · 400 Гц · 35 ПК' },
      { name: 'SUPER DUO', spec: 'RTX 5080 · 600 Гц · 4 ПК', duo: true },
    ],
    [[180, 290, 580], [490, 800, 1600], [790, 1260, 2520], [220, 330, 640], [620, 940, 1820], [1010, 1520, 2940], [1090, 1640, 3190]],
    [[220, 330, 640], [610, 910, 1820], [960, 1440, 2940], [260, 360, 740], [740, 1030, 2110], [1190, 1660, 3410], [1290, 1790, 3690]]
  ),
  kur: прайс(
    [
      { name: 'STANDART', spec: 'RTX 3060 Ti · 240 Гц · 18 ПК' },
      { name: 'COMFORT', spec: 'RTX 3070 · 165-360 Гц · 12 ПК' },
      { name: 'VIP', spec: 'RTX 4070 Ti · 400 Гц · 10 ПК' },
      { name: 'SUPER VIP', spec: 'RTX 4070 Ti · 400 Гц · 5 ПК', duo: true },
    ],
    [[180, 220, 290, 390], [490, 610, 800, 1080], [790, 960, 1260, 1690], [190, 260, 360, 440], [540, 740, 1030, 1260], [870, 1190, 1660, 2020], [950, 1290, 1790, 2190]],
    [[190, 260, 360, 440], [540, 740, 990, 1210], [870, 1190, 1570, 1920], [220, 290, 390, 490], [620, 820, 1110, 1390], [1010, 1330, 1790, 2260], [1090, 1450, 1950, 2440]],
    [['OPEN час', 450], ['OPEN ночь', 1800], ['PRIVATE час', 750], ['PRIVATE ночь', 2900]]
  ),
  prof: прайс(
    [
      { name: 'COMFORT', spec: 'RTX 3070 · 240 Гц · 10 ПК' },
      { name: 'VIP', spec: 'RTX 4070 SUPER · 360 Гц · 23 ПК' },
      { name: 'SUPER DUO', spec: 'RTX 5070 Ti · 540 Гц · 4 ПК', duo: true },
    ],
    [[190, 290, 500], [520, 800, 1380], [830, 1260, 2180], [270, 360, 590], [770, 1030, 1680], [1240, 1660, 2720], [1350, 1790, 2940]],
    [[270, 360, 590], [770, 990, 1630], [1240, 1570, 2570], [290, 390, 690], [820, 1110, 1970], [1330, 1790, 3180], [1450, 1950, 3440]]
  ),
  kal: прайс(
    [
      { name: 'COMFORT', spec: 'RTX 3060 Ti · 390 Гц · 25 ПК' },
      { name: 'PREMIUM', spec: 'RTX 3080 Ti · 540 Гц и 34" · 10 ПК' },
      { name: 'VIP', spec: 'RTX 4070 SUPER · 360 Гц · 5 ПК' },
      { name: 'SUPER VIP', spec: 'RTX 5070 · 400 Гц · 5 ПК', duo: true },
    ],
    [[130, 150, 260, 350], [360, 410, 720, 970], [570, 660, 1130, 1530], [160, 200, 300, 370], [450, 570, 850, 1060], [730, 920, 1380, 1700], [790, 990, 1490, 1860]],
    [[160, 190, 300, 370], [450, 520, 830, 1030], [730, 820, 1310, 1610], [180, 250, 350, 400], [510, 710, 990, 1140], [820, 1150, 1610, 1840], [890, 1260, 1740, 1990]]
  ),
  kras: прайс(
    [
      { name: 'COMFORT', spec: 'RTX 3060 Ti · 280 Гц · 20 ПК' },
      { name: 'PREMIUM', spec: 'RTX 3060 Ti · 240 Гц · 27" · 5 ПК' },
      { name: 'VIP', spec: 'RTX 4070 SUPER · 240 Гц · 10 ПК', duo: true },
    ],
    [[130, 140, 190], [360, 390, 520], [570, 610, 820], [160, 170, 240], [450, 480, 690], [730, 780, 1110], [790, 850, 1190]],
    [[160, 170, 240], [450, 480, 660], [730, 780, 1050], [180, 200, 290], [510, 570, 830], [820, 920, 1340], [890, 990, 1460]],
    [['OPEN час', 350], ['OPEN 3 часа', 990], ['OPEN ночь', 1400]]
  ),
};

/* Прайс клуба, а если своего ещё нет - образец с честной пометкой */
function clubPrices(id) {
  const own = PRICES[id];
  return { data: own || PRICES[PRICE_REF], own: !!own };
}

/* Иконки мессенджеров - одни и те же в окошке на карте и в карточках контактов */
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

/* Карточка контактов клуба. Заставка сверху - «загрузка карты» как в игре:
   карусель включает её у каждой карточки отдельно, когда та въезжает в кадр. */
function contactCard(club, clone) {
  const ph = clubPhone(club);
  const no = CLUBS.filter((c) => c.city === club.city).indexOf(club) + 1;
  return `<article class="ccard"${clone ? ' aria-hidden="true"' : ''}>` +
    `<i class="club__corner club__corner--tl" aria-hidden="true"></i>` +
    `<i class="club__corner club__corner--br" aria-hidden="true"></i>` +
    `<div class="ccard__club">IZI · ${club.name}</div>` +
    `<div class="ccard__addr">${club.addr}</div>` +
    `<a class="ccard__phone" href="tel:+${ph.raw}"${clone ? ' tabindex="-1"' : ''}>${ph.phone}</a>` +
    (ph.stub ? `<div class="ccard__stub">общий номер сети</div>` : '') +
    `<div class="ccard__btns">${msgBtns(ph.raw, 'cbtn', clone)}</div>` +
    `<div class="ccard__cover" aria-hidden="true">` +
    `<div class="ccard__tag">КАРТА 0${no} · IZI</div>` +
    `<div class="ccard__name">${club.name}</div>` +
    `<div class="ccard__bar"><i class="ccard__fill"></i></div>` +
    `<div class="ccard__row"><span>ЗАГРУЗКА КОНТАКТОВ</span><span>${no}/${CLUBS.filter((c) => c.city === club.city).length}</span></div>` +
    `</div>` +
    `</article>`;
}
