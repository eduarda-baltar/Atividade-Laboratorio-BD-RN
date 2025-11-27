
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const Place = require('./models/Place'); 
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/geobackend';


app.use(cors());
app.options('*', cors()); 
app.use(express.json({ limit: '15mb' })); 
app.use(express.urlencoded({ extended: true, limit: '15mb' }));


app.get('/', (req, res) => {
  return res.json({ status: 'ok', message: 'Geo Backend API' });
});


app.get('/api/places', async (req, res) => {
  try {
    const places = await Place.find().sort({ createdAt: -1 });
    return res.json(places);
  } catch (err) {
    console.error('ERR GET /api/places', err);
    return res.status(500).json({ error: 'Erro ao listar registros' });
  }
});


app.post('/api/places', async (req, res) => {
  try {
    const { title, description, latitude, longitude, photo, lab, reportedAt } = req.body;

    if (!title || !description || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: title, description, latitude, longitude' });
    }

    const place = new Place({
      title,
      description,
      lab: lab || null,
      latitude,
      longitude,
      photo: photo || null,
      reportedAt: reportedAt ? new Date(reportedAt) : undefined,
    });

    await place.save();
    return res.status(201).json(place);
  } catch (err) {
    console.error('ERR POST /api/places', err);
    return res.status(500).json({ error: 'Erro ao salvar registro' });
  }
});


app.delete('/api/places', async (req, res) => {
  try {
    const result = await Place.deleteMany({});
    return res.json({ message: 'Todos os registros foram apagados.', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('ERR DELETE /api/places', err);
    return res.status(500).json({ error: 'Erro ao apagar registros.' });
  }
});


app.delete('/api/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const deleted = await Place.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    return res.json({ message: 'Registro apagado.' });
  } catch (err) {
    console.error('ERR DELETE /api/places/:id', err);
    return res.status(500).json({ error: 'Erro ao apagar registro.' });
  }
});


mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar no MongoDB', err);
    process.exit(1);
  });
