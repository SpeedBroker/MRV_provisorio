// ==========================================================================
// MÓDULO INDEPENDENTE: ANÚNCIO CLIQUE-ÚNICO (META ADS / GOOGLE ADS)
// ==========================================================================

function abrirModuloAnuncio() {
    // Busca dinamicamente o OBJETO completo do imóvel que injetamos no escopo global do desktop.js
    const residencialAtivo = window.imovelObjetoAtivo; 

    // Tratamento seguro: se o corretor não tiver clicado em nada, adota termos padrão
    const nomeImovel = residencialAtivo && residencialAtivo.nome ? `Residencial ${residencialAtivo.nome}` : "Residencial MRV Selecionado";
    const regiaoImovel = residencialAtivo && residencialAtivo.regiao ? residencialAtivo.regiao : "São Paulo e Região";

    // Geração automática da Copy (Texto de Vendas) baseada no imóvel correto
    const textoAnuncioSugerido = `🏢 Oportunidade Única na MRV! \n\nVenha morar no ${nomeImovel} em ${regiaoImovel}. Conforto, segurança e condições especiais de financiamento que cabem no seu bolso.\n\nClique em 'Saiba Mais' e fale direto comigo pelo WhatsApp! 📲`;

    // Renderiza o Modal Flutuante na Interface
    criarEstruturaModalAnuncio(nomeImovel, textoAnuncioSugerido);
}

function criarEstruturaModalAnuncio(nome, textoCopy) {
    // 1. Cria a cortina de fundo escurecido
    const backgroundModal = document.createElement('div');
    backgroundModal.id = 'modal-anuncio-container';
    backgroundModal.style = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.65); z-index: 99999;
        display: flex; justify-content: center; align-items: center;
        backdrop-filter: blur(3px); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // 2. Cria a caixa centralizada do painel
    const corpoModal = document.createElement('div');
    corpoModal.style = `
        background: #ffffff; padding: 25px 30px; border-radius: 8px;
        width: 520px; max-width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: modalFadeIn 0.3s ease; box-sizing: border-box;
    `;

    // 3. Injeta o design completo do formulário de tráfego pago
    corpoModal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="color: #004d24; margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 8px;">
                <span>🚀</span> Painel de Tráfego Direto
            </h2>
            <span id="fechar-modal-anuncio" style="cursor:pointer; font-size: 24px; color: #999; font-weight: bold; line-height: 1;">&times;</span>
        </div>
        
        <p style="margin: 0 0 15px 0; font-size: 0.9rem; color: #555;">
            Configure e dispare campanhas regionais segmentadas no Meta Ads (Facebook/Instagram) e Google Ads com um único clique.
        </p>

        <div style="background: #f4f6f8; padding: 12px; border-radius: 6px; border-left: 4px solid #f37021; margin-bottom: 20px;">
            <span style="font-size: 0.75rem; font-weight: bold; color: #f37021; text-transform: uppercase; display: block;">Foco da Campanha</span>
            <strong style="color: #333; font-size: 0.95rem;">${nome}</strong>
        </div>

        <!-- Campo de Texto do Anúncio (Ajustado para melhor encaixe do texto) -->
        <div style="margin-bottom: 15px;">
            <label style="font-weight: bold; font-size: 0.85rem; color: #333; display: block; margin-bottom: 6px;">Legenda do Anúncio (Copywriting):</label>
            <textarea id="txt-anuncio-copy" style="width: 100%; height: 115px; padding: 12px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; font-size: 0.88rem; resize: none; line-height: 1.45; font-family: inherit;">${textoCopy}</textarea>
        </div>

        <!-- Linha Dupla: Orçamento e Raio de Alcance -->
        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
            <div style="flex: 1;">
                <label style="font-weight: bold; font-size: 0.85rem; color: #333; display: block; margin-bottom: 6px;">Orçamento (Verba Diária):</label>
                <select id="select-anuncio-verba" style="width: 100%; padding: 9px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.85rem; background: #fff;">
                    <option value="10">R$ 10,00 / dia (Mínimo)</option>
                    <option value="25" selected>R$ 25,00 / dia (Recomendado)</option>
                    <option value="50">R$ 50,00 / dia (Alta Conversão)</option>
                    <option value="100">R$ 100,00 / dia (Acelerar Plantão)</option>
                </select>
            </div>
            
            <div style="flex: 1;">
                <label style="font-weight: bold; font-size: 0.85rem; color: #333; display: block; margin-bottom: 6px;">Raio de Geolocalização:</label>
                <select id="select-anuncio-raio" style="width: 100%; padding: 9px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.85rem; background: #fff;">
                    <option value="5">Raio de 5km do Stand</option>
                    <option value="10" selected>Raio de 10km do Stand</option>
                    <option value="15">Raio de 15km do Stand</option>
                    <option value="todo-municipio">Toda a cidade de SP</option>
                </select>
            </div>
        </div>

        <!-- Botões de Ação -->
        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #eee; padding-top: 15px;">
            <button id="btn-anuncio-cancelar" style="background: #e4e6eb; color: #4b4f56; border: none; padding: 10px 18px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">Cancelar</button>
            <button id="btn-anuncio-disparar" style="background: #f37021; color: #ffffff; border: none; padding: 10px 22px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(243,112,33,0.3);">🚀 Publicar Campanha</button>
        </div>
    `;

    backgroundModal.appendChild(corpoModal);
    document.body.appendChild(backgroundModal);

    // --- Listeners de Eventos ---
    const fecharModal = () => backgroundModal.remove();
    document.getElementById('fechar-modal-anuncio').addEventListener('click', fecharModal);
    document.getElementById('btn-anuncio-cancelar').addEventListener('click', fecharModal);

    document.getElementById('btn-anuncio-disparar').addEventListener('click', () => {
        const verbaEscolhida = document.getElementById('select-anuncio-verba').value;
        const raioEscolhido = document.getElementById('select-anuncio-raio').value;
        
        alert(`🚨 SIMULAÇÃO DE MARKETING CLIQUE-ÚNICO:\n\n` +
              `• Imóvel: ${nome}\n` +
              `• Orçamento: R$ ${verbaEscolhida},00 por dia\n` +
              `• Geolocalização: Selecionada com sucesso (${raioEscolhido}km)\n\n` +
              `Sistema pronto para receber tokens de API da Diretoria da MRV para publicação imediata em produção!`);
              
        fecharModal();
    });
}
