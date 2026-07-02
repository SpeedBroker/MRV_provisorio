// ==========================================================================
// MÓDULO INDEPENDENTE: ANÚNCIO CLIQUE-ÚNICO (ETAPA 1 - ASSISTENTE DE TRÁFEGO)
// ==========================================================================

// Simulação da base de dados que futuramente virá da aba "Anuncios" da Planilha
const MATRIZ_PERFIS_ANUNCIO = {
    "casal_jovem": {
        nome: "Perfil Casal Jovem (25-35 anos)",
        segmentacao: "Focado em Primeiro Imóvel, Sair do Aluguel e Recém-casados.",
        titulos: [
            "Realize o sonho do 1º apê! 🔑",
            "Chega de pagar aluguel hoje mesmo! 🚫🏠",
            "O seu novo começo planejado na MRV! 💍"
        ],
        textoBase: "🏢 Oportunidade Perfeita para Conquistar o seu Primeiro Apê!\n\nHora de planejar o futuro a dois no {NOME_IMOVEL} em {REGIAO_IMOVEL}. Conforto, segurança de condomínio fechado e condições de financiamento perfeitas para o seu bolso.\n\nClique em 'Saiba Mais' e simule agora pelo WhatsApp! 📲"
    },
    "familia": {
        nome: "Perfil Família (30-45 anos)",
        segmentacao: "Focado em Casados com filhos, busca por espaço, lazer e segurança.",
        titulos: [
            "Mais espaço e lazer para seus filhos! 🧸",
            "O condomínio fechado que sua família merece! 🌳",
            "Segurança e diversão sem sair de casa! 👮‍♂️"
        ],
        textoBase: "👨‍👩‍👧‍👦 O Lugar Perfeito para Ver Seus Filhos Crescerem com Segurança!\n\nVenha morar no {NOME_IMOVEL} em {REGIAO_IMOVEL}. Um residencial completo com área de lazer, piscina, portaria 24h e espaço de sobra para quem você mais ama.\n\nClique em 'Saiba Mais' para receber a tabela de valores! 📲"
    },
    "his": {
        nome: "Perfil Renda HIS (Foco em Subsídio)",
        segmentacao: "Focado em famílias de Habitação de Interesse Social, subsídio do governo e uso de FGTS.",
        titulos: [
            "Conquiste seu apê com o Subsídio do Governo! 🪙",
            "Entrada super facilitada e parcelada! 📉",
            "Use seu FGTS para a entrada do seu MRV! 💰"
        ],
        textoBase: "✨ Saia do Aluguel com as Maiores Facilidades do Ano!\n\nO {NOME_IMOVEL} em {REGIAO_IMOVEL} entra no programa habitacional com direito a subsídio recorde, parcelas menores que um aluguel e aprovação rápida de crédito.\n\nClique em 'Saiba Mais' e faça uma simulação gratuita! 📲"
    },
    "hmp": {
        nome: "Perfil HMP (Qualidade de Vida e Upgrade)",
        segmentacao: "Focado em Habitação de Mercado Popular, clientes buscando upgrade de moradia e localização.",
        titulos: [
            "O upgrade de vida que você estava esperando! 🚀",
            "Viva com total conforto e excelente localização! 📍",
            "Design moderno e lazer premium na sua região! 💎"
        ],
        textoBase: "🏢 Conforto, Modernidade e Praticidade Unificados em um Só Lugar!\n\nConheça o {NOME_IMOVEL} em {REGIAO_IMOVEL}. Apartamentos com excelente distribuição de espaço, acabamento diferenciado e localizado perto de tudo o que você precisa no seu dia a dia.\n\nClique em 'Saiba Mais' e agende sua visita ao decorado! 📲"
    }
};

function abrirModuloAnuncio() {
    let nomeImovel = "Residencial MRV Selecionado";
    let regiaoImovel = "São Paulo e Região";
    let urlImagemImovel = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60"; // Imagem padrão temporária

    // Busca dinâmica da tela usando a ponte segura com o desktop.js
    if (typeof window.obterDadosImovelAtual === 'function') {
        const dadosTela = window.obterDadosImovelAtual();
        if (dadosTela) {
            nomeImovel = dadosTela.nome;
            regiaoImovel = dadosTela.regiao;
            if (dadosTela.urlImagem) urlImagemImovel = dadosTela.urlImagem;
        }
    }

    criarEstruturaModalAnuncio(nomeImovel, regiaoImovel, urlImagemImovel);
}

