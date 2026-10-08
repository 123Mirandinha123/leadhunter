import { useEffect, useState } from "react";
import { buscarLeads } from "./services/api";
import LeadCard from "./components/LeadCard";
import Header from "./components/Header";
import LeadDetails from "./components/LeadDetails";
import "./App.css";

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

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [status, setStatus] = useState("");
  const [oportunidade, setOportunidade] = useState("");

  // Filtros
  const [busca, setBusca] = useState("");
  const [cidade, setCidade] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [somenteSemSite, setSomenteSemSite] = useState(false);

  // Ordenação
  const [ordemScore, setOrdemScore] = useState("maior");

  // Buscar leads na API
useEffect(() => {
  setCarregando(true);

  buscarLeads({
    status: status || undefined,
    oportunidade: oportunidade || undefined,
  })
    .then((dados) => {
      setLeads(dados);
    })
    .catch((erro) => {
      console.error("Erro ao buscar leads:", erro);
    })
    .finally(() => {
      setCarregando(false);
    });
}, [status, oportunidade]);

  // Aplicar filtros
  const leadsFiltrados = leads.filter((lead) => {
    const correspondeBusca = lead.nome
      .toLowerCase()
      .includes(busca.toLowerCase());

    const correspondeCidade =
      cidade === "todas" || lead.cidade === cidade;

    const correspondeCategoria =
      categoria === "todas" || lead.categoria === categoria;

    const correspondeSite =
      !somenteSemSite || !lead.temSite;

    return (
      correspondeBusca &&
      correspondeCidade &&
      correspondeCategoria &&
      correspondeSite
    );
  });

  // Ordenar por score
  const leadsOrdenados = [...leadsFiltrados].sort((a, b) => {
    if (ordemScore === "maior") {
      return b.score - a.score;
    }

    return a.score - b.score;
  });

  // Tela de detalhes
  if (leadSelecionado) {
    return (
      <div>
        <Header />

        <main>
          <LeadDetails
            lead={leadSelecionado}
            onVoltar={() => setLeadSelecionado(null)}
          />
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <main>
        <h1>LeadHunter</h1>

          <div className="dashboard-stats">

  <div className="stat-card">
    <span className="stat-label">Total de leads</span>
    <strong>{leads.length}</strong>
  </div>

  <div className="stat-card">
    <span className="stat-label">Sem site</span>
    <strong>
      {leads.filter((lead) => !lead.temSite).length}
    </strong>
  </div>

  <div className="stat-card">
    <span className="stat-label">Com site</span>
    <strong>
      {leads.filter((lead) => lead.temSite).length}
    </strong>
  </div>

  <div className="stat-card">
    <span className="stat-label">Score médio</span>
    <strong>
      {leads.length > 0
        ? Math.round(
            leads.reduce((total, lead) => total + lead.score, 0) /
              leads.length
          )
        : 0}
    </strong>
  </div>

</div>

        {/* BUSCA */}
        <div className="filtros">
          <input
            type="text"
            placeholder="🔎 Buscar empresa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* FILTROS */}
        <div className="filtros-selects">

          {/* ORDENAÇÃO */}
          <select
            value={ordemScore}
            onChange={(e) => setOrdemScore(e.target.value)}
          >
            <option value="maior">Maior score</option>
            <option value="menor">Menor score</option>
          </select>

          {/* STATUS */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="NOVO">Novo</option>
            <option value="ANALISADO">Analisado</option>
            <option value="INTERESSANTE">Interessante</option>
            <option value="CONTATADO">Contatado</option>
            <option value="RESPONDEU">Respondeu</option>
            <option value="NEGOCIANDO">Negociando</option>
            <option value="FECHADO">Fechado</option>
          </select>

          {/* OPORTUNIDADE */}
          <select
            value={oportunidade}
            onChange={(e) => setOportunidade(e.target.value)}
          >
            <option value="">Todas as oportunidades</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          {/* CIDADE */}
          <select
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          >
            <option value="todas">Todas as cidades</option>
            <option value="Santo André">Santo André</option>
          </select>

          {/* CATEGORIA */}
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="todas">Todas as categorias</option>
            <option value="Hamburgueria">Hamburgueria</option>
            <option value="Restaurante">Restaurante</option>
          </select>

          

          {/* SEM SITE */}
          <label className="filtro-site">
            <input
              type="checkbox"
              checked={somenteSemSite}
              onChange={(e) => setSomenteSemSite(e.target.checked)}
            />

            Somente empresas sem site
          </label>

        </div>

        {/* CONTADOR */}
        <h2>
          Leads encontrados: {leadsOrdenados.length}
        </h2>

        {/* LEADS */}
        {carregando ? (
          <p>Carregando leads...</p>
        ) : leadsOrdenados.length === 0 ? (
          <p>Nenhum lead encontrado.</p>
        ) : (
          <div>
            {leadsOrdenados.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onVerLead={setLeadSelecionado}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;