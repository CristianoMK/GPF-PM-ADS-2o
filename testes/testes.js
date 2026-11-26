(async function () {
    const resultado = document.getElementById('resultado');
    const originalFetch = window.fetch;
    const chaves = ['pokedex-favoritos-v1', 'favoritos'];
    const anteriores = chaves.map(function (chave) { return localStorage.getItem(chave); });
    let chamadas = 0;
    const respostas = {
        'pokemon?limit=20&offset=0': { count: 21, results: [{ name: 'bulbasaur', url: '/pokemon/1/' }] },
        'type/fire': { pokemon: [{ pokemon: { name: 'charmander', url: '/pokemon/4/' } }] },
        'pokemon/25': { id: 25, name: 'pikachu' },
        'pokemon-species/eevee': { evolution_chain: { url: '/evolution-chain/67/' } },
        'evolution-chain/67': { chain: { species: { name: 'eevee' }, evolves_to: [{}, {}] } },
        'item/1': { id: 1, name: 'master-ball', names: [], category: { name: 'balls' }, sprites: { default: 'imagem' }, effect_entries: [{ short_effect: 'Efeito', language: { name: 'pt' } }], flavor_text_entries: [], prices: [] },
        'item-category/balls': { name: 'balls', names: [], pocket: { name: 'pokeballs' }, items: [{ name: 'master-ball', url: '/item/1/' }] },
        'item-pocket/pokeballs': { names: [] },
        'type?limit=100': { results: [{ name: 'fire' }] }
    };
    window.fetch = async function (url) {
        chamadas++;
        const dados = respostas[url.replace('https://pokeapi.co/api/v2/', '')];
        return { ok: Boolean(dados), status: dados ? 200 : 404, json: async function () { return dados; } };
    };
    function verificar(condicao, mensagem) { if (!condicao) throw new Error(mensagem); }
    try {
        const pagina = await listarPokemons();
        verificar(pagina.pokemons[0].id === 1 && pagina.temMais, 'Paginação');
        verificar((await listarPokemons(0, 'fire')).pokemons[0].id === 4, 'Filtro de tipo');
        verificar((await listarItens(0, 'balls')).itens[0].id === 1, 'Filtro de categoria');
        verificar((await buscarTipos())[0] === 'fire', 'Tipos');
        const antes = chamadas;
        verificar((await Promise.all([buscarPokemon(25), buscarPokemon(25)]))[0].name === 'pikachu' && chamadas === antes + 1, 'Pesquisa e cache');
        verificar((await buscarEvolucoes('eevee')).evolves_to.length === 2, 'Evoluções');
        verificar((await buscarItem(1)).descricao === 'Efeito', 'Detalhes do item');
        verificar(encontrarNomes('pik', [{ id: 25, name: 'pikachu' }]).registros.length === 1, 'Pesquisa por nome');
        localStorage.removeItem(chaves[0]);
        localStorage.setItem(chaves[1], JSON.stringify([{ id: 25 }, { id: 25 }, 1]));
        verificar(lerFavoritosLocais().join(',') === '25,1', 'Migração e duplicados');
        for (let id = 2; id <= 7; id++) adicionarFavoritoLocal(id);
        verificar(lerFavoritosLocais().length === 8 && JSON.parse(localStorage.getItem(chaves[0])).length === 8, 'Mais de cinco favoritos persistidos');
        let duplicado = false;
        try { adicionarFavoritoLocal(25); } catch (erro) { duplicado = true; }
        verificar(duplicado && lerFavoritosLocais().length === 8, 'Impedir duplicação');
        removerFavoritoLocal(25);
        verificar(!lerFavoritosLocais().includes(25), 'Remover favorito');
        resultado.textContent = 'Todos os testes passaram.';
        document.title = 'Testes passaram';
    } catch (erro) {
        resultado.textContent = 'Falha: ' + erro.message;
        document.title = 'Testes falharam';
    } finally {
        window.fetch = originalFetch;
        chaves.forEach(function (chave, indice) {
            if (anteriores[indice] === null) localStorage.removeItem(chave);
            else localStorage.setItem(chave, anteriores[indice]);
        });
    }
})();
