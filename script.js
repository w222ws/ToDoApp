"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let taskRegistry = [];
let selectedPriority = "low";
let activeFilter = "all";
const taskInputField = document.getElementById("taskInput");
const createTaskBtn = document.getElementById("addBtn");
const taskContainer = document.getElementById("tasksList");
const purgeTasksBtn = document.getElementById("clearDone");
function syncTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch("/api/tasks");
            if (!response.ok)
                throw new Error("Network error");
            taskRegistry = (yield response.json());
            renderApp();
        }
        catch (err) {
            console.error("Sync failed:", err);
        }
    });
}
function createNewTask() {
    return __awaiter(this, void 0, void 0, function* () {
        const content = taskInputField.value.trim();
        if (!content)
            return;
        const payload = { text: content, priority: selectedPriority };
        try {
            const res = yield fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const data = yield res.json();
                taskRegistry.push(data);
                taskInputField.value = "";
                renderApp();
            }
        }
        catch (err) {
            console.error("Creation error:", err);
        }
    });
}
function removeTask(taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
            if (res.ok) {
                taskRegistry = taskRegistry.filter((item) => String(item.id) !== String(taskId));
                renderApp();
            }
        }
        catch (err) {
            console.error("Deletion failed:", err);
        }
    });
}
function toggleTaskStatus(taskId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`/api/tasks/${taskId}`, { method: "PATCH" });
            if (res.ok) {
                const updated = yield res.json();
                taskRegistry = taskRegistry.map((t) => (String(t.id) === String(taskId) ? updated : t));
                renderApp();
            }
        }
        catch (err) {
            console.error("Toggle error:", err);
        }
    });
}
function updateTaskContent(taskId, currentText) {
    return __awaiter(this, void 0, void 0, function* () {
        const updatedText = prompt("Edit your task:", currentText);
        if (updatedText === null || updatedText === void 0 ? void 0 : updatedText.trim()) {
            try {
                const res = yield fetch(`/api/tasks/${taskId}/text`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: updatedText.trim() }),
                });
                if (res.ok) {
                    const result = yield res.json();
                    taskRegistry = taskRegistry.map((t) => (String(t.id) === String(taskId) ? result : t));
                    renderApp();
                }
            }
            catch (err) {
                console.error("Edit error:", err);
            }
        }
    });
}
function refreshStatistics() {
    const total = taskRegistry.length;
    const completed = taskRegistry.filter((t) => t.done).length;
    const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);
    const uiTotal = document.querySelector(".stat-card #statTotal");
    const uiActive = document.querySelector(".stat-card #statActive");
    const uiDone = document.querySelector(".stat-card #statDone");
    if (uiTotal)
        uiTotal.textContent = total.toString();
    if (uiActive)
        uiActive.textContent = (total - completed).toString();
    if (uiDone)
        uiDone.textContent = completed.toString();
    const bar = document.getElementById("progressFill");
    const label = document.getElementById("progressLabel");
    if (bar)
        bar.style.width = `${ratio}%`;
    if (label)
        label.textContent = `${ratio}%`;
}
function renderApp() {
    if (!taskContainer)
        return;
    taskContainer.innerHTML = "";
    const displayList = taskRegistry.filter((item) => {
        if (activeFilter === "active")
            return !item.done;
        if (activeFilter === "done")
            return item.done;
        if (activeFilter === "high")
            return item.priority === "high";
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
if (createTaskBtn)
    createTaskBtn.onclick = createNewTask;
if (taskInputField) {
    taskInputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
            createNewTask();
    });
}
document.querySelectorAll(".prio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        var _a;
        document.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedPriority = (_a = btn.dataset.p) !== null && _a !== void 0 ? _a : 'low';
    });
});
document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        var _a;
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = (_a = btn.dataset.f) !== null && _a !== void 0 ? _a : 'all';
        renderApp();
    });
});
if (purgeTasksBtn) {
    purgeTasksBtn.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!confirm("Delete all current tasks?"))
            return;
        try {
            const deletePromises = taskRegistry.map((t) => fetch(`/api/tasks/${t.id}`, { method: "DELETE" }));
            yield Promise.all(deletePromises);
            yield syncTasks();
        }
        catch (err) {
            console.error("Purge error:", err);
        }
    });
}
syncTasks();
//# sourceMappingURL=script.js.map