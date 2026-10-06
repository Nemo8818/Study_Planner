(function () {
  const STORAGE_KEY = "studyPlannerTasks";

  const form = document.getElementById("task-form");
  const subjectInput = document.getElementById("subject");
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("study-time");
  const errorEl = document.getElementById("form-error");
  const listEl = document.getElementById("task-list");
  const emptyEl = document.getElementById("empty-state");
  const countTotal = document.getElementById("count-total");
  const countOpen = document.getElementById("count-open");
  const countDone = document.getElementById("count-done");

  let tasks = loadTasks();

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidTask);
    } catch (error) {
      return [];
    }
  }

  function isValidTask(task) {
    return (
      task &&
      typeof task.id === "string" &&
      typeof task.subject === "string" &&
      typeof task.date === "string" &&
      typeof task.minutes === "number" &&
      typeof task.completed === "boolean"
    );
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function formatDate(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatMinutes(minutes) {
    if (minutes < 60) return minutes + " min";
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (rest === 0) return hours + (hours === 1 ? " hr" : " hrs");
    return hours + " hr " + rest + " min";
  }

  function updateCounter() {
    const total = tasks.length;
    const done = tasks.filter(function (task) {
      return task.completed;
    }).length;
    countTotal.textContent = String(total);
    countDone.textContent = String(done);
    countOpen.textContent = String(total - done);
    emptyEl.classList.toggle("hidden", total > 0);
  }

  function render() {
    const sorted = tasks.slice().sort(function (a, b) {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.date.localeCompare(b.date);
    });

    listEl.innerHTML = "";
    sorted.forEach(function (task) {
      const item = document.createElement("li");
      item.className = "task" + (task.completed ? " completed" : "");
      item.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", "Mark " + task.subject + " as completed");

      const body = document.createElement("div");
      const title = document.createElement("p");
      title.className = "task-title";
      title.textContent = task.subject;
      const meta = document.createElement("p");
      meta.className = "task-meta";
      meta.textContent = formatDate(task.date) + " · " + formatMinutes(task.minutes);
      body.appendChild(title);
      body.appendChild(meta);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn-delete";
      del.textContent = "Delete";
      del.setAttribute("aria-label", "Delete " + task.subject);

      item.appendChild(checkbox);
      item.appendChild(body);
      item.appendChild(del);
      listEl.appendChild(item);
    });

    updateCounter();
  }

  function addTask(event) {
    event.preventDefault();
    clearError();

    const subject = subjectInput.value.trim();
    const date = dateInput.value;
    const minutes = Number(timeInput.value);

    if (!subject) {
      showError("Please enter a subject.");
      subjectInput.focus();
      return;
    }
    if (!date) {
      showError("Please choose a date.");
      dateInput.focus();
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      showError("Study time must be a whole number between 1 and 1440 minutes.");
      timeInput.focus();
      return;
    }

    tasks.push({
      id: String(Date.now()) + "-" + Math.random().toString(16).slice(2),
      subject: subject,
      date: date,
      minutes: minutes,
      completed: false,
    });

    saveTasks();
    render();
    form.reset();
    subjectInput.focus();
  }

  function onListClick(event) {
    const taskEl = event.target.closest(".task");
    if (!taskEl) return;
    const id = taskEl.dataset.id;
    const task = tasks.find(function (item) {
      return item.id === id;
    });
    if (!task) return;

    if (event.target.classList.contains("task-check")) {
      task.completed = event.target.checked;
      saveTasks();
      render();
      return;
    }

    if (event.target.classList.contains("btn-delete")) {
      tasks = tasks.filter(function (item) {
        return item.id !== id;
      });
      saveTasks();
      render();
    }
  }

  form.addEventListener("submit", addTask);
  listEl.addEventListener("click", onListClick);
  render();
})();
