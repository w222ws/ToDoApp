const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_PATH = "tasks.json";

// Константи

const PRIORITIES = ["low", "medium", "high"];
const MAX_TEXT_LENGTH = 300;

//  Персистентність

let tasks = [];

const loadTasks = () => {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : []; // захист від зіпсованого файлу
  } catch (err) {
    console.error("[DB] Не вдалося завантажити tasks.json:", err.message);
    return [];
  }
};

const saveTasks = () => {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error("[DB] Не вдалося зберегти tasks.json:", err.message);
  }
};

tasks = loadTasks();
console.log(`[DB] Завантажено ${tasks.length} задач`);

// Middleware

app.use(express.json());
app.use(express.static("./"));

// Логування кожного запиту
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// Валідація тексту задачі
const validateTaskText = (req, res, next) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Поле 'text' обов'язкове" });
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return res.status(400).json({ error: "Текст не може бути порожнім" });
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      error: `Максимум ${MAX_TEXT_LENGTH} символів`,
    });
  }

  req.body.text = trimmed; // нормалізуємо до обрізаного тексту
  next();
};

// Хелпер

const findTask = (id) => tasks.find((t) => t.id === id);

// Роути

// GET /api/tasks — всі задачі
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// POST /api/tasks — нова задача
app.post("/api/tasks", validateTaskText, (req, res) => {
  const { text, priority } = req.body;

  const task = {
    id: Date.now().toString(),
    text,
    done: false,
    priority: PRIORITIES.includes(priority) ? priority : "low", // захист від невалідного пріоритету
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  saveTasks();

  console.log(`[+] "${task.text}" [${task.priority}]`);
  res.status(201).json(task);
});

// DELETE /api/tasks/:id — видалити задачу
app.delete("/api/tasks/:id", (req, res) => {
  const index = tasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Задача не знайдена" });
  }

  tasks.splice(index, 1); // splice замість filter: мутуємо масив без перестворення
  saveTasks();

  console.log(`[-] Видалено ID: ${req.params.id}`);
  res.status(204).send();
});

// PATCH /api/tasks/:id — перемкнути done
app.patch("/api/tasks/:id", (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Задача не знайдена" });

  task.done = !task.done;
  saveTasks();
  res.json(task);
});

// PATCH /api/tasks/:id/text — оновити текст
app.patch("/api/tasks/:id/text", validateTaskText, (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Задача не знайдена" });

  task.text = req.body.text;
  saveTasks();
  res.json(task);
});

// Fallback 404

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не знайдено" });
});

// Старт

app.listen(PORT, () => {
  console.log(`\nСервер запущено: http://localhost:${PORT}\n`);
});