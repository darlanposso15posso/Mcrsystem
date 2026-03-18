import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertTriangle, ArrowLeft, Eye, EyeOff, KeyRound, User, Phone, Building2, CheckCircle2 } from 'lucide-react';
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

function getStrength(pwd: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = [
        { label: '', color: '#1e293b' },
        { label: 'Weak', color: '#ef4444' },
        { label: 'Fair', color: '#f97316' },
        { label: 'Good', color: '#eab308' },
        { label: 'Strong', color: '#22c55e' },
    ];
    return { score, ...map[score] };
}

type View = 'login' | 'register' | 'forgot' | 'mfa';

const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-[100dvh] bg-[#020617] flex flex-col items-center justify-start sm:justify-center px-4 pt-10 pb-8 relative overflow-y-auto">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="w-full max-w-sm relative z-10">
            {children}
        </div>
    </div>
);

const Logo = () => (
    <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-3">
            <img src="/mcr-logo.png" alt="MCR" className="h-7 w-auto object-contain" />
        </div>
        <h1 className="text-lg font-black text-white tracking-tighter uppercase italic">MCR SYSTEM</h1>
    </div>
);

const ErrorBox = ({ message }: { message: string }) => message ? (
    <div className="flex items-center gap-3 p-3.5 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
        <AlertTriangle size={14} className="shrink-0" />
        <span>{message}</span>
    </div>
) : null;

