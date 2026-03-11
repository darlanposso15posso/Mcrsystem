import React, { useState } from 'react';
import { Plus, Edit, X, CheckCircle, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TeamManagementProps {
    users: any[];
    setShowUserModal: (show: boolean) => void;
    setEditingUser: (user: any) => void;
    setShowEditUserModal: (show: boolean) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    confirmAction: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
    users,
    setShowUserModal,
    setEditingUser,
    setShowEditUserModal,
    showToast,
    confirmAction
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleApprove = async (id: string | number) => {
        confirmAction("Tem certeza que deseja aprovar este técnico para acessar o aplicativo?", async () => {
            setIsLoading(true);
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ status: 'active' })
                    .eq('id', id);

                if (!error) {
                    showToast("Técnico aprovado com sucesso!");
                    window.location.reload();
                } else {
                    showToast("Falha ao aprovar: " + error.message, 'error');
                }
            } catch (error) {
                console.error(error);
                showToast("Erro na comunicação com o servidor.", 'error');
            } finally {
                setIsLoading(false);
            }
        });
    };

    const handleDelete = async (id: string | number, name: string) => {
        confirmAction(`Tem certeza que deseja REVOGAR O ACESSO e EXCLUIR o técnico ${name}?`, async () => {
            setIsLoading(true);
            try {
                const { error } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', id);

                if (!error) {
                    showToast("Técnico removido com sucesso!");
                    window.location.reload();
                } else {
                    showToast("Falha ao remover o técnico: " + error.message, 'error');
                }
            } catch (error) {
                console.error(error);
                showToast("Erro na comunicação com o servidor.", 'error');
            } finally {
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[var(--bg-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl relative overflow-hidden emerald-glow">
                <div className="relative z-10 text-white">
                    <h2 className="text-3xl font-black mb-2 text-white uppercase italic tracking-tighter">Membros & Operações</h2>
                    <p className="text-[var(--text-muted)] max-w-xl text-sm font-bold uppercase tracking-widest leading-relaxed">
                        Controle total sobre a força de trabalho. Gerencie acessos, aprove novos ingressos e monitore o desempenho da equipe.
                    </p>
                </div>
                <Users size={120} className="absolute right-0 top-0 opacity-5 -translate-y-4 translate-x-4 text-emerald-500" />
            </div>

            {/* Legacy Fallback Table for historical DB profiles */}
            <div className="flex justify-between items-center mt-6 mb-4">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Perfis de Acesso Master</h3>
                <button
                    onClick={() => setShowUserModal(true)}
                    className="bg-emerald-500 text-[var(--bg-color)] px-6 py-2 rounded-none font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs emerald-glow hover:bg-emerald-400 transition-all"
                >
                    <Plus size={18} /> Novo Acesso Manual
                </button>
            </div>

            <div className="bg-[var(--card-color)] rounded-none border border-[var(--border-muted)] shadow-sm overflow-hidden emerald-glow-hover transition-all">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[var(--card-alt-color)] text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest">
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
