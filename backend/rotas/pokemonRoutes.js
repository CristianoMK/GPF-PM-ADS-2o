const express = require('express');
const pokemonController = require('../controles/pokemonController');

const router = express.Router();

router.get('/pokemon/search', pokemonController.search);
router.get('/pokemon/id/:id', pokemonController.getById);
router.get('/pokemon/:id/species', pokemonController.getSpecies);
router.get('/pokemon/:nome', pokemonController.getByName);
router.get('/type/:tipo', pokemonController.getByType);

module.exports = router;
