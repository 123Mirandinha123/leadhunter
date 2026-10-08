interface Lead {
  id: number;
  nome: string;
  categoria: string;
  cidade: string;
  telefone: string;
  website: string | null;
  temSite: boolean;
  score: number;
  status: string;
  oportunidade: string | null;
}

interface LeadCardProps {
  lead: Lead;
  onVerLead: (lead: Lead) => void;
}

function LeadCard({ lead, onVerLead }: LeadCardProps) {

  const classeScore =
    lead.score >= 80
      ? "score-alto"
      : lead.score >= 50
        ? "score-medio"
        : "score-baixo";

  return (
    <div className="lead-card">

      <div className="lead-card-header">

        <div>
          <h3>{lead.nome}</h3>

          <span>{lead.categoria}</span>
        </div>

        <strong className={`score ${classeScore}`}>
          {lead.score}
        </strong>

      </div>

      <p>📍 {lead.cidade}</p>

      <p>📞 {lead.telefone}</p>

      <p className={lead.temSite ? "site-ok" : "site-alerta"}>
        🌐 {lead.temSite ? "Possui site" : "Não possui site"}
      </p>

      <p>
        📌 Status: <strong>{lead.status}</strong>
      </p>

      <p>
        🎯 Oportunidade: <strong>{lead.oportunidade ?? "Não definida"}</strong>
      </p>

      <button onClick={() => onVerLead(lead)}>
        Ver lead
      </button>

    </div>
  );
}

export default LeadCard;