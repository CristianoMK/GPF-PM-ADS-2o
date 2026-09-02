const pokeapiService = require('../services/pokeapiService');

const VALID_IDENTIFIER = /^[a-z0-9-]+$/i;

function getValidName(value) {
    const name = String(value || '').trim().toLowerCase();
    return VALID_IDENTIFIER.test(name) ? name : null;
}

function getValidId(value) {
    return /^[1-9]\d*$/.test(String(value)) ? Number(value) : null;
}

function handlePokeApiError(error, response, notFoundMessage) {
    if (error instanceof pokeapiService.PokeApiError) {
        if (error.status === 404) {
            return response.status(404).json({ error: notFoundMessage });
        }

        return response.status(error.status).json({ error: error.message });
    }

    console.error('Erro inesperado na consulta à PokeAPI:', error.message);
    return response.status(500).json({ error: 'Erro interno do servidor' });
}

async function getByName(request, response) {
    const name = getValidName(request.params.nome);

    if (!name) {
        return response.status(400).json({ error: 'Nome de Pokémon inválido' });
    }

    try {
        return response.json(await pokeapiService.getPokemon(name));
    } catch (error) {
        return handlePokeApiError(error, response, 'Pokemon não encontrado');
    }
}

async function getById(request, response) {
    const id = getValidId(request.params.id);

    if (!id) {
        return response.status(400).json({ error: 'ID inválido' });
    }

    try {
        return response.json(await pokeapiService.getPokemon(id));
    } catch (error) {
        return handlePokeApiError(error, response, 'Pokemon não encontrado');
    }
}

async function search(request, response) {
    const query = getValidName(request.query.q);

    if (!query) {
        return response.status(400).json({ error: 'Termo de pesquisa inválido' });
    }

    try {
        const results = await pokeapiService.searchPokemon(query);
        return response.json({ query, results });
    } catch (error) {
        return handlePokeApiError(error, response, 'Pokemon não encontrado');
    }
}

async function getByType(request, response) {
    const type = getValidName(request.params.tipo);

    if (!type) {
        return response.status(400).json({ error: 'Tipo inválido' });
    }

    try {
        const pokemon = await pokeapiService.getPokemonByType(type);
        return response.json({ type, pokemon });
    } catch (error) {
        return handlePokeApiError(error, response, 'Tipo não encontrado');
    }
}

async function getSpecies(request, response) {
    const identifier = getValidId(request.params.id) || getValidName(request.params.id);

    if (!identifier) {
        return response.status(400).json({ error: 'Identificador de Pokémon inválido' });
    }

    try {
        return response.json(await pokeapiService.getPokemonSpecies(identifier));
    } catch (error) {
        return handlePokeApiError(error, response, 'Espécie não encontrada');
    }
}

module.exports = { getByName, getById, search, getByType, getSpecies };
