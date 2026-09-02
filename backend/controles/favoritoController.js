const fs = require('fs/promises');
const path = require('path');

const FAVORITES_FILE = path.join(__dirname, '..', 'data', 'favoritos.json');

async function readFavorites() {
    try {
        const data = await fs.readFile(FAVORITES_FILE, 'utf8');
        const favorites = JSON.parse(data);
        return Array.isArray(favorites) ? favorites : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }

        throw error;
    }
}

async function writeFavorites(favorites) {
    await fs.writeFile(FAVORITES_FILE, `${JSON.stringify(favorites, null, 2)}\n`);
}

async function list(request, response) {
    try {
        return response.json(await readFavorites());
    } catch (error) {
        console.error('Erro ao ler favoritos:', error.message);
        return response.status(500).json({ error: 'Não foi possível ler os favoritos' });
    }
}

async function create(request, response) {
    const pokemonId = Number(request.body?.pokemonId);
    const name = String(request.body?.name || '').trim().toLowerCase();

    if (!Number.isInteger(pokemonId) || pokemonId <= 0 || !/^[a-z0-9-]+$/.test(name)) {
        return response.status(400).json({ error: 'pokemonId e name válidos são obrigatórios' });
    }

    try {
        const favorites = await readFavorites();
        const alreadyExists = favorites.some((favorite) => favorite.pokemonId === pokemonId);

        if (alreadyExists) {
            return response.status(409).json({ error: 'Pokémon já está nos favoritos' });
        }

        const favorite = { pokemonId, name };
        favorites.push(favorite);
        await writeFavorites(favorites);
        return response.status(201).json(favorite);
    } catch (error) {
        console.error('Erro ao salvar favorito:', error.message);
        return response.status(500).json({ error: 'Não foi possível salvar o favorito' });
    }
}

async function remove(request, response) {
    const pokemonId = Number(request.params.pokemonId);

    if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
        return response.status(400).json({ error: 'ID inválido' });
    }

    try {
        const favorites = await readFavorites();
        const updatedFavorites = favorites.filter((favorite) => favorite.pokemonId !== pokemonId);

        if (updatedFavorites.length === favorites.length) {
            return response.status(404).json({ error: 'Favorito não encontrado' });
        }

        await writeFavorites(updatedFavorites);
        return response.status(204).send();
    } catch (error) {
        console.error('Erro ao remover favorito:', error.message);
        return response.status(500).json({ error: 'Não foi possível remover o favorito' });
    }
}

module.exports = { list, create, remove };
