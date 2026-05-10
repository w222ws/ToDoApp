const express = require("express");
const fs = require("fs");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("./"));

const FILE_PATH = "tasks.json";

// 1. Функція для збереження (викликаємо її щоразу, коли міняємо масив)
const saveToFile = () => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2));
};

// 2. ЗАВАНТАЖЕННЯ (Тільки один раз!)
// Ми читаємо файл, якщо він є. Якщо немає — створюємо порожній масив.
let tasks = fs.existsSync(FILE_PATH)
  ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
  : [];

// 3. ВАЛІДАЦІЯ (Прослойка)
const validateTask = (req, res, next) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    console.log("Помилка: Спроба додати порожню задачу");
    return res.status(400).json({ error: "Текст не може бути порожнім!" });
  }
  next();
};

// --- РОУТИ (МАРШРУТИ) ---

// Отримати всі
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// Додати
app.post("/api/tasks", validateTask, (req, res) => {
  const newTask = {
    id: Date.now().toString(),
    text: req.body.text,
    done: false,
    priority: req.body.priority || "low",
  };
  tasks.push(newTask);
  saveToFile(); // Зберігаємо в файл
  console.log("Додано:", newTask.text);
  res.status(201).json(newTask);
});

// Видалити
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  tasks = tasks.filter((t) => t.id.toString() !== id.toString());
  saveToFile(); // Зберігаємо зміни
  console.log("Видалено ID:", id);
  res.status(204).send();
});

// Оновити (галочка)
app.patch("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const task = tasks.find((t) => t.id.toString() === id.toString());
  if (task) {
    task.done = !task.done;
    saveToFile(); // Зберігаємо зміни
    res.json(task);
  } else {
    res.status(404).send("Не знайдено");
  }
});

// Ми використовуємо PATCH, бо міняємо тільки шматочок (текст)
app.patch("/api/tasks/:id/text", validateTask, (req, res) => {
  const { id } = req.params; // Витягли ID з адреси
  const { text } = req.body; // Витягли новий ТЕКСТ з тіла запиту (JSON)

  const task = tasks.find((t) => t.id.toString() === id.toString());

  if (task) {
    task.text = text; // Оновили текст у нашому масиві
    saveToFile(); // Записали в блокнот (tasks.json)
    res.json(task); // Віддали оновлену задачу фронтенду
  } else {
    res.status(404).json({ error: "Задача не знайдена!" });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер залетів на http://localhost:${PORT}`);
});
