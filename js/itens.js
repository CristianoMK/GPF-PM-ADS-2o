let itensCarregados = [];
let itemAtual = null;
const detalhesItens = [];
let inicioItens = 0;
let temMaisItens = true;
let carregandoItens = false;
let versaoListaItens = 0;
let modoListaItens = 'catalogo';
const listaItens = document.getElementById('lista-itens');
const campoItem = document.getElementById('pesquisa-item');
const filtroCategoria = document.getElementById('filtro-categoria');
const resumoItens = document.getElementById('resumo-itens');
const mensagemItens = document.getElementById('mensagem-itens');
const botaoTentarItens = document.getElementById('tentar-novamente');

function atualizarControlesItens() {
    listaItens.setAttribute('aria-busy', String(carregandoItens));
    botaoTentarItens.disabled = carregandoItens;
    listaItens.querySelectorAll('button').forEach(function (botao) {
        botao.disabled = carregandoItens;
    });
}

function mostrarListaItens() {
    const posicaoRolagem = listaItens.scrollTop;
    listaItens.innerHTML = '';
    if (itensCarregados.length === 0) {
        listaItens.textContent = 'Nenhum item encontrado.';
    }
    itensCarregados.forEach(function (item) {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.classList.add('item-pokemon');
        botao.textContent = 'Nº' + item.id + ' ' + item.name.toUpperCase();
        if (itemAtual && itemAtual.id === item.id) {
            botao.classList.add('ativo');
        }
        botao.addEventListener('click', function () {
            selecionarItem(item.id);
        });
        listaItens.appendChild(botao);
    });
    listaItens.scrollTop = posicaoRolagem;
}

function mostrarItem(item) {
    itemAtual = item;
    document.getElementById('numero-item').textContent = 'Nº' + item.id;
    document.getElementById('nome-item').textContent = item.nome.toUpperCase();
    document.getElementById('categoria-item').textContent = item.categoria;
    document.getElementById('bolso-item').textContent = item.bolso;
    document.getElementById('descricao-item').textContent = (item.descricao || 'Efeito não informado pela PokéAPI.') +
        (item.versaoDescricao ? ' (versão: ' + item.versaoDescricao + ')' : '');
    document.getElementById('idioma-item').textContent = 'Idiomas da API — nome: ' + (item.idiomaNome || 'identificador') +
        '; categoria: ' + (item.idiomaCategoria || 'identificador') + '; bolso: ' + (item.idiomaBolso || 'identificador') +
        '; efeito: ' + (item.idiomaDescricao || 'não informado') + '.';
    const preco = item.preco;
    document.getElementById('preco-item').textContent = preco ?
        preco.tipo + ': ' + preco.valor + ' ' + preco.moeda + ' (versão: ' + preco.versao + ')' : 'Não informado pela PokéAPI.';
    document.getElementById('regra-preco').textContent = preco ?
        'Regra: primeiro preço de compra informado; na ausência, primeiro preço de venda. Os valores podem variar entre versões.' : '';
    const imagem = document.getElementById('imagem-item');
    const placeholder = document.getElementById('item-sem-imagem');
    imagem.onerror = null;
    imagem.removeAttribute('src');
    imagem.hidden = !item.imagem;
    placeholder.hidden = Boolean(item.imagem);
    if (item.imagem) {
        imagem.alt = 'Imagem de ' + item.nome;
        // Não tenta outras imagens ou IDs quando o sprite falha.
        imagem.onerror = function () {
            imagem.onerror = null;
            imagem.hidden = true;
            placeholder.hidden = false;
        };
        imagem.src = item.imagem;
    }
}

async function selecionarItem(identificador) {
    if (carregandoItens) {
        return;
    }
    const consultaAtual = versaoListaItens;
    carregandoItens = true;
    atualizarControlesItens();
    mensagemItens.textContent = 'Carregando detalhes do item...';
    try {
        let item = detalhesItens.find(function (dados) { return String(dados.id) === String(identificador) || dados.nomeOriginal === identificador; });
        if (!item) {
            item = await consultarApi('/itens/' + encodeURIComponent(identificador));
            detalhesItens.push(item);
        }
        if (consultaAtual !== versaoListaItens) {
            return;
        }
        mostrarItem(item);
        mostrarListaItens();
        mensagemItens.textContent = '';
    } catch (erro) {
        if (consultaAtual === versaoListaItens) {
            mensagemItens.textContent = erro.message;
        }
    } finally {
        if (consultaAtual === versaoListaItens) {
            carregandoItens = false;
            atualizarControlesItens();
        }
    }
}

