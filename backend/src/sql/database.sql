-- Pastry Menu | MySQL 8.0.16+ | Estrutura sem dados ficticios
CREATE DATABASE IF NOT EXISTS pastry_menu;
USE pastry_menu;

CREATE TABLE usuarios (
 id_usu BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(120) NOT NULL,
 email VARCHAR(190) UNIQUE,
 telefone VARCHAR(20) UNIQUE,
 senha_hash VARCHAR(255) NOT NULL,
 foto VARCHAR(255) NULL,
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE estabelecimentos (
    id_loja BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usu BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    razao_social VARCHAR(180),
    cpf_cnpj VARCHAR(18),
    email VARCHAR(190),
    telefone VARCHAR(20),
    url VARCHAR(160) NOT NULL UNIQUE,
    descricao VARCHAR(160),
    caminho_logo VARCHAR(255),
    caminho_capa VARCHAR(255),

    tipo_operacao ENUM('tradicional', 'dark_kitchen', 'ponto_movel') NOT NULL,

    cep VARCHAR(9),
    logradouro VARCHAR(160),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado CHAR(2),

    retirada_balcao BOOLEAN NOT NULL DEFAULT TRUE,
    pedidos_agendados BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_proprio BOOLEAN NOT NULL DEFAULT FALSE,

    abertura_automatica BOOLEAN NOT NULL DEFAULT FALSE,

    tempo_preparo VARCHAR(50) NOT NULL DEFAULT '20 - 30 minutos',

    exigir_pedido_minimo BOOLEAN NOT NULL DEFAULT FALSE,
    valor_pedido_minimo DECIMAL(10,2) NOT NULL DEFAULT 1.00,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usu) REFERENCES usuarios(id_usu)
);







/* ================== Não testado e não Implementado ainda ==================*/



