#!/usr/bin/env bash
set -e

caminho_script="${BASH_SOURCE[0]}"
if [[ "$caminho_script" != */* ]]; then
    caminho_script="./$caminho_script"
fi
cd -- "${caminho_script%/*}"

for comando in node npm python3; do
    if ! command -v "$comando" > /dev/null; then
        echo "Erro: instale $comando antes de iniciar o projeto." >&2
        exit 1
    fi
done

if [[ ! -d backend/node_modules/express || ! -d backend/node_modules/cors ]]; then
    echo "Dependências ausentes. Execute: npm ci --prefix backend" >&2
    exit 1
fi

# Verifica as portas antes de iniciar qualquer processo; não encerra quem já estiver usando uma delas.
node <<'JS'
const rede = require('node:net');

[3000, 5501].forEach(function (porta) {
    const servidor = rede.createServer();
    servidor.on('error', function (erro) {
        console.error('A porta ' + porta + ' está ocupada ou indisponível: ' + erro.message);
        console.error('Feche o servidor correspondente e tente novamente.');
        process.exitCode = 1;
    });
    servidor.listen(porta, function () {
        servidor.close();
    });
});
JS

pid_backend=""
pid_frontend=""
encerrar() {
    # Guarda somente os PIDs criados aqui, sem procurar ou encerrar outros servidores.
    if [[ -n "$pid_backend" ]]; then
        kill "$pid_backend" 2> /dev/null || true
        wait "$pid_backend" 2> /dev/null || true
    fi
    if [[ -n "$pid_frontend" ]]; then
        kill "$pid_frontend" 2> /dev/null || true
        wait "$pid_frontend" 2> /dev/null || true
    fi
}
trap encerrar EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# exec mantém o PID do processo iniciado, facilitando encerrá-lo com Ctrl+C.
(cd backend && PORT=3000 exec node server.js) &
pid_backend=$!
python3 -m http.server 5501 --bind 127.0.0.1 &
pid_frontend=$!

echo "Backend: http://localhost:3000"
echo "Pokédex: http://localhost:5501/pokedex.html"
echo "Pressione Ctrl+C para encerrar os dois servidores."

# Se um servidor falhar ou for encerrado, o outro também será encerrado pelo trap.
wait -n "$pid_backend" "$pid_frontend" || true
echo "Um dos servidores foi encerrado. Finalizando o projeto." >&2
exit 1
