import React, { useState, useEffect } from 'react';
import { User, Lock, AlertTriangle, ArrowLeft, Shield, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';


interface LoginFormProps {
    handleLogin: (e: React.FormEvent) => void;
    loginEmail: string;
    setLoginEmail: (email: string) => void;
    loginPassword: string;
    setLoginPassword: (password: string) => void;
    loginError: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
    handleLogin,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginError
}) => {
    const [selectedRole, setSelectedRole] = useState<'admin' | 'technician' | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerName, setRegisterName] = useState('');
    const [registerPhone, setRegisterPhone] = useState('');
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState("https://drive.google.com/uc?export=download&id=18_iHEeJb9kpZV-MOYDKrwSlT6jIKRjvl");

    useEffect(() => {
        // Fetch logo from Supabase instead of local API
        supabase.from('settings').select('value').eq('key', 'logo_image').maybeSingle()
            .then(({ data }) => {
                if (data && data.value) setLogoUrl(data.value);
            })
            .catch(err => console.error("Could not load logo", err));
    }, []);

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

        setIsLoading(true);
        try {
            // Register via Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: loginEmail,
                password: loginPassword,
                options: {
                    data: {
                        name: registerName,
                        role: 'technician',
                        phone: registerPhone
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // The trigger in Supabase should handle creating the profile
                // but we can show the success message
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

        if (selectedRole === 'technician' && loginEmail.toLowerCase() === 'dehoodcleaning@gmail.com') {
            setLocalError('Este e-mail é restrito ao botão Administrativo.');
            return;
        }

        setIsLoading(true);

        try {
            // Direct Supabase Login
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });

            if (error) throw error;

            if (!data.user) throw new Error('Falha na autenticação: Usuário não retornado');

            // Login handled in App.tsx via onAuthStateChange or manual call
            await handleLogin(e);
        } catch (error: any) {
            console.error("Login Error:", error);
            let msg = error.message;
            if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos';
            if (msg === 'Email not confirmed') msg = 'E-mail ainda não confirmado. Verifique sua caixa de entrada ou o painel do Supabase.';
            setLocalError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const displayError = loginError || localError;

    return (
        <div className="min-h-screen bg-[#151619] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all mx-4">
                <div className="p-6 md:p-8 bg-emerald-500 text-white text-center relative">
                    {selectedRole && (
                        <button
                            onClick={() => {
                                setSelectedRole(null);
                                setIsRegistering(false);
                            }}
                            className="absolute top-6 left-6 p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="bg-white/10 p-4 rounded-2xl inline-block mb-4">
                        <img
                            src={logoUrl}
                            alt="Logo da Empresa"
                            className="h-16 w-auto object-contain"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <h1 className="text-2xl font-bold">D&E Hood Cleaning</h1>
                    <p className="text-white/80 text-sm">
                        {selectedRole === 'admin' ? 'Acesso Administrativo' :
                            selectedRole === 'technician' ? 'Acesso do Técnico' :
                                'Sistema de Gestão Profissional'}
                    </p>
                </div>

                {!selectedRole ? (
                    <div className="p-6 md:p-8 space-y-4">
                        <h2 className="text-center font-bold text-lg mb-6 tracking-tight text-black/80">
                            Selecione seu perfil de acesso
                        </h2>

                        <button
                            onClick={() => handleRoleSelection('admin')}
                            className="w-full p-6 bg-black/5 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-500 rounded-2xl transition-all group flex items-center gap-4 text-left"
                            type="button"
                        >
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Administrador</h3>
                                <p className="text-xs text-black/40">Gestão completa do sistema</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleRoleSelection('technician')}
                            className="w-full p-6 bg-black/5 hover:bg-blue-50 border-2 border-transparent hover:border-blue-500 rounded-2xl transition-all group flex items-center gap-4 text-left"
                            type="button"
                        >
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Wrench size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Técnico</h3>
                                <p className="text-xs text-black/40">Acesso a serviços e limpezas</p>
                            </div>
                        </button>

                    </div>
                ) : (
                    <form onSubmit={isRegistering ? handleRegister : handleLocalLogin} className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {displayError && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                                <AlertTriangle className="shrink-0" size={18} />
                                <span>{displayError}</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-medium flex items-start gap-2">
                                <Shield className="shrink-0 mt-0.5" size={18} />
                                <span>{successMessage}</span>
                            </div>
                        )}
                        <div className="space-y-4">
                            {isRegistering && (
                                <>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-black/40 mb-1 block">Nome Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                                            <input
                                                type="text"
                                                required
                                                className="w-full pl-10 pr-4 py-3 bg-black/5 rounded-xl border-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Seu nome"
                                                value={registerName}
                                                onChange={e => setRegisterName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-black/40 mb-1 block">Telefone</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                                            <input
                                                type="tel"
                                                required
                                                className="w-full pl-10 pr-4 py-3 bg-black/5 rounded-xl border-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="(00) 00000-0000"
                                                value={registerPhone}
                                                onChange={e => setRegisterPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="text-xs font-bold uppercase text-black/40 mb-1 block">E-mail</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-black/5 rounded-xl border-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="seu@email.com"
                                        value={loginEmail}
                                        onChange={e => setLoginEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-black/40 mb-1 block">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-black/5 rounded-xl border-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="••••••••"
                                        value={loginPassword}
                                        onChange={e => setLoginPassword(e.target.value)}
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-70">
                            {isLoading ? 'Aguarde...' : isRegistering ? 'Solicitar Cadastro' : 'Entrar'}
                        </button>

                        {selectedRole === 'technician' && !isRegistering && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(true);
                                    setLocalError('');
                                    setSuccessMessage('');
                                }}
                                className="w-full py-4 bg-black/5 text-gray-700 rounded-2xl font-bold hover:bg-black/10 transition-all"
                            >
                                Meu 1º Acesso (Criar Conta)
                            </button>
                        )}
                        {selectedRole === 'technician' && isRegistering && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegistering(false);
                                    setLocalError('');
                                    setSuccessMessage('');
                                }}
                                className="w-full py-4 bg-black/5 text-gray-700 rounded-2xl font-bold hover:bg-black/10 transition-all"
                            >
                                Já tenho conta (Fazer Login)
                            </button>
                        )}



                        <p className="text-center text-xs text-black/40 mt-4">
                            Ambiente seguro D&E Hood Cleaning.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginForm;
