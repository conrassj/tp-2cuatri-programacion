/**
 * Formato de respuesta uniforme para todo el backend (definido en el enunciado general):
 * {
 *   codigo: <numero HTTP>,
 *   estado: "ok" | "<mensaje de error>",
 *   datos: <objeto/array/null>
 * }
 */

function respuestaOk(res, codigo, datos = null) {
  return res.status(codigo).json({
    codigo,
    estado: 'ok',
    datos
  });
}

function respuestaError(res, codigo, mensaje, datos = null) {
  return res.status(codigo).json({
    codigo,
    estado: mensaje,
    datos
  });
}

module.exports = { respuestaOk, respuestaError };
