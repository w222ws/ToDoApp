// подключаю библиотеку
const express = require("express");
// кидаю функцию  express в перем app
const app = express();
// подкл порт
const PORT = 3000;

// кидаю прослойки
app.use(express.json());
app.use(express.static("./"));

// --- НОВЕ: Наш склад задач ---
let tasks = []; // Поки що в пам'яті, при перезавантаженні сервера він очиститься

// --- НОВЕ: Маршрути для даних ---

// 1. Отримати всі задачі
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// 2. Додати нову задачу
app.post("/api/tasks", (req, res) => {
  // Те, що ми витягуємо з req.body, прийде з фронтенда
  const newTask = {
    id: Date.now(), // Робимо унікальний ID на бекенді
    text: req.body.text,
    done: false,
    priority: req.body.priority || "low",
  };

  tasks.push(newTask);
  console.log("Додано:", newTask);

  // Відповідаємо фронтенду, що все гуд
  res.status(201).json(newTask);
});

// Запуск сервера — теж лишаємо
app.listen(PORT, () => {
  console.log(`Сервер пішов на http://localhost:${PORT}`);
});
