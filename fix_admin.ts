import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('hood_cleaning.db');

async function fixAdmin() {
    const email = 'dehoodcleaning@gmail.com';
    const pwd = await bcrypt.hash('123456', 10);

    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!existing) {
        db.prepare('INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, ?, ?)').run(email, pwd, 'Administrador', 'admin', 'active');
        console.log('Inserted admin');
    } else {
        db.prepare('UPDATE users SET role = ?, status=? WHERE email = ?').run('admin', 'active', email);
        console.log('Updated admin');
    }
}
fixAdmin();
