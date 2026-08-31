const input = document.querySelector('.barra_pesquisa input');
const botao = document.querySelector('.barra_pesquisa button');
const arquivoAtual = descobrirArquivoAtual(window.location.pathname);
const opcoesMenu = document.querySelectorAll('.menu_item');

function descobrirArquivoAtual(caminho) { //descobre qual arquivo esta sendo executado

    caminho = caminho.split("/");
    const ultimaPosicao = caminho.length - 1;

    return caminho[ultimaPosicao];
}

opcoesMenu.forEach(function (opcao) {
    let opcComp = descobrirArquivoAtual(opcao.pathname);
    if (opcComp == arquivoAtual) {
        opcao.classList.add('ativo');
    }
})

botao.addEventListener('click', function () {
    console.log(input.value);
    document.getElementById('pesquisou_um').innerText = input.value
});

console.log(input);
console.log(botao);
console.log(arquivoAtual);
console.log(opcoesMenu);