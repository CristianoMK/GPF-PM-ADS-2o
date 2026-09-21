const express = require('express');
const cors = require('cors');

const pokemonRoutes = require('./rotas/pokemon');
const favoritosRoutes = require('./rotas/favoritos');

const app = express();
const porta = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', pokemonRoutes);
app.use('/api', favoritosRoutes);

app.get('/', function (req, res) {
    res.send('Backend da Pokédex funcionando');
});

app.listen(porta, function () {
    console.log('Servidor rodando na porta ' + porta);
});
