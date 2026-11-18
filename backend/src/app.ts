import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { logger } from './utils/logger.js';

// Inicializa o Express
export const app = express();

// Configurações de segurança
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '16kb' }));

// Trata rotas inexistentes
app.use((_request, response) => {
  response.status(404).json({
    erro: 'Rota não encontrada'
  });
});

// Centraliza o tratamento de erros
const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  next
) => {
  const mensagem = error instanceof Error
    ? error.message
    : 'Erro desconhecido';

  void logger.erro(`${request.method} ${request.path}: ${mensagem}`);

  if (response.headersSent) {
    next(error);
    return;
  }

  response.status(500).json({
    erro: 'Erro interno do servidor'
  });
};

app.use(errorHandler);