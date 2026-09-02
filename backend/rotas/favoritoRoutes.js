const express = require('express');
const favoritoController = require('../controles/favoritoController');

const router = express.Router();

router.get('/favorites', favoritoController.list);
router.post('/favorites', favoritoController.create);
router.delete('/favorites/:pokemonId', favoritoController.remove);

module.exports = router;
