# PROJECT ENERGY

Micro-product версия лендинга: **«польза в 1 клик»** для людей с низким порогом начала, перегрузом и частыми отвлечениями.

## Что нового в продуктовой версии

Теперь это не статичный landing, а рабочая воронка:

1. **One-click CTA** `⚡ Польза в 1 клик`
2. **Мгновенный результат** после нажатия: +1 старт, рост progress ring, поддерживающий feedback
3. **Карточка «Сделай сейчас (60 сек)»** с рандомным микрошагом из безопасного набора
4. **Супер-простой трекер энергии до/после (1–5)**
5. **Локальное сохранение прогресса и метрик** (`localStorage`)
6. **Мягкий re-entry** после пропуска дней (без стыда)
7. **Мини-геймификация без токсичного давления**: XP, серия, прогресс-кольцо, мягкие награды

## Стек

- HTML5
- CSS3 (mobile-first)
- Vanilla JavaScript (без тяжелых зависимостей)

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

- `project-energy-state-v2` — прогресс пользователя
- `project-energy-metrics-v1` — события и агрегаты метрик

Данные в V1 никуда не отправляются (только устройство пользователя).

## Исследование и продуктовые решения

Смотри:
- `research/PRODUCT_USABILITY_RESEARCH.md`
- `research/FUNNEL_V2.md`
- `research/METRICS_V1.md`
- `research/UX_A11Y_CHECKLIST.md`

## Важно

PROJECT ENERGY — образовательный wellness-инструмент, не медицинская рекомендация.
