/* ==========================================================================
   1. CONFIGURAÇÕES E DADOS GERAIS
   ========================================================================== */
const CONFIG_SISTEMA = {
    urlPlanilhaDados: "https://script.google.com/macros/s/AKfycbz_9I9xXQ_lq76Zc3b7P8Z3n5O_7rX8V_yX/exec"
};

// Estado global da aplicação
let bancoDadosImoveis = [];
let imovelAtivoAtual = null;

/* ==========================================================================
   2. INICIALIZAÇÃO DA APLICAÇÃO
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    configurarEventosGlobais();
    carregarDadosIniciais();
});

/**
 * Configura os ouvintes de eventos para elementos estáticos do DOM
 */
function configurarEventosGlobais() {
    // Botão Sobre o Sistema
    const btnSobre = document.getElementById("btn-sobre");
    if (btnSobre) {
        btnSobre.addEventListener("click", abrirModalSobre);
    }

    // Fechamento do Modal
    const btnFecharModal = document.querySelector(".modal-close");
    if (btnFecharModal) {
        btnFecharModal.addEventListener("click", fecharModalSobre);
    }

    // Fechar modal clicando fora da área de conteúdo
    window.addEventListener("click", (e) => {
        const modal = document.getElementById("modal-sobre");
        if (e.target === modal) fecharModalSobre();
    });

    // Configuração do container de Preview Dinâmico do Drive (Cursor Tracker)
    criarEstruturaPreviewFlutuante();
}

/**
 * Consome a API do Google Apps Script para buscar os dados dos imóveis
 */
async function carregarDadosIniciais() {
    try {
        const resposta = await fetch(CONFIG_SISTEMA.urlPlanilhaDados);
        if (!resposta.ok) throw new Error("Erro na resposta da rede.");
        
        bancoDadosImoveis = await resposta.json();
        
        // Inicializa as renderizações com base nos dados carregados
        renderizarListaLateral(bancoDadosImoveis);
        configurarCliquesMapa();
        
    } catch (erro) {
        console.error("Falha fatal ao carregar dados do Dashboard:", erro);
    }
}

/* ==========================================================================
   3. SIDEBAR ESQUERDA - LISTAGEM REATIVA (COMPLEXOS E RESIDENCIAIS)
   ========================================================================== */
/**
 * Renderiza dinamicamente a lista da esquerda agrupando por Zona/Região
 */
function renderizarListaLateral(dados) {
    const containerSidebar = document.querySelector(".sidebar-esq");
    if (!containerSidebar) return;

    containerSidebar.innerHTML = ""; // Limpa carregamentos prévios

    if (!dados || dados.length === 0) {
        containerSidebar.innerHTML = '<p style="padding:15px; font-size:0.75rem; color:#777;">Nenhum imóvel encontrado.</p>';
        return;
    }

    dados.forEach(imovel => {
        const botaolista = document.createElement("a");
        botaolista.href = "#";
        
        // Define o identificador único para o clique reativo
        botaolista.setAttribute("data-id", imovel.id || imovel.nome);

        // Identifica se o registro é um Complexo ou Residencial Comum
        const ehComplexo = String(imovel.tipo || "").toUpperCase() === "COMPLEXO";
        const classeRegiao = determinarClasseZona(imovel.zona || imovel.regiao);

        if (ehComplexo) {
            // Aplica as classes e estilizações de COMPLEXO
            botaolista.className = `separador-complexo-btn ${classeRegiao}`;
            botaolista.innerHTML = `<span>${imovel.nome}</span> <span style="font-size:0.6rem;">➔</span>`;
        } else {
            // Aplica as classes e estilizações de RESIDENCIAL Comum
            botaolista.className = `btRes ${classeRegiao}`;
            botaolista.innerHTML = `<span>${imovel.nome}</span>`;
        }

        // CORREÇÃO CRUCIAL: Captura cliques tanto em residenciais (.btRes) quanto em complexos (.separador-complexo-btn)
        botaolista.addEventListener("click", (evento) => {
            evento.preventDefault();
            gerenciarSelecaoImovel(botaolista, imovel);
        });

        containerSidebar.appendChild(botaolista);
    });
}

