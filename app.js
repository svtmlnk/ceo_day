/* ==========================================================================
   День коммерсанта

   Структура файла:
   1. Контент и настройки по умолчанию
   2. Утилиты (даты, экранирование, склонение)
   3. Слой хранения (localStorage) — единственное место, которое
      нужно заменить при переходе на Supabase
   4. Состояние приложения
   5. Подсчёт очков и серии
   6. Шаблоны разметки (BEM-классы описаны в styles.css)
   7. Обработчики событий
   8. Таймер фокус-сессий
   9. Окно настроек
   10. Уведомления
   11. Запуск
   ========================================================================== */

(() => {
  "use strict";

  /* ========================================================================
     1. Контент и настройки по умолчанию
     ====================================================================== */

  const QUOTES = [
    ["Вы промахиваетесь в 100% бросков, которые не делаете.", "Уэйн Гретцки"],
    [
      "Эффективность — делать вещи правильно. Результативность — делать правильные вещи.",
      "Питер Друкер",
    ],
    [
      "Мы — то, что мы делаем постоянно. Совершенство не действие, а привычка.",
      "Уилл Дюрант о философии Аристотеля",
    ],
    [
      "Вы не поднимаетесь до уровня своих целей. Вы опускаетесь до уровня своих систем.",
      "Джеймс Клир, «Атомные привычки»",
    ],
    ["Дисциплина — это мост между целями и достижениями.", "Джим Рон"],
    [
      "Мотивация не длится долго. Как и душ — поэтому их рекомендуют ежедневно.",
      "Зиг Зиглар",
    ],
    ["Тяжело в учении — легко в бою.", "Александр Суворов"],
    ["Путь в тысячу ли начинается с первого шага.", "Лао-цзы"],
    [
      "Оставайтесь голодными. Оставайтесь безрассудными.",
      "Стив Джобс, речь в Стэнфорде, 2005",
    ],
    [
      "Удача — это когда подготовка встречается с возможностью.",
      "приписывается Сенеке",
    ],
    [
      "Что важно, редко бывает срочным, а что срочно — редко важно.",
      "Дуайт Эйзенхауэр",
    ],
    [
      "Я снова и снова терпел неудачи в жизни. Вот почему я добился успеха.",
      "Майкл Джордан",
    ],
    [
      "Если вам предлагают потрясающую возможность, а вы не уверены, что справитесь, — соглашайтесь. Научитесь по ходу.",
      "Ричард Брэнсон",
    ],
    [
      "Всё приходит вовремя для того, кто умеет ждать.",
      "Лев Толстой, «Война и мир»",
    ],
  ];

  const CHALLENGES = [
    "Сделай самый неприятный звонок до 11:00.",
    "Позвони клиенту, с которым не говорил больше месяца.",
    "Попроси у одного довольного клиента рекомендацию.",
    "Первые 90 минут — без почты и мессенджеров.",
    "Отправь три коротких письма «просто узнать, как дела».",
    "Задай клиенту вопрос «что мешает вам расти?» и запиши ответ.",
    "Закрой одно дело, которое откладываешь больше недели.",
    "Перед каждым звонком — одна строка: чего я хочу от разговора.",
    "Скажи «нет» одной задаче, которая не двигает тебя к цели.",
    "Запиши 5 вопросов, которые клиенты задают чаще всего, и лучшие ответы.",
    "Познакомься с одним новым человеком в своей отрасли.",
    "Поблагодари коллегу или партнёра конкретно, за конкретное дело.",
  ];

  /*
   * Роли. Для каждой: название, счётчики касаний [ключ, подпись, цель по умолчанию]
   * и шаблон расписания [время, название блока].
   */
  const ROLES = {
    manager: {
      name: "Менеджер",
      counters: [
        ["calls", "Звонки", 30],
        ["offers", "Коммерческие предложения", 5],
        ["meetings", "Встречи и созвоны", 2],
        ["newContacts", "Новые контакты", 5],
      ],
      scheduleTemplate: [
        ["08:30", "Ритуал и план дня"],
        ["09:00", "Самая трудная задача"],
        ["10:30", "Блок звонков"],
        ["13:00", "Обед без телефона"],
        ["14:00", "Встречи и созвоны"],
        ["16:00", "КП, почта, мессенджеры"],
        ["17:30", "Обучение: 30 минут"],
        ["18:00", "Вечерний разбор"],
      ],
    },
    director: {
      name: "Руководитель",
      counters: [
        ["keyClients", "Касания с ключевыми клиентами", 3],
        ["oneOnOnes", "Встречи 1:1 с командой", 2],
        ["decisions", "Принятые решения", 5],
        ["strategyHours", "Часы на стратегию", 2],
      ],
      scheduleTemplate: [
        ["07:30", "Ритуал и план дня"],
        ["08:30", "Стратегия: глубокая работа"],
        ["10:30", "Ключевые клиенты и партнёры"],
        ["13:00", "Обед"],
        ["14:00", "Встречи 1:1 с командой"],
        ["16:00", "Решения и согласования"],
        ["17:30", "Чтение и обучение"],
        ["18:30", "Вечерний разбор"],
      ],
    },
  };

  const DEFAULT_RITUAL = [
    "Стакан воды, телефон — через 30 минут",
    "10 минут движения",
    "Перечитать цель на неделю",
    "Первый фокус-блок до почты",
  ];

  const DEFAULT_ROLE = "manager";
  const MAX_RITUAL_ITEMS = 12;

  /* Из чего складываются очки дня (в сумме 100) */
  const SCORE_WEIGHTS = { ritual: 25, touches: 50, review: 25 };
  const STREAK_MIN_SCORE = 50;

  const FOCUS_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;

  const SAVE_DELAY_MS = 700;
  const TOAST_DURATION_MS = 2800;

  const RING_RADIUS = 20;
  const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

  const WEEKDAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const WIN_PLACEHOLDERS = [
    "Даже маленькая считается",
    "Что получилось лучше, чем вчера",
    "За что себя похвалить",
  ];

  /* ========================================================================
     2. Утилиты
     ====================================================================== */

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function escapeHtml(value) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return String(value ?? "").replace(/[&<>"']/g, (char) => entities[char]);
  }

  /** Дата → строка «ГГГГ-ММ-ДД» в местном часовом поясе */
  function toDateKey(date) {
    const local = new Date(date);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().slice(0, 10);
  }

  function getTodayKey() {
    return toDateKey(new Date());
  }

  /** Сдвинуть дату-строку на N дней */
  function shiftDate(dateKey, days) {
    const date = new Date(`${dateKey}T12:00`);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
  }

  /** Порядковый номер дня — нужен, чтобы цитата и вызов менялись каждый день */
  function getDayNumber(dateKey) {
    return Math.floor(new Date(`${dateKey}T12:00`).getTime() / 86400000);
  }

  function pickForDate(list, dateKey, step = 1) {
    const length = list.length;
    return list[(((getDayNumber(dateKey) * step) % length) + length) % length];
  }

  /** Склонение: plural(2, "день", "дня", "дней") → "дня" */
  function plural(n, one, few, many) {
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;
    if (lastDigit === 1 && lastTwoDigits !== 11) return one;
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
      return few;
    }
    return many;
  }

  function formatTimer(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  /* ========================================================================
     3. Слой хранения (localStorage)

     Все обращения к хранилищу идут только через объект `storage`.
     Методы уже асинхронные, поэтому для Supabase достаточно заменить
     их тела — остальной код менять не придётся:

       loadSettings()      → select из таблицы настроек
       saveSettings(obj)   → upsert настроек
       loadDays()          → select всех дней пользователя → { "ГГГГ-ММ-ДД": day }
       saveDay(day)        → upsert одной записи дня (ключ: user_id + date)

     Каждый день хранится отдельной записью — это соответствует строке в БД.
     ====================================================================== */

  const STORAGE_KEYS = {
    settings: "day-merchant:settings",
    dayPrefix: "day-merchant:day:",
  };

  /* Ключи старой версии приложения — при запуске удаляются вместе с записями */
  const LEGACY_STORAGE_KEYS = ["dp-days", "dp-settings"];

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  const storage = {
    clearLegacyData() {
      try {
        LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        /* localStorage недоступен — удалять нечего */
      }
    },

    async loadSettings() {
      return readJson(STORAGE_KEYS.settings);
    },

    async saveSettings(settings) {
      return writeJson(STORAGE_KEYS.settings, settings);
    },

    async loadDays() {
      const days = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key.startsWith(STORAGE_KEYS.dayPrefix)) continue;
          const day = readJson(key);
          if (day && day.date) days[day.date] = day;
        }
      } catch (error) {
        /* localStorage недоступен — начинаем с пустого состояния */
      }
      return days;
    },

    async saveDay(day) {
      return writeJson(STORAGE_KEYS.dayPrefix + day.date, day);
    },
  };

  /* ========================================================================
     4. Состояние приложения
     ====================================================================== */

  const state = {
    settings: { role: DEFAULT_ROLE, ritual: [...DEFAULT_RITUAL], targets: {} },
    days: {}, // { "ГГГГ-ММ-ДД": day }
    currentDate: getTodayKey(),
    isLoaded: false,
  };

  function createEmptyDay(date) {
    return {
      date,
      ritualDone: [], // тексты выполненных пунктов ритуала
      challengeDone: false,
      counts: {}, // { ключ счётчика: число касаний }
      schedule: [], // [{ time, text }]
      tasks: [], // [{ text, done }]
      wins: ["", "", ""],
      improvement: "",
      focusSessions: 0,
    };
  }

  /** День по дате; если записи ещё нет — создаётся пустая в памяти */
  function getDay(date = state.currentDate) {
    if (!state.days[date]) state.days[date] = createEmptyDay(date);
    return state.days[date];
  }

  function getRole() {
    return ROLES[state.settings.role] || ROLES[DEFAULT_ROLE];
  }

  function getTarget(counterKey, defaultTarget) {
    const saved = state.settings.targets?.[`${state.settings.role}:${counterKey}`];
    return saved ?? defaultTarget;
  }

  /* Сохранение с задержкой: пока человек печатает, пишем не на каждую букву */

  const saveTimers = {};

  function saveDay(date = state.currentDate, { immediately = false } = {}) {
    clearTimeout(saveTimers[date]);

    const persist = async () => {
      delete saveTimers[date];
      const isSaved = await storage.saveDay(state.days[date]);
      if (!isSaved) showToast("Не удалось сохранить запись");
    };

    if (immediately) persist();
    else saveTimers[date] = setTimeout(persist, SAVE_DELAY_MS);
  }

  async function saveSettings() {
    const isSaved = await storage.saveSettings(state.settings);
    if (!isSaved) showToast("Настройки не сохранены");
  }

  /* Не теряем введённое, если вкладку закрыли раньше срока задержки */
  window.addEventListener("pagehide", () => {
    Object.keys(saveTimers).forEach((date) =>
      saveDay(date, { immediately: true }),
    );
  });

  /* ========================================================================
     5. Подсчёт очков и серии
     ====================================================================== */

  function getRitualProgress(day) {
    const items = state.settings.ritual;
    if (!items.length) return 0;
    const doneCount = items.filter((item) => day.ritualDone.includes(item)).length;
    return doneCount / items.length;
  }

  function getTouchesProgress(day) {
    const counters = getRole().counters;
    const sum = counters.reduce((total, [key, , defaultTarget]) => {
      const target = Math.max(1, getTarget(key, defaultTarget));
      return total + Math.min(1, (day.counts[key] || 0) / target);
    }, 0);
    return sum / counters.length;
  }

  /* Разбор дня: три победы дают 75%, пункт «что сделаю иначе» — 25% */
  function getReviewProgress(day) {
    const filledWins = day.wins.filter((win) => win.trim()).length;
    return (filledWins / 3) * 0.75 + (day.improvement.trim() ? 0.25 : 0);
  }

  function getScore(day) {
    if (!day) return 0;
    return Math.round(
      getRitualProgress(day) * SCORE_WEIGHTS.ritual +
        getTouchesProgress(day) * SCORE_WEIGHTS.touches +
        getReviewProgress(day) * SCORE_WEIGHTS.review,
    );
  }

  /** Сколько дней подряд набрано не меньше STREAK_MIN_SCORE очков */
  function getStreak() {
    const todayKey = getTodayKey();
    let streak = 0;
    let dateKey = todayKey;

    // Если сегодня ещё не набрано, считаем серию от вчерашнего дня
    if (getScore(state.days[dateKey]) < STREAK_MIN_SCORE) {
      dateKey = shiftDate(dateKey, -1);
    }
    while (getScore(state.days[dateKey]) >= STREAK_MIN_SCORE) {
      streak++;
      dateKey = shiftDate(dateKey, -1);
    }
    return streak;
  }

  /* ========================================================================
     6. Шаблоны разметки
     ====================================================================== */

  const appElement = $("#app");

  function renderApp() {
    if (!state.isLoaded) {
      appElement.innerHTML =
        '<p class="page__loading">Открываю ваш день…</p>';
      return;
    }

    const day = getDay();

    appElement.innerHTML = [
      renderHeader(day),
      renderWeek(),
      renderMorning(day),
      `<div class="grid grid--two">${renderFocus(day)}${renderTouches(day)}</div>`,
      `<div class="grid grid--two">${renderSchedule(day)}${renderTasks(day)}</div>`,
      renderEvening(day),
      renderFooter(),
    ].join("");

    renderTimer();
  }

  /* ---------- Шапка ---------- */

  function getGreeting() {
    const todayKey = getTodayKey();
    if (state.currentDate < todayKey) return "Разбор прошедшего дня";
    if (state.currentDate > todayKey) return "Подготовка к дню";

    const hour = new Date().getHours();
    if (hour < 12) return "Доброе утро";
    if (hour < 18) return "Хорошего дня";
    return "Добрый вечер";
  }

  function renderHeader(day) {
    const isToday = state.currentDate === getTodayKey();
    const dateTitle = new Date(`${state.currentDate}T12:00`).toLocaleDateString(
      "ru-RU",
      { weekday: "long", day: "numeric", month: "long" },
    );
    const score = getScore(day);
    const streak = getStreak();
    const scoreHint = `Очки дня: ритуал ${SCORE_WEIGHTS.ritual}, касания ${SCORE_WEIGHTS.touches}, вечерний разбор ${SCORE_WEIGHTS.review}`;

    return `
      <header class="header">
        <div class="header__greeting">
          <span class="header__date">${escapeHtml(dateTitle)}</span>
          <h1 class="header__title">${getGreeting()}</h1>
        </div>

        <nav class="header__nav">
          <button class="button" data-action="shift-day" data-offset="-1" aria-label="Предыдущий день">‹</button>
          ${isToday ? "" : '<button class="button" data-action="go-today">Сегодня</button>'}
          <button class="button" data-action="shift-day" data-offset="1" aria-label="Следующий день">›</button>
        </nav>

        <div class="score" title="${scoreHint}">
          <svg class="score__ring" viewBox="0 0 48 48">
            <circle class="score__ring-track" cx="24" cy="24" r="${RING_RADIUS}" />
            <circle class="score__ring-progress" cx="24" cy="24" r="${RING_RADIUS}"
              stroke-dasharray="${RING_LENGTH}"
              stroke-dashoffset="${RING_LENGTH * (1 - score / 100)}"
              transform="rotate(-90 24 24)" />
            <text class="score__ring-value" x="24" y="29" text-anchor="middle">${score}</text>
          </svg>
          <div>
            <strong class="score__title">Очки дня</strong>
            <span class="score__streak">Серия: <span class="score__streak-count">${streak}</span> ${plural(streak, "день", "дня", "дней")} от ${STREAK_MIN_SCORE}</span>
          </div>
        </div>
      </header>`;
  }

  /* ---------- Неделя ---------- */

  function renderWeek() {
    const todayKey = getTodayKey();
    const currentWeekday = new Date(`${state.currentDate}T12:00`).getDay();
    const monday = shiftDate(state.currentDate, -((currentWeekday + 6) % 7));

    const dayButtons = WEEKDAY_NAMES.map((weekdayName, index) => {
      const dateKey = shiftDate(monday, index);
      const modifiers = [
        dateKey === state.currentDate ? " week__day--current" : "",
        dateKey === todayKey ? " week__day--today" : "",
      ].join("");

      return `
        <button class="week__day${modifiers}" data-action="select-day" data-date="${dateKey}">
          <span class="week__weekday">${weekdayName}</span>
          <span class="week__date">${Number(dateKey.slice(8))}</span>
          <span class="week__bar"><i class="week__bar-fill" style="width:${getScore(state.days[dateKey])}%"></i></span>
        </button>`;
    });

    return `<div class="week">${dayButtons.join("")}</div>`;
  }

  /* ---------- Утро ---------- */

  function renderMorning(day) {
    const [quoteText, quoteAuthor] = pickForDate(QUOTES, state.currentDate);
    const challenge = pickForDate(CHALLENGES, state.currentDate, 7);

    const ritualItems = state.settings.ritual
      .map((item, index) => {
        const isDone = day.ritualDone.includes(item);
        return `
          <label class="checklist__item${isDone ? " checklist__item--done" : ""}">
            <input class="checkbox" type="checkbox" data-field="ritual" data-index="${index}" ${isDone ? "checked" : ""}>
            <span class="checklist__text">${escapeHtml(item)}</span>
          </label>`;
      })
      .join("");

    return `
      <section class="section section--morning">
        <div class="section__header">
          <span class="section__badge">Утро</span>
          <h2 class="section__title">Настрой</h2>
          <span class="section__hint">15 минут до первых дел</span>
        </div>

        <figure class="quote">
          <blockquote class="quote__text">«${escapeHtml(quoteText)}»</blockquote>
          <figcaption class="quote__author">— ${escapeHtml(quoteAuthor)}</figcaption>
        </figure>

        <div class="challenge">
          <strong class="challenge__title">Вызов дня</strong>
          <label class="challenge__label">
            <input class="checkbox" type="checkbox" data-field="challenge" ${day.challengeDone ? "checked" : ""}>
            <span>${escapeHtml(challenge)}</span>
          </label>
        </div>

        <div class="field">
          <span class="field__label">Утренний ритуал</span>
          <div class="checklist">${ritualItems}</div>
        </div>
      </section>`;
  }

  /* ---------- Фокус (только таймер) ---------- */

  function renderFocus() {
    return `
      <section class="section section--day">
        <div class="section__header">
          <span class="section__badge">День</span>
          <h2 class="section__title">Фокус</h2>
          <span class="section__hint">Работа короткими сессиями</span>
        </div>
        <div class="timer" id="timer"></div>
      </section>`;
  }

  /* ---------- Касания ---------- */

  function renderCounter([key, name, defaultTarget], day) {
    const value = day.counts[key] || 0;
    const target = getTarget(key, defaultTarget);
    const percent = Math.min(100, (value / Math.max(1, target)) * 100);

    return `
      <div class="counter${value >= target ? " counter--reached" : ""}">
        <span class="counter__title">${escapeHtml(name)}</span>
        <div class="counter__value">
          <b class="counter__current">${value}</b>
          <span class="counter__target">/ ${target}</span>
        </div>
        <div class="counter__progress"><i class="counter__progress-fill" style="width:${percent}%"></i></div>
        <div class="counter__buttons">
          <button class="counter__button" type="button" data-action="change-counter" data-counter="${key}" data-step="-1" aria-label="Минус">−</button>
          <button class="counter__button counter__button--plus" type="button" data-action="change-counter" data-counter="${key}" data-step="1" aria-label="Плюс">+</button>
        </div>
      </div>`;
  }

  function renderTouches(day) {
    const counters = getRole().counters.map((counter) => renderCounter(counter, day));

    return `
      <section class="section section--day">
        <div class="section__header">
          <span class="section__badge">День</span>
          <h2 class="section__title">Касания</h2>
          <span class="section__hint">Активность, которую вы контролируете</span>
        </div>
        <div class="counters">${counters.join("")}</div>
      </section>`;
  }

  /* ---------- Расписание ---------- */

  /** Блоки по времени. Блоки без времени — в конец. Индекс нужен для правки исходного массива */
  function getSortedBlocks(day) {
    return day.schedule
      .map((block, index) => ({ ...block, index }))
      .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }

  function getCurrentBlockPosition(sortedBlocks) {
    if (state.currentDate !== getTodayKey()) return -1;

    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    let position = -1;
    sortedBlocks.forEach((block, i) => {
      if (block.time && block.time <= nowTime) position = i;
    });
    return position;
  }

  function renderScheduleBlock(block, isCurrent) {
    const currentModifier = isCurrent ? " input--current" : "";
    return `
      <div class="schedule__block">
        <input class="input input--time${currentModifier}" type="time" id="block-time-${block.index}" data-field="block-time" data-index="${block.index}" value="${escapeHtml(block.time || "")}">
        <input class="input${currentModifier}" id="block-text-${block.index}" data-field="block-text" data-index="${block.index}" value="${escapeHtml(block.text)}" placeholder="Блок">
        <button class="delete-button" data-action="delete-block" data-index="${block.index}" aria-label="Удалить блок">×</button>
      </div>`;
  }

  function renderSchedule(day) {
    const blocks = getSortedBlocks(day);
    const currentPosition = getCurrentBlockPosition(blocks);

    const content = blocks.length
      ? `<div class="schedule">${blocks.map((block, i) => renderScheduleBlock(block, i === currentPosition)).join("")}</div>`
      : `<p class="section__empty-text">Разложите день на блоки: глубокая работа утром, звонки пачкой, почта — в отведённое время.</p>`;

    const templateButton = blocks.length
      ? ""
      : `<button class="add-button" data-action="apply-template">Шаблон: ${getRole().name.toLowerCase()}</button>`;

    return `
      <section class="section section--day">
        <div class="section__header">
          <span class="section__badge">День</span>
          <h2 class="section__title">Расписание</h2>
          <span class="section__hint">Блоки времени вместо списка дел</span>
        </div>
        ${content}
        <div class="schedule__actions">
          <button class="add-button" data-action="add-block">+ Блок</button>
          ${templateButton}
        </div>
      </section>`;
  }

  /* ---------- Остальные задачи ---------- */

  function renderTask(task, index) {
    return `
      <div class="task">
        <input class="checkbox" type="checkbox" data-field="task-done" data-index="${index}" ${task.done ? "checked" : ""} aria-label="Готово">
        <input class="input${task.done ? " input--done" : ""}" id="task-${index}" data-field="task-text" data-index="${index}" value="${escapeHtml(task.text)}" placeholder="Задача">
        <button class="delete-button" data-action="delete-task" data-index="${index}" aria-label="Удалить">×</button>
      </div>`;
  }

  function renderTasks(day) {
    return `
      <section class="section section--day">
        <div class="section__header">
          <span class="section__badge">День</span>
          <h2 class="section__title">Остальное</h2>
          <span class="section__hint">Мелочи — после главного</span>
        </div>
        <div class="tasks">
          ${day.tasks.map(renderTask).join("")}
          <button class="add-button" data-action="add-task">+ Задача</button>
        </div>
      </section>`;
  }

  /* ---------- Вечерний разбор ---------- */

  function renderEvening(day) {
    const isToday = state.currentDate === getTodayKey();

    const wins = day.wins
      .map(
        (win, index) => `
          <input class="input" id="win-${index}" data-field="win" data-index="${index}" value="${escapeHtml(win)}" placeholder="${WIN_PLACEHOLDERS[index]}">`,
      )
      .join("");

    return `
      <section class="section section--evening">
        <div class="section__header">
          <span class="section__badge">Вечер</span>
          <h2 class="section__title">Разбор дня</h2>
          <span class="section__hint">5 минут, чтобы завтра было легче</span>
        </div>

        <div class="review__columns">
          <div class="field">
            <span class="field__label">Три победы сегодня</span>
            <div class="review__wins">${wins}</div>
          </div>

          <div class="field">
            <label class="field__label" for="improvement">Что сделаю иначе завтра</label>
            <textarea class="input input--textarea" id="improvement" data-field="improvement" rows="3">${escapeHtml(day.improvement)}</textarea>
          </div>
        </div>

        <button class="button button--dusk" data-action="carry-over">
          Перенести незакрытое на ${isToday ? "завтра" : "следующий день"}
        </button>
      </section>`;
  }

  /* ---------- Подвал ---------- */

  function renderFooter() {
    return `
      <footer class="footer">
        <span class="footer__note">Записи хранятся в этом браузере. Роль: ${getRole().name.toLowerCase()}.</span>
        <button class="footer__link" data-action="open-settings">Настройки: роль, ритуал, цели</button>
      </footer>`;
  }

  /* Обновление очков без полной перерисовки — чтобы не сбивать фокус при вводе */
  function refreshScore() {
    const score = getScore(getDay());

    const valueElement = $(".score__ring-value");
    const progressElement = $(".score__ring-progress");
    if (valueElement) valueElement.textContent = score;
    if (progressElement) {
      progressElement.setAttribute("stroke-dashoffset", RING_LENGTH * (1 - score / 100));
    }

    const weekBar = $(".week__day--current .week__bar-fill");
    if (weekBar) weekBar.style.width = `${score}%`;
  }

  /* ========================================================================
     7. Обработчики событий
     ====================================================================== */

  /* Ввод текста: обновляем день и сохраняем с задержкой, без перерисовки */
  const INPUT_HANDLERS = {
    improvement: (day, el) => (day.improvement = el.value),
    win: (day, el, index) => (day.wins[index] = el.value),
    "task-text": (day, el, index) => (day.tasks[index].text = el.value),
    "block-text": (day, el, index) => (day.schedule[index].text = el.value),
    "block-time": (day, el, index) => (day.schedule[index].time = el.value),
  };

  /* Переключатели и завершение ввода времени: сохраняем сразу и перерисовываем */
  const CHANGE_HANDLERS = {
    ritual: (day, el, index) => {
      const item = state.settings.ritual[index];
      day.ritualDone = el.checked
        ? [...new Set([...day.ritualDone, item])]
        : day.ritualDone.filter((done) => done !== item);
    },
    challenge: (day, el) => (day.challengeDone = el.checked),
    "task-done": (day, el, index) => (day.tasks[index].done = el.checked),
    "block-time": () => {}, // значение уже записано; нужна только пересортировка
  };

  appElement.addEventListener("input", (event) => {
    const el = event.target;
    const handler = INPUT_HANDLERS[el.dataset.field];
    if (!handler) return;

    handler(getDay(), el, Number(el.dataset.index));
    saveDay();
    refreshScore();
  });

  appElement.addEventListener("change", (event) => {
    const el = event.target;
    const handler = CHANGE_HANDLERS[el.dataset.field];
    if (!handler) return;

    handler(getDay(), el, Number(el.dataset.index));
    saveDay(state.currentDate, { immediately: true });
    renderApp();
  });

  /* Enter в поле задачи создаёт новую задачу под ней */
  appElement.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.target.dataset.field !== "task-text") return;

    event.preventDefault();
    const nextIndex = Number(event.target.dataset.index) + 1;
    getDay().tasks.splice(nextIndex, 0, { text: "", done: false });
    saveDay();
    renderApp();
    document.getElementById(`task-${nextIndex}`)?.focus();
  });

  /* Нажатия на кнопки: действие определяется по data-action */
  const CLICK_ACTIONS = {
    "shift-day": (button) => {
      state.currentDate = shiftDate(state.currentDate, Number(button.dataset.offset));
      renderApp();
    },

    "go-today": () => {
      state.currentDate = getTodayKey();
      renderApp();
    },

    "select-day": (button) => {
      state.currentDate = button.dataset.date;
      renderApp();
    },

    "change-counter": (button) => {
      const day = getDay();
      const key = button.dataset.counter;
      const step = Number(button.dataset.step);
      const [, , defaultTarget] = getRole().counters.find(([k]) => k === key);

      day.counts[key] = Math.max(0, (day.counts[key] || 0) + step);
      if (step > 0 && day.counts[key] === getTarget(key, defaultTarget)) {
        showToast("Цель по касаниям выполнена!");
      }
      saveDay();
      renderApp();
    },

    "add-block": () => {
      const day = getDay();
      day.schedule.push({ time: "", text: "" });
      saveDay();
      renderApp();
      document.getElementById(`block-time-${day.schedule.length - 1}`)?.focus();
    },

    "apply-template": () => {
      getDay().schedule = getRole().scheduleTemplate.map(([time, text]) => ({ time, text }));
      saveDay(state.currentDate, { immediately: true });
      renderApp();
    },

    "delete-block": (button) => {
      getDay().schedule.splice(Number(button.dataset.index), 1);
      saveDay(state.currentDate, { immediately: true });
      renderApp();
    },

    "add-task": () => {
      const day = getDay();
      day.tasks.push({ text: "", done: false });
      saveDay();
      renderApp();
      document.getElementById(`task-${day.tasks.length - 1}`)?.focus();
    },

    "delete-task": (button) => {
      getDay().tasks.splice(Number(button.dataset.index), 1);
      saveDay(state.currentDate, { immediately: true });
      renderApp();
    },

    "carry-over": carryOverUnfinishedTasks,

    "open-settings": openSettings,

    "timer-toggle": toggleTimer,

    "timer-reset": resetTimer,
  };

  appElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    CLICK_ACTIONS[button.dataset.action]?.(button);
  });

  /* Клик в любое место поля времени открывает окно выбора (а не только по иконке часов) */
  appElement.addEventListener("click", (event) => {
    const input = event.target;
    if (input.dataset?.field !== "block-time") return;

    try {
      input.showPicker();
    } catch (error) {
      /* Браузер не поддерживает showPicker — остаётся ввод с клавиатуры */
    }
  });

  /** Переносит незавершённые задачи на следующий день */
  function carryOverUnfinishedTasks() {
    const day = getDay();
    const nextDate = shiftDate(state.currentDate, 1);
    const nextDay = getDay(nextDate);

    const alreadyThere = new Set(nextDay.tasks.map((task) => task.text));
    const toCarry = day.tasks
      .filter((task) => task.text.trim() && !task.done)
      .map((task) => task.text.trim())
      .filter((text) => !alreadyThere.has(text));

    if (!toCarry.length) {
      showToast("Всё закрыто — переносить нечего");
      return;
    }

    nextDay.tasks.push(...toCarry.map((text) => ({ text, done: false })));
    saveDay(nextDate, { immediately: true });
    showToast(`Перенесено задач: ${toCarry.length}`);
  }

  /* ========================================================================
     8. Таймер фокус-сессий
     ====================================================================== */

  const timer = {
    mode: "focus", // "focus" | "break"
    secondsLeft: FOCUS_SECONDS,
    isRunning: false,
    endTime: 0,
    intervalId: null,
  };

  function getTimerButtonLabel() {
    if (timer.isRunning) return "Пауза";
    const fullDuration = timer.mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
    return timer.secondsLeft < fullDuration ? "Продолжить" : "Старт";
  }

  function renderTimer() {
    const element = $("#timer");
    if (!element) return;

    element.innerHTML = `
      <div>
        <div class="timer__mode">${timer.mode === "focus" ? "Фокус-сессия" : "Перерыв"}</div>
        <div class="timer__clock" id="timer-clock">${formatTimer(timer.secondsLeft)}</div>
      </div>
      <span class="timer__spacer"></span>
      <span class="timer__sessions">Сессий сегодня: <b class="timer__sessions-count">${getDay().focusSessions || 0}</b></span>
      <button class="timer__button" type="button" data-action="timer-toggle">${getTimerButtonLabel()}</button>
      <button class="timer__button timer__button--secondary" type="button" data-action="timer-reset">Сброс</button>`;
  }

  function toggleTimer() {
    if (timer.isRunning) {
      timer.isRunning = false;
      clearInterval(timer.intervalId);
    } else {
      timer.isRunning = true;
      timer.endTime = Date.now() + timer.secondsLeft * 1000;
      timer.intervalId = setInterval(tickTimer, 500);
    }
    renderTimer();
  }

  function resetTimer() {
    timer.isRunning = false;
    clearInterval(timer.intervalId);
    timer.mode = "focus";
    timer.secondsLeft = FOCUS_SECONDS;
    renderTimer();
  }

  function tickTimer() {
    timer.secondsLeft = Math.max(0, Math.round((timer.endTime - Date.now()) / 1000));

    const clock = $("#timer-clock");
    if (clock) clock.textContent = formatTimer(timer.secondsLeft);
    if (timer.secondsLeft > 0) return;

    clearInterval(timer.intervalId);
    timer.isRunning = false;
    playBeep();

    if (timer.mode === "focus") {
      const today = getDay(getTodayKey());
      today.focusSessions = (today.focusSessions || 0) + 1;
      saveDay(getTodayKey(), { immediately: true });

      timer.mode = "break";
      timer.secondsLeft = BREAK_SECONDS;
      showToast("25 минут фокуса. Встаньте и разомнитесь 5 минут.");
    } else {
      timer.mode = "focus";
      timer.secondsLeft = FOCUS_SECONDS;
      showToast("Перерыв окончен. Следующая сессия?");
    }
    renderTimer();
  }

  /** Три коротких сигнала по окончании сессии */
  function playBeep() {
    try {
      const audio = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach((offset) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const start = audio.currentTime + offset;

        oscillator.frequency.value = 880;
        oscillator.connect(gain);
        gain.connect(audio.destination);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        oscillator.start(start);
        oscillator.stop(start + 0.2);
      });
    } catch (error) {
      /* Звук недоступен — таймер всё равно работает */
    }
  }

  /* ========================================================================
     9. Окно настроек
     ====================================================================== */

  const settingsDialog = $("#settings-dialog");
  const settingsForm = $("#settings-form");
  let draftRole = DEFAULT_ROLE; // роль, выбранная в окне, но ещё не сохранённая

  function openSettings() {
    draftRole = state.settings.role;
    $("#settings-ritual").value = state.settings.ritual.join("\n");
    renderSettingsRole();
    settingsDialog.showModal();
  }

  /* Подсвечивает выбранную роль и показывает цели именно для неё */
  function renderSettingsRole() {
    $$("#settings-role button").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.role === draftRole);
    });

    $("#settings-targets").innerHTML = ROLES[draftRole].counters
      .map(([key, name, defaultTarget]) => {
        const savedTarget = state.settings.targets?.[`${draftRole}:${key}`];
        return `
          <label class="dialog__target" for="target-${key}">
            <span>${escapeHtml(name)}</span>
            <input class="input input--number" type="number" min="0" id="target-${key}" data-target="${key}" value="${savedTarget ?? defaultTarget}">
          </label>`;
      })
      .join("");
  }

  $$("#settings-role button").forEach((button) => {
    button.addEventListener("click", () => {
      draftRole = button.dataset.role;
      renderSettingsRole();
    });
  });

  $("#settings-cancel").addEventListener("click", () => settingsDialog.close());

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const ritual = $("#settings-ritual")
      .value.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, MAX_RITUAL_ITEMS);

    const targets = { ...(state.settings.targets || {}) };
    $$("[data-target]").forEach((input) => {
      const value = parseInt(input.value, 10);
      if (!Number.isNaN(value)) targets[`${draftRole}:${input.dataset.target}`] = value;
    });

    state.settings = {
      ...state.settings,
      role: draftRole,
      ritual: ritual.length ? ritual : [...DEFAULT_RITUAL],
      targets,
    };

    saveSettings();
    settingsDialog.close();
    renderApp();
    showToast("Настройки сохранены");
  });

  /* ========================================================================
     10. Уведомления
     ====================================================================== */

  let toastTimeoutId = null;

  function showToast(message) {
    let toast = $(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast toast--hidden";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove("toast--hidden");

    clearTimeout(toastTimeoutId);
    toastTimeoutId = setTimeout(
      () => toast.classList.add("toast--hidden"),
      TOAST_DURATION_MS,
    );
  }

  /* ========================================================================
     11. Запуск
     ====================================================================== */

  async function init() {
    renderApp(); // «Открываю ваш день…», пока читаем хранилище

    storage.clearLegacyData();

    const [savedSettings, savedDays] = await Promise.all([
      storage.loadSettings(),
      storage.loadDays(),
    ]);

    state.settings = { ...state.settings, ...(savedSettings || {}) };
    state.days = savedDays;
    state.isLoaded = true;

    renderApp();
  }

  init();
})();