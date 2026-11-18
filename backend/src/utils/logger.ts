import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const diretorio = join(process.cwd(), 'logs');
const arquivo = join(diretorio, 'servidor.log');

type Nivel = 'INFO' | 'ERRO' | 'AVISO';

async function registrar(nivel: Nivel, mensagem: string): Promise<void> {
  const data = new Date().toISOString();
  const linha = `[${data}] [${nivel}] ${mensagem}\n`;

  console.log(linha.trim());

  try {
    await mkdir(diretorio, { recursive: true });
    await appendFile(arquivo, linha, 'utf8');
  } catch (erro) {
    console.error('Falha ao gravar log:', erro);
  }
}

export const logger = {
  info: (mensagem: string) => registrar('INFO', mensagem),
  erro: (mensagem: string) => registrar('ERRO', mensagem),
  aviso: (mensagem: string) => registrar('AVISO', mensagem)
};