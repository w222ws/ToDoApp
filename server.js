const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_PATH = "tasks.json";

app.use(express.json());
app.use(express.static("./"));

// Завантаження при старті
let tasks = fs.existsSync(FILE_PATH)
    ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
    : [];

const persist = () => fs.writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2));

// Валідація тексту
const validateTask = (req, res, next) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Текст не може бути порожнім!" });
  }
  next();
};

// GET — всі задачі
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// POST — нова задача
app.post("/api/tasks", validateTask, (req, res) => {
  const task = {
    id: Date.now().toString(),
    text: req.body.text.trim(),
    done: false,
    priority: req.body.priority || "low",
  };
  tasks.push(task);
  persist();
  console.log(`[+] Додано: "${task.text}" [${task.priority}]`);
  res.status(201).json(task);
});

// DELETE — видалити задачу
app.delete("/api/tasks/:id", (req, res) => {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== req.params.id);
  if (tasks.length === before) return res.status(404).json({ error: "Не знайдено" });
  persist();
  console.log(`[-] Видалено ID: ${req.params.id}`);
  res.status(204).send();
});

// PATCH — перемкнути done
app.patch("/api/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Не знайдено" });
  task.done = !task.done;
  persist();
  res.json(task);
});

// PATCH — оновити текст
app.patch("/api/tasks/:id/text", validateTask, (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Не знайдено" });
  task.text = req.body.text.trim();
  persist();
  res.json(task);
});

app.listen(PORT, () => console.log(`Сервер на http://localhost:${PORT}`));
