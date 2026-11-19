import {
  Router,
  type Request,
  type Response,
  type NextFunction
} from 'express';

import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual
} from 'node:crypto';

import { promisify } from 'node:util';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { banco } from '../config/database.js';

const scrypt = promisify(scryptCallback);

export const api = Router();

// Configurações de sessão
const COOKIE = 'pm_sessao';
const DURACAO = 7 * 24 * 60 * 60 * 1000;
const PRODUCAO = process.env.NODE_ENV === 'production';

// Limitação de tentativas
const LIMITE_TENTATIVAS = 15;
const JANELA_TENTATIVAS = 15 * 60 * 1000;

const tentativas = new Map<string, {
  quantidade: number;
  ate: number;
}>();

// Tipagens
interface Usuario extends RowDataPacket {
  id_usu: number;
  nome: string;
  email: string;
  senha_hash: string | null;
}

interface Sessao extends RowDataPacket {
  id_usu: number;
  nome: string;
  email: string;
}

// Validações
function texto(valor: unknown, maximo: number): string {
  if (typeof valor !== 'string') return '';

  const resultado = valor.trim();

  return resultado.length <= maximo ? resultado : '';
}

function emailValido(email: string): boolean {
  return (
    email.length <= 190 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function urlValida(url: string): boolean {
  return (
    url.length <= 160 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url)
  );
}

// Tratamento de erros assíncronos
function asyncRoute(
  funcao: (req: Request, res: Response) => Promise<void>
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    Promise.resolve(funcao(req, res)).catch(next);
  };
}

// Segurança dos tokens
function hashToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

function criarCookie(token: string, duracao: number): string {
  const atributos = [
    `${COOKIE}=${token}`,
    'Path=/api',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(duracao / 1000)}`
  ];

  if (PRODUCAO) atributos.push('Secure');

  return atributos.join('; ');
}

function tokenDaRequisicao(req: Request): string {
  const cookies = req.headers.cookie?.split(';') ?? [];

  const sessao = cookies.find(valor =>
    valor.trim().startsWith(`${COOKIE}=`)
  );

  return sessao
    ? sessao.trim().slice(COOKIE.length + 1)
    : '';
}

// Segurança das senhas
async function gerarSenhaHash(senha: string): Promise<string> {
  const sal = randomBytes(16).toString('hex');

  const hash = await scrypt(senha, sal, 64) as Buffer;

  return `scrypt:${sal}:${hash.toString('hex')}`;
}

async function verificarSenha(
  senha: string,
  armazenada: string
): Promise<boolean> {
  const partes = armazenada.split(':');

  if (partes.length !== 3) return false;

  const [algoritmo, sal, hash] = partes;

  if (
    algoritmo !== 'scrypt' ||
    !/^[a-f0-9]{32}$/.test(sal) ||
    !/^[a-f0-9]{128}$/.test(hash)
  ) {
    return false;
  }

  const calculado = await scrypt(senha, sal, 64) as Buffer;
  const esperado = Buffer.from(hash, 'hex');

  return timingSafeEqual(calculado, esperado);
}

// Gerenciamento de sessões
async function iniciarSessao(
  res: Response,
  usuarioId: number
): Promise<void> {
  const token = randomBytes(32).toString('hex');

  await banco.execute(
    `INSERT INTO sessoes_usuarios
      (id_usu, token_hash, expira_em)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [usuarioId, hashToken(token)]
  );

  res.setHeader(
    'Set-Cookie',
    criarCookie(token, DURACAO)
  );
}

async function usuarioAtual(req: Request): Promise<Sessao | null> {
  const token = tokenDaRequisicao(req);

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const [usuarios] = await banco.execute<Sessao[]>(
    `SELECT u.id_usu, u.nome, u.email
     FROM sessoes_usuarios s
     INNER JOIN usuarios u ON u.id_usu = s.id_usu
     WHERE s.token_hash = ?
       AND s.expira_em > NOW()
       AND u.ativo = TRUE
     LIMIT 1`,
    [hashToken(token)]
  );

  return usuarios[0] ?? null;
}

