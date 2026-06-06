import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/orientdb.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'https://localhost:5173' }));
app.use(express.json());
app.use('/api', chatRoutes);

const PORT = process.env.PORT || 3001;

initDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Servidor corriendo en https://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('Error al conectar con OrientDB:', err.message);
        process.exit(1);
    });