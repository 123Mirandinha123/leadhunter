import express from "express";
import cors from "cors";
import db from "./db.js";
import { buscarEmpresas } from "./services/overpass.js";
import { calcularScore } from "./services/score.js";
import { analisarOportunidade } from "./services/oportunidade.js";

const app = express();

db.getConnection()
    .then((connection) => {
        console.log("✅ Conectado ao MySQL/MariaDB!");
        connection.release();
    })
    .catch((erro) => {
        console.error("❌ Erro ao conectar ao banco:", erro.message);
    });
    
app.use(cors());
app.use(express.json());

// ========================================
// DADOS TEMPORÁRIOS
// ========================================

/*let leads = [
    {
        id: 1,
        nome: "Hamburgueria X",
        categoria: "Hamburgueria",
        cidade: "Santo André",
        telefone: "(11) 99999-9999",
        website: null,
        temSite: true,
        score: 91
    },
    {
        id: 2,
        nome: "Restaurante Y",
        categoria: "Restaurante",
        cidade: "Santo André",
        telefone: "(11) 98888-8888",
        website: null,
        temSite: false,
        score: 87
    }
];*/

// ========================================
// ROTAS
// ========================================

// Rota inicial
app.get("/", (req, res) => {
    res.json({
        message: "LeadHunter API funcionando!"
    });
});

// Informações da API
app.get("/api", (req, res) => {
    res.json({
        nome: "LeadHunter API",
        versao: "1.0.0",
        status: "online"
    });
});

// Listar todos os leads
app.get("/api/leads", async (req, res) => {
    try {
        const { status, oportunidade, ordem } = req.query;

        let sql = "SELECT * FROM leads";
        const valores: any[] = [];

        const filtros: string[] = [];

        if (status) {
            filtros.push("status = ?");
            valores.push(status);
        }

        if (oportunidade) {
            filtros.push("oportunidade = ?");
            valores.push(oportunidade);
        }

        if (filtros.length > 0) {
            sql += " WHERE " + filtros.join(" AND ");
        }

        if (ordem === "score") {
            sql += " ORDER BY score DESC";
        }

        const [leads] = await db.query(sql, valores);

        res.json(leads);

    } catch (erro) {
        console.error("Erro ao buscar leads:", erro);

        res.status(500).json({
            erro: "Erro ao buscar leads no banco de dados"
        });
    }
});

// Atualizar status de um lead
app.patch("/api/leads/:id/status", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        const statusPermitidos = [
            "NOVO",
            "ANALISADO",
            "INTERESSANTE",
            "CONTATADO",
            "RESPONDEU",
            "NEGOCIANDO",
            "FECHADO"
        ];

        if (isNaN(id)) {
            return res.status(400).json({
                erro: "ID inválido"
            });
        }

        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({
                erro: "Status inválido",
                statusPermitidos
            });
        }

        const [resultado] = await db.query(
            `
            UPDATE leads
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );

        if ((resultado as any).affectedRows === 0) {
            return res.status(404).json({
                erro: "Lead não encontrado"
            });
        }

        res.json({
            mensagem: "Status atualizado com sucesso",
            id,
            status
        });

    } catch (erro) {
        console.error("Erro ao atualizar status:", erro);

        res.status(500).json({
            erro: "Erro ao atualizar status do lead"
        });
    }
});

// Buscar um lead pelo ID
/*app.get("/api/leads/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                erro: "ID inválido"
            });
        }

        const [leads] = await db.query(
            "SELECT * FROM leads WHERE id = ?",
            [id]
        );

        if ((leads as any[]).length === 0) {
            return res.status(404).json({
                erro: "Lead não encontrado"
            });
        }

        res.json((leads as any[])[0]);

    } catch (erro) {
        console.error("Erro ao buscar lead:", erro);

        res.status(500).json({
            erro: "Erro ao buscar lead no banco de dados"
        });
    }
});*/

// Criar um novo lead
/*app.post("/api/leads", async (req, res) => {
    try {
        const {
            nome,
            categoria,
            cidade,
            telefone,
            website,
            temSite,
            score
        } = req.body;

        if (!nome || !categoria || !cidade) {
            return res.status(400).json({
                erro: "Nome, categoria e cidade são obrigatórios"
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO leads
            (nome, categoria, cidade, telefone, website, tem_site, score)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                categoria,
                cidade,
                telefone ?? null,
                website ?? null,
                temSite ?? false,
                score ?? 0
            ]
        );

        const id = (resultado as any).insertId;

        const [novoLead] = await db.query(
            "SELECT * FROM leads WHERE id = ?",
            [id]
        );

        res.status(201).json((novoLead as any[])[0]);

    } catch (erro) {
        console.error("Erro ao criar lead:", erro);

        res.status(500).json({
            erro: "Erro ao criar lead no banco de dados"
        });
    }
});*/

app.post("/api/buscar", async (req, res) => {
    try {
        const { cidade, categoria } = req.body;

        if (!cidade || !categoria) {
            return res.status(400).json({
                erro: "Cidade e categoria são obrigatórias"
            });
        }

        console.log(
            `🔎 Buscando ${categoria} em ${cidade}...`
        );

        const empresas = await buscarEmpresas(
            cidade,
            categoria
        );

        let novosLeads = 0;

        for (const empresa of empresas) {
            const [existentes] = await db.query(
                `
                SELECT id
                FROM leads
                WHERE nome = ?
                AND cidade = ?
                LIMIT 1
                `,
                [
                    empresa.nome,
                    empresa.cidade
                ]
            );

           if ((existentes as any[]).length > 0) {

    const leadExistente = (existentes as any[])[0];
    const score = calcularScore(empresa);
    const resultadoOportunidade = analisarOportunidade(empresa);

    await db.query(
        `
        UPDATE leads
        SET
            telefone = ?,
            website = ?,
            tem_site = ?,
            score = ?,
            oportunidade = ?,
            servico_sugerido = ?,
            osm_id = ?,
            latitude = ?,
            longitude = ?,
            endereco = ?
        WHERE id = ?
        `,
        [
            empresa.telefone,
            empresa.website,
            empresa.temSite,
            score,
            resultadoOportunidade.oportunidade,
            resultadoOportunidade.servicoSugerido,
            empresa.osm_id,
            empresa.latitude,
            empresa.longitude,
            empresa.endereco,
            leadExistente.id
        ]
    );

    continue;
}

    const score = calcularScore(empresa);
    const resultadoOportunidade = analisarOportunidade(empresa);

await db.query(
    `
    INSERT INTO leads
    (
        nome,
        categoria,
        cidade,
        telefone,
        website,
        tem_site,
        score,
        oportunidade,
        servico_sugerido,
        osm_id,
        latitude,
        longitude,
        endereco
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
        empresa.nome,
        empresa.categoria,
        empresa.cidade,
        empresa.telefone,
        empresa.website,
        empresa.temSite,
        score,
        resultadoOportunidade.oportunidade,
        resultadoOportunidade.servicoSugerido,
        empresa.osm_id,
        empresa.latitude,
        empresa.longitude,
        empresa.endereco
    ]
);

            novosLeads++;
        }

        res.json({
            mensagem: "Busca realizada com sucesso",
            encontrados: empresas.length,
            novos: novosLeads,
            empresas
        });

    } catch (erro) {
        console.error("❌ Erro ao buscar empresas:", erro);

        const mensagem = erro instanceof Error
            ? erro.message
            : "Erro ao buscar empresas";

        res.status(500).json({
            erro: mensagem
        });
    }
});

// ========================================
// SERVIDOR
// ========================================

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});