/* ==========================================================================
   CONFIGURAÇÕES GERAIS E MAPEAMENTO DE COLUNAS (GOOGLE SHEETS)
   ========================================================================== */
const COL = {
    ID: 0,          // Coluna A: ID_PATH
    CATEGORIA: 1,   // Coluna B: CATEGORIA (COMPLEXO / RESIDENCIAL)
    ORDEM: 2,       // Coluna C: ORDEM
    ZONA: 3,        // Coluna D: ZONA
    NOME: 4,        // Coluna E: NOME CURTO
    NOME_FULL: 5,   // Coluna F: NOME COMPLETO
    ESTOQUE: 6,     // Coluna G: ESTOQUE
    END: 7,         // Coluna H: ENDEREÇO
    ENTREGA: 8,     // Coluna I: PREVISÃO ENTREGA
    OBRA: 9,        // Coluna J: % OBRA
    TIPOLOGIAS: 10, // Coluna K: TIPOLOGIAS
    REGIAO: 11,     // Coluna L: REGIÃO METROPOLITANA
    P_DE: 12,       // Coluna M: PREÇO DE
    P_ATE: 13,      // Coluna N: PREÇO ATÉ
    LIMITADOR: 14,  // Coluna O: LIMITADOR DE PREÇO
    CASA_PAULISTA: 15, // Coluna P: PROGRAMA CASA PAULISTA
    CAMPANHA: 16,   // Coluna Q: CAMPANHA VIGENTE
    OBSERVACOES: 17,// Coluna R: OBSERVAÇÕES INTERNAS
    DESC_LONGA: 18, // Coluna S: MOBILIDADE / APRESENTAÇÃO
    LOCALIZACAO: 19,// Coluna T: COMENTÁRIOS LOCALIZAÇÃO
    MOBILIDADE: 20, // Coluna U: DETALHES DE MOBILIDADE
    CULTURA_LAZER: 21, // Coluna V: LAZER E CULTURA
    COMERCIO: 22,   // Coluna W: COMÉRCIO E SERVIÇOS
    SAUDE_EDUCACAO: 23, // Coluna X: SAÚDE E EDUCAÇÃO
    BOOK_CLIENTE: 24, // Coluna Y: LINK BOOK CLIENTE
    BOOK_CORRETOR: 25, // Coluna Z: LINK BOOK CORRETOR
    LINKS_VIDEOS: 26,  // Coluna AA: LINKS VÍDEOS
    LINKS_PLANTAS: 27, // Coluna AB: LINKS PLANTAS
    LINKS_IMPLANT: 28, // Coluna AC: LINKS IMPLANTAÇÃO
    LINKS_DIVERSOS: 29,// Coluna AD: LINKS DIVERSOS / TOURS
    ESTANDE: 30       // Coluna AE: ENDEREÇO DO ESTANDE
};

// VARIÁVEIS GLOBAIS DE MEMÓRIA DO DASHBOARD
let DADOS_PLANILHA = [];
let DOCUMENTOS_GERAIS = [];
let pathAtivo = "";
let imovelAtivo = "";
let mapaAtivo = 'GSP'; // 'GSP' ou 'INTERIOR'

/* ==========================================================================
   BLOCO 03: CARREGAMENTO DE DADOS (GOOGLE SHEETS)
   ========================================================================== */
async function carregarAbaDocumentos() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_DOCS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Documentos&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_DOCS);
        let texto = await response.text();
        const linhasPuras = texto.split(/\r?\n/);

        DOCUMENTOS_GERAIS = linhasPuras.slice(1).map(linha => {
            const inlineLimpa = linha.replace(/^"|"$/g, '').trim();
            if (!inlineLimpa) return null;

            const ultimaVirgula = inlineLimpa.lastIndexOf(',');
            if (ultimaVirgula === -1) return null;

            const titulo = inlineLimpa.substring(0, ultimaVirgula).trim().replace(/^"|"$/g, '');
            const url = inlineLimpa.substring(ultimaVirgula + 1).trim().replace(/^"|"$/g, '');

            if (!titulo || !url.startsWith('http')) return null;

            return { titulo, url };
        }).filter(d => d !== null);

    } catch (e) {
        console.error("Erro ao carregar aba de documentos: ", e);
    }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
        const linhasPuras = texto.split(/\r?\n/);

        DADOS_PLANILHA = linhasPuras.slice(1).map(linha => {
            const colunas = []; let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());

            const nomeImovel = colunas[COL.NOME] || "";
            const idPath = (colunas[COL.ID] || "").toLowerCase().replace(/\s/g, '');
            const ordem = parseInt(colunas[COL.ORDEM]);

            // Se o ID_PATH estiver em branco, ou o nome for inválido, descarta o registro (Liga/Desliga da Planilha)
            if (!idPath || nomeImovel.length <= 1 || isNaN(ordem)) return null;

            const cat = (colunas[COL.CATEGORIA] || "").toUpperCase();
            
            return {
                id_path: idPath,
                tipo: cat.includes('COMPLEXO') ? 'N' : 'R',
                ordem: ordem,
                zona: colunas[COL.ZONA] || "", 
                nome: nomeImovel,
                nomeFull: colunas[COL.NOME_FULL] || nomeImovel,
                estoque: colunas[COL.ESTOQUE] || "",
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "---",
                obra: colunas[COL.OBRA] || "0",
                tipologiasH: colunas[COL.TIPOLOGIAS] || "", 
                regiao: colunas[COL.REGIAO] || "---",
                p_de: colunas[COL.P_DE] || "---",
                p_ate: colunas[COL.P_ATE] || "---",
                limitador: colunas[COL.LIMITADOR] || "---",
                casa_paulista: colunas[COL.CASA_PAULISTA] || "---",
                campanha: colunas[COL.CAMPANHA] || "",
                observacoes: colunas[COL.OBSERVACOES] || "", 
                descLonga: colunas[COL.DESC_LONGA] || "",
                localizacao: colunas[COL.LOCALIZACAO] || "",
                mobilidade: colunas[COL.MOBILIDADE] || "",
                lazer: colunas[COL.CULTURA_LAZER] || "",
                comercio: colunas[COL.COMERCIO] || "",
                saude: colunas[COL.SAUDE_EDUCACAO] || "",
                linkCliente: colunas[COL.BOOK_CLIENTE] || "",
                linkCorretor: colunas[COL.BOOK_CORRETOR] || "",
                linksVideos: colunas[COL.LINKS_VIDEOS] || "",
                linksPlantas: colunas[COL.LINKS_PLANTAS] || "",
                linksImplant: colunas[COL.LINKS_IMPLANT] || "",
                linksDiversos: colunas[COL.LINKS_DIVERSOS] || "",
                estande: colunas[COL.ESTANDE] || ""
            };
        }).filter(i => i !== null);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
}

