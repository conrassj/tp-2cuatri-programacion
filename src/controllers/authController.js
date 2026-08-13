const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');
const { respuestaOk, respuestaError } = require('../utils/respuesta');
require('dotenv').config();

const SALT_ROUNDS = 10;

/**
 * POST /auth/registro
 * Registra un nuevo paciente. El rol queda fijo en "paciente".
 */
async function registro(req, res) {
  try {
    const { nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura } = req.body;

    if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !id_cobertura) {
      return respuestaError(res, 400, 'Faltan datos obligatorios (nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura)');
    }

    // Validar que la cobertura exista
    const [coberturas] = await pool.query('SELECT id FROM cobertura WHERE id = ?', [id_cobertura]);
    if (coberturas.length === 0) {
      return respuestaError(res, 400, 'La cobertura seleccionada no existe');
    }

    // Validar que DNI y email no estén duplicados
    const [existentes] = await pool.query(
      'SELECT id FROM usuario WHERE dni = ? OR email = ?',
      [dni, email]
    );
    if (existentes.length > 0) {
      return respuestaError(res, 409, 'Ya existe un usuario registrado con ese DNI o email');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [resultado] = await pool.query(
      `INSERT INTO usuario (apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura)
       VALUES (?, ?, ?, ?, 'paciente', ?, ?, ?, NULL, ?)`,
      [apellido, nombre, fecha_nacimiento, passwordHash, email, req.body.telefono || '', dni, id_cobertura]
    );

    return respuestaOk(res, 201, {
      id: resultado.insertId,
      nombre,
      apellido,
      dni,
      email,
      rol: 'paciente'
    });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, 'Error interno al registrar el usuario');
  }
}

/**
 * POST /auth/login
 * Recibe dni y password. Devuelve un JWT con id, rol e id_sede.
 */
async function login(req, res) {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      return respuestaError(res, 400, 'Debe enviar dni y password');
    }

    const [usuarios] = await pool.query('SELECT * FROM usuario WHERE dni = ?', [dni]);

    if (usuarios.length === 0) {
      return respuestaError(res, 401, 'Credenciales inválidas');
    }

    const usuario = usuarios[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return respuestaError(res, 401, 'Credenciales inválidas');
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, id_sede: usuario.id_sede },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return respuestaOk(res, 200, {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        id_sede: usuario.id_sede
      }
    });
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, 'Error interno al iniciar sesión');
  }
}

/**
 * GET /auth/perfil (protegido con verificarToken)
 * Devuelve los datos del usuario logueado a partir del token.
 */
async function perfil(req, res) {
  try {
    const [usuarios] = await pool.query(
      'SELECT id, nombre, apellido, email, dni, rol, id_sede, id_cobertura, fecha_nacimiento FROM usuario WHERE id = ?',
      [req.usuario.id]
    );

    if (usuarios.length === 0) {
      return respuestaError(res, 404, 'Usuario no encontrado');
    }

    return respuestaOk(res, 200, usuarios[0]);
  } catch (error) {
    console.error(error);
    return respuestaError(res, 500, 'Error interno al obtener el perfil');
  }
}

module.exports = { registro, login, perfil };