/**
 * Retorna a classe CSS correspondente com base na zona ou cidade informada
 */
function determinarClasseZona(zona) {
    if (!zona) return "btn-zo";
    const z = zona.toLowerCase().trim();

    if (z.includes("norte") || z === "zn") return "btn-zn";
    if (z.includes("sul") || z === "zs") return "btn-zs";
    if (z.includes("leste") || z === "zl") return "btn-zl";
    if (z.includes("oeste") || z === "zo") return "btn-zo";
    
    // Regiões do Interior e Expansão
    if (z.includes("vale") || z.includes("paraíba")) return "btn-vale";
    if (z.includes("campinas")) return "btn-campinas";
    if (z.includes("sorocaba")) return "btn-sorocaba";
    if (z.includes("santos") || z.includes("baixada")) return "btn-santos";
    if (z.includes("ribeirão") || z.includes("preto")) return "btn-ribeirao";

    return "btn-zo"; // Fallback padrão
}

/**
 * Controla os estados visuais ativos e dispara a atualização da vitrine da direita
 */
function gerenciarSelecaoImovel(elementoClicado, dadosImovel) {
    // Remove o estado ativo de QUALQUER botão anterior (Residencial ou Complexo)
    document.querySelectorAll(".btRes, .separador-complexo-btn").forEach(btn => {
        btn.classList.remove("ativo");
    });

    // Ativa o botão selecionado atual
    elementoClicado.classList.remove("ativo");
    elementoClicado.classList.add("ativo");

    imovelAtivoAtual = dadosImovel;

    // Sincroniza e acende o mapa geográfico se aplicável
    sincronizarMapaComSelecao(dadosImovel.cidade || dadosImovel.regiao);

    // Atualiza a vitrine da direita de forma completa
    atualizarVitrineDireita(dadosImovel);
}

/* ==========================================================================
   4. MAPA INTERATIVO (SVG)
   ========================================================================= */
/**
 * Configura as interações de hover e clique nos polígonos/paths do mapa SVG
 */
function configurarCliquesMapa() {
    const caminhosMapa = document.querySelectorAll("svg path");
    
    caminhosMapa.forEach(path => {
        path.addEventListener("click", () => {
            const nomeRegiaoMapa = path.getAttribute("name") || path.getAttribute("id");
            if (!nomeRegiaoMapa) return;

            // Remove destaque ativo de outros paths
            caminhosMapa.forEach(p => p.classList.remove("ativo"));
            path.classList.add("ativo");

            // Atualiza o título superior do centro
            const containerTitulo = document.getElementById("cidade-titulo");
            if (containerTitulo) containerTitulo.textContent = nomeRegiaoMapa;

            // Filtra os imóveis daquela região exata clicada
            filtrarImoveisPorRegiao(nomeRegiaoMapa);
        });
    });
}

/**
 * Filtra a barra lateral e seleciona o primeiro item ao clicar em uma região do mapa
 */
