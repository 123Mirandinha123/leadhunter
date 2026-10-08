const API_URL = "http://localhost:3000";

export interface FiltrosLeads {
    status?: string;
    oportunidade?: string;
    ordem?: string;
}

export async function buscarLeads(filtros: FiltrosLeads = {}) {
    const params = new URLSearchParams();

    if (filtros.status) {
        params.append("status", filtros.status);
    }

    if (filtros.oportunidade) {
        params.append("oportunidade", filtros.oportunidade);
    }

    if (filtros.ordem) {
        params.append("ordem", filtros.ordem);
    }

    const url = `${API_URL}/api/leads?${params.toString()}`;

    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error("Erro ao buscar leads");
    }

    return resposta.json();
}