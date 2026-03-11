# Project Snapshot for Claude AI Analysis

This document contains the core source code of the D&E Hood Cleaning Management System.

## File: `package.json`

```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build",
    "start": "NODE_ENV=production tsx server.ts",
    "preview": "vite preview",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/clerk-react": "^5.61.3",
    "@google/genai": "^1.29.0",
    "@supabase/supabase-js": "^2.97.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "bcryptjs": "^3.0.3",
    "better-sqlite3": "^12.4.1",
    "cookie-parser": "^1.4.7",
    "date-fns": "^4.1.0",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "helmet": "^8.1.0",
    "jspdf": "^4.2.0",
    "jspdf-autotable": "^5.0.7",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "node-cron": "^4.2.1",
    "nodemailer": "^8.0.1",
    "react": "^19.0.0",
    "react-big-calendar": "^1.19.4",
    "react-dom": "^19.0.0",
    "react-leaflet": "^5.0.0",
    "recharts": "^3.7.0",
    "vite": "^6.2.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.10",
    "@types/express": "^4.17.21",
    "@types/leaflet": "^1.9.21",
    "@types/node": "^22.14.0",
    "@types/node-cron": "^3.0.11",
    "@types/nodemailer": "^7.0.11",
    "@types/react-big-calendar": "^1.16.3",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}

```

---

## File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}

```

---

## File: `vite.config.ts`

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

```

---

## File: `server.ts`

