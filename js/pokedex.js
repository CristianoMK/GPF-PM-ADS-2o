const pokemonsProjeto = [
    {
        id: 448,
        nome: "lucario"
    },
    {
        id: 457,
        nome: "lumineon"
    },
    {
        id: 746,
        nome: "wishiwashi"
    },
    {
        id: 778,
        nome: "mimikyu"
    },
    {
        id: 479,
        nome: "rotom"
    }
];

let pokemonsCarregados = [];
let pokemonAtual = null;
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

function carregarPokemons() {
    pokemonsProjeto.forEach(function (pokemon) {
        fetch("https://pokeapi.co/api/v2/pokemon/" + pokemon.id)
            .then(function (resposta) {
                return resposta.json();
            })
            .then(function (dados) {
                pokemonsCarregados.push(dados);

                if (dados.id === 448) {
                    mostrarPokemon(dados);
                }

                if (pokemonsCarregados.length === pokemonsProjeto.length) {
                    mostrarListaPokemons(pokemonsCarregados);
                    carregarTiposFiltro();
                }
            })
            .catch(function (erro) {
                console.log("Erro ao carregar Pokémon:", erro);
            });
    });
}

function adicionarPokemonNaLista(pokemon) {
    const lista = document.getElementById("lista-pokemon");
    const botao = document.createElement("button");

    botao.classList.add("item-pokemon");
    botao.type = "button";
    botao.textContent = "Nº" + pokemon.id + " " + pokemon.name.toUpperCase();

    if (pokemonAtual && pokemon.id === pokemonAtual.id) {
        botao.classList.add("ativo");
    }

    botao.addEventListener("click", function () {
        const itens = document.querySelectorAll(".item-pokemon");

        itens.forEach(function (item) {
            item.classList.remove("ativo");
        });

        botao.classList.add("ativo");
        mostrarPokemon(pokemon);
    });

    lista.appendChild(botao);
}

function mostrarListaPokemons(listaPokemons) {
    const lista = document.getElementById("lista-pokemon");

    lista.innerHTML = "";

    if (listaPokemons.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.textContent = "Nenhum Pokémon favorito.";
        lista.appendChild(mensagem);
        return;
    }

    listaPokemons.forEach(function (pokemon) {
        adicionarPokemonNaLista(pokemon);
    });
}

function mostrarPokemon(pokemon) {
    pokemonAtual = pokemon;

    document.getElementById("numero-pokemon").textContent = "Nº" + pokemon.id;
    document.getElementById("nome-pokemon").textContent = pokemon.name.toUpperCase();
    document.getElementById("altura-pokemon").textContent = (pokemon.height / 10) + " m";
    document.getElementById("peso-pokemon").textContent = (pokemon.weight / 10) + " kg";
    document.getElementById("imagem-pokemon").src = pokemon.sprites.other["official-artwork"].front_default;

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

function carregarTiposFiltro() {
    const filtro = document.getElementById("filtro-tipo");
    const tipos = [];

    pokemonsCarregados.forEach(function (pokemon) {
        pokemon.types.forEach(function (item) {
            const nomeTipo = item.type.name;

            if (!tipos.includes(nomeTipo)) {
                tipos.push(nomeTipo);
            }
        });
    });

    tipos.forEach(function (tipo) {
        const option = document.createElement("option");

        option.value = tipo;
        option.textContent = tipo;
        filtro.appendChild(option);
    });
}

function filtrarPokemons(tipo) {
    if (tipo === "todos") {
        mostrarListaPokemons(pokemonsCarregados);
        return;
    }

    if (tipo === "favoritos") {
        const listaFavoritos = pokemonsCarregados.filter(function (pokemon) {
            return favoritos.includes(pokemon.id);
        });

        mostrarListaPokemons(listaFavoritos);
        return;
    }

    const resultado = pokemonsCarregados.filter(function (pokemon) {
        return pokemon.types.some(function (item) {
            return item.type.name === tipo;
        });
    });

    mostrarListaPokemons(resultado);
}

function salvarFavoritos() {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

function pokemonEstaFavoritado(id) {
    return favoritos.includes(id);
}

function adicionarFavorito(id) {
    if (!favoritos.includes(id)) {
        favoritos.push(id);
        salvarFavoritos();
    }
}

function removerFavorito(id) {
    favoritos = favoritos.filter(function (favoritoId) {
        return favoritoId !== id;
    });

    salvarFavoritos();
}

function atualizarBotaoFavorito() {
    if (!pokemonAtual) {
        return;
    }

    const botao = document.getElementById("botao-favorito");

    if (pokemonEstaFavoritado(pokemonAtual.id)) {
        botao.textContent = "Remover dos favoritos";
    } else {
        botao.textContent = "Adicionar aos favoritos";
    }
}

function filtrarLista() {
    const campoPesquisa = document.querySelector(".campo-pesquisa input");
    const itens = document.querySelectorAll(".item-pokemon");
    const textoPesquisa = campoPesquisa.value.toLowerCase();

    itens.forEach(function (item) {
        item.style.display = item.textContent.toLowerCase().includes(textoPesquisa) ? "block" : "none";
    });
}

document.getElementById("filtro-tipo").addEventListener("change", function () {
    filtrarPokemons(document.getElementById("filtro-tipo").value);
});

const botaoFavorito = document.getElementById("botao-favorito");

botaoFavorito.addEventListener("click", function () {
    if (!pokemonAtual) {
        return;
    }

    if (pokemonEstaFavoritado(pokemonAtual.id)) {
        removerFavorito(pokemonAtual.id);
    } else {
        adicionarFavorito(pokemonAtual.id);
    }

    atualizarBotaoFavorito();

    const filtro = document.getElementById("filtro-tipo");

    if (filtro.value === "favoritos") {
        filtrarPokemons("favoritos");
    }
});
document.querySelector(".campo-pesquisa input").addEventListener("input", filtrarLista);

carregarPokemons();
