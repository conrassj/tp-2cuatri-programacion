const express = require('express');
const router = express.Router();

const { listarCoberturas } = require('../controllers/coberturaController');

router.get('/', listarCoberturas);

module.exports = router;
