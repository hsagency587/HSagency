(() => {
  const STORAGE_KEY = "hs-personal-routine-v1";
  const ROUTINE_VERSION = 3;

  const routine = [
    {
      id: "morning",
      title: "Sveglia 7:15",
      subtasks: [
        "Massaggio faccia al sole",
        "Fireblood, Crea e Fish Oil",
        "1 bicchiere di acqua",
        "Top G Code aloud",
        "Write main target of the day",
        "Cammina per 10 min",
        "2 frutti",
      ],
    },
    { id: "starting-day", title: "Starting Day Tasks" },
    { id: "morning-coffee", title: "Caffè" },
    { id: "work-1", title: "1st G Work Session" },
    { id: "snack", title: "Spuntino · 100 g formaggio" },
    { id: "work-2", title: "2nd G Work Session" },
    {
      id: "workout",
      title: "Workout",
      subtasks: [
        {
          label: "Allenamento",
          choices: [
            { id: "full", label: "Full" },
            { id: "med", label: "Med" },
          ],
        },
        "Doccia",
      ],
    },
    {
      id: "lunch",
      title: "Pranzo",
      subtasks: ["Zenzero", "130/90 g pasta o riso", "200 g uova o pesce"],
    },
    {
      id: "midday-routine",
      title: "Routine pomeridiana",
      subtasks: ["15 min cammino o movimento", "Caffè"],
    },
    { id: "fruit-15", title: "2/3 frutti alle 15" },
    { id: "work-3", title: "3rd G Work Session" },
    { id: "work-4", title: "4th G Work Session" },
    {
      id: "dinner",
      title: "Cena",
      subtasks: ["1 spicchio di aglio crudo", "300 g carne", "Eventuale 1 uovo"],
    },
    { id: "study", title: "Studio" },
    { id: "closing-day", title: "Closing Day Task" },
    {
      id: "evening-routine",
      title: "Routine serale",
      subtasks: [
        "Pulizie",
        "Denti",
        "No masturbation",
        "Esamina la giornata",
        "Main target of the day raggiunto",
        "Domani organizzato",
        "Gambe sul muro",
      ],
    },
    { id: "sleep-before-23", title: "Dormire prima delle 23" },
  ];

  const elements = {
    list: document.querySelector("#routine-list"),
    dateLabel: document.querySelector("#date-label"),
    dateFull: document.querySelector("#date-full"),
    datePicker: document.querySelector("#date-picker"),
    datePickerButton: document.querySelector("#date-picker-button"),
    previousDay: document.querySelector("#previous-day"),
    nextDay: document.querySelector("#next-day"),
    progressRing: document.querySelector("#progress-ring"),
    progressPercent: document.querySelector("#progress-percent"),
    progressCount: document.querySelector("#progress-count"),
    progressMessage: document.querySelector("#progress-message"),
    streakCount: document.querySelector("#streak-count"),
    listTitle: document.querySelector("#list-title"),
    resetDay: document.querySelector("#reset-day"),
    themeToggle: document.querySelector("#theme-toggle"),
    completeCard: document.querySelector("#complete-card"),
    toast: document.querySelector("#toast"),
    viewButtons: document.querySelectorAll("[data-view-target]"),
    routineHeaderPanel: document.querySelector("#routine-header-panel"),
    routineView: document.querySelector("#routine-view"),
    dashboardView: document.querySelector("#dashboard-view"),
    reportView: document.querySelector("#report-view"),
    reportButtons: document.querySelectorAll("[data-report-days]"),
    reportBack: document.querySelector("#report-back"),
    fullDayActiveStreak: document.querySelector("#full-day-active-streak-value"),
    personalRecordStreak: document.querySelector("#personal-record-streak-value"),
    reportEyebrow: document.querySelector("#report-eyebrow"),
    reportTitle: document.querySelector("#report-title"),
    reportRange: document.querySelector("#report-range"),
    reportWorkoutFull: document.querySelector("#report-workout-full"),
    reportWorkoutMed: document.querySelector("#report-workout-med"),
    reportWorkoutSkipped: document.querySelector("#report-workout-skipped"),
    missedTasksCount: document.querySelector("#missed-tasks-count"),
    missedTasksList: document.querySelector("#missed-tasks-list"),
    consolidatedTasksCount: document.querySelector("#consolidated-tasks-count"),
    consolidatedTasksList: document.querySelector("#consolidated-tasks-list"),
    noMasturbationMissed: document.querySelector("#no-masturbation-missed"),
    noMasturbationTotal: document.querySelector("#no-masturbation-total"),
    dayResultOverlay: document.querySelector("#day-result-overlay"),
    dayResultTitle: document.querySelector("#day-result-title"),
    dayResultMessage: document.querySelector("#day-result-message"),
    dayResultClose: document.querySelector("#day-result-close"),
    dayResultReturn: document.querySelector("#day-result-return"),
  };

  let state = loadState();
  let selectedDate = localDateKey(new Date());
  let currentReportDays = null;
  let toastTimeout;

  function defaultState() {
    return {
      routineVersion: ROUTINE_VERSION,
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      days: {},
    };
  }

  function migrateState(saved) {
    const savedVersion = Number(saved.routineVersion) || 1;
    const migrated = {
      ...saved,
      days: saved.days && typeof saved.days === "object" ? { ...saved.days } : {},
    };

    if (savedVersion < 2) {
      Object.entries(migrated.days).forEach(([dateKey, savedDay]) => {
        if (!savedDay || typeof savedDay !== "object") return;

        const day = { ...savedDay };
        const morningWalk = day["morning__4"];
        const morningFruit = day["morning__5"];
        const eveningWall = day["evening-routine__2"];

        delete day["morning__4"];
        delete day["morning__5"];
        delete day["evening-routine__2"];

        if (morningWalk) day["morning__5"] = true;
        if (morningFruit) day["morning__6"] = true;
        if (eveningWall) day["evening-routine__6"] = true;

        migrated.days[dateKey] = day;
      });
    }

    if (savedVersion < 3) {
      Object.entries(migrated.days).forEach(([dateKey, savedDay]) => {
        if (!savedDay || typeof savedDay !== "object") return;

        const day = { ...savedDay };
        const workoutChoice = day["workout__0"] ? "full" : day["workout__1"] ? "med" : "";
        const workoutShower = day["workout__2"];
        const workoutChoiceSkipped =
          day["workout__0__not-completed"] && day["workout__1__not-completed"];
        const workoutShowerSkipped = day["workout__2__not-completed"];

        delete day["workout__0"];
        delete day["workout__1"];
        delete day["workout__2"];
        delete day["workout__0__not-completed"];
        delete day["workout__1__not-completed"];
        delete day["workout__2__not-completed"];

        if (workoutChoice) {
          day["workout__0__choice"] = workoutChoice;
        } else if (workoutChoiceSkipped) {
          day["workout__0__not-completed"] = true;
        }

        if (workoutShower) {
          day["workout__1"] = true;
        } else if (workoutShowerSkipped) {
          day["workout__1__not-completed"] = true;
        }

        migrated.days[dateKey] = day;
      });
    }

    migrated.routineVersion = ROUTINE_VERSION;
    return migrated;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        const migrated = migrateState(saved);
        const normalized = {
          ...defaultState(),
          ...migrated,
          days: migrated.days,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch {
      // A malformed local value should never make the routine unusable.
    }
    return defaultState();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateFromKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }

  function shiftDate(key, amount) {
    const date = dateFromKey(key);
    date.setDate(date.getDate() + amount);
    return localDateKey(date);
  }

  function dayState(dateKey = selectedDate) {
    if (!state.days[dateKey]) state.days[dateKey] = {};
    return state.days[dateKey];
  }

  function subtaskId(task, index) {
    return `${task.id}__${index}`;
  }

  function notCompletedId(task, index) {
    const id = Number.isInteger(index) ? subtaskId(task, index) : task.id;
    return `${id}__not-completed`;
  }

  function choiceStateId(task, index) {
    return `${subtaskId(task, index)}__choice`;
  }

  function subtaskLabel(task, index) {
    const subtask = task.subtasks[index];
    return typeof subtask === "string" ? subtask : subtask.label;
  }

  function subtaskHasChoices(task, index) {
    return Array.isArray(task.subtasks[index]?.choices);
  }

  function subtaskIsComplete(task, index, day) {
    if (subtaskHasChoices(task, index)) {
      const selectedChoice = day[choiceStateId(task, index)];
      return task.subtasks[index].choices.some((choice) => choice.id === selectedChoice);
    }
    return Boolean(day[subtaskId(task, index)]);
  }

  function taskIsComplete(task, dateKey = selectedDate) {
    const day = state.days[dateKey] || {};
    if (day[notCompletedId(task)]) return false;
    if (!task.subtasks) return Boolean(day[task.id]);
    return task.subtasks.every(
      (_, index) =>
        subtaskIsComplete(task, index, day) && !Boolean(day[notCompletedId(task, index)]),
    );
  }

  function taskIsResolved(task, dateKey = selectedDate) {
    const day = state.days[dateKey] || {};
    if (day[notCompletedId(task)]) return true;
    if (!task.subtasks) return Boolean(day[task.id]);
    return task.subtasks.every(
      (_, index) =>
        subtaskIsComplete(task, index, day) || Boolean(day[notCompletedId(task, index)]),
    );
  }

  function taskIsNotCompleted(task, dateKey = selectedDate) {
    const day = state.days[dateKey] || {};
    if (day[notCompletedId(task)]) return true;
    return Boolean(task.subtasks) && taskIsResolved(task, dateKey) && !taskIsComplete(task, dateKey);
  }

  function completedCount(dateKey = selectedDate) {
    return routine.filter((task) => taskIsComplete(task, dateKey)).length;
  }

  function notCompletedCount(dateKey = selectedDate) {
    return routine.filter((task) => taskIsNotCompleted(task, dateKey)).length;
  }

  function resolvedCount(dateKey = selectedDate) {
    return routine.filter((task) => taskIsResolved(task, dateKey)).length;
  }

  function dayHasEntries(dateKey = selectedDate) {
    return Object.keys(state.days[dateKey] || {}).length > 0;
  }

  function isDayComplete(dateKey) {
    return completedCount(dateKey) === routine.length;
  }

  function calculateStreak() {
    let streak = 0;
    let cursor = dateFromKey(localDateKey(new Date()));

    if (!isDayComplete(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

    while (isDayComplete(localDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function previousPeriodDateKeys(days) {
    const yesterdayKey = shiftDate(localDateKey(new Date()), -1);
    return Array.from({ length: days }, (_, index) =>
      shiftDate(yesterdayKey, index - (days - 1)),
    );
  }

  function reportTaskEntries({ includeChoices = false } = {}) {
    const entries = [];

    routine.forEach((task) => {
      if (!task.subtasks) {
        entries.push({
          task,
          subtaskIndex: null,
          label: task.title,
          context: "",
        });
        return;
      }

      task.subtasks.forEach((_, subtaskIndex) => {
        if (!includeChoices && subtaskHasChoices(task, subtaskIndex)) return;
        entries.push({
          task,
          subtaskIndex,
          label: subtaskLabel(task, subtaskIndex),
          context: task.title,
        });
      });
    });

    return entries;
  }

  function reportEntryIsComplete(entry, dateKey) {
    const day = state.days[dateKey] || {};
    if (day[notCompletedId(entry.task)]) return false;

    if (!Number.isInteger(entry.subtaskIndex)) {
      return Boolean(day[entry.task.id]) && !Boolean(day[notCompletedId(entry.task)]);
    }

    return (
      subtaskIsComplete(entry.task, entry.subtaskIndex, day) &&
      !Boolean(day[notCompletedId(entry.task, entry.subtaskIndex)])
    );
  }

  function dayResultEntries() {
    return reportTaskEntries({ includeChoices: true });
  }

  function noMasturbationIsComplete(dateKey = selectedDate) {
    const entry = dayResultEntries().find(
      (item) => item.label.toLocaleLowerCase("it-IT") === "no masturbation",
    );
    return Boolean(entry && reportEntryIsComplete(entry, dateKey));
  }

  function missingTaskLabels(dateKey = selectedDate) {
    return routine
      .filter((task) => !taskIsComplete(task, dateKey))
      .map((task) => task.title);
  }

  function showDayResult() {
    let resultCase;
    let title;
    let message = "";

    if (!noMasturbationIsComplete()) {
      resultCase = "bottom";
      title =
        "Oggi sei tornato indietro verso il Bottom G, non lasciare che si impossessi anche del tuo domani. Sei 1 giorno più lontano da diventare il Top G";
    } else if (isDayComplete(selectedDate)) {
      resultCase = "complete";
      title =
        "Complimenti hai proseguito nella strada per diventare il TOP G. Sei 1 giorno più vicino a diventare il TOP G.";
    } else {
      const missingTasks = missingTaskLabels().filter(
        (label) => label.toLocaleLowerCase("it-IT") !== "no masturbation",
      );
      const missingList = missingTasks
        .map((label, index) => `${index === 0 ? "Non" : "non"} ${label}`)
        .join(", ");

      resultCase = "progress";
      title = "Oggi sei avanzato comunque sulla strada del TOP G";
      message = `Ma ti sei lasciato rallentare dai mattoni che hai deciso di trasportare: ${missingList}.`;
    }

    elements.dayResultOverlay.dataset.resultCase = resultCase;
    elements.dayResultTitle.textContent = title;
    elements.dayResultMessage.textContent = message;
    elements.dayResultMessage.hidden = !message;
    elements.dayResultOverlay.hidden = false;
    document.body.classList.add("has-day-result");
    elements.dayResultClose.focus();
  }

  function closeDayResult() {
    elements.dayResultOverlay.hidden = true;
    document.body.classList.remove("has-day-result");
  }

  function workoutReport(dateKeys) {
    const workout = routine.find((task) => task.id === "workout");
    const summary = { full: 0, med: 0, skipped: 0 };

    dateKeys.forEach((dateKey) => {
      const day = state.days[dateKey] || {};
      const taskSkipped = Boolean(day[notCompletedId(workout)]);
      const choiceSkipped = Boolean(day[notCompletedId(workout, 0)]);
      const choice = day[choiceStateId(workout, 0)];

      if (!taskSkipped && !choiceSkipped && choice === "full") {
        summary.full += 1;
      } else if (!taskSkipped && !choiceSkipped && choice === "med") {
        summary.med += 1;
      } else {
        summary.skipped += 1;
      }
    });

    return summary;
  }

  function fullDayActiveStreak() {
    let streak = 0;
    let cursor = shiftDate(localDateKey(new Date()), -1);

    while (isDayComplete(cursor)) {
      streak += 1;
      cursor = shiftDate(cursor, -1);
    }

    return streak;
  }

  function personalRecordStreak() {
    const todayKey = localDateKey(new Date());
    const dateKeys = Object.keys(state.days)
      .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key <= todayKey)
      .sort();

    let record = 0;
    let current = 0;
    let previousKey = null;

    dateKeys.forEach((dateKey) => {
      const followsPrevious = previousKey && shiftDate(previousKey, 1) === dateKey;

      if (isDayComplete(dateKey)) {
        current = followsPrevious && current > 0 ? current + 1 : 1;
        record = Math.max(record, current);
      } else {
        current = 0;
      }

      previousKey = dateKey;
    });

    return record;
  }

  function renderDashboard() {
    elements.fullDayActiveStreak.textContent = fullDayActiveStreak();
    elements.personalRecordStreak.textContent = personalRecordStreak();
  }

  function reportRangeLabel(dateKeys) {
    const options = { day: "numeric", month: "long", year: "numeric" };
    const start = dateFromKey(dateKeys[0]).toLocaleDateString("it-IT", options);
    const end = dateFromKey(dateKeys[dateKeys.length - 1]).toLocaleDateString("it-IT", options);
    return `${start} - ${end}`;
  }

  function renderReportTaskList(container, entries, days) {
    if (!entries.length) {
      container.innerHTML = '<p class="report-empty">Nessuna task in questa sezione.</p>';
      return;
    }

    container.innerHTML = entries
      .map(
        (entry) => `
          <div class="report-task-row">
            <div>
              <span>${entry.label}</span>
              ${entry.context ? `<small>${entry.context}</small>` : ""}
            </div>
            <strong>${entry.completed}<small>/${days}</small></strong>
          </div>
        `,
      )
      .join("");
  }

  function renderReport(days) {
    const periodDays = days === 30 ? 30 : 7;
    const dateKeys = previousPeriodDateKeys(periodDays);
    const workout = workoutReport(dateKeys);
    const taskStats = reportTaskEntries().map((entry) => ({
      ...entry,
      completed: dateKeys.filter((dateKey) => reportEntryIsComplete(entry, dateKey)).length,
    }));
    const missedTasks = taskStats.filter((entry) => entry.completed < periodDays);
    const consolidatedTasks = taskStats.filter((entry) => entry.completed === periodDays);
    const noMasturbation = taskStats.find(
      (entry) => entry.label.toLocaleLowerCase("it-IT") === "no masturbation",
    );

    currentReportDays = periodDays;
    elements.reportEyebrow.textContent = `Ultimi ${periodDays} giorni precedenti`;
    elements.reportTitle.textContent =
      periodDays === 30 ? "Resoconto mensile" : "Resoconto settimanale";
    elements.reportRange.textContent = reportRangeLabel(dateKeys);
    elements.reportWorkoutFull.textContent = workout.full;
    elements.reportWorkoutMed.textContent = workout.med;
    elements.reportWorkoutSkipped.textContent = workout.skipped;
    elements.missedTasksCount.textContent = missedTasks.length;
    elements.consolidatedTasksCount.textContent = consolidatedTasks.length;
    elements.noMasturbationMissed.textContent =
      periodDays - (noMasturbation?.completed || 0);
    elements.noMasturbationTotal.textContent = `su ${periodDays} giorni`;

    renderReportTaskList(elements.missedTasksList, missedTasks, periodDays);
    renderReportTaskList(elements.consolidatedTasksList, consolidatedTasks, periodDays);
  }

  function openReport(days) {
    renderReport(days);
    setActiveView("report");
  }

  function setSelectedDate(dateKey) {
    selectedDate = dateKey;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTask(task) {
    if (task.subtasks) return;
    const day = dayState();
    day[task.id] = !day[task.id];
    const isNowComplete = Boolean(day[task.id]);
    if (day[task.id]) {
      delete day[notCompletedId(task)];
    } else {
      delete day[task.id];
    }
    saveState();
    render();

    if (task.id === "sleep-before-23" && isNowComplete) {
      showDayResult();
    }
  }

  function toggleSubtask(task, index) {
    if (subtaskHasChoices(task, index)) return;
    const day = dayState();
    const id = subtaskId(task, index);
    const wasTaskComplete = taskIsComplete(task);
    day[id] = !day[id];
    if (day[id]) {
      delete day[notCompletedId(task, index)];
    } else {
      delete day[id];
    }
    const isNowComplete = taskIsComplete(task);
    saveState();
    render();

    if (!wasTaskComplete && isNowComplete) {
      showToast(`${task.title} completata. Tappa successiva sbloccata.`);
    }
  }

  function selectSubtaskChoice(task, index, choiceId) {
    if (!subtaskHasChoices(task, index)) return;
    const choice = task.subtasks[index].choices.find((item) => item.id === choiceId);
    if (!choice) return;

    const day = dayState();
    const id = choiceStateId(task, index);
    const wasTaskComplete = taskIsComplete(task);

    if (day[id] === choiceId) {
      delete day[id];
    } else {
      day[id] = choiceId;
      delete day[notCompletedId(task, index)];
    }

    const isNowComplete = taskIsComplete(task);
    saveState();
    render();

    if (!wasTaskComplete && isNowComplete) {
      showToast(`${task.title} completata. Tappa successiva sbloccata.`);
    }
  }

  function toggleNotCompleted(task, index) {
    const day = dayState();
    const isSubtask = Number.isInteger(index);
    const id = notCompletedId(task, index);
    const isNowNotCompleted = !day[id];

    if (isNowNotCompleted) {
      day[id] = true;
      if (isSubtask) {
        delete day[subtaskId(task, index)];
        delete day[choiceStateId(task, index)];
      } else if (!task.subtasks) {
        delete day[task.id];
      }
    } else {
      delete day[id];
    }

    saveState();
    render();

    const label = isSubtask ? subtaskLabel(task, index) : task.title;
    showToast(
      isNowNotCompleted
        ? `${label}: non completata.`
        : `${label}: stato non completata rimosso.`,
    );

    if (!isSubtask && task.id === "sleep-before-23" && isNowNotCompleted) {
      showDayResult();
    }
  }

  function notCompletedControl(task, selected, index, label = task.title) {
    const subtaskAttribute = Number.isInteger(index) ? ` data-subtask-index="${index}"` : "";
    return `
      <button
        class="not-completed-button${selected ? " is-selected" : ""}"
        type="button"
        aria-label="${
          selected ? "Rimuovi stato non completata" : "Segna come non completata"
        }: ${label}"
        aria-pressed="${selected}"
        data-action="toggle-not-completed"
        data-task-id="${task.id}"
        ${subtaskAttribute}
      >Non completata</button>
    `;
  }

  function taskMarkup(task, index, activeIndex) {
    const complete = taskIsComplete(task);
    const notCompleted = taskIsNotCompleted(task);
    const hasSubtasks = Boolean(task.subtasks);
    const day = dayState();
    const subtaskResolved = hasSubtasks
      ? task.subtasks.filter(
          (_, subIndex) =>
            subtaskIsComplete(task, subIndex, day) || day[notCompletedId(task, subIndex)],
        ).length
      : 0;
    const directlyNotCompleted = Boolean(day[notCompletedId(task)]);
    const isActive = index === activeIndex;
    const isOpen = hasSubtasks && (isActive || subtaskResolved > 0);
    const stateClass = complete
      ? "is-complete"
      : notCompleted
        ? "is-not-completed"
        : isActive
          ? "is-active"
          : "is-upcoming";
    const marker = complete ? "✓" : String(index + 1).padStart(2, "0");

    const headingControl = hasSubtasks
      ? `
        <span class="task-count">${subtaskResolved}/${task.subtasks.length}</span>
        <span class="chevron" aria-hidden="true">⌄</span>
      `
      : `
        <button
          class="task-toggle"
          type="button"
          aria-label="${complete ? "Segna come non completata" : "Segna come completata"}: ${task.title}"
          aria-pressed="${complete}"
          data-action="toggle-task"
          data-task-id="${task.id}"
        >✓</button>
      `;

    const subtasks = hasSubtasks
      ? `
        <div class="subtask-list" id="subtasks-${task.id}">
          <div class="subtask-list-inner">
            ${task.subtasks
              .map((subtask, subIndex) => {
                const label = subtaskLabel(task, subIndex);
                const hasChoices = subtaskHasChoices(task, subIndex);
                const selectedChoice = hasChoices ? day[choiceStateId(task, subIndex)] : "";
                const done = subtaskIsComplete(task, subIndex, day);
                const skipped = Boolean(day[notCompletedId(task, subIndex)]);
                const completionControl = hasChoices
                  ? `
                    <div class="choice-subtask-control">
                      <span class="subtask-toggle" aria-pressed="${done}" aria-hidden="true">✓</span>
                      <div class="choice-subtask-copy">
                        <span class="subtask-label">${label}</span>
                        <div class="choice-options" role="group" aria-label="Scegli il tipo di ${label.toLowerCase()}">
                          ${subtask.choices
                            .map(
                              (choice) => `
                                <button
                                  class="choice-button${
                                    selectedChoice === choice.id ? " is-selected" : ""
                                  }"
                                  type="button"
                                  aria-pressed="${selectedChoice === choice.id}"
                                  data-action="select-subtask-choice"
                                  data-task-id="${task.id}"
                                  data-subtask-index="${subIndex}"
                                  data-choice-id="${choice.id}"
                                >${choice.label}</button>
                              `,
                            )
                            .join("")}
                        </div>
                      </div>
                    </div>
                  `
                  : `
                    <button
                      class="subtask-main-control"
                      type="button"
                      aria-label="${done ? "Segna come da completare" : "Segna come completata"}: ${label}"
                      aria-pressed="${done}"
                      data-action="toggle-subtask"
                      data-task-id="${task.id}"
                      data-subtask-index="${subIndex}"
                    >
                      <span class="subtask-toggle" aria-pressed="${done}" aria-hidden="true">✓</span>
                      <span class="subtask-label">${label}</span>
                    </button>
                  `;
                return `
                  <div class="subtask-row${hasChoices ? " has-choices" : ""}${
                    done ? " is-complete" : ""
                  }${skipped ? " is-not-completed" : ""}">
                    ${completionControl}
                    ${notCompletedControl(task, skipped, subIndex, label)}
                  </div>
                `;
              })
              .join("")}
            ${
              complete
                ? '<div class="category-complete">Categoria completata · +1 tappa</div>'
                : notCompleted
                  ? '<div class="category-complete category-not-completed">Categoria non completata</div>'
                  : ""
            }
          </div>
        </div>
      `
      : "";

    return `
      <article class="routine-item ${stateClass}" data-routine-id="${task.id}">
        <div class="step-marker" aria-hidden="true">${marker}</div>
        <div class="task-card${isOpen ? " is-open" : ""}">
          <div class="task-heading">
            <div class="task-heading-copy">
              <span class="task-kicker">${hasSubtasks ? "Categoria" : "Tappa"} ${index + 1}</span>
              <span class="task-title">${task.title}</span>
            </div>
            <div class="task-actions">
              ${notCompletedControl(task, directlyNotCompleted)}
              ${
                hasSubtasks
                  ? `<button
                      class="task-heading-toggle"
                      type="button"
                      aria-expanded="${isOpen}"
                      aria-controls="subtasks-${task.id}"
                      data-action="toggle-category"
                      data-task-id="${task.id}"
                    >${headingControl}</button>`
                  : headingControl
              }
            </div>
          </div>
          ${subtasks}
        </div>
      </article>
    `;
  }

  function render() {
    document.body.dataset.theme = state.theme;
    elements.themeToggle.setAttribute(
      "aria-label",
      state.theme === "dark" ? "Attiva tema chiaro" : "Attiva tema scuro",
    );

    const todayKey = localDateKey(new Date());
    const selected = dateFromKey(selectedDate);
    const yesterdayKey = shiftDate(todayKey, -1);
    const tomorrowKey = shiftDate(todayKey, 1);
    const relativeLabel =
      selectedDate === todayKey
        ? "Oggi"
        : selectedDate === yesterdayKey
          ? "Ieri"
          : selectedDate === tomorrowKey
            ? "Domani"
            : selected.toLocaleDateString("it-IT", { weekday: "long" });

    elements.dateLabel.textContent = relativeLabel;
    elements.dateFull.textContent = selected.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    elements.datePicker.value = selectedDate;

    const done = completedCount();
    const notCompleted = notCompletedCount();
    const resolved = resolvedCount();
    const percent = Math.round((done / routine.length) * 100);
    const activeIndex = routine.findIndex((task) => !taskIsResolved(task));

    elements.progressRing.style.setProperty("--progress", `${percent * 3.6}deg`);
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressCount.textContent = `${done} di ${routine.length} tappe`;
    elements.streakCount.textContent = calculateStreak();
    elements.completeCard.hidden = done !== routine.length;

    if (resolved === 0) {
      elements.progressMessage.textContent = "Inizia dalla prima tappa.";
      elements.listTitle.textContent = "La prima tappa ti aspetta";
    } else if (done === routine.length) {
      elements.progressMessage.textContent = "Routine conclusa.";
      elements.listTitle.textContent = "Tutto fatto per questo giorno";
    } else if (resolved === routine.length) {
      elements.progressMessage.textContent = `${notCompleted} ${
        notCompleted === 1 ? "tappa non completata" : "tappe non completate"
      }.`;
      elements.listTitle.textContent = "Giornata registrata";
    } else {
      elements.progressMessage.textContent = `${routine.length - resolved} tappe ancora da registrare.`;
      elements.listTitle.textContent = "Continua da dove hai lasciato";
    }

    elements.list.innerHTML = routine
      .map((task, index) => taskMarkup(task, index, activeIndex))
      .join("");

    renderDashboard();
    if (currentReportDays) renderReport(currentReportDays);
  }

  function showToast(message) {
    window.clearTimeout(toastTimeout);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimeout = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }

  function setActiveView(view) {
    const showRoutine = view === "routine";
    const showDashboard = view === "dashboard";
    const showReport = view === "report";

    if (!showReport) currentReportDays = null;

    elements.routineHeaderPanel.hidden = !showRoutine;
    elements.routineView.hidden = !showRoutine;
    elements.dashboardView.hidden = !showDashboard;
    elements.reportView.hidden = !showReport;

    elements.viewButtons.forEach((button) => {
      const isActive =
        button.dataset.viewTarget === view ||
        (showReport && button.dataset.viewTarget === "dashboard");
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  elements.list.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (!control) return;
    const task = routine.find((item) => item.id === control.dataset.taskId);
    if (!task) return;

    if (control.dataset.action === "toggle-task") {
      toggleTask(task);
      return;
    }

    if (control.dataset.action === "toggle-subtask") {
      toggleSubtask(task, Number(control.dataset.subtaskIndex));
      return;
    }

    if (control.dataset.action === "select-subtask-choice") {
      selectSubtaskChoice(
        task,
        Number(control.dataset.subtaskIndex),
        control.dataset.choiceId,
      );
      return;
    }

    if (control.dataset.action === "toggle-not-completed") {
      const subtaskIndex = control.hasAttribute("data-subtask-index")
        ? Number(control.dataset.subtaskIndex)
        : undefined;
      toggleNotCompleted(task, subtaskIndex);
      return;
    }

    if (control.dataset.action === "toggle-category") {
      const card = control.closest(".task-card");
      const isOpen = card.classList.toggle("is-open");
      control.setAttribute("aria-expanded", String(isOpen));
    }
  });

  elements.previousDay.addEventListener("click", () => setSelectedDate(shiftDate(selectedDate, -1)));
  elements.nextDay.addEventListener("click", () => setSelectedDate(shiftDate(selectedDate, 1)));

  elements.datePickerButton.addEventListener("click", () => {
    if (typeof elements.datePicker.showPicker === "function") {
      elements.datePicker.showPicker();
    } else {
      elements.datePicker.click();
    }
  });

  elements.datePicker.addEventListener("change", () => {
    if (elements.datePicker.value) setSelectedDate(elements.datePicker.value);
  });

  elements.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    render();
  });

  elements.resetDay.addEventListener("click", () => {
    if (!dayHasEntries()) {
      showToast("Non ci sono tappe da azzerare.");
      return;
    }
    if (window.confirm("Vuoi azzerare solo la routine di questo giorno?")) {
      delete state.days[selectedDate];
      saveState();
      render();
      showToast("Routine del giorno azzerata.");
    }
  });

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.viewTarget));
  });

  elements.reportButtons.forEach((button) => {
    button.addEventListener("click", () => openReport(Number(button.dataset.reportDays)));
  });

  elements.reportBack.addEventListener("click", () => setActiveView("dashboard"));
  elements.dayResultClose.addEventListener("click", closeDayResult);
  elements.dayResultReturn.addEventListener("click", closeDayResult);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.dayResultOverlay.hidden) {
      closeDayResult();
    }
  });

  render();

  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
  }
})();
