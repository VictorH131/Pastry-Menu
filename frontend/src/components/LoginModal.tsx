
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent
} from 'react';

import { requisicao } from '../services/api';
import type { NoticeType } from '../context/NotificationContext';

import logo from '../img/logos/logo.png';

type AuthView =
  | 'entrar'
  | 'cadastrar'
  | 'telefone'
  | 'verificar'
  | null;

type Props = {
  auth: AuthView;
  setAuth: (v: AuthView) => void;
  goAuth: (v: AuthView) => void;
  notify: (
    t: NoticeType,
    title: string,
    message: string
  ) => void;
  onAuthenticated: () => Promise<void>;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: {
              credential: string;
            }) => void;
          }) => void;

          renderButton: (
            element: HTMLElement,
            options: {
              theme: string;
              size: string;
              text: string;
              shape: string;
              width: number;
            }
          ) => void;
        };
      };
    };
  }
}

export default function LoginModal({
  auth,
  setAuth,
  goAuth,
  notify,
  onAuthenticated
}: Props) {
  /* DADOS DO FORMULÁRIO */
  const [dados, setDados] = useState({
    nome: '',
    email: '',
    senha: ''
  });

  const [enviando, setEnviando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  /* GOOGLE */
  const googleContainer = useRef<HTMLDivElement>(null);

  const callbacksGoogle = useRef({
    onAuthenticated,
    notify
  });

  /* MANTER CALLBACKS ATUALIZADOS */
  useEffect(() => {
    callbacksGoogle.current = {
      onAuthenticated,
      notify
    };
  }, [onAuthenticated, notify]);

  /* RECEBER CREDENCIAL DO GOOGLE */
  const receberCredencialGoogle = useCallback(
    async ({ credential }: { credential: string }) => {
      if (!credential) return;

      setEnviando(true);

      try {
        await requisicao('/auth/google', {
          method: 'POST',
          body: JSON.stringify({
            token: credential
          })
        });

        await callbacksGoogle.current.onAuthenticated();

        callbacksGoogle.current.notify(
          'success',
          'Tudo certo!',
          'Você entrou com sua conta Google.'
        );
      } catch (erro) {
        callbacksGoogle.current.notify(
          'error',
          'Erro no login Google',
          erro instanceof Error
            ? erro.message
            : 'Não foi possível autenticar.'
        );
      } finally {
        setEnviando(false);
      }
    },
    []
  );

  /* INICIALIZAR GOOGLE */
  useEffect(() => {
    if (!auth || mostrarFormulario) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID não configurado');
      return;
    }

    let cancelado = false;

    const iniciarGoogle = () => {
      if (cancelado || !googleContainer.current) return;

      const google = window.google;

      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: receberCredencialGoogle
      });

      googleContainer.current.replaceChildren();

      const container = googleContainer.current;

      if (container) {
        const largura = Math.min(
          Math.floor(container.getBoundingClientRect().width),
          400
        );

        if (largura > 0) {
          container.replaceChildren();

          google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: largura
          });
        }
      }
    };

    const intervalo = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        window.clearInterval(intervalo);
        iniciarGoogle();
      }
    }, 100);

    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, [Boolean(auth), mostrarFormulario, receberCredencialGoogle]);

  /* IDENTIFICAR CADASTRO */
  const cadastro = auth === 'cadastrar';

  /* FECHAR MODAL */
  function fechar() {
    setAuth(null);
    setMostrarFormulario(false);
  }

  /* MUDAR ABA */
  function mudarAba(view: 'entrar' | 'cadastrar') {
    goAuth(view);
    setMostrarFormulario(false);
  }

  /* ENVIAR FORMULÁRIO */
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (enviando) return;

    setEnviando(true);

    try {
      await requisicao(
        cadastro ? '/cadastro' : '/entrar',
        {
          method: 'POST',
          body: JSON.stringify(dados)
        }
      );

      await onAuthenticated();

      setDados({
        nome: '',
        email: '',
        senha: ''
      });

      setMostrarFormulario(false);

      notify(
        'success',
        'Tudo certo!',
        'Você entrou na sua conta.'
      );
    } catch (error) {
      notify(
        'error',
        'Não foi possível entrar',
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro inesperado.'
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!auth) return null;

  /* RENDERIZAÇÃO */
  return (
    <div
      className="pm-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <section
        className="pm-modal pm-login"
        role="dialog"
        aria-modal="true"
        aria-label="Autenticação"
      >
        {/* FECHAR */}
        <button
          type="button"
          className="pm-fechar"
          onClick={fechar}
          aria-label="Fechar"
        >
          ×
        </button>

        {/* LOGO */}
        <img
          src={logo}
          alt="Pastry Menu"
          className="pm-login-logo"
        />

        {/* TÍTULO */}
        <h2>
          {cadastro
            ? 'Cadastre-se no Pastry Menu!'
            : 'Entre e peça algo delicioso!'}
        </h2>

        {/* SUBTÍTULO */}
        <p className="pm-login-subtitulo">
          {cadastro
            ? 'Crie sua conta e aproveite uma experiência prática e confiável.'
            : 'Faça login para pedir sem complicação.'}
        </p>

        {/* ABAS */}
        <div className="pm-login-tabs">
          <button
            type="button"
            className={!cadastro ? 'ativo' : ''}
            onClick={() => mudarAba('entrar')}
          >
            Entrar
          </button>

          <button
            type="button"
            className={cadastro ? 'ativo' : ''}
            onClick={() => mudarAba('cadastrar')}
          >
            Criar conta
          </button>
        </div>

        {!mostrarFormulario ? (
          <div className="pm-login-opcoes">

            {/* GOOGLE */}
            <div className="pm-login-google-container">
              <div ref={googleContainer} />
            </div>

            {/* TELEFONE */}
            <button
              type="button"
              className="pm-login-telefone"
              onClick={() => goAuth('telefone')}
            >
              {cadastro
                ? 'Cadastrar com número'
                : 'Entrar com número'}
            </button>

            {/* DIVISÓRIA */}
            <div className="pm-login-divisor">
              <span>Ou Continue sem uma conta</span>
            </div>

            {/* VISITANTE */}
            <button
              type="button"
              className="pm-login-visitante"
              onClick={fechar}
            >
              Continuar sem uma Conta
            </button>

          </div>
        ) : (
          <form
            className="pm-login-form"
            onSubmit={(e) => void enviar(e)}
          >
            {cadastro && (
              <label>
                Nome
                <input
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={dados.nome}
                  onChange={(e) =>
                    setDados({
                      ...dados,
                      nome: e.target.value
                    })
                  }
                />
              </label>
            )}

            <label>
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={dados.email}
                onChange={(e) =>
                  setDados({
                    ...dados,
                    email: e.target.value
                  })
                }
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                required
                minLength={cadastro ? 8 : 1}
                maxLength={128}
                autoComplete={
                  cadastro
                    ? 'new-password'
                    : 'current-password'
                }
                value={dados.senha}
                onChange={(e) =>
                  setDados({
                    ...dados,
                    senha: e.target.value
                  })
                }
              />
            </label>

            <button
              type="submit"
              className="pm-login-telefone"
              disabled={enviando}
            >
              {enviando
                ? 'Aguarde...'
                : cadastro
                  ? 'Cadastrar'
                  : 'Entrar'}
            </button>

            <button
              type="button"
              className="pm-login-voltar"
              onClick={() => setMostrarFormulario(false)}
            >
              Voltar
            </button>
          </form>
        )}

        {/* TERMOS */}
        <p className="pm-login-termos">
          Ao continuar, você concorda com os{' '}
          <a href="/termos">Termos de Uso</a> e a{' '}
          <a href="/privacidade">Política de Privacidade</a>{' '}
          do Pastry Menu Delivery.
        </p>
      </section>
    </div>
  );
}
