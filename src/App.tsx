import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  X,
  AlertTriangle,
  Menu,
  CheckCircle2,
} from 'lucide-react';
import { ServiceRecord, User, Client } from './types';

// Components — eagerly loaded (needed on first render)
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import ClientList from './components/clients/ClientList';
import ServiceHistory from './components/services/ServiceHistory';
import Modals from './components/common/Modals';
import SessionTimeoutModal from './components/auth/SessionTimeoutModal';

// Components — lazily loaded (only downloaded when the user navigates to that tab)
const CalendarView   = lazy(() => import('./components/calendar/CalendarView'));
const AdminSettings  = lazy(() => import('./components/admin/AdminSettings'));
const AIMaster       = lazy(() => import('./components/ai/AIMaster'));
const TeamManagement = lazy(() => import('./components/team/TeamManagement'));
const Performance    = lazy(() => import('./components/performance/Performance'));
const SecurityBackup = lazy(() => import('./components/security/SecurityBackup'));
const Automation     = lazy(() => import('./components/automation/Automation'));
const LeadManagement = lazy(() => import('./components/leads/LeadManagement'));
const ConfigGuide    = lazy(() => import('./components/guide/ConfigGuide'));
const BillingPage    = lazy(() => import('./components/subscription/BillingPage'));
const UpgradeModal   = lazy(() => import('./components/subscription/UpgradeModal'));

import { segmentLabels } from './translations/segments';

// Utils
import { generatePDF } from './utils/pdfGenerator';
import { supabase, isOAuthCallback } from './lib/supabase';
import { mapService, unmapService, mapProfile, mapNotification } from './lib/supabaseUtils';
import LoginForm from './components/auth/LoginForm';