async function exigirUsuario(
  req: Request,
  res: Response
): Promise<Sessao | null> {
  const usuario = await usuarioAtual(req);

  if (!usuario) {
    res.status(401).json({
      erro: 'Autenticação necessária'
    });

    return null;
  }

  return usuario;
}

// Limitação de requisições
function limitar(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const chave = req.ip ?? 'desconhecido';
  const agora = Date.now();

  const registro = tentativas.get(chave);

  if (!registro || agora >= registro.ate) {
    tentativas.set(chave, {
      quantidade: 1,
      ate: agora + JANELA_TENTATIVAS
    });

    next();
    return;
  }

  if (registro.quantidade >= LIMITE_TENTATIVAS) {
    res.setHeader(
      'Retry-After',
      String(Math.ceil((registro.ate - agora) / 1000))
    );

    res.status(429).json({
      erro: 'Muitas tentativas. Tente novamente mais tarde.'
    });

    return;
  }

  registro.quantidade++;
  next();
}

// Proteção contra requisições de outras origens

/* Proteção contra requisições de outras origens */

const origensPermitidas = new Set([
  'http://127.0.0.1:5174',
  'http://localhost:5174'
]);

api.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const origem = req.headers.origin;
  const host = req.headers.host;

  if (origem) {
    try {
      const url = new URL(origem);

      const mesmaOrigem =
        url.host === host &&
        (
          url.protocol === 'http:' ||
          url.protocol === 'https:'
        );

      const frontendLocalPermitido =
        !PRODUCAO &&
        origensPermitidas.has(url.origin) &&
        (
          host === '127.0.0.1:5173' ||
          host === 'localhost:5173'
        );

      if (mesmaOrigem || frontendLocalPermitido) {
        next();
        return;
      }
    } catch {
      // Origem inválida
    }

    res.status(403).json({
      erro: 'Origem não permitida'
    });

    return;
  }

  if (req.headers['sec-fetch-site'] === 'cross-site') {
    res.status(403).json({
      erro: 'Origem não permitida'
    });

    return;
  }

  next();
});


