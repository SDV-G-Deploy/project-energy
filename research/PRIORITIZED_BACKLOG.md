# PRIORITIZED BACKLOG — Project Energy V2

Дата: 2026-03-23

> Приоритизация учитывает: ожидаемый вклад в реальную пользу + удержание + конверсию в регулярное использование.

| ID | Инициатива | Horizon | Priority | Effort | Ожидаемый эффект | Ключевая метрика | Confidence | Hypothesis | Зависимости |
|---|---|---|---|---|---|---|---|---|---|
| B-01 | Режим выбора шага по состоянию (Любой/Тяжело/Отвлекаюсь/Заряд) | Quick Win | P0 | S | Рост релевантности шага и completion | Ritual Completion Rate | High | No | Внедрено |
| B-02 | If-then якоря на завтра (после X) | Quick Win | P0 | S | Рост next-day return | Return Intent → Next-day Start | High | No | Внедрено |
| B-03 | Мини-онбординг «1 шаг = успех» (30 сек) | Quick Win | P0 | S | Рост D1/D3 удержания новичков | D1 active, D3 active | High | Yes | Copy + 1 экран |
| B-04 | Автосохранение energy-after с undo | Quick Win | P0 | S | Меньше фрикции трекинга | Energy After Save Rate | Medium | Yes | UI + event |
| B-05 | Короткий recap после completion («что это дало») | Quick Win | P0 | S | Рост perceived utility | Completion-to-Return conversion | Medium | Yes | Copy/logic |
| B-06 | Gentle mode для выгорания (меньше streak-давления) | Quick Win | P1 | S | Меньше churn после пропусков | Re-entry Success Rate | Medium | Yes | Toggle + copy |
| B-07 | Resume flow после прерывания (20 сек) | Mid-term | P0 | M | Снижение потерь внутри ритуала | Interrupt Recovery Rate | Medium | Yes | Timer state machine |
| B-08 | Weekly benefit view (7-дневный тренд) | Mid-term | P0 | M | Видимость накопленной пользы | WAU/MAU, D7 proxy | High | Yes | Metrics aggregation |
| B-09 | Ранжирование шагов по личному отклику | Mid-term | P1 | M | Более стабильный energy uplift | Avg Energy Delta/User | Medium | Yes | Local scoring model |
| B-10 | Локальные reminder windows по выбранному якорю | Mid-term | P1 | M | Рост регулярности | Active Days/User (7d) | Medium | Yes | Permission + scheduling |
| B-11 | Segment presets (офис/родитель/смены) | Mid-term | P1 | M | Выше релевантность и доверие | Segment completion uplift | Medium | Yes | Content packs |
| B-12 | Consistency Score (без штрафов) | Mid-term | P1 | S | Смещение фокуса с очков на ритм | 4+/7 active days share | Medium | Yes | Metrics UI |
| B-13 | Auto-next suggestion (второй опциональный шаг) | Mid-term | P2 | M | Рост глубины сессии | Avg Rituals/Active Day | Medium | Yes | Completion flow |
| B-14 | JITAI-lite rule engine | Product Leap | P1 | L | Персонализированные своевременные интервенции | D14 retention, streak stability | Medium | Yes | Signals model |
| B-15 | Shareable weekly insight card | Product Leap | P2 | M | Ethical virality | Shares/WAU, Referral starts | Medium | Yes | Weekly insights |
| B-16 | Buddy accountability (без leaderboard pressure) | Product Leap | P2 | L | Соц. поддержка и возвраты | Buddy retention uplift | Medium | Yes | Identity + privacy |
| B-17 | Персональные 14/28-дневные протоколы | Product Leap | P1 | L | Рост utility и монетизации | Protocol completion, Paid conversion | High | Yes | Content engine |
| B-18 | Ethical premium layer (advanced analytics + protocols) | Product Leap | P2 | L | Revenue без агрессивной манипуляции | Trial→Paid, Paid 30d retention | Medium | Yes | Billing + entitlements |

---

## Порядок внедрения (рекомендуемый)

### Sprint A (1 неделя)
- B-01, B-02 (уже внедрены), B-03, B-04, B-05.

### Sprint B (1 неделя)
- B-06, B-07, B-08.

### Sprint C (2 недели)
- B-09, B-10, B-11, B-12.

### Далее (3–6 недель)
- B-14, B-15, B-16, B-17, B-18.

---

## Definition of Done для P0

Инициатива считается успешной, если одновременно:
1. Primary metric улучшена минимум на **+10%** относительно baseline;  
2. Нет деградации guardrail-метрик (time-to-start, completion drop, negative delta spikes);  
3. Нулевая регрессия по UX (no broken flow на mobile).
