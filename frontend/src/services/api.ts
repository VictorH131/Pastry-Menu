export type Loja = { id_loja: number; nome: string; url: string; descricao: string | null; cidade: string | null; estado: string | null; tempo_preparo: string; tipo_operacao: string };
export type Area = {
  usuario: {
    nome: string;
    email: string;
    foto?: string | null;
  };
  estabelecimentos: Loja[];
};
export type NovaLoja = { nome: string; url: string; tipo_operacao: string; descricao: string; telefone: string; cidade: string; estado: string; tempo_preparo: string };
export async function requisicao<T>(rota: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`/api${rota}`, {
    ...opcoes,
    credentials: 'same-origin',
    headers: { ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}), ...opcoes.headers }
  });
  const dados: unknown = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const mensagem = typeof dados === 'object' && dados !== null && 'erro' in dados && typeof dados.erro === 'string' ? dados.erro : 'Erro na requisição';
    throw new Error(mensagem);
  }
  return dados as T;
}
