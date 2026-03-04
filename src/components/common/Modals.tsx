import React from 'react';
import { X, Camera, AlertTriangle } from 'lucide-react';
import { Client, User, Recurrence } from '../../types';
import { compressImage } from '../../utils/imageUtils';
import { PRE_CLEANING_CATEGORIES, MANDATORY_PRE_CLEANING_CHECKLIST } from '../../utils/preCleaningChecklist';

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
        preCleaningChecklistData, setPreCleaningChecklistData,
        settings = {}
    } = props;

    if (showClientDetails && selectedClient) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
                <div className="bg-white rounded-[2.5rem] w-full max-w-2xl my-auto overflow-hidden shadow-2xl">
                    <div className="p-8 bg-[#0A0A0B] text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-black">{selectedClient.name[0]}</div>
                            <div>
                                <h3 className="font-black text-2xl tracking-tight">{selectedClient.name}</h3>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{selectedClient.establishmentType || 'Restaurante'}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowClientDetails(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                    </div>
                    <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-black/20 mb-3 tracking-widest">Identificação</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm"><span className="text-black/40">DBA:</span> <span className="font-bold">{selectedClient.dba || 'N/A'}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-black/40">Legal Name:</span> <span className="font-bold">{selectedClient.legalName || 'N/A'}</span></div>
                                    {user?.role === 'admin' && (
                                        <div className="flex justify-between text-sm"><span className="text-black/40">Preço da Limpeza:</span> <span className="font-bold text-emerald-600">${selectedClient.cleaningPrice || 0}</span></div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-black/20 mb-3 tracking-widest">Localização</h4>
                                <div className="text-sm font-bold">{selectedClient.address}</div>
                                <div className="text-sm text-black/60">{selectedClient.city}, {selectedClient.state} {selectedClient.zip}</div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-black/20 mb-3 tracking-widest">Contato</h4>
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-sm">
                                    <div className="font-bold text-emerald-900">{selectedClient.managerName}</div>
                                    <a href={`tel:${selectedClient.phone}`} className="text-emerald-700 mt-1 block hover:underline hover:text-emerald-600 transition-colors">
                                        {selectedClient.phone}
                                    </a>
                                    <div className="text-emerald-700">{selectedClient.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-black/5 flex justify-end">
                        <button onClick={() => setShowClientDetails(false)} className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold">Fechar</button>
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
                <div className="bg-white rounded-[2.5rem] w-full max-w-4xl my-auto overflow-hidden shadow-2xl">
                    <form onSubmit={handleSave}>
                        <div className="p-5 md:p-8 bg-[#0A0A0B] text-white flex justify-between items-center">
                            <h3 className="font-black text-2xl tracking-tight">{showEditClientModal ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                            <button type="button" onClick={() => showEditClientModal ? setShowEditClientModal(false) : setShowClientModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-black/20 tracking-widest">Informações Básicas</h4>
                                <input placeholder="Nome do Restaurante" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input placeholder="DBA" value={client.dba || ''} onChange={e => setClient({ ...client, dba: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" />
                                    <input placeholder="Estado (Ex: FL, MA, CA)" value={client.state || ''} onChange={e => setClient({ ...client, state: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-black/40 mb-1">Categoria de Negócio</label>
                                    <select value={client.establishmentType || ''} onChange={e => setClient({ ...client, establishmentType: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required>
                                        <option value="" disabled>Selecione o Tipo de Estabelecimento</option>
                                        <option value="Restaurante">Restaurante Tradicional</option>
                                        <option value="Pizzaria">Pizzaria</option>
                                        <option value="Hamburgueria / Fast Food">Hamburgueria / Fast Food</option>
                                        <option value="Padaria / Confeitaria">Padaria / Confeitaria</option>
                                        <option value="Hotel / Pousada">Hotel / Pousada</option>
                                        <option value="Cozinha Industrial">Cozinha Industrial</option>
                                        <option value="Supermercado">Supermercado</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                <input placeholder="Endereço Completo" value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                <div className="grid grid-cols-3 gap-4">
                                    <input placeholder="Cidade" value={client.city || ''} onChange={e => setClient({ ...client, city: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                    <input placeholder="CEP / ZIP" value={client.zip || ''} onChange={e => setClient({ ...client, zip: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-black/40 mb-1">Recorrência</label>
                                        <select value={client.recurrence} onChange={e => setClient({ ...client, recurrence: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500">
                                            <option value={Recurrence.MONTHLY}>Mensal</option>
                                            <option value={Recurrence.QUARTERLY}>Trimestral</option>
                                            <option value={Recurrence.SEMI_ANNUAL}>Semestral</option>
                                            <option value={Recurrence.ANNUAL}>Anual</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-black/40 mb-1 block">Agendar Próxima Limpeza (Data Manual)</label>
                                    <input
                                        type="date"
                                        value={client.nextServiceDate ? client.nextServiceDate.split('T')[0] : ''}
                                        onChange={e => setClient({ ...client, nextServiceDate: e.target.value })}
                                        className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <p className="text-[10px] text-black/40 mt-1">Deixe em branco para usar a data calculada automaticamente pela recorrência.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-black/20 tracking-widest">Contato & Equipamento</h4>
                                <input placeholder="Gerente / Responsável" value={client.managerName} onChange={e => setClient({ ...client, managerName: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input placeholder="Telefone" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                    <input placeholder="E-mail" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                </div>
                                {user?.role === 'admin' && (
                                    <div>
                                        <label className="text-[10px] font-bold text-black/40 mb-1 block">Preço da Limpeza Geral ($) *</label>
                                        <input type="number" step="0.01" placeholder="Valor Cobrado" value={client.cleaningPrice || ''} onChange={e => setClient({ ...client, cleaningPrice: parseFloat(e.target.value) || 0 })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm focus:ring-2 focus:ring-emerald-500" required />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-black/40 mb-1 block">Hoods</label>
                                        <input type="number" value={client.hoodCount} onChange={e => setClient({ ...client, hoodCount: parseInt(e.target.value) })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-black/40 mb-1 block">Filtros</label>
                                        <input type="number" value={client.filterCount} onChange={e => setClient({ ...client, filterCount: parseInt(e.target.value) })} className="w-full p-3 bg-black/5 rounded-xl border-none text-sm" />
                                    </div>
                                    <div className="flex flex-col justify-end pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={client.roofAccess} onChange={e => setClient({ ...client, roofAccess: e.target.checked })} className="rounded text-emerald-500" />
                                            <span className="text-xs font-bold text-black/60">Acesso Teto</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-black/5 flex justify-between items-center gap-3">
                            {showEditClientModal && user?.role === 'admin' ? (
                                <button type="button" onClick={() => handleDeleteClient(client.id)} className="px-6 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors">Excluir</button>
                            ) : <div></div>}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => showEditClientModal ? setShowEditClientModal(false) : setShowClientModal(false)} className="px-6 py-3 text-black/40 font-bold text-sm">Cancelar</button>
                                <button type="submit" className="px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">Salvar Cliente</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (showUserModal || showEditUserModal) {
        const user = showEditUserModal ? editingUser : newUser;
        const setUser = showEditUserModal ? setEditingUser : setNewUser;
        const handleSave = showEditUserModal ? handleUpdateUser : handleCreateUser;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
                <div className="bg-white rounded-[2.5rem] w-full max-w-lg my-auto overflow-hidden shadow-2xl">
                    <form onSubmit={handleSave}>
                        <div className="p-8 bg-[#0A0A0B] text-white flex justify-between items-center">
                            <h3 className="font-black text-2xl tracking-tight">{showEditUserModal ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button type="button" onClick={() => showEditUserModal ? setShowEditUserModal(false) : setShowUserModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <input placeholder="Nome Completo" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500" required />
                            <input placeholder="E-mail" type="email" value={user.email} onChange={e => setUser({ ...user, email: e.target.value })} className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500" required />
                            <input placeholder={showEditUserModal ? "Nova Senha (deixe em branco para manter)" : "Senha"} type="password" value={user.password || ''} onChange={e => setUser({ ...user, password: e.target.value })} className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500" required={!showEditUserModal} />
                            <select value={user.role} onChange={e => setUser({ ...user, role: e.target.value })} className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500">
                                <option value="technician">Técnico</option>
                                <option value="admin">Administrador</option>
                            </select>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input placeholder="Telefone" value={user.phone || ''} onChange={e => setUser({ ...user, phone: e.target.value })} className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500" />
                                <select value={user.knowledgeLevel || 'Aprendiz'} onChange={e => setUser({ ...user, knowledgeLevel: e.target.value })} className="w-full p-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="Aprendiz">Aprendiz</option>
                                    <option value="Pleno">Pleno</option>
                                    <option value="Sênior">Sênior</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-8 bg-black/5 flex justify-end gap-3">
                            <button type="button" onClick={() => showEditUserModal ? setShowEditUserModal(false) : setShowUserModal(false)} className="px-6 py-3 text-black/40 font-bold text-sm">Cancelar</button>
                            <button type="submit" className="px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">Salvar Usuário</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (showServiceModal) {
        // Todos os itens do novo checklist fixo de 13 itens
        const requiredItems = MANDATORY_PRE_CLEANING_CHECKLIST;

        // Verificar se todos os itens obrigatórios foram marcados pelo técnico
        const allRequiredChecked = requiredItems.every(item => preCleaningChecklistData[item.id] === true);
        const canStartService = allRequiredChecked;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl">
                    <form onSubmit={handleStartService}>
                        <div className="p-8 bg-[#0A0A0B] text-white flex justify-between items-center">
                            <h3 className="font-black text-2xl tracking-tight">Iniciar Nova Limpeza</h3>
                            <button type="button" onClick={() => setShowServiceModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-4 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 mb-6">
                                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20"><AlertTriangle size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-emerald-900">Verificação Inicial</h4>
                                    <p className="text-emerald-700 text-xs">Certifique-se de que todos os equipamentos estão desligados antes de começar.</p>
                                </div>
                            </div>


                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-black/20 tracking-widest">Pre-Cleaning Verification Checklist (Obrigatório)</h4>
                                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3 max-h-[300px] overflow-y-auto">
                                    {MANDATORY_PRE_CLEANING_CHECKLIST.map((item, idx) => (
                                        <label key={item.id} className="flex items-start gap-3 p-3 bg-white/50 rounded-xl cursor-pointer hover:bg-white transition-colors border border-transparent hover:border-amber-100">
                                            <input
                                                type="checkbox"
                                                checked={preCleaningChecklistData[item.id] || false}
                                                onChange={e => setPreCleaningChecklistData({ ...preCleaningChecklistData, [item.id]: e.target.checked })}
                                                className="w-6 h-6 mt-0.5 rounded-lg text-amber-500 flex-shrink-0 border-2 border-amber-200 focus:ring-amber-500"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-amber-900 leading-snug">
                                                    {idx + 1}. {item.label}
                                                </span>
                                                <span className="text-[10px] text-amber-800/60 leading-tight mt-0.5">
                                                    {item.description}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {!allRequiredChecked && (
                                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">* Por favor, confirme todos os 13 itens de segurança para liberar o início.</p>
                                )}
                            </div>

                            {/* Fotos Iniciais (Obrigatório) */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-black/20 tracking-widest">Fotos Iniciais (Obrigatório)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {["Hood Total", "Filtros", "Fans", "Dutos"].map((label, i) => (
                                        <label key={i} className="aspect-square bg-black/5 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-black/10 hover:border-emerald-500 transition-colors cursor-pointer group relative overflow-hidden">
                                            {inspectionPhotos && inspectionPhotos[i] ? (
                                                <img src={inspectionPhotos[i]} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <Camera className="text-black/20 group-hover:text-emerald-500" size={24} />
                                                    <span className="text-[10px] text-black/40 mt-1 uppercase font-bold text-center px-1">{label}</span>
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
                                                            const newPhotos = [...(inspectionPhotos || [])];
                                                            newPhotos[i] = compressedBase64;
                                                            setInspectionPhotos(newPhotos);
                                                        } catch (err) {
                                                            console.error("Erro ao comprimir imagem:", err);
                                                            alert("Erro ao processar a foto. Tente novamente.");
                                                        }
                                                    }
                                                }}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-black/5 flex justify-end">
                            <button
                                type="submit"
                                disabled={!canStartService}
                                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Iniciar Serviço e Começar Cronômetro
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
