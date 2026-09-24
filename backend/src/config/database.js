require('dotenv').config();
const mysql = require('mysql2/promise');

function createSqlitePool() {
  const Database = require('better-sqlite3');
  const sqlite = new Database(':memory:');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
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

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Seed Initial Demo Users (Password: Password123!)
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES
    (1, 'John Doe', 'john@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer'),
    (2, 'Jane Smith', 'jane@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer'),
    (3, 'Sarah Connor', 'agent.sarah@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent'),
    (4, 'Mike Ross', 'agent.mike@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent');

    -- Seed Sample Tickets
    INSERT OR IGNORE INTO tickets (id, user_id, subject, description, priority, status, assigned_to) VALUES
    (1, 1, 'Cannot connect to company VPN', 'Whenever I launch the VPN client, it gets stuck at 80% authenticating and then times out.', 'high', 'open', NULL),
    (2, 1, 'Password reset request for Portal', 'I forgot my password for the customer portal and the email reset link has expired.', 'medium', 'in_progress', 3),
    (3, 2, 'Billing inquiry for March invoice', 'My invoice shows an unexpected charge of $49.99 for extra usage. Please explain.', 'low', 'open', NULL),
    (4, 2, 'System crash during report export', 'Exporting CSV report larger than 5000 rows causes a 504 Gateway Timeout error.', 'high', 'closed', 4);

    -- Seed Sample Comments
    INSERT OR IGNORE INTO ticket_comments (id, ticket_id, user_id, comment) VALUES
    (1, 2, 1, 'I tried clicking the link again this morning but still getting expired message.'),
    (2, 2, 3, 'Hi John, I have generated a new temporary reset link and sent it to your registered email.'),
    (3, 4, 2, 'The report export issue is resolved after the latest system patch.'),
    (4, 4, 4, 'Marking this ticket as closed as verified by customer.');
  `);

  return {
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
}

let pool;

if (process.env.NODE_ENV === 'test' || process.env.USE_TEST_DB === 'true' || process.env.USE_SQLITE === 'true') {
  pool = createSqlitePool();
} else {
  // Real MySQL Pool with auto-fallback to SQLite if MySQL Server is not running locally
  const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'support_tickets',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  let sqliteFallbackPool = null;

  pool = {
    async execute(sql, params = []) {
      try {
        return await mysqlPool.execute(sql, params);
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ENOTFOUND') {
          if (!sqliteFallbackPool) {
            console.warn('[DB WARNING] Local MySQL not reachable. Falling back to pre-seeded SQLite in-memory database.');
            sqliteFallbackPool = createSqlitePool();
          }
          return sqliteFallbackPool.execute(sql, params);
        }
        throw err;
      }
    },
    async query(sql, params = []) {
      return this.execute(sql, params);
    }
  };
}

module.exports = pool;
