import dotenv from 'dotenv';
dotenv.config();

const BASE = `http://${process.env.ORIENTDB_HOST}:2480`;
const DB = process.env.ORIENTDB_DB;
const AUTH = 'Basic ' + Buffer.from(`${process.env.ORIENTDB_USER}:${process.env.ORIENTDB_PASS}`).toString('base64');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': AUTH
};

export async function initDB() {
  // Verificar si la DB existe, si no, crearla
  const res = await fetch(`${BASE}/database/${DB}`, { headers });

  if (res.status === 404) {
    await fetch(`${BASE}/database/${DB}/plocal`, {
      method: 'POST',
      headers
    });
    console.log(`Base de datos '${DB}' creada`);
  }

  // Crear clase Message si no existe
  const classRes = await fetch(`${BASE}/class/${DB}/Message`, { headers });
  if (classRes.status === 404) {
    await fetch(`${BASE}/class/${DB}/Message`, {
      method: 'POST',
      headers
    });
    console.log("Clase 'Message' creada");
  }

  console.log('OrientDB conectado y listo');
}

export async function saveMessage({ role, content }) {
  const res = await fetch(`${BASE}/document/${DB}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      '@class': 'Message',
      role,
      content,
      timestamp: new Date().toISOString()
    })
  });
  return res.json();
}

export async function getHistory(limit = 100) {
  const query = encodeURIComponent(`SELECT * FROM Message ORDER BY timestamp ASC LIMIT ${limit}`);
  const res = await fetch(`${BASE}/query/${DB}/sql/${query}`, { headers });
  const data = await res.json();
  
  return (data.result || []).map(r => ({
    id:        r['@rid'],
    role:      r.role,
    content:   r.content,
    timestamp: r.timestamp
  }));
}

export async function getLastNMessages(n = 10) {
  const query = encodeURIComponent(`SELECT role, content FROM Message ORDER BY timestamp ASC`);
  const res = await fetch(`${BASE}/query/${DB}/sql/${query}`, { headers });
  const data = await res.json();

  const all = data.result || [];
  return all.slice(-n).map(r => ({
    role:    r.role,
    content: r.content
  }));
}