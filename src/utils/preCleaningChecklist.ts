export interface PreCleaningCategory {
    id: string;
    title: string;
    icon?: string;
    items: { id: string; label: string; description?: string }[];
}

// 1. O CHECKLIST FIXO E OBRIGATÓRIO (13 ITENS)
export const MANDATORY_PRE_CLEANING_CHECKLIST = [
    { id: "v_kitchen_off", label: "Cozinha fora de operação", description: "Nenhuma preparação de alimentos acontecendo durante o serviço." },
    { id: "v_electrical_off", label: "Sistema elétrico do exaustor desligado", description: "Energia desligada para evitar acionamento acidental." },
    { id: "v_gas_off", label: "Sistema de gás desligado (quando aplicável)", description: "Evita risco de ignição durante o processo." },
    { id: "v_fire_supp_prot", label: "Sistema de supressão de incêndio protegido", description: "Bicos e sensores cobertos para evitar acionamento." },
    { id: "v_work_area_safe", label: "Área de trabalho isolada e segura", description: "Sem circulação de funcionários ou clientes." },
    { id: "v_equip_covered", label: "Equipamentos da cozinha protegidos com plástico", description: "Fogões, chapas e equipamentos cobertos." },
    { id: "v_drainage_ready", label: "Sistema de drenagem preparado para gordura", description: "Evita acúmulo ou vazamento no piso." },
    { id: "v_filters_removed", label: "Filtros da coifa removidos para limpeza", description: "Permite acesso ao interior da coifa." },
    { id: "v_plenum_inspected", label: "Inspeção visual do plenum realizada", description: "Verificação do nível de acúmulo de gordura." },
    { id: "v_duct_verified", label: "Ducto verificado e acesso disponível", description: "Painéis de acesso localizados e utilizáveis." },
    { id: "v_roof_fan_inspected", label: "Exaustor no telhado inspecionado", description: "Verificação da base, tampa e possíveis vazamentos." },
    { id: "v_roof_access_safe", label: "Acesso ao telhado seguro", description: "Escada posicionada corretamente e área segura." },
    { id: "v_ppe_used", label: "EPIs utilizados pelo técnico", description: "Luvas, óculos, botas e proteção adequada." }
];

export const PRE_CLEANING_CATEGORIES: PreCleaningCategory[] = [
    {
        id: "verification",
        title: "✅ PRE-CLEANING VERIFICATION (Obrigatório)",
        items: MANDATORY_PRE_CLEANING_CHECKLIST
    },
    {
        id: "hood_condition",
        title: "Condição da Estrutura dos Coifas (Hoods)",
        items: [
            { id: "opt_hood_grease", label: "Acúmulo excessivo de gordura identificado" },
            { id: "opt_hood_corrosion", label: "Superfície interna com corrosão" },
            { id: "opt_hood_welds", label: "Soldas ou junções danificadas" },
            { id: "opt_hood_deep_clean", label: "Sistema precisou de limpeza profunda completa" }
        ]
    },
    {
        id: "fan_condition",
        title: "Condições dos Exaustor (Fans)",
        items: [
            { id: "opt_fan_vibration", label: "Vibração anormal" },
            { id: "opt_fan_noise", label: "Ruído excessivo" },
            { id: "opt_fan_belt", label: "Correia desgastada" },
            { id: "opt_fan_struct", label: "Estruturas dos Fan problemática" },
            { id: "opt_fan_fire_risk", label: "Risco de incêndio no futuro" },
            { id: "opt_fan_repair", label: "Necessita reparo estrutural" },
            { id: "opt_fan_new", label: "Necessita instalação de um novo Fan" },
            { id: "opt_fan_maintenance", label: "Necessita manutenção geral imediata" }
        ]
    },
    {
        id: "duct",
        title: "Duto de Exaustão (Opcional)",
        items: [
            { id: "duct_grease_leak", label: "Vazamento de gordura nas junções" },
            { id: "duct_needs_panel", label: "Necessidade de instalação de novo access panel" },
            { id: "duct_obstruction", label: "Duto com obstrução parcial" }
        ]
    }
];
