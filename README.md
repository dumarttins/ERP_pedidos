# Mini ERP - Sistema de Gerenciamento de Pedidos, Produtos, Cupons e Estoque

Este projeto é um mini sistema ERP criado como teste para uma vaga de desenvolvedor. O sistema consiste em uma API Laravel no backend e uma interface React no frontend para gestão de produtos, variações, estoque, cupons e pedidos.

## Tecnologias Utilizadas

### Backend
- PHP 8.2
- Laravel 10
- MySQL 8.0
- Docker e Docker Compose

### Frontend
- React 18
- React Router 6
- Bootstrap 5
- Axios
- Formik e Yup
- Reactstrap

## Estrutura do Projeto

```
/mini-erp/
  /backend/          # API Laravel
  /frontend/         # Interface React
  docker-compose.yml # Configuração do Docker para o ambiente completo
  README.md          # Este arquivo
```

## Funcionalidades Implementadas

- **Gestão de Produtos**
  - Cadastro de produtos com ou sem variações
  - Controle de estoque por produto ou por variação
  - Atualização de produtos e estoque

- **Gestão de Carrinho**
  - Adição de produtos ao carrinho
  - Atualização de quantidades
  - Remoção de itens
  - Cálculo automático de frete baseado no subtotal
  - Aplicação de cupons de desconto

- **Gestão de Cupons**
  - Criação de cupons com valor fixo ou percentual
  - Definição de validade e regras de uso
  - Limitação de uso por valor mínimo de compra

- **Checkout e Finalização de Pedidos**
  - Formulário de checkout com validação
  - Consulta de CEP via API externa (ViaCEP)
  - Envio de e-mail de confirmação
  - Página de confirmação de pedido

- **Webhook para Atualização de Status**
  - Endpoint para receber atualizações externas do status do pedido
  - Tratamento de cancelamentos com restauração automática de estoque

- **Autenticação e Segurança**
  - Login e registro de usuários
  - Proteção de rotas administrativas
  - Tokens JWT com Laravel Sanctum

## Requisitos de Sistema

- Docker e Docker Compose
- Node.js 16+ (para desenvolvimento local do frontend)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

## Configuração e Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/mini-erp.git
cd mini-erp
```

### 2. Configuração do Backend

```bash
# Entre na pasta do backend
cd backend

# Copie o arquivo de exemplo de ambiente
cp .env.example .env

# Inicie os containers Docker
docker-compose up -d

# Instale as dependências do Laravel
docker-compose exec app composer install

# Gere a chave de aplicação
docker-compose exec app php artisan key:generate

# Execute as migrações e seeders
docker-compose exec app php artisan migrate --seed
```

### 3. Configuração do Frontend

```bash
# Em outro terminal, vá para a pasta do frontend
cd ../frontend

# Instale as dependências do React
npm install

# Inicie o servidor de desenvolvimento
npm start
```

### 4. Acessando o Sistema

- **Backend API**: http://localhost:8000/api
- **Frontend**: http://localhost:3000

## Uso do Sistema

### Como Usuário

1. **Navegar pelos Produtos**:
   - Acesse a página inicial para ver todos os produtos
   - Use o filtro de busca e a opção "Mostrar apenas produtos disponíveis"
   - Clique em um produto para ver seus detalhes

2. **Adicionar Produtos ao Carrinho**:
   - Na página de detalhes do produto, selecione a variação (se houver)
   - Defina a quantidade e clique em "Adicionar ao Carrinho"

3. **Gerenciar Carrinho**:
   - Veja os itens adicionados em /cart
   - Ajuste as quantidades ou remova itens
   - Aplique cupons de desconto

4. **Finalizar Compra**:
   - Prossiga para o checkout, preencha os dados de entrega
   - Digite seu CEP para auto-preenchimento do endereço
   - Confirme o pedido

### Como Administrador

1. **Gerenciar Produtos**:
   - Acesse /admin/products para ver todos os produtos
   - Adicione novos produtos através do botão "Novo Produto"
   - Edite ou exclua produtos existentes

2. **Gerenciar Cupons**:
   - Acesse /admin/coupons para ver todos os cupons
   - Crie novos cupons com diferentes regras
   - Visualize o uso de cada cupom

3. **Gerenciar Pedidos**:
   - Veja todos os pedidos em /admin/orders
   - Filtre por status (pendente, processando, etc.)
   - Atualize o status de um pedido

## Webhook para Integração Externa

O sistema disponibiliza um endpoint para receber atualizações externas dos status dos pedidos:

```
POST /api/webhook/order-status
```

Formato do payload:
```json
{
  "order_id": 123,
  "status": "completed" // "pending", "processing", "completed", "shipped", "cancelled"
}
```

## Regras de Negócio Implementadas

1. **Cálculo de Frete**:
   - Subtotal entre R$52,00 e R$166,59: Frete R$15,00
   - Subtotal maior que R$200,00: Frete grátis
   - Outros valores: Frete R$20,00

2. **Estoque**:
   - O estoque é decrementado automaticamente após a finalização de um pedido
   - Ao cancelar um pedido, o estoque é restaurado
   - Não é possível adicionar ao carrinho produtos sem estoque

3. **Cupons**:
   - Um cupom pode ser percentual ou de valor fixo
   - Um cupom pode ter um valor mínimo de compra
   - Um cupom pode ter um limite de uso
   - Um cupom pode ter um período de validade

## Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas:

- **products**: Armazena informações básicas dos produtos
- **product_variations**: Armazena variações de produtos (ex: tamanhos, cores)
- **stocks**: Armazena o estoque de produtos e suas variações
- **coupons**: Armazena cupons de desconto
- **orders**: Armazena informações de pedidos
- **order_items**: Armazena itens individuais de um pedido
- **users**: Armazena informações de usuários

## Considerações de Desenvolvimento

### Padrões Aplicados
- Design Pattern MVC
- Repository Pattern para acesso a dados
- Service Layer para lógica de negócios
- Context API para gerenciamento de estado no React

### Práticas de Código Adotadas
- REST API com JSON
- Validação de dados no backend e frontend
- Tratamento de erros
- Logs de operações críticas
- Transações de banco de dados para operações críticas
- Componentização no React
- CSS responsivo com Bootstrap

## Créditos

Desenvolvido por [Seu Nome] como teste para vaga de desenvolvedor.

## Licença

Este projeto está licenciado sob a licença MIT.