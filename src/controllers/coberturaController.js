const pool = require('../database/db');
const { respuestaOk, respuestaError } = require('../utils/respuesta');

/**
 * GET /coberturas
 * Devuelve el listado de coberturas disponibles para elegir al registrarse.
 */
async function listarCoberturas(req, res) {
  try {
    const [coberturas] = await pool.query('SELECT id, nombre FROM cobertura ORDER BY nombre');
    return respuestaOk(res, 200, coberturas);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, 'Error interno al obtener las coberturas');
  }
}

module.exports = { listarCoberturas };
