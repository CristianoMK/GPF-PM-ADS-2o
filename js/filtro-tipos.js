const tiposPokemon = {
    todos: ['Todos', '#17233A', 'M3 12h18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'],
    favoritos: ['Favoritos', '#cf4965', 'M12 20s-8-4.5-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 10-8 10z'],
    normal: ['Normal', '#9299a1', 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z'],
    fire: ['Fogo', '#ed783a', 'M12 3c1 4-3 5-3 9-2-1-2-3-2-3-4 5-2 12 5 12 7 0 9-8 3-12 0 3-1 4-2 4 1-4 0-7-1-10z'],
    water: ['Água', '#4d90d5', 'M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12z'],
    electric: ['Elétrico', '#d6a91f', 'M13 2 5 14h6l-1 8 9-13h-6z'],
    grass: ['Planta', '#5eaa55', 'M20 4C8 4 4 8 4 15c0 3 2 5 5 5 7 0 11-7 11-16zM6 18l9-9'],
    ice: ['Gelo', '#62b9c7', 'M12 3v18M4 7l16 10M20 7 4 17M9 5l3 3 3-3M9 19l3-3 3 3'],
    fighting: ['Lutador', '#c65b48', 'M6 11V7a2 2 0 0 1 4 0V5a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v5l2-1v4l-4 5H9l-5-6v-3z'],
    poison: ['Venenoso', '#a45bb0', 'M12 3c-5 0-8 4-8 8 0 3 2 5 4 6v3h8v-3c2-1 4-3 4-6 0-4-3-8-8-8zM8 11h.1M16 11h.1M10 17h4'],
    ground: ['Terrestre', '#bd9657', 'M3 19 9 8l3 5 3-8 6 14z'],
    flying: ['Voador', '#899cd9', 'M3 13c7 1 9-5 18-7-2 7-7 12-15 12l5-4z'],
    psychic: ['Psíquico', '#df6e91', 'M19 12a7 7 0 1 1-7-7c3 0 5 2 5 5s-2 4-4 4-3-1-3-3 1-2 2-2'],
    bug: ['Inseto', '#8da944', 'M8 9 5 5m11 4 3-4M5 12h14M6 16h12M12 7c-4 0-6 3-6 7s2 7 6 7 6-3 6-7-2-7-6-7z'],
    rock: ['Pedra', '#aa985c', 'M5 8 10 4l7 1 4 7-3 7H7l-4-6z'],
    ghost: ['Fantasma', '#786a9c', 'M5 20V11a7 7 0 0 1 14 0v9l-3-2-2 2-2-2-2 2-2-2zM9 11h.1M15 11h.1'],
    dragon: ['Dragão', '#7762be', 'M5 19 7 7l4 3 3-6 2 6 4 2-3 7zM14 14h.1'],
    dark: ['Sombrio', '#6b5b55', 'M18 17A8 8 0 0 1 9 4a8 8 0 1 0 9 13z'],
    steel: ['Aço', '#8499a4', 'M7 4h10l5 8-5 8H7l-5-8zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
    fairy: ['Fada', '#d786ad', 'M12 3l2 6 6 3-6 2-2 7-2-7-6-2 6-3z'],
    stellar: ['Estelar', '#6d8caa', 'M12 3l2.4 5.6L21 9l-5 4 1.5 7-5.5-4-5.5 4L8 13 3 9l6.6-.4z']
};

let tipoSelecionado = 'todos';
const filtroTipos = document.getElementById('filtro-tipos');
const botaoFiltro = document.getElementById('botao-filtro');
const painelTipos = document.getElementById('painel-tipos');
const opcoesTipos = document.getElementById('opcoes-tipos');
const filtroAtual = document.getElementById('filtro-atual');

function iconeTipo(tipo) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const caminho = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    caminho.setAttribute('d', tiposPokemon[tipo][2]);
    svg.appendChild(caminho);
    return svg;
}

function atualizarFiltroSelecionado(tipo) {
    tipoSelecionado = tipo;
    const dados = tiposPokemon[tipo];
    filtroAtual.replaceChildren();
    const icone = document.createElement('span');
    icone.className = 'icone-tipo icone-tipo-atual';
    icone.style.backgroundColor = dados[1];
    icone.appendChild(iconeTipo(tipo));
    const nome = document.createElement('span');
    nome.textContent = dados[0];
    filtroAtual.append(icone, nome);
    botaoFiltro.setAttribute('aria-label', 'Filtrar Pokémon. Selecionado: ' + dados[0]);
    opcoesTipos.querySelectorAll('button').forEach(function (botao) {
        botao.setAttribute('aria-pressed', String(botao.dataset.tipo === tipo));
    });
}

function fecharPainelTipos() {
    painelTipos.hidden = true;
    botaoFiltro.setAttribute('aria-expanded', 'false');
}

Object.keys(tiposPokemon).forEach(function (tipo) {
    const dados = tiposPokemon[tipo];
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'opcao-tipo';
    botao.dataset.tipo = tipo;
    const icone = document.createElement('span');
    icone.className = 'icone-tipo';
    icone.style.backgroundColor = dados[1];
    icone.appendChild(iconeTipo(tipo));
    const nome = document.createElement('span');
    nome.textContent = dados[0];
    botao.append(icone, nome);
    botao.addEventListener('click', function () {
        atualizarFiltroSelecionado(tipo);
        fecharPainelTipos();
        botaoFiltro.focus();
        campoPesquisa.value = '';
        filtrarPokemons();
    });
    opcoesTipos.appendChild(botao);
});

botaoFiltro.addEventListener('click', function () {
    painelTipos.hidden = !painelTipos.hidden;
    botaoFiltro.setAttribute('aria-expanded', String(!painelTipos.hidden));
});
document.addEventListener('click', function (evento) {
    if (!filtroTipos.contains(evento.target)) fecharPainelTipos();
});
document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && !painelTipos.hidden) {
        fecharPainelTipos();
        botaoFiltro.focus();
    }
});
atualizarFiltroSelecionado('todos');
