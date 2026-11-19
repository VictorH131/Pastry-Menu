import { useEffect, useMemo, useState } from 'react';
import { requisicao, type Loja } from '../services/api';
import type { NoticeType } from '../context/NotificationContext';
import '../styles/cliente.css';

type AuthView = 'entrar' | 'cadastrar' | 'telefone' | 'verificar' | null;
type Props = {
  logged: boolean;
  goAuth: (view: AuthView) => void;
  unavailable: (feature: string) => void;
  notify: (type: NoticeType, title: string, message: string) => void;
};

const categorias = [
  { nome: 'Clássicos', descricao: 'Sabores tradicionais', icone: '🥟', busca: 'pastel' },
  { nome: 'Especiais', descricao: 'Para experimentar', icone: '✨', busca: 'especial' },
  { nome: 'Lanches', descricao: 'Para matar a fome', icone: '🍔', busca: 'lanche' },
  { nome: 'Doces', descricao: 'Uma pausa gostosa', icone: '🍰', busca: 'doce' },
  { nome: 'Salgados', descricao: 'Para qualquer hora', icone: '🥨', busca: 'salgado' },
  { nome: 'Bebidas', descricao: 'Para acompanhar', icone: '🥤', busca: 'bebida' },
];

const destaques = [
  { titulo: 'Sabores para todos os momentos', texto: 'Explore estabelecimentos e encontre seu próximo pedido.', imagem: 'linear-gradient(125deg, #8b260e, #d46d26 65%, #f5b35d)', selo: 'DESCUBRA NOVOS SABORES' },
  { titulo: 'Seu cardápio em um só lugar', texto: 'Conheça as opções disponíveis nas lojas cadastradas.', imagem: 'linear-gradient(125deg, #792b1d, #be5139 60%, #e6a060)', selo: 'PRATICIDADE NO PEDIDO' },
  { titulo: 'Encontre o que combina com você', texto: 'Busque estabelecimentos e confira as informações de cada um.', imagem: 'linear-gradient(125deg, #713a13, #bc7b22 60%, #f4c56c)', selo: 'EXPLORE O PASTRY MENU' },
];

