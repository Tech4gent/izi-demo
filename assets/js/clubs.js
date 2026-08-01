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
  { id: 'bel', city: 'msk', name: 'БЕЛОРУССКАЯ', addr: 'Большой Кондратьевский пер., 12с1', ll: [55.773965, 37.581563], ya: 'https://yandex.ru/maps/-/CTrNyO5Z', phone: '+7 (995) 900-50-17', phoneRaw: '79959005017' },
  { id: 'kur', city: 'msk', name: 'КУРСКАЯ', addr: 'ул. Земляной Вал, 36с2', ll: [55.755494, 37.655467], ya: 'https://yandex.ru/maps/-/CTrNyDyw', phone: '+7 (995) 896-20-02', phoneRaw: '79958962002' },
  { id: 'prof', city: 'msk', name: 'ПРОФСОЮЗНАЯ', addr: 'Нахимовский просп., 38', ll: [55.6777, 37.567235], ya: 'https://yandex.ru/maps/-/CTrNyTJE', phone: '+7 (995) 900-85-30', phoneRaw: '79959008530' },
  { id: 'p1905', city: 'msk', name: '1905 ГОДА', addr: 'ул. 1905 года, 9с1', ll: [55.763863, 37.560115], ya: 'https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%201905%20%D0%B3%D0%BE%D0%B4%D0%B0%2C%209%D1%811', phone: null, phoneRaw: null },
  { id: 'kal', city: 'khv', name: 'КАЛИНИНА', addr: 'ул. Калинина, 80', ll: [48.475085, 135.063075], ya: 'https://yandex.ru/maps/-/CTrN5YM5', phone: '+7 (914) 421-00-12', phoneRaw: '79144210012' },
  { id: 'kras', city: 'khv', name: 'КРАСНОРЕЧЕНСКАЯ', addr: 'ул. Краснореченская, 94', ll: [48.429373, 135.111946], ya: 'https://yandex.ru/maps/-/CTrN5Vj0', phone: '+7 (914) 205-89-58', phoneRaw: '79142058958' },
];

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

/* Карточка контактов клуба: одна и та же во всех вариантах карусели */
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
