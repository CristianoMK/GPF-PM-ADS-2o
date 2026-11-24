const pedidosNomes = {};
// A mesma resposta é compartilhada entre consultas concorrentes; falhas podem ser tentadas novamente.
const cachePokeApi = new Map();
const filaPokeApi = [];
let requisicoesAtivas = 0;
const limiteRequisicoes = 6;

// Limita os pedidos simultâneos para não sobrecarregar a rede ou a API.
function executarFila() {
    while (requisicoesAtivas < limiteRequisicoes && filaPokeApi.length) {
        requisicoesAtivas++;
        filaPokeApi.shift()().finally(function () { requisicoesAtivas--; executarFila(); });
    }
}
// Guarda a promessa enquanto o pedido está em andamento e depois da resposta.
function pokeApi(caminho) {
    if (!cachePokeApi.has(caminho)) {
        const pedido = new Promise(function (resolve, reject) {
            filaPokeApi.push(async function () {
                const controller = new AbortController();
                const tempo = setTimeout(function () { controller.abort(); }, 15000);
                try {
                    const resposta = await fetch('https://pokeapi.co/api/v2/' + caminho, { signal: controller.signal });
                    if (!resposta.ok) {
                        const erro = new Error(resposta.status === 404 ? 'Registro não encontrado.' : 'Não foi possível consultar a PokéAPI. Tente novamente.');
                        erro.status = resposta.status;
                        throw erro;
                    }
                    resolve(await resposta.json());
                } catch (erro) {
                    reject(erro.status ? erro : new Error('Não foi possível conectar à PokéAPI. Verifique sua conexão e tente novamente.'));
                } finally { clearTimeout(tempo); }
            });
            executarFila();
        });
        cachePokeApi.set(caminho, pedido);
        // Uma falha não fica no cache, assim a próxima tentativa pode funcionar.
        pedido.catch(function () { cachePokeApi.delete(caminho); });
    }
    return cachePokeApi.get(caminho);
}
function resumirApi(lista) {
    return lista.map(function (item) { return { id: Number(item.url.split('/').filter(Boolean).pop()), name: item.name }; });
}
function traducaoApi(lista) {
    return lista.find(function (x) { return x.language.name.startsWith('pt'); }) ||
        lista.find(function (x) { return x.language.name === 'en'; }) || lista[0];
}
const chaveFavoritos = 'pokedex-favoritos-v1';

// Aceita os formatos antigos com objetos ou IDs sem precisar consultar a API.
function lerFavoritosLocais() {
    const textoAtual = localStorage.getItem(chaveFavoritos);
    const texto = textoAtual === null ? localStorage.getItem('favoritos') : textoAtual;
    if (texto === null) return [];

    let dados;
    try {
        dados = JSON.parse(texto);
    } catch (erro) {
        return [];
    }
    if (!Array.isArray(dados)) return [];

    const ids = [];
    for (const registro of dados) {
        const valor = registro && typeof registro === 'object' ? registro.id : registro;
        const id = typeof valor === 'string' && /^\d+$/.test(valor) ? Number(valor) : valor;
        if (Number.isSafeInteger(id) && id > 0 && !ids.includes(id)) {
            ids.push(id);
        }
    }
    // Converte a lista anterior apenas depois de conseguir ler seus dados.
    if (textoAtual === null || ids.length !== dados.length || dados.some(function (registro) { return typeof registro !== 'number'; })) {
        salvarFavoritosLocais(ids);
    }
    return ids;
}

function salvarFavoritosLocais(ids) {
    localStorage.setItem(chaveFavoritos, JSON.stringify(ids));
}

function adicionarFavoritoLocal(id) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('ID de Pokémon inválido');
    const ids = lerFavoritosLocais();
    if (ids.includes(id)) throw new Error('Pokémon já está nos favoritos');
    if (ids.length >= 5) throw new Error('Você pode salvar no máximo cinco favoritos');
    ids.push(id);
    salvarFavoritosLocais(ids);
    return ids;
}