```typescript
import express from "express";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import db from "./server/db.ts";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '5173', 10);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kokngsijyvfdtobvpswy.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva25nc2lqeXZmZHRvYnZwc3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODI2MTQsImV4cCI6MjA4NzY1ODYxNH0.EzPCEh5panTyCcDvWnrBoOf3ANB3j7oHhA3rk7aqBLo';
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const IMGBB_API_KEY = "965210f6096243bcaa8db7f810681590";

  async function uploadBase64ToImgBB(base64String: string, fileName: string): Promise<string> {
    if (!base64String || !base64String.includes('base64,')) return base64String;
    try {
      const matches = base64String.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return base64String;

      // Extract the raw base64 data to send
      const rawBase64 = matches[2];

      const formData = new URLSearchParams();
      formData.append("image", rawBase64);
      formData.append("name", fileName);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data && data.success) {
        return data.data.url;
      }
      console.error("ImgBB Upload failed:", data);
      return base64String;
    } catch (error) {
      console.error("Error uploading to ImgBB:", error);
      return base64String;
    }
  }

  async function geocodeAddress(addressStr: string): Promise<{ lat: number, lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'DE-Hood-Cleaning-App/1.0'
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (e) {
      console.error("Geocoding failed:", e);
      return null;
    }
  }

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development convenience in iframe
    crossOriginEmbedderPolicy: false,
  }));

  app.use(express.json({ limit: '1000mb' }));
  app.use(express.urlencoded({ limit: '1000mb', extended: true }));
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: "Sessão expirada ou não autorizado" });
    }
    try {
      const user = db.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(userId) as any;
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ error: "Erro interno na autenticação" });
    }
  };

  // Auth Routes
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    res.cookie("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("userId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ success: true });
  });

  app.get("/api/me", (req, res) => {
    const userId = req.cookies.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    const user = db.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json(user);
  });

  // Sync Supabase Session to Local SQLite Cookie
  app.post("/api/sync-cookie", async (req, res) => {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: "Token ausente" });

    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
      if (error || !user) return res.status(401).json({ error: "Token inválido" });

      let localUser = db.prepare("SELECT * FROM users WHERE email = ?").get(user.email) as any;

      if (!localUser) {
        // Create user locally if they don't exist
        const defaultPassword = await bcrypt.hash(Math.random().toString(), 10);
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const role = user.email === 'dehoodcleaning@gmail.com' ? 'admin' : (user.user_metadata?.role || 'technician');

        const info = db.prepare(`
          INSERT INTO users (email, password, name, role, status, knowledgeLevel) 
          VALUES (?, ?, ?, ?, 'active', 'Aprendiz')
        `).run(user.email, defaultPassword, name, role);

        localUser = { id: info.lastInsertRowid, email: user.email, role, name };
      }

      res.cookie("userId", localUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ success: true, user: { id: localUser.id, email: localUser.email, role: localUser.role } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Erro ao sincronizar sessão" });
    }
  });

  // Public Registration Route for Technicians
  app.post("/api/register", async (req, res) => {
    const { name, phone, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios" });
    }

    try {
      // Tenta criar no Supabase silenciosamente
      const { data: supaData, error: supaError } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: 'technician', phone }
        }
      });

      if (supaError) {
        console.warn("Aviso no Supabase Auth (continuando apenas com SQLite):", supaError.message);
      }

      // Cria localmente com status pending
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare(`
        INSERT INTO users (email, password, rawPassword, name, role, phone, knowledgeLevel, status) 
        VALUES (?, ?, ?, ?, 'technician', ?, 'Aprendiz', 'pending')
      `).run(email, hashedPassword, password, name, phone || '');

      res.json({ id: info.lastInsertRowid, message: "Cadastro recebido e aguardando aprovação" });
    } catch (e: any) {
      if (e.message?.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "E-mail já cadastrado" });
      }
      console.error(e);
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  // User Management (Admin Only)
  app.get("/api/users", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const users = db.prepare("SELECT id, email, name, role, phone, knowledgeLevel, address, joinDate, status, rawPassword FROM users").all();
    res.json(users);
  });

  app.post("/api/users", authenticate, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { email, password, name, role, phone, knowledgeLevel, address } = req.body;

    try {
      // Cria primeiro no Supabase
      const { data: supaData, error: supaError } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: role || 'technician', phone }
        }
      });

      if (supaError) {
        console.warn("Aviso no Supabase Auth (continuando apenas com SQLite):", supaError.message);
        // We do not return 400 here anymore, because we want to allow local DB creation 
        // even if Supabase rate limits the anon signUp endpoint.
      }

      // Em seguida, cria local
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare(`
        INSERT INTO users (email, password, rawPassword, name, role, phone, knowledgeLevel, address, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(email, hashedPassword, password, name, role || 'technician', phone, knowledgeLevel, address);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      if (e.message?.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "E-mail já cadastrado" });
      }
      console.error(e);
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  // Rota para deletar usuários
  app.delete("/api/users/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { id } = req.params;

    try {
      const user = db.prepare("SELECT email FROM users WHERE id = ?").get(id) as any;
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      db.prepare("DELETE FROM users WHERE id = ?").run(id);

      // Como não temos a chave secreta do Supabase, não conseguimos deletar o usuário lá automaticamente,
      // mas ao logar, o app pode checar o status local e bloquear se não existir.

      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Erro ao deletar usuário" });
    }
  });

  app.get("/api/users/status", (req: any, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "E-mail obrigatório" });
    const user = db.prepare("SELECT status FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.json({ status: 'not_found' });
    res.json({ status: user.status });
  });

  app.post("/api/register-technician", async (req: any, res) => {
    const { email, name, phone } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const info = db.prepare(`
        INSERT INTO users (email, password, name, role, phone, status) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(email, hashedPassword, name, 'technician', phone, 'pending');
      res.json({ id: info.lastInsertRowid, status: 'pending' });
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "E-mail já cadastrado" });
      }
      res.status(500).json({ error: "Erro ao criar usuário local" });
    }
  });

  app.put("/api/users/:id/approve", authenticate, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { id } = req.params;
    try {
      db.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).run(id);
      res.json({ success: true, message: 'Usuário aprovado' });
    } catch (e: any) {
      res.status(500).json({ error: "Erro ao aprovar usuário" });
    }
  });


  app.put("/api/users/:id", authenticate, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { id } = req.params;
    const { email, name, role, phone, knowledgeLevel, address, password } = req.body;

    try {
      if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare(`
          UPDATE users 
          SET email = ?, name = ?, role = ?, phone = ?, knowledgeLevel = ?, address = ?, password = ?, rawPassword = ?
          WHERE id = ?
        `).run(email, name, role, phone, knowledgeLevel, address, hashedPassword, password, id);
      } else {
        db.prepare(`
          UPDATE users 
          SET email = ?, name = ?, role = ?, phone = ?, knowledgeLevel = ?, address = ?
          WHERE id = ?
        `).run(email, name, role, phone, knowledgeLevel, address, id);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  // Protected API Routes
  app.get("/api/clients", authenticate, (req, res) => {
    const clients = db.prepare(`
      SELECT c.*, 
      COALESCE(c.lastServiceDate, (SELECT MAX(serviceDate) FROM services WHERE clientId = c.id)) as lastServiceDate,
      COALESCE(c.nextServiceDate, (SELECT MIN(nextServiceDate) FROM services WHERE clientId = c.id AND nextServiceDate >= date('now'))) as computedNextServiceDate
      FROM clients c
    `).all();

    // Map `computedNextServiceDate` back to `nextServiceDate` for compatibility
    const mapped = clients.map((c: any) => ({
      ...c,
      nextServiceDate: c.computedNextServiceDate
    }));

    res.json(mapped);
  });

  app.post("/api/clients", authenticate, async (req: any, res) => {
    const {
      name, email, phone, address, city
    } = req.body;

    // Basic Validation
    if (!name || !email || !address) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes: nome, e-mail e endereço são necessários." });
    }

    try {
      let {
        legalName, dba, taxId, establishmentType, businessHours,
        state, zip, county,
        managerName, managerRole,
        hoodCount, filterCount, ductType, ductHeight, roofAccess,
        recurrence, lat, lng, nextServiceDate
      } = req.body;

      if (!lat || !lng) {
        const geo = await geocodeAddress(`${address}, ${city || ''}, ${state || ''}, ${zip || ''}`);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }

      const info = db.prepare(`
        INSERT INTO clients (
          name, legalName, dba, taxId, establishmentType, businessHours,
          address, city, state, zip, county, 
          managerName, managerRole, phone, email,
          hoodCount, filterCount, ductType, ductHeight, roofAccess,
          recurrence, cleaningPrice, lat, lng, nextServiceDate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, legalName, dba, taxId, establishmentType, businessHours,
        address, city, state, zip, county,
        managerName, managerRole, phone, email,
        hoodCount || 1, filterCount || 0, ductType || 'Vertical', ductHeight, roofAccess ? 1 : 0,
        recurrence || 'QUARTERLY', req.body.cleaningPrice || 0, lat || null, lng || null, nextServiceDate || null
      );
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ error: "Erro ao cadastrar cliente" });
    }
  });

  app.put("/api/clients/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    let {
      name, legalName, dba, taxId, establishmentType, businessHours,
      address, city, state, zip, county,
      managerName, managerRole, phone, email,
      hoodCount, filterCount, ductType, ductHeight, roofAccess,
      recurrence, lat, lng, nextServiceDate
    } = req.body;

    if (!lat || !lng) {
      const geo = await geocodeAddress(`${address}, ${city || ''}, ${state || ''}, ${zip || ''}`);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }
    }

    try {
      db.prepare(`
        UPDATE clients SET
          name = ?, legalName = ?, dba = ?, taxId = ?, establishmentType = ?, businessHours = ?,
          address = ?, city = ?, state = ?, zip = ?, county = ?, 
          managerName = ?, managerRole = ?, phone = ?, email = ?,
          hoodCount = ?, filterCount = ?, ductType = ?, ductHeight = ?, roofAccess = ?,
          recurrence = ?, cleaningPrice = ?, lat = ?, lng = ?, nextServiceDate = ?
        WHERE id = ?
      `).run(
        name, legalName, dba, taxId, establishmentType, businessHours,
        address, city, state, zip, county,
        managerName, managerRole, phone, email,
        hoodCount, filterCount, ductType, ductHeight, roofAccess ? 1 : 0,
        recurrence, req.body.cleaningPrice || 0, lat || null, lng || null, nextServiceDate || null,
        id
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  });

  app.get("/api/services", authenticate, (req, res) => {
    const services = db.prepare(`
      SELECT 
        s.id, s.clientId, s.volume, s.systemType, s.conditionBefore, s.servicesPerformed,
        s.technicianName, s.serviceDate, s.nextServiceDate, s.fireHazard, s.nfpaCompliance,
        s.reportNumber, s.notes, s.inspectionStartTime, s.inspectionChecklistBefore,
        s.completionTime, s.completionChecklistAfter, s.status,
        s.inspectionPhotosBefore, s.completionPhotosAfter, s.preCleaningChecklist,
        c.name as restaurantName 
      FROM services s 
      JOIN clients c ON s.clientId = c.id
      ORDER BY s.serviceDate DESC
    `).all();
    res.json(services);
  });

  app.post("/api/services", authenticate, async (req: any, res) => {
    const {
      clientId, volume, systemType, conditionBefore,
      servicesPerformed, technicianName, serviceDate,
      nextServiceDate, fireHazard, nfpaCompliance, reportNumber, notes,
      inspectionStartTime, inspectionPhotosBefore, inspectionChecklistBefore,
      status
    } = req.body;

    const processedPhotosBefore = [];
    if (inspectionPhotosBefore && Array.isArray(inspectionPhotosBefore)) {
      for (let i = 0; i < inspectionPhotosBefore.length; i++) {
        const photo = inspectionPhotosBefore[i];
        if (photo) {
          const link = await uploadBase64ToImgBB(photo, `Client_${clientId}_Before_${Date.now()}_${i}`);
          processedPhotosBefore.push(link);
        } else {
          processedPhotosBefore.push(null);
        }
      }
    }

    try {
      const info = db.prepare(`
        INSERT INTO services (
          clientId, volume, systemType, conditionBefore, 
          servicesPerformed, technicianName, serviceDate, 
          nextServiceDate, fireHazard, nfpaCompliance, reportNumber, notes,
          inspectionStartTime, inspectionPhotosBefore, inspectionChecklistBefore,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientId, volume, systemType, conditionBefore,
        servicesPerformed, technicianName, serviceDate,
        nextServiceDate, fireHazard ? 1 : 0, nfpaCompliance ? 1 : 0, reportNumber, notes,
        inspectionStartTime,
        JSON.stringify(processedPhotosBefore),
        JSON.stringify(inspectionChecklistBefore || {}),
        status || 'COMPLETED'
      );
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ error: "Erro ao criar serviço" });
    }
  });

  app.patch("/api/services/:id", authenticate, async (req: any, res) => {
    const { id } = req.params;
    const {
      completionTime, completionPhotosAfter, completionChecklistAfter,
      status, fireHazard, nfpaCompliance, notes, nextServiceDate, clientId
    } = req.body;

    const processedPhotosAfter = [];
    if (completionPhotosAfter && Array.isArray(completionPhotosAfter)) {
      for (let i = 0; i < completionPhotosAfter.length; i++) {
        const photo = completionPhotosAfter[i];
        if (photo && photo.includes('base64,')) {
          const baseName = clientId ? `Client_${clientId}` : `Service_${id}`;
          const link = await uploadBase64ToImgBB(photo, `${baseName}_After_${Date.now()}_${i}`);
          processedPhotosAfter.push(link);
        } else {
          processedPhotosAfter.push(photo || null);
        }
      }
    }

    try {
      db.prepare(`
        UPDATE services SET 
          completionTime = ?, 
          completionPhotosAfter = ?, 
          completionChecklistAfter = ?, 
          status = ?,
          fireHazard = ?,
          nfpaCompliance = ?,
          notes = ?,
          nextServiceDate = ?
        WHERE id = ?
      `).run(
        completionTime,
        JSON.stringify(processedPhotosAfter),
        JSON.stringify(completionChecklistAfter || {}),
        status || 'COMPLETED',
        fireHazard ? 1 : 0,
        nfpaCompliance ? 1 : 0,
        notes || '',
        nextServiceDate || null,
        id
      );

      if (status === 'COMPLETED' && clientId) {
        const client = db.prepare("SELECT recurrence FROM clients WHERE id = ?").get(clientId) as any;
        if (client) {
          let nextDate = nextServiceDate;
          if (!nextDate) {
            const d = new Date();
            if (client.recurrence === 'MONTHLY') d.setMonth(d.getMonth() + 1);
            else if (client.recurrence === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
            else if (client.recurrence === 'SEMI_ANNUAL' || client.recurrence === 'SEMI-ANNUAL') d.setMonth(d.getMonth() + 6);
            else if (client.recurrence === 'ANNUAL') d.setFullYear(d.getFullYear() + 1);
            nextDate = d.toISOString().split('T')[0];
          }
          db.prepare("UPDATE clients SET lastServiceDate = date('now'), nextServiceDate = ? WHERE id = ?").run(nextDate, clientId);
          db.prepare("UPDATE services SET nextServiceDate = ? WHERE id = ?").run(nextDate, id);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Erro ao atualizar serviço" });
    }
  });

  app.get("/api/services/active", authenticate, (req: any, res) => {
    const active = db.prepare(`
      SELECT 
        s.id, s.clientId, s.volume, s.systemType, s.conditionBefore, s.servicesPerformed,
        s.technicianName, s.serviceDate, s.nextServiceDate, s.fireHazard, s.nfpaCompliance,
        s.reportNumber, s.notes, s.inspectionStartTime, s.inspectionChecklistBefore,
        s.completionTime, s.completionChecklistAfter, s.status,
        s.inspectionPhotosBefore, s.completionPhotosAfter, s.preCleaningChecklist,
        c.name as restaurantName 
      FROM services s 
      JOIN clients c ON s.clientId = c.id
      WHERE s.status = 'IN_PROGRESS' AND s.technicianName = ?
    `).get(req.user.name);
    res.json(active || null);
  });

  app.get("/api/services/:id/photos", authenticate, (req, res) => {
    const { id } = req.params;
    const servicePhotos = db.prepare(`
      SELECT inspectionPhotosBefore, completionPhotosAfter 
      FROM services 
      WHERE id = ?
    `).get(id);

    if (!servicePhotos) return res.status(404).json({ error: "Service not found" });
    res.json(servicePhotos);
  });

  app.get("/api/settings", authenticate, (req, res) => {
    const settings = db.prepare("SELECT key, value FROM settings").all();
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.get("/api/settings/public", (req, res) => {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'logo_image'").get() as any;
    res.json({ logo_image: setting ? setting.value : null });
  });

  app.put("/api/settings/:key", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { key } = req.params;
    const { value } = req.body;

    try {
      db.prepare(`
        INSERT INTO settings (key, value) 
        VALUES (?, ?) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(key, value);
      res.json({ success: true });
    } catch (e) {
      console.error("Error updating setting:", e);
      res.status(500).json({ error: "Erro ao atualizar configuração" });
    }
  });

  app.get("/api/stats", authenticate, (req, res) => {
    const activeClients = db.prepare("SELECT COUNT(*) as count FROM clients").get() as any;
    const servicesThisMonth = db.prepare("SELECT COUNT(*) as count FROM services WHERE strftime('%m', serviceDate) = strftime('%m', 'now')").get() as any;
    const completedServicesTotal = db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'COMPLETED'").get() as any;
    const overdueServices = db.prepare(`
      SELECT COUNT(*) as count FROM clients c
      JOIN (SELECT clientId, MAX(nextServiceDate) as nextDate FROM services GROUP BY clientId) s ON c.id = s.clientId
      WHERE s.nextDate < date('now')
    `).get() as any;

    const estimatedRevenueResult = db.prepare(`
      SELECT SUM(
        cleaningPrice * CASE recurrence
          WHEN 'MONTHLY' THEN 12
          WHEN 'QUARTERLY' THEN 4
          WHEN 'SEMI_ANNUAL' THEN 2
          WHEN 'SEMI-ANNUAL' THEN 2
          WHEN 'ANNUAL' THEN 1
          ELSE 4
        END
      ) as total FROM clients
    `).get() as any;

    // NFPA Compliance Rate
    const nfpaStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN nfpaCompliance = 1 THEN 1 ELSE 0 END) as compliant
      FROM services
      WHERE status = 'COMPLETED'
    `).get() as any;
    const nfpaRate = nfpaStats && nfpaStats.total > 0 ? Math.round((nfpaStats.compliant / nfpaStats.total) * 100) : 0;

    // Establishment Counts
    const establishmentData = db.prepare(`
      SELECT COALESCE(establishmentType, 'Restaurante') as name, COUNT(*) as value
      FROM clients
      GROUP BY COALESCE(establishmentType, 'Restaurante')
    `).all() as { name: string, value: number }[];

    // Monthly Trends (Last 6 Months)
    const monthlyData = db.prepare(`
      SELECT 
        strftime('%m', serviceDate) as monthNum,
        COUNT(*) as total
      FROM services
      WHERE serviceDate >= date('now', '-6 months')
      GROUP BY monthNum
      ORDER BY serviceDate ASC
    `).all() as any[];

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyTrends = monthlyData.map(d => ({
      name: monthNames[parseInt(d.monthNum, 10) - 1],
      total: d.total
    }));

    res.json({
      activeClients: activeClients.count,
      servicesThisMonth: servicesThisMonth.count,
      completedServicesTotal: completedServicesTotal.count,
      overdueServices: overdueServices.count,
      estimatedRevenue: estimatedRevenueResult.total || 0,
      nfpaRate,
      establishmentCounts: establishmentData,
      monthlyTrends
    });
  });

  app.get("/api/alerts", authenticate, (req, res) => {
    // Read the configured reminder days, default to 14
    const settingRow = db.prepare("SELECT value FROM settings WHERE key = 'reminder_days_before'").get() as any;
    const reminderDays = settingRow ? parseInt(settingRow.value, 10) : 14;

    const alerts = db.prepare(`
      SELECT 
        c.name as clientName, 
        c.phone,
        c.city,
        c.state,
        COALESCE(c.nextServiceDate, (SELECT MIN(nextServiceDate) FROM services WHERE clientId = c.id AND nextServiceDate >= date('now'))) as nextServiceDate
      FROM clients c
      HAVING nextServiceDate <= date('now', '+${reminderDays} days') AND nextServiceDate >= date('now')
      ORDER BY nextServiceDate ASC
    `).all();

    const alertsWithDays = alerts.map((a: any) => {
      const today = new Date();
      // Reset time to ensure accurate day differences
      today.setHours(0, 0, 0, 0);
      const nextDate = new Date(a.nextServiceDate);
      nextDate.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(nextDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return { ...a, daysUntil: diffDays };
    });

    res.json(alertsWithDays);
  });

  app.patch("/api/services/:id/cancel", authenticate, (req: any, res) => {
    const { id } = req.params;
    const { clientId, restaurantName } = req.body;
    try {
      db.prepare("UPDATE services SET status = 'CANCELLED' WHERE id = ? AND technicianName = ?").run(id, req.user.name);
      db.prepare("INSERT INTO notifications (message) VALUES (?)").run(`O técnico ${req.user.name} cancelou o serviço iniciado por engano em ${restaurantName || 'um cliente'}.`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling service:", error);
      res.status(500).json({ error: "Erro ao cancelar serviço" });
    }
  });

  app.get("/api/notifications", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY createdAt DESC").all();
    res.json(notifications);
  });

  app.delete("/api/notifications/:id", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Acesso negado" });
    const { id } = req.params;
    db.prepare("DELETE FROM notifications WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/proxy-image", authenticate, async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send("No URL");
    try {
      const resp = await fetch(imageUrl);
      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = resp.headers.get('content-type') || 'image/jpeg';
      const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
      res.send(base64);
    } catch (error) {
      console.error("Image proxy failed:", error);
      res.status(500).send("");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Email Transporter Setup
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Notify Admin on New Technician Access Request
  app.post("/api/request-account", async (req, res) => {
    const { email, name, phone } = req.body;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"D&E Hood Cleaning" <noreply@dehood.com>',
        to: 'dehoodcleaning@gmail.com',
        subject: 'Solicitação de Acesso - D&E Hood Cleaning',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Nova Solicitação de Acesso</h2>
            <p>Um técnico solicitou acesso ao sistema. Verifique os dados abaixo e crie a conta no painel se aprovado.</p>
            <ul style="line-height: 1.5;">
              <li><strong>Nome:</strong> ${name || 'Não informado'}</li>
              <li><strong>E-mail:</strong> ${email}</li>
              <li><strong>Telefone:</strong> ${phone || 'Não informado'}</li>
            </ul>
            <p>Acesse o painel administratvo na aba "Equipe" para criar o acesso dele e gerar uma senha.</p>
          </div>
        `
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to send signup notification email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily email notification check...');

    try {
      // 1. Get reminder days configuration from SQLite
      const reminderDaysRow = db.prepare("SELECT value FROM settings WHERE key = 'reminder_days_before'").get() as any;
      const reminderDays = parseInt(reminderDaysRow?.value || '19', 10);

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + reminderDays);
      const dateStr = targetDate.toISOString().split('T')[0];

      console.log(`Searching for clients with next service date: ${dateStr} (${reminderDays} days from now)`);

      // 2. Query Supabase for clients with next_service_date = targetDate
      const { data: upcomingClients, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('next_service_date', dateStr);

      if (error) throw error;

      if (upcomingClients && upcomingClients.length > 0) {
        for (const client of upcomingClients) {
          try {
            await transporter.sendMail({
              from: process.env.EMAIL_FROM || '"D&E Hood Cleaning" <noreply@dehood.com>',
              to: client.email,
              subject: 'Agendamento de Limpeza - D&E Hood Cleaning',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <h2 style="color: #10b981;">Olá, ${client.name}!</h2>
                  <p>Esperamos que esteja tudo bem.</p>
                  <p>Estamos entrando em contato para informar que sua próxima limpeza de coifa está prevista para daqui a <strong>${reminderDays} dias (${new Date(client.next_service_date).toLocaleDateString()})</strong>.</p>
                  <p>Gostaríamos de confirmar se este horário ainda é conveniente para você ou se precisamos reagendar.</p>
                  <div style="margin: 30px 0;">
                    <a href="tel:${process.env.SUPPORT_PHONE || '123456789'}" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirmar Agendamento</a>
                  </div>
                  <p style="color: #666; font-size: 12px;">D&E Hood Cleaning LLC - Qualidade e Segurança NFPA 96</p>
                </div>
              `
            });
            console.log(`Email sent to ${client.name} (${client.email})`);
          } catch (mailError) {
            console.error(`Failed to send email to ${client.name}:`, mailError);
          }
        }
      } else {
        console.log("No clients found for this target date.");
      }
    } catch (err) {
      console.error("Error in daily email cron job:", err);
    }
  });

  // Automatic Backup Task (Runs daily at 4:00 AM)
  cron.schedule('0 4 * * *', () => {
    console.log('Running daily database backup...');
    try {
      const backupPath = path.join(__dirname, `hood_cleaning_backup_${new Date().toISOString().split('T')[0]}.db`);
      fs.copyFileSync('hood_cleaning.db', backupPath);
      console.log(`Backup created successfully: ${backupPath}`);

      // Keep only last 7 days of backups
      const files = fs.readdirSync(__dirname);
      const backups = files.filter(f => f.startsWith('hood_cleaning_backup_')).sort();
      if (backups.length > 7) {
        for (let i = 0; i < backups.length - 7; i++) {
          fs.unlinkSync(path.join(__dirname, backups[i]));
          console.log(`Deleted old backup: ${backups[i]}`);
        }
      }
    } catch (error) {
      console.error('Backup failed:', error);
    }
  });

  // Endpoint to download database backup
  app.get("/api/admin/backup", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const dbFile = path.join(__dirname, 'hood_cleaning.db');
    res.download(dbFile, 'hood_cleaning_backup.db');
  });

  app.listen(PORT, "0.0.0.0", () => {
    const nets = os.networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          localIp = net.address;
        }
      }
    }
    console.log(`\n=========================================`);
    console.log(`📱 Acesso pelo Celular na mesma rede Wi-Fi:`);
    console.log(`👉 http://${localIp}:${PORT}`);
    console.log(`=========================================\n`);
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

```

---

## File: `src/App.tsx`

```typescript
import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  X,
  Camera,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Menu
} from 'lucide-react';
import { ServiceRecord, ServiceStatus, Recurrence, DashboardStats, Client, User } from './types';

// Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import ClientList from './components/clients/ClientList';
import ServiceHistory from './components/services/ServiceHistory';
import TeamManagement from './components/team/TeamManagement';
import Performance from './components/performance/Performance';
import SecurityBackup from './components/security/SecurityBackup';
import Automation from './components/automation/Automation';
import ConfigGuide from './components/guide/ConfigGuide';
import Modals from './components/common/Modals';
import CalendarView from './components/calendar/CalendarView';
import AdminSettings from './components/admin/AdminSettings';
import { translations, Language } from './translations';
import { segmentLabels, Segment } from './translations/segments';

// Utils
import { generatePDF } from './utils/pdfGenerator';
import { supabase } from './lib/supabase';
import { mapClient, unmapClient, mapService, unmapService, mapProfile, mapNotification } from './lib/supabaseUtils';

import { SignedIn, SignedOut, SignIn, SignUp, useUser, useAuth, useOrganization } from '@clerk/clerk-react';
import { setSupabaseToken } from './lib/supabaseToken';

export default function App() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut, getToken } = useAuth();
  const { organization } = useOrganization();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'calendar' | 'services' | 'automation' | 'guide' | 'team' | 'performance' | 'security' | 'admin_settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [techPerformance, setTechPerformance] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    servicesThisMonth: 0,
    completedServicesTotal: 0,
    overdueServices: 0,
    estimatedRevenue: 0
  });
  const [alerts, setAlerts] = useState<{ name: string, phone: string, nextServiceDate: string }[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | number | null>(null);
  const [activeService, setActiveService] = useState<ServiceRecord | null>(null);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);


  const [preCleaningChecklistData, setPreCleaningChecklistData] = useState<Record<string, boolean>>({});
  const [completionChecklist, setCompletionChecklist] = useState({
    polished: false, floorsCleaned: false, filtersInstalled: false, systemTested: false, stickersApplied: false
  });

  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);

  const [newClient, setNewClient] = useState({
    name: '', legalName: '', dba: '', state: '', zip: '', establishmentType: '', businessHours: '',
    address: '', city: '', county: '', managerName: '', managerRole: '',
    phone: '', email: '', hoodCount: 1, filterCount: 0, ductType: 'Vertical' as any,
    ductHeight: '', roofAccess: false, recurrence: Recurrence.QUARTERLY, cleaningPrice: 0
  });

  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'technician', phone: '', knowledgeLevel: 'Aprendiz', address: ''
  });

  const [newService, setNewService] = useState({
    clientId: 0, volume: 'Medium', systemType: 'Hood + Duct + Fan', conditionBefore: 'Moderate',
    servicesPerformed: '', technicianName: '', serviceDate: new Date().toISOString().split('T')[0],
    nextServiceDate: '', fireHazard: false, nfpaCompliance: true, reportNumber: '', notes: '',
    status: 'COMPLETED' as any
  });
  // Sync Supabase Token
  useEffect(() => {
    const syncToken = async () => {
      try {
        if (isSignedIn) {
          const token = await getToken({ template: 'supabase' });
          setSupabaseToken(token);
        } else {
          setSupabaseToken(null);
        }
      } catch (err) {
        console.error("Error syncing Supabase token:", err);
      }
    };
    syncToken();
  }, [isSignedIn, getToken, organization?.id]);

  // Clerk Sync logic
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      // Map Clerk User to our internal User structure so downstream components don't break
      const role = (clerkUser.publicMetadata.role as string) || 'admin';
      const userData: User = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        role: role as any,
        companyId: organization?.id || 'personal'
      };

      // Upsert profile to Supabase (so downstream queries can work)
      supabase.from('profiles').upsert({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        company_id: organization?.id || 'personal'
      }).then(({ error }) => {
        if (error) console.error("Error upserting profile:", error);
      });

      setUser(userData);
      fetchData(userData);
    } else if (isLoaded && !isSignedIn) {
      setUser(null);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  // Segment Engine
  const currentSegment = (settings['segment'] as Segment) || 'hood_cleaning';
  const s = segmentLabels[currentSegment];

  // Theme Injection
  useEffect(() => {
    const root = document.documentElement;
    if (settings['primary_color']) root.style.setProperty('--primary-color', settings['primary_color']);
    if (settings['bg_color']) root.style.setProperty('--bg-color', settings['bg_color']);
    if (settings['card_color']) root.style.setProperty('--card-color', settings['card_color']);
    if (settings['glow_intensity']) root.style.setProperty('--glow-intensity', settings['glow_intensity']);
  }, [settings]);

  const fetchData = async (currentUser = user) => {
    if (!currentUser) return;
    try {
      const fetchWithTimeout = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.ok ? r.json() : null);

      const [clientsDataResult, servicesDataResult, activeServiceResult, settingsResult, notificationsResult, profilesResult] = await Promise.all([
        supabase.from('clients').select('id, name, legal_name, dba, establishment_type, business_hours, address, city, state, zip, county, manager_name, manager_role, phone, email, hood_count, filter_count, duct_type, duct_height, roof_access, recurrence, last_service_date, next_service_date, cleaning_price, lat, lng, created_at'),
        supabase.from('services').select('id, client_id, restaurant_name, volume, system_type, condition_before, services_performed, technician_name, service_date, next_service_date, fire_hazard, nfpa_compliance, report_number, notes, inspection_start_time, status, completion_time').order('service_date', { ascending: false }).limit(50),
        supabase.from('services').select('*').eq('status', 'IN_PROGRESS').eq('technician_name', currentUser.name).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('settings').select('*'),
        currentUser.role === 'admin' ? supabase.from('notifications').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        currentUser.role === 'admin' ? supabase.from('profiles').select('*') : Promise.resolve({ data: [] })
      ]);

      let mappedClients: Client[] = [];
      let mappedServices: ServiceRecord[] = [];

      if (clientsDataResult.data) {
        mappedClients = clientsDataResult.data.map(mapClient);
        if (currentUser.role === 'technician') {
          const twentyDaysFromNow = new Date();
          twentyDaysFromNow.setDate(twentyDaysFromNow.getDate() + 20);
          mappedClients = mappedClients.filter(client => {
            if (!client.nextServiceDate) return false;
            const nextService = new Date(client.nextServiceDate);
            return nextService <= twentyDaysFromNow;
          });
        }
        setClients(mappedClients);
      }

      if (servicesDataResult.data) {
        mappedServices = servicesDataResult.data.map(mapService);
        if (currentUser.role === 'technician') {
          const twentyDaysFromNow = new Date();
          twentyDaysFromNow.setDate(twentyDaysFromNow.getDate() + 20);
          mappedServices = mappedServices.filter(service => {
            if (!service.nextServiceDate) return true;
            const nextService = new Date(service.nextServiceDate);
            return nextService <= twentyDaysFromNow;
          });
        }
        setServices(mappedServices);
      }

      if (profilesResult.data) {
        setUsers(profilesResult.data.map(mapProfile));
      }

      const settingsData: Record<string, string> = {};
      if (settingsResult.data) {
        settingsResult.data.forEach((s: any) => {
          settingsData[s.key] = s.value;
        });
        setSettings(settingsData);
      }

      if (notificationsResult.data) {
        setNotifications(notificationsResult.data.map(mapNotification));
      }

      // Compute Stats locally using Supabase Data instead of SQLite
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const newStats: DashboardStats = {
        activeClients: mappedClients.length,
        servicesThisMonth: mappedServices.filter(s => {
          const d = new Date(s.serviceDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length,
        completedServicesTotal: mappedServices.filter(s => s.status === 'COMPLETED').length,
        overdueServices: mappedClients.filter(c => c.nextServiceDate && new Date(c.nextServiceDate) < now).length,
        estimatedRevenue: mappedClients.reduce((sum, c) => {
          let mult = 4;
          if (c.recurrence === Recurrence.MONTHLY) mult = 12;
          else if (c.recurrence === Recurrence.SEMI_ANNUAL || c.recurrence === 'SEMI-ANNUAL' as any) mult = 2;
          else if (c.recurrence === Recurrence.ANNUAL) mult = 1;
          return sum + (c.cleaningPrice || 0) * mult;
        }, 0),
        nfpaRate: 0,
        establishmentCounts: [],
        monthlyTrends: []
      };

      const completed = mappedServices.filter(s => s.status === 'COMPLETED');
      if (completed.length > 0) {
        newStats.nfpaRate = Math.round((completed.filter(s => s.nfpaCompliance).length / completed.length) * 100);
      }

      const estCounts: Record<string, number> = {};
      mappedClients.forEach(c => {
        const type = c.establishmentType || 'Restaurante';
        estCounts[type] = (estCounts[type] || 0) + 1;
      });
      newStats.establishmentCounts = Object.entries(estCounts).map(([name, value]) => ({ name, value }));

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const trends: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        trends[monthNames[d.getMonth()]] = 0;
      }
      mappedServices.forEach(s => {
        const d = new Date(s.serviceDate);
        const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        if (monthDiff >= 0 && monthDiff <= 5) {
          const mName = monthNames[d.getMonth()];
          if (trends[mName] !== undefined) trends[mName]++;
        }
      });
      newStats.monthlyTrends = Object.entries(trends).map(([name, total]) => ({ name, total }));

      setStats(newStats);

      // Compute Alerts Localy
      const reminderDays = settingsData ? parseInt(settingsData['reminder_days_before'] || '14', 10) : 14;
      const computedAlerts = mappedClients.filter(c => {
        if (!c.nextServiceDate) return false;
        const nextDate = new Date(c.nextServiceDate);
        nextDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays >= 0 && diffDays <= reminderDays;
      }).map(c => {
        const nextDate = new Date(c.nextServiceDate!);
        nextDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          name: c.name,
          phone: c.phone || '',
          city: c.city || '',
          state: c.state || '',
          clientName: c.name,
          nextServiceDate: c.nextServiceDate,
          daysUntil: diffDays
        };
      }).sort((a, b) => new Date(a.nextServiceDate!).getTime() - new Date(b.nextServiceDate!).getTime());

      setAlerts(computedAlerts);

      if (settingsData) setSettings(settingsData);

      if (activeServiceResult.data) {
        const srv = mapService(activeServiceResult.data);
        setActiveService(srv);

        // Sincroniza estados de fotos para serviços retomados
        if (srv.inspectionPhotosBefore) {
          try {
            const photos = typeof srv.inspectionPhotosBefore === 'string'
              ? JSON.parse(srv.inspectionPhotosBefore)
              : srv.inspectionPhotosBefore;
            setInspectionPhotos(Array.isArray(photos) ? photos : []);
          } catch (e) {
            console.error("Error parsing inspection photos:", e);
          }
        }

        if (srv.completionPhotosAfter) {
          try {
            const photos = typeof srv.completionPhotosAfter === 'string'
              ? JSON.parse(srv.completionPhotosAfter)
              : srv.completionPhotosAfter;
            setCompletionPhotos(Array.isArray(photos) ? photos : []);
          } catch (e) {
            console.error("Error parsing completion photos:", e);
          }
        }

        if (srv.preCleaningChecklist) {
          try {
            setPreCleaningChecklistData(JSON.parse(srv.preCleaningChecklist));
          } catch (e) {
            console.error("Error parsing pre-cleaning checklist:", e);
          }
        }
      } else {
        setActiveService(null);
      }

      // Settings already fetched in the main Promise.all above

      if (currentUser.role === 'admin') {
        const [usersRes, notifRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('notifications').select('*')
        ]);

        if (usersRes.data) setUsers(usersRes.data.map(mapProfile));
        if (notifRes.data) setNotifications(notifRes.data.map(mapNotification));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Deleted old generic Auth Effect init

  async function geocodeAddress(addressStr: string): Promise<{ lat: number, lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'DE-Hood-Cleaning-App/1.0' } });
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (e) {
      console.error("Geocoding failed:", e);
      return null;
    }
  }

  // API Handlers (extracted from old App.tsx)
  const validateClient = (client: any, userRole?: string) => {
    try {
      if (!client?.name || String(client.name).trim() === '') return "Por favor, preencha o Nome do Restaurante.";
      if (!client?.address || String(client.address).trim() === '') return "Por favor, preencha o Endereço Completo.";
      if (!client?.city || String(client.city).trim() === '') return "Por favor, preencha a Cidade.";
      if (!client?.managerName || String(client.managerName).trim() === '') return "Por favor, preencha o Gerente / Responsável.";
      if (!client?.phone || String(client.phone).trim() === '') return "Por favor, preencha o Telefone.";
      if (!client?.email || String(client.email).trim() === '') return "Por favor, preencha o E-mail.";
      if (userRole === 'admin' && (client.cleaningPrice === undefined || client.cleaningPrice === null || client.cleaningPrice === '')) {
        return "Por favor, insira o Preço da Limpeza Geral.";
      }
      return null;
    } catch (err: any) {
      return "Erro de código ao validar: " + err.message;
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validationError = validateClient(newClient, user?.role);
      if (validationError) {
        alert("Erro de Validação:\n\n" + validationError);
        return;
      }

      let lat = null;
      let lng = null;
      const addressStr = `${newClient.address}, ${newClient.city || ''}, ${newClient.state || ''}, ${newClient.zip || ''}`;
      const geo = await geocodeAddress(addressStr);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }

      const payload = unmapClient({ ...newClient, lat, lng } as any);

      const { data: createdData, error } = await supabase.from('clients')
        .insert([payload])
        .select()
        .single();

      if (error) {
        alert("Erro ao adicionar cliente (Supabase):\n" + error.message + "\nDetalhes: " + JSON.stringify(error));
        return;
      }

      if (createdData) {
        const createdClient = mapClient(createdData);
        setClients(prev => [...prev, createdClient]);
        setShowClientModal(false);
        setNewClient({
          name: '', legalName: '', dba: '', state: '', zip: '', establishmentType: '', businessHours: '',
          address: '', city: '', county: '', managerName: '', managerRole: '',
          phone: '', email: '', hoodCount: 1, filterCount: 0, ductType: 'Vertical' as any,
          ductHeight: '', roofAccess: false, recurrence: Recurrence.QUARTERLY, cleaningPrice: 0
        });
        alert("Cliente criado com sucesso!");
      }
    } catch (err: any) {
      alert("ERRO INESPERADO no formulário (contate o suporte):\n" + err.message + "\n" + err.stack);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const validationError = validateClient(editingClient, user?.role);
    if (validationError) {
      alert("Erro de Validação:\n\n" + validationError);
      return;
    }

    let lat = editingClient.lat;
    let lng = editingClient.lng;
    const addressStr = `${editingClient.address}, ${editingClient.city || ''}, ${editingClient.state || ''}, ${editingClient.zip || ''}`;
    const geo = await geocodeAddress(addressStr);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }

    const { data: updatedData, error } = await supabase.from('clients')
      .update(unmapClient({ ...editingClient, lat, lng }))
      .eq('id', editingClient.id)
      .select()
      .single();

    if (error) {
      alert("Erro ao atualizar cliente: " + error.message);
      return;
    }

    if (updatedData) {
      const updatedClient = mapClient(updatedData);
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    }

    setShowEditClientModal(false);
    setEditingClient(null);
  };

  const handleDeleteClient = async (id: string | number) => {
    if (!window.confirm("Tem certeza que deseja apagar este cliente? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      alert("Erro ao remover cliente: " + error.message);
      return;
    }
    setClients(prev => prev.filter(c => c.id !== id));
    setServices(prev => prev.filter(s => s.clientId !== id));
    setShowClientDetails(false);
    setShowEditClientModal(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            fullname: newUser.name,
            role: newUser.role,
            phone: newUser.phone,
            knowledge_level: newUser.knowledgeLevel,
            address: newUser.address
          }
        }
      });
      if (error) throw error;

      if (data.user) {
        const profilePayload = {
          id: data.user.id,
          email: newUser.email,
          name: newUser.name || newUser.email.split('@')[0],
          role: newUser.role as any,
          phone: newUser.phone,
          status: 'active' as const,
          knowledge_level: newUser.knowledgeLevel,
          address: newUser.address
        };

        const { data: profileData } = await supabase.from('profiles').upsert(profilePayload).select().single();

        if (profileData) {
          setUsers(prev => [...prev, mapProfile(profileData)]);
        }
      }

      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'technician', phone: '', knowledgeLevel: 'Aprendiz', address: '' });
      alert("Usuário criado com sucesso!");
    } catch (error: any) {
      alert("Erro ao criar usuário: " + error.message);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error("Error deleting notification", e);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const { data: updatedData, error } = await supabase.from('profiles').update({
        name: editingUser.name,
        role: editingUser.role,
        phone: editingUser.phone,
        status: editingUser.status,
        address: editingUser.address,
        knowledge_level: editingUser.knowledgeLevel
      }).eq('id', editingUser.id).select().single();

      if (!error && updatedData) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? mapProfile(updatedData) : u));
        setShowEditUserModal(false);
        setEditingUser(null);
      } else {
        alert("Erro ao atualizar usuário: " + (error?.message || "Erro desconhecido"));
      }
    } catch (e: any) {
      alert("Erro ao atualizar usuário.");
    }
  };

  const handleStartService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Você tem certeza que deseja iniciar o serviço neste cliente agora? O cronômetro será iniciado.")) {
      return;
    }
    try {
      const client = clients.find(c => c.id === selectedClientId);
      const payload = unmapService({
        ...newService,
        restaurantName: client?.name || 'N/A',
        serviceDate: newService.serviceDate || new Date().toISOString().split('T')[0],
        technicianName: user?.name || newService.technicianName || 'Technician',
        volume: newService.volume as "Low" | "Medium" | "High",
        conditionBefore: newService.conditionBefore as "Light" | "Moderate" | "Heavy",
        clientId: selectedClientId as number,
        status: 'IN_PROGRESS',
        inspectionStartTime: new Date().toISOString(),

        inspectionPhotosBefore: inspectionPhotos as any,
        preCleaningChecklist: JSON.stringify(preCleaningChecklistData) as any
      });
      // Remove any undefined values
      Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

      const { data: createdData, error } = await supabase.from('services')
        .insert([payload])
        .select()
        .single();

      if (!error && createdData) {
        const createdService = mapService(createdData);
        setServices(prev => [createdService, ...prev]);
        setActiveService(createdService);

        setShowServiceModal(false);
        setSelectedClientId(null);
        setInspectionPhotos([]);
        setPreCleaningChecklistData({});
      } else {
        alert("Erro ao iniciar serviço: " + (error?.message || "Erro desconhecido"));
      }
    } catch (e: any) {
      alert("Erro ao iniciar serviço.");
    }
  };

  const handleCancelService = async () => {
    if (!activeService) return;
    if (!window.confirm("Certeza que deseja cancelar este serviço? O administrador será notificado.")) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', activeService.id);
      if (!error) {
        setServices(prev => prev.filter(s => s.id !== activeService.id));
        setActiveService(null);
        setInspectionPhotos([]);
      } else {
        alert("Erro ao cancelar o serviço: " + error.message);
      }
    } catch (e) {
      alert("Erro de conexão com o servidor ao cancelar o serviço.");
    }
  };

  const handleCompleteService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeService) return;
    try {
      const payload = unmapService({
        status: 'COMPLETED',
        serviceDate: new Date().toISOString().split('T')[0], // Atualiza para a data real da execução
        completionTime: new Date().toISOString(),
        completionChecklistAfter: completionChecklist as any,
        completionPhotosAfter: completionPhotos as any,
        fireHazard: newService.fireHazard,
        nfpaCompliance: newService.nfpaCompliance,
        notes: newService.notes,
        nextServiceDate: newService.nextServiceDate,
        preCleaningChecklist: JSON.stringify(preCleaningChecklistData) as any
      });
      // Remove undefined values
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const updatePromise = (supabase.from('services').update(payload).eq('id', activeService.id).select().single() as unknown) as Promise<any>;

      // Atualiza a próxima data de serviço no cliente baseando-se na recorrência
      const client = clients.find(c => c.id === activeService.clientId);
      let clientUpdatePromise = Promise.resolve({ data: null, error: null }) as unknown as Promise<any>;

      const today = new Date();
      let nextDate = new Date(today);

      if (client) {
        if (client.recurrence === Recurrence.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
        else if (client.recurrence === Recurrence.QUARTERLY) nextDate.setMonth(nextDate.getMonth() + 3);
        else if (client.recurrence === Recurrence.SEMI_ANNUAL || client.recurrence === 'SEMI-ANNUAL' as any) nextDate.setMonth(nextDate.getMonth() + 6);
        else if (client.recurrence === Recurrence.ANNUAL) nextDate.setFullYear(nextDate.getFullYear() + 1);

        clientUpdatePromise = (supabase.from('clients').update({
          last_service_date: today.toISOString(),
          next_service_date: nextDate.toISOString()
        }).eq('id', client.id).select().single() as unknown) as Promise<any>;
      }

      const [srvRes, cliRes] = await Promise.all([updatePromise, clientUpdatePromise]);

      if (!srvRes.error) {
        // Update local services state
        if (srvRes.data) {
          const completedService = mapService(srvRes.data);
          setServices(prev => prev.map(s => s.id === completedService.id ? completedService : s));
        }

        // Update local clients state
        if (cliRes.data && client) {
          const updatedClient = mapClient(cliRes.data);
          setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        }

        // Trigger Resend email (non-blocking for UI)
        const clientEmail = client?.email;
        if (clientEmail) {
          supabase.functions.invoke('send-report', {
            body: {
              clientEmail,
              restaurantName: activeService.restaurantName || "Estabelecimento",
              pdfUrl: `https://dehoodcleaning.com/report/${activeService.id}`,
              serviceDate: new Date().toISOString()
            }
          }).catch(err => console.error("Error sending email:", err));
        }

        setActiveService(null);
        setCompletionPhotos([]);
        setCompletionChecklist({
          polished: false, floorsCleaned: false, filtersInstalled: false, systemTested: false, stickersApplied: false
        });
      } else {
        alert("Erro ao enviar o relatório para o Servidor: " + srvRes.error.message);
      }
    } catch (e) {
      alert("Erro de conexão com o servidor ao finalizar o serviço.");
    }
  };

  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  const filteredClients = useMemo(() => clients.filter(c =>
    c.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(deferredSearchTerm.toLowerCase())
  ), [clients, deferredSearchTerm]);

  const filteredServices = useMemo(() => services.filter(s =>
    s.restaurantName?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
    s.technicianName.toLowerCase().includes(deferredSearchTerm.toLowerCase())
  ), [services, deferredSearchTerm]);


  const recentServices = useMemo(() => [...services].sort((a, b) =>
    new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
  ).slice(0, 5), [services]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        {authView === 'landing' ? (
          <LandingPage
            onLogin={() => setAuthView('login')}
            onStartTrial={() => setAuthView('register')}
          />
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md relative">
              <button
                onClick={() => setAuthView('landing')}
                className="absolute -top-12 left-0 text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium transition-colors"
              >
                ← Voltar
              </button>
              {authView === 'login' ? <SignIn routing="hash" /> : <SignUp routing="hash" />}
            </div>
          </div>
        )}
      </SignedOut>

      <SignedIn>
        {!user ? (
          <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="min-h-screen bg-[#09090b] flex font-sans text-white/90">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              user={user}
              handleLogout={handleLogout}
              isOpen={isMobileMenuOpen}
              setIsOpen={setIsMobileMenuOpen}
              settings={settings}
              segmentLabels={s}
            />

            <main className="flex-1 overflow-y-auto hud-grid hud-scanline">
              {/* Mobile Header Toggle */}
              <div className="md:hidden flex items-center justify-between p-4 bg-[#151619] border-b border-white/10">
                <img src={settings?.logo_image || "https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl"} alt="D&E Logo" className="h-10 object-contain drop-shadow-md" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.style.display = 'none'} />
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-none transition-colors"
                >
                  <Menu size={24} />
                </button>
              </div>

              <Header
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                user={user}
                setShowClientModal={setShowClientModal}
                settings={settings}
                segmentLabels={s}
              />

              <div className="p-4 md:p-8 max-w-7xl mx-auto">
                {activeTab === 'dashboard' && (
                  <Dashboard
                    user={user}
                    stats={stats}
                    recentServices={recentServices}
                    alerts={alerts}
                    services={services}
                    activeService={activeService}
                    completionChecklist={completionChecklist}
                    setCompletionChecklist={setCompletionChecklist}
                    newService={newService}
                    setNewService={setNewService}
                    handleCompleteService={handleCompleteService}
                    handleCancelService={handleCancelService}
                    handleDeleteNotification={handleDeleteNotification}
                    notifications={notifications}
                    completionPhotos={completionPhotos}
                    setCompletionPhotos={setCompletionPhotos}
                    preCleaningChecklistData={preCleaningChecklistData}
                    setPreCleaningChecklistData={setPreCleaningChecklistData}
                    users={clients}
                    settings={settings}
                    segmentLabels={s}
                  />
                )}

                {activeTab === 'clients' && (
                  <ClientList
                    user={user}
                    filteredClients={filteredClients}
                    setShowClientModal={setShowClientModal}
                    setSelectedClient={setSelectedClient}
                    setShowClientDetails={setShowClientDetails}
                    setEditingClient={setEditingClient}
                    setShowEditClientModal={setShowEditClientModal}
                    setSelectedClientId={setSelectedClientId}
                    setShowServiceModal={setShowServiceModal}
                    handleDeleteClient={handleDeleteClient}
                    settings={settings}
                    segmentLabels={s}
                  />
                )}

                {activeTab === 'calendar' && (
                  <CalendarView
                    clients={clients}
                    services={services}
                    settings={settings}
                    segmentLabels={s}
                  />
                )}

                {activeTab === 'services' && (
                  <ServiceHistory
                    user={user}
                    clients={clients}
                    filteredServices={services}
                    generatePDF={generatePDF}
                    logoUrl={settings?.logo_image}
                    settings={settings}
                    segmentLabels={s}
                  />
                )}

                {activeTab === 'team' && user.role === 'admin' && (
                  <TeamManagement
                    users={users}
                    setShowUserModal={setShowUserModal}
                    setEditingUser={setEditingUser}
                    setShowEditUserModal={setShowEditUserModal}
                  />
                )}

                {activeTab === 'performance' && user.role === 'admin' && (
                  <Performance users={users} services={services} />
                )}

                {activeTab === 'admin_settings' && user.role === 'admin' && (
                  <AdminSettings user={user} settings={settings} fetchData={fetchData} />
                )}

                {activeTab === 'security' && user.role === 'admin' && (
                  <SecurityBackup />
                )}

                {activeTab === 'automation' && user.role === 'admin' && (
                  <Automation settings={settings} fetchData={fetchData} />
                )}

                {activeTab === 'guide' && user.role === 'admin' && (
                  <ConfigGuide />
                )}
              </div>
            </main>

            <Modals
              showClientModal={showClientModal}
              setShowClientModal={setShowClientModal}
              showEditClientModal={showEditClientModal}
              setShowEditClientModal={setShowEditClientModal}
              editingClient={editingClient}
              setEditingClient={setEditingClient}
              handleCreateClient={handleCreateClient}
              handleUpdateClient={handleUpdateClient}
              handleDeleteClient={handleDeleteClient}
              newClient={newClient}
              setNewClient={setNewClient}
              showUserModal={showUserModal}
              setShowUserModal={setShowUserModal}
              showEditUserModal={showEditUserModal}
              setShowEditUserModal={setShowEditUserModal}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
              handleCreateUser={handleCreateUser}
              handleUpdateUser={handleUpdateUser}
              newUser={newUser}
              setNewUser={setNewUser}
              showServiceModal={showServiceModal}
              setShowServiceModal={setShowServiceModal}
              handleStartService={handleStartService}

              inspectionPhotos={inspectionPhotos}
              setInspectionPhotos={setInspectionPhotos}
              preCleaningChecklistData={preCleaningChecklistData}
              setPreCleaningChecklistData={setPreCleaningChecklistData}
              settings={settings}
              showClientDetails={showClientDetails}
              setShowClientDetails={setShowClientDetails}
              selectedClient={selectedClient}
              user={user}
            />
          </div>
        )}
      </SignedIn>
    </>
  );
}