export default function Home({ logged, goAuth, unavailable, notify }: Props) {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('padrao');

  useEffect(() => {
    let ativo = true;
    requisicao<Loja[]>('/estabelecimentos')
      .then(dados => {
        if (ativo) setLojas(dados);
      })
      .catch(e => {
        if (!ativo) return;
        setErro(true);
        notify('error', 'Falha ao carregar lojas', (e as Error).message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [notify]);

  const lojasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    const resultado = lojas.filter(loja => !termo || [loja.nome, loja.descricao, loja.cidade, loja.estado]
      .filter(Boolean)
      .some(valor => String(valor).toLocaleLowerCase('pt-BR').includes(termo)));
    if (ordenacao === 'nome') resultado.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return resultado;
  }, [lojas, busca, ordenacao]);

  const recomendadas = lojas.slice(0, 3);

  return (
    <main className="pm-home">
      <section className="pm-home-categorias">
        <div className="pm-home-container">
          <span className="pm-home-eyebrow">MENU DE DAR ÁGUA NA BOCA</span>
          <h2>Navegue por categorias</h2>
          <div className="pm-home-categorias-lista">
            {categorias.map(categoria => (
              <button className="pm-home-categoria" type="button" key={categoria.nome} onClick={() => setBusca(categoria.busca)}>
                <span className="pm-home-categoria-icone" aria-hidden="true">{categoria.icone}</span>
                <span><strong>{categoria.nome}</strong><small>{categoria.descricao}</small></span>
              </button>
            ))}
            <button className="pm-home-categoria pm-home-categoria-mais" type="button" onClick={() => setBusca('')}>
              <span className="pm-home-categoria-icone" aria-hidden="true">•••</span>
              <span><strong>Ver mais</strong><small>Todos os estabelecimentos</small></span>
            </button>
          </div>
        </div>
      </section>

      <section className="pm-home-container pm-home-destaques" aria-label="Destaques do Pastry Menu">
        <div className="pm-home-banners">
          {destaques.map(destaque => (
            <article className="pm-home-banner" key={destaque.titulo} style={{ background: destaque.imagem }}>
              <div className="pm-home-banner-conteudo">
                <span>{destaque.selo}</span>
                <h2>{destaque.titulo}</h2>
                <p>{destaque.texto}</p>
                <button type="button" onClick={() => document.getElementById('pm-home-lojas')?.scrollIntoView({ behavior: 'smooth' })}>
                  Explorar lojas →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pm-home-container pm-home-recomendados" aria-labelledby="pm-recomendados-titulo">
        <div className="pm-home-secao-titulo">
          <h2 id="pm-recomendados-titulo">Conheça os estabelecimentos</h2>
          <button type="button" className="pm-home-link" onClick={() => document.getElementById('pm-home-lojas')?.scrollIntoView({ behavior: 'smooth' })}>Ver tudo</button>
        </div>
        {carregando ? <p className="pm-home-status">Carregando estabelecimentos...</p> : erro ? <p className="pm-home-status">Não foi possível carregar os estabelecimentos.</p> : recomendadas.length === 0 ? <p className="pm-home-status">Nenhum estabelecimento cadastrado ainda.</p> : (
          <div className="pm-home-recomendados-lista">
            {recomendadas.map(loja => (
              <article className="pm-home-recomendado" key={loja.id_loja}>
                <div className="pm-home-recomendado-imagem" aria-hidden="true">🍽️</div>
                <div>
                  <h3>{loja.nome}</h3>
                  <p>{loja.descricao || 'Estabelecimento cadastrado no Pastry Menu.'}</p>
                  <small>{[loja.cidade, loja.estado].filter(Boolean).join(' - ') || 'Localização não informada'}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="pm-home-container pm-home-lojas-secao" id="pm-home-lojas" aria-labelledby="pm-lojas-titulo">
        <div className="pm-home-secao-titulo">
          <div><h2 id="pm-lojas-titulo">Lojas</h2><p>Conheça suas opções e encontre o lugar ideal para seu próximo pedido!</p></div>
          <span className="pm-home-total">{lojasFiltradas.length} {lojasFiltradas.length === 1 ? 'loja' : 'lojas'}</span>
        </div>
        <div className="pm-home-ferramentas">
          <label className="pm-home-busca"><span aria-hidden="true">⌕</span><input type="search" placeholder="Buscar estabelecimentos" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar estabelecimentos" /></label>
          <label className="pm-home-ordenar">Ordenar por <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)}><option value="padrao">Padrão</option><option value="nome">Nome (A–Z)</option></select></label>
          {busca && <button className="pm-home-limpar" type="button" onClick={() => setBusca('')}>Limpar busca</button>}
        </div>
        {carregando ? <div className="pm-home-vazio">Carregando lojas...</div> : erro ? <div className="pm-home-vazio">Não foi possível carregar as lojas. Tente novamente mais tarde.</div> : lojasFiltradas.length === 0 ? <div className="pm-home-vazio">{busca ? 'Nenhum estabelecimento encontrado para sua busca.' : 'Nenhum estabelecimento cadastrado.'}</div> : (
          <div className="pm-home-lojas">
            {lojasFiltradas.map(loja => (
              <article className="pm-home-loja" key={loja.id_loja}>
                <div className="pm-home-loja-imagem" aria-hidden="true"><span>🥟</span></div>
                <div className="pm-home-loja-conteudo">
                  <div className="pm-home-loja-cabecalho"><h3>{loja.nome}</h3><span>Estabelecimento</span></div>
                  {(loja.cidade || loja.estado) && <p className="pm-home-loja-local">📍 {[loja.cidade, loja.estado].filter(Boolean).join(' - ')}</p>}
                  <p className="pm-home-loja-descricao">{loja.descricao || 'Sem descrição disponível.'}</p>
                  <div className="pm-home-loja-rodape"><span>◷ Preparo: {loja.tempo_preparo || 'A consultar'}</span><button type="button" onClick={() => unavailable(`Cardápio de ${loja.nome}`)}>Loja →</button></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {!logged && <section className="pm-home-container"><div className="pm-home-cadastro"><div><strong>Seu negócio também pode estar aqui!</strong><p>Cadastre seu estabelecimento no Pastry Menu.</p></div><button type="button" onClick={() => goAuth('cadastrar')}>Cadastre seu estabelecimento</button></div></section>}
    </main>
  );
}
