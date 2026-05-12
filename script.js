/**
 * Конфігурація та глобальний стан додатка
 */
let taskRegistry = [];
let selectedPriority = "low";
let activeFilter = "all";

// Ініціалізація DOM-елементів
const taskInputField = document.getElementById("taskInput");
const createTaskBtn = document.getElementById("addBtn");
const taskContainer = document.getElementById("tasksList");
const purgeTasksBtn = document.getElementById("clearDone");

/**
 * Робота з API (Запити до сервера)
 */

async function syncTasks() {
  try {
    const response = await fetch("/api/tasks");
    if (!response.ok) throw new Error("Network error");
    taskRegistry = await response.json();
    renderApp();
  } catch (err) {
    console.error("Sync failed:", err);
  }
}

async function createNewTask() {
  const content = taskInputField.value.trim();
  if (!content) return;

  const payload = { text: content, priority: selectedPriority };

  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      taskRegistry.push(data);
      taskInputField.value = "";
      renderApp();
    }
  } catch (err) {
    console.error("Creation error:", err);
  }
}

async function removeTask(taskId) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      taskRegistry = taskRegistry.filter((item) => String(item.id) !== String(taskId));
      renderApp();
    }
  } catch (err) {
    console.error("Deletion failed:", err);
  }
}

async function toggleTaskStatus(taskId) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "PATCH" });
    if (res.ok) {
      const updated = await res.json();
      taskRegistry = taskRegistry.map((t) => (String(t.id) === String(taskId) ? updated : t));
      renderApp();
    }
  } catch (err) {
    console.error("Toggle error:", err);
  }
}

async function updateTaskContent(taskId, currentText) {
  const updatedText = prompt("Edit your task:", currentText);

  if (updatedText?.trim()) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/text`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: updatedText.trim() }),
      });

      if (res.ok) {
        const result = await res.json();
        taskRegistry = taskRegistry.map((t) => (String(t.id) === String(taskId) ? result : t));
        renderApp();
      }
    } catch (err) {
      console.error("Edit error:", err);
    }
  }
}

/**
 * Логіка рендерингу інтерфейсу
 */

function refreshStatistics() {
  const total = taskRegistry.length;
  const completed = taskRegistry.filter((t) => t.done).length;
  const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);

  const uiTotal = document.querySelector(".stat-card #statTotal");
  const uiActive = document.querySelector(".stat-card #statActive");
  const uiDone = document.querySelector(".stat-card #statDone");

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

    node.innerHTML = `
      <button class="check-btn ${task.done ? "done" : ""}" onclick="toggleTaskStatus('${task.id}')">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </button>
      <div class="task-body">
        <p class="task-text" ondblclick="updateTaskContent('${task.id}', '${task.text}')">${task.text}</p>
        <div class="task-meta">
          <span class="prio-badge ${task.priority}">${task.priority}</span>
        </div>
      </div>
      <button class="del-btn" onclick="removeTask('${task.id}')">✕</button>
    `;
    taskContainer.appendChild(node);
  });

  refreshStatistics();
}

/**
 * Слухачі подій
 */

if (createTaskBtn) createTaskBtn.onclick = createNewTask;

if (taskInputField) {
  taskInputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") createNewTask();
  });
}

// Перемикання пріоритетів
document.querySelectorAll(".prio-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPriority = btn.dataset.p;
  });
});

// Фільтрація
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.f;
    renderApp();
  });
});

// Масове видалення (оптимізовано через Promise.all)
if (purgeTasksBtn) {
  purgeTasksBtn.onclick = async () => {
    if (!confirm("Delete all current tasks?")) return;
    try {
      const deletePromises = taskRegistry.map((t) =>
          fetch(`/api/tasks/${t.id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      await syncTasks();
    } catch (err) {
      console.error("Purge error:", err);
    }
  };
}

// Початковий запуск
syncTasks();s();