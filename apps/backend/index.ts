import { configDotenv } from 'dotenv';
configDotenv();

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'

import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import { preSignRouter } from './routes/preSign';
import { dbSaveRouter } from './routes/saveToDB';
import { chatRouter } from './routes/ai_chat';
import { documentChatRouter } from './routes/ai_chat/documentChat';
import { authMiddleWare } from './middlewares/authMiddleWare';
import { WebSocketHandler } from './utils/WebSocketHandler';

const app = express();
const server = createServer(app);

const port = process.env.DEV_SERVER_PORT

app.use(express.json())

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));


app.all('/api/auth/*slug', toNodeHandler(auth));

app.use("/api/v1", authMiddleWare); // get access to the current logged in user

// Routes related to pre signature
app.use('/api/v1/pre-sign', preSignRouter);

// Routes related to saving file metadata
app.use('/api/v1/file', dbSaveRouter);

// Routes related to Ai chat and conversations, session handling
app.use('/api/v1/chat', chatRouter);

// Routes for document-specific chat sessions and conversation history
app.use('/api/v1/document-chat', documentChatRouter);

app.get('/hello', (_, res) => {
    return res.status(200).json({
        "message": "Welcome to Node JS backend"
    })
});

const wsHandler = new WebSocketHandler(server);

server.listen(port, () => { console.info(`Server is live on port: ${port}`) });