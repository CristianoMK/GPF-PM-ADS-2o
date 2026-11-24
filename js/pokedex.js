let pokemonsCarregados = [];
let pokemonAtual = null;
let favoritos = [];
let dadosPokemons = [];
let inicio = 0;
let versaoLista = 0;
let temMais = true;
let carregando = false;
let favoritosProntos = false;
let modoLista = "catalogo";
let salvandoFavorito = false;
let versaoImagem = 0;
let versaoEvolucoes = 0;
const cadeiasEvolucao = {};
const lista = document.getElementById("lista-pokemon");
const botaoPesquisa = document.getElementById("botao-pesquisa");
const botaoTentar = document.getElementById("tentar-novamente");
const mensagemPokedex = document.getElementById("mensagem-pokedex");
const sugestoesPesquisa = document.getElementById("sugestoes-pesquisa");
const filtroTipo = document.getElementById("filtro-tipo");
const campoPesquisa = document.querySelector(".campo-pesquisa input");
const resumoLista = document.getElementById("resumo-lista");
function atualizarControles() {
    botaoFavorito.disabled = carregando || salvandoFavorito || !favoritosProntos || !pokemonAtual;
    botaoTentar.disabled = carregando;
    lista.setAttribute("aria-busy", String(carregando));
    document.querySelectorAll(".item-pokemon").forEach(function (botao) {
        botao.disabled = carregando;
    });
}

async function obterPokemon(id) {
    let pokemon = dadosPokemons.find(function (item) {
        return item.id === id;
    });
    if (!pokemon) {
        pokemon = await consultarApi("/pokemon/" + id);
        dadosPokemons.push(pokemon);
    }
    return pokemon;
}

async function carregarPokemons() {
    // Preenche até três páginas quando a lista ainda não permite rolagem.
    for (let pagina = 0; pagina < 3; pagina++) {
        if (carregando || !temMais || modoLista !== "catalogo") {
            return;
        }
        // Só a versão atual pode acrescentar páginas; carregando bloqueia pedidos duplicados.
        const consultaAtual = versaoLista;
        const tipo = filtroTipo.value;
        carregando = true;
        atualizarControles();
        botaoTentar.hidden = true;
        mensagemPokedex.textContent = "Carregando Pokémon...";
        try {
            let caminho = "/pokemons?inicio=" + inicio;
            if (tipo !== "todos") {
                caminho += "&tipo=" + encodeURIComponent(tipo);
            }
            const dados = await consultarApi(caminho);
            if (consultaAtual !== versaoLista) {
                return;
            }
            pokemonsCarregados = pokemonsCarregados.concat(dados.pokemons);
            inicio += dados.pokemons.length;
            temMais = dados.temMais;
            mostrarListaPokemons(pokemonsCarregados);
            resumoLista.textContent = inicio + " de " + dados.total +
                (tipo === "todos" ? " Pokémon do catálogo." : " Pokémon do tipo " + tipo + ".");
            mensagemPokedex.textContent = temMais ? "" : "Todos os resultados foram carregados.";
        } catch (erro) {
            if (consultaAtual === versaoLista) {
                mensagemPokedex.textContent = erro.message;
                botaoTentar.hidden = false;
            }
            return;
        } finally {
            if (consultaAtual === versaoLista) {
                carregando = false;
                atualizarControles();
            }
        }
        if (consultaAtual !== versaoLista) {
            return;
        }
        const listaSemRolagem = lista.clientHeight > 0 &&
            lista.scrollHeight <= lista.clientHeight;
        if (!listaSemRolagem || inicio >= 60) {
            return;
        }
    }
}

async function carregarFavoritos(consultaAtual) {
    const ids = lerFavoritosLocais();
    if (consultaAtual !== undefined && consultaAtual !== versaoLista) {
        return [];
    }
    favoritos = ids;
    favoritosProntos = true;
    if (consultaAtual === undefined) return [];

    // Os nomes são recuperados somente para exibir a lista de favoritos.
    return Promise.all(ids.map(async function (id) {
        const pokemon = await obterPokemon(id);
        return { id: pokemon.id, name: pokemon.name };
    }));
}

