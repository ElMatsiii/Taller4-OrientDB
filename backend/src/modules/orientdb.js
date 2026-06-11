const BASE = `http://${process.env.ORIENTDB_HOST}:2480`;
const DB = process.env.ORIENTDB_DB;
const headers = {
  'Content-Type': 'application/json',
  Authorization:
    'Basic ' + Buffer.from(`${process.env.ORIENTDB_USER}:${process.env.ORIENTDB_PASS}`).toString('base64'),
};
const rootHeaders = {
  'Content-Type': 'application/json',
  Authorization: 'Basic ' + Buffer.from('root:taller4pass').toString('base64'),
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const encodeQuery = (sql) => encodeURIComponent(sql);
const normalizeRid = (rid) => (rid?.startsWith('#') ? rid : `#${rid}`);

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { res, data };
};

const post = (url, body, useRoot = false) =>
  fetchJson(url, {
    method: 'POST',
    headers: useRoot ? rootHeaders : headers,
    body: JSON.stringify(body),
  });

/**
 * Inicializa OrientDB y crea la base de datos y clases si no existen.
 */
export async function initDB() {
  let retries = 0;
  const maxRetries = 30;

  while (retries < maxRetries) {
    try {
      const ping = await fetch(`${BASE}/server`, { headers: rootHeaders });
      if (ping.ok) break;
    } catch (error) {
      retries++;
      console.log(`Esperando OrientDB... (${retries}/${maxRetries})`);
      await wait(2000);
    }
  }

  console.log('OrientDB listo');

  const { data: listDatabases } = await fetchJson(`${BASE}/listDatabases`, { headers: rootHeaders });
  const databases = listDatabases?.databases || [];
  if (!databases.includes(DB)) {
    await post(`${BASE}/database/${DB}/plocal`, null, true);
    console.log(`Base de datos '${DB}' creada`);
    await wait(2000);
  }

  const { data: adminCheck } = await fetchJson(
    `${BASE}/query/${DB}/sql/${encodeQuery("SELECT FROM OUser WHERE name='admin'")}`,
    { headers: rootHeaders }
  );

  if (!adminCheck?.result?.length) {
    await post(
      `${BASE}/command/${DB}/sql`,
      {
        command:
          "INSERT INTO OUser SET name='admin', password='admin', status='ACTIVE', roles=(SELECT FROM ORole WHERE name='admin')",
      },
      true
    );
    console.log('Usuario admin creado');
  }

  await fetchJson(`${BASE}/class/${DB}/Conversation`, { headers });
  await fetchJson(`${BASE}/class/${DB}/Message`, { headers });

  console.log('OrientDB conectado y listo');
}

/**
 * Crea una nueva conversación.
 */
export async function createConversation(title = 'Nueva conversación') {
  const now = new Date().toISOString();
  const sql = `INSERT INTO Conversation SET title = ${JSON.stringify(title)}, createdAt = '${now}', updatedAt = '${now}'`;
  const { data } = await post(`${BASE}/command/${DB}/sql`, { command: sql });
  const record = (data?.result || [])[0] || data?.result;
  return {
    id: record['@rid'],
    title,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Lista todas las conversaciones.
 */
export async function listConversations() {
  const query = `SELECT @rid AS id, title, createdAt, updatedAt FROM Conversation ORDER BY updatedAt DESC`;
  const { data } = await fetchJson(`${BASE}/query/${DB}/sql/${encodeQuery(query)}`, { headers });
  return (data?.result || []).map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

/**
 * Borra una conversación y sus mensajes.
 */
export async function deleteConversation(conversationId) {
  const rid = normalizeRid(conversationId);
  await post(`${BASE}/command/${DB}/sql`, {
    command: `DELETE FROM Message WHERE conversation = ${rid}`,
  });
  await post(`${BASE}/command/${DB}/sql`, {
    command: `DELETE FROM Conversation WHERE @rid = ${rid}`,
  });
}

/**
 * Obtiene todos los mensajes de una conversación.
 */
export async function getMessages(conversationId) {
  const rid = normalizeRid(conversationId);
  const query = `SELECT @rid AS id, role, content, timestamp FROM Message WHERE conversation = ${rid} ORDER BY timestamp ASC`;
  const { data } = await fetchJson(`${BASE}/query/${DB}/sql/${encodeQuery(query)}`, { headers });
  return (data?.result || []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }));
}

/**
 * Obtiene los últimos mensajes para contexto.
 */
export async function getLastMessages(conversationId, limit = 10) {
  const rid = normalizeRid(conversationId);
  const query = `SELECT role, content FROM Message WHERE conversation = ${rid} ORDER BY timestamp DESC LIMIT ${limit}`;
  const { data } = await fetchJson(`${BASE}/query/${DB}/sql/${encodeQuery(query)}`, { headers });
  return (data?.result || []).reverse().map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Guarda un mensaje.
 */
export async function saveMessage({ conversationId, role, content }) {
  const rid = normalizeRid(conversationId);
  const timestamp = new Date().toISOString();
  const sql = `INSERT INTO Message SET role = ${JSON.stringify(role)}, content = ${JSON.stringify(content)}, timestamp = '${timestamp}', conversation = ${rid}`;
  const { data } = await post(`${BASE}/command/${DB}/sql`, { command: sql });

  await post(`${BASE}/command/${DB}/sql`, {
    command: `UPDATE Conversation SET updatedAt='${timestamp}' WHERE @rid = ${rid}`,
  });

  const record = (data?.result || [])[0] || data?.result;
  return {
    id: record['@rid'],
    role,
    content,
    timestamp,
    conversationId: rid,
  };
}
