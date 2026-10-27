const express = require('express');

const rotas = express.Router();
let nomesItens = [];
const categoriasSalvas = {};
const bolsosSalvos = {};

async function consultarPokeApi(caminho) {
    const respostaApi = await fetch('https://pokeapi.co/api/v2/' + caminho, {
        signal: AbortSignal.timeout(10000)
    });
    if (!respostaApi.ok) {
        const erro = new Error('Falha ao consultar a PokéAPI');
        erro.status = respostaApi.status;
        throw erro;
    }
    return await respostaApi.json();
}

function responderErro(erro, resposta) {
    if (erro.status === 404) {
        return resposta.status(404).json({ erro: 'Item ou categoria não encontrado' });
    }
    resposta.status(502).json({ erro: 'Não foi possível consultar os itens na PokéAPI. Tente novamente.' });
}

function resumirLista(lista) {
    return lista.map(function (item) {
        const partes = item.url.split('/');
        return { id: Number(partes[partes.length - 2]), name: item.name };
    });
}

function escolherTraducao(traducoes) {
    return traducoes.find(function (traducao) {
        return traducao.language.name.startsWith('pt');
    }) || traducoes.find(function (traducao) {
        return traducao.language.name === 'en';
    }) || traducoes[0];
}

async function carregarCategoria(nome) {
    if (!Object.hasOwn(categoriasSalvas, nome)) {
        categoriasSalvas[nome] = await consultarPokeApi('item-category/' + encodeURIComponent(nome));
    }
    return categoriasSalvas[nome];
}

// As páginas e o índice contêm só nomes e IDs; os detalhes são pedidos ao selecionar um item
rotas.get('/itens', async function (requisicao, resposta) {
    const inicioTexto = requisicao.query.inicio;
    const inicio = Number(inicioTexto || 0);
    const categoria = requisicao.query.categoria;
    if ((inicioTexto !== undefined && typeof inicioTexto !== 'string') ||
        !Number.isSafeInteger(inicio) || inicio < 0 ||
        (categoria !== undefined && (typeof categoria !== 'string' || categoria.trim() === ''))) {
        return resposta.status(400).json({ erro: 'Informe um início e uma categoria válidos' });
    }
    try {
        let lista;
        let total;
        if (categoria) {
            const dadosCategoria = await carregarCategoria(categoria.trim().toLowerCase());
            total = dadosCategoria.items.length;
            lista = dadosCategoria.items.slice(inicio, inicio + 20);
        } else {
            const dados = await consultarPokeApi('item?limit=20&offset=' + inicio);
            total = dados.count;
            lista = dados.results;
        }
        resposta.json({ itens: resumirLista(lista), total: total, temMais: inicio + lista.length < total });
    } catch (erro) {
        responderErro(erro, resposta);
    }
});

rotas.get('/itens/nomes', async function (requisicao, resposta) {
    try {
        if (nomesItens.length === 0) {
            const primeiraPagina = await consultarPokeApi('item?limit=1');
            const dados = await consultarPokeApi('item?limit=' + primeiraPagina.count);
            nomesItens = resumirLista(dados.results);
        }
        resposta.json(nomesItens);
    } catch (erro) {
        responderErro(erro, resposta);
    }
});

rotas.get('/itens/categorias', async function (requisicao, resposta) {
    try {
        const primeiraPagina = await consultarPokeApi('item-category?limit=1');
        const dados = await consultarPokeApi('item-category?limit=' + primeiraPagina.count);
        resposta.json(resumirLista(dados.results));
    } catch (erro) {
        responderErro(erro, resposta);
    }
});

rotas.get('/itens/:identificador', async function (requisicao, resposta) {
    const identificador = requisicao.params.identificador.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(identificador) ||
        (/^-?\d+$/.test(identificador) && (!Number.isSafeInteger(Number(identificador)) || Number(identificador) <= 0))) {
        return resposta.status(400).json({ erro: 'Informe um nome ou número de item válido' });
    }
    try {
        const item = await consultarPokeApi('item/' + encodeURIComponent(identificador));
        const categoria = await carregarCategoria(item.category.name);
        const nomeBolso = categoria.pocket.name;
        if (!Object.hasOwn(bolsosSalvos, nomeBolso)) {
            bolsosSalvos[nomeBolso] = await consultarPokeApi('item-pocket/' + encodeURIComponent(nomeBolso));
        }
        const nome = escolherTraducao(item.names);
        const nomeCategoria = escolherTraducao(categoria.names);
        const nomeDoBolso = escolherTraducao(bolsosSalvos[nomeBolso].names);
        const descricoes = item.effect_entries.length > 0 ? item.effect_entries : item.flavor_text_entries;
        const descricao = escolherTraducao(descricoes);
        // Não presume um preço único ou a versão mais recente. Usa o primeiro registro de compra, ou de venda
        const precos = item.prices || [];
        let registroPreco = precos.find(function (preco) { return typeof preco.purchase_price === 'number'; });
        let tipoPreco = 'Compra';
        if (!registroPreco) {
            registroPreco = precos.find(function (preco) { return typeof preco.sell_price === 'number'; });
            tipoPreco = 'Venda';
        }
        resposta.json({
            id: item.id,
            nomeOriginal: item.name,
            nome: nome ? nome.name : item.name,
            idiomaNome: nome ? nome.language.name : null,
            imagem: item.sprites.default,
            categoria: nomeCategoria ? nomeCategoria.name : categoria.name,
            idiomaCategoria: nomeCategoria ? nomeCategoria.language.name : null,
            bolso: nomeDoBolso ? nomeDoBolso.name : nomeBolso,
            idiomaBolso: nomeDoBolso ? nomeDoBolso.language.name : null,
            descricao: descricao ? (descricao.short_effect || descricao.effect || descricao.text).replace(/\s+/g, ' ') : null,
            idiomaDescricao: descricao ? descricao.language.name : null,
            versaoDescricao: descricao?.version_group?.name || null,
            preco: registroPreco ? {
                tipo: tipoPreco,
                valor: tipoPreco === 'Compra' ? registroPreco.purchase_price : registroPreco.sell_price,
                moeda: registroPreco.currency.name,
                versao: registroPreco.version_group.name
            } : null
        });
    } catch (erro) {
        responderErro(erro, resposta);
    }
});

module.exports = rotas;
