function descobrirArquivoAtual(caminho) {
    const partesDoCaminho = caminho.split("/");
    const ultimaPosicao = partesDoCaminho.length - 1;

    return partesDoCaminho[ultimaPosicao] || "index.html";

}

const arquivoAtual = descobrirArquivoAtual(window.location.pathname);

fetch("./header.html")
.then(function (resposta) {
    if (!resposta.ok) {
        throw new Error("Não foi possível carregar o cabeçalho.");
    }

    return resposta.text();
})
.then(function (html) {
    const areaHeader = document.getElementById("header");

    if (!areaHeader) {
        return;
    }

    areaHeader.innerHTML = html;
    if (document.body.classList.contains("pagina-pokedex") || document.body.classList.contains("pagina-itens")) {
        areaHeader.querySelector(".pesquisa-cabecalho").remove();
        return;
    }
    const formularioPesquisa = areaHeader.querySelector(".barra-pesquisa-header");
    const categoriaPesquisa = formularioPesquisa.querySelector(".categoria-pesquisa");
    const campoPesquisaHeader = formularioPesquisa.querySelector(".campo-pesquisa-header");
    const sugestoesHeader = areaHeader.querySelector("#sugestoes-header");
    const limparSugestoesHeader = prepararSugestoes(campoPesquisaHeader, sugestoesHeader, function () {
        formularioPesquisa.requestSubmit();
    }, categoriaPesquisa);

    // O submit atende tanto Enter quanto a lupa, inclusive no cabeçalho carregado por fetch.
    formularioPesquisa.addEventListener("submit", function (evento) {
        evento.preventDefault();
        limparSugestoesHeader();
        const termo = campoPesquisaHeader.value.trim();
        if (termo === "") {
            return;
        }
        const parametros = new URLSearchParams({ pesquisa: termo });
        const pagina = categoriaPesquisa.value === "itens" ? "itens.html" : "pokedex.html";
        window.location.href = pagina + "?" + parametros.toString();
    });
})
.catch(function (erro) {
    console.error("Erro ao carregar o cabeçalho:", erro);
});

fetch("./menu.html")
.then(function (resposta) {
    if (!resposta.ok) {
        throw new Error("Não foi possível carregar o menu.");
    }

    return resposta.text();
})
.then(function (conteudo) {
    const areaDoMenu = document.getElementById("menu");

    if (!areaDoMenu) {
        return;
    }

    areaDoMenu.innerHTML = conteudo;

    const opcoesMenu = document.querySelectorAll(".menu_item");

    opcoesMenu.forEach(function (opcao) {
        const arquivoOpcao = descobrirArquivoAtual(
            new URL(opcao.href).pathname
        );

        if (arquivoOpcao === arquivoAtual) {
            opcao.classList.add("ativo");
        }
    });

    const botaoMenu = document.getElementById("botao-menu");

    if (botaoMenu) {
        const fundoMenu = document.createElement("div");

        fundoMenu.classList.add("fundo-menu");
        fundoMenu.hidden = true;

        document.body.appendChild(fundoMenu);

        function fecharMenu() {
            areaDoMenu.classList.remove("menu-aberto");
            fundoMenu.hidden = true;

            botaoMenu.setAttribute("aria-expanded", "false");
            botaoMenu.setAttribute(
                "aria-label",
                "Abrir menu de navegação"
            );
        }

        function alternarMenu() {
            const menuAberto = areaDoMenu.classList.toggle(
                "menu-aberto"
            );

            fundoMenu.hidden = !menuAberto;

            botaoMenu.setAttribute(
                "aria-expanded",
                String(menuAberto)
            );

            botaoMenu.setAttribute(
                "aria-label",
                menuAberto
                    ? "Fechar menu de navegação"
                    : "Abrir menu de navegação"
            );
        }

        botaoMenu.addEventListener("click", alternarMenu);
        fundoMenu.addEventListener("click", fecharMenu);

        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape") {
                fecharMenu();
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth >= 768) {
                fecharMenu();
            }
        });
    }

    if (typeof ativarPopupDesenvolvimento === "function") {
        ativarPopupDesenvolvimento();
    }
})
.catch(function (erro) {
    console.error("Erro ao carregar o menu:", erro);
});