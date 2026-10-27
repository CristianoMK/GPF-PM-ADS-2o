const express = require('express');
const cors = require('cors');

const rotasPokemon = require('./rotas/pokemon');
const rotasFavoritos = require('./rotas/favoritos');
const rotasItens = require('./rotas/itens');

const aplicativo = express();
const porta = process.env.PORT || 3000;

// Permite que o frontend local consulte a API em outra porta
aplicativo.use(cors());

aplicativo.use(express.json());

aplicativo.use('/api', rotasPokemon);
aplicativo.use('/api', rotasFavoritos);
aplicativo.use('/api', rotasItens);

aplicativo.get('/', function (requisicao, resposta) {
    resposta.send('Backend da Pokédex funcionando');
});

// As rotas chamam proximo(erro) para chegar aqui quando ocorre uma falha
aplicativo.use(function (erro, requisicao, resposta, proximo) {
    if (erro.type === 'entity.parse.failed') {
        return resposta.status(400).json({ erro: 'Envie um JSON válido' });
    }
    if (erro.type === 'entity.too.large') {
        return resposta.status(413).json({ erro: 'O corpo da requisição é muito grande' });
    }
    console.error('Erro no servidor:', erro.message);
    resposta.status(500).json({ erro: 'Não foi possível acessar os dados do servidor' });
});

aplicativo.listen(porta, function () {
    console.log('Servidor rodando na porta ' + porta);
});
