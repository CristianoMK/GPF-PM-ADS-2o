const chaveFavoritos = 'pokedex-favoritos-v1';

// Aceita os formatos antigos com objetos ou IDs sem precisar consultar a API.
function lerFavoritosLocais() {
    const textoAtual = localStorage.getItem(chaveFavoritos);
    const texto = textoAtual === null ? localStorage.getItem('favoritos') : textoAtual;
    if (texto === null) return [];

    let dados;
    try {
        dados = JSON.parse(texto);
    } catch (erro) {
        return [];
    }
    if (!Array.isArray(dados)) return [];

    const ids = [];
    for (const registro of dados) {
        const valor = registro && typeof registro === 'object' ? registro.id : registro;
        const id = typeof valor === 'string' && /^\d+$/.test(valor) ? Number(valor) : valor;
        if (Number.isSafeInteger(id) && id > 0 && !ids.includes(id)) {
            ids.push(id);
        }
    }
    // Converte a lista anterior apenas depois de conseguir ler seus dados.
    if (textoAtual === null || ids.length !== dados.length || dados.some(function (registro) { return typeof registro !== 'number'; })) {
        salvarFavoritosLocais(ids);
    }
    return ids;
}

function salvarFavoritosLocais(ids) {
    localStorage.setItem(chaveFavoritos, JSON.stringify(ids));
}

function adicionarFavoritoLocal(id) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('ID de Pokémon inválido');
    const ids = lerFavoritosLocais();
    if (ids.includes(id)) throw new Error('Pokémon já está nos favoritos');
    ids.push(id);
    salvarFavoritosLocais(ids);
    return ids;
}

function removerFavoritoLocal(id) {
    const ids = lerFavoritosLocais().filter(function (favorito) { return favorito !== id; });
    salvarFavoritosLocais(ids);
    return ids;
}
