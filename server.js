"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.use(express_1.default.static("./"));
const FILE_PATH = "tasks.json";
const saveToFile = () => {
    fs_1.default.writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2));
};
let tasks = fs_1.default.existsSync(FILE_PATH)
    ? JSON.parse(fs_1.default.readFileSync(FILE_PATH, "utf-8"))
    : [];
const validateTask = (req, res, next) => {
    const { text } = req.body;
    if (!text || text.trim() === "") {
        console.log("Помилка: Спроба додати порожню задачу");
        return res.status(400).json({ error: "Текст не може бути порожнім!" });
    }
    next();
};
app.get("/api/tasks", (req, res) => {
    res.json(tasks);
});
app.post("/api/tasks", validateTask, (req, res) => {
    const newTask = {
        id: Date.now().toString(),
        text: req.body.text,
        done: false,
        priority: req.body.priority || "low",
    };
    tasks.push(newTask);
    saveToFile();
    console.log("Додано:", newTask.text);
    res.status(201).json(newTask);
});
app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    tasks = tasks.filter((t) => t.id.toString() !== id.toString());
    saveToFile();
    console.log("Видалено ID:", id);
    res.status(204).send();
});
app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const task = tasks.find((t) => t.id.toString() === id.toString());
    if (task) {
        task.done = !task.done;
        saveToFile();
        res.json(task);
    }
    else {
        res.status(404).send("Не знайдено");
    }
});
app.patch("/api/tasks/:id/text", validateTask, (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const task = tasks.find((t) => t.id.toString() === id.toString());
    if (task) {
        task.text = text;
        saveToFile();
        res.json(task);
    }
    else {
        res.status(404).json({ error: "Задача не знайдена!" });
    }
});
app.listen(PORT, () => {
    console.log(`Сервер залетів на http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map