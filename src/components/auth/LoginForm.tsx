import React, { useState, useEffect } from 'react';
import { User, Lock, AlertTriangle, ArrowLeft, Shield, Wrench, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';


interface LoginFormProps {
    handleLogin: (e: React.FormEvent) => void;
    loginEmail: string;
    setLoginEmail: (email: string) => void;
    loginPassword: string;
    setLoginPassword: (password: string) => void;
    loginError: string;
    onBack?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
    handleLogin,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginError,
    onBack
}) => {
    const [selectedRole, setSelectedRole] = useState<'admin' | 'technician' | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerName, setRegisterName] = useState('');
    const [registerPhone, setRegisterPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState("/mcr-logo.png");
    const [invitationCompany, setInvitationCompany] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        // Check for invitation link
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCompanyId = urlParams.get('invite');
        const inviteRole = urlParams.get('role');

        if (inviteCompanyId && inviteRole === 'technician') {
            handleRoleSelection('technician');
            setIsRegistering(true);
            fetchInvitingCompany(inviteCompanyId);
        }
    }, []);

    const fetchInvitingCompany = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('id, name')
                .eq('id', id)
                .single();
            
            if (data && !error) {
                setInvitationCompany(data);
            }
        } catch (err) {
            console.error("Error fetching company from invite:", err);
        }
    };

    const handleRoleSelection = (role: 'admin' | 'technician') => {
        setSelectedRole(role);
        setLoginEmail(''); // clear email field
        setLoginPassword(''); // clear password field
        setLocalError('');
        setSuccessMessage('');
        setIsRegistering(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');

        if (loginPassword.length < 6) {
            setLocalError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (selectedRole === 'admin' && !companyName.trim()) {
            setLocalError('O nome da empresa é obrigatório para novos administradores');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: loginEmail,
                password: loginPassword,
                options: {
                    data: {
                        name: registerName,
                        role: selectedRole,
                        phone: registerPhone,
                        company_name: selectedRole === 'admin' ? companyName : undefined,
                        company_id: selectedRole === 'technician' ? invitationCompany?.id : undefined,
                        is_new_company: selectedRole === 'admin'
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                setSuccessMessage('Cadastro enviado! Aguarde a aprovação do administrador para acessar o sistema.');
                setIsRegistering(false);
                setLoginEmail('');
                setLoginPassword('');
                setRegisterName('');
                setRegisterPhone('');
            }
        } catch (error: any) {
            setLocalError(error.message || 'Erro ao realizar o cadastro. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocalLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;
            if (!data.user) throw new Error('Falha na autenticação: Usuário não retornado');

            await handleLogin(e);
        } catch (error: any) {
            console.error("Login Error:", error);
            let msg = error.message;
            if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos';
            if (msg === 'Email not confirmed') msg = 'E-mail ainda não confirmado.';
            setLocalError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const displayError = loginError || localError;

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl transition-all mx-4 relative z-10 backdrop-blur-3xl">
                <div className="p-8 pb-4 text-center relative border-b border-white/5">
                    {selectedRole && (
                        <button
                            onClick={() => {
                                setSelectedRole(null);
                                setIsRegistering(false);
                            }}
                            className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-white border border-white/5"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    
                    {!selectedRole && onBack && (
                        <button
                            onClick={onBack}
                            className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-500 transition-colors"
                        >
                            <ArrowLeft size={14} /> Voltar ao Site
                        </button>
                    )}

                    <div className="bg-white/5 p-4 rounded-2xl inline-block mb-4 border border-white/5">
                        <img
                            src={logoUrl}
                            alt="MCR Logo"
                            className="h-10 w-auto object-contain"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">MCR SYSTEM</h1>
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        {selectedRole === 'admin' ? 'Administrative Access' :
                            selectedRole === 'technician' ? 'Technician Portal' :
                                'Platform Gateway'}
                    </p>
                </div>

                {!selectedRole ? (
                    <div className="p-8 space-y-4">
                        <h2 className="text-center font-bold text-xs uppercase tracking-[0.2em] mb-8 text-slate-400">
                            Selecione seu perfil de acesso
                        </h2>

                        <button
                            onClick={() => handleRoleSelection('admin')}
                            className="w-full p-6 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-3xl transition-all group flex items-center gap-4 text-left"
                            type="button"
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <Shield size={22} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-white uppercase tracking-widest">Administrador</h3>
                                <p className="text-[10px] text-slate-500 font-bold tracking-tight uppercase">Gestão e Conformidade</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleRoleSelection('technician')}
                            className="w-full p-6 bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 rounded-3xl transition-all group flex items-center gap-4 text-left"
                            type="button"
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Zap size={22} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-white uppercase tracking-widest">Técnico</h3>
                                <p className="text-[10px] text-slate-500 font-bold tracking-tight uppercase">Operações de Campo</p>
                            </div>
                        </button>

                    </div>
                ) : (
                    <form onSubmit={isRegistering ? handleRegister : handleLocalLogin} className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {invitationCompany && (
                            <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-emerald-500/20">
                                <Zap size={16} />
                                <span>Convidado para: {invitationCompany.name}</span>
                            </div>
                        )}
                        {displayError && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-red-500/20">
                                <AlertTriangle className="shrink-0" size={16} />
                                <span>{displayError}</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-start gap-3 border border-emerald-500/20">
                                <Shield className="shrink-0 mt-0.5" size={16} />
                                <span>{successMessage}</span>
                            </div>
                        )}
                        <div className="space-y-5">
                            {isRegistering && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1">Nome Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-2xl border border-white/5 focus:border-emerald-500/50 focus:ring-0 text-white placeholder:text-slate-700 font-bold text-sm"
                                                placeholder="Seu nome"
                                                value={registerName}
                                                onChange={e => setRegisterName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {/* ... rest of inputs similarly styled ... */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1">Telefone</label>
                                        <div className="relative">
                                            <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                            <input
                                                type="tel"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-2xl border border-white/5 focus:border-emerald-500/50 focus:ring-0 text-white placeholder:text-slate-700 font-bold text-sm"
                                                placeholder="(00) 00000-0000"
                                                value={registerPhone}
                                                onChange={e => setRegisterPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1">E-mail Corporativo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-2xl border border-white/5 focus:border-emerald-500/50 focus:ring-0 text-white placeholder:text-slate-700 font-bold text-sm"
                                        placeholder="seu@email.com"
                                        value={loginEmail}
                                        onChange={e => setLoginEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1">Senha Segura</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-2xl border border-white/5 focus:border-emerald-500/50 focus:ring-0 text-white placeholder:text-slate-700 font-bold text-sm"
                                        placeholder="••••••••"
                                        value={loginPassword}
                                        onChange={e => setLoginPassword(e.target.value)}
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button type="submit" disabled={isLoading} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all active:scale-95 uppercase tracking-widest italic disabled:opacity-50">
                                {isLoading ? 'Verificando...' : isRegistering ? 'Solicitar Acesso' : 'Entrar no MCR'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setLocalError('');
                                    setSuccessMessage('');
                                }}
                                className="w-full py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                {isRegistering ? 'Já tenho conta corporativa' : (selectedRole === 'admin' ? 'Criar ambiente para nova empresa' : 'Primeiro acesso? Criar conta')}
                            </button>
                        </div>

                        <div className="flex justify-center items-center gap-4 pt-4 opacity-30 group hover:opacity-100 transition-opacity">
                            <div className="h-[1px] w-8 bg-slate-700"></div>
                            <a href="https://mcrsystem.online" target="_blank" rel="noopener noreferrer" className="text-[8px] font-black tracking-[0.4em] uppercase hover:text-emerald-500 transition-colors">mcrsystem.online</a>
                            <div className="h-[1px] w-8 bg-slate-700"></div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginForm;
