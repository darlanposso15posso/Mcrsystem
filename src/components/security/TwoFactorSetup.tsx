import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldOff, KeyRound, QrCode, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type Step = 'idle' | 'qr' | 'verify' | 'done';

export default function TwoFactorSetup({ showToast }: Props) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [qrUri, setQrUri] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // Check current MFA status
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const totp = data?.totp?.find(f => f.status === 'verified');
        if (totp) {
          setIsEnrolled(true);
          setFactorId(totp.id);
        }
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  const handleStartEnroll = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'MCR System' });
      if (error) throw error;
      setQrUri(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      // Start challenge immediately
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (chErr) throw chErr;
      setChallengeId(ch.id);
      setStep('qr');
    } catch (e: any) {
      setError(e.message || 'Erro ao iniciar configuração de 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
      if (error) throw error;
      setIsEnrolled(true);
      setStep('done');
      showToast('2FA ativado com sucesso!', 'success');
    } catch (e: any) {
      setError('Código inválido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!factorId) return;
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setIsEnrolled(false);
      setFactorId('');
      setStep('idle');
      showToast('2FA desativado.', 'info');
    } catch (e: any) {
      setError(e.message || 'Erro ao desativar 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="bg-[var(--card-color)] p-8 rounded-none border border-[var(--border-muted)] shadow-2xl">
      <div className="flex items-center gap-4 mb-6 border-b border-[var(--border-muted)] pb-4">
        <div className={`w-12 h-12 rounded-none flex items-center justify-center border ${isEnrolled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
          {isEnrolled ? <ShieldCheck size={24} /> : <KeyRound size={24} />}
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Autenticação em 2 Fatores</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: isEnrolled ? '#22c55e' : '#64748b' }}>
            {isEnrolled ? '● Ativo' : '○ Inativo'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-none text-red-400 text-[10px] font-black uppercase tracking-widest">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Idle: not enrolled ─────────────────────────────────────── */}
      {!isEnrolled && step === 'idle' && (
        <div className="space-y-4">
          <p className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-widest leading-relaxed">
            Proteja sua conta com um segundo fator de autenticação via app (Google Authenticator, Authy).
            Após ativado, todo login exigirá um código de 6 dígitos.
          </p>
          <button
            onClick={handleStartEnroll}
            disabled={isLoading}
            className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-4 rounded-none font-black uppercase italic tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-xs"
          >
            <ShieldCheck size={16} />
            {isLoading ? 'Configurando...' : 'Ativar 2FA'}
          </button>
        </div>
      )}

      {/* ── QR code step ───────────────────────────────────────────── */}
      {step === 'qr' && (
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 leading-relaxed">
              <span className="text-white">1.</span> Abra o Google Authenticator ou Authy<br />
              <span className="text-white">2.</span> Escaneie o QR code abaixo<br />
              <span className="text-white">3.</span> Digite o código de 6 dígitos gerado
            </p>
            <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-none">
              {qrUri ? (
                <img src={qrUri} alt="QR Code 2FA" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-100">
                  <QrCode size={64} className="text-slate-400" />
                </div>
              )}
              <p className="text-slate-900 text-[9px] font-black uppercase tracking-widest text-center">
                Ou insira manualmente:<br />
                <span className="text-slate-600 font-mono text-[10px] break-all">{secret}</span>
              </p>
            </div>
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">Código de Verificação</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-4 bg-[var(--bg-color)] border border-[var(--border-muted)] text-white font-black text-2xl text-center tracking-[0.5em] rounded-none focus:border-emerald-500/50 outline-none placeholder:text-slate-700"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep('idle'); setCode(''); setError(''); }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-none font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || code.length < 6}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-none font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Confirmar e Ativar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Done / enrolled ────────────────────────────────────────── */}
      {(isEnrolled || step === 'done') && step !== 'qr' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-none text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>2FA ativo — todos os logins exigem verificação por app autenticador.</span>
          </div>
          <button
            onClick={handleDisable}
            disabled={isLoading}
            className="flex items-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-6 py-4 rounded-none font-black uppercase italic tracking-widest transition-all disabled:opacity-50 text-xs"
          >
            <ShieldOff size={16} />
            {isLoading ? 'Desativando...' : 'Desativar 2FA'}
          </button>
        </div>
      )}
    </div>
  );
}
