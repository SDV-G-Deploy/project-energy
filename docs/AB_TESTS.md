# A/B тесты — Sprint-2 (локально, без бэкенда)

## Где хранятся данные

Ключ `localStorage`:

- `project-energy-experiments-v1`

Структура:

```json
{
  "version": 1,
  "assignments": {
    "hero_headline_v1": "A",
    "hero_cta_copy_v1": "B"
  },
  "exposures": {
    "hero_headline_v1:A": 1760000000000,
    "hero_cta_copy_v1:B": 1760000000500
  },
  "goals": [
    {
      "goalType": "ritual_start",
      "timestamp": 1760000001200,
      "date": "2026-03-23",
      "assignments": {
        "hero_headline_v1": "A",
        "hero_cta_copy_v1": "B"
      },
      "meta": {
        "actionId": "R-01",
        "mode": "recovery"
      }
    }
  ]
}
```

---

## Активные эксперименты

## 1) `hero_headline_v1`

**Цель:** увеличить долю пользователей, которые после первого экрана доходят до запуска ритуала.

- Вариант A: `Анти-прокрастинационный reset за 60 секунд`
- Вариант B: `1 микрошаг — и ты снова в ритме за 60 секунд`

## 2) `hero_cta_copy_v1`

**Цель:** увеличить CTR основного CTA на Hero.

- Вариант A: `⚡ Запустить reset за 60 сек`
- Вариант B: `⚡ Начать 1 микрошаг сейчас`

---

## Assignment и стабильность

- Variant назначается один раз и сохраняется локально.
- При повторных визитах пользователь остаётся в том же варианте.
- Никакой серверной рандомизации или внешней отправки нет.

---

## События аналитики

События пишутся в `project-energy-metrics-v1.events`:

- `experiment_exposure`
  - когда пользователь впервые попал в конкретный variant
- `experiment_goal`
  - когда наступила цель:
    - `ritual_start`
    - `ritual_complete`

`meta` у `experiment_goal` содержит `assignments` для корректного локального анализа.

---

## Как посмотреть данные вручную

В DevTools Console:

```js
JSON.parse(localStorage.getItem('project-energy-experiments-v1'))
JSON.parse(localStorage.getItem('project-energy-metrics-v1'))
```

Если нужно сбросить только A/B assignment:

```js
localStorage.removeItem('project-energy-experiments-v1')
location.reload()
```

---

## Основные метрики (первый приоритет)

1. `hero_cta_click / experiment_exposure` по variant
2. `ritual_start / experiment_exposure` по variant
3. `ritual_complete / experiment_exposure` по variant
4. Доля `ritual_complete / ritual_start` по variant
