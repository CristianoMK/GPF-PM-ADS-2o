const express = require('express');

const rotas = express.Router();
let nomesCatalogo = [];

async function consultarPokeApi(caminho) {
    const respostaApi = await fetch('https://pokeapi.co/api/v2/' + caminho, {
        // Evita esperar indefinidamente quando a API externa não responde
        signal: AbortSignal.timeout(10000)
    });
    if (!respostaApi.ok) {
        const erro = new Error('Não foi possível consultar a PokéAPI');
        erro.status = respostaApi.status;
        throw erro;
    }
    return await respostaApi.json();
}

// Mantém a diferença entre um Pokémon inexistente e uma falha de comunicação
function responderErro(erro, resposta) {
    if (erro.status === 404) {
        return resposta.status(404).json({ erro: 'Pokémon ou tipo não encontrado' });
    }
    resposta.status(502).json({ erro: 'Não foi possível consultar a PokéAPI. Tente novamente.' });
}

async function buscarPokemon(identificador, resposta) {
    try {
        const pokemon = await consultarPokeApi('pokemon/' + encodeURIComponent(identificador));
        resposta.json(pokemon);
    } catch (erro) {
        responderErro(erro, resposta);
    }
}

// O índice guarda só nomes e IDs; não consulta os detalhes de centenas de Pokémon.
rotas.get('/pokemons/nomes', async function (requisicao, resposta) {
    try {
        if (nomesCatalogo.length === 0) {
            const primeiraPagina = await consultarPokeApi('pokemon?limit=1');
            const dados = await consultarPokeApi('pokemon?limit=' + primeiraPagina.count);
            nomesCatalogo = dados.results.map(function (pokemon) {
                const partes = pokemon.url.split('/');
                return { id: Number(partes[partes.length - 2]), name: pokemon.name };
            });
        }
        resposta.json(nomesCatalogo);
    } catch (erro) {
        responderErro(erro, resposta);
    }
});

rotas.get('/pokemon/:id/imagem-base', async function (requisicao, resposta) {
    const id = Number(requisicao.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        return resposta.status(400).json({ erro: 'Informe um ID inteiro positivo' });
    }
    try {
        const pokemon = await consultarPokeApi('pokemon/' + id);
        const especie = await consultarPokeApi('pokemon-species/' + encodeURIComponent(pokemon.species.name));
        const variedadeBase = especie.varieties.find(function (variedade) {
            return variedade.is_default;
        });
        if (!variedadeBase) {
            return resposta.status(404).json({ erro: 'Imagem da espécie base não encontrada' });
        }
        // A espécie informa a variedade base; não adivinhamos uma imagem por IDs próximos.
        const pokemonBase = await consultarPokeApi('pokemon/' + encodeURIComponent(variedadeBase.pokemon.name));
        resposta.json({
            nome: pokemonBase.name,
            artwork: pokemonBase.sprites.other?.['official-artwork']?.front_default || null,
            sprite: pokemonBase.sprites.front_default
        });
    } catch (erro) {
        responderErro(erro, resposta);
    }
});

rotas.get('/pokemons', async function (requisicao, resposta) {
    const inicio = Number(requisicao.query.inicio || 0);
    const tipo = requisicao.query.tipo;
    if ((requisicao.query.inicio !== undefined && typeof requisicao.query.inicio !== 'string') ||
        !Number.isSafeInteger(inicio) || inicio < 0 ||
        (tipo !== undefined && (typeof tipo !== 'string' || tipo.trim() === ''))) {
        return resposta.status(400).json({ erro: 'Informe um início válido e um tipo válido' });
    }
    try {
        let listaPokemon;
        let total;
        if (tipo) {
            // O endpoint de tipo contém todos os Pokémon desse tipo, não só os já carregados
            const dadosTipo = await consultarPokeApi('type/' + encodeURIComponent(tipo.trim().toLowerCase()));
            const listaTipo = dadosTipo.pokemon.map(function (item) {
                return item.pokemon;
            });
            total = listaTipo.length;
            listaPokemon = listaTipo.slice(inicio, inicio + 20);
        } else {
            const dados = await consultarPokeApi('pokemon?limit=20&offset=' + inicio);
            total = dados.count;
            listaPokemon = dados.results;
        }
        const pokemons = listaPokemon.map(function (pokemon) {
            // A URL termina em /pokemon/ID/. Aproveita esse ID sem pedir os detalhes
            const partes = pokemon.url.split('/');
            return { id: Number(partes[partes.length - 2]), name: pokemon.name };
        });
        resposta.json({ pokemons: pokemons, total: total, temMais: inicio + pokemons.length < total });
    } catch (erro) {
        responderErro(erro, resposta);
    }
});

// Busca todas as opções de tipo, mesmo as ausentes na primeira página
rotas.get('/tipos', async function (requisicao, resposta) {
    try {
        const dados = await consultarPokeApi('type?limit=100');
        resposta.json(dados.results.map(function (tipo) { return tipo.name; }));
    } catch (erro) {
        responderErro(erro, resposta);
    }
});

// Busca um Pokémon pelo seu número na Pokédex
rotas.get('/pokemon/:id', async function (requisicao, resposta) {
    // Converte o texto da URL em número e aceita somente inteiros positivos
    const id = Number(requisicao.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        return resposta.status(400).json({ erro: 'Informe um ID inteiro positivo' });
    }
    await buscarPokemon(String(id), resposta);
});

// Pesquisa o nome completo do Pokémon, ignorando espaços nas pontas e maiúsculas
rotas.get('/pesquisa', async function (requisicao, resposta) {
    const nomePokemon = requisicao.query.nome;
    if (typeof nomePokemon !== 'string' || nomePokemon.trim() === '') {
        return resposta.status(400).json({ erro: 'Informe um nome de Pokémon válido' });
    }
    await buscarPokemon(nomePokemon.trim().toLowerCase(), resposta);
});

module.exports = rotas;
