const arquivoAtual = descobrirArquivoAtual(window.location.pathname);

function descobrirArquivoAtual(caminho) {
    const partesDoCaminho = caminho.split("/");
    const ultimaPosicao = partesDoCaminho.length - 1;

    return partesDoCaminho[ultimaPosicao];
}

fetch('menu.html')
    .then(function (resposta) {
        if (!resposta.ok) {
            throw new Error('Não foi possível carregar o menu.');
        }

        return resposta.text();
    })
    .then(function (conteudo) {
        const areaDoMenu = document.getElementById('menu');
        areaDoMenu.innerHTML = conteudo;

        const opcoesMenu = document.querySelectorAll('.menu_item');

        opcoesMenu.forEach(function (opcao) {
            const opcComp = descobrirArquivoAtual(opcao.pathname);

            if (opcComp === arquivoAtual) {
                opcao.classList.add('ativo');
            }
        });

        if (typeof ativarPopupDesenvolvimento === 'function') {
            ativarPopupDesenvolvimento();
        }
    })
    .catch(function () {

    });
