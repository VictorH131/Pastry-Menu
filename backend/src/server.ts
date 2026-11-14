
import { app } from './app.js';

// Define e valida a porta do servidor
const port = Number(process.env.PORT ?? 3001);

if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT inválida');
}

// Inicia o servidor
app.listen(port, '127.0.0.1', () => {
  console.log(`API disponível na porta ${port}`);
});
