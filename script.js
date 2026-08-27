const input = document.querySelector('.barra_pesquisa input');
const botao = document.querySelector('.barra_pesquisa button');

botao.addEventListener('click', function () {
    console.log(input.value);
    document.getElementById('pesquisou_um').innerText = input.value
});

console.log(input);
console.log(botao);