// Cadastro de usuário
api.post('/cadastro', limitar, asyncRoute(async (req, res) => {
  const nome = texto(req.body?.nome, 120);
  const email = texto(req.body?.email, 190).toLowerCase();
  const senha = req.body?.senha;

  if (
    !nome ||
    !emailValido(email) ||
    typeof senha !== 'string' ||
    senha.length < 8 ||
    senha.length > 128
  ) {
    res.status(400).json({
      erro: 'Dados de cadastro inválidos'
    });

    return;
  }

  const hash = await gerarSenhaHash(senha);

  try {
    const [resultado] = await banco.execute<ResultSetHeader>(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES (?, ?, ?)`,
      [nome, email, hash]
    );

    await iniciarSessao(res, resultado.insertId);

    res.status(201).json({
      usuario: {
        id_usu: resultado.insertId,
        nome,
        email
      }
    });
  } catch (erro) {
    if ((erro as { code?: string }).code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        erro: 'E-mail já cadastrado'
      });

      return;
    }

    throw erro;
  }
}));

// Login
api.post('/entrar', limitar, asyncRoute(async (req, res) => {
  const email = texto(req.body?.email, 190).toLowerCase();
  const senha = req.body?.senha;

  if (
    !emailValido(email) ||
    typeof senha !== 'string' ||
    !senha ||
    senha.length > 128
  ) {
    res.status(400).json({
      erro: 'Credenciais inválidas'
    });

    return;
  }

  const [usuarios] = await banco.execute<Usuario[]>(
    `SELECT id_usu, nome, email, senha_hash
     FROM usuarios
     WHERE email = ? AND ativo = TRUE
     LIMIT 1`,
    [email]
  );

  const usuario = usuarios[0];

  if (
    !usuario ||
    !usuario.senha_hash ||
    !(await verificarSenha(senha, usuario.senha_hash))
  ) {
    res.status(401).json({
      erro: 'E-mail ou senha incorretos'
    });
    return;
  }

  await iniciarSessao(res, usuario.id_usu);

  res.json({
    usuario: {
      id_usu: usuario.id_usu,
      nome: usuario.nome,
      email: usuario.email
    }
  });
}));

// Logout
api.post('/sair', asyncRoute(async (req, res) => {
  const token = tokenDaRequisicao(req);

  if (/^[a-f0-9]{64}$/.test(token)) {
    await banco.execute(
      'DELETE FROM sessoes_usuarios WHERE token_hash = ?',
      [hashToken(token)]
    );
  }

  res.setHeader('Set-Cookie', criarCookie('', 0));

  res.json({
    mensagem: 'Sessão encerrada'
  });
}));

// Consulta da sessão
api.get('/sessao', asyncRoute(async (req, res) => {
  const usuario = await exigirUsuario(req, res);

  if (!usuario) return;

  res.json({
    usuario
  });
}));

// Lista estabelecimentos ativos
api.get('/estabelecimentos', asyncRoute(async (_req, res) => {
  const [estabelecimentos] = await banco.execute<RowDataPacket[]>(
    `SELECT id_loja, nome, url, descricao,
            cidade, estado, tempo_preparo, tipo_operacao
     FROM estabelecimentos
     WHERE ativo = TRUE
     ORDER BY id_loja DESC
     LIMIT 100`
  );

  res.json(estabelecimentos);
}));

// Minha Área
api.get('/minha-area', asyncRoute(async (req, res) => {
  const usuario = await exigirUsuario(req, res);

  if (!usuario) return;

  const [estabelecimentos] = await banco.execute<RowDataPacket[]>(
    `SELECT id_loja, nome, url, descricao,
            cidade, estado, tempo_preparo, tipo_operacao
     FROM estabelecimentos
     WHERE id_usu = ?
     ORDER BY id_loja DESC
     LIMIT 100`,
    [usuario.id_usu]
  );

  res.json({
    usuario: {
      nome: usuario.nome,
      email: usuario.email
    },
    estabelecimentos
  });
}));

// Cadastro de estabelecimento
api.post('/estabelecimentos', asyncRoute(async (req, res) => {
  const usuario = await exigirUsuario(req, res);

  if (!usuario) return;

  const nome = texto(req.body?.nome, 150);
  const url = texto(req.body?.url, 160).toLowerCase();
  const tipo = req.body?.tipo_operacao;

  const descricao = texto(req.body?.descricao, 160);
  const telefone = texto(req.body?.telefone, 20);
  const cidade = texto(req.body?.cidade, 100);
  const estado = texto(req.body?.estado, 2).toUpperCase();
  const tempo = texto(req.body?.tempo_preparo, 50) || '20 - 30 minutos';

  const tiposPermitidos = [
    'tradicional',
    'dark_kitchen',
    'ponto_movel'
  ];

  if (
    !nome ||
    !urlValida(url) ||
    !tiposPermitidos.includes(tipo) ||
    (estado && !/^[A-Z]{2}$/.test(estado))
  ) {
    res.status(400).json({
      erro: 'Dados do estabelecimento inválidos'
    });

    return;
  }

  try {
    const [resultado] = await banco.execute<ResultSetHeader>(
      `INSERT INTO estabelecimentos
        (id_usu, nome, url, tipo_operacao, descricao,
         telefone, cidade, estado, tempo_preparo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario.id_usu,
        nome,
        url,
        tipo,
        descricao || null,
        telefone || null,
        cidade || null,
        estado || null,
        tempo
      ]
    );

    res.status(201).json({
      id_loja: resultado.insertId
    });
  } catch (erro) {
    if ((erro as { code?: string }).code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        erro: 'Esta URL já está em uso'
      });

      return;
    }

    throw erro;
  }
}));
