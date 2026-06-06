import OrientDB from 'orientjs';
import dotenv from 'dotenv';
dotenv.config();

let db;

export async function initDB() {
    const server = OrientDB({
        host: process.env.ORIENTDB_HOST,
        port: parseInt(process.env.ORIENTDB_PORT),
        username: process.env.ORIENTDB_USER,
        password: process.env.ORIENTDB_PASSWORD
    });

    //crear la base de datos si no existe
    const exists = await server.exists(process.env.ORIENTDB_DB);
    if (!exists) {
        await server.create({
            name: process.env.ORIENTDB_DB,
            type: 'graph',
            storage: 'plocal'
        });
    }
    db = await server.use({
        name: process.env.ORIENTDB_DB,
        username: process.env.ORIENTDB_USER,
        password: process.env.ORIENTDB_PASSWORD
    });

    //crear calse message si no existe
    const classes = await db.class.list();
    const exists_class = classes.some(c => c.name === 'Message');
    if (!exists_class) {
        const cls = await db.class.create('Message');
        await cls.property.create({name: 'role', type: 'String' });
        await cls.property.create({name: 'content', type: 'String' });
        await cls.property.create({name: 'timestamp', type: 'String' });
    }

    console.log('OrientDB conectado y listo');
    return db;
}

export async function saveMssage({role, content}) {
    const record = db.insert().into('Message').set({
        role,
        content,
        timestamp: new Date().toISOString()
    }).one();
    return record;
}

export async function getHistory(limit = 100) {
    const records = await db.select()
    .from('Message')
    .order('timestamp ASC')
    .limit(limit)
    .all();

    return records.map(r => ({
        id: r['@rid'].toString(),
        role: r.role,
        content: r.content,
        timestamp: r.timestamp
    }));
}

export async function getLastNMessages(n = 10) {
    const records = await db.select()
    .from('Message')
    .order('timestamp ASC')
    .all();

    const last = records.slice(-n);
    return last.map(r => ({
        role: r.role,
        content: r.content,
    }));
}