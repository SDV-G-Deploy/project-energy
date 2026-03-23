# METRICS V1 (без бэкенда)

Дата: 2026-03-23

Цель: измерять базовую продуктовую воронку локально, пока нет сервера.

---

## 1) Activation

**Определение:** пользователь нажал `Польза в 1 клик` хотя бы 1 раз.

**Локальный сигнал:** событие `activation` в localStorage.

**Формула (на устройстве):**
- `activation_rate_local = users_activated / users_opened`
- На одном устройстве без user-id используем proxy:
  - `activation_sessions / total_sessions`

---

## 2) Time-to-first-value (TTFV)

**Определение:** время от загрузки страницы до первого видимого результата (рост старта/прогресса).

**Локальный сигнал:**
- `session_start_ts`
- `first_value_ts` (в момент клика CTA и обновления UI)

**Формула:**
- `ttfv_ms = first_value_ts - session_start_ts`

**Цель V1:** median TTFV ≤ 15 000 мс.

---

## 3) Completion mini-ritual

**Определение:** пользователь завершил карточку `Сделай сейчас (60 сек)`.

**Локальный сигнал:** событие `mini_ritual_complete`.

**Формулы:**
- `completion_rate = mini_ritual_complete / activation`
- `same_session_completion_rate = completions_same_session / activation`

---

## 4) Return intent

**Определение:** пользователь явно отметил «вернусь завтра на 1 шаг».

**Локальный сигнал:** событие `return_intent_set`.

**Формула:**
- `return_intent_rate = return_intent_set / mini_ritual_complete`

---

## 5) Day-1 proxy (без бэкенда)

Поскольку нет серверных пользователей и кросс-девайс ID, используем proxy:

**Day-1 proxy hit = true**, если:
1. сегодня зафиксирован activation/completion,
2. и на следующий календарный день на этом же устройстве есть новый `activation`.

**Локальный сигнал:** сравнение дат событий в localStorage.

**Формула:**
- `day1_proxy_rate = day1_proxy_hits / day1_proxy_eligible`

---

## 6) События, которые логируем локально

- `session_start`
- `activation`
- `mini_ritual_start`
- `mini_ritual_complete`
- `energy_before_saved`
- `energy_after_saved`
- `return_intent_set`
- `reentry_shown`

Каждое событие хранит:
- `type`
- `timestamp`
- `date`
- `meta` (id шага, длительность, дельта энергии и т.д.)

---

## 7) Где хранить

- `localStorage['project-energy-state-v2']` — пользовательское состояние.
- `localStorage['project-energy-metrics-v1']` — агрегаты + event log.

**Принцип приватности V1:** ничего не отправляется на сервер.

---

## 8) Ограничения V1

- Нет дедупликации пользователей.
- Нет кросс-устройства.
- Очистка браузера обнуляет метрики.

Это нормально для pre-MVP: цель — быстро проверить продуктовые гипотезы локально.

---

## 9) Готовность к V2 (с бэкендом)

Когда появится бэкенд, переносим события 1:1, добавляем:
- anonymous user id,
- session id,
- timestamp server-side,
- cohort/day retention отчёты.
