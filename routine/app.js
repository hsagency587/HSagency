(() => {
  const STORAGE_KEY = "hs-personal-routine-v1";

  const routine = [
    {
      id: "morning",
      title: "Sveglia 7:15",
      subtasks: [
        "Massaggio faccia al sole",
        "Fireblood, Crea e Fish Oil",
        "1 bicchiere di acqua",
        "Top G Code aloud",
        "Cammina per 10 min",
        "2 frutti",
      ],
    },
    { id: "starting-day", title: "Starting Day Tasks" },
    { id: "work-1", title: "1st G Work Session" },
    { id: "snack", title: "Spuntino · 100 g formaggio" },
    { id: "work-2", title: "2nd G Work Session" },
    {
      id: "workout",
      title: "Workout",
      subtasks: ["Full", "Med", "Doccia"],
    },
    {
      id: "lunch",
      title: "Pranzo",
      subtasks: ["Zenzero", "130/90 g pasta o riso", "200 g uova o pesce"],
    },
    {
      id: "midday-routine",
      title: "Routine pomeridiana",
      subtasks: ["15 min cammino o movimento"],
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
      subtasks: ["Pulizie", "Denti", "Gambe sul muro"],
    },
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
  };

  let state = loadState();
  let selectedDate = localDateKey(new Date());
  let toastTimeout;

  function defaultState() {
    return {
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      days: {},
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        return {
          ...defaultState(),
          ...saved,
          days: saved.days && typeof saved.days === "object" ? saved.days : {},
        };
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

  function taskIsComplete(task, dateKey = selectedDate) {
    const day = state.days[dateKey] || {};
    if (!task.subtasks) return Boolean(day[task.id]);
    return task.subtasks.every((_, index) => Boolean(day[subtaskId(task, index)]));
  }

  function completedCount(dateKey = selectedDate) {
    return routine.filter((task) => taskIsComplete(task, dateKey)).length;
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

  function setSelectedDate(dateKey) {
    selectedDate = dateKey;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTask(task) {
    if (task.subtasks) return;
    const day = dayState();
    day[task.id] = !day[task.id];
    if (!day[task.id]) delete day[task.id];
    saveState();
    render();
  }

  function toggleSubtask(task, index) {
    const day = dayState();
    const id = subtaskId(task, index);
    const wasTaskComplete = taskIsComplete(task);
    day[id] = !day[id];
    if (!day[id]) delete day[id];
    const isNowComplete = taskIsComplete(task);
    saveState();
    render();

    if (!wasTaskComplete && isNowComplete) {
      showToast(`${task.title} completata. Tappa successiva sbloccata.`);
    }
  }

  function taskMarkup(task, index, activeIndex) {
    const complete = taskIsComplete(task);
    const hasSubtasks = Boolean(task.subtasks);
    const day = dayState();
    const subtaskDone = hasSubtasks
      ? task.subtasks.filter((_, subIndex) => day[subtaskId(task, subIndex)]).length
      : 0;
    const isActive = index === activeIndex;
    const stateClass = complete ? "is-complete" : isActive ? "is-active" : "is-upcoming";
    const marker = complete ? "✓" : String(index + 1).padStart(2, "0");

    const headingControl = hasSubtasks
      ? `
        <span class="task-count">${subtaskDone}/${task.subtasks.length}</span>
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
              .map((label, subIndex) => {
                const done = Boolean(day[subtaskId(task, subIndex)]);
                return `
                  <button
                    class="subtask-row${done ? " is-complete" : ""}"
                    type="button"
                    aria-pressed="${done}"
                    data-action="toggle-subtask"
                    data-task-id="${task.id}"
                    data-subtask-index="${subIndex}"
                  >
                    <span class="subtask-toggle" aria-pressed="${done}" aria-hidden="true">✓</span>
                    <span>${label}</span>
                  </button>
                `;
              })
              .join("")}
            ${complete ? '<div class="category-complete">Categoria completata · +1 tappa</div>' : ""}
          </div>
        </div>
      `
      : "";

    return `
      <article class="routine-item ${stateClass}" data-routine-id="${task.id}">
        <div class="step-marker" aria-hidden="true">${marker}</div>
        <div class="task-card${hasSubtasks && (isActive || subtaskDone > 0) ? " is-open" : ""}">
          <div class="task-heading">
            <div class="task-heading-copy">
              <span class="task-kicker">${hasSubtasks ? "Categoria" : "Tappa"} ${index + 1}</span>
              <span class="task-title">${task.title}</span>
            </div>
            ${
              hasSubtasks
                ? `<button
                    class="task-heading-toggle"
                    type="button"
                    aria-expanded="${isActive || subtaskDone > 0}"
                    aria-controls="subtasks-${task.id}"
                    data-action="toggle-category"
                    data-task-id="${task.id}"
                  >${headingControl}</button>`
                : headingControl
            }
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
    const percent = Math.round((done / routine.length) * 100);
    const activeIndex = routine.findIndex((task) => !taskIsComplete(task));

    elements.progressRing.style.setProperty("--progress", `${percent * 3.6}deg`);
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressCount.textContent = `${done} di ${routine.length} tappe`;
    elements.streakCount.textContent = calculateStreak();
    elements.completeCard.hidden = done !== routine.length;

    if (done === 0) {
      elements.progressMessage.textContent = "Inizia dalla prima tappa.";
      elements.listTitle.textContent = "La prima tappa ti aspetta";
    } else if (done === routine.length) {
      elements.progressMessage.textContent = "Routine conclusa.";
      elements.listTitle.textContent = "Tutto fatto per questo giorno";
    } else {
      elements.progressMessage.textContent = `${routine.length - done} tappe ancora da completare.`;
      elements.listTitle.textContent = "Continua da dove hai lasciato";
    }

    elements.list.innerHTML = routine
      .map((task, index) => taskMarkup(task, index, activeIndex))
      .join("");
  }

  function showToast(message) {
    window.clearTimeout(toastTimeout);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimeout = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
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
    if (!completedCount()) {
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

  render();

  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
  }
})();
