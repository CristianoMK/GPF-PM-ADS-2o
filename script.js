
function descobrirArquivoAtual(caminho) {
    const partesDoCaminho = caminho.split("/");
    const ultimaPosicao = partesDoCaminho.length - 1;

    return partesDoCaminho[ultimaPosicao] || "index.html";
}

const arquivoAtual = descobrirArquivoAtual(window.location.pathname);

// ==============================
// MODO ESCURO
// ==============================

function aplicarTemaSalvo() {
    const temaSalvo = localStorage.getItem("gpf-tema");

    document.body.classList.toggle(
        "tema-escuro",
        temaSalvo === "escuro"
    );
}

function alterarTema(ativar) {
    document.body.classList.toggle("tema-escuro", ativar);

    localStorage.setItem(
        "gpf-tema",
        ativar ? "escuro" : "claro"
    );
}

// ==============================
// PAINEL DE CONFIGURAÇÕES
// ==============================

function configurarPainelConfiguracoes() {
    const botaoConfiguracoes = document.getElementById(
        "abrir-configuracoes"
    );

    if (!botaoConfiguracoes) {
        return;
    }

    if (document.getElementById("painel-configuracoes")) {
        return;
    }

    const fundo = document.createElement("div");
    fundo.id = "painel-configuracoes";
    fundo.className = "fundo-configuracoes";
    fundo.setAttribute("role", "dialog");
    fundo.setAttribute("aria-modal", "true");
    fundo.setAttribute("aria-labelledby", "titulo-configuracoes");

    fundo.innerHTML = `
        <section class="caixa-configuracoes">

            <div class="cabecalho-configuracoes">
                <h2 id="titulo-configuracoes">CONFIGURAÇÕES</h2>

                <button
                    type="button"
                    class="fechar-configuracoes"
                    aria-label="Fechar configurações"
                >
                    &times;
                </button>
            </div>

            <div class="opcao-configuracao">
                <div>
                    <h3>Modo escuro</h3>
                    <p>Altere a aparência do site.</p>
                </div>

                <label class="interruptor-tema">
                    <input
                        type="checkbox"
                        id="alternar-tema"
                    >
                    <span class="controle-interruptor"></span>
                </label>
            </div>

            <div class="opcao-configuracao opcao-reiniciar">
                <div>
                    <h3>Reiniciar site</h3>
                    <p>
                        Apaga favoritos, preferências e dados
                        armazenados neste navegador.
                    </p>
                </div>

                <button
                    type="button"
                    id="reiniciar-site"
                    class="botao-reiniciar"
                >
                    REINICIAR
                </button>
            </div>

        </section>
    `;

    document.body.appendChild(fundo);

    const botaoFechar = fundo.querySelector(
        ".fechar-configuracoes"
    );

    const alternarTema = fundo.querySelector(
        "#alternar-tema"
    );

    const botaoReiniciar = fundo.querySelector(
        "#reiniciar-site"
    );

    alternarTema.checked = document.body.classList.contains(
        "tema-escuro"
    );

    function fecharConfiguracoes() {
        fundo.classList.remove("configuracoes-abertas");
        document.body.classList.remove("configuracoes-bloqueadas");
    }

    function abrirConfiguracoes() {
        fundo.classList.add("configuracoes-abertas");
        document.body.classList.add("configuracoes-bloqueadas");
    }

    botaoConfiguracoes.addEventListener(
        "click",
        abrirConfiguracoes
    );

    botaoFechar.addEventListener(
        "click",
        fecharConfiguracoes
    );

    fundo.addEventListener("click", function (evento) {
        if (evento.target === fundo) {
            fecharConfiguracoes();
        }
    });

    document.addEventListener("keydown", function (evento) {
        if (
            evento.key === "Escape" &&
            fundo.classList.contains("configuracoes-abertas")
        ) {
            fecharConfiguracoes();
        }
    });

    alternarTema.addEventListener("change", function () {
        alterarTema(alternarTema.checked);
    });

    botaoReiniciar.addEventListener("click", function () {
        const confirmar = window.confirm(
            "Tem certeza que deseja reiniciar o site?\n\n" +
            "Essa ação apagará favoritos, preferências e dados " +
            "armazenados neste navegador."
        );

        if (!confirmar) {
            return;
        }

        // Apaga os dados armazenados pelo site.
        localStorage.clear();
        sessionStorage.clear();

        // Remove cookies acessíveis pelo JavaScript.
        document.cookie.split(";").forEach(function (cookie) {
            const nome = cookie.split("=")[0].trim();

            document.cookie =
                nome +
                "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        });

        // Limpa os caches do navegador, quando disponíveis.
        if ("caches" in window) {
            caches.keys().then(function (nomes) {
                return Promise.all(
                    nomes.map(function (nome) {
                        return caches.delete(nome);
                    })
                );
            }).finally(function () {
                window.location.reload();
            });
        } else {
            window.location.reload();
        }
    });
}

// ==============================
// MENU MOBILE
// ==============================

function ativarMenuMobile() {
    const areaDoMenu = document.getElementById("menu");
    const botaoMenu = document.getElementById("botao-menu");

    if (
        areaDoMenu &&
        botaoMenu &&
        areaDoMenu.querySelector(".menu_lateral") &&
        botaoMenu.dataset.eventosAtivos !== "true"
    ) {
        botaoMenu.dataset.eventosAtivos = "true";

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
}

// ==============================
// CABEÇALHO
// ==============================

function carregarCabecalho() {
    try {
        const areaHeader = document.getElementById("header");

        if (!areaHeader) {
            return;
        }

        ativarMenuMobile();

        if (
            document.body.classList.contains("pagina-pokedex") ||
            document.body.classList.contains("pagina-itens")
        ) {
            const pesquisaCabecalho = areaHeader.querySelector(
                ".pesquisa-cabecalho"
            );

            if (pesquisaCabecalho) {
                pesquisaCabecalho.remove();
            }

            return;
        }

        const formularioPesquisa = areaHeader.querySelector(
            ".barra-pesquisa-header"
        );

        if (!formularioPesquisa) {
            return;
        }

        const categoriaPesquisa = formularioPesquisa.querySelector(
            ".categoria-pesquisa"
        );

        const campoPesquisaHeader = formularioPesquisa.querySelector(
            ".campo-pesquisa-header"
        );

        const sugestoesHeader = areaHeader.querySelector(
            "#sugestoes-header"
        );

        const limparSugestoesHeader = prepararSugestoes(
            campoPesquisaHeader,
            sugestoesHeader,
            function () {
                formularioPesquisa.requestSubmit();
            },
            categoriaPesquisa
        );

        formularioPesquisa.addEventListener(
            "submit",
            function (evento) {
                evento.preventDefault();

                limparSugestoesHeader();

                const termo = campoPesquisaHeader.value.trim();

                if (termo === "") {
                    return;
                }

                const parametros = new URLSearchParams({
                    pesquisa: termo
                });

                const pagina =
                    categoriaPesquisa.value === "itens"
                        ? "itens.html"
                        : "pokedex.html";

                window.location.href =
                    pagina + "?" + parametros.toString();
            }
        );

    } catch (erro) {
        console.error("Erro ao carregar o cabeçalho:", erro);
    }
}

// ==============================
// MENU LATERAL
// ==============================

function carregarMenu() {
    try {
        const areaDoMenu = document.getElementById("menu");

        if (!areaDoMenu) {
            return;
        }

        const opcoesMenu = document.querySelectorAll(".menu_item");

        opcoesMenu.forEach(function (opcao) {
            if (!opcao.href) {
                return;
            }

            const arquivoOpcao = descobrirArquivoAtual(
                new URL(opcao.href).pathname
            );

            const filtroOpcao = new URL(
                opcao.href
            ).searchParams.get("filtro");

            const filtroAtual = new URLSearchParams(
                window.location.search
            ).get("filtro");

            if (
                arquivoOpcao === arquivoAtual &&
                filtroOpcao === filtroAtual
            ) {
                opcao.classList.add("ativo");
            }
        });

        ativarMenuMobile();
        configurarPainelConfiguracoes();

    } catch (erro) {
        console.error("Erro ao carregar o menu:", erro);
    }
}

// ==============================
// INICIALIZAÇÃO
// ==============================

aplicarTemaSalvo();
carregarCabecalho();
carregarMenu();