CREATE TABLE recuperacao_senha (
    id_recu int(11) NOT NULL AUTO_INCREMENT,
    id_usu int(11) NOT NULL,
    codigo varchar(10) NOT NULL,
    expira_em datetime NOT NULL,
    usado tinyint(4) DEFAULT 0,
    criado_em timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id_recu`),
    KEY `id_usu` (`id_usu`),
    CONSTRAINT `recuperacao_senha_ibfk_1` FOREIGN KEY (`id_usu`) REFERENCES `usuarios` (`id_usu`)
);



CREATE TABLE formas_pagamento (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    estabelecimento_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('pix', 'credito', 'debito', 'dinheiro', 'outro') NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
);


CREATE TABLE pagamentos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    forma_pagamento_id BIGINT UNSIGNED NULL,
    valor DECIMAL(10,2) NOT NULL,
    situacao ENUM('pendente', 'aprovado', 'recusado', 'cancelado', 'estornado') NOT NULL DEFAULT 'pendente',
    referencia_transacao VARCHAR(190),
    pago_em DATETIME NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (forma_pagamento_id) REFERENCES formas_pagamento(id) ON DELETE SET NULL
);





CREATE TABLE categorias (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 estabelecimento_id BIGINT UNSIGNED NOT NULL,
 nome VARCHAR(100) NOT NULL,
 ordem INT NOT NULL DEFAULT 0,
 UNIQUE KEY uq_categoria_estabelecimento (id, estabelecimento_id),
 FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
);

CREATE TABLE produtos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 estabelecimento_id BIGINT UNSIGNED NOT NULL,
 categoria_id BIGINT UNSIGNED NULL,
 nome VARCHAR(160) NOT NULL,
 descricao TEXT,
 preco_base DECIMAL(10,2) NOT NULL,
 caminho_imagem VARCHAR(255),
 disponivel BOOLEAN NOT NULL DEFAULT TRUE,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_produto_estabelecimento (id, estabelecimento_id),
 CHECK (preco_base >= 0),
 FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id),
 FOREIGN KEY (categoria_id, estabelecimento_id) REFERENCES categorias(id, estabelecimento_id)
);

CREATE TABLE variantes_produto (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 produto_id BIGINT UNSIGNED NOT NULL,
 nome VARCHAR(120) NOT NULL,
 preco DECIMAL(10,2) NULL,
 disponivel BOOLEAN NOT NULL DEFAULT TRUE,
 CHECK (preco IS NULL OR preco >= 0),
 UNIQUE KEY uq_variante_produto (id, produto_id),
 FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE grupos_adicionais (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 estabelecimento_id BIGINT UNSIGNED NOT NULL,
 nome VARCHAR(120) NOT NULL,
 minimo_escolhas INT UNSIGNED NOT NULL DEFAULT 0,
 maximo_escolhas INT UNSIGNED NOT NULL DEFAULT 1,
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 CHECK (maximo_escolhas >= minimo_escolhas),
 UNIQUE KEY uq_grupo_estabelecimento (id, estabelecimento_id),
 FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id) ON DELETE CASCADE
);

CREATE TABLE adicionais (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 grupo_id BIGINT UNSIGNED NOT NULL,
 nome VARCHAR(120) NOT NULL,
 acrescimo_preco DECIMAL(10,2) NOT NULL DEFAULT 0,
 disponivel BOOLEAN NOT NULL DEFAULT TRUE,
 CHECK (acrescimo_preco >= 0),
 FOREIGN KEY (grupo_id) REFERENCES grupos_adicionais(id) ON DELETE CASCADE
);

CREATE TABLE produtos_grupos_adicionais (
 produto_id BIGINT UNSIGNED NOT NULL,
 grupo_id BIGINT UNSIGNED NOT NULL,
 estabelecimento_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY (produto_id, grupo_id),
 FOREIGN KEY (produto_id, estabelecimento_id) REFERENCES produtos(id, estabelecimento_id) ON DELETE CASCADE,
 FOREIGN KEY (grupo_id, estabelecimento_id) REFERENCES grupos_adicionais(id, estabelecimento_id) ON DELETE CASCADE
);

CREATE TABLE clientes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(120) NOT NULL,
 email VARCHAR(190) UNIQUE,
 celular VARCHAR(20) UNIQUE,
 google_id VARCHAR(190) UNIQUE,
 senha_hash VARCHAR(255),
 celular_verificado_em DATETIME NULL,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE enderecos_clientes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 cliente_id BIGINT UNSIGNED NOT NULL,
 apelido VARCHAR(60),
 rua VARCHAR(160) NOT NULL,
 numero VARCHAR(20),
 complemento VARCHAR(100),
 bairro VARCHAR(100),
 cidade VARCHAR(100) NOT NULL,
 estado CHAR(2) NOT NULL,
 cep VARCHAR(10),
 FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE pedidos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 estabelecimento_id BIGINT UNSIGNED NOT NULL,
 cliente_id BIGINT UNSIGNED NULL,
 numero_pedido VARCHAR(30) NOT NULL,
 nome_cliente VARCHAR(120) NOT NULL,
 celular_cliente VARCHAR(20),
 origem ENUM('cardapio','balcao','administrativo','integracao') NOT NULL DEFAULT 'cardapio',
 situacao ENUM('pendente','confirmado','preparando','pronto','em_entrega','concluido','cancelado') NOT NULL DEFAULT 'pendente',
 modalidade ENUM('retirada','entrega','consumo_local') NOT NULL DEFAULT 'retirada',
 preferencia_pagamento ENUM('dinheiro','pix','credito','debito','outro') NULL,
 observacoes TEXT,
 agendado_para DATETIME NULL,
 subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
 taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 0,
 desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
 total DECIMAL(10,2) NOT NULL DEFAULT 0,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_numero_pedido (estabelecimento_id, numero_pedido),
 UNIQUE KEY uq_pedido_estabelecimento (id, estabelecimento_id),
 CHECK (subtotal >= 0 AND taxa_entrega >= 0 AND desconto >= 0 AND total >= 0),
 FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id),
 FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

CREATE TABLE itens_pedido (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pedido_id BIGINT UNSIGNED NOT NULL,
 produto_id BIGINT UNSIGNED NULL,
 variante_id BIGINT UNSIGNED NULL,
 nome_produto VARCHAR(160) NOT NULL,
 nome_variante VARCHAR(120) NULL,
 quantidade INT UNSIGNED NOT NULL,
 preco_unitario DECIMAL(10,2) NOT NULL,
 total_item DECIMAL(10,2) NOT NULL,
 observacoes VARCHAR(500),
 CHECK (quantidade > 0 AND preco_unitario >= 0 AND total_item >= 0),
 FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
 FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
 FOREIGN KEY (variante_id) REFERENCES variantes_produto(id) ON DELETE SET NULL
);

CREATE TABLE adicionais_item_pedido (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 item_pedido_id BIGINT UNSIGNED NOT NULL,
 adicional_id BIGINT UNSIGNED NULL,
 nome_adicional VARCHAR(120) NOT NULL,
 quantidade INT UNSIGNED NOT NULL DEFAULT 1,
 acrescimo_unitario DECIMAL(10,2) NOT NULL,
 CHECK (quantidade > 0 AND acrescimo_unitario >= 0),
 FOREIGN KEY (item_pedido_id) REFERENCES itens_pedido(id) ON DELETE CASCADE,
 FOREIGN KEY (adicional_id) REFERENCES adicionais(id) ON DELETE SET NULL
);

CREATE TABLE historico_situacoes_pedido (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pedido_id BIGINT UNSIGNED NOT NULL,
 usuario_id BIGINT UNSIGNED NULL,
 situacao_anterior ENUM('pendente','confirmado','preparando','pronto','em_entrega','concluido','cancelado') NULL,
 situacao_nova ENUM('pendente','confirmado','preparando','pronto','em_entrega','concluido','cancelado') NOT NULL,
 observacao VARCHAR(500),
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE pagamentos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pedido_id BIGINT UNSIGNED NOT NULL,
 metodo ENUM('dinheiro','pix','credito','debito','outro') NOT NULL,
 valor DECIMAL(10,2) NOT NULL,
 situacao ENUM('pendente','aprovado','recusado','estornado','cancelado') NOT NULL DEFAULT 'pendente',
 referencia_transacao VARCHAR(190),
 pago_em DATETIME NULL,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK (valor > 0),
 FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

CREATE TABLE convites_equipe (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 estabelecimento_id BIGINT UNSIGNED NOT NULL,
 criado_por BIGINT UNSIGNED NOT NULL,
 utilizado_por BIGINT UNSIGNED NULL,
 codigo_hash VARCHAR(255) NOT NULL UNIQUE,
 funcao ENUM('atendente') NOT NULL DEFAULT 'atendente',
 expira_em DATETIME NOT NULL,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 utilizado_em DATETIME NULL,
 CHECK (expira_em > criado_em),
 CHECK ((utilizado_por IS NULL AND utilizado_em IS NULL) OR (utilizado_por IS NOT NULL AND utilizado_em IS NOT NULL)),
 FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos(id),
 FOREIGN KEY (criado_por) REFERENCES usuarios(id),
 FOREIGN KEY (utilizado_por) REFERENCES usuarios(id)
);

CREATE TABLE entregas (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pedido_id BIGINT UNSIGNED NOT NULL UNIQUE,
 endereco_cliente_id BIGINT UNSIGNED NULL,
 destinatario VARCHAR(120) NOT NULL,
 rua VARCHAR(160) NOT NULL,
 numero VARCHAR(20),
 complemento VARCHAR(100),
 bairro VARCHAR(100),
 cidade VARCHAR(100) NOT NULL,
 estado CHAR(2) NOT NULL,
 cep VARCHAR(10),
 taxa DECIMAL(10,2) NOT NULL DEFAULT 0,
 situacao ENUM('aguardando','em_rota','entregue','cancelada') NOT NULL DEFAULT 'aguardando',
 saiu_em DATETIME NULL,
 entregue_em DATETIME NULL,
 criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK (taxa >= 0),
 FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
 FOREIGN KEY (endereco_cliente_id) REFERENCES enderecos_clientes(id) ON DELETE SET NULL
)B;
