import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    isWarning?: boolean;
    color?: 'emerald' | 'blue' | 'purple' | 'red' | 'amber' | 'indigo' | 'cyan';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, isWarning, color = 'blue' }) => {
    const iconBgMap: Record<string, string> = {
        blue:    'bg-[#EEF4FF] text-[#1A56DB]',
        emerald: 'bg-[#EDFAF4] text-[#0A6B48]',
        red:     'bg-[#FEF1EF] text-[#C0392B]',
        amber:   'bg-[#FEF6E7] text-[#92570A]',
        purple:  'bg-purple-50 text-purple-600',
        indigo:  'bg-indigo-50 text-indigo-600',
        cyan:    'bg-cyan-50 text-cyan-600',
    };

    const trendBg = isWarning
        ? 'bg-[#FEF1EF] text-[#C0392B]'
        : 'bg-[#EDFAF4] text-[#0A6B48]';

    return (
        <div className="bg-white border border-black/[0.07] rounded-[12px] p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 ${iconBgMap[color] || iconBgMap.blue}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${trendBg}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="text-[26px] font-medium text-gray-900 tracking-tight leading-none">{value}</div>
            <div className="text-[11px] text-gray-500 mt-1">{title}</div>
        </div>
    );
};

export default StatCard;
