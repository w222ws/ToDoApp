//  Стан

const state = {
  tasks: [],
  priority: "low",
  filter: "all",
};

// DOM

const $ = (id) => document.getElementById(id);

const dom = {
  input:     $("taskInput"),
  addBtn:    $("addBtn"),
  list:      $("tasksList"),
  clearBtn:  $("clearDone"),
  template:  $("task-item-template"),
  statTotal: $("statTotal"),
  statActive:$("statActive"),
  statDone:  $("statDone"),
  progressBar:   $("progressFill"),
  progressLabel: $("progressLabel"),
};

//  API

/**
 * Єдина точка для всіх запитів до сервера.
 * Кидає Error з текстом від сервера якщо відповідь не OK.
 */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (res.status === 204) return null; // No Content — нормально для DELETE

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Помилка ${res.status}`);
  }

  return data;
}

//  Дії

async function loadTasks() {
  try {
    state.tasks = await apiFetch("/api/tasks");
    render();
  } catch (err) {
    console.error("[sync]", err.message);
  }
}

async function addTask() {
  const text = dom.input.value.trim();
  if (!text) return;

  try {
    const task = await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ text, priority: state.priority }),
    });
    state.tasks.push(task);
    dom.input.value = "";
    render();
  } catch (err) {
    console.error("[add]", err.message);
  }
}

async function deleteTask(id) {
  try {
    await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
    state.tasks = state.tasks.filter((t) => t.id !== id);
    render();
  } catch (err) {
    console.error("[delete]", err.message);
  }
}

async function toggleTask(id) {
  try {
    const updated = await apiFetch(`/api/tasks/${id}`, { method: "PATCH" });
    state.tasks = state.tasks.map((t) => (t.id === id ? updated : t));
    render();
  } catch (err) {
    console.error("[toggle]", err.message);
  }
}

async function saveEdit(id, newText) {
  const trimmed = newText.trim();

  if (!trimmed) {
    cancelEdit(id);
    return;
  }

  try {
    const updated = await apiFetch(`/api/tasks/${id}/text`, {
      method: "PATCH",
      body: JSON.stringify({ text: trimmed }),
    });
    state.tasks = state.tasks.map((t) => (t.id === id ? updated : t));
    render();
  } catch (err) {
    console.error("[edit]", err.message);
    cancelEdit(id);
  }
}

async function clearAll() {
  if (!confirm("Видалити всі задачі?")) return;

  try {
    // Паралельно видаляємо всі задачі
    await Promise.all(
        state.tasks.map((t) => apiFetch(`/api/tasks/${t.id}`, { method: "DELETE" }))
    );
    await loadTasks();
  } catch (err) {
    console.error("[clear]", err.message);
  }
}

// Inline-редагування

/**
 * Замінюємо <span> на <input> прямо в задачі.
 * Ніякого prompt() — він блокує JS і не стилізується.
 */
function startEdit(id, spanEl) {
  const input = document.createElement("input");
  input.className = "task-edit-input";
  input.value = spanEl.textContent;
  input.maxLength = 300;
  spanEl.replaceWith(input);
  input.focus();
  input.select();

  let committed = false; // захист від подвійного збереження (blur + Enter)

  const commit = () => {
    if (committed) return;
    committed = true;
    saveEdit(id, input.value);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancelEdit(id);
  });
  input.addEventListener("blur", commit);
}

// Відміна редагування — повертаємо span без перемальовки всього списку
function cancelEdit(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  const input = dom.list.querySelector(`[data-id="${id}"] .task-edit-input`);
  if (!input) return;

  const span = document.createElement("span");
  span.className = "task-text";
  span.textContent = task.text; // textContent — безпечно, не інтерпретує HTML
  span.addEventListener("dblclick", () => startEdit(id, span));
  input.replaceWith(span);
}

// Рендеринг

/**
 * Будуємо задачу через <template> — без innerHTML з рядковою магією.
 * textContent замість innerHTML скрізь де виводимо дані від юзера — захист від XSS.
 */
function createTaskNode(task) {
  const clone = dom.template.content.cloneNode(true);
  const node = clone.querySelector(".task-item");

  node.dataset.id = task.id;
  node.classList.toggle("done", task.done);
  node.classList.add(`prio-${task.priority}`);

  const checkbox = node.querySelector(".task-check");
  checkbox.checked = task.done;
  checkbox.dataset.action = "toggle";
  checkbox.dataset.id = task.id;

  const span = node.querySelector(".task-text");
  span.textContent = task.text; // НЕ innerHTML — захист від XSS
  span.addEventListener("dblclick", () => startEdit(task.id, span));

  const badge = node.querySelector(".prio-tag");
  badge.textContent = task.priority;
  badge.className = `prio-tag ${task.priority}`;

  const delBtn = node.querySelector(".del-btn");
  delBtn.dataset.action = "delete";
  delBtn.dataset.id = task.id;

  return node;
}

function updateStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  const ratio = total === 0 ? 0 : Math.round((done / total) * 100);

  if (dom.statTotal)  dom.statTotal.textContent  = total;
  if (dom.statActive) dom.statActive.textContent = total - done;
  if (dom.statDone)   dom.statDone.textContent   = done;
  if (dom.progressBar)   dom.progressBar.style.width = `${ratio}%`;
  if (dom.progressLabel) dom.progressLabel.textContent = `${ratio}%`;
}

function getFilteredTasks() {
  return state.tasks.filter((t) => {
    switch (state.filter) {
      case "active": return !t.done;
      case "done":   return t.done;
      case "high":   return t.priority === "high";
      default:       return true;
    }
  });
}

function render() {
  if (!dom.list) return;

  const filtered = getFilteredTasks();
  dom.list.innerHTML = "";

  if (filtered.length === 0) {
    dom.list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <h3>No tasks found</h3>
        <p>Your list is currently empty.</p>
      </div>`;
  } else {
    // DocumentFragment — один reflow замість N перемальовок
    const fragment = document.createDocumentFragment();
    filtered.forEach((task) => fragment.appendChild(createTaskNode(task)));
    dom.list.appendChild(fragment);
  }

  updateStats();
}

// Event delegation

/**
 * Один обробник на весь список замість onclick на кожному елементі.
 * Працює і для динамічно доданих задач.
 */
dom.list?.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;

  const { action, id } = target.dataset;
  if (action === "toggle") toggleTask(id);
  if (action === "delete") deleteTask(id);
});

// Слухачі

dom.addBtn?.addEventListener("click", addTask);

dom.input?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// Обмеження довжини прямо в інпуті (UX)
dom.input?.setAttribute("maxlength", "300");

dom.clearBtn?.addEventListener("click", clearAll);

// Вибір пріоритету
document.querySelectorAll(".prio-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.priority = btn.dataset.p;
  });
});

// Фільтри
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.filter = btn.dataset.f;
    render();
  });
});

// Старт

loadTasks();