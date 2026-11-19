
import { Router } from 'express';
import { randomBytes, createHash } from 'node:crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

import { banco } from '../config/database.js';
import {
  verificarGoogle,
  ErroTokenGoogle
} from './googleAuth.js';

const router = Router();

interface Usuario extends RowDataPacket {
  id_usu: number;
  nome: string;
  email: string | null;
  google_id: string | null;
  ativo: number;
}

const COOKIE = 'pm_sessao';
const DURACAO = 7 * 24 * 60 * 60 * 1000;

/* GERAR HASH DO TOKEN */
function hashToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

/* CRIAR SESSÃO */
async function iniciarSessao(usuarioId: number): Promise<string> {
  const token = randomBytes(32).toString('hex');

  await banco.execute(
    `INSERT INTO sessoes_usuarios
       (id_usu, token_hash, expira_em)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [usuarioId, hashToken(token)]
  );

  return token;
}

/* LOGIN E CADASTRO COM GOOGLE */
router.post('/google', async (request, response) => {
  const { token } = request.body ?? {};

  if (
    typeof token !== 'string' ||
    !token ||
    token.length > 8192
  ) {
    return response.status(400).json({
      erro: 'Token Google inválido ou não informado'
    });
  }

  try {
    /* VALIDAR TOKEN GOOGLE */
    const google = await verificarGoogle(token);

    if (
      !google.emailVerificado ||
      !google.email ||
      google.email.length > 190 ||
      !google.nome ||
      google.nome.length > 120
    ) {
      return response.status(401).json({
        erro: 'Conta Google sem dados válidos'
      });
    }

    /* PROCURAR USUÁRIO PELO GOOGLE ID */
    const [usuarios] = await banco.execute<Usuario[]>(
      `SELECT
         id_usu,
         nome,
         email,
         google_id,
         ativo
       FROM usuarios
       WHERE google_id = ?
       LIMIT 1`,
      [google.googleId]
    );

    let usuario = usuarios[0];

    /* VERIFICAR SE ESTÁ ATIVO */
    if (usuario && !usuario.ativo) {
      return response.status(403).json({
        erro: 'Esta conta está desativada'
      });
    }

    /* CADASTRAR CASO NÃO EXISTA */
    if (!usuario) {
      const [existentes] = await banco.execute<Usuario[]>(
        `SELECT id_usu
         FROM usuarios
         WHERE email = ?
         LIMIT 1`,
        [google.email]
      );

      /* NÃO VINCULAR CONTAS AUTOMATICAMENTE */
      if (existentes.length > 0) {
        return response.status(409).json({
          erro: 'Este e-mail já possui uma conta. Entre pelo método original.'
        });
      }

      try {
        const [resultado] = await banco.execute<ResultSetHeader>(
          `INSERT INTO usuarios
             (nome, email, google_id, foto, senha_hash)
           VALUES (?, ?, ?, ?, NULL)`,
          [
            google.nome,
            google.email,
            google.googleId,
            google.foto || null
          ]
        );

        usuario = {
          id_usu: resultado.insertId,
          nome: google.nome,
          email: google.email,
          google_id: google.googleId,
          ativo: 1
        } as Usuario;

      } catch (erro) {
        if (
          (erro as { code?: string }).code === 'ER_DUP_ENTRY'
        ) {
          return response.status(409).json({
            erro: 'Esta conta já foi cadastrada. Tente entrar novamente.'
          });
        }

        throw erro;
      }
    }

    /* CRIAR SESSÃO DO USUÁRIO */
    const sessao = await iniciarSessao(usuario.id_usu);

    /* CONFIGURAR COOKIE */
    const atributos = [
      `${COOKIE}=${sessao}`,
      'Path=/api',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${Math.floor(DURACAO / 1000)}`
    ];

    if (process.env.NODE_ENV === 'production') {
      atributos.push('Secure');
    }

    response.setHeader(
      'Set-Cookie',
      atributos.join('; ')
    );

    /* LOGIN CONCLUÍDO */
    return response.status(200).json({
      mensagem: 'Login com Google realizado com sucesso',
      usuario: {
        id_usu: usuario.id_usu,
        nome: usuario.nome,
        email: usuario.email
      }
    });

  } catch (erro) {
    /* TOKEN INVÁLIDO */
    if (erro instanceof ErroTokenGoogle) {
      return response.status(401).json({
        erro: erro.message
      });
    }

    /* ERRO INTERNO */
    console.error('Erro no login Google:', erro);

    return response.status(500).json({
      erro: 'Não foi possível concluir o login com Google'
    });
  }
});


/* SAIR DA CONTA */
router.post('/sair', async (request, response) => {
  try {
    const cookie = request.headers.cookie
      ?.split(';')
      .map(item => item.trim())
      .find(item => item.startsWith(`${COOKIE}=`));

    const token = cookie?.slice(COOKIE.length + 1);

    if (token) {
      await banco.execute(
        `DELETE FROM sessoes_usuarios
         WHERE token_hash = ?`,
        [hashToken(token)]
      );
    }

    response.clearCookie(COOKIE, {
      path: '/api',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    return response.status(200).json({
      mensagem: 'Sessão encerrada com sucesso'
    });

  } catch (erro) {
    console.error('Erro ao encerrar sessão:', erro);

    return response.status(500).json({
      erro: 'Não foi possível encerrar a sessão'
    });
  }
});


export default router;