```

---

## File: `src/types.ts`

```typescript
export enum ServiceStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  OVERDUE = "OVERDUE",
}

export enum Recurrence {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  SEMI_ANNUAL = "SEMI_ANNUAL",
  ANNUAL = "ANNUAL"
}

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'admin' | 'technician';
  companyId?: string;
  phone?: string;
  knowledgeLevel?: string;
  address?: string;
  joinDate?: string;
  status?: 'active' | 'pending';
}

export interface Client {
  id: string | number;
  name: string;
  legalName?: string;
  dba?: string;
  establishmentType?: string;
  businessHours?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
  county?: string;
  managerName: string;
  managerRole?: string;
  phone: string;
  email: string;
  hoodCount?: number;
  filterCount?: number;
  ductType?: 'Horizontal' | 'Vertical' | 'Both';
  ductHeight?: string;
  roofAccess?: boolean;
  recurrence: Recurrence;
  lastServiceDate?: string;
  nextServiceDate?: string;
  createdAt: string;
  cleaningPrice?: number;
  lat?: number;
  lng?: number;
}

export interface ServiceRecord {
  id: string | number;
  clientId: string | number;
  restaurantName?: string;
  volume: "Low" | "Medium" | "High";
  systemType: string;
  conditionBefore: "Light" | "Moderate" | "Heavy";
  servicesPerformed: string;
  technicianName: string;
  serviceDate: string;
  nextServiceDate: string;
  fireHazard: boolean;
  nfpaCompliance: boolean;
  reportNumber: string;
  notes?: string;
  // New Inspection Fields
  inspectionStartTime?: string;
  inspectionPhotosBefore?: string; // JSON array of 6 photo URLs/placeholders
  inspectionChecklistBefore?: string; // JSON object
  completionTime?: string;
  completionPhotosAfter?: string; // JSON array
  completionChecklistAfter?: string; // JSON object
  preCleaningChecklist?: string;     // JSON object for Pre-Cleaning Inspection
  status: 'IN_PROGRESS' | 'COMPLETED';
}

