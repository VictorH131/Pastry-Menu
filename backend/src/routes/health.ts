import { Router } from 'express';

// Inicializa o roteador responsável por verificar a API
export const healthRouter = Router();

// Verifica a autorização antes de informar o status do servidor
healthRouter.get('/', (request, response) => {
  const apiKey = process.env.HEALTH_KEY;

  // Bloqueia o acesso caso a chave não esteja configurada
  if (!apiKey) {
    response.status(503).json({
      error: 'Serviço indisponível'
    });
    return;
  }

  // Impede consultas sem a chave de autenticação correta
  if (request.get('x-health-key') !== apiKey) {
    response.status(401).json({
      error: 'Não autorizado'
    });
    return;
  }

  // Confirma que a API está respondendo normalmente
  response.json({ status: 'ok' });
});