function criarEstruturaModalAnuncio(nomeImovel, regiaoImovel, urlImagemImovel) {
    const backgroundModal = document.createElement('div');
    backgroundModal.id = 'modal-anuncio-container';
    backgroundModal.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.7); z-index: 99999;
        display: flex; justify-content: center; align-items: center;
        backdrop-filter: blur(4px); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    const corpoModal = document.createElement('div');
    corpoModal.style = `
        background: #ffffff; padding: 25px; border-radius: 12px;
        width: 960px; max-width: 95%; max-height: 90vh; overflow-y: auto;
        box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        display: flex; flex-direction: column; gap: 20px; box-sizing: border-box;
    `;

    // Cabeçalho unificado
    const cabecalhoHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f0f2f5; padding-bottom: 12px;">
            <h2 style="color: #004d24; margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 8px;">
                <span>🚀</span> Assistente de Marketing Direto — Etapa 1
            </h2>
            <span id="fechar-modal-anuncio" style="cursor:pointer; font-size: 26px; color: #999; font-weight: bold; line-height: 1;">&times;</span>
        </div>
    `;

    // Estrutura de Duas Colunas (Configurações vs Prévia)
    const containerColunasHTML = `
        <div style="display: flex; gap: 25px; flex-wrap: wrap;">
            
            <div style="flex: 1; min-width: 400px; display: flex; flex-direction: column; gap: 15px;">
                
                <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #f37021;">
                    <span style="font-size: 0.75rem; font-weight: bold; color: #f37021; text-transform: uppercase; display: block;">Produto Identificado</span>
                    <strong style="color: #333; font-size: 1rem;">${nomeImovel} (${regiaoImovel})</strong>
                </div>

                <div>
                    <label style="font-weight: bold; font-size: 0.85rem; color: #004d24; display: block; margin-bottom: 6px;">1. Selecione o Perfil do Lead Alvo:</label>
                    <select id="select-perfil-lead" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 0.9rem; background: #fff; font-weight: bold; color: #333;">
                        <option value="casal_jovem" selected>Perfil Casal Jovem (Idade: 25-35 | 1º Imóvel)</option>
                        <option value="familia">Perfil Família (Idade: 30-45 | Foco Filhos & Lazer)</option>
                        <option value="his">Perfil Renda HIS (Foco em Subsídios do Governo)</option>
                        <option value="hmp">Perfil HMP (Foco em Qualidade de Vida & Upgrade)</option>
                    </select>
                    <small id="desc-segmentacao" style="display:block; margin-top:5px; color:#666; font-style:italic; font-size:0.8rem;"></small>
                </div>

                <div>
                    <label style="font-weight: bold; font-size: 0.85rem; color: #004d24; display: block; margin-bottom: 6px;">2. Escolha o Título do Anúncio:</label>
                    <select id="select-titulo-anuncio" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 0.88rem; background: #fff; color: #333;"></select>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="font-weight: bold; font-size: 0.85rem; color: #333; display: block; margin-bottom: 6px;">Orçamento Diário:</label>
                        <select id="select-anuncio-verba" style="width: 100%; padding: 9px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.85rem; background: #fff;">
                            <option value="25" selected>R$ 25,00 / dia</option>
                            <option value="50">R$ 50,00 / dia</option>
                            <option value="100">R$ 100,00 / dia</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: bold; font-size: 0.85rem; color: #333; display: block; margin-bottom: 6px;">Geolocalização:</label>
                        <select id="select-anuncio-raio" style="width: 100%; padding: 9px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.85rem; background: #fff;">
                            <option value="10" selected>Raio de 10km do Stand</option>
                            <option value="15">Raio de 15km do Stand</option>
                            <option value="todo-municipio">Toda a Cidade</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label style="font-weight: bold; font-size: 0.85rem; color: #333; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span>Legenda Gerada (Copywriting):</span>
                        <button id="btn-copiar-copy" style="background:#004d24; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">📋 Copiar Texto</button>
                    </label>
                    <textarea id="txt-anuncio-copy" style="width: 100%; height: 120px; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 6px; font-size: 0.85rem; resize: none; line-height: 1.4; background:#fafafa; font-family: inherit;"></textarea>
                </div>
            </div>

            <div style="flex: 0.9; min-width: 360px; background: #f0f2f5; padding: 20px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="font-size: 0.75rem; font-weight: bold; color: #65676b; text-transform: uppercase; margin-bottom: 10px; display: block; width: 100%;">Prévia em tempo real (Feed Móvel):</span>
                
                <div style="background: #ffffff; width: 100%; max-width: 360px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); border: 1px solid #ced0d4; overflow: hidden; font-family: Helvetica, Arial, sans-serif;">
                    <div style="padding: 12px; display: flex; align-items: center; gap: 8px;">
                        <div style="width: 36px; height: 36px; background: #004d24; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem;">MRV</div>
                        <div>
                            <strong style="font-size: 0.88rem; color: #050505; display: block;">Meu Corretor MRV</strong>
                            <span style="font-size: 0.75rem; color: #65676b; display: flex; align-items: center; gap: 3px;">Patrocinado · 🌐</span>
                        </div>
                    </div>
                    <div id="previa-texto-feed" style="padding: 0 12px 10px 12px; font-size: 0.85rem; color: #050505; white-space: pre-line; line-height: 1.35; max-height: 80px; overflow: hidden; text-overflow: ellipsis;"></div>
                    
                    <div style="width: 100%; height: 200px; background-image: url('${urlImagemImovel}'); background-size: cover; background-position: center;"></div>
                    
                    <div style="background: #f0f2f5; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e5e5;">
                        <div style="flex: 1; padding-right: 10px;">
                            <span style="font-size: 0.72rem; color: #65676b; text-transform: uppercase; display: block;">WHATSAPP</span>
                            <strong id="previa-titulo-feed" style="font-size: 0.9rem; color: #050505; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Título do Anúncio</strong>
                        </div>
                        <button style="background: #e4e6eb; color: #050505; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 0.82rem; cursor: not-allowed; white-space: nowrap;">Enviar mensagem</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Rodapé com o botão Tutorial e Instruções da Etapa 1
    const rodapeHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 5px;">
            <div style="font-size: 0.8rem; color: #666; max-width: 60%;">
                💡 <strong>Próximo Passo:</strong> Copie o texto gerado acima e utilize a imagem do residencial para abrir sua campanha no Gerenciador de Anúncios.
            </div>
            <div style="display: flex; gap: 12px;">
                <button id="btn-anuncio-tutorial" style="background: #fe9a11; color: #004d24; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center; gap: 5px;">📖 Ver Passo a Passo</button>
                <button id="btn-anuncio-concluir" style="background: #f37021; color: #ffffff; border: none; padding: 10px 22px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(243,112,33,0.3);">Pronto!</button>
            </div>
        </div>
    `;

    corpoModal.innerHTML = cabecalhoHTML + containerColunasHTML + rodapeHTML;
    backgroundModal.appendChild(corpoModal);
    document.body.appendChild(backgroundModal);

    // --- ELEMENTOS DE CONTROLE DA INTERFACE ---
    const seletorPerfil = document.getElementById('select-perfil-lead');
    const seletorTitulo = document.getElementById('select-titulo-anuncio');
    const txtCopy = document.getElementById('txt-anuncio-copy');
    const descSegmentacao = document.getElementById('desc-segmentacao');
    
    const previaTextoFeed = document.getElementById('previa-texto-feed');
    const previaTituloFeed = document.getElementById('previa-titulo-feed');

    // --- FUNÇÃO DE ATUALIZAÇÃO DA TELA (DINAMISMO TOTAL) ---
    function atualizarCamposCampanha() {
        const perfilChave = seletorPerfil.value;
        const configPerfil = MATRIZ_PERFIS_ANUNCIO[perfilChave];

        if (!configPerfil) return;

        // Atualiza a descrição explicativa do público abaixo do seletor
        descSegmentacao.textContent = configPerfil.segmentacao;

        // Atualiza as 3 opções de títulos de forma limpa
        const tituloSalvoAntigo = seletorTitulo.value;
        seletorTitulo.innerHTML = '';
        configPerfil.titulos.forEach((titulo, idx) => {
            const opt = document.createElement('option');
            opt.value = titulo;
            opt.textContent = `Opção ${idx + 1}: ${titulo}`;
            if (titulo === tituloSalvoAntigo) opt.selected = true;
            seletorTitulo.appendChild(opt);
        });

        // Constrói a Copy substituindo as tags coringas do imóvel atual
        let textoCustomizado = configPerfil.textoBase
            .replace(/{NOME_IMOVEL}/g, nomeImovel)
            .replace(/{REGIAO_IMOVEL}/g, regiaoImovel);

        txtCopy.value = textoCustomizado;

        // Sincroniza instantaneamente com o Card de Prévia do Feed
        previaTextoFeed.textContent = textoCustomizado;
        previaTituloFeed.textContent = seletorTitulo.value || configPerfil.titulos[0];
    }

    // --- LISTENERS DE INTERATIVIDADE DIRETAS ---
    seletorPerfil.addEventListener('change', () => {
        seletorTitulo.innerHTML = ''; // reseta títulos para pegar os novos do perfil
        atualizarCamposCampanha();
    });
    
    seletorTitulo.addEventListener('change', () => {
        previaTituloFeed.textContent = seletorTitulo.value;
    });

    txtCopy.addEventListener('input', () => {
        previaTextoFeed.textContent = txtCopy.value;
    });

    // Botão de Copiar Texto
    document.getElementById('btn-copiar-copy').addEventListener('click', () => {
        txtCopy.select();
        txtCopy.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(txtCopy.value);
        
        const btn = document.getElementById('btn-copiar-copy');
        btn.textContent = "✅ Copiado!";
        btn.style.background = "#f37021";
        setTimeout(() => {
            btn.textContent = "📋 Copiar Texto";
            btn.style.background = "#004d24";
        }, 1500);
    });

    // Botão ver Passo a Passo (Tutorial Etapa 1)
    document.getElementById('btn-anuncio-tutorial').addEventListener('click', () => {
        const verba = document.getElementById('select-anuncio-verba').value;
        const raio = document.getElementById('select-anuncio-raio').value;
        const perfilTexto = seletorPerfil.options[seletorPerfil.selectedIndex].text;

        alert(`📖 TUTORIAL DE INSTALAÇÃO RÁPIDA (META ADS / GOOGLE):\n\n` +
              `1. Abra o seu Gerenciador de Anúncios e crie uma campanha de Engajamento/WhatsApp.\n` +
              `2. Na seção de Público, defina a localização para o endereço do stand da MRV.\n` +
              `3. Configure o raio de alcance para exatamente: ${raio}km.\n` +
              `4. Restrinja os dados demográficos baseando-se no ${perfilTexto}.\n` +
              `5. Defina o seu orçamento diário para iniciar com: R$ ${verba},00.\n` +
              `6. No criativo do anúncio, clique no botão "📋 Copiar Texto" no nosso sistema e cole no campo de Texto Principal do Meta.\n` +
              `7. Baixe a foto do residencial direto do Dashboard e suba na imagem do anúncio!`);
    });

    // Fechamento básico do modal
    const fecharModal = () => backgroundModal.remove();
    document.getElementById('fechar-modal-anuncio').addEventListener('click', fecharModal);
    document.getElementById('btn-anuncio-concluir').addEventListener('click', fecharModal);

    // Inicialização da primeira renderização
    atualizarCamposCampanha();
}

// --- Vinculação com o Botão de Interface do Painel Principal ---
document.addEventListener("DOMContentLoaded", () => {
    const btnAnuncioElemento = document.getElementById('btn-anuncio');
    if (btnAnuncioElemento) {
        btnAnuncioElemento.innerHTML = "🚀 Anúncio Clique-Único";
        btnAnuncioElemento.addEventListener('click', abrirModuloAnuncio);
    }
});
