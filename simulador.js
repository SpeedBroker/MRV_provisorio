
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
        
        montarInterfaceSimulador();

    } catch (erro) {
        console.error("Erro ao carregar configurações do simulador Caixa:", erro);
    }
}

/**
 * Processa o texto CSV bruto vindo do Sheets e separa o lado esquerdo (Matriz) do direito (Globais).
 */
function processarDadosConfig(linhasCsv) {
    const lines = linhasCsv.split(/\r?\n/);
    if (lines.length <= 1) return;

    CONFIG_MATRIZ_RENDA = [];
    CONFIG_TAXAS_GLOBAIS = {};

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const colunas = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());

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
    console.log("SpeedSim - Configurações processadas com sucesso!");
}

/**
 * Substitui o texto estático do modal pela interface ativa do simulador
 */
function montarInterfaceSimulador() {
    const containerModal = document.querySelector('.modal-content') || document.querySelector('.modal-body') || document.getElementById('modalSimulador');
    const areaTextoInterno = document.querySelector('.speedsim-container') || document.querySelector('.modal-content p')?.parentElement;
    const targetElement = areaTextoInterno || containerModal;

    if (!targetElement) return;

    targetElement.innerHTML = `
        <div style="font-family: sans-serif; color: #333; padding: 10px; text-align: left; max-height: 78vh; overflow-y: auto;">
            <p style="font-size: 13px; color: #666; margin-bottom: 15px; text-align: center;">
                Gerenciador de simulação Caixa Econômica e fluxo de parcelamento da Construtora.
            </p>
            
            <!-- BLOCOR VALORES DE IMÓVEL COM SELEÇÃO RADIO -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                <div style="background: #fdfdfd; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <label style="display:flex; align-items:center; justify-content:space-between; font-weight:bold; font-size:11px; margin-bottom:4px; cursor:pointer;">
                        <span>Valor do Imóvel (Venda)</span>
                        <input type="radio" name="opcao-valor-base" value="venda" checked style="margin:0;">
                    </label>
                    <input type="number" id="sim-valor-imovel" value="230000" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box; font-size:13px;">
                </div>
                <div style="background: #fdfdfd; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <label style="display:flex; align-items:center; justify-content:space-between; font-weight:bold; font-size:11px; margin-bottom:4px; cursor:pointer;">
                        <span>Valor de Avaliação</span>
                        <input type="radio" name="opcao-valor-base" value="avaliacao" style="margin:0;">
                    </label>
                    <input type="number" id="sim-valor-avaliacao" value="240000" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box; font-size:13px;">
                </div>
            </div>

            <!-- BLOCO ENTRADAS DA PROPOSTA -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                    <label style="display:block; font-weight:bold; font-size:11px; margin-bottom:4px;">Sinal (R$)</label>
                    <input type="number" id="sim-sinal" value="10000" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box; font-size:13px;">
                </div>
                <div>
                    <label style="display:block; font-weight:bold; font-size:11px; margin-bottom:4px;">Uso de FGTS (R$)</label>
                    <input type="number" id="sim-valor-fgts" value="15000" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box; font-size:13px;">
                </div>
                <div>
                    <label style="display:block; font-weight:bold; font-size:11px; margin-bottom:4px;">Renda Familiar (R$)</label>
                    <input type="number" id="sim-renda" value="2800" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box; font-size:13px;">
                </div>
            </div>

            <!-- OUTROS PARÂMETROS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 12px;">
                <div>
                    <label style="display:block; font-weight:bold; font-size:11px; margin-bottom:4px;">Idade do Proponente Velho</label>
                    <input type="number" id="sim-idade" value="30" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box; font-size:13px;">
                </div>
                <div style="display: flex; flex-direction: column; justify-content: center; gap: 6px; background:#f8fafc; padding:6px; border-radius:4px; border:1px solid #e2e8f0;">
                    <label style="display:flex; align-items:center; font-size:11px; cursor:pointer; margin:0;">
                        <input type="checkbox" id="sim-fgts" checked style="margin-right:6px;"> +3 anos sob regime FGTS
                    </label>
                    <label style="display:flex; align-items:center; font-size:11px; cursor:pointer; margin:0;">
                        <input type="checkbox" id="sim-dependentes" checked style="margin-right:6px;"> Possui dependentes (Social)
                    </label>
                </div>
            </div>

            <button onclick="executarCalculoSimulacao()" style="width:100%; background:#1f5c33; color:#fff; border:none; padding:10px; font-size:14px; font-weight:bold; border-radius:4px; cursor:pointer; transition: background 0.2s; margin-top:5px;">
                Calcular Proposta Comercial
            </button>

            <div id="resultado-simulacao" style="margin-top:15px;"></div>
        </div>
    `;
}

/**
 * Motor de Cálculo Atualizado - Regras de Quota por Avaliação e Fluxo Construtora
 */
