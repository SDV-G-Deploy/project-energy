# PROJECT ENERGY

Micro-product версия лендинга: **«польза в 1 клик»** для людей с низким порогом начала, перегрузом и частыми отвлечениями.

## Что нового в продуктовой версии

Теперь это не статичный landing, а рабочая воронка:

1. **Outcome-first Hero**: `⚡ Запустить reset за 60 сек` (анти-прокрастинационный вход в действие)
2. **3 сценарных CTA в Hero**: `Тяжело начать` / `Расфокус` / `Упадок энергии`
3. **Trust-блок**: кому подходит, кому не подходит, mini-proof и короткий FAQ
4. **Мини-онбординг 30 секунд (first visit)**
   - компактный flow с ценностью, механикой one-click и результатом за 60 сек;
   - кнопки: **«Начать сейчас»** и **«Пропустить»**;
   - авто-показ только на первом визите + ручной повторный вызов через **«Как это работает?»**.
5. **Мгновенный результат** после нажатия: +1 старт, рост progress ring, поддерживающий feedback
6. **Карточка «Сделай сейчас (60 сек)»** с рандомным микрошагом из безопасного набора
7. **Completion recap после «Отметить выполненным»**
   - что именно сделано;
   - сколько шагов уже закрыто сегодня;
   - изменение энергии (если есть `до/после`);
   - next best action + подсказка, когда вернуться;
   - post-action кнопки: **«Сделать ещё один сейчас»** и **«Выбрать когда вернуться»**.
8. **Супер-простой трекер энергии до/после (1–5)**
9. **Weekly benefit view «Моя неделя» (локально, без бэкенда)**
   - выполнено за 7 дней;
   - активные дни;
   - средняя энергия `до/после` при достаточных данных;
   - короткий инсайт по текущей динамике + empty state для новых пользователей.
10. **Локальное сохранение прогресса и метрик** (`localStorage`)
11. **Мягкий re-entry** после пропуска дней (без стыда)
12. **Мультивыполнение микрошагов в один день**: цикл «Другой микрошаг → Сделай сейчас → Отметить выполненным» можно повторять без лимита; на дашборде есть счётчик **«Выполнено сегодня»**

## Sprint-2 (Lead capture · Reactivation · A/B)

### 1) Lead capture (P1)

- Добавлен лёгкий блок **«Поддерживать ритм: 1 микрошаг в день»**.
- Пользователь может оставить **Telegram handle и/или email** (минимум один канал).
- Явное согласие: чекбокс на локальное сохранение контакта.
- UX-состояния в интерфейсе:
  - `success` — контакт и consent сохранены локально,
  - `invalid` — невалидные данные / нет согласия / нет канала,
  - `skip` — пользователь пропустил без давления.
- Никаких внешних отправок: только `localStorage`.

### 2) Реактивация D1 / D3 / D7 (in-app)

- Добавлен блок **«Вернуться в ритм»** с мягкими триггерами:
  - `D1` — нет completion 1 день,
  - `D3` — нет completion 3 дня,
  - `D7` — нет completion 7+ дней.
- В блоке показывается персонализированная рекомендация:
  - на основе последнего completion,
  - с учётом последнего выбранного якоря/intent (если был).
- Без внешних push-уведомлений: только внутри продукта.
- Тексты шаблонов: `docs/REACTIVATION_COPY.md`.

### 3) A/B тесты (минимальный каркас)

- Добавлен стабильный assignment вариантов в `localStorage` (без бэкенда).
- Активные эксперименты:
  1. `hero_headline_v1` — вариант заголовка Hero (A/B)
  2. `hero_cta_copy_v1` — вариант primary CTA (A/B)
- Единый helper в `app.js`:
  - выдаёт вариант эксперимента,
  - логирует exposure,
  - фиксирует goal-события на `ritual_start` и `ritual_complete`.
- Документация: `docs/AB_TESTS.md`.

## Стек

- HTML5
- CSS3 (mobile-first)
- Vanilla JavaScript (без тяжелых зависимостей)

## Как работают новые блоки (Sprint-1 / P0 quick wins)

### 1) Outcome-first Hero + сценарные CTA

- Hero отвечает на вопрос «что получу сейчас»: короткий reset за 60 секунд.
- Есть 3 быстрых сценария старта по состоянию:
  - **Тяжело начать** → recovery-подбор шага,
  - **Расфокус** → environment-подбор шага,
  - **Упадок энергии** → nutrition-подбор шага.
- Сценарные кнопки не ломают текущую механику: используются те же режимы `todayActionMode` и тот же ритуал.

### 2) Trust-блок

- Явно обозначены рамки: **кому подходит / не подходит**.
- Добавлены mini-proof элементы (локальные цифры по TTFV, стартам и completion).
- Короткий FAQ снижает сомнения до первого действия.

### 3) Мини-онбординг 30 секунд

- Появляется автоматически только при первом визите (`state.onboardingSeen = false`).
- Содержит 3 короткие тезиса: что это, как работает one-click, что будет за 60 секунд.
- Кнопка **«Начать сейчас»** сразу переводит пользователя в стартовый шаг.
- Кнопка **«Пропустить»** закрывает блок без давления.
- В любой момент можно открыть снова кнопкой **«Как это работает?»**.

### 4) Completion recap

После завершения микрошага показывается лаконичный recap-блок с:
- выполненным действием,
- количеством завершений за сегодня,
- динамикой энергии (если сохранены `до/после`),
- мягким следующим шагом.

Кнопка **«Сделать ещё один»**:
- выбирает следующий микрошаг,
- сразу запускает новый 60-секундный цикл,
- не использует модальные окна.

