import express, {Request, Response, NextFunction} from "express";
import fs from "fs";

interface Task {
    id: string;
    text: string;
    done: boolean;
    priority: 'low' | 'medium' | 'high';
}

const app = express();
const PORT: number = 3000;

app.use(express.json());
app.use(express.static("./"));

const FILE_PATH: string = "tasks.json";

const saveToFile = (): void => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2));
};

let tasks: Task[] = fs.existsSync(FILE_PATH)
    ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
    : [];

const validateTask = (req: Request, res: Response, next: NextFunction) => {
    const {text} = req.body;
    if (!text || text.trim() === "") {
        console.log("Помилка: Спроба додати порожню задачу");
        return res.status(400).json({error: "Текст не може бути порожнім!"});
    }
    next();
};

app.get("/api/tasks", (req: Request, res: Response) => {
    res.json(tasks);
});

app.post("/api/tasks", validateTask, (req: Request, res: Response) => {
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

app.delete("/api/tasks/:id", (req: Request, res: Response) => {
    const {id} = req.params;
    tasks = tasks.filter((t) => t.id.toString() !== id.toString());
    saveToFile();
    console.log("Видалено ID:", id);
    res.status(204).send();
});

app.patch("/api/tasks/:id", (req: Request, res: Response) => {
    const {id} = req.params;
    const task = tasks.find((t) => t.id.toString() === id.toString());
    if (task) {
        task.done = !task.done;
        saveToFile();
        res.json(task);
    } else {
        res.status(404).send("Не знайдено");
    }
});

app.patch("/api/tasks/:id/text", validateTask, (req: Request, res: Response) => {
    const {id} = req.params;
    const {text} = req.body;

    const task = tasks.find((t) => t.id.toString() === id.toString());

    if (task) {
        task.text = text;
        saveToFile();
        res.json(task);
    } else {
        res.status(404).json({error: "Задача не знайдена!"});
    }
});

app.listen(PORT, () => {
    console.log(`Сервер залетів на http://localhost:${PORT}`);
});