/* ==========================================================================
   BLOCO 04: LÓGICA DO MAPA E SELEÇÃO
   ========================================================================== */
function obterHtmlZona(zona, tipo) {
    if (tipo === 'N' || !zona || zona === "---") return "";
    return `<span style="font-size:10px; font-weight:bold; color:#666;">${zona.toUpperCase()}</span>`;
}

function detectarClasseZona(zona) {
    if (!zona) return "";
    const z = zona.toUpperCase().trim();
    
    // 1. Zonas Tradicionais da Capital (Pega "ZN", "Sete Sois - ZN", etc.)
    if (z.includes("ZN")) return "btn-zn";
    if (z.includes("ZL")) return "btn-zl";
    if (z.includes("ZO")) return "btn-zo";
    if (z.includes("ZS")) return "btn-zs";
    
    // 2. Grande São Paulo
    if (z.includes("GSP") || z.includes("GRANDE")) return "btn-gsp";
    
    // 3. Região do Vale do Paraíba
    if (z.includes("VALE")) return "btn-vale";
    
    // 4. Região de Campinas
    if (z.includes("CAMPINAS")) return "btn-campinas";
    
    // 5. Região de Ribeirão Preto
    if (z.includes("RIB") || z.includes("PRETO")) return "btn-ribeirao";
    
    // Caso use alguma classificação diferente que não mapeamos acima
    return "btn-outros"; 
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (!imovel) return;
    comandoSelecao(imovel.id_path, null, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    if (!idPath) return;
    const idNorm = idPath.toLowerCase().replace(/\s/g, '');

    const noGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    const noInterior = MAPA_INTERIOR.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    
    if (noGSP && mapaAtivo !== 'GSP') trocarMapas(false);
    if (noInterior && mapaAtivo !== 'INTERIOR') trocarMapas(false);
    
    pathAtivo = idNorm;
    const imoveisDaCidade = DADOS_PLANILHA.filter(d => d.id_path === pathAtivo);
    const selecionado = fonte || imoveisDaCidade[0];
    
    if (!selecionado) return; 
    
    imovelAtivo = selecionado.nome;

    document.querySelectorAll('path').forEach(el => el.classList.remove('ativo'));
    const elMapa = document.getElementById(`caixa-a-${pathAtivo}`);
    if (elMapa) elMapa.classList.add('ativo');

    gerarListaLateral();
    const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
    const nomeOficial = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || pathAtivo;
    
    atualizarTituloSuperior(nomeOficial);
    montarVitrine(selecionado, imoveisDaCidade, nomeOficial);
}

function atualizarTituloSuperior(texto) {
    const titulo = document.getElementById('cidade-titulo');
    if (!titulo) return;
    if (texto) { titulo.innerText = `MRV EM ${texto.toUpperCase()}`; } 
    else if (pathAtivo) {
        const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
        const nomeFixo = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || "";
        titulo.innerText = `MRV EM ${nomeFixo.toUpperCase()}`;
    } else { titulo.innerText = "SELECIONE UMA REGIÃO NO MAPA"; }
}

/* ==========================================================================
   INICIALIZAÇÃO DO CORE DO DASHBOARD
   ========================================================================== */
window.onload = async () => {
    // Carrega os dados assincronamente da planilha
    await carregarAbaDocumentos();
    await carregarPlanilha();
};