export interface DashboardStats {
  activeClients: number;
  servicesThisMonth: number;
  completedServicesTotal?: number;
  overdueServices: number;
  estimatedRevenue: number;
  nfpaRate?: number;
  establishmentCounts?: { name: string; value: number }[];
  monthlyTrends?: { name: string; total: number }[];
}

```

---

## File: `src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error("Clerk Publishable Key is missing from .env File!");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
);

```

---

## File: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

import { supabaseToken } from './supabaseToken';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bzfahuvhvlolmwazhtuv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_f2lSWHXUh0zAgWrRXwftyQ_ykAYFB6u';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: async (url, options: any = {}) => {
            const headers = new Headers(options.headers);
            if (supabaseToken) {
                headers.set('Authorization', `Bearer ${supabaseToken}`);
            }
            return fetch(url, { ...options, headers });
        },
    },
});

```

---

## File: `src/translations/segments.ts`

```typescript
export type Segment = 'hood_cleaning' | 'hvac' | 'security' | 'pest_control';

export interface SegmentLabels {
    client: string;
    clients: string;
    technician: string;
    technicians: string;
    service: string;
    services: string;
    equipment: string;
    equipments: string;
    report: string;
    next_check: string;
}

export const segmentLabels: Record<Segment, SegmentLabels> = {
    hood_cleaning: {
        client: "Estabelecimento",
        clients: "Estabelecimentos",
        technician: "Técnico",
        technicians: "Equipe Técnica",
        service: "Limpeza de Coifa",
        services: "Histórico de Limpezas",
        equipment: "Sistema de Exaustão",
        equipments: "Sistemas",
        report: "Relatório NFPA",
        next_check: "Próxima Limpeza"
    },
    hvac: {
        client: "Edifício/Unidade",
        clients: "Unidades",
        technician: "Engenheiro",
        technicians: "Corpo de Engenharia",
        service: "Manutenção Preventiva",
        services: "Ordens de Serviço",
        equipment: "Unidade de Ar/Chiller",
        equipments: "Maquinário",
        report: "Laudo Técnico PMOC",
        next_check: "Próxima Revisão"
    },
    security: {
        client: "Posto/Cliente",
        clients: "Postos de Vigilância",
        technician: "Vigilante/Inspetor",
        technicians: "Efetivo",
        service: "Ronda/Inspeção",
        services: "Livro de Ocorrências",
        equipment: "Ponto de Controle",
        equipments: "Perímetros",
        report: "Relatório de Incidente",
        next_check: "Próxima Ronda"
    },
    pest_control: {
        client: "Localidade",
        clients: "Pontos de Isca",
        technician: "Aplicador",
        technicians: "Equipe de Campo",
        service: "Aplicação/Visita",
        services: "Ciclo de Tratamento",
        equipment: "Dispositivo/Armadilha",
        equipments: "Dispositivos",
        report: "Certificado de Desratização",
        next_check: "Próximo Reforço"
    }
};

```

---

## File: `src/translations/index.ts`

```typescript
export type Language = 'pt' | 'en' | 'es' | 'fr' | 'it';

export const translations = {
    pt: {
        dashboard: "Painel",
        clients: "Clientes",
        calendar: "Calendário",
        services: "Serviços",
        automation: "Automação",
        performance: "Performance",
        security: "Segurança",
        guide: "Guia",
        admin_settings: "Configurações Admin",
        logout: "Sair",
        welcome: "Bem-vindo",
        team: "Equipe",
        active_clients: "Clientes Ativos",
        services_month: "Serviços este Mês",
        completed_total: "Total Concluído",
        overdue: "Atrasados",
        revenue_est: "Receita Estimada",
        next_service: "Próximo Serviço",
        status_online: "Status: Online",
        save: "Salvar",
        saving: "Salvando...",
        language: "Idioma",
        general: "Geral",
        notifications: "Notificações",
        appearance: "Aparência",
        business_rules: "Regras de Negócio",
        system: "Sistema",
    },
    en: {
        dashboard: "Dashboard",
        clients: "Clients",
        calendar: "Calendar",
        services: "Services",
        automation: "Automation",
        performance: "Performance",
        security: "Security",
        guide: "Guide",
        admin_settings: "Admin Settings",
        logout: "Logout",
        welcome: "Welcome",
        team: "Team",
        active_clients: "Active Clients",
        services_month: "Services this Month",
        completed_total: "Completed Total",
        overdue: "Overdue",
        revenue_est: "Estimated Revenue",
        next_service: "Next Service",
        status_online: "Status: Online",
        save: "Save",
        saving: "Saving...",
        language: "Language",
        general: "General",
        notifications: "Notifications",
        appearance: "Appearance",
        business_rules: "Business Rules",
        system: "System",
    },
    es: {
        dashboard: "Tablero",
        clients: "Clientes",
        calendar: "Calendario",
        services: "Servicios",
        automation: "Automatización",
        performance: "Rendimiento",
        security: "Seguridad",
        guide: "Guía",
        admin_settings: "Ajustes de Admin",
        logout: "Cerrar sesión",
        welcome: "Bienvenido",
        team: "Equipo",
        active_clients: "Clientes Activos",
        services_month: "Servicios este Mes",
        completed_total: "Total Completado",
        overdue: "Atrasado",
        revenue_est: "Ingresos Estimados",
        next_service: "Próximo Servicio",
        status_online: "Estado: En línea",
        save: "Guardar",
        saving: "Guardando...",
        language: "Idioma",
        general: "General",
        notifications: "Notificaciones",
        appearance: "Apariencia",
        business_rules: "Reglas de Negocio",
        system: "Sistema",
    },
    fr: {
        dashboard: "Tableau de bord",
        clients: "Clients",
        calendar: "Calendrier",
        services: "Services",
        automation: "Automatisation",
        performance: "Performance",
        security: "Sécurité",
        guide: "Guide",
        admin_settings: "Paramètres Admin",
        logout: "Déconnexion",
        welcome: "Bienvenue",
        team: "Équipe",
        active_clients: "Clients Actifs",
        services_month: "Services ce Mois",
        completed_total: "Total Terminé",
        overdue: "En retard",
        revenue_est: "Revenu Estimé",
        next_service: "Prochain Service",
        status_online: "Statut: En ligne",
        save: "Enregistrer",
        saving: "Enregistrement...",
        language: "Langue",
        general: "Général",
        notifications: "Notifications",
        appearance: "Apparence",
        business_rules: "Règles d'affaires",
        system: "Système",
    },
    it: {
        dashboard: "Dashboard",
        clients: "Clienti",
        calendar: "Calendario",
        services: "Servizi",
        automation: "Automazione",
        performance: "Performance",
        security: "Sicurezza",
        guide: "Guida",
        admin_settings: "Impostazioni Admin",
        logout: "Disconnetti",
        welcome: "Benvenuto",
        team: "Squadra",
        active_clients: "Clienti Attivi",
        services_month: "Servizi questo Mese",
        completed_total: "Totale Completato",
        overdue: "In ritardo",
        revenue_est: "Entrate Stimate",
        next_service: "Prossimo Servizio",
        status_online: "Stato: Online",
        save: "Salva",
        saving: "Salvataggio...",
        language: "Lingua",
        general: "Generale",
        notifications: "Notifiche",
        appearance: "Aspetto",
        business_rules: "Regole di Business",
        system: "Sistema",
    }
};

```

---

## File: `src/utils/timeUtils.ts`

```typescript
/**
 * Safely parses a date string, specifically handling the "one-day-back" problem 
 * by treating YYYY-MM-DD as local date instead of UTC if needed.
 */
export const ensureLocalDate = (dateInput?: string | Date | null): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;

    // If it's a simple YYYY-MM-DD string, parse it manually to avoid UTC shift
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a date as DD/MM/YYYY (Brazilian Standard).
 */
export const formatDate = (dateInput?: string | Date | null): string => {
    const d = ensureLocalDate(dateInput);
    if (!d) return "N/A";

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Formats a date as HH:MM (Local Time).
 */
export const formatTime = (dateInput?: string | Date | null): string => {
    const d = ensureLocalDate(dateInput);
    if (!d) return "--:--";

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
};

/**
 * Formats as DD/MM/YYYY HH:MM.
 */
export const formatDateTime = (dateInput?: string | Date | null): string => {
    const date = formatDate(dateInput);
    const time = formatTime(dateInput);
    if (date === "N/A") return "N/A";
    return `${date} ${time}`;
};

/**
 * Calculates the formatted duration between two ISO date strings.
 * Returns a human-readable string like "2h 15m" or "45m".
 * If dates are invalid or missing, returns "N/A".
 */
export const calculateDuration = (startStr?: string | null, endStr?: string | null): string => {
    if (!startStr || !endStr) return "N/A";

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "N/A";

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return "< 1m";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;

    return `${hours}h ${minutes}m`;
};

/**
 * Calculates the raw duration in hours (decimal) for profitability math.
 */
export const calculateDurationHours = (startStr?: string | null, endStr?: string | null): number => {
    if (!startStr || !endStr) return 0;

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;

    return diffMs / (1000 * 60 * 60);
};

```

---

## File: `src/utils/storageUtils.ts`

```typescript
import { supabase } from '../lib/supabase';

/**
 * Uploads a base64 image or File to Supabase Storage and returns the public URL.
 * @param fileOrBase64 The image to upload
 * @param bucket The storage bucket name
 * @returns Public URL of the uploaded image
 */
export const uploadImage = async (fileOrBase64: File | string, bucket = 'photos'): Promise<string> => {
    try {
        let blob: Blob;
        let fileName: string;

        if (typeof fileOrBase64 === 'string') {
            // Convert base64 to Blob
            const base64Content = fileOrBase64.split(',')[1];
            const mimeType = fileOrBase64.split(',')[0].split(':')[1].split(';')[0];
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: mimeType });
            fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        } else {
            blob = fileOrBase64;
            fileName = `${Date.now()}_${fileOrBase64.name}`;
        }

        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

```

---

## File: `src/utils/imageUtils.ts`

```typescript
export const compressImage = (file: File, initialMaxWidth = 1920, initialQuality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const MAX_BASE64_SIZE = 1600000; // ~1.2MB limit for base64 string length

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                let currentMaxWidth = initialMaxWidth;
                let currentQuality = initialQuality;

                const attemptCompression = () => {
                    // Update dimensions based on current limits
                    let drawWidth = width;
                    let drawHeight = height;

                    if (drawWidth > currentMaxWidth) {
                        drawHeight = Math.round((drawHeight * currentMaxWidth) / drawWidth);
                        drawWidth = currentMaxWidth;
                    }

                    canvas.width = drawWidth;
                    canvas.height = drawHeight;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(img.src);
                        return;
                    }

                    // Reset background
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, drawWidth, drawHeight);
                    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

                    const base64Data = canvas.toDataURL('image/jpeg', currentQuality);

                    // Check if it fits the limit
                    if (base64Data.length <= MAX_BASE64_SIZE) {
                        resolve(base64Data);
                    } else {
                        // Iteratively reduce downscale and quality
                        currentQuality -= 0.15;
                        currentMaxWidth = Math.round(currentMaxWidth * 0.85);

                        // Failsafe limit
                        if (currentQuality < 0.2 || currentMaxWidth < 600) {
                            console.warn("Image compression hit lower limits, returning resulting base64 anyway.");
                            resolve(base64Data);
                        } else {
                            // Recursively try again
                            attemptCompression();
                        }
                    }
                };

                // Trigger first attempt
                attemptCompression();
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

```

---

## File: `src/utils/preCleaningChecklist.ts`

