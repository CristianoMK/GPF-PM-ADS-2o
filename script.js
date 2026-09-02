const input = document.querySelector('.barra_pesquisa input'); //define input como a  barra de pesquisa
const botao = document.querySelector('.barra_pesquisa button'); //define botao como o botao ao lado da barra de pesquisa
const arquivoAtual = descobrirArquivoAtual(window.location.pathname); // descobre a localizacao do arquivo


function descobrirArquivoAtual(caminho) { //descobre qual arquivo esta sendo executado

    caminho = caminho.split("/");
    const ultimaPosicao = caminho.length - 1;

    return caminho[ultimaPosicao];
}

if (input && botao) {
    botao.addEventListener('click', function () {
        console.log(input.value);
        document.getElementById('pesquisou_um').innerText = input.value
    });
}

fetch('menu.html')
    .then(function (resposta) {
        return resposta.text();
    })
    .then(function (conteudo) {
        document.getElementById('menu').innerHTML = conteudo; //coloca o menu dentro da tag de forma interpretada

        const opcoesMenu = document.querySelectorAll('.menu_item'); //pega todas as opcoes em um array

        opcoesMenu.forEach(function (opcao) {

            const opcComp = descobrirArquivoAtual(opcao.pathname);

            if (opcComp === arquivoAtual) {
                opcao.classList.add('ativo');
            }
        })
    })