### 5) Weekly benefit view «Моя неделя»

Блок агрегирует локальные данные за последние 7 дней:
- общее число выполненных микрошагов,
- число активных дней,
- среднюю энергию `до/после` (если данных достаточно),
- короткий инсайт по текущему паттерну.

Если данных пока мало — показывается мягкий empty state (без «ошибок» и без давления).

## Локальный запуск

> Рекомендуется запускать через локальный сервер (для загрузки JSON/MD контента).

```bash
cd project-energy
python3 -m http.server 8080
```

Открой: `http://localhost:8080`

## Структура проекта

```text
project-energy/
├── index.html
├── styles.css
├── app.js
├── content/
│   ├── micro-actions.json
│   ├── rewards-copy.json
│   ├── reentry-copy.md
│   ├── energy-practices.json
│   ├── faq.md
│   └── disclaimer.md
├── docs/
│   ├── SPRINT1_PLAN.md
│   ├── AB_TESTS.md
│   └── REACTIVATION_COPY.md
└── research/
    ├── PRODUCT_USABILITY_RESEARCH.md
    ├── FUNNEL_V2.md
    ├── METRICS_V1.md
    ├── UX_A11Y_CHECKLIST.md
    └── ENERGY_EVIDENCE_REPORT.md
```

## Формат данных JSON

## `content/micro-actions.json`

```json
{
  "actions": [
    {
      "id": "R-01",
      "pillar": "recovery",
      "pillarLabel": "Восстановление",
      "title": "Дыхание 4/6 (1 минута)",
      "durationSec": 60,
      "instructions": ["...", "..."],
      "why": "...",
      "evidence": "High|Medium|Low"
    }
  ]
}
```

## `content/rewards-copy.json`

```json
{
  "activation": ["..."],
  "completion": ["..."],
  "energyLift": ["..."],
  "streak": ["..."],
  "reentry": ["..."]
}
```

## `content/reentry-copy.md`

- Bulleted фразы (`- ...`) автоматически парсятся и используются как сообщения мягкого возврата.

## Как расширять практики

1. Добавь новый объект в `micro-actions.json`.
2. Держи длительность в диапазоне **30–90 сек**.
3. Формулируй шаг как **1 конкретное действие**.
4. Для спорных практик помечай низкую уверенность (`evidence: "Low"`) и добавляй safety-note.
5. Избегай рискованных «быстрых хаков» и токсичного давления.

## Локальные ключи состояния

- `project-energy-state-v2` — основной прогресс пользователя и UI-состояние.
  - Sprint-1 поля:
    - `onboardingSeen`, `onboardingSeenAt`, `onboardingDismissedAt`, `onboardingLastOpenedAt`
    - `lastCompletionRecap`
    - `completionHistory`
  - Sprint-2 поля:
    - `leadCapture`:
      - `status` (`idle|invalid|success|skip`)
      - `consent` (boolean)
      - `consentTimestamp`
      - `submittedAt` / `skippedAt`
      - `contact.telegram` / `contact.email`
    - `reactivation`:
      - `lastShownKey`, `lastShownAt`, `lastStage`
      - `dismissedDate`, `dismissedAt`
      - `lastAction`, `lastActionAt`
    - `lastReturnIntentDate`, `lastReturnIntentAnchor`
- `project-energy-metrics-v1` — события и агрегаты метрик (локальный analytics event log).
- `project-energy-experiments-v1` — assignment/экспозиции/goal-логи A/B тестов:
  - `assignments` (стабильный variant per experiment)
  - `exposures` (когда был показан experiment)
  - `goals` (ритуальные goal-события с snapshot assignments)

Все новые поля добавлены с **обратной совместимостью**: старые сохранённые состояния корректно мержатся с дефолтами.

Данные никуда не отправляются (только устройство пользователя).

## Событийная аналитика Sprint-1 (локально)

### Унифицированные события (без бэкенда)

**Базовая воронка**
- `hero_cta_click` — клик по hero-CTA (primary или сценарный)
- `ritual_start` — запуск 60-секундного ритуала
- `ritual_complete` — завершение ритуала
- `post_action_click` — клик по post-completion действию (например, `do_another_cycle`, `plan_return`)

**Lead capture (Sprint-2)**
- `lead_capture_view` — первый показ capture-блока после первой пользы
- `lead_capture_submit` — попытка submit (meta содержит `status: success|invalid`)
- `lead_capture_skip` — пользователь пропустил блок

**Reactivation D1/D3/D7 (Sprint-2)**
- `reactivation_prompt_shown` — показ in-app подсказки возврата
- `reactivation_prompt_action` — действие в промпте (`start_now` / `snooze_today`)

**A/B experiments (Sprint-2)**
- `experiment_exposure` — экспозиция пользователя в варианте эксперимента
- `experiment_goal` — целевое событие (на `ritual_start` или `ritual_complete`) с snapshot assignments

### Схема события

```json
{
  "type": "hero_cta_click",
  "timestamp": 1760000000000,
  "date": "2026-03-23",
  "meta": {
    "source": "hero_primary",
    "mode": "recovery",
    "todayCompletions": 1
  }
}
```

Хранение: `localStorage['project-energy-metrics-v1'].events[]`.

## Исследование и продуктовые решения

Смотри:
- `research/PRODUCT_USABILITY_RESEARCH.md`
- `research/FUNNEL_V2.md`
- `research/METRICS_V1.md`
- `research/UX_A11Y_CHECKLIST.md`

## Важно

PROJECT ENERGY — образовательный wellness-инструмент, не медицинская рекомендация.