// Hooks
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useActiveService } from './hooks/useActiveService';
import { useClients } from './hooks/useClients';
import { useAppSettings } from './hooks/useAppSettings';
import { useDashboardStats } from './hooks/useDashboardStats';
import { useLeads } from './hooks/useLeads';
import { useSubscription } from './hooks/useSubscription';
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
  // Fallback: use user.id as company_id for solo/admin accounts where company_id is not set
  const companyId: string = user?.companyId ? String(user.companyId) : user?.id ? String(user.id) : '';
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // ── Settings (theme, language, segment) ─────────────────────────────────
  const { settings, setSettings, currentSegment, upsertSetting } = useAppSettings(companyId);
  const s = segmentLabels[currentSegment || 'hood_cleaning'] || segmentLabels['hood_cleaning']; // SAFE FALLBACK

  // ── Subscription (must be before useClients so maxClients is available) ──
  // clientCount/techCount passed as 0 here; warnings are computed in render from live counts
  const subscription = useSubscription(companyId || null, 0, 0);

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
  } = useClients({
    showToast, confirmAction, userRole: user?.role, companyId,
    maxClients: subscription.maxClients,
    onLimitReached: () => setUpgradeReason('client_limit'),
  });

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
    companyId,
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'calendar' | 'services' | 'automation' | 'guide' | 'team' | 'performance' | 'security' | 'admin_settings' | 'leads' | 'billing'>('dashboard');
  const [upgradeReason, setUpgradeReason] = useState<'client_limit' | 'technician_limit' | 'trial_expired' | 'manual' | null>(null);
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
    // isOAuthCallback: hash captured before createClient cleared it (supabase.ts module-level)
    // sessionStorage flag: set in handleGoogleLogin before the redirect
    const isOAuthRedirect = isOAuthCallback || sessionStorage.getItem('oauth_pending') === '1';
    sessionStorage.removeItem('oauth_pending');

    const applySession = async (session: any) => {
      if (!session?.user) { setUser(null); setIsInitializing(false); return; }

      // Set minimal user immediately so the app opens right away
      const meta = session.user.user_metadata;
      const minimalUser: User = {
        id: session.user.id,
        email: session.user.email ?? '',
        name: meta?.full_name || meta?.name || session.user.email?.split('@')[0] || 'User',
        role: 'admin',
        status: 'active',
        companyId: '',
        phone: '',
        knowledgeLevel: '',
        address: '',
        joinDate: session.user.created_at,
      };
      setUser(minimalUser);
      setIsLoggingIn(false);
      setIsInitializing(false);

      // Load full profile in background
      try {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile) {
          const { data: created } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              name: minimalUser.name,
              role: 'admin',
              status: 'active',
              company_id: session.user.id, // use auth ID as company ID for solo admins
            }, { onConflict: 'id' })
            .select()
            .single();
          profile = created;
        }

        if (profile) setUser(mapProfile(profile));
      } catch (err) {
        console.error('Profile load error:', err);
      }
    };

    // Safety: if SIGNED_IN never fires (e.g. OAuth error), release spinner after 5s
    let oauthTimeout: ReturnType<typeof setTimeout> | null = null;
    if (isOAuthRedirect) {
      oauthTimeout = setTimeout(() => setIsInitializing(false), 5000);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (oauthTimeout) { clearTimeout(oauthTimeout); oauthTimeout = null; }
      if (session?.user) {
        await applySession(session);
        return;
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsInitializing(false);
      } else if (event === 'INITIAL_SESSION') {
        // For OAuth redirects, new users have no stored session yet — SIGNED_IN
        // will fire next with the actual session. Keep spinner until then.
        if (!isOAuthRedirect) {
          setIsInitializing(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (oauthTimeout) clearTimeout(oauthTimeout);
    };
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

  // ── Session timeout (1h inactivity) ──────────────────────────────────────
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  useSessionTimeout(
    !!user,
    () => { handleLogout(); setShowSessionWarning(false); },
    () => setShowSessionWarning(true),
    () => setShowSessionWarning(false),
  );

  const handleLogin = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    // Logic is handled inside LoginForm, App.tsx just reacts to onAuthStateChange
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async (currentUser: User | null = user) => {
    if (!currentUser) return;
    // Scoped company identifier — never fetch data outside this company
    const cid = currentUser.companyId || currentUser.id;
    if (!cid) return; // refuse to fetch unscoped data
    try {
      const [clientsRes, servicesRes, activeServiceRes, settingsRes, notificationsRes, profilesRes] = await Promise.all([
        supabase.from('clients').select('id, name, legal_name, dba, establishment_type, business_hours, address, city, state, zip, county, manager_name, manager_role, phone, email, hood_count, filter_count, duct_type, duct_height, roof_access, recurrence, last_service_date, next_service_date, cleaning_price, lat, lng, created_at').eq('company_id', cid),
        supabase.from('services').select('id, client_id, restaurant_name, volume, system_type, condition_before, services_performed, technician_name, service_date, next_service_date, fire_hazard, nfpa_compliance, report_number, notes, inspection_start_time, status, completion_time').eq('company_id', cid).order('service_date', { ascending: false }).limit(50),
        supabase.from('services').select('*').eq('company_id', cid).eq('status', 'IN_PROGRESS').eq('technician_name', currentUser.name).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        Promise.resolve({ data: [] as any[] }), // Settings handled by useAppSettings
        currentUser.role === 'admin' ? supabase.from('notifications').select('*').eq('company_id', cid).order('created_at', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
        currentUser.role === 'admin' ? supabase.from('profiles').select('*').eq('company_id', cid) : Promise.resolve({ data: [] as any[] }),
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
      }).eq('id', editingUser.id).eq('company_id', companyId).select().single();

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
    // Always scope deletes to the current company to prevent IDOR
    await supabase.from('notifications').delete().eq('id', id).eq('company_id', companyId);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [companyId]);

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

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
          <div className="md:hidden flex items-center justify-between p-4 bg-[var(--sidebar-bg)] border-b border-[var(--border-muted)] shadow-sm">
            <div className="flex items-center gap-2">
              <img
                src={settings?.logo_image || 'https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl'}
                alt="Company Logo"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
              <img src="/mcr-logo.png" alt="MCR Logo" className="h-6 w-auto opacity-60" />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
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

            {/* Trial / Expired Banner */}
            {user.role === 'admin' && subscription.status === 'trial' && subscription.trialDaysLeft !== null && subscription.trialDaysLeft <= 7 && (
              <div className="flex items-center gap-3 p-3 mb-4 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-400">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="text-xs font-bold flex-1">
                  {subscription.trialDaysLeft === 0 ? 'Seu trial expira hoje!' : `Trial expira em ${subscription.trialDaysLeft} dia${subscription.trialDaysLeft !== 1 ? 's' : ''}.`}
                  {' '}Faça upgrade para não perder o acesso.
                </span>
                <button
                  onClick={() => setUpgradeReason('manual')}
                  className="shrink-0 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black text-[10px] uppercase tracking-widest"
                >
                  Upgrade
                </button>
              </div>
            )}
            {user.role === 'admin' && (subscription.status === 'expired' || subscription.status === 'canceled') && (
              <div className="flex items-center gap-3 p-3 mb-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="text-xs font-bold flex-1">
                  {subscription.status === 'expired' ? 'Trial expirado.' : 'Assinatura cancelada.'} Escolha um plano para reativar o acesso.
                </span>
                <button
                  onClick={() => setUpgradeReason('trial_expired')}
                  className="shrink-0 px-3 py-1 bg-red-500 hover:bg-red-400 text-white rounded-lg font-black text-[10px] uppercase tracking-widest"
                >
                  Reativar
                </button>
              </div>
            )}

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
                users={users}
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

            <Suspense fallback={<div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
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
                  companyId={companyId}
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
                <SecurityBackup showToast={showToast} companyId={companyId} />
              )}

              {activeTab === 'automation' && user.role === 'admin' && (
                <Automation user={user} settings={settings} fetchData={fetchData} showToast={showToast} upsertSetting={upsertSetting} />
              )}

              {activeTab === 'guide' && user.role === 'admin' && (
                <ConfigGuide />
              )}

              {activeTab === 'billing' && user.role === 'admin' && (
                <BillingPage
                  subscription={subscription}
                  companyId={companyId}
                  clientCount={clients.length}
                  technicianCount={users.filter(u => u.role === 'technician').length}
                  companyName={settings?.company_name ?? ''}
                />
              )}
            </Suspense>
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

      {/* AI Master — assistente flutuante disponível em todas as telas */}
      {user && (
        <Suspense fallback={null}>
          <AIMaster
            activeTab={activeTab}
            user={user}
          />
        </Suspense>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 md:top-auto md:bottom-5 md:left-auto md:right-5 md:translate-x-0 w-[90vw] md:w-auto z-[100] p-4 rounded-xl border border-white/10 shadow-2xl blue-glow ${toast.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
          toast.type === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-[var(--card-color)] text-blue-600'
          }`}>
          <div className="flex items-center gap-3">
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Session Timeout Warning */}
      {showSessionWarning && (
        <SessionTimeoutModal
          onStay={() => setShowSessionWarning(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Upgrade Modal */}
      {upgradeReason && (
        <Suspense fallback={null}>
          <UpgradeModal
            reason={upgradeReason}
            companyId={String(companyId)}
            currentPlanId={subscription.planId}
            onClose={() => setUpgradeReason(null)}
          />
        </Suspense>
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
