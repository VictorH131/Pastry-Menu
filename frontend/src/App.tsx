
import { useEffect, useState } from 'react';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginModal from './components/LoginModal';
import NotificationModal from './components/NotificationModal';

import { useNotifications } from './context/NotificationContext';

import './styles/cliente.css';
import './styles/loja.css';
import './styles/modals.css';

type AuthView = 'entrar' | 'cadastrar' | 'telefone' | 'verificar' | null;

export default function App() {
  const [auth, setAuth] = useState<AuthView>(null);
  const [logged, setLogged] = useState(false);

  const { notify } = useNotifications();

  // Controla a autenticação
  function goAuth(view: AuthView) {
    setAuth(view);
  }

  // Informa quando uma funcionalidade não está disponível
  function unavailable(feature: string) {
    notify(
      'info',
      'Em desenvolvimento',
      `${feature} estará disponível quando as demais páginas forem implementadas.`
    );
  }

  // Fecha o modal ao pressionar Escape
  useEffect(() => {
    const esc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAuth(null);
      }
    };

    window.addEventListener('keydown', esc);

    return () => {
      window.removeEventListener('keydown', esc);
    };
  }, []);

  return (
    <>
      <Header
        logged={logged}
        goAuth={goAuth}
        unavailable={unavailable}
        notify={notify}
      />

      <Home
        logged={logged}
        goAuth={goAuth}
        unavailable={unavailable}
        notify={notify}
      />

      <Footer unavailable={unavailable} />

      <NotificationModal />

      <LoginModal
        auth={auth}
        setAuth={setAuth}
        goAuth={goAuth}
        notify={notify}
      />
    </>
  );
}
