const express = require('express');
const router = express.Router();

const { registro, login, perfil } = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const { respuestaOk } = require('../utils/respuesta');

// Endpoints públicos
router.post('/registro', registro);
router.post('/login', login);

// Endpoint protegido solo por verificarToken (cualquier usuario logueado)
router.get('/perfil', verificarToken, perfil);

// Endpoint de prueba protegido ademas por verificarRol
// (para dejar probado que el middleware de roles rechaza con 403 a quien no corresponda)
router.get('/admin-test', verificarToken, verificarRol('admin', 'operador'), (req, res) => {
  return respuestaOk(res, 200, {
    mensaje: 'Acceso concedido a endpoint restringido por rol',
    usuario: req.usuario
  });
});

module.exports = router;
