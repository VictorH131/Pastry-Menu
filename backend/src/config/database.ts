 
import mysql, { type PoolOptions } from 'mysql2/promise';

// Valida as configurações de conexão
const porta = Number(process.env.DB_PORT ?? 3306);

if (!Number.isSafeInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error('Porta do MySQL inválida');
}

// Configura o banco de dados
const configuracao: PoolOptions = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: porta,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'pastry_menu',

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  connectTimeout: 10000
};

// Inicializa o pool de conexões
export const banco = mysql.createPool(configuracao);
