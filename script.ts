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
    taskInput: document.querySelector('#taskInput') as HTMLInputElement | null,
    createBtn: document.querySelector('#addBtn') as HTMLButtonElement | null,
    taskContainer: document.querySelector('#tasksList') as HTMLDivElement | null,
    purgeBtn: document.querySelector('#clearDone') as HTMLButtonElement | null,

    uiTotal: document.querySelector('.stat-card #statTotal') as HTMLSpanElement | null,
    uiActive: document.querySelector('.stat-card #statActive') as HTMLSpanElement | null,
    uiDone: document.querySelector('.stat-card #statDone') as HTMLSpanElement | null,
    progressBar: document.querySelector('#progressFill') as HTMLDivElement | null,
    progressLabel: document.querySelector('#progressLabel') as HTMLSpanElement | null
};

function validateElements(): void {
    if (!DOM.taskInput || !DOM.createBtn || !DOM.taskContainer || !DOM.purgeBtn
        || !DOM.uiTotal || !DOM.uiActive || !DOM.uiDone || !DOM.progressBar || !DOM.progressLabel) {
        console.error("Critical error: element not found!");
        throw new Error("Can't start");
    }
}

validateElements();

async function syncTasks(): Promise<void> {

    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            throw new Error(`Reject net: ${response.status} ${response.statusText}`);
        }
        const data = await response.json() as Task[];

        appState.tasks = data;

        renderApp();

    } catch (error) {
        console.error(error);
    }
}

async function createNewTask(): Promise<void> {
    const input = DOM.taskInput;
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    const payload = {
        text: content,
        priority: appState.selectedPriority
    };

    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`No task: ${res.status} ${res.statusText}`);
        }

        const newTask = await res.json() as Task;

        appState.tasks.push(newTask);

        input.value = '';

        renderApp();
    } catch (err) {
        console.error(err);
    }
}

async function removeTask(taskId: string): Promise<void> {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {method: 'DELETE'});

        if (!res.ok) {
            throw new Error(`Task deletion failed: ${res.status} ${res.statusText}`);
        }

        appState.tasks = appState.tasks.filter((item) => String(item.id) !== String(taskId));

        renderApp();
    } catch (err) {
        console.error(err);
    }
}

async function toggleTaskStatus(taskId: string): Promise<void> {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {method: "PATCH"});

        if (!res.ok) {
            throw new Error(`Not found status: ${res.status} ${res.statusText}`);
        }

        const updated = await res.json() as Task;

        appState.tasks = appState.tasks.map((t) => (String(t.id) === String(taskId) ? updated : t));

        renderApp();

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

            if (!res.ok) {
                throw new Error(`Reject update text: ${res.status} ${res.statusText}`);
            }

            const result = await res.json() as Task;

            appState.tasks = appState.tasks.map((t) => (String(t.id) === String(taskId) ? result : t));

            renderApp();

        } catch (err) {
            console.error("Edit error:", err);
        }
    }
}

function refreshStatics(): void {

    const total = appState.tasks.length;
    const completed = appState.tasks.filter((t) => t.done).length;
    const active = total - completed;

    const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (DOM.uiTotal) DOM.uiTotal.textContent = total.toString();
    if (DOM.uiActive) DOM.uiActive.textContent = active.toString();
    if (DOM.uiDone) DOM.uiDone.textContent = completed.toString();

    if (DOM.progressBar) DOM.progressBar.style.width = `${ratio}%`
    if (DOM.progressLabel) DOM.progressLabel.style.width = `${ratio}%`
}

function renderApp(): void {
    const container = DOM.taskContainer;
    if (!container) return;

    container.innerHTML = '';

    const displayList = appState.tasks.filter((item) => {
        if (appState.activeFilter === 'active') return !item.done;
        if (appState.activeFilter === 'done') return item.done;
        return true;
    });

    if (displayList.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✦</div>
        <h3>No tasks found</h3>
        <p>Your list is currently empty.</p>
      </div>`;
        refreshStatics();
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
        container.appendChild(node);
    });

    refreshStatics();
}

if (DOM.createBtn) DOM.createBtn.onclick = createNewTask;

if (DOM.taskInput) {
    DOM.taskInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") createNewTask();
    });
}

document.querySelectorAll(".prio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        appState.selectedPriority = (btn as HTMLButtonElement).dataset.p as 'low' | 'medium' | 'high' ?? 'low';
    });
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        appState.activeFilter = ((btn as HTMLButtonElement).dataset.f as 'all' | 'active' | 'done') ?? 'all';
        renderApp();
    });
});

if (DOM.purgeBtn) {
    DOM.purgeBtn.onclick = async () => {
        if (!confirm("Delete all current tasks?")) return;
        try {
            const deletePromises = appState.tasks
                .filter((t) => t.done)
                .map((t) => fetch(`/api/tasks/${t.id}`, {method: "DELETE"})
                );
            await Promise.all(deletePromises);
            await syncTasks();
        } catch (err) {
            console.error("Purge error:", err);
        }
    };
}


syncTasks();