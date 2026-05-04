/* =========================================================
   TaskFlow — script.js (ПОВНА ВЕРСІЯ: CRUD + Фільтри)
   ========================================================= */

// 1. СТАН (STATE)
let tasks = [];
let currentPriority = "low";
let filter = "all"; // Може бути: 'all', 'active', 'done', 'high'

// 2. СЕЛЕКТОРИ
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksList = document.getElementById("tasksList");
const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statDone = document.getElementById("statDone");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const clearDoneBtn = document.getElementById("clearDone");

// 3. ГОЛОВНА ФУНКЦІЯ МАЛЮВАННЯ (RENDER)
function renderTasks() {
  tasksList.innerHTML = "";

  // --- ЛОГІКА ФІЛЬТРАЦІЇ ---
  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.done;
    if (filter === "done") return task.done;
    if (filter === "high") return task.priority === "high";
    return true; // для 'all'
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

// 4. ДІЇ ІЗ ЗАДАЧАМИ (ACTIONS)
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now().toString(),
    text: text,
    priority: currentPriority,
    done: false,
  };

  tasks.push(newTask);
  taskInput.value = "";
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.done = !task.done;
  renderTasks();
}

// Очистити всі виконані
function clearCompleted() {
  tasks = tasks.filter((t) => !t.done);
  renderTasks();
}

// 5. ОНОВЛЕННЯ СТАТИСТИКИ
function updateStats() {
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const activeCount = total - doneCount;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  statTotal.innerText = total;
  statActive.innerText = activeCount;
  statDone.innerText = doneCount;
  progressFill.style.width = `${percent}%`;
  progressLabel.innerText = `${percent}%`;
}

// 6. ІВЕНТИ (EVENT LISTENERS)[cite: 2]

addBtn.onclick = addTask;

taskInput.onkeypress = (e) => {
  if (e.key === "Enter") addTask();
};

clearDoneBtn.onclick = clearCompleted;

// Вибір пріоритету
document.querySelectorAll(".prio-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".prio-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentPriority = btn.dataset.p;
  };
});

// Керування фільтрами (All, Active, Completed)
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.f; // Беремо значення фільтра з data-f
    renderTasks();
  };
});

// Запуск при старті
renderTasks();
