const express = require('express');
const fs = require('fs');
const path = require('path');

const rotas = express.Router();
const arquivoFavoritos = path.join(__dirname, '..', 'data', 'favoritos.json');

// Os favoritos são compartilhados e persistidos em JSON, sem banco de dados
function lerFavoritos() {
    const dados = fs.readFileSync(arquivoFavoritos, 'utf8');
    const listaFavoritos = JSON.parse(dados);
    if (!Array.isArray(listaFavoritos)) {
        throw new Error('Arquivo de favoritos inválido');
    }
    return listaFavoritos;
}

function salvarFavoritos(listaFavoritos) {
    fs.writeFileSync(arquivoFavoritos, JSON.stringify(listaFavoritos, null, 2));
}

rotas.get('/favoritos', function (requisicao, resposta, proximo) {
    try {
        resposta.json(lerFavoritos());
    } catch (erro) {
        proximo(erro);
    }
});

// Adiciona somente ID e nome validando duplicação e o limite de cinco
rotas.post('/favoritos', function (requisicao, resposta, proximo) {
    const pokemon = requisicao.body;
    if (!pokemon || !Number.isSafeInteger(pokemon.id) || pokemon.id <= 0 ||
        typeof pokemon.nome !== 'string' || pokemon.nome.trim() === '') {
        return resposta.status(400).json({ erro: 'Dados do Pokémon inválidos' });
    }

    try {
        const listaFavoritos = lerFavoritos();
        const jaExiste = listaFavoritos.some(function (item) {
            return item.id === pokemon.id;
        });
        if (jaExiste) {
            return resposta.status(409).json({ erro: 'Pokémon já está nos favoritos' });
        }
        if (listaFavoritos.length >= 5) {
            return resposta.status(400).json({ erro: 'Você pode salvar no máximo cinco favoritos' });
        }

        const novoFavorito = { id: pokemon.id, nome: pokemon.nome.trim().toLowerCase() };
        listaFavoritos.push(novoFavorito);
        salvarFavoritos(listaFavoritos);
        resposta.status(201).json(novoFavorito);
    } catch (erro) {
        // Um erro de leitura não deve ser tratado como lista vazia e apagar os dados
        proximo(erro);
    }
});

rotas.delete('/favoritos/:id', function (requisicao, resposta, proximo) {
    const id = Number(requisicao.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        return resposta.status(400).json({ erro: 'Informe um ID inteiro positivo' });
    }
    try {
        const listaFavoritos = lerFavoritos();
        const novaLista = listaFavoritos.filter(function (pokemon) {
            return pokemon.id !== id;
        });
        if (novaLista.length === listaFavoritos.length) {
            return resposta.status(404).json({ erro: 'Favorito não encontrado' });
        }
        salvarFavoritos(novaLista);
        resposta.json({ mensagem: 'Favorito removido' });
    } catch (erro) {
        proximo(erro);
    }
});

module.exports = rotas;
