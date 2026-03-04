import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('hood_cleaning.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    legalName TEXT,
    dba TEXT,
    taxId TEXT,
    establishmentType TEXT,
    businessHours TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    county TEXT,
    managerName TEXT,
    managerRole TEXT,
    phone TEXT,
    email TEXT,
    hoodCount INTEGER,
    filterCount INTEGER,
    ductType TEXT,
    ductHeight TEXT,
    roofAccess INTEGER DEFAULT 0,
    recurrence TEXT DEFAULT 'QUARTERLY',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastServiceDate DATE,
    nextServiceDate DATE
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER NOT NULL,
    volume TEXT,
    systemType TEXT,
    conditionBefore TEXT,
    servicesPerformed TEXT,
    technicianName TEXT,
    serviceDate DATE,
    nextServiceDate DATE,
    fireHazard INTEGER DEFAULT 0,
    nfpaCompliance INTEGER DEFAULT 1,
    reportNumber TEXT,
    notes TEXT,
    inspectionStartTime TEXT,
    inspectionPhotosBefore TEXT,
    inspectionChecklistBefore TEXT,
    completionTime TEXT,
    completionPhotosAfter TEXT,
    completionChecklistAfter TEXT,
    status TEXT DEFAULT 'COMPLETED',
    FOREIGN KEY (clientId) REFERENCES clients (id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin',
    phone TEXT,
    knowledgeLevel TEXT,
    address TEXT,
    joinDate DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert default settings if they don't exist
const reminderSettingExists = db.prepare("SELECT * FROM settings WHERE key = 'reminder_days_before'").get();
if (!reminderSettingExists) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('reminder_days_before', '14');
}

// Migration: Add columns if they don't exist
try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN knowledgeLevel TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN address TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN joinDate DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'"); } catch (e) { }

// Client migrations
try { db.exec("ALTER TABLE clients ADD COLUMN legalName TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN dba TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN taxId TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN establishmentType TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN businessHours TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN state TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN zip TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN county TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN managerRole TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN hoodCount INTEGER"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN filterCount INTEGER"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN ductType TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN ductHeight TEXT"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN roofAccess INTEGER DEFAULT 0"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN cleaningPrice REAL DEFAULT 0"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN lat REAL"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN lng REAL"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN lastServiceDate DATE"); } catch (e) { }
try { db.exec("ALTER TABLE clients ADD COLUMN nextServiceDate DATE"); } catch (e) { }

// Create default admin if not exists (password: admin123)
const adminExists = db.prepare("SELECT * FROM users WHERE email = 'admin@dehood.com'").get();
if (!adminExists) {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('admin123', 10);
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run('admin@dehood.com', hashedPassword, 'Administrador', 'admin');
}

// Create default technician if not exists (password: tech123)
const techExists = db.prepare("SELECT * FROM users WHERE email = 'tech@dehood.com'").get();
if (!techExists) {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('tech123', 10);
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run('tech@dehood.com', hashedPassword, 'Técnico Carlos', 'technician');
}

export default db;
