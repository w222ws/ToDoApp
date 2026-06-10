type Priority = 'low' | 'medium' | 'high';
type FilterType = 'all' | 'active' | 'done';

interface Task {
    id: string;
    text: string;
    done: boolean;
    priority: Priority;
}

const appState = {
    tasks: [] as Task[],
    selectedPriority: 'low' as Priority,
    activeFilter: 'all' as FilterType
};

const DOM = {
    taskInput: document.getElementById("taskInput") as HTMLInputElement | null,
    createBtn: document.getElementById("addBtn") as HTMLButtonElement | null,
    taskContainer: document.getElementById("tasksList") as HTMLDivElement | null,
    purgeBtn: document.getElementById("clearDone") as HTMLButtonElement | null
};

function validateElements(): void {
    if (!DOM.taskInput || !DOM.createBtn || !DOM.taskContainer || !DOM.purgeBtn) {
        console.error("Critical error: element not found!");
        throw new Error("Can't start");
    }
}

validateElements();

async function syncTasks(): Promise<void> {
    try {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error("Network error");
        taskRegistry = await response.json() as Task[];
        renderApp();
    } catch (err) {
        console.error("Sync failed:", err);
    }
}

async function createNewTask(): Promise<void> {
    const content = taskInputField.value.trim();
    if (!content) return;

    const payload = {text: content, priority: selectedPriority};

    try {
        const res = await fetch("/api/tasks", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            const data = await res.json() as Task;
            taskRegistry.push(data);
            taskInputField.value = "";
            renderApp();
        }
    } catch (err) {
        console.error("Creation error:", err);
    }
}

async function removeTask(taskId: string): Promise<void> {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {method: "DELETE"});
        if (res.ok) {
            taskRegistry = taskRegistry.filter((item) => String(item.id) !== String(taskId));
            renderApp();
        }
    } catch (err) {
        console.error("Deletion failed:", err);
    }
}

async function toggleTaskStatus(taskId: string): Promise<void> {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {method: "PATCH"});
        if (res.ok) {
            const updated = await res.json() as Task;
            taskRegistry = taskRegistry.map((t) => (String(t.id) === String(taskId) ? updated : t));
            renderApp();
        }
    } catch (err) {
        console.error("Toggle error:", err);
    }
}

async function updateTaskContent(taskId: string, currentText: string): Promise<void> {
    const updatedText = prompt("Edit your task:", currentText);

    if (updatedText?.trim()) {
        try {
            const res = await fetch(`/api/tasks/${taskId}/text`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({text: updatedText.trim()}),
            });

            if (res.ok) {
                const result = await res.json() as Task;
                taskRegistry = taskRegistry.map((t) => (String(t.id) === String(taskId) ? result : t));
                renderApp();
            }
        } catch (err) {
            console.error("Edit error:", err);
        }
    }
}

function refreshStatistics(): void {
    const total = taskRegistry.length;
    const completed = taskRegistry.filter((t) => t.done).length;
    const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);

    const uiTotal = document.querySelector(".stat-card #statTotal");
    const uiActive = document.querySelector(".stat-card #statActive");
    const uiDone = document.querySelector(".stat-card #statDone");

    if (uiTotal) uiTotal.textContent = total.toString();
    if (uiActive) uiActive.textContent = (total - completed).toString();
    if (uiDone) uiDone.textContent = completed.toString();

    const bar = document.getElementById("progressFill");
    const label = document.getElementById("progressLabel");

    if (bar) bar.style.width = `${ratio}%`;
    if (label) label.textContent = `${ratio}%`;
}

function renderApp(): void {
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

if (createTaskBtn) createTaskBtn.onclick = createNewTask;

if (taskInputField) {
    taskInputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") createNewTask();
    });
}

document.querySelectorAll(".prio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedPriority = (btn as HTMLButtonElement).dataset.p as 'low' | 'medium' | 'high' ?? 'low';
    });
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = (btn as HTMLButtonElement).dataset.f ?? 'all'
        renderApp();
    });
});

if (purgeTasksBtn) {
    purgeTasksBtn.onclick = async () => {
        if (!confirm("Delete all current tasks?")) return;
        try {
            const deletePromises = taskRegistry.map((t) =>
                fetch(`/api/tasks/${t.id}`, {method: "DELETE"})
            );
            await Promise.all(deletePromises);
            await syncTasks();
        } catch (err) {
            console.error("Purge error:", err);
        }
    };
}


syncTasks();