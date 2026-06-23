import express, {Request, Response, NextFunction} from 'express';
import fs from 'fs';
import path from 'path';

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    text: string;
    done: boolean;
    priority: Priority;
}

const PORT: number = 3000;
const FILE_PATH: string = path.join(__dirname, 'tasks.json');
const app = express();

app.use(express.json());

app.use(express.static(path.resolve(__dirname, './')));