/* =========================================================
   TaskFlow — script.js (Fullstack Edition)
   ========================================================= */

// 1. СТАН ДОДАТКУ
let tasks = [];
let currentPriority = "low"; // за замовчуванням
let filter = "all";

// 2. ЕЛЕМЕНТИ
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksList = document.getElementById("tasksList");
const clearAllBtn = document.getElementById("clearDone"); // Твоя кнопка очищення

// 3. РОБОТА З СЕРВЕРОМ (API)

// Отримати всі задачі
async function fetchTasks() {
  try {
    const response = await fetch("/api/tasks");
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error("Помилка завантаження:", error);
  }
}

// Додати задачу
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

// Видалити одну задачу
async function deleteTask(id) {
  try {
    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (response.ok) {
      // Видаляємо з локального масиву (String для надійності)
      tasks = tasks.filter((t) => String(t.id) !== String(id));
      renderTasks();
    }
  } catch (error) {
    console.error("Помилка видалення:", error);
  }
}

// Змінити статус (PATCH - той самий 4-й метод!)
async function toggleTask(id) {
  try {
    const response = await fetch(`/api/tasks/${id}`, { method: "PATCH" });
    if (response.ok) {
      const updatedTask = await response.json();
      tasks = tasks.map((t) => (String(t.id) === String(id) ? updatedTask : t));
      renderTasks();
    }
  } catch (error) {
    console.error("Помилка оновлення:", error);
  }
}

// 4. ЛОГІКА МАЛЮВАННЯ (UI)

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
    // Додаємо класи для фарбування з CSS
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

// 5. ІВЕНТИ (Слухачі)

addBtn.onclick = addTask;

taskInput.onkeypress = (e) => {
  if (e.key === "Enter") addTask();
};

// --- CLEAR ALL (Видалити ВСЕ) ---
clearAllBtn.onclick = async () => {
  if (!confirm("Видалити взагалі всі задачі?")) return;

  try {
    // Видаляємо всі по черзі
    for (const task of tasks) {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    }
    await fetchTasks(); // Перезавантажуємо пустий список
    alert("Все чисто, лодарю! :)");
  } catch (error) {
    console.error("Помилка масового видалення:", error);
  }
};

// --- ПРІОРИТЕТИ (Твій CSS запрацює тут) ---
document.querySelectorAll(".prio-btn").forEach((btn) => {
  btn.onclick = () => {
    // Знімаємо active у всіх
    document
      .querySelectorAll(".prio-btn")
      .forEach((b) => b.classList.remove("active"));
    // Додаємо active поточній
    btn.classList.add("active");
    // Оновлюємо змінну (важливо, щоб співпадало з data-p в HTML)
    currentPriority = btn.dataset.p;
  };
});

// --- ФІЛЬТРИ ---
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

// 6. ПУСК
fetchTasks();