function executarCalculoSimulacao() {
    const valorImovel = parseFloat(document.getElementById('sim-valor-imovel').value) || 0;
    const valorAvaliacao = parseFloat(document.getElementById('sim-valor-avaliacao').value) || 0;
    const renda = parseFloat(document.getElementById('sim-renda').value) || 0;
    const sinal = parseFloat(document.getElementById('sim-sinal').value) || 0;
    const valorFGTS = parseFloat(document.getElementById('sim-valor-fgts').value) || 0;
    const idade = parseInt(document.getElementById('sim-idade').value) || 0;
    const temFGTS = document.getElementById('sim-fgts').checked;
    const temDependentes = document.getElementById('sim-dependentes').checked;

    // Detecta qual valor foi escolhido via Radio button para balizar a simulação
    const tipoValorSelecionado = document.querySelector('input[name="opcao-valor-base"]:checked').value;
    const valorBaseSimulacao = (tipoValorSelecionado === 'venda') ? valorImovel : valorAvaliacao;

    const divResultado = document.getElementById('resultado-simulacao');

    // Resgate das Variáveis Globais
    const limiteIdadeTotal = CONFIG_TAXAS_GLOBAIS['IdadeMaximaFinanciamento'] || 80;
    const taxaAdminMensal = CONFIG_TAXAS_GLOBAIS['TaxaAdministracao'] || 25.00;
    const seguroMIPAlquota = CONFIG_TAXAS_GLOBAIS['SeguroMorteInvalidez_MIP'] || 0.00021;
    const seguroDFIAlquota = CONFIG_TAXAS_GLOBAIS['SeguroDanosImovel_DFI'] || 0.00005;
    const tetoImovelSP = CONFIG_TAXAS_GLOBAIS['TetoImovel_SP'] || 350000;

    // Validação de teto do imóvel para SP
    if (valorImovel > tetoImovelSP) {
        divResultado.innerHTML = `<div style="color:red; background:#fff0f0; padding:10px; border-radius:4px; font-weight:bold; font-size:12px; border:1px solid #ffcccc;">⚠️ Erro: O valor de venda (R$ ${valorImovel.toLocaleString('pt-BR')}) ultrapassa o teto do MCMV para SP (R$ ${tetoImovelSP.toLocaleString('pt-BR')}).</div>`;
        return;
    }

    // 1. Encontra a faixa de renda na matriz
    let faixaEncontrada = CONFIG_MATRIZ_RENDA.find(f => renda >= f.rendaMin && renda <= f.rendaMax);
    if (!faixaEncontrada) {
        faixaEncontrada = CONFIG_MATRIZ_RENDA[CONFIG_MATRIZ_RENDA.length - 1] || { taxaSemFGTS: 0.0816, taxaComFGTS: 0.0766, subsidioMax: 0, faixaMCMV: "Faixa 3" };
    }

    const taxaAnual = temFGTS ? faixaEncontrada.taxaComFGTS : faixaEncontrada.taxaSemFGTS;
    const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;

    // 2. Cálculo do Subsídio MCMV Regressivo e Social
    let subsidioCalculado = 0;
    if (faixaEncontrada.subsidioMax > 0) {
        const deltaRenda = faixaEncontrada.rendaMax - faixaEncontrada.rendaMin;
        const proporcaoRenda = deltaRenda > 0 ? (renda - faixaEncontrada.rendaMin) / deltaRenda : 0;
        subsidioCalculado = faixaEncontrada.subsidioMax - (proporcaoRenda * (faixaEncontrada.subsidioMax * 0.6));
        
        if (!temDependentes) {
            subsidioCalculado = subsidioCalculado * 0.5;
        }
    }
    subsidioCalculado = Math.max(0, Math.round(subsidioCalculado));

    // 3. Determinação de Prazo Bancário
    const anosRestantes = limiteIdadeTotal - idade;
    const prazoMeses = Math.min(420, Math.max(12, anosRestantes * 12));

    // 4. Regra de Quota Caixa: Financiamento máximo de 80% do menor valor entre Venda e Avaliação
    const menorValorAvaliado = Math.min(valorImovel, valorAvaliacao);
    let financiamentoMaximoPermitido = menorValorAvaliado * 0.80;

    // O financiamento real não pode superar o saldo necessário após abater entrada mínima e subsídio
    let financiamentoBancarioReal = Math.min(financiamentoMaximoPermitido, valorImovel - subsidioCalculado);
    financiamentoBancarioReal = Math.max(0, financiamentoBancarioReal);

    // 5. ENTRADA REAL (Regra da proposta: Valor do Imóvel - Financiamento - Subsídio)
    const entradaRealGeral = valorImovel - financiamentoBancarioReal - subsidioCalculado;

    // SALDO CONSTRUTORA A PARCELAR: Entrada Real - Sinal - FGTS
    const saldoA_ParcelarMVR = entradaRealGeral - sinal - valorFGTS;

    // 6. Simulação de Parcelas Caixa (SAC)
    const amortizacaoSAC = financiamentoBancarioReal / prazoMeses;
    const primeiraParcelaSAC = amortizacaoSAC + (financiamentoBancarioReal * taxaMensal) + (financiamentoBancarioReal * seguroMIPAlquota) + (valorAvaliacao * seguroDFIAlquota) + taxaAdminMensal;
    const ultimaParcelaSAC = amortizacaoSAC + (amortizacaoSAC * taxaMensal) + (amortizacaoSAC * seguroMIPAlquota) + (valorAvaliacao * seguroDFIAlquota) + taxaAdminMensal;

    // 7. Simulação de Parcelas Caixa (PRICE)
    const fatorPrice = Math.pow(1 + taxaMensal, prazoMeses);
    const parcelaBasePrice = financiamentoBancarioReal * (taxaMensal * fatorPrice) / (fatorPrice - 1);
    const primeiraParcelaPrice = parcelaBasePrice + (financiamentoBancarioReal * seguroMIPAlquota) + (valorAvaliacao * seguroDFIAlquota) + taxaAdminMensal;

    // Renderização da Proposta
    divResultado.innerHTML = `
        <hr style="border:0; border-top:1px solid #e2e8f0; margin:12px 0;">
        
        <!-- FLUXO FINANCEIRO DA CONSTRUTORA -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px; margin-bottom:12px; font-size:12px;">
            <span style="font-weight:bold; color:#1e293b; text-transform:uppercase; font-size:11px; display:block; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:2px;">📋 Distribuição do Fluxo (Contrato)</span>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Valor do Imóvel:</span><strong>R$ ${valorImovel.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#475569;"><span>(-) Financiamento Caixa:</span><strong>R$ ${financiamentoBancarioReal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#16a34a;"><span>(-) Subsídio MCMV:</span><strong>R$ ${subsidioCalculado.toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong></div>
            
            <div style="display:flex; justify-content:space-between; margin-top:6px; background:#f1f5f9; padding:4px 6px; border-radius:4px; font-weight:bold; color:#b91c1c;">
                <span>(=) ENTRADA REAL DO CONTRATO:</span>
                <span>R$ ${entradaRealGeral.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-top:6px; margin-bottom:4px; padding-left:8px; color:#475569;"><span>(-) Sinal / Ato pago:</span><span>R$ ${sinal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; padding-left:8px; color:#475569;"><span>(-) FGTS Aplicado:</span><span>R$ ${valorFGTS.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
            
            <div style="display:flex; justify-content:space-between; margin-top:6px; background:#fffbeb; border:1px dashed #f59e0b; padding:6px; border-radius:4px; font-weight:bold; color:#b45309; font-size:13px;">
                <span>(=) SALDO A PARCELAR COM A MRV:</span>
                <span>R$ ${(saldoA_ParcelarMVR < 0 ? 0 : saldoA_ParcelarMVR).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            </div>
            ${saldoA_ParcelarMVR < 0 ? `<div style="color:green; font-size:10px; margin-top:4px; font-weight:bold;">* O FGTS + Sinal superaram a Entrada. Sobrou R$ ${Math.abs(saldoA_ParcelarMVR).toLocaleString('pt-BR')} para abater do financiamento Caixa!</div>` : ''}
        </div>

        <!-- QUADRO COMPARATIVO DAS PRESTAÇÕES BANCÁRIAS -->
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
                <tr style="background:#1f5c33; color:#fff; text-align:left;">
                    <th style="padding:6px; border-top-left-radius:4px; border-bottom-left-radius:4px;">Financiamento (${faixaEncontrada.faixaMCMV})</th>
                    <th style="padding:6px;">Tabela SAC</th>
                    <th style="padding:6px; border-top-right-radius:4px; border-bottom-right-radius:4px;">Tabela PRICE</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:6px; font-weight:bold;">Juros Nominal</td>
                    <td style="padding:6px;" colspan="2" style="text-align:center;"><strong>${(taxaAnual * 100).toFixed(2)}% a.a.</strong></td>
                </tr>
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:6px; font-weight:bold;">1ª Parcela Caixa</td>
                    <td style="padding:6px; color:#c1272d; font-weight:bold;">R$ ${primeiraParcelaSAC.toFixed(2).replace('.',',')}</td>
                    <td style="padding:6px; color:#1f5c33; font-weight:bold;">R$ ${primeiraParcelaPrice.toFixed(2).replace('.',',')}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee; background:#fdfdfd;">
                    <td style="padding:6px; font-weight:bold;">Última Parcela</td>
                    <td style="padding:6px; color:#1f5c33;">R$ ${ultimaParcelaSAC.toFixed(2).replace('.',',')}</td>
                    <td style="padding:6px; color:#666;">R$ ${primeiraParcelaPrice.toFixed(2).replace('.',',')}</td>
                </tr>
                <tr style="background:#f8fafc; font-size:10px; color:#64748b;">
                    <td style="padding:4px 6px;" colspan="3">Simulação para prazo de ${prazoMeses} meses. DFI calculado sobre R$ ${valorAvaliacao.toLocaleString('pt-BR')}.</td>
                </tr>
            </tbody>
        </table>
    `;
}
