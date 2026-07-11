/* ==========================================================================
   SPEEDSIM - MOTOR DE SIMULAÇÃO COMPARATIVA CAIXA (SAC vs PRICE)
   ========================================================================== */

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
    // Utiliza a mesma constante URL_PLANILHA que já deve estar declarada globalmente no seu projeto
    if (typeof URL_PLANILHA === 'undefined' || !URL_PLANILHA) {
        console.error("SpeedSim Erro: URL_PLANILHA não está definida no escopo global.");
        return;
    }

    try {
        // Altera o parâmetro gid para apontar para a aba ConfigSimulador
        // OBSERVAÇÃO: Caso sua planilha exija o parâmetro tqx=out:csv, certifique-se de que o nome da aba está correto
        const urlCsv = URL_PLANILHA.replace(/edit\?usp=sharing/, "gviz/tq?tqx=out:csv&sheet=ConfigSimulador")
                                   .replace(/edit\?pli=1/, "gviz/tq?tqx=out:csv&sheet=ConfigSimulador");

        const resposta = await fetch(urlCsv);
        if (!resposta.ok) throw new Error("Não foi possível acessar a aba ConfigSimulador.");
        
        const textoCsv = await resposta.text();
        processarDadosConfig(textoCsv);

    } catch (erro) {
        console.error("Erro ao carregar configurações do simulador Caixa:", erro);
    }
}

/**
 * Processa o texto CSV bruto vindo do Sheets e separa o lado esquerdo (Matriz) do direito (Globais).
 */
function processarDadosConfig(linhasCsv) {
    // Divide o CSV por quebras de linha tratando retornos de carro
    const linhas = linhasCsv.split(/\r?\n/);
    if (linhas.length <= 1) return;

    // Limpa as variáveis globais para novos dados
    CONFIG_MATRIZ_RENDA = [];
    CONFIG_TAXAS_GLOBAIS = {};

    // Ignora o cabeçalho (linha 0) e percorre as linhas de dados
    for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue;

        // Expressão regular para quebrar colunas separadas por vírgula respeitando aspas de textos
        const colunas = linhas[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());

        // --- 1. PROCESSA LADO ESQUERDO: MATRIZ DE RENDA (Colunas A até G -> Índices 0 até 6) ---
        if (colunas[0] && colunas[0] !== "" && !isNaN(colunas[0].replace(',', '.'))) {
            const rendaMin = parseFloat(colunas[0].replace(',', '.'));
            const rendaMax = parseFloat(colunas[1].replace(',', '.'));
            const taxaSemFGTS = parseFloat(colunas[2].replace(',', '.'));
            const taxaComFGTS = parseFloat(colunas[3].replace(',', '.'));
            const faixaMCMV = colunas[4] || "";
            const subsidioMax = colunas[6] ? parseFloat(colunas[6].replace(',', '.')) : 0;

            CONFIG_MATRIZ_RENDA.push({
                rendaMin,
                rendaMax,
                taxaSemFGTS,
                taxaComFGTS,
                faixaMCMV,
                subsidioMax
            });
        }

        // --- 2. PROCESSA LADO DIREITO: PARÂMETROS GLOBAIS (Colunas I e J -> Índices 8 e 9) ---
        if (colunas[8] && colunas[9] !== undefined && colunas[8] !== "") {
            const chaveParametro = colunas[8].trim();
            const valorBruto = colunas[9].replace(',', '.');
            const valorNumerico = parseFloat(valorBruto);

            // Se for um número válido, guarda convertido, senão guarda o texto puro
            CONFIG_TAXAS_GLOBAIS[chaveParametro] = !isNaN(valorNumerico) ? valorNumerico : colunas[9];
        }
    }

    console.log("SpeedSim: Matriz de Rendas carregada com sucesso:", CONFIG_MATRIZ_RENDA);
    console.log("SpeedSim: Parâmetros Globais carregados com sucesso:", CONFIG_TAXAS_GLOBAIS);
}
