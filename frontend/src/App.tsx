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
export default function App() { const [auth, setAuth] = useState<AuthView>(null); const [logged] = useState(false); const { notify } = useNotifications(); function goAuth(view: AuthView) { setAuth(view) } function unavailable(feature: string) { notify('info', 'Em desenvolvimento', `${feature} estará disponível quando as demais páginas forem implementadas.`) } useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAuth(null) }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc) }, []); return <><Header logged={logged} goAuth={goAuth} unavailable={unavailable} notify={notify} /><Home logged={logged} goAuth={goAuth} unavailable={unavailable} notify={notify} /><Footer unavailable={unavailable} /><NotificationModal /><LoginModal auth={auth} setAuth={setAuth} goAuth={goAuth} notify={notify} /></> }
