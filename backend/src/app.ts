
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { healthRouter } from './routes/health.js';

// Inicializa o Express e configura a segurança
export const app = express();


app.disable('x-powered-by'); // Remove o cabeçalho que identifica o Express.
app.use(helmet()); // Configura o Helmet para proteger a API 
app.use(express.json({ limit: '16kb' })); // requisições JSON com limite de 16kb

// Registra as rotas da API
app.use('/api/health', healthRouter);

// Trata rotas inexistentes
app.use((_request, response) => {
  response.status(404).json({
    error: 'Rota não encontrada'
  });
});

// Centraliza o tratamento de erros
const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next
) => {
  console.error(
    'Erro interno:',
    error instanceof Error ? error.message : 'desconhecido'
  );

  if (response.headersSent) {
    _next(error);
    return;
  }

  response.status(500).json({
    error: 'Erro interno do servidor'
  });
};

app.use(errorHandler);
