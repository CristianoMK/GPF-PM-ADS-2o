const express = require('express');
const cors = require('cors');
const pokemonRoutes = require('./rotas/pokemonRoutes');
const favoritoRoutes = require('./rotas/favoritoRoutes');
const pesquisaRoutes = require('./rotas/pesquisaRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (request, response) => {
    response.json({
        status: 'ok',
        message: 'Backend da Pokedex funcionando'
    });
});

app.use('/api', pokemonRoutes);
app.use('/api', favoritoRoutes);
app.use('/api/pesquisa', pesquisaRoutes);

app.use((request, response) => {
    response.status(404).json({ error: 'Rota não encontrada' });
});

app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
        return response.status(400).json({ error: 'JSON inválido' });
    }

    console.error('Erro não tratado:', error.message);
    return response.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`Backend da Pokédex disponível em http://localhost:${PORT}`);
});