```typescript
export interface PreCleaningCategory {
    id: string;
    title: string;
    icon?: string;
    items: { id: string; label: string; description?: string }[];
}

// 1. O CHECKLIST FIXO E OBRIGATÓRIO (13 ITENS)
export const MANDATORY_PRE_CLEANING_CHECKLIST = [
    { id: "v_kitchen_off", label: "Cozinha fora de operação", description: "Nenhuma preparação de alimentos acontecendo durante o serviço." },
    { id: "v_electrical_off", label: "Sistema elétrico do exaustor desligado", description: "Energia desligada para evitar acionamento acidental." },
    { id: "v_gas_off", label: "Sistema de gás desligado (quando aplicável)", description: "Evita risco de ignição durante o processo." },
    { id: "v_fire_supp_prot", label: "Sistema de supressão de incêndio protegido", description: "Bicos e sensores cobertos para evitar acionamento." },
    { id: "v_work_area_safe", label: "Área de trabalho isolada e segura", description: "Sem circulação de funcionários ou clientes." },
    { id: "v_equip_covered", label: "Equipamentos da cozinha protegidos com plástico", description: "Fogões, chapas e equipamentos cobertos." },
    { id: "v_drainage_ready", label: "Sistema de drenagem preparado para gordura", description: "Evita acúmulo ou vazamento no piso." },
    { id: "v_filters_removed", label: "Filtros da coifa removidos para limpeza", description: "Permite acesso ao interior da coifa." },
    { id: "v_plenum_inspected", label: "Inspeção visual do plenum realizada", description: "Verificação do nível de acúmulo de gordura." },
    { id: "v_duct_verified", label: "Ducto verificado e acesso disponível", description: "Painéis de acesso localizados e utilizáveis." },
    { id: "v_roof_fan_inspected", label: "Exaustor no telhado inspecionado", description: "Verificação da base, tampa e possíveis vazamentos." },
    { id: "v_roof_access_safe", label: "Acesso ao telhado seguro", description: "Escada posicionada corretamente e área segura." },
    { id: "v_ppe_used", label: "EPIs utilizados pelo técnico", description: "Luvas, óculos, botas e proteção adequada." }
];

export const PRE_CLEANING_CATEGORIES: PreCleaningCategory[] = [
    {
        id: "verification",
        title: "✅ PRE-CLEANING VERIFICATION (Obrigatório)",
        items: MANDATORY_PRE_CLEANING_CHECKLIST
    },
    {
        id: "hood_condition",
        title: "Condição da Estrutura dos Coifas (Hoods)",
        items: [
            { id: "opt_hood_grease", label: "Acúmulo excessivo de gordura identificado" },
            { id: "opt_hood_corrosion", label: "Superfície interna com corrosão" },
            { id: "opt_hood_welds", label: "Soldas ou junções danificadas" },
            { id: "opt_hood_deep_clean", label: "Sistema precisou de limpeza profunda completa" }
        ]
    },
    {
        id: "fan_condition",
        title: "Condições dos Exaustor (Fans)",
        items: [
            { id: "opt_fan_vibration", label: "Vibração anormal" },
            { id: "opt_fan_noise", label: "Ruído excessivo" },
            { id: "opt_fan_belt", label: "Correia desgastada" },
            { id: "opt_fan_struct", label: "Estruturas dos Fan problemática" },
            { id: "opt_fan_fire_risk", label: "Risco de incêndio no futuro" },
            { id: "opt_fan_repair", label: "Necessita reparo estrutural" },
            { id: "opt_fan_new", label: "Necessita instalação de um novo Fan" },
            { id: "opt_fan_maintenance", label: "Necessita manutenção geral imediata" }
        ]
    },
    {
        id: "duct",
        title: "Duto de Exaustão (Opcional)",
        items: [
            { id: "duct_grease_leak", label: "Vazamento de gordura nas junções" },
            { id: "duct_needs_panel", label: "Necessidade de instalação de novo access panel" },
            { id: "duct_obstruction", label: "Duto com obstrução parcial" }
        ]
    }
];

```

---

## File: `src/utils/pdfGenerator.ts`

