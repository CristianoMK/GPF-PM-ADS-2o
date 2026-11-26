const pedidosNomes = {};
function normalizarPesquisa(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim().toLowerCase().replace(/\s+/g, "-");
}

async function carregarNomes(tipoCatalogo = "pokemon") {
    // Compartilha o mesmo pedido entre sugestões e Enter, permitindo nova tentativa se falhar.
    if (!pedidosNomes[tipoCatalogo]) {
        pedidosNomes[tipoCatalogo] = listarNomes(tipoCatalogo === "itens" ? "item" : "pokemon");
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
    const distancias = [];
    for (let linha = 0; linha <= primeira.length; linha++) {
        distancias[linha] = [linha];
    }
    for (let coluna = 0; coluna <= segunda.length; coluna++) {
        distancias[0][coluna] = coluna;
    }

    // Cada posição guarda quantas alterações são necessárias até essas letras.
    for (let linha = 1; linha <= primeira.length; linha++) {
        for (let coluna = 1; coluna <= segunda.length; coluna++) {
            if (primeira[linha - 1] === segunda[coluna - 1]) {
                distancias[linha][coluna] = distancias[linha - 1][coluna - 1];
            } else {
                const removerLetra = distancias[linha - 1][coluna] + 1;
                const adicionarLetra = distancias[linha][coluna - 1] + 1;
                const trocarLetra = distancias[linha - 1][coluna - 1] + 1;
                distancias[linha][coluna] = Math.min(removerLetra, adicionarLetra, trocarLetra);
            }
        }
    }
    return distancias[primeira.length][segunda.length];
}

function encontrarNomes(termo, catalogo) {
    const correspondencias = catalogo.filter(function (registro) {
        return registro.name.includes(termo) || String(registro.id) === termo;
    });
    if (correspondencias.length > 0 || termo.length < 3 || /^\d+$/.test(termo)) {
        return { registros: correspondencias, aproximados: false };
    }
    const limite = termo.length > 7 ? 2 : 1;
    const proximos = [];
    for (const registro of catalogo) {
        if (Math.abs(registro.name.length - termo.length) > limite) {
            continue;
        }
        const distancia = distanciaEntrePalavras(termo, registro.name);
        if (distancia <= limite) {
            proximos.push({ registro: registro, distancia: distancia });
        }
    }
    proximos.sort(function (primeiro, segundo) {
        return primeiro.distancia - segundo.distancia;
    });

    const sugestoes = [];
    for (const item of proximos.slice(0, 5)) {
        sugestoes.push(item.registro);
    }
    return { registros: sugestoes, aproximados: true };
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
