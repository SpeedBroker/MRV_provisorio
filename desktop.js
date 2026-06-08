/* ==========================================================================
   BLOCO 01: CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
   ========================================================================== */
let DADOS_PLANILHA = [];
let DOCUMENTOS_GERAIS = []; 
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, 
    ZONA: 3, 
    NOME: 4, NOME_FULL: 5,  
    ESTOQUE: 6, END: 7, TIPOLOGIAS: 8, ENTREGA: 9, 
    P_DE: 10, P_ATE: 11, OBRA: 12, LIMITADOR: 13, 
    REGIAO: 14, CASA_PAULISTA: 15, CAMPANHA: 16, 
    DESC_LONGA: 18, OBSERVACOES: 19,
    LOCALIZACAO: 20, MOBILIDADE: 21, CULTURA_LAZER: 22,    
    COMERCIO: 23, SAUDE_EDUCACAO: 24,
    BOOK_CLIENTE: 25, BOOK_CORRETOR: 26,
    LINKS_VIDEOS: 27, LINKS_PLANTAS: 28,  
    LINKS_IMPLANT: 29, LINKS_DIVERSOS: 30,
    ESTANDE: 31 
};

/* ==========================================================================
   BLOCO 02: INICIALIZAÇÃO E UTILITÁRIOS
   ========================================================================== */
async function iniciarApp() {
    try { 
        await Promise.all([carregarPlanilha(), carregarAbaDocumentos()]);
        configurarBotaoDocumentos(); 
    } catch (err) { 
        console.error(err); 
    }
}

function configurarBotaoDocumentos() {
    const btnDocs = document.getElementById('btn-documentos');
    if (btnDocs) {
        btnDocs.addEventListener('click', () => {
            imovelAtivo = null;
            pathAtivo = null;
            document.querySelectorAll('path').forEach(el => el.classList.remove('ativo'));
            gerarListaLateral();
            
            const ct = document.getElementById('cidade-titulo');
            if (ct) ct.innerText = "DOCUMENTOS GERAIS CORPORATIVOS";

            const painel = document.getElementById('ficha-tecnica');
            if (painel) {
                let htmlDocs = `
                    <div class="vitrine-topo" style="background-color: #dca206; color: #004d24;">📂 ARQUIVOS DIVERSOS</div>
                    <div style="padding: 10px 0;">
                `;

                if (DOCUMENTOS_GERAIS.length === 0) {
                    htmlDocs += `
                        <div style="text-align:center; color:#999; margin-top:50px;">
                            <p>Nenhum documento encontrado na aba.</p>
                        </div>`;
                } else {
                    DOCUMENTOS_GERAIS.forEach(doc => {
                        htmlDocs += criarCardMaterial(doc.titulo, doc.url, '📝');
                    });
                }

                htmlDocs += `</div>`;
                painel.innerHTML = htmlDocs;
                inicializarHoverMiniaturas();
            }
        });
    }
}

