let tasks = [];
let currentPriority = "low"; // за замовчуванням
let filter = "all";

// 2. ЕЛЕМЕНТИ (DOM)
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksList = document.getElementById("tasksList");
const clearAllBtn = document.getElementById("clearDone");

// 3. ФУНКЦІЇ API

async function fetchTasks() {
  try {
    const response = await fetch("/api/tasks");
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error("Помилка завантаження:", error);
  }
}

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

async function deleteTask(id) {
  try {
    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (response.ok) {
      tasks = tasks.filter((t) => String(t.id) !== String(id));
      renderTasks();
    }
  } catch (error) {
    console.error("Помилка видалення:", error);
  }
}

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

// редачить текст тасків, розписую розуміння, даємо знати що буде авайт тому позначаємо функцію асунсом як асинхронку, та даємо в дужки айді та новий текст обнова замість старого, інше як і було, тру типо типу це як перший варік як я розумію чи що, конст відповідь, юзаємо фетч, це наш вказівник на сервер прокладаємо шлях, до апі тасків, по айді і змінна тексту, метод патч зміни патч, голова типу типу шоб бачив файли жсон, тело передаешь типо жсон строчка новий текст отдаешь задачі, ну і все по цьому блоку виправляй всі помилки та добавляй що так не так і т.д
async function editTaskText(id, newText) {
  try {
    const response = await fetch(`/api/tasks/${id}/text`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText }),
    });

    //  условіє типу наша відповідь ок, оновленний таск авайт респонс ну понятно отдаем в жсон же, обновили массив і йдемо рендер робимо, типу про мапили, строку перевірили, айді, текс, і видаємо результ типу)) ну і в кінці правильно, кетч, якщо тру не робе, щоб не падало, просто вивод помилки, прав мене обов'язково!!!

    if (response.ok) {
      const updateTask = await response.json();

      tasks = tasks.map((t) => (String(t.id) === String(id) ? updateTask : t));
      renderTasks();
    }
  } catch (error) {
    console.error("Помилка оновлення тексту:", error);
  }
}

// 4. ЛОГІКА UI (Малювання та Статистика)

function updateStats() {
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  // Оновлюємо лічильники (використовуємо QuerySelector, щоб не плутати дублікати ID)
  const statTotal = document.querySelector(".stat-card #statTotal");
  const statActive = document.querySelector(".stat-card #statActive");
  const statDone = document.querySelector(".stat-card #statDone");

  if (statTotal) statTotal.innerText = total;
  if (statActive) statActive.innerText = total - doneCount;
  if (statDone) statDone.innerText = doneCount;

  // Оновлюємо шкалу
  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");

  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressLabel) progressLabel.innerText = `${percent}%`;
}

function renderTasks() {
  if (!tasksList) return;
  tasksList.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.done;
    if (filter === "done") return task.done;
    if (filter === "high") return task.priority === "high";
    return true;
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <h3>Nothing here yet...</h3>
        <p>Add your first task to get started</p>
      </div>`;
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

// 5. ІВЕНТИ

if (addBtn) addBtn.onclick = addTask;

if (taskInput) {
  taskInput.onkeypress = (e) => {
    if (e.key === "Enter") addTask();
  };
}

// Пріоритети (Керування активним станом кнопок)
document.querySelectorAll(".prio-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".prio-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentPriority = btn.dataset.p;
  };
});

// Фільтри
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

// Очищення (Clear All)
if (clearAllBtn) {
  clearAllBtn.onclick = async () => {
    if (!confirm("Are you sure you want to delete all tasks?")) return;
    try {
      for (const task of tasks) {
        await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      }
      await fetchTasks();
    } catch (error) {
      console.error("Помилка очищення:", error);
    }
  };
}

// 6. СТАРТ
fetchTasks();
