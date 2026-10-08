interface OSMElement {
    type: string;
    id: number;

    lat?: number;
    lon?: number;

    center?: {
        lat: number;
        lon: number;
    };

    tags?: {
        name?: string;
        phone?: string;
        "contact:phone"?: string;
        website?: string;
        "contact:website"?: string;
        "addr:street"?: string;
        "addr:housenumber"?: string;
    };
}

interface OverpassResponse {
    elements: OSMElement[];
}

const LIMITE_RESULTADOS = 50;

// Servidores Overpass.
// Se o primeiro estiver indisponível, tentamos o segundo.
const ENDPOINTS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter"
];

function normalizarTexto(texto: string): string {
    return texto
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function criarFiltro(categoria: string, bbox: string): string {
    const categoriaNormalizada = normalizarTexto(categoria);

    switch (categoriaNormalizada) {
        case "hamburgueria":
case "hamburguerias":
    return `
        (
            node["amenity"="restaurant"]["cuisine"~"burger|hamburger",i](${bbox});
            node["amenity"="fast_food"]["cuisine"~"burger|hamburger",i](${bbox});
            way["amenity"="restaurant"]["cuisine"~"burger|hamburger",i](${bbox});
            way["amenity"="fast_food"]["cuisine"~"burger|hamburger",i](${bbox});
        );
    `;

        case "pizzaria":
        case "pizzarias":
            return `
                (
                     node["amenity"~"restaurant|fast_food"]["cuisine"~"pizza",i](${bbox});
                    way["amenity"~"restaurant|fast_food"]["cuisine"~"pizza",i](${bbox});

                    node["amenity"~"restaurant|fast_food"]["name"~"pizza|pizzaria|pizzeria",i](${bbox});
                    way["amenity"~"restaurant|fast_food"]["name"~"pizza|pizzaria|pizzeria",i](${bbox});
                );
            `;

        case "restaurante":
        case "restaurantes":
            return `
                (
                      node["amenity"="restaurant"](${bbox});
            way["amenity"="restaurant"](${bbox});

            node["amenity"="restaurant"]["cuisine"](${bbox});
            way["amenity"="restaurant"]["cuisine"](${bbox});

            node["amenity"="restaurant"]["name"~"restaurante|restaurant",i](${bbox});
            way["amenity"="restaurant"]["name"~"restaurante|restaurant",i](${bbox});
                );
            `;

        case "barbearia":
        case "barbearias":
            return `
                (
            node["shop"="hairdresser"](${bbox});
            way["shop"="hairdresser"](${bbox});

            node["shop"="barber"](${bbox});
            way["shop"="barber"](${bbox});

            node["shop"="beauty"]["name"~"barbearia|barber|barberia",i](${bbox});
            way["shop"="beauty"]["name"~"barbearia|barber|barberia",i](${bbox});
                );
            `;

        case "padaria":
        case "padarias":
            return `
                (
                     node["shop"="bakery"](${bbox});
            way["shop"="bakery"](${bbox});

            node["amenity"="cafe"]["name"~"padaria|bakery",i](${bbox});
            way["amenity"="cafe"]["name"~"padaria|bakery",i](${bbox});

            node["name"~"padaria|panificadora|panificação|bakery",i](${bbox});
            way["name"~"padaria|panificadora|panificação|bakery",i](${bbox});
                );
            `;

        case "cafeteria":
        case "cafeterias":
        case "cafe":
            return `
                (
                    node["amenity"="cafe"](${bbox});
                    way["amenity"="cafe"](${bbox});
                );
            `;

        default:
            return `
                (
                   node["amenity"="cafe"](${bbox});
            way["amenity"="cafe"](${bbox});

            node["amenity"="cafe"]["cuisine"](${bbox});
            way["amenity"="cafe"]["cuisine"](${bbox});

            node["name"~"cafeteria|cafe|café|coffee",i](${bbox});
            way["name"~"cafeteria|cafe|café|coffee",i](${bbox});
                );
            `;
    }
}

function obterBbox(cidade: string): string {
    const cidadeNormalizada = normalizarTexto(cidade);

    const cidades: Record<string, string> = {
        "santo andre": "-23.70,-46.58,-23.63,-46.48",

        "sao paulo": "-23.80,-46.83,-23.35,-46.35",

        "campinas": "-23.10,-47.20,-22.70,-46.80"
    };

    console.log(`🏙️ Cidade recebida: "${cidade}"`);
    console.log(`🏙️ Cidade normalizada: "${cidadeNormalizada}"`);

    const bbox = cidades[cidadeNormalizada];

    if (!bbox) {
        throw new Error(
            `Cidade "${cidade}" ainda não está cadastrada`
        );
    }

    console.log(`📍 BBOX encontrada: ${bbox}`);

    return bbox;
}

async function consultarOverpass(
    endpoint: string,
    query: string
): Promise<OverpassResponse> {
    const resposta = await fetch(endpoint, {
        method: "POST",

        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "User-Agent": "LeadHunter/1.0 (lead generation application)"
        },

        body: `data=${encodeURIComponent(query)}`
    });

    if (!resposta.ok) {
        throw new Error(
            `Erro no Overpass: ${resposta.status} ${resposta.statusText}`
        );
    }

    return await resposta.json() as OverpassResponse;
}

export async function buscarEmpresas(
    cidade: string,
    categoria: string
) {
    const bbox = obterBbox(cidade);

    const filtro = criarFiltro(categoria, bbox);

    const query = `
        [out:json][timeout:25];

        ${filtro}

        out center tags 100;
    `;

    console.log("🔎 Consulta enviada ao Overpass:");
    console.log(query);

    let dados: OverpassResponse | null = null;

    for (const endpoint of ENDPOINTS) {
        try {
            console.log(`🌐 Tentando servidor: ${endpoint}`);

            dados = await consultarOverpass(
                endpoint,
                query
            );

            console.log(
                `✅ Servidor respondeu: ${endpoint}`
            );

            break;

        } catch (erro) {
            console.error(
                `❌ Falha no servidor ${endpoint}:`,
                erro instanceof Error
                    ? erro.message
                    : erro
            );
        }
    }

    if (!dados) {
        throw new Error(
            "Não foi possível consultar nenhum servidor Overpass."
        );
    }

    console.log(
        `📍 Overpass encontrou ${dados.elements.length} elementos`
    );

    const empresas = dados.elements
        .filter((elemento) => elemento.tags?.name)
        .slice(0, LIMITE_RESULTADOS)
        .map((elemento) => {
            const tags = elemento.tags!;

            const telefone =
                tags.phone ??
                tags["contact:phone"] ??
                null;

            const website =
                tags.website ??
                tags["contact:website"] ??
                null;

            const latitude =
                elemento.lat ??
                elemento.center?.lat ??
                null;

            const longitude =
                elemento.lon ??
                elemento.center?.lon ??
                null;

            return {
                osm_id: `${elemento.type}/${elemento.id}`,

                nome: tags.name!,

                categoria,

                cidade,

                telefone,

                website,

                temSite: Boolean(website),

                latitude,

                longitude,

                endereco: [
                    tags["addr:street"],
                    tags["addr:housenumber"]
                ]
                    .filter(Boolean)
                    .join(", ")
            };
        });

    console.log(
        `🏢 Empresas processadas: ${empresas.length}`
    );

    return empresas;
}