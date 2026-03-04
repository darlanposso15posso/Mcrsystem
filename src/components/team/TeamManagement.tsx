import React, { useState } from 'react';
import { Plus, Edit, X, CheckCircle } from 'lucide-react';

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

    const handleApprove = async (id: number) => {
        if (!confirm("Tem certeza que deseja aprovar este técnico para acessar o aplicativo?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users/${id}/approve`, { method: 'PUT', credentials: 'include' });
            if (res.ok) {
                alert("Técnico aprovado com sucesso!");
                window.location.reload();
            } else {
                alert("Falha ao aprovar.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro na comunicação com o servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Tem certeza que deseja REVOGAR O ACESSO e EXCLUIR o técnico ${name}?`)) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
            if (res.ok) {
                alert("Técnico removido com sucesso!");
                window.location.reload();
            } else {
                alert("Falha ao remover o técnico.");
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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gestão de Equipe</h2>
                <button
                    onClick={() => setShowUserModal(true)}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={18} /> Novo Técnico
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/5 text-black/40 text-xs uppercase font-bold tracking-wider">
                            <th className="px-6 py-4">Técnico</th>
                            <th className="px-6 py-4">Nível</th>
                            <th className="px-6 py-4">Contato</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Cargo</th>
                            <th className="px-6 py-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
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