async function selecionarPokemon(id) {
    if (carregando) {
        return;
    }
    const consultaAtual = versaoLista;
    carregando = true;
    atualizarControles();
    try {
        const pokemon = await obterPokemon(id);
        if (consultaAtual !== versaoLista) {
            return;
        }
        mostrarPokemon(pokemon);
        mostrarListaPokemons(pokemonsCarregados);
    } catch (erro) {
        if (consultaAtual === versaoLista) {
            mensagemPokedex.textContent = erro.message;
        }
    } finally {
        if (consultaAtual === versaoLista) {
            carregando = false;
            atualizarControles();
        }
    }
}

// Solicita mais vinte quando faltam cerca de 150 pixels para o fim da lista.
function verificarRolagem() {
    if (lista.clientHeight > 0 && lista.scrollTop + lista.clientHeight >= lista.scrollHeight - 150) {
        carregarPokemons();
    }
}

function adicionarPokemonNaLista(pokemon) {
    const botao = document.createElement("button");

    botao.classList.add("item-pokemon");
    botao.type = "button";
    botao.textContent = "Nº" + pokemon.id + " " + pokemon.name.toUpperCase();

    if (pokemonAtual && pokemon.id === pokemonAtual.id) {
        botao.classList.add("ativo");
    }

    botao.addEventListener("click", function () {
        selecionarPokemon(pokemon.id);
    });

    lista.appendChild(botao);
}

function mostrarListaPokemons(listaPokemons) {
    const posicaoRolagem = lista.scrollTop;
    lista.innerHTML = "";

    if (listaPokemons.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.textContent = "Nenhum Pokémon encontrado.";
        lista.appendChild(mensagem);
        return;
    }

    listaPokemons.forEach(function (pokemon) {
        adicionarPokemonNaLista(pokemon);
    });
    lista.scrollTop = posicaoRolagem;
}

function mostrarImagemPokemon(pokemon) {
    const consultaAtual = ++versaoImagem;
    const imagem = document.getElementById("imagem-pokemon");
    const avisoImagem = document.getElementById("aviso-imagem");
    const placeholder = document.getElementById("imagem-indisponivel");
    const imagens = [
        { url: pokemon.sprites.other?.["official-artwork"]?.front_default, base: false },
        { url: pokemon.sprites.front_default, base: false }
    ].filter(function (opcao) { return opcao.url; });
    let posicao = 0;
    let baseConsultada = false;
    imagem.hidden = true;
    imagem.removeAttribute("src");
    avisoImagem.textContent = "";
    placeholder.hidden = true;

    async function tentarProximaImagem() {
        if (consultaAtual !== versaoImagem) {
            return;
        }
        if (posicao >= imagens.length && !baseConsultada) {
            baseConsultada = true;
            try {
                const especieBase = await consultarApi("/pokemon/" + pokemon.id + "/imagem-base");
                if (consultaAtual !== versaoImagem) {
                    return;
                }
                [especieBase.artwork, especieBase.sprite].forEach(function (url) {
                    if (url && !imagens.some(function (opcao) { return opcao.url === url; })) {
                        imagens.push({ url: url, base: true });
                    }
                });
            } catch (erro) {
                // A falta da imagem base também deve terminar no placeholder.
            }
        }
        if (consultaAtual !== versaoImagem) {
            return;
        }
        if (posicao < imagens.length) {
            const opcao = imagens[posicao];
            posicao++;
            imagem.hidden = false;
            imagem.alt = opcao.base ? "Imagem da espécie base de " + pokemon.name : "Imagem de " + pokemon.name;
            avisoImagem.textContent = opcao.base ? "Imagem da espécie base; a forma selecionada não possui imagem disponível." : "";
            imagem.src = opcao.url;
        } else {
            imagem.onerror = null;
            imagem.hidden = true;
            imagem.removeAttribute("src");
            placeholder.hidden = false;
            avisoImagem.textContent = "Nenhuma imagem disponível para este Pokémon.";
        }
    }

    // Cada falha avança uma única vez. A versão protege a imagem de uma seleção mais recente.
    imagem.onerror = tentarProximaImagem;
    tentarProximaImagem();
}

