import { app } from './app.js';
import { banco } from './config/database.js';
import { logger } from './utils/logger.js';

// Define e valida a porta do servidor
const port = Number(process.env.PORT ?? 3001);

if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT inválida');
}

// Verifica a conexão com o banco de dados
async function verificarBanco(): Promise<void> {
  try {
    const conexao = await banco.getConnection();
    conexao.release();

    await logger.info('MySQL conectado com sucesso.');
  } catch (error) {
    const mensagem = error instanceof Error
      ? error.message
      : 'Erro desconhecido';

    await logger.erro(`Falha na conexão com MySQL: ${mensagem}`);

    process.exitCode = 1;
    throw error;
  }
}

await verificarBanco();

// Inicia o servidor
app.listen(port, '127.0.0.1', () => {
  console.log(`API disponível na porta ${port}`);
});