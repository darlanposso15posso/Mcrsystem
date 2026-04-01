import React from 'react';
import { X, Camera, AlertTriangle } from 'lucide-react';
import { Client, User, Recurrence } from '../../types';
import { compressImage } from '../../utils/imageUtils';
import { MANDATORY_PRE_CLEANING_CHECKLIST } from '../../utils/preCleaningChecklist';

interface ModalsProps {
    showClientModal: boolean;
    setShowClientModal: (show: boolean) => void;
    showEditClientModal: boolean;
    setShowEditClientModal: (show: boolean) => void;
    editingClient: any;
    setEditingClient: (client: any) => void;
    handleCreateClient: (e: React.FormEvent) => void;
    handleUpdateClient: (e: React.FormEvent) => void;
    newClient: any;
    setNewClient: (client: any) => void;
    handleDeleteClient: (id: number) => void;

    showUserModal: boolean;
    setShowUserModal: (show: boolean) => void;
    showEditUserModal: boolean;
    setShowEditUserModal: (show: boolean) => void;
    editingUser: any;
    setEditingUser: (user: any) => void;
    handleCreateUser: (e: React.FormEvent) => void;
    handleUpdateUser: (e: React.FormEvent) => void;
    newUser: any;
    setNewUser: (user: any) => void;

    showServiceModal: boolean;
    setShowServiceModal: (show: boolean) => void;
    handleStartService: (e: React.FormEvent) => void;

    inspectionPhotos: string[];
    setInspectionPhotos: (photos: string[]) => void;

    showClientDetails: boolean;
    setShowClientDetails: (show: boolean) => void;
    selectedClient: Client | null;
    user?: User | null;
    preCleaningChecklistData: Record<string, boolean>;
    setPreCleaningChecklistData: (data: Record<string, boolean>) => void;
    settings?: Record<string, string>;
}

