const POKEAPI_URL = 'https://pokeapi.co/api/v2';
const CACHE_DURATION = 10 * 60 * 1000;
const cache = new Map();

class PokeApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

function getCached(key) {
    const entry = cache.get(key);

    if (entry && entry.expiresAt > Date.now()) {
        return entry.data;
    }

    cache.delete(key);
    return null;
}

function setCached(key, data) {
    cache.set(key, {
        data,
        expiresAt: Date.now() + CACHE_DURATION
    });

    return data;
}

async function requestPokeApi(path) {
    const cached = getCached(path);

    if (cached) {
        return cached;
    }

    let response;

    try {
        response = await fetch(`${POKEAPI_URL}${path}`);
    } catch (error) {
        throw new PokeApiError('Não foi possível consultar a PokeAPI', 502);
    }

    if (response.status === 404) {
        throw new PokeApiError('Recurso não encontrado', 404);
    }

    if (!response.ok) {
        throw new PokeApiError('Não foi possível consultar a PokeAPI', 502);
    }

    return setCached(path, await response.json());
}

function simplifyPokemon(pokemon) {
    return {
        id: pokemon.id,
        name: pokemon.name,
        baseExperience: pokemon.base_experience,
        height: pokemon.height,
        weight: pokemon.weight,
        types: (pokemon.types || []).map((type) => type.type.name),
        abilities: (pokemon.abilities || []).map((ability) => ({
            name: ability.ability.name,
            hidden: ability.is_hidden
        })),
        moves: (pokemon.moves || []).map((move) => move.move.name),
        sprites: pokemon.sprites || {},
        cry: pokemon.cries?.latest || pokemon.cries?.legacy || null,
        speciesUrl: pokemon.species?.url || null
    };
}

async function getPokemon(identifier) {
    const pokemon = await requestPokeApi(`/pokemon/${encodeURIComponent(identifier)}`);
    return simplifyPokemon(pokemon);
}

async function searchPokemon(query) {
    const list = await requestPokeApi('/pokemon?limit=2000');
    const normalizedQuery = query.toLowerCase();

    return list.results
        .filter((pokemon) => pokemon.name.includes(normalizedQuery))
        .slice(0, 20)
        .map((pokemon) => ({
            id: Number(pokemon.url.split('/').filter(Boolean).pop()),
            name: pokemon.name
        }));
}

async function getPokemonByType(type) {
    const result = await requestPokeApi(`/type/${encodeURIComponent(type)}`);

    return result.pokemon.map((entry) => ({
        id: Number(entry.pokemon.url.split('/').filter(Boolean).pop()),
        name: entry.pokemon.name
    }));
}

function findPortugueseFlavorText(flavorTextEntries) {
    const portuguese = flavorTextEntries.find((entry) => entry.language.name === 'pt-BR');
    const english = flavorTextEntries.find((entry) => entry.language.name === 'en');
    const entry = portuguese || english;

    return entry ? entry.flavor_text.replace(/\f|\n/g, ' ') : null;
}

async function getPokemonSpecies(identifier) {
    const species = await requestPokeApi(`/pokemon-species/${encodeURIComponent(identifier)}`);

    return {
        id: species.id,
        name: species.name,
        generation: species.generation?.name || null,
        description: findPortugueseFlavorText(species.flavor_text_entries || []),
        habitat: species.habitat?.name || null,
        color: species.color?.name || null,
        captureRate: species.capture_rate,
        isLegendary: species.is_legendary,
        isMythical: species.is_mythical,
        evolvesFrom: species.evolves_from_species?.name || null,
        evolutionChainUrl: species.evolution_chain?.url || null
    };
}

module.exports = {
    PokeApiError,
    getPokemon,
    searchPokemon,
    getPokemonByType,
    getPokemonSpecies
};