function criarCartaoEvolucao(evolucao, nomeEspecie, numeroEtapa) {
    const cartao = document.createElement("button");
    cartao.type = "button";
    cartao.classList.add("evolucao-pokemon");
    cartao.setAttribute("aria-label", "Ver detalhes de " + nomeEspecie);
    cartao.addEventListener("click", function () {
        selecionarPokemon(evolucao.id);
    });
    const imagem = document.createElement("img");
    imagem.width = 80;
    imagem.height = 80;
    imagem.alt = "Imagem de " + nomeEspecie;
    const enderecoImagem = evolucao.sprites.other?.["official-artwork"]?.front_default || evolucao.sprites.front_default;
    if (enderecoImagem) {
        imagem.src = enderecoImagem;
        imagem.onerror = function () {
            this.replaceWith(document.createTextNode("Imagem indisponível"));
        };
        cartao.appendChild(imagem);
    } else {
        cartao.appendChild(document.createTextNode("Imagem indisponível"));
    }
    const nome = document.createElement("strong");
    nome.textContent = nomeEspecie.toUpperCase();
    const legenda = document.createElement("span");
    legenda.textContent = "Etapa " + numeroEtapa;
    cartao.appendChild(nome);
    cartao.appendChild(legenda);
    return cartao;
}

async function mostrarEvolucoes(pokemon) {
    // Uma nova seleção impede que uma resposta antiga substitua as evoluções atuais.
    const consultaAtual = ++versaoEvolucoes;
    const area = document.getElementById("lista-evolucoes");
    area.textContent = "Carregando evoluções...";
    try {
        let cadeia = cadeiasEvolucao[pokemon.species.name];
        if (cadeia === undefined) {
            cadeia = await consultarApi("/evolucoes/" + encodeURIComponent(pokemon.species.name));
            cadeiasEvolucao[pokemon.species.name] = cadeia;
        }
        if (consultaAtual !== versaoEvolucoes) {
            return;
        }
        if (!cadeia || cadeia.evolves_to.length === 0) {
            area.textContent = "Este Pokémon não possui evolução";
            return;
        }
        const etapas = [{ dados: cadeia, numero: 1 }];
        const cartoes = [];
        // Percorre todas as ramificações por etapa, inclusive quando há várias evoluções.
        for (let indice = 0; indice < etapas.length; indice++) {
            const etapa = etapas[indice];
            cadeiasEvolucao[etapa.dados.species.name] = cadeia;
            const partes = etapa.dados.species.url.split("/");
            const evolucao = await obterPokemon(Number(partes[partes.length - 2]));
            if (consultaAtual !== versaoEvolucoes) {
                return;
            }
            const cartao = criarCartaoEvolucao(evolucao, etapa.dados.species.name, etapa.numero);
            cartoes.push(cartao);
            for (let proxima = 0; proxima < etapa.dados.evolves_to.length; proxima++) {
                etapas.push({ dados: etapa.dados.evolves_to[proxima], numero: etapa.numero + 1 });
            }
        }
        area.textContent = "";
        for (let indice = 0; indice < cartoes.length; indice++) {
            area.appendChild(cartoes[indice]);
        }
    } catch (erro) {
        if (consultaAtual === versaoEvolucoes) {
            area.textContent = "Não foi possível carregar as evoluções. Selecione o Pokémon novamente para tentar.";
        }
    }
}

