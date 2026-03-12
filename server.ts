import "dotenv/config";
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing from environment variables.");
  }

  const supabaseAdmin = createClient(supabaseUrl || '', supabaseKey || '', {
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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
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

      // Se criou no Supabase, atualiza profiles
      if (supaData?.user) {
        await supabaseAdmin.from('profiles').upsert({
          id: supaData.user.id,
          email,
          name,
          role: 'technician',
          phone,
          status: 'pending'
        });
      }

      // Cria localmente com status pending
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare(`
        INSERT INTO users (email, password, name, role, phone, knowledgeLevel, status) 
        VALUES (?, ?, ?, ?, ?, 'Aprendiz', 'pending')
      `).run(email, hashedPassword, name, phone || '');

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
    const users = db.prepare("SELECT id, email, name, role, phone, knowledgeLevel, address, joinDate, status FROM users").all();
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

      // Se criou no Supabase, atualiza profiles
      if (supaData?.user) {
        await supabaseAdmin.from('profiles').upsert({
          id: supaData.user.id,
          email,
          name,
          role: role || 'technician',
          phone,
          knowledge_level: knowledgeLevel,
          address,
          status: 'active'
        });
      }

      // Em seguida, cria local
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare(`
        INSERT INTO users (email, password, name, role, phone, knowledgeLevel, address, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(email, hashedPassword, name, role || 'technician', phone, knowledgeLevel, address);
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

      // Sincroniza com Supabase profiles (removendo a entrada pública)
      await supabaseAdmin.from('profiles').delete().eq('email', user.email);

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

      // Update in Supabase profiles as well
      const user = db.prepare("SELECT email FROM users WHERE id = ?").get(id) as any;
      if (user) {
        await supabaseAdmin.from('profiles').update({ status: 'active' }).eq('email', user.email);
      }

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
          SET email = ?, name = ?, role = ?, phone = ?, knowledgeLevel = ?, address = ?, password = ?
          WHERE id = ?
        `).run(email, name, role, phone, knowledgeLevel, address, hashedPassword, id);
      } else {
        db.prepare(`
          UPDATE users 
          SET email = ?, name = ?, role = ?, phone = ?, knowledgeLevel = ?, address = ?
          WHERE id = ?
        `).run(email, name, role, phone, knowledgeLevel, address, id);
      }

      // Sync with Supabase profiles
      await supabaseAdmin.from('profiles').update({
        email,
        name,
        role,
        phone,
        knowledge_level: knowledgeLevel,
        address
      }).eq('email', email);

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
        nextServiceDate
      FROM (
        SELECT *, COALESCE(nextServiceDate, (SELECT MIN(nextServiceDate) FROM services WHERE clientId = clients.id AND nextServiceDate >= date('now'))) as nextServiceDate
        FROM clients
      ) c
      WHERE nextServiceDate <= date('now', '+' || ? || ' days') AND nextServiceDate >= date('now')
      ORDER BY nextServiceDate ASC
    `).all(reminderDays);

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

  // ─── LLM Router endpoints ─────────────────────────────────────────────────
  // Importação dinâmica para evitar erros de inicialização se as chaves não
  // estiverem configuradas ainda.

  // POST /api/ai/chat  → envia uma conversa e retorna a resposta do LLM
  app.post("/api/ai/chat", authenticate, async (req: any, res) => {
    try {
      const { route } = await import('./server/llm/router.ts');
      const { messages, taskType, maxTokens, temperature, forceProvider } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Campo 'messages' é obrigatório e deve ser um array" });
      }

      const response = await route({ messages, taskType, maxTokens, temperature, forceProvider });
      res.json(response);
    } catch (err: any) {
      console.error('[/api/ai/chat]', err);
      res.status(500).json({ error: err?.message ?? 'Erro interno no LLM router' });
    }
  });

  // GET /api/ai/status → status de uso dos providers (Claude, Gemini, Ollama)
  app.get("/api/ai/status", authenticate, async (_req, res) => {
    try {
      const { getProvidersStatus } = await import('./server/llm/router.ts');
      const status = await getProvidersStatus();
      res.json(status);
    } catch (err: any) {
      console.error('[/api/ai/status]', err);
      res.status(500).json({ error: err?.message ?? 'Erro ao obter status dos providers' });
    }
  });

  // GET /api/ai/usage  → histórico de consumo por provider/modelo/dia
  app.get("/api/ai/usage", authenticate, async (req: any, res) => {
    try {
      const { getUsageHistory, getProviderStats } = await import('./server/llm/usage-tracker.ts');
      const days = parseInt(req.query.days as string ?? '7', 10);
      res.json({
        history: getUsageHistory(days),
        stats:   getProviderStats(),
      });
    } catch (err: any) {
      console.error('[/api/ai/usage]', err);
      res.status(500).json({ error: err?.message ?? 'Erro ao obter histórico de uso' });
    }
  });

  // POST /api/ai/classify → detecta o tipo de tarefa sem chamar nenhum LLM
  app.post("/api/ai/classify", authenticate, (req: any, res) => {
    import('./server/llm/router.ts').then(({ classifyTask }) => {
      const { messages } = req.body;
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Campo 'messages' é obrigatório" });
      }
      res.json({ taskType: classifyTask(messages) });
    }).catch((err: any) => res.status(500).json({ error: err?.message }));
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
