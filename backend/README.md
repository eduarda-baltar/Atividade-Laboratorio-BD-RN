# Backend - Geo App

Backend simples em Node.js + Express + Mongoose.

## Requisitos

- Node.js 18+
- MongoDB rodando localmente (ou string de conexão em nuvem)

## Passos

```bash
cd backend
cp .env.example .env   # opcional: ajuste MONGO_URI e PORT se quiser
npm install
npm run dev            # ou npm start
```

A API ficará disponível em `http://localhost:3000` (ou na porta configurada).

### Rotas

- `GET /` - Healthcheck
- `GET /api/places` - Lista todos os registros
- `POST /api/places` - Cria um novo registro

Corpo esperado no `POST /api/places`:

```json
{
  "title": "Título",
  "description": "Descrição",
  "latitude": -8.05,
  "longitude": -34.9,
  "photo": "data:image/jpeg;base64,...."  // opcional
}
```