function filtrarImoveisPorRegiao(nomeRegiao) {
    const regiaoAlvo = nomeRegiao.toLowerCase().trim();
    
    // Procura o primeiro imóvel ou complexo que pertença a essa região
    const imovelCorrespondente = bancoDadosImoveis.find(imovel => {
        const cid = String(imovel.cidade || "").toLowerCase();
        const zon = String(imovel.zona || "").toLowerCase();
        return cid.includes(regiaoAlvo) || zon.includes(regiaoAlvo);
    });

    if (imovelCorrespondente) {
        // Localiza o botão correspondente criado na barra lateral e simula o clique nele
        const idProcurado = imovelCorrespondente.id || imovelCorrespondente.nome;
        const botaoAlvo = document.querySelector(`[data-id="${idProcurado}"]`);
        if (botaoAlvo) {
            botaoAlvo.click();
            botaoAlvo.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }
}

/**
 * Mantém o mapa sincronizado visualmente quando o usuário clica na lista da esquerda
 */
function sincronizarMapaComSelecao(nomeCidade) {
    if (!nomeCidade) return;
    const cidadeNormalizada = nomeCidade.toLowerCase().trim();

    document.querySelectorAll("svg path").forEach(path => {
        const nameAttr = String(path.getAttribute("name") || "").toLowerCase();
        const idAttr = String(path.getAttribute("id") || "").toLowerCase();

        if (nameAttr.includes(cidadeNormalizada) || idAttr.includes(cidadeNormalizada)) {
            path.classList.add("ativo");
            const containerTitulo = document.getElementById("cidade-titulo");
            if (containerTitulo) containerTitulo.textContent = nomeCidade;
        } else {
            path.classList.remove("ativo");
        }
    });
}

/* ==========================================================================
   5. SIDEBAR DIREITA - RENDERIZADOR DA VITRINE E DETALHES
   ========================================================================== */
/**
 * Constrói dinamicamente toda a estrutura de exibição técnica do imóvel/complexo selecionado
 */
function atualizarVitrineDireita(imovel) {
    const containerVitrine = document.querySelector(".sidebar-dir");
    if (!containerVitrine) return;

    containerVitrine.innerHTML = ""; // Reseta vitrine anterior

    // Determina a cor de destaque da faixa superior
    const ehComplexo = String(imovel.tipo || "").toUpperCase() === "COMPLEXO";
    const classeFaixaColorida = ehComplexo ? "faixa-preta" : "faixa-laranja";

    // 1. Criação do Título com a faixa colorida reativa
    const elementoFaixaTitulo = document.createElement("div");
    elementoFaixaTitulo.className = `titulo-vitrine-faixa ${classeFaixaColorida}`;
    elementoFaixaTitulo.textContent = imovel.nome;
    containerVitrine.appendChild(elementoFaixaTitulo);

    // 2. Se for um COMPLEXO, renderiza o Bloco Informativo de Complexo e encerra a árvore ou puxa seus filhos
    if (ehComplexo) {
        renderizarEstruturaDeComplexo(containerVitrine, imovel);
        return;
    }

    // 3. Se for um RESIDENCIAL COMUM, monta a tabela técnica padrão e o Grid Estruturado
    renderizarEstruturaDeResidencial(containerVitrine, imovel);
}

/**
 * Renderiza o layout exclusivo de Complexos na vitrine da direita
 */
function renderizarEstruturaDeComplexo(container, complexo) {
    const boxComplexo = document.createElement("div");
    boxComplexo.className = "box-complexo-full";
    
    boxComplexo.innerHTML = `
        <div style="font-size:0.85rem; font-weight:bold; margin-bottom:8px; color:var(--mrv-preto);">
            🏢 ${complexo.nome.toUpperCase()}
        </div>
        <p style="font-size:0.75rem; color:#555; line-height:1.4; margin-bottom:12px;">
            ${complexo.descricao || "Este complexo reúne excelentes opções de moradia com infraestrutura completa e lazer integrado para toda a sua família."}
        </p>
    `;

    // CORREÇÃO CRUCIAL: Se houverem residenciais vinculados a este complexo na base de dados, cria botões clicáveis para eles sobre a vitrine!
    const residenciaisFilhos = bancoDadosImoveis.filter(item => 
        item.complexoPertencente && String(item.complexoPertencente).toLowerCase().trim() === String(complexo.nome).toLowerCase().trim()
    );

    if (residenciaisFilhos.length > 0) {
        const subTituloFilhos = document.createElement("div");
        subTituloFilhos.style = "font-size:0.7rem; font-weight:bold; margin-top:15px; margin-bottom:6px; text-transform:uppercase; color:#777;";
        subTituloFilhos.textContent = "Residenciais integrantes deste Complexo:";
        boxComplexo.appendChild(subTituloFilhos);

        residencaisFilhos.forEach(filho => {
            const btnFilho = document.createElement("button");
            btnFilho.className = "btRes btn-zo"; // Aplica estilo padrão de botão de residencial
            btnFilho.style = "width:100% !important; margin:4px 0 !important; text-align:left; justify-content:flex-start; gap:8px;";
            btnFilho.innerHTML = `📍 <span style="font-weight:bold;">${filho.nome}</span>`;
            
            // Permite clicar no residencial de dentro da vitrine do complexo!
            btnFilho.addEventListener("click", () => {
                const botaoLateralOriginal = document.querySelector(`[data-id="${filho.id || filho.nome}"]`);
                if (botaoLateralOriginal) {
                    botaoLateralOriginal.click();
                } else {
                    atualizarVitrineDireita(filho);
                }
            });
            boxComplexo.appendChild(btnFilho);
        });
    }

    container.appendChild(boxComplexo);
    
    // Adiciona os cards de materiais vinculados ao complexo se houverem
    renderizarCardsMateriais(container, complexo);
}

/**
 * Renderiza o layout tradicional de Ficha Técnica e Grid 50/50 para Residenciais comuns
 */
function renderizarEstruturaDeResidencial(container, imovel) {
    // Tabela básica de localização superior
    const tabelaLocalizacao = document.createElement("table");
    tabelaLocalizacao.style = "width:100%; margin-bottom:10px; border-collapse:collapse;";
    tabelaLocalizacao.innerHTML = `
        <tr>
            <td style="padding:4px 0; color:#333;">
                <b>Endereço:</b> <span>${imovel.endereco || "Não informado"}</span>
                ${imovel.linkMaps ? `<a href="${imovel.linkMaps}" target="_blank" class="btn-maps" style="margin-left:6px;">Ver no Maps</a>` : ""}
            </td>
        </tr>
    `;
    container.appendChild(tabelaLocalizacao);

    // Bloco Padronizado de Detalhes (Grid 50/50 com alturas equalizadas)
    const containerGridDetalhes = document.createElement("div");
    containerGridDetalhes.className = "detalhes-residencial-container";

    // Monta o cabeçalho interno do container
    let estruturaGridHTML = `
        <div class="header-residencial">${imovel.nome}</div>
        <div class="sub-header">
            <span><b>Status:</b> ${imovel.status || "Lançamento"}</span>
            <div class="btn-links-fnd">
                ${imovel.linkFnd ? `<a href="${imovel.linkFnd}" target="_blank" style="background:#00713a;">FND</a>` : ""}
                ${imovel.linkTour ? `<a href="${imovel.linkTour}" target="_blank" style="background:#f37021;">TOUR</a>` : ""}
            </div>
        </div>
    `;

    // Faixa de isenção condicional
    if (imovel.isencaoInpc && String(imovel.isencaoInpc).toUpperCase() === "SIM") {
        estruturaGridHTML += `<div class="faixa-isencao">🚨 IMÓVEL COM ISENÇÃO DE INPC!</div>`;
    }

    // Abre o corpo do grid reativo
    estruturaGridHTML += `<div class="grid-info">`;

    // Células do Grid (Lado A / Lado B combinados perfeitamente)
    estruturaGridHTML += `
        <div class="grid-cell border-right"><span class="label">Tipologia:</span><span class="valor">${imovel.tipologia || "-"}</span></div>
        <div class="grid-cell"><span class="label">Vagas:</span><span class="valor">${imovel.vagas || "-"}</span></div>
        
        <div class="grid-cell border-right"><span class="label">Faixa MCMV:</span><span class="valor">${imovel.faixaMcmv || "-"}</span></div>
        <div class="grid-cell"><span class="label">Renda Alvo:</span><span class="valor">${imovel.rendaAlvo || "-"}</span></div>
        
        <div class="grid-cell border-right full-width" style="border-right:none;">
            <span class="label">Parceria PPP:</span><span class="valor">${imovel.ppp || "Não"}</span>
        </div>

        <div class="grid-cell border-right full-width" style="border-right:none; background:#fdfdfd;">
            <div style="display:flex; flex-direction:column; width:100%;">
                <span class="label" style="margin-bottom:4px; text-transform:uppercase; font-size:0.65rem;">📍 Localização Estratégica:</span>
                <p style="font-size:0.72rem; color:#555; margin:0; line-height:1.3;">${imovel.textoLocalizacao || "Localização privilegiada com fácil acesso a comércios e serviços."}</p>
            </div>
        </div>

        <div class="grid-cell border-right full-width" style="border-right:none; background:#fbfbfb;">
            <div style="display:flex; flex-direction:column; width:100%;">
                <span class="label" style="margin-bottom:4px; text-transform:uppercase; font-size:0.65rem;">🚇 Mobilidade & Transporte:</span>
                <p style="font-size:0.72rem; color:#555; margin:0; line-height:1.3;">${imovel.textoMobilidade || "Excelente malha de transporte público nas proximidades do local."}</p>
            </div>
        </div>
    `;

    // Fecha a div principal do grid
    estruturaGridHTML += `</div>`;

    // Bloco de Preço Inferior do Container
    if (imovel.precoChave) {
        estruturaGridHTML += `
            <div class="container-preco">
                <div class="preco-label">A partir de:</div>
                <div class="preco-botao">${imovel.precoChave}</div>
            </div>
        `;
    }

    containerGridDetalhes.innerHTML = estruturaGridHTML;
    container.appendChild(containerGridDetalhes);

    // Renderiza a tabela compacta de preços complementares se houver dados
    renderizarTabelaPrecosAdicionais(container, imovel);

    // Renderiza os cards de materiais de vendas e links do drive
    renderizarCardsMateriais(container, imovel);
}

/**
 * Cria a tabela de preços secundários em formato enxuto
 */
function renderizarTabelaPrecosAdicionais(container, imovel) {
    if (!imovel.precoTabela && !imovel.precoAto) return;

    const tabelaContainer = document.createElement("div");
    tabelaContainer.className = "tabela-precos-container";

    tabelaContainer.innerHTML = `
        <div class="tabela-header">
            <div class="col-tabela">PREÇO DE TABELA</div>
            <div class="col-tabela" style="border-right:none;">SUGESTÃO DE ATO</div>
        </div>
        <div class="tabela-row">
            <div class="col-tabela col-laranja">${imovel.precoTabela || "-"}</div>
            <div class="col-tabela" style="border-right:none; font-weight:bold; color:#333;">${imovel.precoAto || "-"}</div>
        </div>
    `;
    container.appendChild(tabelaContainer);
}

/**
 * Renderiza a lista de arquivos e links com suporte ao Preview Flutuante Dinâmico
 */
function renderizarCardsMateriais(container, imovel) {
    const blocoMateriais = document.createElement("div");
    blocoMateriais.style = "margin-top:12px;";

    const materiaisDisponiveis = [
        { nome: "Implantação Bloco", url: imovel.matImplantacao, icone: "📐" },
        { nome: "Tabela de Vendas", url: imovel.matTabela, icone: "📊" },
        { nome: "Book Digital", url: imovel.matBook, icone: "📖" }
    ];

    materiaisDisponiveis.forEach(material => {
        if (!material.url) return; // Ignora se o link não existir na planilha

        const card = document.createElement("div");
        card.className = "card-material-item";
        card.innerHTML = `
            <div class="card-material-left">
                <span class="card-icon">${material.icone}</span>
                <span class="card-text">${material.nome}</span>
            </div>
            <div class="card-material-right">
                <div class="btn-com-preview">
                    <a href="${material.url}" target="_blank" class="card-btn-abrir">Abrir</a>
                </div>
                <button class="card-btn-copiar">Copiar</button>
            </div>
        `;

        // Ativa o rastreador de cursor para exibir o Preview Flutuante neste link
        vincularEventosDePreview(card.querySelector(".btn-com-preview"), material.url);

        // Ativa a função de cópia rápida para a área de transferência com Toast
        card.querySelector(".card-btn-copiar").addEventListener("click", () => {
            executarCopiaLink(material.url);
        });

        blocoMateriais.appendChild(card);
    });

    container.appendChild(blocoMateriais);
}

/* ==========================================================================
   6. SISTEMA DE PREVIEW FLUTUANTE DINÂMICO (MOUSE TRACKER)
   ========================================================================== */
/**
 * Constrói o container invisível na raiz do body para o preview flutuante
 */
function criarEstruturaPreviewFlutuante() {
    let containerPreview = document.getElementById("preview-flutuante-drive");
    if (!containerPreview) {
        containerPreview = document.createElement("div");
        containerPreview.id = "preview-flutuante-drive";
        containerPreview.style = `
            position: fixed;
            display: none;
            width: 320px;
            height: 210px;
            z-index: 10000;
            pointer-events: none;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
        `;
        document.body.appendChild(containerPreview);
    }
}

/**
 * Vincula as coordenadas e eventos do mouse para exibir o iframe flutuante do Drive
 */
function vincularEventosDePreview(elementoGatilho, urlMaterial) {
    const containerPreview = document.getElementById("preview-flutuante-drive");
    if (!elementoGatilho || !containerPreview) return;

    elementoGatilho.addEventListener("mouseenter", () => {
        // Converte o link padrão do Drive para a versão limpa de visualização do iframe
        let urlPreview Limpa = urlMaterial;
        if (urlMaterial.includes("drive.google.com")) {
            urlPreviewLimpa = urlMaterial.replace("/view", "/preview").replace("/edit", "/preview");
        }

        containerPreview.innerHTML = `
            <iframe src="${urlPreviewLimpa}" 
                    style="width:130%; height:160%; border:none; margin-top:-45px; margin-left:-15px; pointer-events:none;">
            </iframe>
        `;
        containerPreview.style.display = "block";
    });

    elementoGatilho.addEventListener("mousemove", (evento) => {
        // Posiciona a caixinha de preview ligeiramente deslocada do cursor para não cobrir o clique
        containerPreview.style.left = `${evento.clientX + 15}px`;
        containerPreview.style.top = `${evento.clientY - 110}px`;
    });

    elementoGatilho.addEventListener("mouseleave", () => {
        containerPreview.style.display = "none";
        containerPreview.innerHTML = "";
    });
}

/* ==========================================================================
   7. AUXILIARES E MODAIS (TOAST / WHATSAPP)
   ========================================================================== */
/**
 * Executa a cópia para o clipboard do usuário e dispara a notificação flutuante
 */
function executarCopiaLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        let caixaToast = document.querySelector(".toast-notificacao");
        if (!caixaToast) {
            caixaToast = document.createElement("div");
            caixaToast.className = "toast-notificacao";
            document.body.appendChild(caixaToast);
        }
        
        caixaToast.innerHTML = `✅ Link copiado com sucesso!`;
        caixaToast.classList.add("mostrar");

        setTimeout(() => {
            caixaToast.classList.remove("mostrar");
        }, 2500);
    }).catch(err => {
        console.error("Falha ao copiar link de material: ", err);
    });
}

/**
 * Abre o Modal Sobre o Sistema
 */
function abrirModalSobre() {
    const modal = document.getElementById("modal-sobre");
    if (modal) modal.style.display = "block";
}

/**
 * Fecha o Modal Sobre o Sistema
 */
function fecharModalSobre() {
    const modal = document.getElementById("modal-sobre");
    if (modal) modal.style.display = "none";
}
