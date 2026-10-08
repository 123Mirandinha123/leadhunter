interface DadosLead {
    temSite: boolean;
    telefone: string | null;
    website: string | null;
    endereco: string | null;
}

export function calcularScore(lead: DadosLead): number {
    let score = 50;

    // Empresas sem site são mais interessantes
    if (!lead.temSite) {
        score += 35;
    } else {
        score -= 20;
    }

    // Ter telefone facilita o contato
    if (lead.telefone) {
        score += 5;
    }

    // Ter endereço indica que o negócio está bem identificado
    if (lead.endereco) {
        score += 5;
    }

    // Garante que o score fique entre 0 e 100
    return Math.max(0, Math.min(100, score));
}