import React from 'react';
import { BookOpen, Server, Database, Mail, Terminal, Globe } from 'lucide-react';

const ConfigGuide: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    Documentação Oficial
                </div>
                <h2 className="text-4xl font-black tracking-tight">Guia de Configuração</h2>
                <p className="text-black/40 text-lg max-w-2xl mx-auto">
                    Referência técnica completa para manutenção e expansão do sistema Hood Cleaning Management.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                            <Server size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Arquitetura Backend</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Terminal size={16} className="mt-1 text-black/20" />
                                <div className="text-sm">
                                    <span className="font-bold">Node.js + Express</span>
                                    <p className="text-black/40 text-xs">Runtime e framework de servidor para a API REST.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Database size={16} className="mt-1 text-black/20" />
                                <div className="text-sm">
                                    <span className="font-bold">SQLite (better-sqlite3)</span>
                                    <p className="text-black/40 text-xs">Banco de dados relacional leve e de alto desempenho.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6">
                            <Mail size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Serviço de E-mail</h3>
                        <p className="text-sm text-black/60 leading-relaxed mb-6">
                            Utilizamos <strong>Nodemailer</strong> com suporte a SMTP para envio de notificações automatizadas.
                        </p>
                        <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/5 font-mono text-[10px] text-black/60 space-y-1">
                            <div>SMTP_HOST=smtp.gmail.com</div>
                            <div>SMTP_PORT=587</div>
                            <div>SMTP_USER=user@domain.com</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
                            <Globe size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Tecnologias Frontend</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                <span>React 18 + Vite</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                <span>Tailwind CSS (Styling)</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                <span>Lucide Icons</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                <span>Recharts (Data Viz)</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <BookOpen size={24} />
                            <h3 className="text-xl font-bold">Conformidade NFPA 96</h3>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">
                            O sistema foi desenhado para seguir rigorosamente os padrões de reporte exigidos pela National Fire Protection Association.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigGuide;
