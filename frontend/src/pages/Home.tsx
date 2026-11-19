import { useEffect, useState } from 'react';
import { requisicao, type Loja } from '../services/api';
import type { NoticeType } from '../context/NotificationContext';
type AuthView = 'entrar' | 'cadastrar' | 'telefone' | 'verificar' | null;
export default function Home({ logged, goAuth, unavailable, notify }: {
  logged: boolean; goAuth: (v: AuthView) => void; unavailable: (feature: string) => void;
  notify: (t: NoticeType, title: string, message: string) => void;
}) {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let ativo = true;
    requisicao<Loja[]>('/estabelecimentos').then(d => { if (ativo) setLojas(d); })
      .catch(e => { if (ativo) notify('error', 'Falha ao carregar lojas', (e as Error).message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [notify]);
  return <main><h1>Encontre um estabelecimento</h1><p>Lojas cadastradas no Pastry Menu.</p>
    {carregando ? <p>Carregando lojas...</p> : lojas.length === 0 ? <p>Nenhum estabelecimento cadastrado.</p> :
      <section className="grade">{lojas.map(l => <article key={l.id_loja}>
        <h2>{l.nome}</h2><p>{l.descricao || 'Sem descrição'}</p>
        <p>{[l.cidade, l.estado].filter(Boolean).join(' - ')}</p><small>Preparo: {l.tempo_preparo}</small>
        <p><button onClick={() => unavailable(`Cardápio de ${l.nome}`)}>Ver cardápio</button></p>
      </article>)}</section>}
    {!logged && <p><button className="principal" onClick={() => goAuth('cadastrar')}>Cadastre seu estabelecimento</button></p>}
  </main>;
}
