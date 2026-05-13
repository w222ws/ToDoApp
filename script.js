/**
 * Стан додатка
 */
let taskRegistry = [];
let selectedPriority = "low";
let activeFilter = "all";

const taskInputField = document.getElementById("taskInput");
const createTaskBtn = document.getElementById("addBtn");
const taskContainer = document.getElementById("tasksList");
const purgeTasksBtn = document.getElementById("clearDone");

/**
 * Єдина функція для всіх запитів до API.
 * Замість того щоб дублювати перевірку res.ok скрізь — робимо це в одному місці.
 */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null; // Delete повертає порожню відповідь
  return res.json();
}

/**
 * API-дії
 */

async function syncTasks() {
  try {
    taskRegistry = await apiFetch("/api/tasks");
    renderApp();
  } catch (err) {
    console.error("Sync failed:", err.message);
  }
}

async function createNewTask() {
  const content = taskInputField.value.trim();
  if (!content) return;

  try {
    const task = await apiFetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content, priority: selectedPriority }),
    });
    taskRegistry.push(task);
    taskInputField.value = "";
    renderApp();
  } catch (err) {
    console.error("Creation error:", err.message);
  }
}

async function removeTask(taskId) {
  try {
    await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    taskRegistry = taskRegistry.filter((t) => t.id !== taskId);
    renderApp();
  } catch (err) {
    console.error("Deletion failed:", err.message);
  }
}

async function toggleTaskStatus(taskId) {
  try {
    const updated = await apiFetch(`/api/tasks/${taskId}`, { method: "PATCH" });
    taskRegistry = taskRegistry.map((t) => (t.id === taskId ? updated : t));
    renderApp();
  } catch (err) {
    console.error("Toggle error:", err.message);
  }
}

async function saveInlineEdit(taskId, inputEl) {
  const newText = inputEl.value.trim();
  if (!newText) {
    cancelInlineEdit(taskId);
    return;
  }
  try {
    const updated = await apiFetch(`/api/tasks/${taskId}/text`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText }),
    });
    taskRegistry = taskRegistry.map((t) => (t.id === taskId ? updated : t));
    renderApp();
  } catch (err) {
    console.error("Edit error:", err.message);
    cancelInlineEdit(taskId);
  }
}

// Повертаємо оригінальний текст без перемальовки всього списку
function cancelInlineEdit(taskId) {
  const task = taskRegistry.find((t) => t.id === taskId);
  if (!task) return;
  const node = taskContainer.querySelector(`[data-id="${taskId}"]`);
  if (!node) return;
  const p = document.createElement("p");
  p.className = "task-text";
  p.textContent = task.text;
  p.addEventListener("dblclick", function () { makeTaskEditable(taskId, this); });
  node.querySelector(".task-edit-input")?.replaceWith(p);
}

/**
 * Inline-редагування: замінюємо <p> на <input> прямо в задачі.
 * Ніякого prompt() — це системний діалог, його не можна стилізувати.
 */
function makeTaskEditable(taskId, textEl) {
  const input = document.createElement("input");
  input.className = "task-edit-input";
  input.value = textEl.textContent;
  textEl.replaceWith(input);
  input.focus();
  input.select();

  let saved = false;
  const save = () => {
    if (saved) return;
    saved = true;
    saveInlineEdit(taskId, input);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancelInlineEdit(taskId);
  });
  input.addEventListener("blur", save);
}

/**
 * Рендеринг
 */

function refreshStatistics() {
  const total = taskRegistry.length;
  const completed = taskRegistry.filter((t) => t.done).length;
  const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);

  const uiTotal = document.getElementById("statTotal");
  const uiActive = document.getElementById("statActive");
  const uiDone = document.getElementById("statDone");

  if (uiTotal) uiTotal.textContent = total;
  if (uiActive) uiActive.textContent = total - completed;
  if (uiDone) uiDone.textContent = completed;

  const bar = document.getElementById("progressFill");
  const label = document.getElementById("progressLabel");
  if (bar) bar.style.width = `${ratio}%`;
  if (label) label.textContent = `${ratio}%`;
}

function renderApp() {
  if (!taskContainer) return;
  taskContainer.innerHTML = "";

  const displayList = taskRegistry.filter((item) => {
    if (activeFilter === "active") return !item.done;
    if (activeFilter === "done") return item.done;
    if (activeFilter === "high") return item.priority === "high";
    return true;
  });

  if (displayList.length === 0) {
    taskContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <h3>No tasks found</h3>
        <p>Your list is currently empty.</p>
      </div>`;
    refreshStatistics();
    return;
  }

  displayList.forEach((task) => {
    const node = document.createElement("div");
    node.className = `task-item prio-${task.priority} ${task.done ? "done" : ""}`;
    node.dataset.id = task.id;

    node.innerHTML = `
      <button class="check-btn ${task.done ? "done" : ""}" data-action="toggle" data-id="${task.id}">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </button>
      <div class="task-body">
        <p class="task-text">${task.text}</p>
        <div class="task-meta">
          <span class="prio-badge ${task.priority}">${task.priority}</span>
        </div>
      </div>
      <button class="del-btn" data-action="delete" data-id="${task.id}">✕</button>
    `;

    // Подвійний клік — вмикаємо редагування
    node.querySelector(".task-text").addEventListener("dblclick", function () {
      makeTaskEditable(task.id, this);
    });

    taskContainer.appendChild(node);
  });

  refreshStatistics();
}

/**
 * Event delegation — один обробник на весь список замість onclick у кожному елементі
 */
taskContainer?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === "toggle") toggleTaskStatus(id);
  if (action === "delete") removeTask(id);
});

/**
 * Слухачі подій
 */

createTaskBtn?.addEventListener("click", createNewTask);

taskInputField?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") createNewTask();
});

document.querySelectorAll(".prio-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPriority = btn.dataset.p;
  });
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.f;
    renderApp();
  });
});

purgeTasksBtn?.addEventListener("click", async () => {
  if (!confirm("Видалити всі задачі?")) return;
  try {
    await Promise.all(taskRegistry.map((t) => apiFetch(`/api/tasks/${t.id}`, { method: "DELETE" })));
    await syncTasks();
  } catch (err) {
    console.error("Purge error:", err.message);
  }
});

// Старт
syncTasks();
