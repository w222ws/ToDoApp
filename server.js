const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("./"));

let tasks = [];

// 1. ОТРИМАТИ ВСЕ
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// 2. ДОДАТИ (Окремо!)
app.post("/api/tasks", (req, res) => {
  const newTask = {
    id: Date.now().toString(), // Перетворюємо в рядок відразу, щоб не було проблем!
    text: req.body.text,
    done: false,
    priority: req.body.priority || "low",
  };
  tasks.push(newTask);
  console.log("Додано:", newTask);
  res.status(201).json(newTask);
});

// 3. ВИДАЛИТИ (Тепер він окремо, а не всередині поста!)
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  // Порівнюємо як рядки
  tasks = tasks.filter((t) => t.id.toString() !== id.toString());
  console.log("Видалено Айді:", id);
  res.status(204).send();
});

// 4. ОНОВИТИ (Для галочки)
app.patch("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const task = tasks.find((t) => t.id.toString() === id.toString());
  if (task) {
    task.done = !task.done;
    res.json(task);
  } else {
    res.status(404).send("Не знайдено");
  }
});

app.listen(PORT, () => {
  console.log(`Сервер пішов на http://localhost:${PORT}`);
});
