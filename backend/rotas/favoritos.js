const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const arquivoFavoritos = path.join(__dirname, '..', 'data', 'favoritos.json');

function lerFavoritos() {
    try {
        const dados = fs.readFileSync(arquivoFavoritos, 'utf8');

        return JSON.parse(dados);
    } catch (erro) {
        return [];
    }
}

function salvarFavoritos(favoritos) {
    fs.writeFileSync(arquivoFavoritos, JSON.stringify(favoritos, null, 2));
}

router.get('/favoritos', function (req, res) {
    const favoritos = lerFavoritos();

    res.json(favoritos);
});

router.post('/favoritos', function (req, res) {
    const pokemon = req.body;

    if (!pokemon.id || !pokemon.nome) {
        return res.status(400).json({
            erro: 'Dados do Pokémon inválidos'
        });
    }

    const favoritos = lerFavoritos();
    const jaExiste = favoritos.some(function (item) {
        return item.id === pokemon.id;
    });

    if (jaExiste) {
        return res.status(400).json({
            erro: 'Pokémon já está nos favoritos'
        });
    }

    favoritos.push(pokemon);
    salvarFavoritos(favoritos);

    res.json(pokemon);
});

router.delete('/favoritos/:id', function (req, res) {
    const id = Number(req.params.id);
    let favoritos = lerFavoritos();

    favoritos = favoritos.filter(function (item) {
        return item.id !== id;
    });

    salvarFavoritos(favoritos);

    res.json({
        mensagem: 'Favorito removido'
    });
});

module.exports = router;