async function carregarItens() {
    if (carregandoItens || !temMaisItens || modoListaItens !== 'catalogo') {
        return;
    }
    const consultaAtual = versaoListaItens;
    const categoria = filtroCategoria.value;
    carregandoItens = true;
    atualizarControlesItens();
    botaoTentarItens.hidden = true;
    mensagemItens.textContent = 'Carregando itens...';
    try {
        let caminho = '/itens?inicio=' + inicioItens;
        if (categoria !== 'todas') {
            caminho += '&categoria=' + encodeURIComponent(categoria);
        }
        const dados = await consultarApi(caminho);
        // Um filtro novo invalida as páginas antigas que ainda estiverem em trânsito.
        if (consultaAtual !== versaoListaItens) {
            return;
        }
        itensCarregados = itensCarregados.concat(dados.itens);
        inicioItens += dados.itens.length;
        temMaisItens = dados.temMais;
        mostrarListaItens();
        resumoItens.textContent = inicioItens + ' de ' + dados.total + ' itens' +
            (categoria === 'todas' ? ' do catálogo.' : ' da categoria ' + categoria + '.');
        mensagemItens.textContent = temMaisItens ? '' : 'Todos os resultados foram carregados.';
    } catch (erro) {
        if (consultaAtual === versaoListaItens) {
            mensagemItens.textContent = erro.message;
            botaoTentarItens.hidden = false;
        }
        return;
    } finally {
        if (consultaAtual === versaoListaItens) {
            carregandoItens = false;
            atualizarControlesItens();
        }
    }
    // Evita uma lista sem rolagem, mas limita esse preenchimento automático a três páginas.
    if (consultaAtual === versaoListaItens && temMaisItens && inicioItens < 60 &&
        listaItens.clientHeight > 0 && listaItens.scrollHeight <= listaItens.clientHeight) {
        await carregarItens();
    }
}

async function filtrarItens() {
    limparSugestoesItens();
    versaoListaItens++;
    carregandoItens = false;
    inicioItens = 0;
    temMaisItens = true;
    modoListaItens = 'catalogo';
    itensCarregados = [];
    listaItens.innerHTML = '';
    listaItens.scrollTop = 0;
    resumoItens.textContent = 'Carregando lista...';
    await carregarItens();
}

async function pesquisarItem() {
    limparSugestoesItens();
    const termo = normalizarPesquisa(campoItem.value);
    if (termo === '') {
        await filtrarItens();
        return;
    }
    const consultaAtual = ++versaoListaItens;
    carregandoItens = true;
    atualizarControlesItens();
    botaoTentarItens.hidden = true;
    mensagemItens.textContent = 'Pesquisando item...';
    try {
        const catalogo = await carregarNomes('itens');
        if (consultaAtual !== versaoListaItens) {
            return;
        }
        const resultado = encontrarNomes(termo, catalogo);
        const exato = catalogo.find(function (item) { return item.name === termo || String(item.id) === termo; });
        if (!exato && resultado.registros.length === 0) {
            mensagemItens.textContent = 'Nenhum item encontrado. Confira o nome ou número.';
            return;
        }
        modoListaItens = 'pesquisa';
        itensCarregados = exato ? [exato] : resultado.registros;
        mostrarListaItens();
        resumoItens.textContent = exato ? 'Resultado da pesquisa no catálogo completo.' :
            resultado.aproximados ? 'Você quis dizer? Selecione um item.' : resultado.registros.length + ' correspondências. Selecione um item.';
        mensagemItens.textContent = '';
        if (exato) {
            // A seleção já faz seu próprio controle de carregamento; aqui não iniciamos outro pedido igual.
            carregandoItens = false;
            await selecionarItem(exato.id);
        }
    } catch (erro) {
        if (consultaAtual === versaoListaItens) {
            mensagemItens.textContent = erro.message;
        }
    } finally {
        if (consultaAtual === versaoListaItens) {
            carregandoItens = false;
            atualizarControlesItens();
        }
    }
}

filtroCategoria.addEventListener('change', function () {
    campoItem.value = '';
    filtrarItens();
});
listaItens.addEventListener('scroll', function () {
    if (listaItens.clientHeight > 0 && listaItens.scrollTop + listaItens.clientHeight >= listaItens.scrollHeight - 150) {
        carregarItens();
    }
});
document.getElementById('botao-pesquisa').addEventListener('click', pesquisarItem);
campoItem.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
        evento.preventDefault();
        pesquisarItem();
    }
});
const limparSugestoesItens = prepararSugestoes(campoItem, document.getElementById('sugestoes-itens'), pesquisarItem, null, 'itens');
campoItem.addEventListener('input', function () {
    if (campoItem.value === '') {
        filtrarItens();
    }
});
botaoTentarItens.addEventListener('click', carregarItens);

async function iniciarItens() {
    const consultaAtual = versaoListaItens;
    await carregarItens();
    if (consultaAtual === versaoListaItens && itensCarregados.length > 0) {
        await selecionarItem(itensCarregados[0].id);
    }
    try {
        const categorias = await consultarApi('/itens/categorias');
        categorias.forEach(function (categoria) {
            const opcao = document.createElement('option');
            opcao.value = categoria.name;
            opcao.textContent = categoria.name;
            filtroCategoria.appendChild(opcao);
        });
    } catch (erro) {
        mensagemItens.textContent = 'Não foi possível carregar as categorias: ' + erro.message;
    }
    const pesquisa = new URLSearchParams(window.location.search).get('pesquisa');
    if (pesquisa && consultaAtual === versaoListaItens && campoItem.value === '') {
        campoItem.value = pesquisa;
        await pesquisarItem();
    }
}

iniciarItens();
