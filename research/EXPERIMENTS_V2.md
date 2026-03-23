# EXPERIMENTS V2 (2–4 недели)

Дата: 2026-03-23

Цель: увеличить **реальную пользу + удержание + переход в регулярное использование** без манипулятивных паттернов.

---

## 0) Принципы экспериментов

- Эксперименты не должны повышать давление/стыд.
- Любая вариация должна сохранять baseline UX «микрошаг без перегруза».
- Основной фокус: не vanity metrics, а повторяемое полезное поведение.

---

## 1) North-star и набор метрик

### Core
- **Ritual Completion Rate** = completions / ritual starts
- **Next-day Return Rate** = users with start on day+1 after return intent
- **Active Days per User (7d)**
- **D7 proxy retention** (локально: активность на 7-й день окна)

### Guardrails
- Time to first ritual start
- Доля сессий с негативным energy delta
- Drop-off после первого экрана

---

## 2) Эксперименты

## EXP-01 — Context mode default prompt

**Гипотеза:** если до карточки шага спросить состояние («тяжело/отвлекаюсь/нужен заряд»), completion вырастет.  
**Варианты:**
- A: без явного prompt (текущий минимум)
- B: prompt с чипами до старта ритуала

**Primary:** Ritual Completion Rate  
**Guardrails:** Time to first start, bounce after activation  
**Срок:** 5–7 дней  
**Уверенность:** High

---

## EXP-02 — If-then anchors friction

**Гипотеза:** авто-подсветка якорей сразу после completion повысит конверсию в return intent.  
**Варианты:**
- A: якоря в блоке «завтра» без подсветки
- B: автоскролл + мягкий prompt «выбери якорь (10 сек)»

**Primary:** Return Intent Capture Rate  
**Secondary:** Next-day Return Rate  
**Срок:** 7 дней  
**Уверенность:** High

---

## EXP-03 — Energy tracking friction

**Гипотеза:** автосохранение значения «после» (с undo) повысит заполненность данных без ухудшения UX.  
**Варианты:**
- A: ручной save after
- B: autosave after completion + undo

**Primary:** Energy After Save Rate  
**Guardrails:** Ошибочные сохранения, жалобы в feedback  
**Срок:** 5 дней  
**Уверенность:** Medium

---

## EXP-04 — Completion recap framing

**Гипотеза:** короткий recap «что уже сделал(а) сегодня + что дальше» повышает возврат завтра.  
**Варианты:**
- A: стандартная reward-фраза
- B: reward + 1 строка практического итога

**Primary:** Next-day Return Rate  
**Secondary:** Return Intent Rate  
**Срок:** 7 дней  
**Уверенность:** Medium

---

## EXP-05 — Gentle mode for burnout profile

**Гипотеза:** у пользователей с пропусками 2+ дней gentle copy снижает повторные отказы.  
**Варианты:**
- A: стандартная copy
- B: gentle mode (меньше streak, больше «достаточно 1 шага»)

**Primary:** Re-entry Success Rate  
**Secondary:** 7-day survival after re-entry  
**Срок:** 2 недели  
**Уверенность:** Medium

---

## EXP-06 — Resume after interruption

**Гипотеза:** кнопка «продолжить 20 сек» после прерывания таймера уменьшит потери внутри ритуала.  
**Варианты:**
- A: стандартный restart
- B: resume CTA с коротким таймером

**Primary:** Interrupt Recovery Rate  
**Guardrails:** false completions, UX confusion  
**Срок:** 1–2 недели  
**Уверенность:** Medium

---

## EXP-07 — Weekly benefit card

**Гипотеза:** недельная карточка пользы повышает perceived value и мотивацию к регулярности.  
**Варианты:**
- A: только дневной экран
- B: дневной + weekly card (локальная)

**Primary:** Active Days/User (7d)  
**Secondary:** voluntary shares  
**Срок:** 2 недели  
**Уверенность:** Medium

---

## EXP-08 — Ethical share CTA

**Гипотеза:** мягкий share CTA после 4+ активных дней даёт органический рост без ухудшения retention.  
**Варианты:**
- A: no share CTA
- B: share CTA «поделиться своим рабочим микро-ритмом»

**Primary:** Share Rate, Referral Starts  
**Guardrails:** D7 retention, UX fatigue  
**Срок:** 2 недели  
**Уверенность:** Low-Medium

---

## 3) План на 4 недели

### Неделя 1
- EXP-01, EXP-02, EXP-03 (быстрые low-risk тесты)

### Неделя 2
- EXP-04, EXP-05

### Неделя 3
- EXP-06, EXP-07

### Неделя 4
- EXP-08 + consolidation (перенос победителей в baseline)

---

## 4) Instrumentation (минимум)

Добавить/использовать события:
- `action_mode_set` (уже добавлено)
- `plan_anchor_set` (уже добавлено)
- `return_intent_set` c source
- `mini_ritual_start`, `mini_ritual_complete`
- `energy_after_saved` (+ признак auto/manual)
- `resume_used` (когда будет реализовано)
- `weekly_card_viewed`, `weekly_card_shared` (когда будет реализовано)

---

## 5) Stop / Go критерии

**Go**: primary metric +10% и выше, guardrails стабильны.  
**Iterate**: +3–10% или mixed effects.  
**Stop**: нет эффекта или ухудшение guardrails >5%.

---

## 6) Примечание по достоверности

Эксперименты EX-01/02 ближе к подтверждённой поведенческой базе (implementation intentions, снижение выбора).  
EX-07/08 имеют более высокий продуктовый риск и должны запускаться после стабилизации core retention loop.
