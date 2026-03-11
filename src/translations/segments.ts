export type Segment = 'hood_cleaning' | 'hvac' | 'security' | 'pest_control';

export interface SegmentLabels {
    client: string;
    clients: string;
    technician: string;
    technicians: string;
    service: string;
    services: string;
    equipment: string;
    equipments: string;
    report: string;
    next_check: string;
}

export const segmentLabels: Record<Segment, SegmentLabels> = {
    hood_cleaning: {
        client: "Estabelecimento",
        clients: "Estabelecimentos",
        technician: "Técnico",
        technicians: "Equipe Técnica",
        service: "Limpeza de Coifa",
        services: "Histórico de Limpezas",
        equipment: "Sistema de Exaustão",
        equipments: "Sistemas",
        report: "Relatório NFPA",
        next_check: "Próxima Limpeza"
    },
    hvac: {
        client: "Edifício/Unidade",
        clients: "Unidades",
        technician: "Engenheiro",
        technicians: "Corpo de Engenharia",
        service: "Manutenção Preventiva",
        services: "Ordens de Serviço",
        equipment: "Unidade de Ar/Chiller",
        equipments: "Maquinário",
        report: "Laudo Técnico PMOC",
        next_check: "Próxima Revisão"
    },
    security: {
        client: "Posto/Cliente",
        clients: "Postos de Vigilância",
        technician: "Vigilante/Inspetor",
        technicians: "Efetivo",
        service: "Ronda/Inspeção",
        services: "Livro de Ocorrências",
        equipment: "Ponto de Controle",
        equipments: "Perímetros",
        report: "Relatório de Incidente",
        next_check: "Próxima Ronda"
    },
    pest_control: {
        client: "Localidade",
        clients: "Pontos de Isca",
        technician: "Aplicador",
        technicians: "Equipe de Campo",
        service: "Aplicação/Visita",
        services: "Ciclo de Tratamento",
        equipment: "Dispositivo/Armadilha",
        equipments: "Dispositivos",
        report: "Certificado de Desratização",
        next_check: "Próximo Reforço"
    }
};
