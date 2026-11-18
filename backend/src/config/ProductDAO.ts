
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { banco } from '../config/database.js';

// Define a estrutura dos produtos
export interface Produto extends RowDataPacket {
  id: number;
  estabelecimento_id: number;
  nome: string;
  descricao: string | null;
  preco: string;
  caminho_imagem: string | null;
  disponivel: boolean;
}

// Gerencia as consultas dos produtos
export class ProductDAO {

  // Lista os produtos de um estabelecimento
  public async listar(estabelecimentoId: number): Promise<Produto[]> {
    const [produtos] = await banco.execute<Produto[]>(
      `SELECT id, estabelecimento_id, nome, descricao,
              preco, caminho_imagem, disponivel
       FROM produtos
       WHERE estabelecimento_id = ?
       ORDER BY nome`,
      [estabelecimentoId]
    );

    return produtos;
  }

  // Busca um produto pelo ID
  public async buscar(id: number): Promise<Produto | null> {
    const [produtos] = await banco.execute<Produto[]>(
      `SELECT id, estabelecimento_id, nome, descricao,
              preco, caminho_imagem, disponivel
       FROM produtos
       WHERE id = ?`,
      [id]
    );

    return produtos[0] ?? null;
  }
// Cadastra um produto
public async criar(
  estabelecimentoId: number,
  nome: string,
  preco: string
): Promise<number> {
  const [resultado] = await banco.execute<ResultSetHeader>(
    `INSERT INTO produtos (estabelecimento_id, nome, preco)
     VALUES (?, ?, ?)`,
    [estabelecimentoId, nome, preco]
  );

  return resultado.insertId;
}

// Exclui um produto do estabelecimento
public async excluir(
  id: number,
  estabelecimentoId: number
): Promise<boolean> {
  const [resultado] = await banco.execute<ResultSetHeader>(
    `DELETE FROM produtos
     WHERE id = ? AND estabelecimento_id = ?`,
    [id, estabelecimentoId]
  );

  return resultado.affectedRows > 0;
}
}