function mostrarPokemon(pokemon) {
    pokemonAtual = pokemon;

    document.getElementById("numero-pokemon").textContent = "Nº" + pokemon.id;
    document.getElementById("nome-pokemon").textContent = pokemon.name.toUpperCase();
    document.getElementById("altura-pokemon").textContent = (pokemon.height / 10) + " m";
    document.getElementById("peso-pokemon").textContent = (pokemon.weight / 10) + " kg";
    mostrarImagemPokemon(pokemon);
    mostrarEvolucoes(pokemon);

    const areaTipos = document.getElementById("tipos-pokemon");
    areaTipos.innerHTML = "<strong>TIPO</strong>";

    pokemon.types.forEach(function (tipo) {
        const span = document.createElement("span");

        span.classList.add("tipo", "tipo-pokemon");
        span.textContent = tipo.type.name;
        areaTipos.appendChild(span);
    });

    const habilidades = [];
    for (const habilidade of pokemon.abilities) {
        let nome = habilidade.ability.name;
        if (habilidade.is_hidden) {
            nome += " (oculta)";
        }
        habilidades.push(nome);
    }
    document.getElementById("habilidades-pokemon").textContent = habilidades.join(", ");

    document.getElementById("status-atk-especial").textContent = pokemon.stats[3].base_stat;
    document.getElementById("status-def-especial").textContent = pokemon.stats[4].base_stat;
    document.getElementById("barra-atk-especial").style.width = Math.min(pokemon.stats[3].base_stat, 100) + "%";
    document.getElementById("barra-def-especial").style.width = Math.min(pokemon.stats[4].base_stat, 100) + "%";
    document.getElementById("status-ps").textContent = pokemon.stats[0].base_stat;
    document.getElementById("status-atk").textContent = pokemon.stats[1].base_stat;
    document.getElementById("status-def").textContent = pokemon.stats[2].base_stat;
    document.getElementById("status-vel").textContent = pokemon.stats[5].base_stat;

    document.getElementById("barra-ps").style.width = Math.min(pokemon.stats[0].base_stat, 100) + "%";
    document.getElementById("barra-atk").style.width = Math.min(pokemon.stats[1].base_stat, 100) + "%";
    document.getElementById("barra-def").style.width = Math.min(pokemon.stats[2].base_stat, 100) + "%";
    document.getElementById("barra-vel").style.width = Math.min(pokemon.stats[5].base_stat, 100) + "%";

    atualizarBotaoFavorito();
}

async function carregarTiposFiltro() {
    const tipos = await consultarApi("/tipos");
    tipos.forEach(function (tipo) {
        const opcao = document.createElement("option");
        opcao.value = tipo;
        opcao.textContent = tipo;
        filtroTipo.appendChild(opcao);
    });
}

async function filtrarPokemons() {
    limparSugestoes();
    // Uma troca de filtro invalida as respostas anteriores e reinicia a paginação.
    versaoLista++;
    const consultaAtual = versaoLista;
    carregando = false;
    inicio = 0;
    temMais = true;
    pokemonsCarregados = [];
    modoLista = filtroTipo.value === "favoritos" ? "favoritos" : "catalogo";
    lista.innerHTML = "";
    lista.scrollTop = 0;
    botaoTentar.hidden = true;
    resumoLista.textContent = "Carregando lista...";
    mensagemPokedex.textContent = "";
    if (modoLista !== "favoritos") {
        await carregarPokemons();
        return;
    }
    carregando = true;
    atualizarControles();
    try {
        const listaFavoritos = await carregarFavoritos(consultaAtual);
        if (consultaAtual !== versaoLista) {
            return;
        }
        pokemonsCarregados = listaFavoritos;
        temMais = false;
        mostrarListaPokemons(pokemonsCarregados);
        resumoLista.textContent = pokemonsCarregados.length + " favoritos salvos (máximo de cinco).";
    } catch (erro) {
        if (consultaAtual === versaoLista) {
            mensagemPokedex.textContent = erro.message;
            botaoTentar.hidden = false;
        }
    } finally {
        if (consultaAtual === versaoLista) {
            carregando = false;
            atualizarControles();
        }
    }
}

function adicionarFavorito(pokemon) {
    favoritos = adicionarFavoritoLocal(pokemon.id);
}

function removerFavorito(id) {
    favoritos = removerFavoritoLocal(id);
}

function atualizarBotaoFavorito() {
    if (!pokemonAtual) {
        return;
    }

    const botao = document.getElementById("botao-favorito");

    if (favoritos.includes(pokemonAtual.id)) {
        botao.textContent = "Remover dos favoritos";
    } else {
        botao.textContent = "Adicionar aos favoritos";
    }
}

filtroTipo.addEventListener("change", function () {
    campoPesquisa.value = "";
    filtrarPokemons();
});

lista.addEventListener("scroll", verificarRolagem);

botaoTentar.addEventListener("click", function () {
    if (modoLista === "favoritos") {
        filtrarPokemons();
    } else {
        carregarPokemons();
    }
});

