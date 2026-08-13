const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { respuestaOk, respuestaError } = require('../utils/respuesta');

// GET /health -> prueba la conexion a la base de datos
router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return respuestaOk(res, 200, { mensaje: 'API funcionando y conectada a la base de datos' });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, 'No se pudo conectar a la base de datos');
  }
});

module.exports = router;
