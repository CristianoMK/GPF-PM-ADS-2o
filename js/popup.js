function ativarPopupDesenvolvimento() {
    const popup = document.getElementById('popup-desenvolvimento');
    const botaoFechar = document.getElementById('fechar-popup');
    const elementos = document.querySelectorAll('.em-desenvolvimento');

    if (!popup || !botaoFechar) {
        return;
    }

    elementos.forEach(function (elemento) {
        if (elemento.dataset.popupAtivo === 'true') {
            return;
        }

        elemento.dataset.popupAtivo = 'true';

        elemento.addEventListener('click', function (evento) {
            evento.preventDefault();
            popup.classList.add('mostrar-popup');
        });
    });

    if (popup.dataset.eventosAtivos === 'true') {
        return;
    }

    popup.dataset.eventosAtivos = 'true';

    botaoFechar.addEventListener('click', function () {
        popup.classList.remove('mostrar-popup');
    });

    popup.addEventListener('click', function (evento) {
        if (evento.target === popup) {
            popup.classList.remove('mostrar-popup');
        }
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            popup.classList.remove('mostrar-popup');
        }
    });
}

ativarPopupDesenvolvimento();
