import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  AlertTriangle,
  Menu,
  CheckCircle2
} from 'lucide-react';
import { ServiceRecord, User, Client } from './types';

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
import LeadManagement from './components/leads/LeadManagement';
import ConfigGuide from './components/guide/ConfigGuide';
import Modals from './components/common/Modals';
import CalendarView from './components/calendar/CalendarView';
import AdminSettings from './components/admin/AdminSettings';
import { segmentLabels } from './translations/segments';

// Utils
import { generatePDF } from './utils/pdfGenerator';
import { supabase } from './lib/supabase';
import { mapService, unmapService, mapProfile, mapNotification } from './lib/supabaseUtils';
import LoginForm from './components/auth/LoginForm';

// Hooks
import { useActiveService } from './hooks/useActiveService';
import { useClients } from './hooks/useClients';
import { useAppSettings } from './hooks/useAppSettings';
import { useDashboardStats } from './hooks/useDashboardStats';
import { useLeads } from './hooks/useLeads';
import { Recurrence } from './types';

function App() {
  // ── Notification system ──────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const confirmAction = useCallback((message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmation({ message, onConfirm, onCancel });
  }, []);

  // ── Auth / User ──────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const companyId = user?.companyId ?? '';
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // ── Settings (theme, language, segment) ─────────────────────────────────
  const { settings, setSettings, currentSegment, upsertSetting } = useAppSettings(companyId);
  const s = segmentLabels[currentSegment || 'hood_cleaning'] || segmentLabels['hood_cleaning']; // SAFE FALLBACK

  // ── Clients hook ─────────────────────────────────────────────────────────
  const {
    clients, setClients,
    newClient, setNewClient,
    editingClient, setEditingClient,
    showClientModal, setShowClientModal,
    showEditClientModal, setShowEditClientModal,
    selectedClient, setSelectedClient,
    showClientDetails, setShowClientDetails,
    handleCreateClient, handleUpdateClient, handleDeleteClient,
  } = useClients({ showToast, confirmAction, userRole: user?.role, companyId });

  // ── Services ─────────────────────────────────────────────────────────────
  const [services, setServices] = useState<ServiceRecord[]>([]);

  // ── Active service hook ───────────────────────────────────────────────────
  const {
    activeService,
    loadActiveService,
    preCleaningChecklistData,
    updatePreCleaningChecklist,
    setPreCleaningChecklistData,
    completionChecklist,
    setCompletionChecklist,
    inspectionPhotos,
    setInspectionPhotos,
    completionPhotos,
    setCompletionPhotos,
    cancelService: handleCancelService,
    completeService,
  } = useActiveService({
    showToast,
    confirmAction,
    clients,
    onServiceCompleted: (completedService, updatedClient) => {
      setServices(prev => prev.map(s => s.id === completedService.id ? completedService : s));
      if (updatedClient) setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    },
    onServiceCancelled: (serviceId) => {
      setServices(prev => prev.filter(s => s.id !== serviceId));
    },
  });

  // ── Dashboard stats (pure derivation) ────────────────────────────────────
  const { stats, alerts } = useDashboardStats(clients, services, settings);

  // ── Other state ───────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'calendar' | 'services' | 'automation' | 'guide' | 'team' | 'performance' | 'security' | 'admin_settings' | 'leads'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | number | null>(null);

  const [newService, setNewService] = useState({
    clientId: 0,
    volume: 'Medium',
    systemType: 'Hood + Duct + Fan',
    conditionBefore: 'Moderate',
    servicesPerformed: '',
    technicianName: '',
    serviceDate: new Date().toISOString().split('T')[0],
    nextServiceDate: '',
    fireHazard: false,
    nfpaCompliance: true,
    reportNumber: '',
    notes: '',
    status: 'COMPLETED' as any
  });

  const {
    leads,
    fetchLeads,
    isLoading: isLoadingLeads,
    showLeadModal,
    setShowLeadModal,
    editingLead,
    setEditingLead,
    handleCreateLead,
    handleUpdateLead,
    handleDeleteLead,
  } = useLeads({ showToast, confirmAction, companyId });

  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'technician', phone: '', knowledgeLevel: 'Aprendiz', address: ''
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profile) {
            setUser(mapProfile(profile));
            setIsLoggingIn(false);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile) {
          setUser(mapProfile(profile));
          setIsLoggingIn(false);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(user);
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggingIn(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    // Logic is handled inside LoginForm, App.tsx just reacts to onAuthStateChange
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async (currentUser: User | null = user) => {
    if (!currentUser) return;
    try {
      const [clientsRes, servicesRes, activeServiceRes, settingsRes, notificationsRes, profilesRes] = await Promise.all([
        supabase.from('clients').select('id, name, legal_name, dba, establishment_type, business_hours, address, city, state, zip, county, manager_name, manager_role, phone, email, hood_count, filter_count, duct_type, duct_height, roof_access, recurrence, last_service_date, next_service_date, cleaning_price, lat, lng, created_at'),
        supabase.from('services').select('id, client_id, restaurant_name, volume, system_type, condition_before, services_performed, technician_name, service_date, next_service_date, fire_hazard, nfpa_compliance, report_number, notes, inspection_start_time, status, completion_time').order('service_date', { ascending: false }).limit(50),
        supabase.from('services').select('*').eq('status', 'IN_PROGRESS').eq('technician_name', currentUser.name).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        Promise.resolve({ data: [] as any[] }), // Settings handled by useAppSettings
        currentUser.role === 'admin' ? supabase.from('notifications').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
        currentUser.role === 'admin' ? supabase.from('profiles').select('*') : Promise.resolve({ data: [] as any[] }),
      ]);

      const { mapClient } = await import('./lib/supabaseUtils');

      if (clientsRes.data) {
        let mapped = clientsRes.data.map(mapClient);
        if (currentUser.role === 'technician') {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() + 20);
          mapped = mapped.filter(c => c.nextServiceDate && new Date(c.nextServiceDate) <= cutoff);
        }
        setClients(mapped);
      }

      if (servicesRes.data) {
        let mapped = servicesRes.data.map(mapService);
        if (currentUser.role === 'technician') {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() + 20);
          mapped = mapped.filter(s => !s.nextServiceDate || new Date(s.nextServiceDate) <= cutoff);
        }
        setServices(mapped);
      }

      if (profilesRes.data) setUsers(profilesRes.data.map(mapProfile));

      // settings update handled by hook internally via its own useEffect[companyId]

      if (notificationsRes.data) setNotifications(notificationsRes.data.map(mapNotification));

      // Load active service into the hook
      loadActiveService(activeServiceRes.data ? mapService(activeServiceRes.data) : null);

      if (currentUser.role === 'admin') {
        fetchLeads();
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [user, loadActiveService]);

  // ── Service handlers ──────────────────────────────────────────────────────
  const handleCompleteService = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await completeService({
      fireHazard: newService.fireHazard,
      nfpaCompliance: newService.nfpaCompliance,
      notes: newService.notes,
      nextServiceDate: newService.nextServiceDate,
    });
  }, [completeService, newService]);

  const handleStartService = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    confirmAction('Deseja iniciar o serviço neste cliente agora?', async () => {
      try {
        const client = clients.find(c => c.id === selectedClientId);
        const payload = unmapService({
          ...newService,
          restaurantName: client?.name || 'N/A',
          serviceDate: newService.serviceDate || new Date().toISOString().split('T')[0],
          technicianName: user?.name || newService.technicianName || 'Technician',
          volume: newService.volume as 'Low' | 'Medium' | 'High',
          conditionBefore: newService.conditionBefore as 'Light' | 'Moderate' | 'Heavy',
          clientId: selectedClientId as number,
          status: 'IN_PROGRESS',
          inspectionStartTime: new Date().toISOString(),
          inspectionPhotosBefore: inspectionPhotos as any,
          preCleaningChecklist: JSON.stringify(preCleaningChecklistData) as any,
          companyId, // required by RLS
        });
        Object.keys(payload).forEach(k => (payload as any)[k] === undefined && delete (payload as any)[k]);

        const { data, error } = await supabase.from('services').insert([payload]).select().single();
        if (!error && data) {
          const created = mapService(data);
          setServices(prev => [created, ...prev]);
          loadActiveService(created);
          setShowServiceModal(false);
          setSelectedClientId(null);
          setInspectionPhotos([]);
          setPreCleaningChecklistData({});
        } else {
          showToast('Erro ao iniciar serviço', 'error');
        }
      } catch {
        showToast('Erro ao iniciar serviço', 'error');
      }
    });
  }, [clients, selectedClientId, newService, user, inspectionPhotos, preCleaningChecklistData, confirmAction, showToast, loadActiveService]);

  // ── User handlers ─────────────────────────────────────────────────────────
  const handleCreateUser = useCallback(async (e: React.FormEvent) => {
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
            address: newUser.address,
          },
        },
      });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: newUser.email,
          name: newUser.name || newUser.email.split('@')[0],
          role: newUser.role,
          phone: newUser.phone,
          status: 'active',
          knowledge_level: newUser.knowledgeLevel,
          address: newUser.address,
        }).select().single();
        if (profile) setUsers(prev => [...prev, mapProfile(profile)]);
      }
      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'technician', phone: '', knowledgeLevel: 'Aprendiz', address: '' });
      showToast('Usuário criado com sucesso!');
    } catch {
      showToast('Erro ao criar usuário', 'error');
    }
  }, [newUser, showToast]);

  const handleUpdateUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const { data, error } = await supabase.from('profiles').update({
        name: editingUser.name,
        role: editingUser.role,
        phone: editingUser.phone,
        status: editingUser.status,
        address: editingUser.address,
        knowledge_level: editingUser.knowledgeLevel,
      }).eq('id', editingUser.id).select().single();

      if (!error && data) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? mapProfile(data) : u));
        setShowEditUserModal(false);
        setEditingUser(null);
        showToast('Usuário atualizado com sucesso!');
      } else {
        showToast('Erro ao atualizar usuário', 'error');
      }
    } catch {
      showToast('Erro ao atualizar usuário', 'error');
    }
  }, [editingUser, showToast]);

  const handleDeleteNotification = useCallback(async (id: number) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const deferredSearch = React.useDeferredValue(searchTerm);

  const filteredClients = useMemo(() =>
    clients.filter(c =>
      c.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      c.city.toLowerCase().includes(deferredSearch.toLowerCase())
    ), [clients, deferredSearch]);

  const filteredServices = useMemo(() =>
    services.filter(s =>
      (s.restaurantName ?? '').toLowerCase().includes(deferredSearch.toLowerCase()) ||
      s.technicianName.toLowerCase().includes(deferredSearch.toLowerCase())
    ), [services, deferredSearch]);

  const recentServices = useMemo(() =>
    [...services].sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()).slice(0, 5),
    [services]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000"></div>
        
        <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="bg-white/5 p-6 rounded-[2rem] inline-block border border-white/10 backdrop-blur-3xl relative">
            <img src="/mcr-logo.png" alt="MCR Logo" className="h-16 w-auto object-contain animate-pulse" />
            <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full scale-150 animate-pulse"></div>
          </div>
          
          <div className="space-y-3">
             <h1 className="text-3xl font-black text-white tracking-widest uppercase italic leading-none">MCR SYSTEM</h1>
             <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 animate-pulse">Initializing Platform Authority</p>
          </div>

          <div className="w-48 h-[2px] bg-white/5 rounded-full mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-loading-progress origin-left"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (isLoggingIn) {
      return (
        <LoginForm
          handleLogin={handleLogin}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          loginError={loginError}
          onBack={() => setIsLoggingIn(false)}
        />
      );
    }
    return (
      <LandingPage 
        onLogin={() => setIsLoggingIn(true)}
        onStartTrial={() => setIsLoggingIn(true)} 
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-color)] flex font-sans text-[var(--text-primary)]">
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
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <img
                src={settings?.logo_image || 'https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl'}
                alt="Company Logo"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
              <img src="/mcr-logo.png" alt="MCR Logo" className="h-6 w-auto" />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 bg-slate-900/5 hover:bg-slate-900/10 text-slate-900 rounded-lg transition-all"
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
                setPreCleaningChecklistData={updatePreCleaningChecklist}
                users={clients}
                settings={settings}
                segmentLabels={s}
                showToast={showToast}
                confirmAction={confirmAction}
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
                showToast={showToast}
                confirmAction={confirmAction}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView clients={clients} services={services} settings={settings} segmentLabels={s} />
            )}

            {activeTab === 'leads' && user.role === 'admin' && (
              <LeadManagement
                leads={leads}
                isLoading={isLoadingLeads}
                showLeadModal={showLeadModal}
                setShowLeadModal={setShowLeadModal}
                editingLead={editingLead}
                setEditingLead={setEditingLead}
                handleCreateLead={handleCreateLead}
                handleUpdateLead={handleUpdateLead}
                handleDeleteLead={handleDeleteLead}
                showToast={showToast}
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
                showToast={showToast}
              />
            )}

            {activeTab === 'team' && user.role === 'admin' && (
              <TeamManagement
                users={users}
                setShowUserModal={setShowUserModal}
                setEditingUser={setEditingUser}
                setShowEditUserModal={setShowEditUserModal}
                showToast={showToast}
                confirmAction={confirmAction}
              />
            )}

            {activeTab === 'performance' && user.role === 'admin' && (
              <Performance users={users} services={services} />
            )}

            {activeTab === 'admin_settings' && user.role === 'admin' && (
              <AdminSettings user={user} settings={settings} fetchData={fetchData} showToast={showToast} upsertSetting={upsertSetting} />
            )}

            {activeTab === 'security' && user.role === 'admin' && (
              <SecurityBackup showToast={showToast} />
            )}

            {activeTab === 'automation' && user.role === 'admin' && (
              <Automation user={user} settings={settings} fetchData={fetchData} showToast={showToast} upsertSetting={upsertSetting} />
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

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] p-4 rounded-none border border-white/10 shadow-2xl blue-glow ${toast.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
          toast.type === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-[var(--card-color)] text-blue-600'
          }`}>
          <div className="flex items-center gap-3">
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--card-color)] border border-white/10 p-8 max-w-sm w-full blue-glow shadow-2xl">
            <AlertTriangle className="text-amber-500 mb-4" size={32} />
            <h3 className="text-xl font-black text-white mb-2 italic">Confirmar Ação</h3>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">{confirmation.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { confirmation.onConfirm(); setConfirmation(null); }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-none transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20"
              >
                Confirmar
              </button>
              <button
                onClick={() => { confirmation.onCancel?.(); setConfirmation(null); }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-3 px-4 rounded-none transition-all uppercase text-[10px] tracking-widest border border-white/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
