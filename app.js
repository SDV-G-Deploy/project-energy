(() => {
  'use strict';

  const STORAGE_KEY = 'project-energy-state-v2';
  const METRICS_KEY = 'project-energy-metrics-v1';
  const SESSION_KEY = 'project-energy-session-v1';
  const sessionStartTs = Date.now();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FALLBACK_ACTIONS = {
    actions: [
      {
        id: 'F-01',
        pillar: 'recovery',
        pillarLabel: 'Восстановление',
        title: 'Дыхание 4/6 (1 минута)',
        durationSec: 60,
        instructions: ['Вдох на 4 счёта.', 'Выдох на 6 счётов.', 'Повтори 5 циклов.'],
        why: 'Снижает напряжение и помогает начать с малого.',
        evidence: 'Medium',
      },
      {
        id: 'F-02',
        pillar: 'environment',
        pillarLabel: 'Среда',
        title: '60 секунд дневного света',
        durationSec: 60,
        instructions: ['Подойди к окну или выйди на свет.', 'Сделай 3 спокойных вдоха.', 'Вернись к задаче.'],
        why: 'Короткий световой сигнал поддерживает бодрость.',
        evidence: 'High',
      },
      {
        id: 'F-03',
        pillar: 'nutrition',
        pillarLabel: 'Питание',
        title: '3 спокойных глотка воды',
        durationSec: 45,
        instructions: ['Налей воду.', 'Сделай 3 медленных глотка.', 'Оставь стакан рядом.'],
        why: 'Мягкая гидратация = меньше ощущения «разряженности».',
        evidence: 'High',
      },
    ],
  };

  const FALLBACK_REWARDS = {
    activation: [
      'Старт есть. Ты уже в игре.',
      'Первый шаг сделан — это главное.',
      'Микродействие > идеальный план.',
    ],
    completion: [
      'Готово. Маленький шаг, но настоящий.',
      'Отмечено. Отличная микропобеда.',
      'Ритуал закрыт. Хороший темп.',
    ],
    energyLift: ['Есть плюс к энергии — держим мягкий ритм.'],
    streak: ['Серия растёт без давления.'],
    reentry: ['Паузы нормальны. Возвращаемся с одного шага.'],
  };

  const FALLBACK_REENTRY = [
    'Пауза — это не провал. Возвращаемся с одного микрошагa.',
    'Ничего не сломано. Твой ритм можно перезапустить мягко.',
    'Без вины и без стыда: один короткий шаг сейчас.',
  ];

  const DEFAULT_STATE = {
    version: 2,
    startsTotal: 0,
    startsToday: 0,
    todayCompletions: 0,
    xp: 0,
    streak: 0,
    completedDays: 0,
    progress: 0,
    todayDate: null,
    todayActionId: null,
    todayCompleted: false,
    todayEnergyBefore: null,
    todayEnergyAfter: null,
    todayReturnIntent: false,
    lastVisitDate: null,
    lastStartDate: null,
    lastCompletionDate: null,
    firstActivationAt: null,
    firstValueMs: null,
    lastReward: '',
    ritualStartedAt: null,
    ritualDurationSec: null,
    reentryMessageSeenDate: null,
    energyHistory: [],
  };

  const DEFAULT_METRICS = {
    version: 1,
    activationCount: 0,
    miniRitualCompletions: 0,
    returnIntentCount: 0,
    firstActivationTs: null,
    firstValueMs: null,
    activationDates: [],
    day1ProxyEligible: 0,
    day1ProxyHits: 0,
    events: [],
  };

  const MAX_EVENTS = 300;

  let state = loadFromStorage(STORAGE_KEY, DEFAULT_STATE);
  let metrics = loadFromStorage(METRICS_KEY, DEFAULT_METRICS);

  let today = getLocalISODate();
  let session = loadSessionState();
  let actions = FALLBACK_ACTIONS.actions.slice();
  let rewards = { ...FALLBACK_REWARDS };
  let reentryMessages = FALLBACK_REENTRY.slice();

  let timerInterval = null;
  let timerEndsAt = null;

  const refs = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheRefs();

    const previousVisitDate = state.lastVisitDate;
    const previousCompletionDate = state.lastCompletionDate;
    const skippedDays = calculateSkippedDays(previousVisitDate, previousCompletionDate, today);

    state = rolloverStateForToday(state, today);
    session = resetSessionForToday(session, today);
    saveState();
    saveSessionState();

    const [actionsData, rewardsData, reentryText] = await Promise.all([
      loadJson('content/micro-actions.json', FALLBACK_ACTIONS),
      loadJson('content/rewards-copy.json', FALLBACK_REWARDS),
      loadText('content/reentry-copy.md', ''),
    ]);

    actions = sanitizeActions(actionsData?.actions);
    if (!actions.length) {
      actions = FALLBACK_ACTIONS.actions.slice();
    }

    rewards = normalizeRewards(rewardsData);

    const parsedReentry = parseMarkdownBullets(reentryText);
    if (parsedReentry.length) {
      reentryMessages = parsedReentry;
    }

    ensureTodayAction();
    bindEvents();
    restoreRitualProgressAfterReload();
    trackEvent('session_start', { date: today, skippedDays, sessionCompletions: session.completions });

    if (skippedDays > 0 && state.reentryMessageSeenDate !== today) {
      showReentryMessage(skippedDays);
      trackEvent('reentry_shown', { skippedDays });
      state.reentryMessageSeenDate = today;
      saveState();
    } else {
      hideReentryMessage();
    }

    renderAll();
    exposeDebug();
  }

  function cacheRefs() {
    refs.oneClickBtn = document.getElementById('one-click-cta');
    refs.startsValue = document.getElementById('starts-value');
    refs.completionsTodayValue = document.getElementById('completions-today-value');
    refs.xpValue = document.getElementById('xp-value');
    refs.streakValue = document.getElementById('streak-value');
    refs.progressLabel = document.getElementById('progress-label');
    refs.progressCircle = document.getElementById('progress-circle');
    refs.statusChip = document.getElementById('status-chip');
    refs.rewardLine = document.getElementById('reward-line');

    refs.ritualSection = document.getElementById('ritual-section');
    refs.actionPillar = document.getElementById('action-pillar');
    refs.actionTitle = document.getElementById('action-title');
    refs.actionWhy = document.getElementById('action-why');
    refs.actionSteps = document.getElementById('action-steps');
    refs.actionDuration = document.getElementById('action-duration');
    refs.actionEvidence = document.getElementById('action-evidence');

    refs.ritualStartBtn = document.getElementById('ritual-start-btn');
    refs.ritualCompleteBtn = document.getElementById('ritual-complete-btn');
    refs.actionShuffleBtn = document.getElementById('action-shuffle-btn');

    refs.timerWrap = document.getElementById('timer-wrap');
    refs.timerFill = document.getElementById('timer-fill');
    refs.timerText = document.getElementById('timer-text');

    refs.energyBefore = document.getElementById('energy-before');
    refs.energyAfter = document.getElementById('energy-after');
    refs.energyBeforeValue = document.getElementById('energy-before-value');
    refs.energyAfterValue = document.getElementById('energy-after-value');
    refs.saveBeforeBtn = document.getElementById('save-before-btn');
    refs.saveAfterBtn = document.getElementById('save-after-btn');
    refs.energyFeedback = document.getElementById('energy-feedback');

    refs.tomorrowStep = document.getElementById('tomorrow-step');
    refs.returnIntentBtn = document.getElementById('return-intent-btn');
    refs.returnIntentStatus = document.getElementById('return-intent-status');

    refs.reentryCard = document.getElementById('reentry-card');
    refs.reentryText = document.getElementById('reentry-text');
    refs.reentryBtn = document.getElementById('reentry-btn');

    refs.exportMetricsBtn = document.getElementById('export-metrics-btn');
    refs.toast = document.getElementById('toast');
  }

  function bindEvents() {
    refs.oneClickBtn?.addEventListener('click', handleActivationClick);
    refs.ritualStartBtn?.addEventListener('click', handleRitualStart);
    refs.ritualCompleteBtn?.addEventListener('click', () => completeRitual(false));
    refs.actionShuffleBtn?.addEventListener('click', () => {
      switchAction();
      renderAll();
    });

    refs.energyBefore?.addEventListener('input', () => {
      refs.energyBeforeValue.textContent = refs.energyBefore.value;
    });

    refs.energyAfter?.addEventListener('input', () => {
      refs.energyAfterValue.textContent = refs.energyAfter.value;
    });

    refs.saveBeforeBtn?.addEventListener('click', saveEnergyBefore);
    refs.saveAfterBtn?.addEventListener('click', saveEnergyAfter);

    refs.returnIntentBtn?.addEventListener('click', setReturnIntent);
    refs.reentryBtn?.addEventListener('click', handleReentryRestart);
    refs.exportMetricsBtn?.addEventListener('click', exportMetrics);
  }

  function handleActivationClick() {
    syncTodayState();

    const firstStartToday = state.startsToday === 0;

    state.startsToday += 1;
    state.startsTotal += 1;
    state.lastStartDate = today;
    state.xp += firstStartToday ? 5 : 2;

    if (!state.firstActivationAt) {
      state.firstActivationAt = Date.now();
    }

    if (!state.firstValueMs) {
      state.firstValueMs = Date.now() - sessionStartTs;
    }

    if (!metrics.firstActivationTs) {
      metrics.firstActivationTs = Date.now();
    }

    if (!metrics.firstValueMs) {
      metrics.firstValueMs = Date.now() - sessionStartTs;
    }

    registerActivationDay(today);

    ensureTodayAction();
    state.progress = computeProgress(state);

    const phrase = pickReward('activation');
    const message = `${phrase} +1 старт · прогресс ${state.progress}%`;
    state.lastReward = message;

    trackEvent('activation', { firstStartToday, startsToday: state.startsToday, progress: state.progress });

    saveAll();
    renderAll();
    revealRitualSection();
    announce(message);
  }

  function handleRitualStart() {
    syncTodayState();

    if (state.startsToday < 1) {
      announce('Сначала нажми «Польза в 1 клик». Это занимает секунду.');
      refs.oneClickBtn?.focus();
      return;
    }

    if (hasRitualProgress()) {
      if (isRitualRunning()) {
        announce('Таймер уже запущен. Можно завершить шаг или выбрать другой.');
      } else {
        announce('Этот шаг уже запущен. Отметь выполнение или выбери другой микрошаг.');
      }
      return;
    }

    const action = getTodayAction();
    if (!action) {
      announce('Не удалось загрузить микрошаг. Нажми «Другой микрошаг».');
      return;
    }

    const durationSec = clampNumber(action.durationSec, 30, 90, 60);
    const startedAt = Date.now();

    state.ritualStartedAt = startedAt;
    state.ritualDurationSec = durationSec;

    trackEvent('mini_ritual_start', { actionId: action.id, durationSec, todayCompletions: state.todayCompletions || 0 });
    saveState();

    startTimer(durationSec, { startedAt });
    announce('Поехали. Одна короткая минута для себя.');
    renderAll();
  }

  function completeRitual(autoCompleted, options = {}) {
    syncTodayState();

    if (!hasRitualProgress()) {
      if (!autoCompleted) {
        announce('Сначала нажми «Сделай сейчас», затем отмечай выполнение.');
      }
      return;
    }

    const previousCompletionDate = state.lastCompletionDate;
    const isFirstCompletionToday = previousCompletionDate !== today;

    state.todayCompletions = normalizeCount(state.todayCompletions) + 1;
    state.todayCompleted = true;
    state.xp += 12;

    if (isFirstCompletionToday) {
      state.lastCompletionDate = today;
      state.completedDays += 1;

      if (previousCompletionDate && diffDays(previousCompletionDate, today) === 1) {
        state.streak += 1;
      } else {
        state.streak = 1;
      }
    }

    state.progress = computeProgress(state);

    metrics.miniRitualCompletions += 1;

    session.completions = normalizeCount(session.completions) + 1;
    session.date = today;

    const completionPhrase = pickReward('completion');
    const streakPhrase = isFirstCompletionToday && state.streak > 1 ? ` ${pickReward('streak')}` : '';
    const message = `${completionPhrase} +12 XP. Выполнено сегодня: ${state.todayCompletions}.`.trim();
    state.lastReward = `${message}${streakPhrase}`.trim();

    trackEvent('mini_ritual_complete', {
      actionId: state.todayActionId,
      autoCompleted,
      streak: state.streak,
      progress: state.progress,
      firstCompletionToday: isFirstCompletionToday,
      todayCompletions: state.todayCompletions,
      sessionCompletions: session.completions,
      restoredFromReload: Boolean(options.restoredFromReload),
    });

    stopTimer({ resetRitualState: true });
    saveAll();
    saveSessionState();
    renderAll();
    announce(state.lastReward);
  }

  function switchAction() {
    syncTodayState();

    const previousActionId = state.todayActionId;
    const nextAction = pickRandomAction(previousActionId);

    if (!nextAction) {
      announce('Нет доступных микрошагов.');
      return;
    }

    const interrupted = hasRitualProgress();

    state.todayActionId = nextAction.id;
    stopTimer({ resetRitualState: true });

    trackEvent('micro_action_shuffled', {
      from: previousActionId,
      to: nextAction.id,
      interrupted,
      todayCompletions: state.todayCompletions || 0,
    });
    saveState();

    announce(interrupted ? 'Новый микрошаг готов. Предыдущий таймер остановлен.' : 'Подобрал другой безопасный микрошаг.');
  }

  function saveEnergyBefore() {
    syncTodayState();

    const beforeValue = Number(refs.energyBefore?.value || 0);
    if (!beforeValue) return;

    state.todayEnergyBefore = beforeValue;
    trackEvent('energy_before_saved', { value: beforeValue });
    saveState();

    renderEnergyFeedback();
    announce('Энергия «до» сохранена.');
  }

  function saveEnergyAfter() {
    syncTodayState();

    const afterValue = Number(refs.energyAfter?.value || 0);
    if (!afterValue) return;

    state.todayEnergyAfter = afterValue;
    trackEvent('energy_after_saved', { value: afterValue });

    upsertEnergyHistory();
    saveState();

    const delta = getEnergyDelta();
    if (typeof delta === 'number' && delta > 0) {
      announce(pickReward('energyLift'));
    } else {
      announce('Сохранено. Даже стабильная энергия — полезный сигнал.');
    }

    renderEnergyFeedback();
  }

  function setReturnIntent() {
    syncTodayState();

    if (state.todayReturnIntent) {
      announce('Намерение на завтра уже отмечено 👌');
      return;
    }

    state.todayReturnIntent = true;
    state.xp += 2;
    metrics.returnIntentCount += 1;

    trackEvent('return_intent_set', { tomorrowStep: refs.tomorrowStep?.textContent || '' });

    saveAll();
    renderReturnIntent();
    renderStats();

    announce('План на завтра сохранён: 1 короткий шаг без давления.');
  }

  function handleReentryRestart() {
    hideReentryMessage();
    handleActivationClick();
  }

  function startTimer(durationSec, options = {}) {
    stopTimer();

    const startedAt = Number(options.startedAt) || Date.now();
    timerEndsAt = startedAt + durationSec * 1000;
    refs.timerWrap?.removeAttribute('hidden');

    const initialRemainingSec = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
    updateTimerUI(initialRemainingSec, durationSec);

    if (timerEndsAt <= Date.now()) {
      stopTimer();
      completeRitual(true, { restoredFromReload: Boolean(options.restoredFromReload) });
      return;
    }

    timerInterval = window.setInterval(() => {
      const remainingMs = timerEndsAt - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      updateTimerUI(remainingSec, durationSec);

      if (remainingMs <= 0) {
        stopTimer();
        completeRitual(true, { restoredFromReload: Boolean(options.restoredFromReload) });
      }
    }, prefersReducedMotion ? 500 : 200);
  }

  function stopTimer(options = {}) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    timerEndsAt = null;

    if (refs.timerWrap) {
      refs.timerWrap.hidden = true;
    }

    if (refs.timerFill) {
      refs.timerFill.style.width = '0%';
    }

    if (options.resetRitualState) {
      state.ritualStartedAt = null;
      state.ritualDurationSec = null;
    }
  }

  function updateTimerUI(remainingSec, totalSec) {
    if (!refs.timerText || !refs.timerFill) return;

    refs.timerText.textContent = `Осталось: ${remainingSec} сек`;

    const done = Math.min(100, ((totalSec - remainingSec) / totalSec) * 100);
    refs.timerFill.style.width = `${done}%`;
  }

  function renderAll() {
    renderStats();
    renderActionCard();
    renderEnergySection();
    renderTomorrowStep();
    renderReturnIntent();
  }

  function renderStats() {
    const todayCompletions = normalizeCount(state.todayCompletions);

    if (refs.startsValue) refs.startsValue.textContent = String(state.startsToday);
    if (refs.completionsTodayValue) refs.completionsTodayValue.textContent = String(todayCompletions);
    if (refs.xpValue) refs.xpValue.textContent = String(state.xp);
    if (refs.streakValue) refs.streakValue.textContent = String(state.streak);

    const progress = computeProgress(state);
    state.progress = progress;

    if (refs.progressLabel) refs.progressLabel.textContent = `${progress}%`;
    renderProgressRing(progress);

    if (refs.rewardLine) {
      refs.rewardLine.textContent =
        state.lastReward || 'Нажми «Польза в 1 клик», чтобы получить первый видимый результат.';
    }

    if (refs.statusChip) {
      if (isRitualRunning()) {
        refs.statusChip.textContent = 'Идёт микрошаг ⏱️';
      } else if (todayCompletions > 0) {
        refs.statusChip.textContent = `Выполнено сегодня: ${todayCompletions}`;
      } else if (state.startsToday > 0) {
        refs.statusChip.textContent = 'Готов к первому микрошагу';
      } else {
        refs.statusChip.textContent = 'Готов к мягкому старту';
      }
    }
  }

  function renderProgressRing(progress) {
    if (!refs.progressCircle) return;

    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    refs.progressCircle.style.strokeDasharray = `${circumference}`;
    refs.progressCircle.style.strokeDashoffset = `${offset}`;
  }

  function renderActionCard() {
    const action = getTodayAction();
    if (!action) return;

    if (refs.actionPillar) refs.actionPillar.textContent = action.pillarLabel || 'Микрошаг';
    if (refs.actionTitle) refs.actionTitle.textContent = action.title;
    if (refs.actionWhy) refs.actionWhy.textContent = action.why || '';
    if (refs.actionDuration) refs.actionDuration.textContent = `~${action.durationSec || 60} сек`;
    if (refs.actionEvidence) refs.actionEvidence.textContent = `Evidence: ${action.evidence || 'Medium'}`;

    if (refs.actionSteps) {
      refs.actionSteps.innerHTML = '';
      const steps = Array.isArray(action.instructions) ? action.instructions.slice(0, 3) : [];
      steps.forEach((step) => {
        const li = document.createElement('li');
        li.textContent = step;
        refs.actionSteps.appendChild(li);
      });
    }

    const canStart = state.startsToday > 0;
    const inProgress = hasRitualProgress();
    const running = isRitualRunning();

    if (refs.ritualStartBtn) {
      refs.ritualStartBtn.disabled = !canStart || inProgress;

      if (!canStart) {
        refs.ritualStartBtn.textContent = 'Сначала «Польза в 1 клик»';
      } else if (running) {
        refs.ritualStartBtn.textContent = 'Шаг уже в процессе ⏱️';
      } else if (inProgress) {
        refs.ritualStartBtn.textContent = 'Шаг запущен — заверши или смени';
      } else {
        refs.ritualStartBtn.textContent = 'Сделай сейчас (60 сек)';
      }
    }

    if (refs.ritualCompleteBtn) {
      refs.ritualCompleteBtn.disabled = !canStart || !inProgress;
    }
  }

  function renderEnergySection() {
    if (refs.energyBefore) {
      refs.energyBefore.value = String(state.todayEnergyBefore ?? 3);
      refs.energyBeforeValue.textContent = String(state.todayEnergyBefore ?? 3);
    }

    if (refs.energyAfter) {
      refs.energyAfter.value = String(state.todayEnergyAfter ?? 3);
      refs.energyAfterValue.textContent = String(state.todayEnergyAfter ?? 3);
    }

    renderEnergyFeedback();
  }

  function renderEnergyFeedback() {
    if (!refs.energyFeedback) return;

    const before = state.todayEnergyBefore;
    const after = state.todayEnergyAfter;

    if (typeof before !== 'number' && typeof after !== 'number') {
      refs.energyFeedback.textContent = 'Шкала 1–5: 1 = совсем разряжен(а), 5 = ресурсно.';
      return;
    }

    if (typeof before === 'number' && typeof after !== 'number') {
      refs.energyFeedback.textContent = `Энергия до: ${before}/5. После ритуала сохрани «после».`;
      return;
    }

    if (typeof before !== 'number' && typeof after === 'number') {
      refs.energyFeedback.textContent = `Энергия после: ${after}/5. Можно добавить «до» для сравнения.`;
      return;
    }

    const delta = after - before;
    if (delta > 0) {
      refs.energyFeedback.textContent = `Энергия выросла на +${delta}. Отличный микро-результат.`;
    } else if (delta === 0) {
      refs.energyFeedback.textContent = 'Энергия стабильна. Это тоже полезный сигнал для наблюдения.';
    } else {
      refs.energyFeedback.textContent = `Энергия снизилась на ${Math.abs(delta)}. Выбери более мягкий шаг в следующий раз.`;
    }
  }

  function renderTomorrowStep() {
    if (!refs.tomorrowStep) return;

    const action = getTodayAction();
    const stepByPillar = {
      nutrition: 'Завтра: перед первым кофе — 3 спокойных глотка воды.',
      environment: 'Завтра: начни день с 60 секунд дневного света.',
      recovery: 'Завтра: 1 минуту дыхания 4/6 после пробуждения.',
    };

    let text = 'Завтра: открой страницу и сделай один микрошаг без давления.';

    if (state.todayCompleted && action?.pillar) {
      text = stepByPillar[action.pillar] || text;
    }

    refs.tomorrowStep.textContent = text;
  }

  function renderReturnIntent() {
    if (!refs.returnIntentStatus) return;

    if (state.todayReturnIntent) {
      refs.returnIntentStatus.textContent = 'План зафиксирован. Завтра достаточно одного шага.';
      refs.returnIntentBtn?.setAttribute('aria-pressed', 'true');
    } else {
      refs.returnIntentStatus.textContent = 'Отметь намерение, чтобы снять лишнее решение на завтра.';
      refs.returnIntentBtn?.setAttribute('aria-pressed', 'false');
    }
  }

  function revealRitualSection() {
    if (!refs.ritualSection) return;

    refs.ritualSection.classList.add('is-active');

    if (typeof refs.ritualSection.scrollIntoView !== 'function') {
      return;
    }

    if (!prefersReducedMotion) {
      refs.ritualSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      refs.ritualSection.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }

  function showReentryMessage(skippedDays) {
    if (!refs.reentryCard || !refs.reentryText) return;

    const base = pickReward('reentry') || pickFromArray(reentryMessages);
    const extra = skippedDays > 0 ? ` Пропуск: ${skippedDays} дн.` : '';
    refs.reentryText.textContent = `${base}${extra}`;
    refs.reentryCard.hidden = false;
  }

  function hideReentryMessage() {
    if (refs.reentryCard) refs.reentryCard.hidden = true;
  }

  function syncTodayState() {
    const freshToday = getLocalISODate();
    const needsRollover = today !== freshToday || state.todayDate !== freshToday;

    today = freshToday;
    session = resetSessionForToday(session, today);

    if (!needsRollover) {
      saveSessionState();
      return;
    }

    state = rolloverStateForToday(state, today);
    ensureTodayAction();
    stopTimer({ resetRitualState: true });
    saveState();
    saveSessionState();
  }

  function hasRitualProgress() {
    return Number.isFinite(Number(state.ritualStartedAt)) && Number(state.ritualStartedAt) > 0 && Number(state.ritualDurationSec) > 0;
  }

  function getRitualEndsAt() {
    if (!hasRitualProgress()) return null;
    return Number(state.ritualStartedAt) + Number(state.ritualDurationSec) * 1000;
  }

  function isRitualRunning() {
    const endsAt = getRitualEndsAt();
    return Boolean(endsAt && endsAt > Date.now());
  }

  function restoreRitualProgressAfterReload() {
    if (!hasRitualProgress()) return;

    const durationSec = clampNumber(state.ritualDurationSec, 30, 90, 60);
    const startedAt = Number(state.ritualStartedAt);
    const endsAt = startedAt + durationSec * 1000;

    if (!Number.isFinite(startedAt) || startedAt <= 0) {
      stopTimer({ resetRitualState: true });
      saveState();
      return;
    }

    if (endsAt <= Date.now()) {
      completeRitual(true, { restoredFromReload: true });
      return;
    }

    startTimer(durationSec, { startedAt, restoredFromReload: true });
  }

  function ensureTodayAction() {
    if (state.todayActionId && getActionById(state.todayActionId)) {
      return;
    }

    const action = pickRandomAction(null);
    if (action) {
      state.todayActionId = action.id;
      saveState();
    }
  }

  function getTodayAction() {
    return getActionById(state.todayActionId) || actions[0] || null;
  }

  function getActionById(actionId) {
    return actions.find((item) => item.id === actionId) || null;
  }

  function pickRandomAction(excludeId) {
    const pool = actions.filter((item) => item.id !== excludeId);
    if (!pool.length) return actions[0] || null;
    return pool[Math.floor(Math.random() * pool.length)] || pool[0];
  }

  function pickReward(key) {
    const bucket = rewards?.[key];
    if (!Array.isArray(bucket) || !bucket.length) return '';
    return pickFromArray(bucket) || '';
  }

  function pickFromArray(list) {
    if (!Array.isArray(list) || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)] || list[0];
  }

  function announce(message) {
    if (!message) return;

    if (refs.toast) {
      refs.toast.textContent = message;
      refs.toast.classList.add('show');

      window.clearTimeout(announce._timeout);
      announce._timeout = window.setTimeout(() => {
        refs.toast.classList.remove('show');
      }, 2800);
    }

    if (refs.rewardLine) {
      refs.rewardLine.textContent = message;
    }
  }

  function upsertEnergyHistory() {
    const before = state.todayEnergyBefore;
    const after = state.todayEnergyAfter;

    if (typeof before !== 'number' && typeof after !== 'number') return;

    const entry = {
      date: today,
      actionId: state.todayActionId,
      before: typeof before === 'number' ? before : null,
      after: typeof after === 'number' ? after : null,
      delta: typeof before === 'number' && typeof after === 'number' ? after - before : null,
      updatedAt: Date.now(),
    };

    state.energyHistory = Array.isArray(state.energyHistory) ? state.energyHistory : [];
    state.energyHistory = state.energyHistory.filter((item) => item.date !== today);
    state.energyHistory.push(entry);

    if (state.energyHistory.length > 30) {
      state.energyHistory = state.energyHistory.slice(-30);
    }
  }

  function getEnergyDelta() {
    const before = state.todayEnergyBefore;
    const after = state.todayEnergyAfter;
    if (typeof before !== 'number' || typeof after !== 'number') return null;
    return after - before;
  }

  function registerActivationDay(dateISO) {
    const activationDates = Array.isArray(metrics.activationDates) ? metrics.activationDates : [];

    if (!activationDates.includes(dateISO)) {
      activationDates.push(dateISO);
      activationDates.sort();
      metrics.activationDates = activationDates;
      metrics.activationCount = activationDates.length;
      metrics.day1ProxyEligible = Math.max(activationDates.length - 1, 0);

      const yesterday = shiftDateISO(dateISO, -1);
      if (activationDates.includes(yesterday)) {
        metrics.day1ProxyHits += 1;
      }
    }
  }

  function trackEvent(type, meta = {}) {
    const event = {
      type,
      timestamp: Date.now(),
      date: today,
      meta,
    };

    metrics.events = Array.isArray(metrics.events) ? metrics.events : [];
    metrics.events.push(event);

    if (metrics.events.length > MAX_EVENTS) {
      metrics.events = metrics.events.slice(-MAX_EVENTS);
    }

    saveMetrics();
  }

  function exportMetrics() {
    const payload = {
      exportedAt: new Date().toISOString(),
      state,
      metrics,
      session,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `project-energy-metrics-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    announce('Локальные метрики скачаны в JSON.');
  }

  function saveAll() {
    saveState();
    saveMetrics();
  }

  function saveState() {
    saveToStorage(STORAGE_KEY, state);
  }

  function saveMetrics() {
    saveToStorage(METRICS_KEY, metrics);
  }

  function saveSessionState() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn(`Failed to save ${SESSION_KEY}`, error);
    }
  }

  function saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key}`, error);
    }
  }

  function loadFromStorage(key, defaults) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return deepClone(defaults);
      const parsed = JSON.parse(raw);
      return { ...deepClone(defaults), ...parsed };
    } catch (error) {
      console.warn(`Failed to parse ${key}, using defaults`, error);
      return deepClone(defaults);
    }
  }

  function loadSessionState() {
    const fallback = { date: today, completions: 0 };

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return fallback;

      const parsed = JSON.parse(raw);
      return resetSessionForToday(parsed, today);
    } catch (error) {
      console.warn(`Failed to parse ${SESSION_KEY}, using defaults`, error);
      return fallback;
    }
  }

  function resetSessionForToday(inputSession, currentDate) {
    const next = {
      date: currentDate,
      completions: 0,
      ...(inputSession || {}),
    };

    if (next.date !== currentDate) {
      next.date = currentDate;
      next.completions = 0;
    }

    next.completions = normalizeCount(next.completions);
    return next;
  }

  function rolloverStateForToday(inputState, currentDate) {
    const next = { ...deepClone(DEFAULT_STATE), ...inputState };

    if (next.todayDate !== currentDate) {
      next.startsToday = 0;
      next.todayActionId = null;
      next.todayEnergyBefore = null;
      next.todayEnergyAfter = null;
      next.todayReturnIntent = false;
      next.ritualStartedAt = null;
      next.ritualDurationSec = null;
      next.todayDate = currentDate;

      if (next.lastCompletionDate === currentDate) {
        next.todayCompletions = Math.max(1, normalizeCount(next.todayCompletions));
      } else {
        next.todayCompletions = 0;
      }
    }

    next.todayCompletions = normalizeCount(next.todayCompletions);

    if (next.lastCompletionDate === currentDate && next.todayCompletions === 0) {
      next.todayCompletions = 1;
    }

    next.todayCompleted = next.todayCompletions > 0;

    if (next.lastCompletionDate) {
      const completionGap = diffDays(next.lastCompletionDate, currentDate);
      if (completionGap > 1) {
        next.streak = 0;
      }
    }

    next.lastVisitDate = currentDate;
    next.progress = computeProgress(next);

    return next;
  }

  function computeProgress(data) {
    const startedTodayBonus = data.startsToday > 0 ? 14 : 0;
    const completionsScore = Math.min((data.completedDays || 0) * 10, 72);
    const streakBonus = Math.min((data.streak || 0) * 3, 14);

    return Math.min(100, startedTodayBonus + completionsScore + streakBonus);
  }

  function sanitizeActions(rawActions) {
    if (!Array.isArray(rawActions)) return [];

    return rawActions
      .map((item) => ({
        id: item.id,
        pillar: item.pillar || 'recovery',
        pillarLabel: item.pillarLabel || 'Микрошаг',
        title: item.title || 'Короткий шаг',
        durationSec: clampNumber(item.durationSec, 30, 90, 60),
        instructions: Array.isArray(item.instructions) ? item.instructions.filter(Boolean).slice(0, 3) : [],
        why: item.why || '',
        evidence: item.evidence || 'Medium',
      }))
      .filter((item) => item.id && item.title);
  }

  function normalizeRewards(raw) {
    const source = raw && typeof raw === 'object' ? raw : FALLBACK_REWARDS;

    return {
      activation: normalizeBucket(source.activation, FALLBACK_REWARDS.activation),
      completion: normalizeBucket(source.completion, FALLBACK_REWARDS.completion),
      energyLift: normalizeBucket(source.energyLift, FALLBACK_REWARDS.energyLift),
      streak: normalizeBucket(source.streak, FALLBACK_REWARDS.streak),
      reentry: normalizeBucket(source.reentry, FALLBACK_REWARDS.reentry),
    };
  }

  function normalizeBucket(value, fallback) {
    if (Array.isArray(value) && value.length) return value.filter(Boolean);
    return fallback.slice();
  }

  function parseMarkdownBullets(markdownText) {
    if (!markdownText || typeof markdownText !== 'string') return [];

    const lines = markdownText.split('\n');
    const result = [];
    let collect = true;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('## ')) {
        const heading = line.replace(/^##\s+/, '').toLowerCase();
        collect = !heading.includes('чего не писать');
        continue;
      }

      if (!collect) continue;
      if (!line.startsWith('- ')) continue;

      const value = line.replace(/^-\s+/, '').trim();
      if (value) result.push(value);
    }

    return result;
  }

  async function loadJson(url, fallback) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`Using fallback for ${url}`, error);
      return fallback;
    }
  }

  async function loadText(url, fallback) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.warn(`Using fallback text for ${url}`, error);
      return fallback;
    }
  }

  function calculateSkippedDays(lastVisitDate, lastCompletionDate, currentDate) {
    const visitGap = lastVisitDate ? Math.max(diffDays(lastVisitDate, currentDate) - 1, 0) : 0;
    const completionGap = lastCompletionDate ? Math.max(diffDays(lastCompletionDate, currentDate) - 1, 0) : 0;
    return Math.max(visitGap, completionGap);
  }

  function getLocalISODate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function diffDays(fromISO, toISO) {
    if (!fromISO || !toISO) return 0;

    const from = new Date(`${fromISO}T00:00:00`);
    const to = new Date(`${toISO}T00:00:00`);

    const ms = to.getTime() - from.getTime();
    return Math.round(ms / 86400000);
  }

  function shiftDateISO(dateISO, days) {
    const date = new Date(`${dateISO}T00:00:00`);
    date.setDate(date.getDate() + days);
    return getLocalISODate(date);
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function normalizeCount(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return 0;
    return Math.floor(number);
  }

  function deepClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function exposeDebug() {
    window.ProjectEnergyDebug = {
      getState: () => state,
      getMetrics: () => metrics,
      reset() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(METRICS_KEY);
        window.location.reload();
      },
    };
  }
})();
