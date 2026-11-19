
import { useCallback, useEffect, useState } from 'react';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MinhaArea from './pages/MinhaArea';
import CriarEstabelecimento from './pages/CriarEstabelecimento';
import LoginModal from './components/LoginModal';
import NotificationModal from './components/NotificationModal';

import { useNotifications } from './context/NotificationContext';
import { requisicao, type Area } from './services/api';

import './styles/cliente.css';
import './styles/loja.css';
import './styles/modals.css';
import './styles/auth.css';

type AuthView = 'entrar' | 'cadastrar' | 'telefone' | 'verificar' | null;
type Pagina = 'inicio' | 'area' | 'criar';

type CartItem = {
  id: number;
  quantidade: number;
};

export default function App() {
  /* AUTENTICAÇÃO */
  const [auth, setAuth] = useState<AuthView>(null);
  const [area, setArea] = useState<Area | null>(null);

  /* NAVEGAÇÃO */
  const [pagina, setPagina] = useState<Pagina>('inicio');
  const [carregando, setCarregando] = useState(true);

  /* CARRINHO */
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  /* NOTIFICAÇÕES */
  const { notify } = useNotifications();

  const logged = area !== null;

  /* ATUALIZAR ÁREA */
  const atualizarArea = useCallback(async () => {
    const dados = await requisicao<Area>('/minha-area');
    setArea(dados);
    return dados;
  }, []);

  /* VERIFICAR SESSÃO */
  useEffect(() => {
    let ativo = true;

    requisicao<Area>('/minha-area')
      .then(dados => {
        if (ativo) setArea(dados);
      })
      .catch(() => {
        if (ativo) setArea(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAuth(null);
    };

    window.addEventListener('keydown', esc);

    return () => {
      ativo = false;
      window.removeEventListener('keydown', esc);
    };
  }, []);

  /* AUTENTICAÇÃO */
  function goAuth(view: AuthView) {
    setAuth(view);
  }

  /* AUTENTICAÇÃO CONCLUÍDA */
  const onAuthenticated = useCallback(async () => {
    await atualizarArea();
    setAuth(null);
    setPagina('area');
  }, [atualizarArea]);

  /* RECURSOS INDISPONÍVEIS */
  function unavailable(feature: string) {
    notify(
      'info',
      'Em desenvolvimento',
      `${feature} estará disponível quando as demais páginas forem implementadas.`
    );
  }

  /* ABRIR MINHA ÁREA */
  async function abrirArea() {
    if (logged) {
      setPagina('area');
      return;
    }

    try {
      await atualizarArea();
      setPagina('area');
    } catch {
      setAuth('entrar');
    }
  }

  /* SAIR DA CONTA */
  async function sair() {
    try {
      await requisicao('/sair', {
        method: 'POST'
      });
    } catch {
      notify(
        'error',
        'Erro',
        'Não foi possível encerrar a sessão no servidor.'
      );
      return;
    }

    setArea(null);
    setCartItems([]);
    setPagina('inicio');

    notify(
      'success',
      'Até logo',
      'Sessão encerrada.'
    );
  }

  async function trocarConta() {
    try {
      await requisicao('/sair', {
        method: 'POST'
      });

      setArea(null);
      setCartItems([]);
      setPagina('inicio');
      setAuth('entrar');
    } catch {
      notify(
        'error',
        'Erro',
        'Não foi possível trocar de conta.'
      );
    }
  }


  /* RENDERIZAÇÃO */
  return (
    <>
      <Header
        logged={logged}
        usuario={area?.usuario}
        cartCount={cartCount}
        goAuth={goAuth}
        unavailable={unavailable}
        notify={notify}
        onHome={() => setPagina('inicio')}
        onArea={() => void abrirArea()}
        onLogout={() => void sair()}
        onSwitchAccount={() => void trocarConta()}
      />

      {carregando ? (
        <main>
          <p>Carregando...</p>
        </main>
      ) : pagina === 'inicio' ? (
        <Home
          logged={logged}
          goAuth={goAuth}
          unavailable={unavailable}
          notify={notify}
        />
      ) : pagina === 'area' && area ? (
        <MinhaArea
          area={area}
          onCriar={() => setPagina('criar')}
        />
      ) : pagina === 'criar' && area ? (
        <CriarEstabelecimento
          onVoltar={() => setPagina('area')}
          onSalvo={async () => {
            await atualizarArea();
            setPagina('area');
          }}
        />
      ) : (
        <main>
          <p>Entre na sua conta para continuar.</p>

          <button onClick={() => goAuth('entrar')}>
            Entrar
          </button>
        </main>
      )}

      <Footer unavailable={unavailable} />

      <NotificationModal />

      <LoginModal
        auth={auth}
        setAuth={setAuth}
        goAuth={goAuth}
        notify={notify}
        onAuthenticated={onAuthenticated}
      />
    </>
  );
}
