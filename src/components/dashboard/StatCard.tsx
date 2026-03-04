import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend: string;
    isWarning?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, isWarning }) => {
    return (
        <div className={`p-6 rounded-[2.5rem] bg-white border ${isWarning ? 'border-amber-200 shadow-amber-100' : 'border-black/5'} shadow-sm`}>
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
                    {icon}
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${isWarning ? 'bg-amber-100 text-amber-600' : 'bg-black/5 text-black/40'}`}>
                    {trend}
                </span>
            </div>
            <div className="text-3xl font-black tracking-tight mb-1">{value}</div>
            <div className="text-xs font-bold text-black/30 uppercase tracking-wider">{title}</div>
        </div>
    );
};

export default StatCard;
