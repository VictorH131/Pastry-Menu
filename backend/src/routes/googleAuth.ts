
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

export class ErroTokenGoogle extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroTokenGoogle';
  }
}

export async function verificarGoogle(token: string) {
  const clientId = process.env.Auth_Google_KEY?.trim();

  if (!clientId) {
    throw new Error('Auth_Google_KEY não configurado no backend');
  }

  if (!token || typeof token !== 'string') {
    throw new ErroTokenGoogle('Token Google não informado');
  }

  let ticket;

  try {
    ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId
    });
  } catch (erro) {
    console.error('Falha na validação do token Google:', erro);

    throw new ErroTokenGoogle(
      'Não foi possível validar sua conta Google. Tente novamente.'
    );
  }

  const payload = ticket.getPayload();

  if (!payload?.sub) {
    throw new ErroTokenGoogle('Token Google inválido');
  }

  if (!payload.email || payload.email_verified !== true) {
    throw new ErroTokenGoogle(
      'A conta Google precisa ter um e-mail verificado'
    );
  }

  return {
    googleId: payload.sub,
    nome: payload.name ?? '',
    email: payload.email,
    emailVerificado: payload.email_verified === true,
    foto: payload.picture ?? ''
  };
}
