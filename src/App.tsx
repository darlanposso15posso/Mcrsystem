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
import LoginForm from './components/auth/LoginForm';
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

// Utils
import { generatePDF } from './utils/pdfGenerator';
import { supabase } from './lib/supabase';
import { mapClient, unmapClient, mapService, unmapService, mapProfile, mapNotification } from './lib/supabaseUtils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'calendar' | 'services' | 'automation' | 'guide' | 'team' | 'performance' | 'security'>('dashboard');
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
  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session) {
        // Fetch profile from Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile) {
          if (profile.status === 'pending') {
            await supabase.auth.signOut();
            setUser(null);
            setLoginError('Sua conta ainda está pendente de aprovação pelo administrador.');
            setLoading(false);
            return;
          }

          const userData = mapProfile(profile);
          setUser(userData);
          if (userData.role === 'technician') {
            setNewService(prev => ({ ...prev, technicianName: userData.name }));
          }
          fetchData(userData);
        } else {
          // If no profile yet, build a temporary one from metadata
          const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
          const role = session.user.user_metadata?.role || 'technician';
          const userData = { id: session.user.id, email: session.user.email!, name, role } as User;
          setUser(userData);
          fetchData(userData);
        }
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.status === 'pending') {
              await supabase.auth.signOut();
              setUser(null);
              setLoginError('Sua conta ainda está pendente de aprovação pelo administrador.');
            } else {
              const userData = mapProfile(profile);
              setUser(userData);
              fetchData(userData);
              setLoginError('');
            }
          } else {
            // Build temporary profile from metadata if profile DB record not yet ready
            const name = session.user.user_metadata?.fullname || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
            const role = session.user.user_metadata?.role || 'technician';
            const userData = { id: session.user.id, email: session.user.email!, name, role } as User;
            setUser(userData);
            fetchData(userData);
            setLoginError('');
          }
        } else {
          setUser(null);
        }
      });
    } catch (e) {
      console.error("Auth check failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      // Login handled in App.tsx via onAuthStateChange or manual call
      await checkAuth();
    } catch (error: any) {
      setLoginError(error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const fetchData = async (currentUser = user) => {
    if (!currentUser) return;
    try {
      const fetchWithTimeout = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.ok ? r.json() : null);

      const [clientsDataResult, servicesDataResult, activeServiceResult, settingsResult, notificationsResult, profilesResult] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('services').select('*'),
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

      if (currentUser.role === 'admin') {
        const [usersRes, notifRes, settingsRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('notifications').select('*'),
          supabase.from('settings').select('*')
        ]);

        if (usersRes.data) setUsers(usersRes.data.map(mapProfile));
        if (notifRes.data) setNotifications(notifRes.data.map(mapNotification));
        if (settingsRes.data) {
          const sObj: Record<string, string> = {};
          settingsRes.data.forEach((s: any) => {
            sObj[s.key] = s.value;
          });
          setSettings(sObj);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

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
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();

    let lat = null;
    let lng = null;
    const addressStr = `${newClient.address}, ${newClient.city || ''}, ${newClient.state || ''}, ${newClient.zip || ''}`;
    const geo = await geocodeAddress(addressStr);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }

    const { error } = await supabase.from('clients').insert([unmapClient({ ...newClient, lat, lng } as any)]);
    if (error) {
      alert("Erro ao adicionar cliente: " + error.message);
      return;
    }
    setShowClientModal(false);
    setNewClient({
      name: '', legalName: '', dba: '', state: '', zip: '', establishmentType: '', businessHours: '',
      address: '', city: '', county: '', managerName: '', managerRole: '',
      phone: '', email: '', hoodCount: 1, filterCount: 0, ductType: 'Vertical' as any,
      ductHeight: '', roofAccess: false, recurrence: Recurrence.QUARTERLY, cleaningPrice: 0
    });
    fetchData();
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    let lat = editingClient.lat;
    let lng = editingClient.lng;
    const addressStr = `${editingClient.address}, ${editingClient.city || ''}, ${editingClient.state || ''}, ${editingClient.zip || ''}`;
    const geo = await geocodeAddress(addressStr);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }

    const { error } = await supabase.from('clients').update(unmapClient({ ...editingClient, lat, lng })).eq('id', editingClient.id);
    if (error) {
      alert("Erro ao atualizar cliente: " + error.message);
      return;
    }
    setShowEditClientModal(false);
    setEditingClient(null);
    fetchData();
  };

  const handleDeleteClient = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja apagar este cliente? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      alert("Erro ao remover cliente: " + error.message);
      return;
    }
    setShowClientDetails(false);
    setShowEditClientModal(false);
    fetchData();
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
        // Manually insert into profiles table to ensure it exists
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: newUser.email,
          name: newUser.name || newUser.email.split('@')[0],
          role: newUser.role as any,
          phone: newUser.phone,
          status: 'active',
          knowledge_level: newUser.knowledgeLevel,
          address: newUser.address
        });
      }

      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'technician', phone: '', knowledgeLevel: 'Aprendiz', address: '' });
      fetchData();
      alert("Usuário criado com sucesso!");
    } catch (error: any) {
      alert("Erro ao criar usuário: " + error.message);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      fetchData();
    } catch (e) {
      console.error("Error deleting notification", e);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const { error } = await supabase.from('profiles').update({
        name: editingUser.name,
        role: editingUser.role,
        phone: editingUser.phone,
        status: editingUser.status,
        address: editingUser.address,
        knowledge_level: editingUser.knowledgeLevel
      }).eq('id', editingUser.id);

      if (!error) {
        setShowEditUserModal(false);
        setEditingUser(null);
        fetchData();
      } else {
        alert("Erro ao atualizar usuário: " + error.message);
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

      const { error } = await supabase.from('services').insert([payload]);

      if (!error) {
        setShowServiceModal(false);
        setSelectedClientId: (id: string | number) => void;
        setInspectionPhotos([]);
        setPreCleaningChecklistData({});
        fetchData();
      } else {
        alert("Erro ao iniciar o serviço: " + error.message);
      }
    } catch (e) {
      alert("Erro de conexão ao iniciar serviço.");
    }
  };

  const handleCancelService = async () => {
    if (!activeService) return;
    if (!window.confirm("Certeza que deseja cancelar este serviço? O administrador será notificado.")) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', activeService.id);
      if (!error) {
        setActiveService(null);
        setInspectionPhotos([]);
        fetchData();
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

      const { error } = await supabase.from('services').update(payload).eq('id', activeService.id);

      if (!error) {
        // Atualiza a próxima data de serviço no cliente baseando-se na recorrência
        const client = clients.find(c => c.id === activeService.clientId);
        if (client) {
          const today = new Date();
          let nextDate = new Date(today);
          if (client.recurrence === Recurrence.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
          else if (client.recurrence === Recurrence.QUARTERLY) nextDate.setMonth(nextDate.getMonth() + 3);
          else if (client.recurrence === Recurrence.SEMI_ANNUAL || client.recurrence === 'SEMI-ANNUAL' as any) nextDate.setMonth(nextDate.getMonth() + 6);
          else if (client.recurrence === Recurrence.ANNUAL) nextDate.setFullYear(nextDate.getFullYear() + 1);

          await supabase.from('clients').update({
            last_service_date: today.toISOString(),
            next_service_date: nextDate.toISOString()
          }).eq('id', client.id);
        }

        // Trigger Resend email
        const clientEmail = clients.find(c => c.id === activeService.clientId)?.email;
        if (clientEmail) {
          supabase.functions.invoke('send-report', {
            body: {
              clientEmail,
              restaurantName: activeService.restaurantName || "Estabelecimento",
              pdfUrl: `https://dehoodcleaning.com/report/${activeService.id}`, // Adjust PDF viewing URL later
              serviceDate: new Date().toISOString()
            }
          }).catch(err => console.error("Error sending email:", err));
        }

        setActiveService(null);
        setCompletionPhotos([]);
        setCompletionChecklist({
          polished: false, floorsCleaned: false, filtersInstalled: false, systemTested: false, stickersApplied: false
        });
        fetchData();
      } else {
        alert("Erro ao enviar o relatório para o Servidor: " + error.message);
      }
    } catch (e) {
      alert("Erro de conexão com o servidor ao finalizar o serviço.");
    }
  };

  const filteredClients = useMemo(() => clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  ), [clients, searchTerm]);

  const filteredServices = useMemo(() => services.filter(s =>
    s.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.technicianName.toLowerCase().includes(searchTerm.toLowerCase())
  ), [services, searchTerm]);

  const upcomingServices = useMemo(() => services.filter(s => {
    const date = new Date(s.nextServiceDate);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }), [services]);

  const recentServices = useMemo(() => [...services].sort((a, b) =>
    new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
  ).slice(0, 5), [services]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginForm
        handleLogin={handleLogin}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-[#1A1C1E]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        handleLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        settings={settings}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#151619] border-b border-white/10">
          <img src={settings?.logo_image || "https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl"} alt="D&E Logo" className="h-10 object-contain drop-shadow-md" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.style.display = 'none'} />
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          user={user}
          setShowClientModal={setShowClientModal}
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              user={user}
              stats={stats}
              upcomingServices={upcomingServices}
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
              users={users}
              settings={settings}
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
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView clients={clients} services={services} />
          )}

          {activeTab === 'services' && (
            <ServiceHistory
              user={user}
              clients={clients}
              filteredServices={filteredServices}
              generatePDF={generatePDF}
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

          {activeTab === 'security' && user.role === 'admin' && (
            <SecurityBackup />
          )}

          {activeTab === 'automation' && user.role === 'admin' && (
            <Automation settings={settings} fetchData={fetchData} />
          )}

          {activeTab === 'guide' && user.role === 'admin' && (
            <ConfigGuide />
          )}

          {/* ... (Security, Automation, Guide tabs OMITTED for brevity but would be similar modular components) ... */}
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
  );
}
