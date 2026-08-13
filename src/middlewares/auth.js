const jwt = require('jsonwebtoken');
const { respuestaError } = require('../utils/respuesta');
require('dotenv').config();

/**
 * Valida que venga un JWT válido en el header Authorization: Bearer <token>.
 * Si es válido, guarda los datos del usuario en req.usuario y continúa.
 * Si no, responde 401.
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return respuestaError(res, 401, 'No se proporcionó un token de autenticación');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, rol, id_sede }
    next();
  } catch (error) {
    return respuestaError(res, 401, 'Token inválido o vencido');
  }
}

/**
 * Debe usarse siempre DESPUES de verificarToken.
 * Valida que req.usuario.rol esté entre los roles permitidos.
 * Si no, responde 403.
 */
function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return respuestaError(res, 401, 'No se proporcionó un token de autenticación');
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return respuestaError(res, 403, 'No tiene permisos para acceder a este recurso');
    }

    next();
  };
}

module.exports = { verificarToken, verificarRol };
