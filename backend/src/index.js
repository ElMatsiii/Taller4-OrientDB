import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './modules/orientdb.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

console.log('Configuración Ollama:', {
  OLLAMA_URL: process.env.OLLAMA_URL,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,
});

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api', chatRoutes);

const PORT = process.env.PORT || 3001;

async function warmupOllama() {
  try {
    console.log('Calentando modelo Ollama...');
    await fetch(`${process.env.OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        messages: [{ role: 'user', content: 'hola' }],
        stream: false,
        keep_alive: -1  // ← mantener en memoria indefinidamente
      })
    });
    console.log('Modelo listo.');
  } catch (e) {
    console.warn('Warmup falló:', e.message);
  }
}

initDB()
  .then(async () => {
    await warmupOllama();
    app.listen(PORT, () => {
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Chat IA Local listo!');
        console.log('  Abre: http://localhost:5173');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
    });
  })
  .catch(err => {
    console.error('Error al conectar con OrientDB:', err.message);
    process.exit(1);
  });