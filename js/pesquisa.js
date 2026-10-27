const pedidosNomes = {};
const enderecoApi = "http://localhost:3000/api";

async function consultarApi(caminho, opcoes) {
    const respostaApi = await fetch(enderecoApi + caminho, opcoes);
    const dados = await respostaApi.json();
    if (!respostaApi.ok) {
        throw new Error(dados.erro || "Não foi possível consultar o servidor");
    }
    return dados;
}

function normalizarPesquisa(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim().toLowerCase().replace(/\s+/g, "-");
}

async function carregarNomes(tipoCatalogo = "pokemon") {
    // Compartilha o mesmo pedido entre sugestões e Enter, permitindo nova tentativa se falhar.
    if (!pedidosNomes[tipoCatalogo]) {
        const caminho = tipoCatalogo === "itens" ? "/itens/nomes" : "/pokemons/nomes";
        pedidosNomes[tipoCatalogo] = consultarApi(caminho);
    }
    try {
        return await pedidosNomes[tipoCatalogo];
    } catch (erro) {
        delete pedidosNomes[tipoCatalogo];
        throw erro;
    }
}

// Calcula quantas letras precisam ser inseridas, removidas ou substituídas.
function distanciaEntrePalavras(primeira, segunda) {
    let linhaAnterior = [];
    for (let coluna = 0; coluna <= segunda.length; coluna++) {
        linhaAnterior.push(coluna);
    }
    for (let linha = 1; linha <= primeira.length; linha++) {
        const linhaAtual = [linha];
        for (let coluna = 1; coluna <= segunda.length; coluna++) {
            const custo = primeira[linha - 1] === segunda[coluna - 1] ? 0 : 1;
            linhaAtual[coluna] = Math.min(linhaAnterior[coluna] + 1,
                linhaAtual[coluna - 1] + 1, linhaAnterior[coluna - 1] + custo);
        }
        linhaAnterior = linhaAtual;
    }
    return linhaAnterior[segunda.length];
}

function encontrarNomes(termo, catalogo) {
    const correspondencias = catalogo.filter(function (registro) {
        return registro.name.includes(termo) || String(registro.id) === termo;
    });
    if (correspondencias.length > 0 || termo.length < 3 || /^\d+$/.test(termo)) {
        return { registros: correspondencias, aproximados: false };
    }
    const limite = termo.length > 7 ? 2 : 1;
    const proximos = catalogo.map(function (registro) {
        return { registro: registro, distancia: distanciaEntrePalavras(termo, registro.name) };
    }).filter(function (item) {
        return item.distancia <= limite;
    });
    proximos.sort(function (primeiro, segundo) {
        return primeiro.distancia - segundo.distancia;
    });
    return {
        registros: proximos.slice(0, 5).map(function (item) { return item.registro; }),
        aproximados: true
    };
}

// Cada campo tem seu temporizador e versão; as regras de busca são compartilhadas.
function prepararSugestoes(campo, areaSugestoes, aoEscolher, categoria, tipoCatalogo = "pokemon") {
    let tempoSugestoes;
    let versaoSugestoes = 0;

    function limparSugestoes() {
        clearTimeout(tempoSugestoes);
        versaoSugestoes++;
        areaSugestoes.innerHTML = "";
    }

    campo.addEventListener("input", function () {
        limparSugestoes();
        const termo = normalizarPesquisa(campo.value);
        if (termo === "") {
            return;
        }
        const tipo = categoria ? categoria.value : tipoCatalogo;
        const consultaAtual = versaoSugestoes;
        tempoSugestoes = setTimeout(async function () {
            try {
                const catalogo = await carregarNomes(tipo);
                if (consultaAtual !== versaoSugestoes) {
                    return;
                }
                const resultado = encontrarNomes(termo, catalogo);
                resultado.registros.slice(0, 5).forEach(function (registro) {
                    const botao = document.createElement("button");
                    botao.type = "button";
                    botao.textContent = "Nº" + registro.id + " " + registro.name;
                    botao.addEventListener("click", function () {
                        limparSugestoes();
                        campo.value = registro.name;
                        aoEscolher();
                    });
                    areaSugestoes.appendChild(botao);
                });
            } catch (erro) {
                if (consultaAtual === versaoSugestoes) {
                    areaSugestoes.textContent = "Não foi possível carregar as sugestões. Tente novamente.";
                }
            }
        }, 250);
    });
    if (categoria) {
        categoria.addEventListener("change", limparSugestoes);
    }
    return limparSugestoes;
}