const botaoFavorito = document.getElementById("botao-favorito");
botaoFavorito.addEventListener("click", async function () {
    if (carregando || salvandoFavorito || !pokemonAtual || !favoritosProntos) {
        return;
    }
    salvandoFavorito = true;
    const pokemon = pokemonAtual;
    atualizarControles();
    try {
        if (favoritos.includes(pokemon.id)) {
            removerFavorito(pokemon.id);
        } else {
            adicionarFavorito(pokemon);
        }
        atualizarBotaoFavorito();
        if (modoLista === "favoritos") {
            await filtrarPokemons();
        }
    } catch (erro) {
        mensagemPokedex.textContent = erro.message;
    } finally {
        salvandoFavorito = false;
        atualizarControles();
    }
});

async function pesquisarPokemon() {
    limparSugestoes();
    const nomePokemon = normalizarPesquisa(campoPesquisa.value);
    if (nomePokemon === "") {
        await filtrarPokemons();
        return;
    }
    versaoLista++;
    const consultaAtual = versaoLista;
    carregando = true;
    atualizarControles();
    botaoTentar.hidden = true;
    mensagemPokedex.textContent = "Pesquisando Pokémon...";
    try {
        const catalogo = await carregarNomes();
        if (consultaAtual !== versaoLista) {
            return;
        }
        const resultado = encontrarNomes(nomePokemon, catalogo);
        const exato = catalogo.find(function (pokemon) {
            return pokemon.name === nomePokemon || String(pokemon.id) === nomePokemon;
        });
        // Só uma escolha exata abre os detalhes; nomes próximos precisam ser confirmados pelo usuário.
        if (!exato) {
            if (resultado.registros.length === 0) {
                mensagemPokedex.textContent = "Nenhum Pokémon encontrado. Confira o nome ou número.";
                return;
            }
            modoLista = "pesquisa";
            pokemonsCarregados = resultado.registros;
            mostrarListaPokemons(pokemonsCarregados);
            resumoLista.textContent = resultado.aproximados ? "Você quis dizer? Selecione um Pokémon." :
                resultado.registros.length + " correspondências. Selecione um Pokémon.";
            mensagemPokedex.textContent = "";
            return;
        }
        const pokemon = await consultarApi("/pesquisa?nome=" + encodeURIComponent(exato.name));
        if (consultaAtual !== versaoLista) {
            return;
        }
        modoLista = "pesquisa";
        pokemonsCarregados = [pokemon];
        mostrarPokemon(pokemon);
        mostrarListaPokemons(pokemonsCarregados);
        resumoLista.textContent = "Resultado da pesquisa no catálogo completo.";
        mensagemPokedex.textContent = "";
    } catch (erro) {
        if (consultaAtual === versaoLista) {
            mensagemPokedex.textContent = erro.message;
        }
    } finally {
        if (consultaAtual === versaoLista) {
            carregando = false;
            atualizarControles();
        }
    }
}

campoPesquisa.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        evento.preventDefault();
        pesquisarPokemon();
    }
});
botaoPesquisa.addEventListener("click", pesquisarPokemon);

const limparSugestoes = prepararSugestoes(campoPesquisa, sugestoesPesquisa, pesquisarPokemon);

campoPesquisa.addEventListener("input", function () {
    if (campoPesquisa.value === "") {
        filtrarPokemons();
    }
});

async function iniciarPokedex() {
    const filtroInicial = new URLSearchParams(window.location.search).get("filtro");
    const consultaAtual = versaoLista + (filtroInicial === "favoritos" ? 1 : 0);
    if (filtroInicial === "favoritos") {
        filtroTipo.value = "favoritos";
        await filtrarPokemons();
    } else {
        await carregarPokemons();
    }
    if (consultaAtual === versaoLista && pokemonsCarregados.length > 0) {
        await selecionarPokemon(pokemonsCarregados[0].id);
    }
    try {
        await carregarTiposFiltro();
    } catch (erro) {
        mensagemPokedex.textContent = "Não foi possível carregar os tipos: " + erro.message;
    }
    try {
        if (!favoritosProntos) {
            await carregarFavoritos();
        }
        atualizarBotaoFavorito();
    } catch (erro) {
        mensagemPokedex.textContent = "Não foi possível carregar os favoritos: " + erro.message;
    }
    atualizarControles();
    const parametros = new URLSearchParams(window.location.search);
    const pesquisa = parametros.get("pesquisa");
    if (pesquisa && consultaAtual === versaoLista && campoPesquisa.value === "") {
        campoPesquisa.value = pesquisa;
        await pesquisarPokemon();
    }
}

iniciarPokedex();
