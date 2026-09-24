require('dotenv').config();
const mysql = require('mysql2/promise');

let pool;

if (process.env.NODE_ENV === 'test' || process.env.USE_TEST_DB === 'true') {
  const Database = require('better-sqlite3');
  const sqlite = new Database(':memory:');

  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      assigned_to INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE ticket_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  pool = {
    async execute(sql, params = []) {
      const normalizedSql = sql;
      const isSelect = /^\s*SELECT/i.test(normalizedSql);

      try {
        if (isSelect) {
          const stmt = sqlite.prepare(normalizedSql);
          const rows = stmt.all(...params);
          return [rows, []];
        } else {
          const stmt = sqlite.prepare(normalizedSql);
          const info = stmt.run(...params);
          return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }, []];
        }
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          const customErr = new Error('Could not create user (email may already be registered)');
          customErr.code = 'ER_DUP_ENTRY';
          throw customErr;
        }
        throw err;
      }
    },
    async query(sql, params = []) {
      return this.execute(sql, params);
    },
    sqliteInstance: sqlite
  };
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'support_tickets',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = pool;