```typescript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceRecord, Client } from '../types';
import { MANDATORY_PRE_CLEANING_CHECKLIST } from './preCleaningChecklist';
import { calculateDuration, formatDate, formatTime, formatDateTime } from './timeUtils';

const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Direct fetch failed, likely CORS:", error);
    return null;
  }
};

/**
 * Redimensiona e corta a imagem para preencher o espaço mantendo a proporção (Center Crop)
 */
const normalizeImage = (base64: string, targetWidth: number, targetHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth * 2; // Qualidade dobrada para retina/pdf
      canvas.height = targetHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      const imgAspect = img.width / img.height;
      const targetAspect = canvas.width / canvas.height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > targetAspect) {
        // Imagem mais larga que o alvo
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
        offsetX = -(drawWidth - canvas.width) / 2;
        offsetY = 0;
      } else {
        // Imagem mais alta que o alvo
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        offsetX = 0;
        offsetY = -(drawHeight - canvas.height) / 2;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

const LABEL_MAPPING: Record<string, string> = {
  // Pre-Cleaning Mandatory Verification (New IDs)
  "v_kitchen_off": "Kitchen out of Operation",
  "v_electrical_off": "Exhaust Electrical System Off",
  "v_gas_off": "Gas System Off (Lockout/Tagout)",
  "v_fire_supp_prot": "Fire Suppression Protected",
  "v_work_area_safe": "Work Area Isolated & Safe",
  "v_equip_covered": "Kitchen Equipment Plastic Protected",
  "v_drainage_ready": "Drainage Ready for Grease/Water",
  "v_filters_removed": "Hood Filters Removed",
  "v_plenum_inspected": "Plenum Visual Inspection",
  "v_duct_verified": "Ducts & Access Panels Verified",
  "v_roof_fan_inspected": "Roof Fan Base & Base Inspected",
  "v_roof_access_safe": "Roof Access & Ladder Security",
  "v_ppe_used": "Technician Personal Protection (PPE)",

  // Optional Hood Condition
  "opt_hood_grease": "Excessive Grease Identified",
  "opt_hood_corrosion": "Internal Hood Corrosion",
  "opt_hood_welds": "Damaged Welds/Joints",
  "opt_hood_deep_clean": "Deep Cleaning Performed",

  // Optional Fan Condition
  "opt_fan_vibration": "Abnormal Fan Vibration",
  "opt_fan_noise": "Excessive Fan Noise",
  "opt_fan_belt": "Worn Fan Belt",
  "opt_fan_struct": "Fan Structure Problem",
  "opt_fan_fire_risk": "Future Fire Risk Detected",
  "opt_fan_repair": "Structural Repair Needed",
  "opt_fan_new": "New Fan Installation Needed",
  "opt_fan_maintenance": "Immediate General Maintenance",

  // Optional Duct Condition
  "duct_grease_leak": "Grease Leak at Joints",
  "duct_needs_panel": "New Access Panel Needed",
  "duct_obstruction": "Partial Duct Obstruction",

  // Post Cleaning
  "polished": "Polished & Shined",
  "floorsCleaned": "Floors Left Clean",
  "filtersInstalled": "Filters Reinstalled",
  "systemTested": "System Operation Tested",
  "stickersApplied": "Certification Sticker"
};

const formatChecklistKey = (key: string) => {
  if (LABEL_MAPPING[key]) return LABEL_MAPPING[key];
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
};

const parseJSON = (data: any) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  return data || {};
};

const parsePhotoArray = (data: any) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(data) ? data : [];
};

export const generatePDF = async (service: ServiceRecord, client?: Client, logoUrlOverride?: string) => {
  try {
    const doc = new jsPDF();
    const emeraldColor = [16, 185, 129] as [number, number, number];

    // 1. CABEÇALHO (HEADER) - Compact
    doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.rect(0, 0, 210, 30, 'F');

    const defaultLogo = "https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl";
    const logoToUse = logoUrlOverride || defaultLogo;

    console.log("PDF Generator: Using logo source:", logoToUse ? (logoToUse.startsWith('data:') ? 'Base64 Data' : logoToUse) : 'None');

    const base64Logo = await getBase64ImageFromUrl(logoToUse);

    if (base64Logo) {
      try {
        const format = base64Logo.includes('image/jpeg') || base64Logo.includes('image/jpg') ? 'JPEG' : 'PNG';
        // Aumentado o tamanho do logo para 45 de largura (era 22) para destacar mais
        doc.addImage(base64Logo, format, 12, 3, 45, 24);
        console.log("PDF Generator: Logo added successfully with format:", format);
      } catch (e) {
        console.warn("PDF Generator: Logo failed to render", e);
      }
    } else {
      console.warn("PDF Generator: Could not get base64 for logo");
    }

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    // Move o texto mais para a direita (62 em vez de 40) para dar espaço ao logo maior
    doc.text('D&E Hood Cleaning LLC', 62, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text('Commercial Kitchen Exhaust Cleaning Services | dehoodcleaning@gmail.com', 62, 22);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`SERVICE REPORT`, 198, 16, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`#${service.reportNumber || service.id}`, 198, 22, { align: 'right' });

    let currentY = 35;

    // ==========================================
    // 2. UNIFIED COMPACT SECTION (CLIENT + SERVICE)
    // ==========================================
    const duration = calculateDuration(service.inspectionStartTime, service.completionTime);
    const formattedDate = formatDate(service.serviceDate);
    const startTime = formatTime(service.inspectionStartTime);
    const endTime = formatTime(service.completionTime);

    // Section Title
    doc.setFillColor(240, 240, 240);
    doc.rect(14, currentY - 4, 182, 6, 'F');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER PROFILE & SERVICE OPERATION SUMMARY", 16, currentY);
    currentY += 4;

    const unifiedData = [
      ['Restaurant Name', client?.name || service.restaurantName || 'N/A', 'Service Date', formattedDate],
      ['Address', `${client?.address || 'N/A'}, ${client?.city || ''}${client?.state ? ', ' + client.state : ''}`, 'Technician', service.technicianName || 'N/A'],
      ['Manager / Contact', `${client?.managerName || 'N/A'} (${client?.phone || 'N/A'})`, 'Duration', duration !== "N/A" ? duration : '--'],
      ['Establishment Type', client?.establishmentType || 'N/A', 'Start / End Time', `${startTime} / ${endTime}`],
      ['Hoods / Filters', `${client?.hoodCount || 0} / ${client?.filterCount || 0}`, 'Grease Volume', service.volume || 'N/A'],
      ['Duct Type/Height', `${client?.ductType || 'N/A'} - ${client?.ductHeight || 'N/A'}`, 'System Type', service.systemType || 'N/A'],
      ['Condition Before', service.conditionBefore || 'N/A', 'Compliance', service.nfpaCompliance ? 'COMPLIANT' : 'NON-COMPLIANT'],
      ['Fire Hazard', service.fireHazard ? 'HIGH RISK' : 'CONTROLLED', 'Ref. Report', service.reportNumber || service.id]
    ];

    autoTable(doc, {
      startY: currentY,
      body: unifiedData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, textColor: [40, 40, 40], lineColor: [220, 220, 220] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 32, fillColor: [250, 250, 250] },
        1: { cellWidth: 59 },
        2: { fontStyle: 'bold', cellWidth: 32, fillColor: [250, 250, 250] },
        3: { cellWidth: 59 }
      },
      didDrawCell: (data) => {
        // Highlight Compliance
        if (data.column.index === 3 && data.row.index === 6) {
          if (service.nfpaCompliance) {
            doc.setTextColor(16, 185, 129); // Emerald
          } else {
            doc.setTextColor(220, 38, 38); // Red
          }
        }
        // Highlight Fire Hazard
        if (data.column.index === 3 && data.row.index === 6 && service.fireHazard) {
          doc.setTextColor(220, 38, 38);
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Multi-column Checklist Renderer
    const renderChecklist = (title: string, dataStr: string, yPos: number, headerColor: [number, number, number] = emeraldColor, columns: number = 1): number => {
      let _y = yPos;
      if (_y > 260) { doc.addPage(); _y = 20; }

      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.rect(14, _y - 4, 182, 6, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(title, 16, _y);
      _y += 2;

      const checklist = parseJSON(dataStr);
      const entries = Object.entries(checklist);

      if (entries.length > 0) {
        if (columns === 3) {
          // Logic for 3 columns
          const rowsPerCol = Math.ceil(entries.length / 3);
          const body: any[][] = [];

          for (let i = 0; i < rowsPerCol; i++) {
            const row: any[] = [];
            for (let j = 0; j < 3; j++) {
              const index = i + (j * rowsPerCol);
              if (index < entries.length) {
                const [key, val] = entries[index];
                row.push(formatChecklistKey(key));
                row.push(val ? '[X]' : '[ ]');
              } else {
                row.push('');
                row.push('');
              }
            }
            body.push(row);
          }

          autoTable(doc, {
            startY: _y,
            body,
            theme: 'plain',
            styles: { cellPadding: 1, fontSize: 7 },
            columnStyles: {
              0: { cellWidth: 45 }, 1: { cellWidth: 15, halign: 'right' },
              2: { cellWidth: 45 }, 3: { cellWidth: 15, halign: 'right' },
              4: { cellWidth: 45 }, 5: { cellWidth: 15, halign: 'right' }
            },
            margin: { left: 14, right: 14 }
          });
        } else {
          // Standard 1 column
          const body = Object.entries(checklist).map(([key, val]) => [formatChecklistKey(key), val ? '[ X ] YES' : '[   ] NO']);
          autoTable(doc, {
            startY: _y,
            body,
            theme: 'plain',
            styles: { cellPadding: 1, fontSize: 8 },
            columnStyles: { 0: { cellWidth: 145 }, 1: { cellWidth: 37, fontStyle: 'bold', halign: 'right' } },
            margin: { left: 14, right: 14 }
          });
        }
        return (doc as any).lastAutoTable.finalY + 8;
      }
      return _y + 5;
    };

    // 3. PRE-CLEANING INSPECTION (3 COLUMNS) - ONLY MANDATORY ITEMS
    const preChecklistRaw = parseJSON(service.preCleaningChecklist);
    const mandatoryKeys = MANDATORY_PRE_CLEANING_CHECKLIST.map(item => item.id);
    const mandatoryOnly: Record<string, boolean> = {};

    mandatoryKeys.forEach(k => {
      mandatoryOnly[k] = preChecklistRaw[k] || false;
    });

    currentY = renderChecklist("PRE-CLEANING INSPECTION CHECKLIST (INITIAL STATE):", JSON.stringify(mandatoryOnly), currentY, [59, 130, 246], 3);

    // 4. POST-CLEANING QUALITY CHECK (1 COLUMN)
    currentY = renderChecklist("POST-CLEANING QUALITY CHECKLIST (FINAL STATUS):", service.completionChecklistAfter || '{}', currentY, emeraldColor, 1);

    // ==========================================
    // 5. NOTES / RECOMMENDATIONS
    // ==========================================
    if (service.notes && service.notes.trim() !== '') {
      if (currentY > 260) { doc.addPage(); currentY = 20; }
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Notes / Recommendations:", 14, currentY);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(service.notes, 182);
      doc.text(splitNotes, 14, currentY + 5);
      currentY += (splitNotes.length * 4) + 8;
    }

    // ==========================================
    // 5. ADDITIONAL INSPECTIONS (PRE-CLEANING OPTIONAL)
    // ==========================================
    const preCleaningChecklist = parseJSON(service.preCleaningChecklist);

    // Check if there are any optional items marked
    const optionalHoodKeys = ['opt_hood_grease', 'opt_hood_corrosion', 'opt_hood_welds', 'opt_hood_deep_clean'];
    const optionalFanKeys = ['opt_fan_vibration', 'opt_fan_noise', 'opt_fan_belt', 'opt_fan_struct', 'opt_fan_fire_risk', 'opt_fan_repair', 'opt_fan_new', 'opt_fan_maintenance'];
    const optionalDuctKeys = ['duct_grease_leak', 'duct_needs_panel', 'duct_obstruction'];

    const hasHoodOpts = optionalHoodKeys.some(k => preCleaningChecklist[k]);
    const hasFanOpts = optionalFanKeys.some(k => preCleaningChecklist[k]);
    const hasDuctOpts = optionalDuctKeys.some(k => preCleaningChecklist[k]);

    if (hasHoodOpts || hasFanOpts || hasDuctOpts) {
      if (currentY > 240) { doc.addPage(); currentY = 20; }

      doc.setFillColor(70, 70, 70);
      doc.rect(14, currentY - 4, 182, 6, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ADDITIONAL SYSTEM OBSERVATIONS & RECOMMENDATIONS", 16, currentY);
      currentY += 6;

      const renderOptSection = (title: string, keys: string[]) => {
        const markedItems = keys.filter(k => preCleaningChecklist[k]);
        if (markedItems.length === 0) return;

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(title, 14, currentY);
        currentY += 4;

        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        markedItems.forEach(k => {
          if (currentY > 275) { doc.addPage(); currentY = 20; }
          doc.text(`- ${LABEL_MAPPING[k] || k}`, 18, currentY);
          currentY += 4;
        });
        currentY += 2;
      };

      renderOptSection("HOOD STRUCTURE CONDITION:", optionalHoodKeys);
      renderOptSection("EXHAUST FAN CONDITIONS:", optionalFanKeys);
      renderOptSection("EXHAUST DUCTWORK OBSERVATIONS:", optionalDuctKeys);

      currentY += 4;
    }

    // Compact Photo Gallery Renderer
    const renderGallery = async (title: string, photosStr: string, yPos: number, barColor: [number, number, number] = [50, 50, 50]): Promise<number> => {
      let _y = yPos;
      if (_y > 220) { doc.addPage(); _y = 20; }

      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      doc.rect(14, _y - 4, 182, 6, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(title, 16, _y);
      _y += 6;

      const photos = parsePhotoArray(photosStr).filter((p: any) => p && typeof p === 'string' && p.trim() !== '');

      if (photos.length === 0) {
        doc.setFontSize(8); doc.setTextColor(150); doc.text("No photos were provided for this stage of the report.", 14, _y);
        return _y + 8;
      }

      const imgW = 89, imgH = 66, gap = 4;
      let col = 0;
      for (let i = 0; i < photos.length; i++) {
        if (_y + imgH > 275) { doc.addPage(); _y = 20; col = 0; }
        let base64 = await getBase64ImageFromUrl(photos[i]);
        if (base64) {
          try {
            // Padronizar imagem com Center Crop
            base64 = await normalizeImage(base64, 400, 300); // 400x300px base

            const x = 14 + (col * (imgW + gap));
            doc.setDrawColor(230, 230, 230);
            doc.rect(x - 0.5, _y - 0.5, imgW + 1, imgH + 1);
            doc.addImage(base64, 'JPEG', x, _y, imgW, imgH);

            doc.setFontSize(7); doc.setTextColor(120);
            doc.text(`Photo ${i + 1}`, x + (imgW / 2), _y + imgH + 4, { align: 'center' });
            col++;
            if (col > 1) { col = 0; _y += imgH + 10; }
          } catch (e) {
            console.error("Error drawing photo:", e);
          }
        }
      }
      if (col > 0) _y += imgH + 10;
      return _y + 5;
    };

    currentY = await renderGallery("INSPECTION PHOTOS (BEFORE CLEANING)", service.inspectionPhotosBefore || '[]', currentY, [100, 100, 100]);
    currentY = await renderGallery("COMPLETION PHOTOS (AFTER CLEANING)", service.completionPhotosAfter || '[]', currentY, [50, 50, 50]);

    // ==========================================
    // 6. FOOTER / SIGNATURES
    // ==========================================
    if (currentY > 230) { doc.addPage(); currentY = 30; } else { currentY += 10; }

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    const nfpaText = "This system has been cleaned in accordance with NFPA 96 standards. All work has been performed by certified technicians. Any remaining deficiencies are noted in the recommendations section.";
    const splitNfpa = doc.splitTextToSize(nfpaText, 180);
    doc.text(splitNfpa, 105, currentY, { align: 'center' });

    currentY += 20;
    (doc as any).setLineDash([0, 0], 0);
    doc.setDrawColor(0, 0, 0);
    doc.line(30, currentY, 90, currentY);
    doc.text("Technician Signature", 60, currentY + 4, { align: 'center' });
    doc.text(service.technicianName || 'D&E Technician', 60, currentY + 8, { align: 'center' });

    doc.line(120, currentY, 180, currentY);
    doc.text("Management / Client Signature", 150, currentY + 4, { align: 'center' });
    doc.text(`Date: ${formattedDate}`, 150, currentY + 8, { align: 'center' });

    const name = (service.restaurantName || client?.name || "Report").replace(/[^a-z0-9]/gi, '_');
    doc.save(`Service_Report_${name}.pdf`);
  } catch (err: any) {
    console.error("PDF ERROR:", err);
    alert("CRITICAL ERROR: " + err.message);
    throw err;
  }
};

```

---

## File: `src/components/admin/AdminSettings.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Settings, Globe, Shield, Bell, Layout, Briefcase, Zap, Loader2, Save, Database, Key, Palette, Cpu, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../translations';
import { User } from '../../types';

interface AdminSettingsProps {
    user: User | null;
    settings: Record<string, string>;
    fetchData: () => Promise<void>;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ user, settings, fetchData }) => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>((settings['language'] as Language) || 'pt');
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'general' | 'localization' | 'security' | 'business' | 'branding' | 'segment'>('localization');

    // Branding States
    const [primaryColor, setPrimaryColor] = useState(settings['primary_color'] || '#10b981');
    const [bgColor, setBgColor] = useState(settings['bg_color'] || '#09090b');
    const [cardColor, setCardColor] = useState(settings['card_color'] || '#18181b');
    const [glowIntensity, setGlowIntensity] = useState(settings['glow_intensity'] || '0.2');
    const [currentSegment, setCurrentSegment] = useState(settings['segment'] || 'hood_cleaning');

    const t = translations[currentLanguage];

    const languages = [
        { id: 'pt', label: 'Português', flag: '🇧🇷' },
        { id: 'en', label: 'English', flag: '🇺🇸' },
        { id: 'es', label: 'Español', flag: '🇪🇸' },
        { id: 'fr', label: 'Français', flag: '🇫🇷' },
        { id: 'it', label: 'Italiano', flag: '🇮🇹' }
    ];

    const handleSaveSetting = async (key: string, value: string) => {
        setIsSaving(true);
        try {
            const company_id = user?.companyId || 'personal';
            const { error } = await supabase
                .from('settings')
                .upsert(
                    { key, value, company_id },
                    { onConflict: 'key,company_id' }
                );

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error("Error saving setting:", error);
            alert("Error saving setting.");
        } finally {
            setIsSaving(false);
        }
    };

    const sections = [
        { id: 'localization', label: t.language, icon: Globe },
        { id: 'branding', label: 'Branding', icon: Palette },
        { id: 'segment', label: 'Segmento', icon: Layers },
        { id: 'general', label: t.general, icon: Layout },
        { id: 'business', label: t.business_rules, icon: Briefcase },
        { id: 'security', label: t.security, icon: Shield },
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-[#18181b] p-8 rounded-none border border-white/5 shadow-2xl emerald-glow border-l-4 border-l-emerald-500">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">{t.admin_settings}</h2>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Central de Comando e Governança Global</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#09090b] text-emerald-500 px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        <Zap size={14} fill="currentColor" />
                        Node: {currentLanguage.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {sections.map(section => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id as any)}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-none transition-all text-[10px] font-black uppercase tracking-widest border ${activeSection === section.id
                                    ? 'bg-emerald-500 text-[#09090b] border-emerald-400 shadow-lg shadow-emerald-500/20'
                                    : 'bg-[#151619] text-white/40 border-white/5 hover:border-white/10 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} />
                                {section.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-8">
                    {activeSection === 'localization' && (
                        <div className="bg-[#18181b] p-8 rounded-none border border-white/5 shadow-2xl emerald-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-none flex items-center justify-center text-emerald-500">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">{t.language}</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Selecione o idioma operacional do sistema</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {languages.map(lang => (
                                    <button
                                        key={lang.id}
                                        onClick={() => {
                                            setCurrentLanguage(lang.id as Language);
                                            handleSaveSetting('language', lang.id);
                                        }}
                                        className={`flex items-center justify-between p-6 rounded-none border transition-all ${currentLanguage === lang.id
                                            ? 'bg-white/5 border-emerald-500 text-white'
                                            : 'bg-black/20 border-white/5 text-white/40 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{lang.flag}</span>
                                            <span className="text-xs font-black uppercase tracking-widest">{lang.label}</span>
                                        </div>
                                        {currentLanguage === lang.id && (
                                            <div className="w-2 h-2 bg-emerald-500 rounded-none shadow-lg shadow-emerald-500/50"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'branding' && (
                        <div className="bg-[#18181b] p-8 rounded-none border border-white/5 shadow-2xl emerald-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                                <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-none flex items-center justify-center text-pink-500">
                                    <Palette size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Visual Identity (Futuristic HUD)</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Ajuste as cores e a intensidade do brilho do sistema</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest block mb-3">Primary Action Color</label>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => {
                                                    setPrimaryColor(e.target.value);
                                                    handleSaveSetting('primary_color', e.target.value);
                                                }}
                                                className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={primaryColor}
                                                readOnly
                                                className="bg-black/20 border border-white/5 px-4 py-2 rounded-none text-[10px] font-mono text-white/60"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest block mb-3">Background Core</label>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => {
                                                    setBgColor(e.target.value);
                                                    handleSaveSetting('bg_color', e.target.value);
                                                }}
                                                className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={bgColor}
                                                readOnly
                                                className="bg-black/20 border border-white/5 px-4 py-2 rounded-none text-[10px] font-mono text-white/60"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest block mb-3">Card Surface</label>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="color"
                                                value={cardColor}
                                                onChange={(e) => {
                                                    setCardColor(e.target.value);
                                                    handleSaveSetting('card_color', e.target.value);
                                                }}
                                                className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={cardColor}
                                                readOnly
                                                className="bg-black/20 border border-white/5 px-4 py-2 rounded-none text-[10px] font-mono text-white/60"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest block mb-3">Glow Intensity: {glowIntensity}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={glowIntensity}
                                            onChange={(e) => {
                                                setGlowIntensity(e.target.value);
                                                handleSaveSetting('glow_intensity', e.target.value);
                                            }}
                                            className="w-full h-2 bg-white/5 rounded-none appearance-none cursor-pointer accent-primary-accent"
                                        />
                                        <div className="flex justify-between mt-2">
                                            <span className="text-[8px] text-white/20 font-black uppercase">Low/Stealth</span>
                                            <span className="text-[8px] text-white/20 font-black uppercase">High/Cyber</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'segment' && (
                        <div className="bg-[#18181b] p-8 rounded-none border border-white/5 shadow-2xl emerald-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-none flex items-center justify-center text-cyan-500">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">Segment Engine</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Adapte o sistema para diferentes indústrias</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { id: 'hood_cleaning', label: 'Hood Cleaning', icon: '♨️' },
                                    { id: 'hvac', label: 'HVAC & Maintenance', icon: '❄️' },
                                    { id: 'security', label: 'Physical Security', icon: '🛡️' },
                                    { id: 'pest_control', label: 'Pest Control', icon: '🐜' }
                                ].map(seg => (
                                    <button
                                        key={seg.id}
                                        onClick={() => {
                                            setCurrentSegment(seg.id);
                                            handleSaveSetting('segment', seg.id);
                                        }}
                                        className={`flex flex-col gap-4 p-8 rounded-none border transition-all text-left ${currentSegment === seg.id
                                            ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                                            : 'bg-black/20 border-white/5 text-white/40 hover:border-white/20'
                                            }`}
                                    >
                                        <span className="text-3xl">{seg.icon}</span>
                                        <div>
                                            <span className="text-xs font-black uppercase tracking-widest block">{seg.label}</span>
                                            <p className="text-[8px] mt-1 opacity-60 uppercase">Auto-relabeling active</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'general' && (
                        <div className="bg-[#18181b] p-8 rounded-none border border-white/5 shadow-2xl emerald-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-none flex items-center justify-center text-blue-500">
                                    <Layout size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">{t.general}</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Identidade Visual e Parâmetros Base</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest block mb-3">App Name</label>
                                    <input
                                        type="text"
                                        defaultValue={settings['app_name'] || 'D&E Hood Cleaning'}
                                        onBlur={(e) => handleSaveSetting('app_name', e.target.value)}
                                        className="w-full p-5 bg-[#09090b] rounded-none border border-white/5 focus:border-emerald-500/50 focus:ring-0 text-xs text-white/80 font-bold uppercase italic"
                                    />
                                </div>
                                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-none">
                                    <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-widest leading-relaxed">
                                        As configurações de logo e avisos globais foram migradas para o painel de Automação para manter a integridade operacional.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'business' && (
                        <div className="bg-[#18181b] p-8 rounded-none border border-white/5 shadow-2xl emerald-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                                <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-none flex items-center justify-center text-purple-500">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">{t.business_rules}</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Logística de Ciclo e Notificações</p>
                                </div>
                            </div>

                            <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-none text-center">
                                <Zap size={40} className="text-purple-500 mx-auto mb-4 opacity-20" />
                                <h4 className="text-sm font-black text-white uppercase italic mb-2 tracking-widest">Console de Automação Ativo</h4>
                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest max-w-md mx-auto leading-relaxed">
                                    As regras de disparo (19 dias) e checklists pré-limpeza estão sendo gerenciadas pelo Smart Engine no menu lateral de Automação.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="bg-[#18181b] p-8 rounded-none border border-white/5 shadow-2xl emerald-glow animate-fade-in">
                            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-none flex items-center justify-center text-amber-500">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tight text-lg">{t.security}</h3>
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Criptografia e Integridade de Dados</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-[#09090b] border border-white/5 rounded-none">
                                    <div className="flex items-center gap-4">
                                        <Database size={20} className="text-amber-500" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Auto-Backup Snapshot</span>
                                    </div>
                                    <button className="px-6 py-2 bg-amber-500 text-[#09090b] text-[10px] font-black rounded-none border border-amber-400 uppercase tracking-widest hover:bg-amber-400 transition-all">
                                        Run Now
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-[#09090b] border border-white/5 rounded-none opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-4">
                                        <Key size={20} className="text-white/20" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Master API Key Rotation</span>
                                    </div>
                                    <div className="px-4 py-1 bg-white/5 text-white/20 text-[9px] font-black rounded-none border border-white/10 uppercase tracking-widest">Locked</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-center">
                {isSaving && (
                    <div className="flex items-center gap-2 bg-emerald-500 text-[#09090b] px-6 py-3 rounded-none font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                        <Loader2 size={16} className="animate-spin" />
                        {t.saving}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;

```

---

## File: `src/components/dashboard/Dashboard.tsx`

```typescript
import React from 'react';
import {
    Users,
    ClipboardList,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    ShieldCheck,
    Phone,
    Calendar,
    Clock,
    Camera,
    MessageCircle,
    X,
    Settings,
    Eye,
    EyeOff,
    PieChart
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';
import StatCard from './StatCard';
import { DashboardStats, ServiceRecord } from '../../types';
import { compressImage } from '../../utils/imageUtils';
import { formatDate } from '../../utils/timeUtils';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface DashboardProps {
    user: any;
    stats: DashboardStats;
    recentServices: any[];
    alerts: any[];
    services: ServiceRecord[];
    activeService: ServiceRecord | null;
    completionChecklist: any;
    setCompletionChecklist: (checklist: any) => void;
    newService: any;
    setNewService: (service: any) => void;
    handleCompleteService: (e: React.FormEvent) => void;
    handleCancelService: () => void;
    handleDeleteNotification: (id: number) => void;
    notifications: any[];
    completionPhotos: string[];
    setCompletionPhotos: (photos: string[]) => void;
    preCleaningChecklistData: Record<string, boolean>;
    setPreCleaningChecklistData: (data: Record<string, boolean>) => void;
    users?: any[];
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
}

const Dashboard: React.FC<DashboardProps> = ({
    user,
    stats,
    recentServices,
    alerts,
    services,
    activeService,
    completionChecklist,
    setCompletionChecklist,
    newService,
    setNewService,
    handleCompleteService,
    handleDeleteNotification,
    notifications,
    completionPhotos,
    setCompletionPhotos,
    preCleaningChecklistData,
    setPreCleaningChecklistData,
    users = [],
    settings = {},
    segmentLabels
}) => {
    const currentLang = (settings['language'] as Language) || 'pt';
    const t = translations[currentLang];
    // Dashboard Widget Customization State
    const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
        stats_overview: true,
        team_stats: true,
        upcoming_services: true,
        revenue_chart: true,
        business_types_chart: true,
        recent_activity: true,
        system_notices: true,
        nfpa_compliance: true
    });
    const [isCustomizing, setIsCustomizing] = useState(false);

    // Load/Save Widget Preferences
    useEffect(() => {
        const saved = localStorage.getItem('dashboard_widgets');
        if (saved) {
            try {
                setVisibleWidgets(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse dashboard widgets", e);
            }
        }
    }, []);

    const toggleWidget = (id: string) => {
        const newState = { ...visibleWidgets, [id]: !visibleWidgets[id] };
        setVisibleWidgets(newState);
        localStorage.setItem('dashboard_widgets', JSON.stringify(newState));
    };

    // Calculando estatísticas da equipe
    const activeTechnicians = users.filter(u => u.role === 'technician' && u.status === 'active').length;
    const pendingTechnicians = users.filter(u => u.role === 'technician' && u.status === 'pending').length;
    const knowledgeStats = users.filter(u => u.role === 'technician' && u.status === 'active').reduce((acc, user) => {
        const level = user.knowledgeLevel || 'Aprendiz';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Setup Admin Broadcast note check
    const adminNote = user.role === 'technician' && settings ? settings['admin_broadcast_note'] : null;

    return (
        <div className="space-y-8 pb-32">
            {user.role === 'technician' && adminNote && adminNote.trim() !== '' && (
                <div className="bg-amber-100/10 p-6 rounded-none border border-amber-500/20 emerald-glow relative overflow-hidden flex items-center gap-4">
                    <div className="p-3 bg-amber-500 text-white rounded-none shadow-lg shadow-amber-500/20 shrink-0"><MessageCircle size={28} /></div>
                    <div>
                        <h3 className="text-xl font-black text-amber-500 tracking-tight">Aviso Geral da Administração</h3>
                        <p className="text-white/60 text-sm font-bold mt-1 max-w-2xl whitespace-pre-wrap">{adminNote}</p>
                    </div>
                </div>
            )}

            {user.role === 'admin' ? (
                <>
                    {/* Admin Header with Customization Toggle */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white mb-1">Visão Geral</h2>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest italic">Controle Central D&E</p>
                        </div>
                        <button
                            onClick={() => setIsCustomizing(!isCustomizing)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-none font-bold text-xs transition-all ${isCustomizing ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            <Settings size={16} />
                            {isCustomizing ? 'Salvar Dashboard' : 'Personalizar'}
                        </button>
                    </div>

                    {/* Customizer Panel */}
                    {isCustomizing && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-none mb-8 emerald-glow animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Settings size={14} /> Gerenciar Widgets
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(visibleWidgets).map(([id, visible]) => (
                                    <button
                                        key={id}
                                        onClick={() => toggleWidget(id)}
                                        className={`flex items-center justify-between p-3 border transition-all ${visible
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                            : 'bg-white/5 border-white/10 text-white/40 grayscale'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase truncate pr-2">
                                            {id.replace(/_/g, ' ')}
                                        </span>
                                        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Stats Grid */}
                    {visibleWidgets.stats_overview && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title={segmentLabels?.clients || t.active_clients}
                                value={stats.activeClients}
                                icon={<Users size={20} />}
                                trend="+12% vs last month"
                                color="emerald"
                            />
                            <StatCard
                                title={segmentLabels?.services || t.services_month}
                                value={stats.servicesThisMonth}
                                icon={<ClipboardList size={20} />}
                                trend="+5% vs last month"
                                color="blue"
                            />
                            <StatCard
                                title={t.completed_total}
                                value={stats.completedServicesTotal}
                                icon={<CheckCircle2 size={20} />}
                                color="purple"
                            />
                            <StatCard
                                title={t.overdue}
                                value={stats.overdueServices}
                                icon={<AlertTriangle size={20} />}
                                color="red"
                            />
                            <StatCard
                                title={t.revenue_est}
                                value={`$${stats.estimatedRevenue.toLocaleString()}`}
                                icon={<TrendingUp size={20} />}
                                trend="+8% vs last month"
                                color="amber"
                            />
                            <StatCard
                                title={segmentLabels?.next_check || t.next_service}
                                value={activeService ? formatDate(activeService.serviceDate) : '---'}
                                icon={<Calendar size={20} />}
                                color="indigo"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Revenue Chart Widget */}
                            {visibleWidgets.revenue_chart && (
                                <div className="bg-[#18181b] p-6 md:p-8 rounded-none border border-white/5 emerald-glow-hover transition-all">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                                                <TrendingUp className="text-emerald-500" size={24} />
                                                Faturamento e Projeção
                                            </h3>
                                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Estimativa de Lucro Bruto Anual</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-1">Média Anual</p>
                                            <p className="text-3xl font-black text-emerald-500">${stats.estimatedRevenue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.monthlyTrends || []}>
                                                <defs>
                                                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0px' }}
                                                />
                                                <Bar dataKey="total" fill="url(#emeraldGradient)" radius={[0, 0, 0, 0]} barSize={40} className="emerald-glow" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Team Stats Widget */}
                            {visibleWidgets.team_stats && (
                                <div className="bg-[#18181b] p-6 md:p-8 rounded-none border border-white/5 emerald-glow-hover transition-all">
                                    <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3 mb-8">
                                        <Users className="text-emerald-500" size={24} />
                                        Equipe Técnica
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="p-5 bg-white/5 rounded-none border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-white/30 uppercase mb-1">Ativos</p>
                                                    <p className="text-3xl font-black text-emerald-500 leading-none">{activeTechnicians}</p>
                                                </div>
                                                <CheckCircle2 className="text-emerald-500/50" size={32} />
                                            </div>
                                            <div className="p-5 bg-white/5 rounded-none border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-white/30 uppercase mb-1">Pendentes</p>
                                                    <p className="text-3xl font-black text-amber-500 leading-none">{pendingTechnicians}</p>
                                                </div>
                                                <AlertTriangle className="text-amber-500/50" size={32} />
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white/5 rounded-none border border-white/5">
                                            <p className="text-xs font-bold text-emerald-500 uppercase mb-4 tracking-widest">Capacitação</p>
                                            <div className="space-y-4">
                                                {Object.entries(knowledgeStats).map(([level, count]) => (
                                                    <div key={level}>
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/40 mb-1">
                                                            <span>{level}</span>
                                                            <span>{count as number} Técnico(s)</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-white/5 rounded-none overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500 emerald-glow"
                                                                style={{ width: `${((count as number) / (activeTechnicians || 1)) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Upcoming / Alerts Widget */}
                            {visibleWidgets.upcoming_services && alerts && alerts.length > 0 && (
                                <div className="bg-amber-500/5 p-8 rounded-none border border-amber-500/20 emerald-glow transition-all">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 bg-amber-500 text-white rounded-none shadow-lg shadow-amber-500/20"><AlertTriangle size={24} /></div>
                                        <div>
                                            <h3 className="text-xl font-black text-amber-500 tracking-tight">Alertas de Agendamento</h3>
                                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Próximos 20 dias</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {alerts.map((alert, i) => (
                                            <div key={i} className="bg-[#18181b] p-5 rounded-none border border-white/5 flex flex-col justify-between emerald-glow-hover transition-all">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-black text-white line-clamp-1 uppercase text-xs tracking-tight">{alert.clientName}</h4>
                                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded-none border border-amber-500/20">{alert.daysUntil} DIAS</span>
                                                    </div>
                                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{alert.city}</p>
                                                </div>
                                                <div className="mt-6 flex flex-col gap-3">
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <span className="text-white/20 uppercase tracking-widest">Vencimento</span>
                                                        <span className="text-amber-500 font-black">{new Date(alert.nextServiceDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                    <a
                                                        href={`https://wa.me/${alert.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, aqui é da D&E! A limpeza da coifa em ${alert.clientName} vence em ${alert.daysUntil} dias. Vamos confirmar a agenda?`)}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500 text-white rounded-none text-xs font-black hover:bg-emerald-600 transition-all uppercase tracking-tighter"
                                                    >
                                                        <MessageCircle size={14} /> Confirmar Agenda
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            {/* Business Type Pie Chart Widget */}
                            {visibleWidgets.business_types_chart && (
                                <div className="bg-[#18181b] p-6 md:p-8 rounded-none border border-white/5 emerald-glow-hover transition-all">
                                    <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3 mb-8">
                                        <PieChart size={24} className="text-emerald-500" />
                                        Tipos de Negócio
                                    </h3>
                                    <div className="h-64 relative flex flex-col items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={stats.establishmentCounts || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {(stats.establishmentCounts || []).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'][index % 6]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '0px' }} />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Total</span>
                                            <span className="text-2xl font-black text-white">{stats.activeClients}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                                        {(stats.establishmentCounts || []).map((entry, index) => (
                                            <div key={index} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-1">
                                                <div className="w-2 h-2 rounded-none" style={{ backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'][index % 6] }}></div>
                                                {entry.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity Widget */}
                            {visibleWidgets.recent_activity && (
                                <div className="bg-[#18181b] p-6 md:p-8 rounded-none border border-white/5 emerald-glow-hover transition-all">
                                    <h3 className="text-xl font-black tracking-tight text-white mb-8">Fluxo Recente</h3>
                                    <div className="space-y-6">
                                        {recentServices.map((s, i) => (
                                            <div key={i} className="flex gap-4 relative">
                                                {i !== recentServices.length - 1 && <div className="absolute left-5 top-10 w-px h-10 bg-white/5"></div>}
                                                <div className="w-10 h-10 rounded-none bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 shrink-0 z-10 emerald-glow">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white uppercase tracking-tight">{s.restaurantName}</div>
                                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Limpeza Concluída</div>
                                                    <div className="text-[10px] text-emerald-500 font-black mt-1 uppercase">{new Date(s.serviceDate).toLocaleDateString('pt-BR')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* NFPA Compliance Gauge Widget */}
                            {visibleWidgets.nfpa_compliance && (
                                <div className="bg-emerald-500 p-8 rounded-none text-[#09090b] overflow-hidden relative emerald-glow">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2 italic">Standard NFPA 96</h3>
                                    <p className="text-[#09090b]/60 text-xs font-bold leading-tight mb-8">Índice atual de conformidade na base instalada.</p>
                                    <div className="flex items-end justify-between">
                                        <div className="flex items-center gap-2 text-[#09090b] font-black text-xs">
                                            <ShieldCheck size={20} />
                                            <span className="uppercase tracking-widest">Security Score</span>
                                        </div>
                                        <div className="text-4xl font-black tracking-tighter text-[#09090b] underline decoration-4 underline-offset-4">
                                            {stats.nfpaRate || 0}%
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* System Notices Widget (Admin Notifications) */}
                            {visibleWidgets.system_notices && notifications && notifications.length > 0 && (
                                <div className="bg-red-500/5 p-8 rounded-none border border-red-500/20 transition-all">
                                    <h3 className="text-xl font-black tracking-tight mb-8 text-red-500 uppercase italic">Avisos do Sistema</h3>
                                    <div className="space-y-4">
                                        {notifications.map((notif: any) => (
                                            <div key={notif.id} className="bg-[#18181b] p-5 rounded-none flex items-start gap-4 border border-white/5 relative emerald-glow-hover transition-all">
                                                <button onClick={() => handleDeleteNotification(notif.id)} className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                                <div className="w-10 h-10 rounded-none bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <div className="pr-6">
                                                    <p className="text-sm font-bold text-white mb-2 leading-tight">{notif.message}</p>
                                                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">{new Date(notif.createdAt).toLocaleString('pt-BR')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                /* Technician View - Redesigned for Dark theme but keeping functionally identical */
                <div className="space-y-6">
                    {activeService ? (
                        <div className="bg-[#18181b] p-6 md:p-10 rounded-none border border-emerald-500 shadow-xl emerald-glow animate-pulse-subtle">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 md:gap-0">
                                <div>
                                    <span className="text-[10px] font-black bg-emerald-500 text-[#09090b] px-4 py-1 rounded-none uppercase tracking-widest mb-3 inline-block">Serviço em Andamento</span>
                                    <h2 className="text-4xl font-black text-white tracking-tight">{activeService.restaurantName}</h2>
                                    <p className="text-white/40 flex items-center gap-2 mt-2 font-bold uppercase text-[10px] tracking-widest">
                                        <Clock size={16} className="text-emerald-500" /> Iniciado: {activeService.inspectionStartTime ? new Date(activeService.inspectionStartTime).toLocaleTimeString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="text-left md:text-right">
                                    <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Tempo de Operação</div>
                                    <div className="text-3xl font-mono font-black text-white">
                                        {activeService.inspectionStartTime ? Math.floor((new Date().getTime() - new Date(activeService.inspectionStartTime).getTime()) / 60000) : 0} min
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="font-black text-lg text-white uppercase tracking-widest border-b border-white/5 pb-4">Checklist de Conclusão</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {Object.entries(completionChecklist).map(([key, val]) => (
                                            <label key={key} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-none cursor-pointer hover:bg-white/10 transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={val as boolean}
                                                    onChange={e => setCompletionChecklist({ ...completionChecklist, [key]: e.target.checked })}
                                                    className="w-6 h-6 rounded-none text-emerald-500 bg-black/20 border-white/10"
                                                />
                                                <span className="text-sm font-bold text-white/60 group-hover:text-white capitalize tracking-tight">{key.replace(/([A-Z])/g, ' $1')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="font-black text-lg text-white uppercase tracking-widest border-b border-white/5 pb-4">Relatório Fotográfico</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[0, 1, 2, 3, 4, 5].map(i => (
                                            <label key={i} className="aspect-square bg-white/5 rounded-none flex flex-col items-center justify-center border-2 border-dashed border-white/5 hover:border-emerald-500 transition-colors cursor-pointer group relative overflow-hidden">
                                                {completionPhotos && completionPhotos[i] ? (
                                                    <img src={completionPhotos[i]} alt={`Foto ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <Camera className="text-white/10 group-hover:text-emerald-500 transition-colors" size={32} />
                                                        <span className="text-[9px] text-white/20 mt-2 uppercase font-black tracking-widest">Foto {i + 1}</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const compressedBase64 = await compressImage(file);
                                                                const { uploadImage } = await import('../../utils/storageUtils');
                                                                const publicUrl = await uploadImage(compressedBase64);

                                                                const newPhotos = [...(completionPhotos || [])];
                                                                newPhotos[i] = publicUrl;
                                                                setCompletionPhotos(newPhotos);
                                                            } catch (err) {
                                                                console.error("Erro ao processar foto:", err);
                                                                alert("Erro ao enviar a foto. Verifique sua conexão.");
                                                            }
                                                        }
                                                    }}
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-none cursor-pointer">
                                                <input type="checkbox" checked={newService.nfpaCompliance} onChange={e => setNewService({ ...newService, nfpaCompliance: e.target.checked })} className="w-5 h-5 rounded-none text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Compliance NFPA</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-none cursor-pointer">
                                                <input type="checkbox" checked={newService.fireHazard} onChange={e => setNewService({ ...newService, fireHazard: e.target.checked })} className="w-5 h-5 rounded-none text-red-500" />
                                                <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Risco Incêndio</span>
                                            </label>
                                        </div>

                                        <div className="mt-4">
                                            <textarea
                                                value={newService.notes || ''}
                                                onChange={e => setNewService({ ...newService, notes: e.target.value })}
                                                placeholder="Anotações para o relatório final..."
                                                className="w-full p-6 bg-white/5 border border-white/5 rounded-none text-white focus:ring-2 focus:ring-emerald-500 text-sm min-h-[120px] outline-none"
                                            ></textarea>
                                        </div>

                                        <button
                                            onClick={handleCompleteService}
                                            disabled={!Object.values(completionChecklist).every(v => v)}
                                            className="w-full py-5 bg-emerald-500 text-[#09090b] rounded-none font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-20 disabled:grayscale"
                                        >
                                            Finalizar e Emitir Laudo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#18181b] p-10 rounded-none border border-white/5 emerald-glow">
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2 italic">Darlan, pronto para o próximo check?</h2>
                            <p className="text-white/40 font-bold uppercase text-xs tracking-widest">Nenhuma tarefa ativa no momento. Inicie no menu Clientes.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;

```

---

## File: `src/components/dashboard/StatCard.tsx`

```typescript
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    isWarning?: boolean;
    color?: 'emerald' | 'blue' | 'purple' | 'red' | 'amber' | 'indigo' | 'cyan';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, isWarning, color = 'emerald' }) => {
    const colorClasses = {
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        red: 'text-red-500 bg-red-500/10 border-red-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20'
    };

    const activeColor = colorClasses[color] || colorClasses.emerald;

    return (
        <div className={`p-6 rounded-none bg-[#18181b] border ${isWarning ? 'border-amber-500/30' : 'border-white/5'} emerald-glow-hover transition-all relative overflow-hidden group`}>
            {/* Ambient background glow matching the color */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${activeColor.split(' ')[0]}`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 flex items-center justify-center rounded-none bg-black/40 border border-white/5 ${activeColor.split(' ')[0]}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`px-2 py-1 rounded-none text-[8px] font-black uppercase tracking-widest ${activeColor}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-3xl font-black tracking-tight mb-1 text-white relative z-10">{value}</div>
            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest relative z-10">{title}</div>
        </div>
    );
};

export default StatCard;

```

---

## File: `src/components/layout/Header.tsx`

```typescript
import React from 'react';
import { Search, Plus } from 'lucide-react';
import { UserButton, OrganizationSwitcher } from '@clerk/clerk-react';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface HeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    user: any;
    setShowClientModal: (show: boolean) => void;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm, user, setShowClientModal, settings, segmentLabels }) => {
    const currentLang = (settings?.['language'] as Language) || 'pt';
    const t = translations[currentLang];
    return (
        <header className="py-4 md:h-20 bg-[#151619] border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 space-y-4 md:space-y-0 sticky top-0 z-10">
            <div className="flex-1 hidden md:block">
                {/* Space for logo or breadcrumb if needed, keeping it empty to push content to center */}
            </div>

            <div className="flex items-center justify-center flex-1">
                {user.role === 'admin' && (
                    <button
                        onClick={() => setShowClientModal(true)}
                        className="bg-emerald-500 text-[#151619] px-8 py-2 rounded-none font-black flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 text-sm md:text-base whitespace-nowrap uppercase tracking-widest emerald-glow"
                    >
                        <Plus size={18} />
                        {segmentLabels ? `Novo ${segmentLabels.client}` : (
                            currentLang === 'pt' ? 'Novo Cliente' :
                                currentLang === 'en' ? 'New Client' :
                                    currentLang === 'es' ? 'Nuevo Cliente' :
                                        currentLang === 'fr' ? 'Nouveau Client' : 'Nuovo Cliente'
                        )}
                    </button>
                )}
            </div>

            <div className="flex items-center justify-end flex-1 gap-4">
                <OrganizationSwitcher hidePersonal={true} />

                <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-black uppercase tracking-tight text-white">{user.name}</div>
                        <div className="text-[10px] text-white/40 uppercase font-black tracking-widest italic">{user.role}</div>
                    </div>
                    <div className="emerald-glow p-0.5 bg-emerald-500/10">
                        <UserButton />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

```

---

## File: `src/components/layout/Sidebar.tsx`

```typescript
import React from 'react';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    BarChart3,
    Shield,
    Code,
    FileText,
    LogOut,
    CalendarDays,
    Settings,
    MessageSquare,
    Zap,
    BookOpen
} from 'lucide-react';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    user: any;
    handleLogout: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, handleLogout, isOpen, setIsOpen, settings, segmentLabels }) => {
    const currentLang = (settings?.['language'] as Language) || 'pt';
    const t = translations[currentLang];

    const handleNavClick = (tabId: string) => {
        setActiveTab(tabId);
        setIsOpen(false);
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#151619] text-white flex flex-col border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-bottom border-white/10 flex flex-col items-center justify-center">
                    <img
                        src={settings?.logo_image || "https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl"}
                        alt="Logo"
                        className="h-12 md:h-16 w-auto max-w-[12rem] object-contain mb-2 drop-shadow-md"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => handleNavClick('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.dashboard}</span>
                    </button>
                    {user.role === 'admin' && (
                        <>
                            <button
                                onClick={() => handleNavClick('calendar')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'calendar' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <CalendarDays size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.calendar}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('clients')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'clients' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Users size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{segmentLabels?.clients || t.clients}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('team')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'team' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Users size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.team}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('performance')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'performance' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <BarChart3 size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.performance}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('services')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'services' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <ClipboardList size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{segmentLabels?.services || t.services}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('automation')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'automation' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Zap size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.automation}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('guide')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'guide' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <BookOpen size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.guide}</span>
                            </button>
                            <button
                                onClick={() => handleNavClick('security')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'security' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Shield size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.security}</span>
                            </button>
                        </>
                    )}
                </nav>

                <div className="px-4 py-6 space-y-2 border-t border-white/5 bg-black/20">
                    {user.role === 'admin' && (
                        <button
                            onClick={() => handleNavClick('admin_settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-all ${activeTab === 'admin_settings' ? 'bg-emerald-500 text-[#151619] font-black emerald-glow' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Settings size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.admin_settings}</span>
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-none text-red-500/60 hover:text-red-400 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <LogOut size={20} />
                        <span>{t.logout}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

```

---

## File: `src/components/clients/ClientList.tsx`

```typescript
import React from 'react';
import { Plus, MapPin, ShieldCheck, CheckCircle2, Clock, Edit, Trash2 } from 'lucide-react';
import { Client } from '../../types';
import { formatDate } from '../../utils/timeUtils';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface ClientListProps {
    user: any;
    filteredClients: Client[];
    setShowClientModal: (show: boolean) => void;
    setSelectedClient: (client: Client) => void;
    setShowClientDetails: (show: boolean) => void;
    setEditingClient: (client: Client) => void;
    setShowEditClientModal: (show: boolean) => void;
    setSelectedClientId: (id: string | number) => void;
    setShowServiceModal: (show: boolean) => void;
    handleDeleteClient: (id: string | number) => void;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
}

const ClientList: React.FC<ClientListProps> = ({
    user,
    filteredClients,
    setShowClientModal,
    setSelectedClient,
    setShowClientDetails,
    setEditingClient,
    setShowEditClientModal,
    setSelectedClientId,
    setShowServiceModal,
    handleDeleteClient,
    settings = {},
    segmentLabels
}) => {
    const currentLang = (settings['language'] as Language) || 'pt';
    const t = translations[currentLang];
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                    {segmentLabels ? `Gestão de ${segmentLabels.clients}` : (currentLang === 'pt' ? 'Gestão de Clientes' : 'Client Management')}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id}>
                        {/* Mobile Optimized Card */}
                        <div className="md:hidden bg-[#18181b] rounded-none border border-white/5 shadow-sm overflow-hidden flex flex-col emerald-glow-hover transition-all">
                            <div
                                className="p-4 flex items-center gap-4 cursor-pointer active:bg-white/5 transition-colors"
                                onClick={() => {
                                    setSelectedClient(client);
                                    setShowClientDetails(true);
                                }}
                            >
                                <div className="w-12 h-12 shrink-0 bg-emerald-500/10 rounded-none border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xl shadow-sm">
                                    {client.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-base truncate text-white uppercase tracking-tight">{client.name}</h3>
                                    <div className="text-[10px] text-white/40 truncate flex items-center gap-1 mt-0.5 font-bold uppercase tracking-widest">
                                        <MapPin size={12} className="text-emerald-500" /> {client.city}
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    {client.nextServiceDate ? (
                                        <div className="bg-emerald-500/10 px-2 py-1 rounded-none border border-emerald-500/20">
                                            <div className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Próxima</div>
                                            <div className="text-xs font-black text-emerald-500">{formatDate(client.nextServiceDate).substring(0, 5)}</div>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 px-2 py-1 rounded-none border border-white/10">
                                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">{client.recurrence}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Action Bar */}
                            <div className="px-4 pb-4 pt-1 flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedClient(client);
                                        setShowClientDetails(true);
                                    }}
                                    className="flex-1 py-3 bg-black/5 text-black rounded-none text-xs font-bold active:scale-95 transition-all text-center"
                                >
                                    Ver Detalhes
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedClientId(client.id);
                                        setShowServiceModal(true);
                                    }}
                                    className="flex-[1.5] py-3 bg-emerald-500 text-white rounded-none text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} />
                                    {segmentLabels ? `Iniciar ${segmentLabels.service}` : (currentLang === 'pt' ? 'Iniciar Limpeza' : 'Start Service')}
                                </button>
                                {user.role === 'admin' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingClient(client);
                                                setShowEditClientModal(true);
                                            }}
                                            className="p-3 bg-amber-50 text-amber-600 rounded-none active:scale-95 transition-all"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Desktop Detailed View */}
                        <div className="hidden md:block bg-[#18181b] p-6 rounded-none border border-white/5 shadow-sm hover:shadow-xl transition-all emerald-glow-hover group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-none flex items-center justify-center text-emerald-500 font-black text-xl emerald-glow transition-all group-hover:scale-110">
                                    {client.name[0]}
                                </div>
                                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-none uppercase tracking-widest border border-emerald-500/20">
                                    {client.recurrence}
                                </span>
                            </div>
                            <h3 className="font-black text-xl mb-1 text-white uppercase tracking-tight">{client.name}</h3>
                            {client.establishmentType && (
                                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-emerald-500 text-[9px] font-black uppercase rounded-none mb-4 tracking-widest italic">
                                    {client.establishmentType}
                                </div>
                            )}
                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-xs text-white/40 font-bold">
                                    <MapPin size={16} className="text-emerald-500" /> {client.city}, {client.state || ''}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-white/40 font-bold">
                                    <ShieldCheck size={16} className="text-emerald-500" /> {client.hoodCount || 0} Hood(s) / {client.filterCount || 0} Filtros
                                </div>
                                {client.lastServiceDate && (
                                    <div className="flex items-center gap-3 text-xs text-emerald-500 font-black uppercase tracking-tighter">
                                        <CheckCircle2 size={16} /> Último trabalho: {formatDate(client.lastServiceDate)}
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-xs text-white/20 font-bold uppercase tracking-widest">
                                    <Clock size={16} /> Próxima: {formatDate(client.nextServiceDate)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedClient(client);
                                        setShowClientDetails(true);
                                    }}
                                    className="flex-1 py-2 bg-black/5 text-black rounded-none text-xs font-bold hover:bg-black/10 transition-colors"
                                >
                                    Detalhes
                                </button>
                                {user.role === 'admin' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingClient(client);
                                                setShowEditClientModal(true);
                                            }}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-none hover:bg-emerald-100 transition-colors"
                                            title="Editar Cliente"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClient(client.id);
                                            }}
                                            className="p-2 bg-red-50 text-red-600 rounded-none hover:bg-red-100 transition-colors"
                                            title="Excluir Cliente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedClientId(client.id);
                                        setShowServiceModal(true);
                                    }}
                                    className="flex-1 py-2 bg-emerald-500 text-white rounded-none text-xs font-bold hover:bg-emerald-600 transition-colors"
                                >
                                    Limpeza
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientList;

```

---

## File: `src/components/services/ServiceHistory.tsx`

```typescript
import React, { useState } from 'react';
import { Download, ChevronRight, AlertTriangle } from 'lucide-react';
import { ServiceRecord } from '../../types';
import { Loader2 } from 'lucide-react';
import { calculateDuration, formatDate } from '../../utils/timeUtils';
import { supabase } from '../../lib/supabase';
import { translations, Language } from '../../translations';
import { SegmentLabels } from '../../translations/segments';

interface ServiceHistoryProps {
    user: any;
    clients: any[];
    filteredServices: ServiceRecord[];
    generatePDF: (service: ServiceRecord, client?: any, logoUrl?: string) => void;
    logoUrl?: string;
    settings?: Record<string, string>;
    segmentLabels?: SegmentLabels;
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ user, clients, filteredServices, generatePDF, logoUrl, settings = {}, segmentLabels }) => {
    const currentLang = (settings['language'] as Language) || 'pt';
    const t = translations[currentLang];
    const [generatingId, setGeneratingId] = useState<string | number | null>(null);

    const handleGeneratePDF = async (service: ServiceRecord) => {
        setGeneratingId(service.id);
        try {
            // Busca o registro completo incluindo as fotos (que foram omitidas da listagem principal por performance)
            const { data: fullService, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', service.id)
                .single();

            if (error) throw error;
            if (!fullService) throw new Error("Serviço não encontrado");

            const client = clients.find(c => c.id === service.clientId);
            // Mapeia o serviço vindo do banco antes de passar para o gerador
            const { mapService } = await import('../../lib/supabaseUtils');
            await generatePDF(mapService(fullService), client, logoUrl);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Erro ao gerar PDF: arquivo incompleto ou erro de conexão.");
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <div className="bg-[#18181b] rounded-none border border-white/5 shadow-2xl overflow-hidden emerald-glow">
            <div className="p-8 bg-[#09090b] border-b border-white/5 flex items-center justify-between">
                <h3 className="font-black text-white uppercase italic tracking-tight text-xl">
                    {user.role === 'admin' ? 'Log Central de Operações' : 'Meu Histórico de Intervenções'}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-white/40 text-[10px] uppercase font-black tracking-widest">
                            <th className="px-6 py-5 border-b border-white/5">{segmentLabels?.client || 'Estabelecimento'}</th>
                            <th className="px-6 py-5 border-b border-white/5">Cronologia</th>
                            {user.role === 'admin' && <th className="px-6 py-5 border-b border-white/5">Operador</th>}
                            <th className="px-6 py-5 border-b border-white/5">NFPA 96</th>
                            <th className="px-6 py-5 border-b border-white/5">Risco Ígneo</th>
                            <th className="px-6 py-5 border-b border-white/5">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredServices
                            .filter(s => user.role === 'admin' || s.technicianName === user.name)
                            .map((service) => {
                                const duration = calculateDuration(service.inspectionStartTime, service.completionTime);

                                return (
                                    <tr key={service.id} className="hover:bg-white/[0.03] transition-colors group">
                                        <td className="px-6 py-6 font-black">
                                            <div className="text-white uppercase italic tracking-tight">{service.restaurantName}</div>
                                            <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">Ref: {service.reportNumber || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-xs font-black text-white uppercase tracking-tighter">
                                                {formatDate(service.serviceDate)}
                                            </div>
                                            {duration !== "N/A" && (
                                                <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-1">Tempo: {duration}</div>
                                            )}
                                        </td>
                                        {user.role === 'admin' && <td className="px-6 py-6 text-xs font-bold text-white/60 uppercase">{service.technicianName}</td>}
                                        <td className="px-6 py-6">
                                            {service.nfpaCompliance ? (
                                                <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-none border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Aprovado</span>
                                            ) : (
                                                <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-none border border-red-500/20 text-[9px] font-black uppercase tracking-widest">Crítico</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            {service.fireHazard ? (
                                                <span className="text-red-500 flex items-center gap-1 font-black text-[9px] uppercase tracking-widest animate-pulse"><AlertTriangle size={14} /> Alto Risco</span>
                                            ) : (
                                                <span className="text-emerald-500 font-black text-[9px] uppercase tracking-widest tracking-tighter shadow-none">Seguro</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleGeneratePDF(service)}
                                                    disabled={generatingId === service.id}
                                                    className={`p-2 rounded-none transition-all border border-white/5 ${generatingId === service.id ? 'bg-white/5 text-white/20 cursor-wait' : 'hover:bg-emerald-500 hover:text-[#09090b] text-emerald-500 border-emerald-500/20 shadow-lg shadow-emerald-500/10'}`}
                                                    title="Gerar PDF"
                                                >
                                                    {generatingId === service.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                                </button>
                                                <button className="p-2 hover:bg-white/10 rounded-none text-white/20 hover:text-white border border-white/5" title="Ver Detalhes">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default ServiceHistory;

```

---

## File: `src/components/team/TeamManagement.tsx`

```typescript
import React, { useState } from 'react';
import { Plus, Edit, X, CheckCircle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { OrganizationProfile } from '@clerk/clerk-react';

interface TeamManagementProps {
    users: any[];
    setShowUserModal: (show: boolean) => void;
    setEditingUser: (user: any) => void;
    setShowEditUserModal: (show: boolean) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
    users,
    setShowUserModal,
    setEditingUser,
    setShowEditUserModal
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleApprove = async (id: string | number) => {
        if (!confirm("Tem certeza que deseja aprovar este técnico para acessar o aplicativo?")) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: 'active' })
                .eq('id', id);

            if (!error) {
                alert("Técnico aprovado com sucesso!");
                window.location.reload();
            } else {
                alert("Falha ao aprovar: " + error.message);
            }
        } catch (error) {
            console.error(error);
            alert("Erro na comunicação com o servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string | number, name: string) => {
        if (!confirm(`Tem certeza que deseja REVOGAR O ACESSO e EXCLUIR o técnico ${name}?`)) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (!error) {
                alert("Técnico removido com sucesso!");
                window.location.reload();
            } else {
                alert("Falha ao remover o técnico: " + error.message);
            }
        } catch (error) {
            console.error(error);
            alert("Erro na comunicação com o servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#09090b] p-8 rounded-none border border-white/5 shadow-2xl relative overflow-hidden emerald-glow">
                <div className="relative z-10 text-white">
                    <h2 className="text-3xl font-black mb-2 text-white uppercase italic tracking-tighter">Membros & Operações</h2>
                    <p className="text-white/40 max-w-xl text-sm font-bold uppercase tracking-widest leading-relaxed">
                        Controle total sobre a força de trabalho. Gerencie acessos, aprove novos ingressos e monitore o desempenho da equipe.
                    </p>
                </div>
                <Users size={120} className="absolute right-0 top-0 opacity-5 -translate-y-4 translate-x-4 text-emerald-500" />
            </div>

            <div className="flex justify-center my-8">
                <div className="emerald-glow p-1 bg-white/5 border border-white/10 rounded-none">
                    <OrganizationProfile
                        appearance={{
                            elements: {
                                rootBox: "mx-auto shadow-2xl rounded-none border-none",
                                card: "rounded-none shadow-none bg-[#18181b]"
                            }
                        }}
                    />
                </div>
            </div>

            {/* Legacy Fallback Table for historical DB profiles */}
            <div className="flex justify-between items-center mt-12 mb-4">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Perfis de Acesso Master</h3>
                <button
                    onClick={() => setShowUserModal(true)}
                    className="bg-emerald-500 text-[#09090b] px-6 py-2 rounded-none font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs emerald-glow hover:bg-emerald-400 transition-all"
                >
                    <Plus size={18} /> Novo Acesso Manual
                </button>
            </div>

            <div className="bg-[#18181b] rounded-none border border-white/5 shadow-sm overflow-hidden emerald-glow-hover transition-all">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-white/40 text-[10px] uppercase font-black tracking-widest">
                            <th className="px-6 py-5">Identidade do Membro</th>
                            <th className="px-6 py-5">Especialidade</th>
                            <th className="px-6 py-5">Conexão</th>
                            <th className="px-6 py-5">Integridade</th>
                            <th className="px-6 py-5">Nível de Acesso</th>
                            <th className="px-6 py-5">Comandos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-black/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold">{u.name}</div>
                                    <div className="text-xs text-black/40">{u.email}</div>
                                    {u.rawPassword && (
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-black/40 uppercase">Senha:</span>
                                            <div className="relative group cursor-pointer" title="Clique e segure para ver a senha">
                                                <div className="text-xs font-mono bg-black/5 px-2 py-0.5 rounded text-black/60 opacity-100 group-active:opacity-0 transition-opacity absolute inset-0 flex items-center justify-center">
                                                    ••••••••
                                                </div>
                                                <div className="text-xs font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded opacity-0 group-active:opacity-100 transition-opacity select-all">
                                                    {u.rawPassword}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {u.role === 'technician' && (
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${u.knowledgeLevel === 'Expert' ? 'bg-emerald-100 text-emerald-700' :
                                            u.knowledgeLevel === 'Moderado' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                            {u.knowledgeLevel || 'Aprendiz'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {u.phone ? (
                                        <a href={`tel:${u.phone}`} className="text-sm text-emerald-600 font-bold hover:underline block mb-1">
                                            {u.phone}
                                        </a>
                                    ) : (
                                        <div className="text-sm text-black/40">N/A</div>
                                    )}
                                    <div className="text-[10px] text-black/40">{u.address || 'Sem endereço'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {u.status === 'pending' ? 'Pendente' : 'Ativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {u.role === 'admin' ? 'Administrador' : 'Técnico'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2 items-center">
                                        {u.status === 'pending' && (
                                            <button
                                                onClick={() => handleApprove(u.id)}
                                                disabled={isLoading}
                                                className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors bg-emerald-100 shadow-sm"
                                                title="Aprovar Acesso"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setEditingUser({ ...u, password: '' });
                                                setShowEditUserModal(true);
                                            }}
                                            className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id, u.name)}
                                            disabled={isLoading}
                                            className="p-2 hover:bg-red-50 rounded-lg text-black/40 hover:text-red-500 transition-colors"
                                            title="Remover"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamManagement;

```

---

