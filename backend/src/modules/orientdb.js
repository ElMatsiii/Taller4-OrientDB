import dotenv from 'dotenv';
dotenv.config();

const getConfig = () => {
  const BASE = `http://${process.env.ORIENTDB_HOST}:2480`;
  const DB = process.env.ORIENTDB_DB;
  const AUTH = 'Basic ' + Buffer.from(
    `${process.env.ORIENTDB_USER}:${process.env.ORIENTDB_PASS}`
  ).toString('base64');
  const rootAuth = 'Basic ' + Buffer.from('root:taller4pass').toString('base64');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: AUTH,
  };

  const rootHeaders = {
    'Content-Type': 'application/json',
    Authorization: rootAuth,
  };

  return { BASE, DB, headers, rootHeaders };
};

const fetchJson = async (url, options) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { res, data };
};

const encodeQuery = (sql) => encodeURIComponent(sql);
const normalizeRid = (rid) => (rid?.startsWith('#') ? rid : `#${rid}`);

const ensureClass = async (BASE, DB, headers, className) => {
  const { res } = await fetchJson(`${BASE}/class/${DB}/${className}`, { headers });
  if (res.status === 404) {
    await fetch(`${BASE}/class/${DB}/${className}`, {
      method: 'POST',
      headers,
    });
  }
};

const ensureProperty = async (BASE, DB, headers, className, property, type, linkedClass) => {
  const { res } = await fetchJson(`${BASE}/property/${DB}/${className}/${property}`, { headers });
  if (res.status === 404) {
    await fetch(`${BASE}/property/${DB}/${className}/${property}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, linkedClass }),
    });
  }
};

export async function initDB() {
  const { BASE, DB, headers, rootHeaders } = getConfig();

  let ready = false;
  while (!ready) {
    try {
      const ping = await fetch(`${BASE}/server`, { headers: rootHeaders });
      if (ping.ok) {
        ready = true;
        console.log('OrientDB listo');
      } else {
        console.log('Esperando OrientDB...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.log('Esperando OrientDB...', err.message);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const listDatabases = await fetchJson(`${BASE}/listDatabases`, { headers: rootHeaders });
  const databases = listDatabases.data?.databases || [];
  if (!databases.includes(DB)) {
    await fetch(`${BASE}/database/${DB}/plocal`, {
      method: 'POST',
      headers: rootHeaders,
    });
    console.log(`Base de datos '${DB}' creada`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const adminCheck = await fetchJson(
    `${BASE}/query/${DB}/sql/${encodeQuery("SELECT FROM OUser WHERE name='admin'")}`,
    { headers: rootHeaders }
  );
  if (!adminCheck.data?.result?.length) {
    await fetch(`${BASE}/command/${DB}/sql`, {
      method: 'POST',
      headers: rootHeaders,
      body: JSON.stringify({
        command:
          "INSERT INTO OUser SET name='admin', password='admin', status='ACTIVE', roles=(SELECT FROM ORole WHERE name='admin')",
      }),
    });
    console.log('Usuario admin creado');
  }

  await ensureClass(BASE, DB, headers, 'Conversation');
  await ensureClass(BASE, DB, headers, 'Message');
  await ensureProperty(BASE, DB, headers, 'Message', 'conversation', 'LINK', 'Conversation');

  console.log('OrientDB conectado y listo');
}

export async function createConversation(title = 'Nueva conversación') {
  const { BASE, DB, headers } = getConfig();
  const now = new Date().toISOString();
  const sql = `INSERT INTO Conversation SET title = ${JSON.stringify(title)}, createdAt = '${now}', updatedAt = '${now}'`;

  const { data } = await fetchJson(`${BASE}/command/${DB}/sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ command: sql }),
  });

  const record = data?.result?.[0] || data?.result;
  return record && {
    id: record['@rid'],
    title: record.title,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function listConversations() {
  const { BASE, DB, headers } = getConfig();
  const query = `SELECT @rid AS id, title, createdAt, updatedAt FROM Conversation ORDER BY updatedAt DESC`;
  const { data } = await fetchJson(`${BASE}/query/${DB}/sql/${encodeQuery(query)}`, {
    headers,
  });

  return (data?.result || []).map((item) => ({
    id: item.id,
    title: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function deleteConversation(conversationId) {
  const { BASE, DB, headers } = getConfig();
  const rid = normalizeRid(conversationId);

  const deleteMessages = await fetchJson(`${BASE}/command/${DB}/sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      command: `DELETE FROM Message WHERE conversation = ${rid}`,
    }),
  });

  if (!deleteMessages.res.ok) {
    const errorText = deleteMessages.data?.error || JSON.stringify(deleteMessages.data);
    throw new Error(`Error deleting messages for ${rid}: ${errorText}`);
  }

  const deleteConversation = await fetchJson(`${BASE}/command/${DB}/sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      command: `DELETE FROM Conversation WHERE @rid = ${rid}`,
    }),
  });

  if (!deleteConversation.res.ok) {
    const errorText = deleteConversation.data?.error || JSON.stringify(deleteConversation.data);
    throw new Error(`Error deleting conversation ${rid}: ${errorText}`);
  }
}

export async function getMessages(conversationId) {
  const { BASE, DB, headers } = getConfig();
  const rid = normalizeRid(conversationId);
  const query = `SELECT @rid AS id, role, content, timestamp FROM Message WHERE conversation = ${rid} ORDER BY timestamp ASC`;
  const { data } = await fetchJson(`${BASE}/query/${DB}/sql/${encodeQuery(query)}`, {
    headers,
  });

  return (data?.result || []).map((item) => ({
    id: item.id,
    role: item.role,
    content: item.content,
    timestamp: item.timestamp,
  }));
}

export async function getLastMessages(conversationId, limit = 10) {
  const { BASE, DB, headers } = getConfig();
  const rid = normalizeRid(conversationId);
  const query = `SELECT role, content FROM Message WHERE conversation = ${rid} ORDER BY timestamp DESC LIMIT ${limit}`;
  const { data } = await fetchJson(`${BASE}/query/${DB}/sql/${encodeQuery(query)}`, {
    headers,
  });

  return (data?.result || []).reverse().map((item) => ({
    role: item.role,
    content: item.content,
  }));
}

export async function saveMessage({ conversationId, role, content }) {
  const { BASE, DB, headers } = getConfig();
  const rid = normalizeRid(conversationId);
  const timestamp = new Date().toISOString();
  const sql = `INSERT INTO Message SET role = ${JSON.stringify(role)}, content = ${JSON.stringify(content)}, timestamp = '${timestamp}', conversation = ${rid}`;

  const { data } = await fetchJson(`${BASE}/command/${DB}/sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ command: sql }),
  });

  await fetch(`${BASE}/command/${DB}/sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      command: `UPDATE Conversation SET updatedAt='${timestamp}' WHERE @rid = ${rid}`,
    }),
  });

  const record = data?.result?.[0] || data?.result;
  return record && {
    id: record['@rid'],
    role,
    content,
    timestamp,
    conversationId: rid,
  };
}
