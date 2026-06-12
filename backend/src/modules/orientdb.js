// Esta línea define la base de datos de OrientDB donde se conectará. 
const BASE = `http://${process.env.ORIENTDB_HOST}:2480`;

// Define el nombre de la base de datos que usaremos. 
const DB = process.env.ORIENTDB_DB; 

// Esta función crea una cadena de autenticación básica para enviar en HTTP requests con username y password. 
const makeAuth = (user, pass) => 
  `Basic ` + Buffer.from(`${user}:${pass}`).toString('base64'); 

// Define las cabeceras de la solicitud HTTP.
const headers = {
  'Content-Type': 'application/json', 
  Authorization: makeAuth(process.env.ORIENTDB_USER, process.env.ORIENTDB_PASS), // Autenticación con usuario y contraseña. 
};

// Cabeceras para la solicitud HTTP cuando se utiliza un usuario root. 
const rootHeaders = {
  'Content-Type': 'application/json',
  Authorization: makeAuth('root', 'taller4pass') 
};


// Función para pausar la ejecución del código por una cantidad de milisegundos. 
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Función para codificar el query string con el encodeURIComponent. 
const encodeQuery = encodeURIComponent;

// Función para normalizar el rid (rid) del mensaje. 
const normalizeRid = (rid) => (rid?.startsWith('#') ? rid : `#${rid}`); 

// Función asíncrona para obtener datos de la API de OrientDB. 
const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options); // Obtiene el resultado de la solicitud HTTP.
  const data = await res.json().catch(() => null); // Obtiene la respuesta JSON y maneja errores. 
  return { res, data };
};

// Función para enviar una solicitud POST a OrientDB con SQL en la base de datos. 
const postSQL = (sql, useRoot = false) => 
  fetchJson(`${BASE}/command/${DB}/sql`, { // Define la url, método y headers. 
    method: 'POST',
    headers: useRoot ? rootHeaders : headers, 
    body: JSON.stringify({ command: sql }),
  });

// Función para enviar una solicitud GET a OrientDB con SQL en la base de datos. 
const querySQL = (sql) => 
  fetchJson(`${BASE}/query/${DB}/sql/${encodeQuery(sql)}`, { headers });


/**
 * Inicializa OrientDB y crea la base de datos y clases si no existen.
 */
export async function initDB() {
  for (let retries = 0; retries < 30; retries++) {
    try {
      const ping = await fetch(`${BASE}/server`, { headers: rootHeaders }); // Conecta con el servidor OrientDB. 
      if (ping.ok) break; // Si la conexión es exitosa, sale del bucle.
    } catch {
      console.log(`Esperando OrientDB... (${retries + 1}/30)`); // Imprime un mensaje de espera si se produce un error durante la conexión. 
      await wait(2000);  // Espera 2 segundos.
    }
  }

  console.log('OrientDB listo'); // Muestra que OrientDB está funcionando.  

  const { data: listDatabases } = await fetchJson(`${BASE}/listDatabases`, { headers: rootHeaders }); // Obtiene la lista de bases de datos. 

  if (!listDatabases?.databases?.includes(DB)) {
    await fetchJson(`${BASE}/database/${DB}/plocal`, { method: 'POST', headers: rootHeaders }); // Crea la base de datos si no existe.   
    console.log(`Base de datos '${DB}' creada`); 
  }

  const { data: adminCheck } = await querySQL("SELECT FROM OUser WHERE name='admin'"); // Verifica si el usuario administrador existe. 
  if (!adminCheck?.result?.length) { 
    await postSQL(
      "INSERT INTO OUser SET name='admin', password='admin', status='ACTIVE', roles=(SELECT FROM ORole WHERE name='admin')", 
      true // Usa la autenticación root (usuario administrador) para esta acción.  
    ); 
    console.log('Usuario admin creado'); 
  }

  // Estas llamadas aseguran que las clases se creen de forma persistente. 
  await fetchJson(`${BASE}/class/${DB}/Conversation`, { headers }); // Inicializa la clase Conversation. 
  await fetchJson(`${BASE}/class/${DB}/Message`, { headers }); // Inicializa la clase Message. 

  console.log('OrientDB conectado y listo'); 
}

/**
 * Crea una nueva conversación.
 */
export async function createConversation(title = 'Nueva conversación') { 
  const now = new Date().toISOString(); // Obtiene la fecha de ahora. 
  const sql = `INSERT INTO Conversation SET title=${JSON.stringify(title)}, createdAt='${now}', updatedAt='${now}'`; 
  const { data } = await postSQL(sql); // Se ejecuta la instrucción SQL. 

  const record = data?.result?.[0]; 
  return { id: record?.['@rid'], title, createdAt: now, updatedAt: now }; 
}

/**
 * Lista todas las conversaciones.
 */
export async function listConversations() { 
  const { data } = await querySQL(
    `SELECT @rid AS id, title, createdAt, updatedAt FROM Conversation ORDER BY updatedAt DESC` // Consulta SQL para obtener una lista de conversaciones. 
  ); 

  return data?.result || [];
}

/**
 * Borra una conversación y sus mensajes. 
 */
export async function deleteConversation(conversationId) { 
  const rid = normalizeRid(conversationId);
  await postSQL(`DELETE FROM Message WHERE conversation=${rid}`); // Elimina los mensajes de la conversación. 
  await postSQL(`DELETE FROM Conversation WHERE @rid=${rid}`); // Elimina la conversación. 
}

/**
 * Obtiene todos los mensajes de una conversación.
 */
export async function getMessages(conversationId) { 
  const rid = normalizeRid(conversationId); 
  const { data } = await querySQL( 
    `SELECT @rid AS id, role, content, timestamp FROM Message WHERE conversation=${rid} ORDER BY timestamp ASC` // Consulta SQL para obtener los mensajes de la conversación.
  );  
  return data?.result || []; 
}

/**
 * Obtiene los últimos mensajes para contexto.
 */
export async function getLastMessages(conversationId, limit = 10) { 
  const rid = normalizeRid(conversationId); 
  const { data } = await querySQL( 
    `SELECT role, content FROM Message WHERE conversation=${rid} ORDER BY timestamp DESC LIMIT ${limit}` // Consulta SQL para obtener los últimos mensajes. 
  ); 
  return (data?.result || []).reverse(); 
}

/**
 * Guarda un mensaje.
 */
export async function saveMessage({ conversationId, role, content }) { 
  const rid = normalizeRid(conversationId); // Convierte el rid del mensaje a un formato adecuado.   
  const timestamp = new Date().toISOString(); // Obtiene la fecha de ahora.

  const { data } = await postSQL(
    `INSERT INTO Message SET role=${JSON.stringify(role)}, content=${JSON.stringify(content)}, timestamp='${timestamp}', conversation=${rid}` 
  );

  await postSQL(`UPDATE Conversation SET updatedAt='${timestamp}' WHERE @rid=${rid}`); // Actualiza la fecha de modificación de la conversación.  


  const record = data?.result?.[0]; 
  return { id: record?.['@rid'], role, content, timestamp, conversationId: rid }; 
} 
