/* =========================================================
   TaskFlow — script.js (Еталонна версія)
   ========================================================= */

// 1. СТАН (STATE)
let tasks = [];
let currentPriority = "low";
let filter = "all";

// 2. СЕЛЕКТОРИ (Елементи з HTML)
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksList = document.getElementById("tasksList");

// 3. ФУНКЦІЇ-ЗАПИТИ ДО СЕРВЕРА (API)

// Отримати всі задачі при старті
async function fetchTasks() {
  try {
    const response = await fetch("/api/tasks");
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error("Помилка завантаження:", error);
  }
}

// Додати нову задачу
async function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTaskData = { text, priority: currentPriority };

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTaskData),
    });

    if (response.ok) {
      const savedTask = await response.json();
      tasks.push(savedTask);
      taskInput.value = "";
      renderTasks();
    }
  } catch (error) {
    console.error("Помилка додавання:", error);
  }
}

// Видалити задачу
async function deleteTask(id) {
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      tasks = tasks.filter((t) => t.id !== id);
      renderTasks();
    }
  } catch (error) {
    console.error("Помилка видалення:", error);
  }
}

// Змінити статус (Виконано/Не виконано)
async function toggleTask(id) {
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
    });

    if (response.ok) {
      const updatedTask = await response.json();
      tasks = tasks.map((t) => (t.id === id ? updatedTask : t));
      renderTasks();
    }
  } catch (error) {
    console.error("Помилка зміни статусу:", error);
  }
}

// 4. МАЛЮВАННЯ ІНТЕРФЕЙСУ (RENDER)
function renderTasks() {
  tasksList.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.done;
    if (filter === "done") return task.done;
    if (filter === "high") return task.priority === "high";
    return true;
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = `<div class="empty-state"><h3>Nothing here yet...</h3></div>`;
  }

  filteredTasks.forEach((task) => {
    const taskItem = document.createElement("div");
    taskItem.className = `task-item prio-${task.priority} ${task.done ? "done" : ""}`;

    taskItem.innerHTML = `
            <button class="check-btn ${task.done ? "done" : ""}" onclick="toggleTask('${task.id}')">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <div class="task-body">
                <p class="task-text">${task.text}</p>
                <div class="task-meta">
                    <span class="prio-badge ${task.priority}">${task.priority}</span>
                </div>
            </div>
            <button class="del-btn" onclick="deleteTask('${task.id}')">✕</button>
        `;
    tasksList.appendChild(taskItem);
  });

  updateStats();
}

function updateStats() {
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  document.getElementById("statTotal").innerText = total;
  document.getElementById("statActive").innerText = total - doneCount;
  document.getElementById("statDone").innerText = doneCount;
  document.getElementById("progressFill").style.width = `${percent}%`;
  document.getElementById("progressLabel").innerText = `${percent}%`;
}

// 5. ІВЕНТИ (Слухачі подій)
addBtn.onclick = addTask;

taskInput.onkeypress = (e) => {
  if (e.key === "Enter") addTask();
};

const clearDoneBtn = document.getElementById("clearDone");

clearDoneBtn.onclick = async () => {
  if (!confirm("Видалити всі важливі задачі?")) return;

  // Шукаємо тільки важливі (high)
  const highPriorityTasks = tasks.filter((t) => t.priority === "high");

  // Видаляємо їх по черзі через наш fetch-запит
  for (const task of highPriorityTasks) {
    await deleteTask(task.id);
  }
  console.log("Всі важливі видалені!");
};

document.querySelectorAll(".prio-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".prio-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentPriority = btn.dataset.p;
  };
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.f;
    renderTasks();
  };
});

// 6. СТАРТ
fetchTasks();