const SuccessBox = ({ message }: { message: string }) => message ? (
    <div className="flex items-center gap-3 p-3.5 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
        <CheckCircle2 size={14} className="shrink-0" />
        <span>{message}</span>
    </div>
) : null;

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const LoginForm: React.FC<LoginFormProps> = ({
    handleLogin,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginError,
    onBack,
}) => {
    const [view, setView] = useState<View>('login');
    const [invitationCompany, setInvitationCompany] = useState<{ id: string; name: string } | null>(null);
    const [isInvitedTechnician, setIsInvitedTechnician] = useState(false);

    const [registerName, setRegisterName] = useState('');
    const [registerPhone, setRegisterPhone] = useState('');
    const [companyName, setCompanyName] = useState('');

    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSent, setForgotSent] = useState(false);

    const [mfaFactorId, setMfaFactorId] = useState('');
    const [mfaChallengeId, setMfaChallengeId] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [pendingEvent, setPendingEvent] = useState<React.FormEvent | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const strength = getStrength(loginPassword);
    const displayError = loginError || localError;

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCompanyId = urlParams.get('invite');
        const inviteRole = urlParams.get('role');
        if (inviteCompanyId && inviteRole === 'technician') {
            setIsInvitedTechnician(true);
            setView('register');
            fetchInvitingCompany(inviteCompanyId);
        }
    }, []);

    const fetchInvitingCompany = async (id: string) => {
        try {
            const { data } = await supabase.from('companies').select('id, name').eq('id', id).single();
            if (data) setInvitationCompany(data);
        } catch { }
    };

    const clearErrors = () => { setLocalError(''); };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        clearErrors();
        try {
            // Flag persists across the OAuth redirect so App.tsx knows to wait for SIGNED_IN
            sessionStorage.setItem('oauth_pending', '1');
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
            });
        } catch (e: any) {
            sessionStorage.removeItem('oauth_pending');
            setLocalError(e.message || 'Failed to connect with Google.');
            setIsLoading(false);
        }
    };

    const handleLocalLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            });
            if (error) throw error;
            if (!data.user) throw new Error('Authentication failed');

            const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (assurance?.nextLevel === 'aal2' && assurance.nextLevel !== assurance.currentLevel) {
                const { data: factors } = await supabase.auth.mfa.listFactors();
                const totp = factors?.totp?.[0];
                if (totp) {
                    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: totp.id });
                    setMfaFactorId(totp.id);
                    setMfaChallengeId(challenge?.id ?? '');
                    setPendingEvent(e);
                    setView('mfa');
                    setIsLoading(false);
                    return;
                }
            }
            await handleLogin(e);
        } catch (error: any) {
            let msg = error.message;
            if (msg === 'Invalid login credentials') msg = 'Incorrect email or password';
            if (msg === 'Email not confirmed') msg = 'Please confirm your email before signing in.';
            setLocalError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyTotp = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.mfa.verify({
                factorId: mfaFactorId,
                challengeId: mfaChallengeId,
                code: totpCode,
            });
            if (error) throw error;
            if (pendingEvent) await handleLogin(pendingEvent);
        } catch {
            setLocalError('Invalid code. Check your authenticator app.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setSuccessMessage('');

        if (loginPassword.length < 8) { setLocalError('Minimum 8 characters required'); return; }
        if (strength.score < 3) { setLocalError('Use a stronger password: uppercase, number and symbol'); return; }
        if (!isInvitedTechnician && !companyName.trim()) { setLocalError('Company name is required'); return; }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: loginEmail,
                password: loginPassword,
                options: {
                    data: {
                        name: registerName,
                        role: isInvitedTechnician ? 'technician' : 'admin',
                        phone: registerPhone,
                        company_name: !isInvitedTechnician ? companyName : undefined,
                        company_id: isInvitedTechnician ? invitationCompany?.id : undefined,
                        is_new_company: !isInvitedTechnician,
                    },
                },
            });
            if (error) throw error;
            if (data.user) {
                setSuccessMessage(
                    isInvitedTechnician
                        ? 'Account submitted! Waiting for admin approval.'
                        : 'Account created! Check your email to confirm your registration.'
                );
                setView('login');
                setLoginEmail('');
                setLoginPassword('');
                setRegisterName('');
                setRegisterPhone('');
                setCompanyName('');
            }
        } catch (error: any) {
            setLocalError(error.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setForgotSent(true);
        } catch (error: any) {
            setLocalError(error.message || 'Failed to send reset email.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full pl-11 pr-4 py-3.5 bg-white/5 rounded-xl border border-white/10 focus:border-emerald-500/50 outline-none text-white placeholder:text-slate-600 text-sm font-medium transition-colors";

    // ── MFA view ─────────────────────────────────────────────────────────────
    if (view === 'mfa') {
        return (
            <Card>
                <Logo />
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <button
                        onClick={() => { setView('login'); setTotpCode(''); clearErrors(); }}
                        className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Two-Factor Authentication</p>
                    <p className="text-white font-black text-lg mb-6">Enter your app code</p>
                    <form onSubmit={handleVerifyTotp} className="space-y-4">
                        <ErrorBox message={displayError} />
                        <div className="relative">
                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                required
                                autoFocus
                                className={`${inputClass} text-center text-2xl tracking-[0.5em] font-black`}
                                placeholder="000000"
                                value={totpCode}
                                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || totpCode.length < 6}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : 'Confirm Code'}
                        </button>
                    </form>
                </div>
            </Card>
        );
    }

    // ── Forgot password view ─────────────────────────────────────────────────
    if (view === 'forgot') {
        return (
            <Card>
                <Logo />
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    {forgotSent ? (
                        <div className="text-center space-y-4 py-2">
                            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                                <Mail size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-white font-black text-base mb-1">Email sent!</p>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Check <span className="text-emerald-400">{forgotEmail}</span> and follow the instructions to reset your password.
                                </p>
                            </div>
                            <button
                                onClick={() => { setView('login'); setForgotSent(false); setForgotEmail(''); clearErrors(); }}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => { setView('login'); clearErrors(); }}
                                className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
                            >
                                <ArrowLeft size={14} /> Back
                            </button>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Password Recovery</p>
                            <p className="text-white font-black text-lg mb-6">Reset my password</p>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <ErrorBox message={displayError} />
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Email address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                        <input
                                            type="email"
                                            required
                                            autoFocus
                                            className={inputClass}
                                            placeholder="you@email.com"
                                            value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </Card>
        );
    }

    // ── Register view ────────────────────────────────────────────────────────
    if (view === 'register') {
        return (
            <Card>
                <Logo />
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    {!isInvitedTechnician && (
                        <button
                            onClick={() => { setView('login'); clearErrors(); }}
                            className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    )}

                    {invitationCompany && (
                        <div className="flex items-center gap-3 p-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold">
                            <Building2 size={14} className="shrink-0" />
                            <span>Invited by: <span className="text-white">{invitationCompany.name}</span></span>
                        </div>
                    )}

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                        {isInvitedTechnician ? 'Technician Registration' : 'Create account'}
                    </p>
                    <p className="text-white font-black text-lg mb-5">
                        {isInvitedTechnician ? 'Complete your profile' : 'Get started for free'}
                    </p>

                    <form onSubmit={handleRegister} className="space-y-3">
                        <ErrorBox message={displayError} />
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Full name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input type="text" required className={inputClass} placeholder="Your name" value={registerName} onChange={e => setRegisterName(e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input type="email" required className={inputClass} placeholder="you@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Phone number</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input type="tel" required className={inputClass} placeholder="(000) 000-0000" value={registerPhone} onChange={e => setRegisterPhone(e.target.value)} />
                            </div>
                        </div>

                        {!isInvitedTechnician && (
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Company name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                    <input type="text" required className={inputClass} placeholder="Your company" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    className={`${inputClass} pr-11`}
                                    placeholder="Minimum 8 characters"
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {loginPassword.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ backgroundColor: i <= strength.score ? strength.color : '#1e293b' }} />
                                        ))}
                                    </div>
                                    <div className="flex justify-between">
                                        <div className="flex gap-2.5 text-[9px] font-black uppercase tracking-widest">
                                            <span style={{ color: loginPassword.length >= 8 ? '#22c55e' : '#475569' }}>8+</span>
                                            <span style={{ color: /[A-Z]/.test(loginPassword) ? '#22c55e' : '#475569' }}>A-Z</span>
                                            <span style={{ color: /[0-9]/.test(loginPassword) ? '#22c55e' : '#475569' }}>0-9</span>
                                            <span style={{ color: /[^A-Za-z0-9]/.test(loginPassword) ? '#22c55e' : '#475569' }}>!@#</span>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: strength.color }}>{strength.label}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Creating account...' : isInvitedTechnician ? 'Create Technician Account' : 'Create Free Account'}
                        </button>
                    </form>

                    {!isInvitedTechnician && (
                        <p className="text-center text-xs text-slate-600 mt-5">
                            Already have an account?{' '}
                            <button onClick={() => { setView('login'); clearErrors(); }} className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors">
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </Card>
        );
    }

    // ── Login view (default) ──────────────────────────────────────────────────
    return (
        <Card>
            {onBack && (
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-white text-xs font-bold uppercase tracking-widest mb-4 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Site
                </button>
            )}

            <Logo />

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
                <ErrorBox message={displayError} />
                <SuccessBox message={successMessage} />

                {/* Google OAuth */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-slate-100 rounded-xl text-slate-900 font-bold text-sm transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
                >
                    <GoogleIcon />
                    Sign in with Google
                </button>

                {/* OR divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                <form onSubmit={handleLocalLogin} className="space-y-3">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                className={inputClass}
                                placeholder="you@email.com"
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha</label>
                            <button
                                type="button"
                                onClick={() => { setView('forgot'); setForgotEmail(loginEmail); clearErrors(); }}
                                className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                                Esqueci a senha
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                className={`${inputClass} pr-11`}
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors p-1">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="pt-2 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-600">
                        Não tem conta?{' '}
                        <button
                            onClick={() => { setView('register'); clearErrors(); setSuccessMessage(''); }}
                            className="text-emerald-500 font-bold hover:text-emerald-400 transition-colors"
                        >
                            Criar conta grátis
                        </button>
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default LoginForm;
