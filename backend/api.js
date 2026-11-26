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
async function listarNomes(recurso) {
    const primeiro = await pokeApi(recurso + '?limit=1');
    return resumirApi((await pokeApi(recurso + '?limit=' + primeiro.count)).results);
}

async function listarCatalogo(recurso, inicio, filtro) {
    let lista, total;
    if (filtro) {
        const dados = await pokeApi((recurso === 'pokemon' ? 'type/' : 'item-category/') + encodeURIComponent(filtro));
        const todos = recurso === 'pokemon' ? dados.pokemon.map(function (x) { return x.pokemon; }) : dados.items;
        total = todos.length;
        lista = todos.slice(inicio, inicio + 20);
    } else {
        const dados = await pokeApi(recurso + '?limit=20&offset=' + inicio);
        total = dados.count;
        lista = dados.results;
    }
    return { registros: resumirApi(lista), total: total, temMais: inicio + lista.length < total };
}
async function listarPokemons(inicio = 0, tipo = '') {
    const dados = await listarCatalogo('pokemon', inicio, tipo);
    return { pokemons: dados.registros, total: dados.total, temMais: dados.temMais };
}
async function listarItens(inicio = 0, categoria = '') {
    const dados = await listarCatalogo('item', inicio, categoria);
    return { itens: dados.registros, total: dados.total, temMais: dados.temMais };
}
async function buscarTipos() {
    return (await pokeApi('type?limit=100')).results.map(function (tipo) { return tipo.name; });
}
function buscarPokemon(id) {
    return pokeApi('pokemon/' + encodeURIComponent(String(id).trim().toLowerCase()));
}
async function buscarImagemBase(id) {
    const pokemon = await buscarPokemon(id);
    const especie = await pokeApi('pokemon-species/' + encodeURIComponent(pokemon.species.name));
    const base = especie.varieties.find(function (variedade) { return variedade.is_default; });
    if (!base) throw new Error('Imagem da espécie base não encontrada');
    const dados = await buscarPokemon(base.pokemon.name);
    return { nome: dados.name, artwork: dados.sprites.other?.['official-artwork']?.front_default || null, sprite: dados.sprites.front_default };
}
async function buscarEvolucoes(id) {
    const especie = await pokeApi('pokemon-species/' + encodeURIComponent(id));
    return especie.evolution_chain ? (await pokeApi('evolution-chain/' + especie.evolution_chain.url.split('/').filter(Boolean).pop())).chain : null;
}
function buscarCategorias() { return listarNomes('item-category'); }

// Reúne dados de três recursos da PokéAPI para mostrar o item na interface.
async function buscarItem(id) {
    const item = await pokeApi('item/' + encodeURIComponent(String(id).trim().toLowerCase()));
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

