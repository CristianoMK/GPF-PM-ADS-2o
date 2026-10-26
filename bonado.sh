
#!/bin/bash

# Verifica se o wl-copy está instalado
if ! command -v wl-copy >/dev/null 2>&1; then
    echo "Erro: wl-copy não está instalado."
    echo "Instale com: sudo dnf install wl-clipboard"
    exit 1
fi

# Lista arquivos e copia seus conteúdos para a área de transferência
find . \
    -type f \
    -not -path './.git/*' \
    -not -path './node_modules/*' \
    -not -path './.venv/*' \
    -not -path './venv/*' \
    -print0 |
while IFS= read -r -d '' arquivo; do

    # Ignora arquivos binários comuns
    case "$arquivo" in
        *.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico|*.pdf|*.zip|*.gz|*.mp4|*.mp3)
            continue
            ;;
    esac

    # Identificação do arquivo
    printf '\n\n========== %s ==========\n' "$arquivo"

    # Conteúdo do arquivo
    cat "$arquivo" 2>/dev/null

done | wl-copy

echo "Projeto copiado para a área de transferência!"
echo "Agora use Ctrl + V para colar."
