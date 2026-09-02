const express = require('express');

const router = express.Router();
let pokemonCache = null;
let carregamentoCache = null;

async function obterListaPokemon() {
    if (pokemonCache) {
        return pokemonCache;
    }

    if (!carregamentoCache) {
        carregamentoCache = fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
            .then((resposta) => {
                if (!resposta.ok) {
                    throw new Error('Falha na PokeAPI');
                }

                return resposta.json();
            })
            .then((dados) => {
                if (!Array.isArray(dados.results)) {
                    throw new Error('Resposta inválida da PokeAPI');
                }

                pokemonCache = dados.results;
                return pokemonCache;
            })
            .finally(() => {
                carregamentoCache = null;
            });
    }

    return carregamentoCache;
}

function extrairId(url) {
    return Number(url.split('/').filter(Boolean).pop());
}

router.get('/', async (request, response) => {
    const valorPesquisa = request.query.q;
    const termo = typeof valorPesquisa === 'string'
        ? valorPesquisa.trim().toLowerCase()
        : '';

    if (!termo) {
        return response.status(400).json({ error: 'Informe um termo para pesquisa' });
    }

    try {
        const pokemons = await obterListaPokemon();
        const results = pokemons
            .filter((pokemon) => pokemon.name.includes(termo))
            .slice(0, 10)
            .map((pokemon) => ({
                id: extrairId(pokemon.url),
                name: pokemon.name
            }));

        return response.json({
            query: termo,
            total: results.length,
            results
        });
    } catch (error) {
        console.error('Erro ao pesquisar Pokémon:', error.message);
        return response.status(502).json({ error: 'Não foi possível pesquisar Pokémon' });
    }
});

module.exports = router;