function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "" || typeof url !== 'string') return "";
    let link = url.trim();
    if (link.includes('drive.google.com')) {
        const match = link.match(/\/d\/(.*?)(\/|$|\?)/) || link.match(/id=(.*?)($|&)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/view?usp=sharing`;
        }
    }
    return link;
}

function formatarLinkPreview(url) {
    if (!url || url === "---" || url === "" || typeof url !== 'string') return "";
    let link = url.trim();
    if (link.includes('drive.google.com')) {
        const match = link.match(/\/d\/(.*?)(\/|$|\?)/) || link.match(/id=(.*?)($|&)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }
    return link;
}

function inicializarHoverMiniaturas() {
    const botoesAbrir = document.querySelectorAll('.card-btn-abrir');
    botoesAbrir.forEach(botao => {
        const urlPreview = botao.getAttribute('data-preview');
        if (!urlPreview) return;

        botao.addEventListener('mouseenter', (e) => {
            const antigo = document.getElementById('preview-flutuante-drive');
            if (antigo) antigo.remove();

            const previewDiv = document.createElement('div');
            previewDiv.id = 'preview-flutuante-drive';
            previewDiv.style.position = 'fixed';
            previewDiv.style.width = '320px';
            previewDiv.style.height = '220px';
            previewDiv.style.backgroundColor = '#fff';
            previewDiv.style.border = '1px solid #ccc';
            previewDiv.style.boxShadow = '0px 4px 15px rgba(0,0,0,0.2)';
            previewDiv.style.borderRadius = '8px';
            previewDiv.style.overflow = 'hidden';
            previewDiv.style.zIndex = '99999';
            previewDiv.style.pointerEvents = 'none';

            previewDiv.innerHTML = `<iframe src="${urlPreview}" style="width:100%; height:100%; border:none;"></iframe>`;
            document.body.appendChild(previewDiv);
            posicionarPreview(e, previewDiv);
        });

        botao.addEventListener('mousemove', (e) => {
            const previewDiv = document.getElementById('preview-flutuante-drive');
            if (previewDiv) posicionarPreview(e, previewDiv);
        });

        botao.addEventListener('mouseleave', () => {
            const previewDiv = document.getElementById('preview-flutuante-drive');
            if (previewDiv) previewDiv.remove();
        });
    });
}

function posicionarPreview(e, elemento) {
    let top = e.clientY + 15;
    let left = e.clientX + 15;
    if (left + 340 > window.innerWidth) left = e.clientX - 340;
    if (top + 240 > window.innerHeight) top = e.clientY - 240;
    elemento.style.top = `${top}px`;
    elemento.style.left = `${left}px`;
}

function copiarTexto(texto, msg = "Link copiado!") {
    if (!texto || texto === "") return;
    navigator.clipboard.writeText(texto).then(() => {
        alert(msg);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
}

function copiarLink(url) {
    const linkSeguro = formatarLinkSeguro(url);
    copiarTexto(linkSeguro, "Link seguro copiado!");
}

function abrirDocumentoDireto(url) {
    const linkSeguro = formatarLinkSeguro(url);
    if (linkSeguro) window.open(linkSeguro, '_blank');
}

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

            if (!idPath || nomeImovel.length <= 1 || isNaN(ordem)) return null;
            const cat = (colunas[COL.CATEGORIA] || "").toUpperCase();
            
            return {
                id_path: idPath,
                tipo: cat.includes('COMPLEXO') ? 'N' : 'R',
                ordem: ordem,
                zona: colunas[COL.ZONA] || "", 
                nome: nomeImovel,
                nomeFull: colunas[COL.NOME_FULL] || nomeImovel,
                estoque: colunas[COL.ESTOQUE],
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
    if (z.includes("ZO")) return "btn-zo";
    if (z.includes("ZL")) return "btn-zl";
    if (z.includes("ZN")) return "btn-zn";
    if (z.includes("ZS")) return "btn-zs";
    return ""; 
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (!imovel) return;
    comandoSelecao(imovel.id_path, null, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
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
   BLOCO 05: RENDERIZAÇÃO DOS MAPAS (SVG)
   ========================================================================== */
function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container) return;
    container.style.display = "flex"; 
    
    let svgHtml = `<svg viewBox="0 0 800 600" width="100%" height="100%">`;
    dados.paths.forEach(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const possuiMrv = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        let classe = possuiMrv ? 'commrv' : '';
        if (pathAtivo === idNorm) classe += ' ativo';
        
        svgHtml += `<path id="caixa-a-${idNorm}" class="${classe}" d="${p.d}" title="${p.name}"`;
        if (interativo) {
            svgHtml += ` onclick="comandoSelecao('${idNorm}', '${p.name}')"`;
        }
        svgHtml += `></path>`;
    });
    svgHtml += `</svg>`;
    container.innerHTML = svgHtml;
}
