import dotenv from 'dotenv';
dotenv.config();

const getConfig = () => {
  const BASE = `http://${process.env.ORIENTDB_HOST}:2480`;
  const DB = process.env.ORIENTDB_DB;
  const AUTH = 'Basic ' + Buffer.from(
    `${process.env.ORIENTDB_USER}:${process.env.ORIENTDB_PASS}`
  ).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': AUTH
  };
  return { BASE, DB, headers };
};

export async function initDB() {
  const { BASE, DB, headers } = getConfig();
  const rootHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('root:taller4pass').toString('base64')
  };

  // Crear DB si no existe
  const res = await fetch(`${BASE}/database/${DB}`, { headers: rootHeaders });
  if (res.status === 404) {
    await fetch(`${BASE}/database/${DB}/plocal`, {
      method: 'POST',
      headers: rootHeaders
    });
    console.log(`Base de datos '${DB}' creada`);

    // Crear usuario admin
    await fetch(`${BASE}/command/${DB}/sql`, {
      method: 'POST',
      headers: rootHeaders,
      body: JSON.stringify({
        command: "INSERT INTO OUser SET name='admin', password='admin', status='ACTIVE', roles=(SELECT FROM ORole WHERE name='admin')"
      })
    });
    console.log("Usuario 'admin' creado");
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
  const { BASE, DB, headers } = getConfig();
  try {
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
    const data = await res.json();
    console.log('Mensaje guardado:', JSON.stringify(data));
    return data;
  } catch (e) {
    console.error('Error guardando mensaje:', e.message);
  }
}

export async function getHistory(limit = 100) {
  const { BASE, DB, headers } = getConfig();
  const query = encodeURIComponent(
    `SELECT * FROM Message ORDER BY timestamp ASC LIMIT ${limit}`
  );
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
  const { BASE, DB, headers } = getConfig();
  try {
    const query = encodeURIComponent(
      `SELECT role, content FROM Message ORDER BY timestamp ASC`
    );
    const res = await fetch(`${BASE}/query/${DB}/sql/${query}`, { headers });
    const data = await res.json();
    console.log('Query resultado:', JSON.stringify(data));

    const all = data.result || [];
    return all.slice(-n).map(r => ({
      role:    r.role,
      content: r.content
    }));
  } catch (e) {
    console.error('Error leyendo mensajes:', e.message);
    return [];
  }
}