
import { useEffect, useRef, useState } from 'react';
import type { NoticeType } from '../context/NotificationContext';

import logo from '../img/logos/logo-header.png';
import cartIcon from '../img/logos/cart.png';

type AuthView =
  | 'entrar'
  | 'cadastrar'
  | 'telefone'
  | 'verificar'
  | null;

type UsuarioHeader = {
  nome: string;
  email: string;
  foto?: string | null;
};

type Props = {
  logged: boolean;
  usuario?: UsuarioHeader | null;
  cartCount?: number;
  goAuth: (v: AuthView) => void;
  unavailable: (v: string) => void;
  notify: (
    t: NoticeType,
    title: string,
    message: string
  ) => void;
  onHome: () => void;
  onArea: () => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
};

export default function Header({
  logged,
  usuario,
  cartCount = 0,
  goAuth,
  unavailable,
  onHome,
  onArea,
  onLogout,
  onSwitchAccount
}: Props) {
  /* ESTADOS */
  const [contaAberta, setContaAberta] = useState(false);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  /* REFERÊNCIA DO POPUP */
  const contaRef = useRef<HTMLDivElement>(null);

  /* FECHAR CONTA AO DESLOGAR */
  useEffect(() => {
    if (!logged) {
      setContaAberta(false);
    }
  }, [logged]);

  /* FECHAR POPUP AO CLICAR FORA */
  useEffect(() => {
    if (!contaAberta) return;

    function clicarFora(event: PointerEvent) {
      if (
        contaRef.current &&
        !contaRef.current.contains(event.target as Node)
      ) {
        setContaAberta(false);
      }
    }

    document.addEventListener('pointerdown', clicarFora);

    return () => {
      document.removeEventListener('pointerdown', clicarFora);
    };
  }, [contaAberta]);

  /* FECHAR COM ESC */
  useEffect(() => {
    if (!contaAberta && !carrinhoAberto) return;

    function fecharEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setContaAberta(false);
        setCarrinhoAberto(false);
      }
    }

    window.addEventListener('keydown', fecharEscape);

    return () => {
      window.removeEventListener('keydown', fecharEscape);
    };
  }, [contaAberta, carrinhoAberto]);

  /* ABRIR CONTA */
  function abrirConta() {
    setCarrinhoAberto(false);
    setContaAberta(valor => !valor);
  }

  /* ABRIR CARRINHO */
  function abrirCarrinho() {
    setContaAberta(false);
    setCarrinhoAberto(true);
  }

  /* SAIR DA CONTA */
  function sair() {
    setContaAberta(false);
    onLogout();
  }

  /* TROCAR DE CONTA */
  function trocarConta() {
    setContaAberta(false);
    onSwitchAccount();
  }

  const inicial =
    usuario?.nome?.trim().charAt(0).toUpperCase() || '?';

  return (
    <>
      <header className="header">
        <div className="header-container">

          {/* LOGO */}
          <div className="header-logo">
            <img src={logo} alt="Pastry Menu" />
          </div>

          {/* MENU */}
          <nav
            className="header-nav"
            aria-label="Menu principal"
          >
            <button type="button" onClick={onHome}>
              Início
            </button>

            <button
              type="button"
              onClick={() => unavailable('Cardápio')}
            >
              Cardápio
            </button>

            <button
              type="button"
              onClick={() => unavailable('Meus pedidos')}
            >
              Meus pedidos
            </button>

            <button type="button" onClick={onArea}>
              Minha Área
            </button>
          </nav>

          {/* AÇÕES */}
          <div className="header-actions">

            {/* CARRINHO */}
            <button
              type="button"
              className="header-cart"
              onClick={abrirCarrinho}
              aria-label="Abrir carrinho"
            >
              <img
                src={cartIcon}
                alt=""
                className="cart-icon"
              />

              {cartCount > 0 && (
                <span className="cart-count">
                  {cartCount}
                </span>
              )}
            </button>

            {/* AUTENTICAÇÃO */}
            {logged ? (
              <div
                className="pm-conta-wrapper"
                ref={contaRef}
              >
                {/* FOTO DO USUÁRIO */}
                <button
                  type="button"
                  className="pm-avatar-botao"
                  onClick={abrirConta}
                  aria-label="Abrir minha conta"
                  aria-expanded={contaAberta}
                >
                  {usuario?.foto ? (
                    <img
                      src={usuario.foto}
                      alt="Foto de perfil"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{inicial}</span>
                  )}
                </button>

                {/* POPUP DA CONTA */}
                {contaAberta && (
                  <div className="pm-conta-popup">

                    {/* CABEÇALHO */}
                    <div className="pm-conta-topo">
                      <strong>CONTA PASTRY MENU</strong>

                      <button
                        type="button"
                        onClick={() => setContaAberta(false)}
                        aria-label="Fechar conta"
                      >
                        ×
                      </button>
                    </div>

                    {/* PERFIL */}
                    <div className="pm-conta-perfil">
                      <div className="pm-conta-foto">
                        {usuario?.foto ? (
                          <img
                            src={usuario.foto}
                            alt="Foto de perfil"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span>{inicial}</span>
                        )}
                      </div>

                      <strong>
                        {usuario?.nome || 'Usuário'}
                      </strong>

                      <span>
                        {usuario?.email || ''}
                      </span>
                    </div>

                    {/* OPÇÕES */}
                    <div className="pm-conta-opcoes">

                      {/* DADOS PESSOAIS */}
                      <button
                        type="button"
                        onClick={() => {
                          setContaAberta(false);
                          onArea();
                        }}
                      >
                        <span className="pm-conta-opcao-icone">
                          ♙
                        </span>

                        <span>
                          <strong>
                            Dados Pessoais e Perfil
                          </strong>
                          <small>Minha área</small>
                        </span>

                        <span className="pm-conta-seta">
                          ›
                        </span>
                      </button>

                      {/* CARTEIRA */}
                      <button
                        type="button"
                        disabled
                      >
                        <span className="pm-conta-opcao-icone">
                          ▣
                        </span>

                        <span>
                          <strong>
                            Carteira Pastry Pay & Cartões
                          </strong>
                          <small>Em desenvolvimento</small>
                        </span>

                        <span className="pm-conta-seta">
                          ›
                        </span>
                      </button>

                      {/* ENDEREÇOS */}
                      <button
                        type="button"
                        disabled
                      >
                        <span className="pm-conta-opcao-icone">
                          ⌖
                        </span>

                        <span>
                          <strong>
                            Endereços de Entrega
                          </strong>
                          <small>Em desenvolvimento</small>
                        </span>

                        <span className="pm-conta-seta">
                          ›
                        </span>
                      </button>

                      {/* TROCAR CONTA */}
                      <button
                        type="button"
                        onClick={trocarConta}
                      >
                        <span className="pm-conta-opcao-icone">
                          ⇄
                        </span>

                        <span>
                          <strong>Trocar de conta</strong>
                          <small>Entrar com outra conta</small>
                        </span>

                        <span className="pm-conta-seta">
                          ›
                        </span>
                      </button>
                    </div>

                    {/* RODAPÉ */}
                    <div className="pm-conta-rodape">
                      <button
                        type="button"
                        className="pm-conta-sair"
                        onClick={sair}
                      >
                        Sair da conta
                      </button>

                      <div className="pm-conta-links">
                        <a href="/privacidade">
                          Política de Privacidade
                        </a>

                        <span>•</span>

                        <a href="/termos">
                          Termos de Uso
                        </a>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="header-auth"
                onClick={() => goAuth('entrar')}
              >
                Entrar / Cadastrar
              </button>
            )}

          </div>
        </div>
      </header>

      {/* PAINEL DO CARRINHO */}
      {carrinhoAberto && (
        <div
          className="pm-sacola-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setCarrinhoAberto(false);
            }
          }}
        >
          <aside
            className="pm-sacola-painel"
            role="dialog"
            aria-modal="true"
            aria-label="Sua Sacola"
          >
            {/* CABEÇALHO */}
            <div className="pm-sacola-topo">
              <div className="pm-sacola-titulo">
                <span className="pm-sacola-icone">
                  <img src={cartIcon} alt="" />
                </span>

                <h2>Sua Sacola</h2>
              </div>

              <div className="pm-sacola-topo-direita">
                <span className="pm-sacola-contador">
                  {cartCount}{' '}
                  {cartCount === 1 ? 'item' : 'itens'}
                </span>

                <button
                  type="button"
                  className="pm-sacola-fechar"
                  onClick={() => setCarrinhoAberto(false)}
                  aria-label="Fechar carrinho"
                >
                  ×
                </button>
              </div>
            </div>

            {/* CONTEÚDO */}
            <div className="pm-sacola-conteudo">
              {cartCount === 0 ? (
                <div className="pm-sacola-vazia">
                  <h3>
                    Você Não Tem Nada No Carrinho
                  </h3>

                  {!logged ? (
                    <>
                      <div className="pm-sacola-divisor">
                        <span>Login</span>
                      </div>

                      <p>
                        Para visualizar seu carrinho,
                        faça{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setCarrinhoAberto(false);
                            goAuth('entrar');
                          }}
                        >
                          login
                        </button>
                      </p>
                    </>
                  ) : (
                    <p>
                      Adicione produtos ao seu carrinho
                      para continuar.
                    </p>
                  )}
                </div>
              ) : (
                <div className="pm-sacola-vazia">
                  <h3>
                    Carrinho em desenvolvimento
                  </h3>

                  <p>
                    Os produtos e o checkout ainda
                    não estão disponíveis.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
