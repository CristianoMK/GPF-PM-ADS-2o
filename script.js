// Identifica o arquivo atual
function descobrirArquivoAtual(caminho) {
    const partesDoCaminho = caminho.split("/");
    const ultimaPosicao = partesDoCaminho.length - 1;

    return partesDoCaminho[ultimaPosicao] || "index.html";

}

const arquivoAtual = descobrirArquivoAtual(window.location.pathname);

/* Carrega o cabeçalho compartilhado */
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
})
.catch(function (erro) {
    console.error("Erro ao carregar o cabeçalho:", erro);
});

/* Carrega o menu lateral */
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

    /* Identifica a página atual no menu */
    const opcoesMenu = document.querySelectorAll(".menu_item");

    opcoesMenu.forEach(function (opcao) {
        const arquivoOpcao = descobrirArquivoAtual(
            new URL(opcao.href).pathname
        );

        if (arquivoOpcao === arquivoAtual) {
            opcao.classList.add("ativo");
        }
    });

    /* Configura o menu responsivo */
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

    /* Ativa os pop-ups de páginas em desenvolvimento */
    if (typeof ativarPopupDesenvolvimento === "function") {
        ativarPopupDesenvolvimento();
    }
})
.catch(function (erro) {
    console.error("Erro ao carregar o menu:", erro);
});