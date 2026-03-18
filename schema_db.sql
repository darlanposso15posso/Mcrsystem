CREATE TABLE clients (
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
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  , cleaningPrice REAL DEFAULT 0, lat REAL, lng REAL, lastServiceDate DATE, nextServiceDate DATE);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE services (
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
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin',
    phone TEXT,
    knowledgeLevel TEXT,
    address TEXT,
    joinDate DATETIME DEFAULT CURRENT_TIMESTAMP
  , status TEXT DEFAULT 'active', rawPassword TEXT);
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'New',
    last_contact_date DATE,
    notes TEXT,
    company_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
