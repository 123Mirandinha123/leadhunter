interface Lead {
  id: number;
  nome: string;
  categoria: string;
  cidade: string;
  telefone: string;
  website: string | null;
  temSite: boolean;
  score: number;
}

interface LeadDetailsProps {
  lead: Lead;
  onVoltar: () => void;
}

function LeadDetails({ lead, onVoltar }: LeadDetailsProps) {
  return (
    <div className="lead-details">
      <button onClick={onVoltar}>
        ← Voltar para leads
      </button>

      <h1>{lead.nome}</h1>

      <div className="details-card">
        <p>
          <strong>Categoria:</strong> {lead.categoria}
        </p>

        <p>
          <strong>Cidade:</strong> {lead.cidade}
        </p>

        <p>
          <strong>Telefone:</strong> {lead.telefone}
        </p>

        <p>
          <strong>Possui site:</strong>{" "}
          {lead.temSite ? "Sim" : "Não"}
        </p>

        <p>
          <strong>Website:</strong>{" "}
          {lead.website ?? "Não encontrado"}
        </p>

        <p>
          <strong>Score:</strong> {lead.score}
        </p>
      </div>
    </div>
  );
}

export default LeadDetails;