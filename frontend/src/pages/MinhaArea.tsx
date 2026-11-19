import type { Area } from '../services/api';
export default function MinhaArea({ area, onCriar }: { area: Area; onCriar: () => void }) {
  return <main><h1>Minha Área</h1><p>Olá, {area.usuario.nome}!</p><h2>Meus estabelecimentos</h2>
    {area.estabelecimentos.length === 0 ? <p>Você ainda não cadastrou estabelecimentos.</p> :
      <section className="grade">{area.estabelecimentos.map(loja => <article key={loja.id_loja}>
        <h3>{loja.nome}</h3><p>URL: {loja.url}</p><p>{loja.cidade || 'Cidade não informada'}</p>
      </article>)}</section>}
    <button className="principal" onClick={onCriar}>Criar estabelecimento</button>
  </main>;
}
