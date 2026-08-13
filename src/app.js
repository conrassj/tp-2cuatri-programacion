const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const coberturaRoutes = require('./routes/coberturaRoutes');
const { respuestaError } = require('./utils/respuesta');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/coberturas', coberturaRoutes);

// Ruta no encontrada
app.use((req, res) => {
  return respuestaError(res, 404, 'Recurso no encontrado');
});

module.exports = app;
