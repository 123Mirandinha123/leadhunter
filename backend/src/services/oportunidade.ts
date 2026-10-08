interface DadosLead {
    temSite: boolean;
    telefone: string | null;
    website: string | null;
    endereco: string | null;
}

interface ResultadoOportunidade {
    oportunidade: string;
    servicoSugerido: string;
}

export function analisarOportunidade(
    lead: DadosLead
): ResultadoOportunidade {

    if (!lead.temSite) {
        return {
            oportunidade: "Alta",
            servicoSugerido: "Criação de site"
        };
    }

    if (lead.temSite && !lead.telefone) {
        return {
            oportunidade: "Média",
            servicoSugerido: "Melhoria da presença digital"
        };
    }

    return {
        oportunidade: "Baixa",
        servicoSugerido: "Análise de presença digital"
    };
}