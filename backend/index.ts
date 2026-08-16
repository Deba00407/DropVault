import { configDotenv } from 'dotenv';
configDotenv();

import express from 'express'
import cors from 'cors'

import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';

const app = express();

const port = process.env.DEV_SERVER_PORT

app.use(cors({origin: "*"})) // allow all routes

app.all('/api/auth/*slug', toNodeHandler(auth));

app.get('/api/v1/hello', (_, res) => {
    return res.status(200).json({
        "message" : "Welcome to Node JS backend"
    })
});

app.listen(port, () => {console.info(`Server is live on port: ${port}`)});