const express = require('express');

const router = express.Router();

router.get('/pokemon/:id', function (req, res) {
    const id = req.params.id;

    fetch('https://pokeapi.co/api/v2/pokemon/' + id)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error('Pokémon não encontrado');
            }

            return resposta.json();
        })
        .then(function (pokemon) {
            res.json(pokemon);
        })
        .catch(function () {
            res.status(404).json({
                erro: 'Pokémon não encontrado'
            });
        });
});

router.get('/pesquisa', function (req, res) {
    const nome = req.query.nome;

    if (!nome) {
        return res.status(400).json({
            erro: 'Informe o nome do Pokémon'
        });
    }

    fetch('https://pokeapi.co/api/v2/pokemon/' + nome.toLowerCase())
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error('Pokémon não encontrado');
            }

            return resposta.json();
        })
        .then(function (pokemon) {
            res.json(pokemon);
        })
        .catch(function () {
            res.status(404).json({
                erro: 'Pokémon não encontrado'
            });
        });
});

module.exports = router;
