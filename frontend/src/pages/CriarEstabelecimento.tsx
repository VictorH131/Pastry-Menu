import { useState, type FormEvent } from 'react';
import { requisicao, type NovaLoja } from '../services/api';
export default function CriarEstabelecimento({ onVoltar, onSalvo }: { onVoltar: () => void; onSalvo: () => Promise<void> }) {
  const [loja, setLoja] = useState<NovaLoja>({ nome: '', url: '', tipo_operacao: 'tradicional', descricao: '', telefone: '', cidade: '', estado: '', tempo_preparo: '20 - 30 minutos' });
  const [erro, setErro] = useState(''); const [salvando, setSalvando] = useState(false);
  async function salvar(e: FormEvent) {
    e.preventDefault(); setErro(''); setSalvando(true);
    try { await requisicao('/estabelecimentos', { method: 'POST', body: JSON.stringify(loja) }); await onSalvo(); }
    catch (e) { setErro((e as Error).message); } finally { setSalvando(false); }
  }
  return <main><h1>Criar estabelecimento</h1>{erro && <p className="erro" role="alert">{erro}</p>}
    <form onSubmit={e => void salvar(e)}>
      <label>Nome<input required maxLength={150} value={loja.nome} onChange={e => setLoja({ ...loja, nome: e.target.value })} /></label>
      <label>URL (sem espaços)<input required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={loja.url} onChange={e => setLoja({ ...loja, url: e.target.value.toLowerCase() })} /></label>
      <label>Tipo de operação<select value={loja.tipo_operacao} onChange={e => setLoja({ ...loja, tipo_operacao: e.target.value })}>
        <option value="tradicional">Tradicional</option><option value="dark_kitchen">Dark Kitchen</option><option value="ponto_movel">Ponto móvel</option>
      </select></label>
      {(['descricao', 'telefone', 'cidade', 'estado', 'tempo_preparo'] as const).map(c =>
        <label key={c}>{c.replace('_', ' ')}<input maxLength={c === 'estado' ? 2 : c === 'descricao' ? 160 : c === 'telefone' ? 20 : c === 'tempo_preparo' ? 50 : 100} value={loja[c]} onChange={e => setLoja({ ...loja, [c]: c === 'estado' ? e.target.value.toUpperCase() : e.target.value })} /></label>)}
      <button className="principal" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar estabelecimento'}</button>
    </form><button onClick={onVoltar}>Voltar</button>
  </main>;
}