const Modals: React.FC<ModalsProps> = (props) => {
    const {
        showClientModal, setShowClientModal,
        showEditClientModal, setShowEditClientModal,
        editingClient, setEditingClient,
        handleCreateClient, handleUpdateClient,
        newClient, setNewClient,
        showUserModal, setShowUserModal,
        showEditUserModal, setShowEditUserModal,
        editingUser, setEditingUser,
        handleCreateUser, handleUpdateUser,
        newUser, setNewUser,
        showServiceModal, setShowServiceModal,
        handleStartService,
        inspectionPhotos, setInspectionPhotos,
        showClientDetails, setShowClientDetails,
        selectedClient, user, handleDeleteClient,
        preCleaningChecklistData, setPreCleaningChecklistData
    } = props;

    if (showClientDetails && selectedClient) {
        return (
            <div className="fixed inset-0 bg-[#0A0A0B]/90 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
                <div className="bg-[var(--card-color)] rounded-none w-full max-w-2xl my-auto overflow-hidden shadow-2xl border border-[var(--border-muted)] blue-glow">
                    <div className="p-8 bg-[var(--bg-color)] text-white flex justify-between items-center border-b border-[var(--border-muted)]">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-blue-600 text-[var(--bg-color)] rounded-none flex items-center justify-center text-3xl font-black blue-glow">
                                {selectedClient.name[0]}
                            </div>
                            <div>
                                <h3 className="font-black text-2xl tracking-tight text-white uppercase italic">{selectedClient.name}</h3>
                                <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest italic">{selectedClient.establishmentType || 'Restaurante'}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowClientDetails(false)} className="p-2 hover:bg-[var(--card-alt-color)]/80 rounded-none transition-colors border border-[var(--border-muted)] text-[var(--text-muted)]"><X size={24} /></button>
                    </div>
                    <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-[var(--text-faint)] mb-3 tracking-widest border-b border-[var(--border-muted)] pb-1">Identificação</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)] font-bold uppercase tracking-widest">DBA:</span> <span className="font-black text-white">{selectedClient.dba || 'N/A'}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)] font-bold uppercase tracking-widest">Razão Social:</span> <span className="font-black text-white">{selectedClient.legalName || 'N/A'}</span></div>
                                    {user?.role === 'admin' && (
                                        <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)] font-bold uppercase tracking-widest">Valor:</span> <span className="font-black text-blue-600">${selectedClient.cleaningPrice || 0}</span></div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-[var(--text-faint)] mb-3 tracking-widest border-b border-[var(--border-muted)] pb-1">Localização</h4>
                                <div className="text-sm font-black text-white uppercase tracking-tight">{selectedClient.address}</div>
                                <div className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">{selectedClient.city}, {selectedClient.state} {selectedClient.zip}</div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-[var(--text-faint)] mb-3 tracking-widest border-b border-[var(--border-muted)] pb-1">Contato</h4>
                                <div className="bg-blue-600/5 p-5 rounded-none border border-blue-600/20 shadow-inner">
                                    <div className="font-black text-white uppercase tracking-tight text-sm">{selectedClient.managerName}</div>
                                    <a href={`tel:${selectedClient.phone}`} className="text-blue-600 mt-2 block hover:text-blue-500 transition-colors font-black text-sm tracking-widest">
                                        {selectedClient.phone}
                                    </a>
                                    <div className="text-[var(--text-muted)] text-xs font-bold mt-1 tracking-widest italic">{selectedClient.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-[var(--card-alt-color)] border-t border-[var(--border-muted)] flex justify-end">
                        <button onClick={() => setShowClientDetails(false)} className="px-10 py-3 bg-[var(--card-alt-color)] border border-[var(--border-color)] text-white rounded-none font-black uppercase tracking-widest text-xs hover:bg-[var(--card-alt-color)]/80 transition-all">Fechar painel</button>
                    </div>
                </div>
            </div>
        );
    }

    if (showClientModal || showEditClientModal) {
        const client = showEditClientModal ? editingClient : newClient;
        const setClient = showEditClientModal ? setEditingClient : setNewClient;
        const handleSave = showEditClientModal ? handleUpdateClient : handleCreateClient;

        return (
            <div className="fixed inset-0 bg-[#0A0A0B]/95 backdrop-blur-xl flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
                <div className="bg-[var(--card-color)] rounded-none w-full max-w-4xl my-auto overflow-hidden shadow-2xl border border-[var(--border-muted)]">
                    <form onSubmit={handleSave}>
                        <div className="p-8 bg-[var(--bg-color)] text-white flex justify-between items-center border-b border-[var(--border-muted)]">
                            <h3 className="font-black text-2xl tracking-tight uppercase italic">{showEditClientModal ? 'Editar Registro' : 'Novo Registro'}</h3>
                            <button type="button" onClick={() => showEditClientModal ? setShowEditClientModal(false) : setShowClientModal(false)} className="p-2 hover:bg-[var(--card-alt-color)]/80 rounded-none transition-colors border border-[var(--border-muted)] text-[var(--text-muted)]"><X size={24} /></button>
                        </div>
                        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b border-blue-600/10 pb-1">Dados Operacionais</h4>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Nome Fantasia</label>
                                    <input placeholder="..." value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 focus:bg-[var(--card-alt-color)]/80 transition-all uppercase font-black" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">DBA</label>
                                    <input placeholder="..." value={client.dba || ''} onChange={e => setClient({ ...client, dba: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Tipo de Estabelecimento</label>
                                    <select value={client.establishmentType || ''} onChange={e => setClient({ ...client, establishmentType: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black">
                                        <option value="" disabled className="bg-[var(--card-color)]">Selecione...</option>
                                        <option value="Restaurante" className="bg-[var(--card-color)]">Restaurante Tradicional</option>
                                        <option value="Pizzaria" className="bg-[var(--card-color)]">Pizzaria</option>
                                        <option value="Hamburgueria / Fast Food" className="bg-[var(--card-color)]">Hamburgueria / Fast Food</option>
                                        <option value="Padaria / Confeitaria" className="bg-[var(--card-color)]">Padaria / Confeitaria</option>
                                        <option value="Hotel / Pousada" className="bg-[var(--card-color)]">Hotel / Pousada</option>
                                        <option value="Cozinha Industrial" className="bg-[var(--card-color)]">Cozinha Industrial</option>
                                        <option value="Supermercado" className="bg-[var(--card-color)]">Supermercado</option>
                                        <option value="Outro" className="bg-[var(--card-color)]">Outro</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Endereço</label>
                                    <input placeholder="123 Main St" value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black" />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1 col-span-1">
                                        <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Cidade</label>
                                        <input placeholder="Miami" value={client.city || ''} onChange={e => setClient({ ...client, city: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black" />
                                    </div>
                                    <div className="space-y-1 col-span-1">
                                        <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Estado</label>
                                        <input placeholder="FL" value={client.state || ''} onChange={e => setClient({ ...client, state: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black" />
                                    </div>
                                    <div className="space-y-1 col-span-1">
                                        <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">ZIP Code</label>
                                        <input placeholder="33101" value={client.zip || ''} onChange={e => setClient({ ...client, zip: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Frequência</label>
                                    <select value={client.recurrence} onChange={e => setClient({ ...client, recurrence: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black">
                                        <option value={Recurrence.MONTHLY} className="bg-[var(--card-color)]">Mensal</option>
                                        <option value={Recurrence.QUARTERLY} className="bg-[var(--card-color)]">Trimestral</option>
                                        <option value={Recurrence.SEMI_ANNUAL} className="bg-[var(--card-color)]">Semestral</option>
                                        <option value={Recurrence.ANNUAL} className="bg-[var(--card-color)]">Anual</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest border-b border-blue-600/10 pb-1">Equipamentos & Faturamento</h4>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Responsável</label>
                                    <input placeholder="..." value={client.managerName} onChange={e => setClient({ ...client, managerName: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Telefone</label>
                                        <input placeholder="..." value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">E-mail</label>
                                        <input placeholder="..." value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] text-sm focus:ring-1 focus:ring-blue-600 font-black" />
                                    </div>
                                </div>
                                {user?.role === 'admin' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Valor do Contrato ($)</label>
                                        <input type="number" step="0.01" placeholder="0.00" value={client.cleaningPrice || ''} onChange={e => setClient({ ...client, cleaningPrice: parseFloat(e.target.value) || 0 })} className="w-full p-3 bg-[var(--card-alt-color)]/80 rounded-none border border-blue-600/20 text-blue-600 text-lg font-black focus:ring-1 focus:ring-blue-600" />
                                    </div>
                                )}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Hoods</label>
                                        <input type="number" value={client.hoodCount} onChange={e => setClient({ ...client, hoodCount: parseInt(e.target.value) })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] font-black" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Filtros</label>
                                        <input type="number" value={client.filterCount} onChange={e => setClient({ ...client, filterCount: parseInt(e.target.value) })} className="w-full p-3 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-[var(--text-primary)] font-black" />
                                    </div>
                                    <div className="flex flex-col justify-end pb-1">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={client.roofAccess} onChange={e => setClient({ ...client, roofAccess: e.target.checked })} className="w-5 h-5 bg-[var(--card-alt-color)] border-[var(--border-color)] text-blue-600 focus:ring-0 rounded-none" />
                                            <span className="text-[10px] font-black text-[var(--text-muted)] group-hover:text-white uppercase tracking-widest transition-all">Teto</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-[var(--card-alt-color)] border-t border-[var(--border-muted)] flex justify-between items-center gap-6">
                            {showEditClientModal && user?.role === 'admin' ? (
                                <button type="button" onClick={() => handleDeleteClient(client.id)} className="px-6 py-3 text-red-500 hover:bg-red-500/10 rounded-none font-black uppercase text-[10px] tracking-widest transition-all border border-transparent hover:border-red-500/20 italic">Deletar Cliente</button>
                            ) : <div></div>}
                            <div className="flex gap-4">
                                <button type="button" onClick={() => showEditClientModal ? setShowEditClientModal(false) : setShowClientModal(false)} className="px-6 py-3 text-[var(--text-muted)] font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Abortar</button>
                                <button type="submit" className="px-12 py-3 bg-blue-600 text-[var(--bg-color)] rounded-none text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all blue-glow">Finalizar e Salvar</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (showUserModal || showEditUserModal) {
        const targetUser = showEditUserModal ? editingUser : newUser;
        const setUser = showEditUserModal ? setEditingUser : setNewUser;
        const handleSave = showEditUserModal ? handleUpdateUser : handleCreateUser;

        return (
            <div className="fixed inset-0 bg-[#0A0A0B]/95 backdrop-blur-xl flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
                <div className="bg-[var(--card-color)] rounded-none w-full max-w-lg my-auto overflow-hidden shadow-2xl border border-[var(--border-muted)]">
                    <form onSubmit={handleSave}>
                        <div className="p-8 bg-[var(--bg-color)] text-white flex justify-between items-center border-b border-[var(--border-muted)]">
                            <h3 className="font-black text-2xl tracking-tight uppercase italic">{showEditUserModal ? 'Configurar Membro' : 'Novo Membro'}</h3>
                            <button type="button" onClick={() => showEditUserModal ? setShowEditUserModal(false) : setShowUserModal(false)} className="p-2 hover:bg-[var(--card-alt-color)]/80 rounded-none transition-colors border border-[var(--border-muted)] text-[var(--text-muted)]"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Nome Completo</label>
                                <input placeholder="..." value={targetUser.name} onChange={e => setUser({ ...targetUser, name: e.target.value })} className="w-full p-4 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-white focus:ring-1 focus:ring-blue-600 font-black uppercase text-sm" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">E-mail de Acesso</label>
                                <input placeholder="..." type="email" value={targetUser.email} onChange={e => setUser({ ...targetUser, email: e.target.value })} className="w-full p-4 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-white focus:ring-1 focus:ring-blue-600 font-black text-sm" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Senha Temporária</label>
                                <input placeholder={showEditUserModal ? "Manter atual..." : "Definir..."} type="password" value={targetUser.password || ''} onChange={e => setUser({ ...targetUser, password: e.target.value })} className="w-full p-4 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-white focus:ring-1 focus:ring-blue-600 font-black text-sm" required={!showEditUserModal} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Cargo</label>
                                    <select value={targetUser.role} onChange={e => setUser({ ...targetUser, role: e.target.value })} className="w-full p-4 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-white focus:ring-1 focus:ring-blue-600 font-black text-sm uppercase">
                                        <option value="technician" className="bg-[var(--card-color)]">Técnico</option>
                                        <option value="admin" className="bg-[var(--card-color)]">Administrador</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Nível de Expertise</label>
                                    <select value={targetUser.knowledgeLevel || 'Aprendiz'} onChange={e => setUser({ ...targetUser, knowledgeLevel: e.target.value })} className="w-full p-4 bg-[var(--card-alt-color)] rounded-none border border-[var(--border-muted)] text-white focus:ring-1 focus:ring-blue-600 font-black text-sm uppercase">
                                        <option value="Aprendiz" className="bg-[var(--card-color)]">Aprendiz</option>
                                        <option value="Pleno" className="bg-[var(--card-color)]">Pleno</option>
                                        <option value="Sênior" className="bg-[var(--card-color)]">Sênior</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-[var(--card-alt-color)] border-t border-[var(--border-muted)] flex justify-end gap-4">
                            <button type="button" onClick={() => showEditUserModal ? setShowEditUserModal(false) : setShowUserModal(false)} className="px-6 py-3 text-[var(--text-muted)] font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" className="px-10 py-3 bg-blue-600 text-[var(--bg-color)] rounded-none text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all blue-glow">Efetivar Acesso</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (showServiceModal) {
        const requiredItems = MANDATORY_PRE_CLEANING_CHECKLIST;
        const allRequiredChecked = requiredItems.every(item => preCleaningChecklistData[item.id] === true);
        const canStartService = allRequiredChecked;

        return (
            <div className="fixed inset-0 bg-[#0A0A0B]/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--card-color)] rounded-none w-full max-w-2xl overflow-hidden shadow-2xl border border-[var(--border-muted)]">
                    <form onSubmit={handleStartService}>
                        <div className="p-8 bg-[var(--bg-color)] text-white flex justify-between items-center border-b border-[var(--border-muted)]">
                            <h3 className="font-black text-2xl tracking-tight uppercase italic">Protocolo de Início</h3>
                            <button type="button" onClick={() => setShowServiceModal(false)} className="p-2 hover:bg-[var(--card-alt-color)]/80 rounded-none transition-colors border border-[var(--border-muted)] text-[var(--text-muted)]"><X size={24} /></button>
                        </div>
                        <div className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center gap-5 p-6 bg-amber-500/10 border border-amber-500/20">
                                <div className="p-4 bg-amber-500 text-[var(--bg-color)] rounded-none shadow-lg shadow-amber-500/20"><AlertTriangle size={24} /></div>
                                <div>
                                    <h4 className="font-black text-amber-500 uppercase tracking-widest text-xs">Atenção Prioritária</h4>
                                    <p className="text-[var(--text-muted)] text-xs mt-1 font-bold uppercase tracking-tight">Verifique todos os pontos críticos antes de prosseguir com a operação.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest border-b border-[var(--border-muted)] pb-1">Checklist de Segurança (Obrigatório)</h4>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {MANDATORY_PRE_CLEANING_CHECKLIST.map((item, idx) => (
                                        <label key={item.id} className={`flex items-start gap-4 p-4 rounded-none cursor-pointer transition-all border ${preCleaningChecklistData[item.id] ? 'bg-blue-600/10 border-blue-600/30' : 'bg-[var(--card-alt-color)] border-[var(--border-muted)] hover:border-[var(--border-color)]'}`}>
                                            <input
                                                type="checkbox"
                                                checked={preCleaningChecklistData[item.id] || false}
                                                onChange={e => setPreCleaningChecklistData({ ...preCleaningChecklistData, [item.id]: e.target.checked })}
                                                className="w-6 h-6 mt-0.5 rounded-none bg-black/40 border-[var(--border-color)] text-blue-600 focus:ring-0"
                                            />
                                            <div className="flex flex-col">
                                                <span className={`text-[11px] font-black uppercase tracking-tight leading-none ${preCleaningChecklistData[item.id] ? 'text-blue-600' : 'text-white'}`}>
                                                    {String(idx + 1).padStart(2, '0')}. {item.label}
                                                </span>
                                                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter mt-1 leading-tight">
                                                    {item.description}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {!allRequiredChecked && (
                                    <p className="text-[10px] text-amber-500 font-black uppercase animate-pulse">Confirmar os 13 pontos cruciais de segurança</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest border-b border-[var(--border-muted)] pb-1">Documentação Fotográfica Pre-Op</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {["Hood Geral", "Set de Filtros", "Exaustores", "Sistema Dutos"].map((label, i) => (
                                        <label key={i} className="aspect-square bg-[var(--card-alt-color)] rounded-none flex flex-col items-center justify-center border border-[var(--border-muted)] hover:border-blue-600/50 transition-all cursor-pointer group relative overflow-hidden">
                                            {inspectionPhotos && inspectionPhotos[i] ? (
                                                <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-500">
                                                    <img src={inspectionPhotos[i]} alt={label} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Camera className="text-white" size={24} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Camera className="text-white/10 group-hover:text-blue-600 transition-colors" size={24} />
                                                    <span className="text-[8px] text-[var(--text-faint)] group-hover:text-blue-600 mt-2 uppercase font-black tracking-widest text-center px-2">{label}</span>
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

                                                            const newPhotos = [...(inspectionPhotos || [])];
                                                            newPhotos[i] = publicUrl;
                                                            setInspectionPhotos(newPhotos);
                                                        } catch (err) {
                                                            console.error("Erro foto:", err);
                                                        }
                                                    }
                                                }}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-[var(--card-alt-color)] border-t border-[var(--border-muted)]">
                            <button
                                type="submit"
                                disabled={!canStartService}
                                className="w-full py-5 bg-blue-600 text-[var(--bg-color)] rounded-none font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed blue-glow flex items-center justify-center gap-3"
                            >
                                <span className="text-sm">Iniciar Operação e Cronômetro</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return null;
};

export default Modals;
