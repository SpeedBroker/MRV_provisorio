
/* ==========================================================================
   SPEEDSIM - MOTOR DE SIMULAÇÃO COMPARATIVA CAIXA (SAC vs PRICE)
   ========================================================================== */

// ⚠️ INSIRA A URL DA SUA PLANILHA ENTRE AS ASPAS ABAIXO:
const MINHA_URL_PLANILHA = "https://script.google.com/macros/s/AKfycbxP-_GUwUsL3_RNHzyMYVxGRJOxFH48sH4X5pF0f18WwxyjpGUYCO60P2Ps5Ga_4ic/exec";

// Variáveis globais que guardarão as configurações vindas do Google Sheets
let CONFIG_MATRIZ_RENDA = [];
let CONFIG_TAXAS_GLOBAIS = {};

// Executa a carga dos dados assim que a janela terminar de carregar totalmente
window.addEventListener('load', () => {
    carregarAbaConfigSimulador();
});

/**
 * Busca os dados da aba ConfigSimulador da planilha e processa as matrizes e variáveis.
 */
async function carregarAbaConfigSimulador() {
    // Tenta usar a URL local do arquivo ou recorre à global do sistema se existir
    const urlBase = (typeof MINHA_URL_PLANILHA !== 'undefined' && MINHA_URL_PLANILHA !== "SUA_URL_DA_PLANILHA_AQUI") 
                    ? MINHA_URL_PLANILHA 
                    : (typeof URL_PLANILHA !== 'undefined' ? URL_PLANILHA : null);

    if (!urlBase) {
        console.error("SpeedSim Erro: URL da planilha não configurada no topo do simulador.js");
        return;
    }

    try {
        const urlCsv = urlBase.replace(/edit\?usp=sharing/, "gviz/tq?tqx=out:csv&sheet=ConfigSimulador")
                              .replace(/edit\?pli=1/, "gviz/tq?tqx=out:csv&sheet=ConfigSimulador");

        const resposta = await fetch(urlCsv);
        if (!resposta.ok) throw new Error("Não foi possível acessar a aba ConfigSimulador.");
        
        const textoCsv = await resposta.text();
        processarDadosConfig(textoCsv);
        
        // Após processar os dados da planilha com sucesso, monta a interface dentro do modal
        montarInterfaceSimulador();

    } catch (erro) {
        console.error("Erro ao carregar configurações do simulador Caixa:", erro);
    }
}

/**
 * Processa o texto CSV bruto vindo do Sheets e separa o lado esquerdo (Matriz) do direito (Globais).
 */
function processarDadosConfig(linhasCsv) {
    const linhas = linhasCsv.split(/\r?\n/);
    if (linhas.length <= 1) return;

    CONFIG_MATRIZ_RENDA = [];
    CONFIG_TAXAS_GLOBAIS = {};

    for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue;

        const colunas = linhas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());

        if (colunas[0] && colunas[0] !== "" && !isNaN(colunas[0].replace(',', '.'))) {
            const rendaMin = parseFloat(colunas[0].replace(',', '.'));
            const rendaMax = parseFloat(colunas[1].replace(',', '.'));
            const taxaSemFGTS = parseFloat(colunas[2].replace(',', '.'));
            const taxaComFGTS = parseFloat(colunas[3].replace(',', '.'));
            const faixaMCMV = colunas[4] || "";
            const subsidioMax = colunas[6] ? parseFloat(colunas[6].replace(',', '.')) : 0;

            CONFIG_MATRIZ_RENDA.push({ rendaMin, rendaMax, taxaSemFGTS, taxaComFGTS, faixaMCMV, subsidioMax });
        }

        if (colunas[8] && colunas[9] !== undefined && colunas[8] !== "") {
            const chaveParametro = colunas[8].trim();
            const valorBruto = colunas[9].replace(',', '.');
            const valorNumerico = parseFloat(valorBruto);

            CONFIG_TAXAS_GLOBAIS[chaveParametro] = !isNaN(valorNumerico) ? valorNumerico : colunas[9];
        }
    }

    console.log("SpeedSim - Dados carregados com sucesso!");
}

/**
 * Substitui o texto estático do modal pela interface ativa do simulador
 */
function montarInterfaceSimulador() {
    // Procura o contêiner interno do modal flutuante
    const containerModal = document.querySelector('.modal-content') || document.querySelector('.modal-body') || document.getElementById('modalSimulador');
    
    // Procura também pela área da mensagem interna do print para substituição direta
    const areaTextoInterno = document.querySelector('.speedsim-container') || document.querySelector('.modal-content p')?.parentElement;

    const targetElement = areaTextoInterno || containerModal;

    if (!targetElement) {
        console.warn("SpeedSim: Não foi possível localizar o contêiner interno do modal para renderizar a interface.");
        return;
    }

    // Injeta a estrutura de inputs estilizada
    targetElement.innerHTML = `
        <div style="font-family: sans-serif; color: #333; padding: 10px; text-align: left;">
            <p style="font-size: 14px; color: #666; margin-bottom: 20px; text-align: center;">
                Insira os dados do proponente para calcular as taxas e parcelas comparativas.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display:block; font-weight:bold; font-size:12px; margin-bottom:5px;">Valor do Imóvel (R$)</label>
                    <input type="number" id="sim-valor-imovel" value="250000" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block; font-weight:bold; font-size:12px; margin-bottom:5px;">Renda Bruta Familiar (R$)</label>
                    <input type="number" id="sim-renda" value="3000" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="display:block; font-weight:bold; font-size:12px; margin-bottom:5px;">Valor da Entrada / Sinal (R$)</label>
                    <input type="number" id="sim-entrada" value="50000" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                </div>
                <div>
                    <label style="display:block; font-weight:bold; font-size:12px; margin-bottom:5px;">Idade do Proponente (Anos)</label>
                    <input type="number" id="sim-idade" value="35" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
                </div>
            </div>

            <div style="background:#f9f9f9; padding:12px; border-radius:4px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px;">
                <label style="display:flex; align-items:center; font-size:13px; cursor:pointer;">
                    <input type="checkbox" id="sim-fgts" checked style="margin-right:8px;"> Possui 3 anos ou mais de trabalho sob regime do FGTS
                </label>
                <label style="display:flex; align-items:center; font-size:13px; cursor:pointer;">
                    <input type="checkbox" id="sim-dependentes" checked style="margin-right:8px;"> Possui dependente ou mais de um comprador (Fator Social)
                </label>
            </div>

            <button onclick="executarCalculoSimulacao()" style="width:100%; background:#1f5c33; color:#fff; border:none; padding:12px; font-size:15px; font-weight:bold; border-radius:4px; cursor:pointer; transition: background 0.2s;">
                Calcular Simulação SAC vs PRICE
            </button>

            <div id="resultado-simulacao" style="margin-top:20px;"></div>
        </div>
    `;
}

/**
 * Função temporária gatilho para testar o clique do botão
 */
function ejecutarCalculoSimulacao() {
    const renda = parseFloat(document.getElementById('sim-renda').value);
    alert('Botão integrado! Renda digitada: R$ ' + renda + '. Vamos criar o motor matemático na próxima etapa.');
}
