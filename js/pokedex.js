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
    // Completa até três páginas se o painel não permitir rolagem; não repete após erro.
    if (consultaAtual === versaoLista && temMais && inicio < 60 &&
        lista.clientHeight > 0 && lista.scrollHeight <= lista.clientHeight) {
        await carregarPokemons();
    }
}

async function carregarFavoritos(consultaAtual) {
    const listaFavoritos = await consultarApi("/favoritos");
    if (consultaAtual !== undefined && consultaAtual !== versaoLista) {
        return [];
    }
    favoritos = listaFavoritos.map(function (pokemon) { return pokemon.id; });
    favoritosProntos = true;
    return listaFavoritos.map(function (pokemon) {
        return { id: pokemon.id, name: pokemon.nome };
    });
}

// O backup antigo só é apagado depois que todos os IDs estiverem salvos no servidor.
async function migrarFavoritosAntigos() {
    try {
        const favoritosAntigos = JSON.parse(localStorage.getItem("favoritos") || "[]");
        if (!Array.isArray(favoritosAntigos)) {
            throw new Error("A lista antiga de favoritos está em um formato inválido.");
        }

        for (const id of favoritosAntigos) {
            if (!favoritos.includes(id)) {
                const pokemon = await obterPokemon(id);
                await adicionarFavorito(pokemon);
            }
        }
        localStorage.removeItem("favoritos");
    } catch (erro) {
        mensagemPokedex.textContent = "A importação não foi concluída: " + erro.message +
            " Os favoritos antigos continuam neste navegador. Recarregue a página para tentar novamente.";
    }
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

function mostrarPokemon(pokemon) {
    pokemonAtual = pokemon;

    document.getElementById("numero-pokemon").textContent = "Nº" + pokemon.id;
    document.getElementById("nome-pokemon").textContent = pokemon.name.toUpperCase();
    document.getElementById("altura-pokemon").textContent = (pokemon.height / 10) + " m";
    document.getElementById("peso-pokemon").textContent = (pokemon.weight / 10) + " kg";
    mostrarImagemPokemon(pokemon);

    const areaTipos = document.getElementById("tipos-pokemon");
    areaTipos.innerHTML = "<strong>TIPO</strong>";

    pokemon.types.forEach(function (tipo) {
        const span = document.createElement("span");

        span.classList.add("tipo", "tipo-pokemon");
        span.textContent = tipo.type.name;
        areaTipos.appendChild(span);
    });

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

async function adicionarFavorito(pokemon) {
    await consultarApi("/favoritos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pokemon.id, nome: pokemon.name })
    });

    favoritos.push(pokemon.id);
}

async function removerFavorito(id) {
    await consultarApi("/favoritos/" + id, { method: "DELETE" });
    favoritos = favoritos.filter(function (favoritoId) {
        return favoritoId !== id;
    });
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
            await removerFavorito(pokemon.id);
        } else {
            await adicionarFavorito(pokemon);
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
    const consultaAtual = versaoLista;
    await carregarPokemons();
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
        await migrarFavoritosAntigos();
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
