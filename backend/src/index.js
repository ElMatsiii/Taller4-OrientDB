import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './modules/orientdb.js';
import chatRoutes from './routes/chat.js';

// Carga variables de entorno desde .env
dotenv.config();

console.log('Configuración Ollama:', {
  OLLAMA_URL: process.env.OLLAMA_URL,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,
});

const app = express();

// Configura CORS para permitir peticiones desde el frontend
app.use(cors({ origin: 'http://localhost:5173' }));
// Permite recibir JSON en las solicitudes
app.use(express.json());
// Usa las rutas de chat bajo /api
app.use('/api', chatRoutes);

const PORT = process.env.PORT || 3001;

/**
 * Realiza una petición de prueba a Ollama para precalentar el modelo.
 * Esto hace que la primera interacción sea más rápida después del arranque.
 */
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
        keep_alive: -1,
      }),
    });
    console.log('Modelo listo.');
  } catch (error) {
    console.warn('Warmup falló:', error.message);
  }
}

// Inicializa la base de datos y luego arranca el servidor HTTP.
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
  .catch((err) => {
    console.error('Error al conectar con OrientDB:', err.message);
    process.exit(1);
  });