function removerFavoritoLocal(id) {
    const ids = lerFavoritosLocais().filter(function (favorito) { return favorito !== id; });
    salvarFavoritosLocais(ids);
    return ids;
}
// Traduz as consultas usadas pelas telas para recursos da PokéAPI.
async function consultarApi(caminho) {
    const url = new URL(caminho, 'https://local.invalid');
    const partes = url.pathname.split('/').filter(Boolean);
    const tipo = partes[0];
    const id = partes[1];
    const inicio = Number(url.searchParams.get('inicio') || 0);
    if (tipo === 'pokemons' && id === 'nomes' || tipo === 'itens' && id === 'nomes' || tipo === 'itens' && id === 'categorias') {
        const recurso = tipo === 'pokemons' ? 'pokemon' : id === 'categorias' ? 'item-category' : 'item';
        const primeiro = await pokeApi(recurso + '?limit=1');
        return resumirApi((await pokeApi(recurso + '?limit=' + primeiro.count)).results);
    }
    if (tipo === 'pokemons' || tipo === 'itens' && !id) {
        const pokemon = tipo === 'pokemons';
        const filtro = url.searchParams.get(pokemon ? 'tipo' : 'categoria');
        let lista, total;
        if (filtro) {
            const dados = await pokeApi((pokemon ? 'type/' : 'item-category/') + encodeURIComponent(filtro));
            const todos = pokemon ? dados.pokemon.map(function (x) { return x.pokemon; }) : dados.items;
            total = todos.length; lista = todos.slice(inicio, inicio + 20);
        } else {
            const dados = await pokeApi((pokemon ? 'pokemon' : 'item') + '?limit=20&offset=' + inicio);
            total = dados.count; lista = dados.results;
        }
        return { [pokemon ? 'pokemons' : 'itens']: resumirApi(lista), total: total, temMais: inicio + lista.length < total };
    }
    if (tipo === 'tipos') return (await pokeApi('type?limit=100')).results.map(function (x) { return x.name; });
    if (tipo === 'pesquisa') return pokeApi('pokemon/' + encodeURIComponent(url.searchParams.get('nome').trim().toLowerCase()));
    if (tipo === 'pokemon') {
        const pokemon = await pokeApi('pokemon/' + encodeURIComponent(id));
        if (!partes[2]) return pokemon;
        const especie = await pokeApi('pokemon-species/' + encodeURIComponent(pokemon.species.name));
        const base = especie.varieties.find(function (x) { return x.is_default; });
        if (!base) throw new Error('Imagem da espécie base não encontrada');
        const p = await pokeApi('pokemon/' + encodeURIComponent(base.pokemon.name));
        return { nome: p.name, artwork: p.sprites.other?.['official-artwork']?.front_default || null, sprite: p.sprites.front_default };
    }
    if (tipo === 'evolucoes') {
        const especie = await pokeApi('pokemon-species/' + encodeURIComponent(id));
        return especie.evolution_chain ? (await pokeApi('evolution-chain/' + especie.evolution_chain.url.split('/').filter(Boolean).pop())).chain : null;
    }
    if (tipo === 'itens' && id) return consultarDetalhesItem(id);
    throw new Error('Consulta desconhecida.');
}

// Reúne dados de três recursos da PokéAPI para mostrar o item na interface.
async function consultarDetalhesItem(id) {
    const item = await pokeApi('item/' + encodeURIComponent(decodeURIComponent(id).trim().toLowerCase()));
    const categoria = await pokeApi('item-category/' + encodeURIComponent(item.category.name));
    const bolso = await pokeApi('item-pocket/' + encodeURIComponent(categoria.pocket.name));
    // A API nem sempre possui tradução em português; a função também aceita inglês.
    const nome = traducaoApi(item.names);
    const nomeCategoria = traducaoApi(categoria.names);
    const nomeBolso = traducaoApi(bolso.names);
    const descricao = traducaoApi(item.effect_entries.length ? item.effect_entries : item.flavor_text_entries);
    // Prioriza o primeiro preço de compra disponível e, na ausência dele, o de venda.
    const precos = item.prices || [];
    const registro = precos.find(function (p) { return typeof p.purchase_price === 'number'; }) || precos.find(function (p) { return typeof p.sell_price === 'number'; });
    const compra = registro && typeof registro.purchase_price === 'number';
    return { id: item.id, nomeOriginal: item.name, nome: nome ? nome.name : item.name, idiomaNome: nome?.language.name || null,
        imagem: item.sprites.default, categoria: nomeCategoria ? nomeCategoria.name : categoria.name, idiomaCategoria: nomeCategoria?.language.name || null,
        bolso: nomeBolso ? nomeBolso.name : categoria.pocket.name, idiomaBolso: nomeBolso?.language.name || null,
        descricao: descricao ? (descricao.short_effect || descricao.effect || descricao.text).replace(/\s+/g, ' ') : null,
        idiomaDescricao: descricao?.language.name || null, versaoDescricao: descricao?.version_group?.name || null,
        preco: registro ? { tipo: compra ? 'Compra' : 'Venda', valor: compra ? registro.purchase_price : registro.sell_price, moeda: registro.currency.name, versao: registro.version_group.name } : null };
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
