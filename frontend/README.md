# Frontend React - Mini ERP

Este diretório contém o frontend em React para o Mini ERP, que se comunica com a API Laravel.

## Estrutura de Pastas

```
/src
  /api - Serviços para comunicação com a API
  /assets - Imagens, ícones e outros recursos estáticos
  /components - Componentes reutilizáveis
  /contexts - Contextos de React (para gerenciamento de estado global)
  /hooks - Hooks personalizados
  /layouts - Componentes de layout como cabeçalho, rodapé, etc.
  /pages - Páginas principais da aplicação
  /utils - Funções utilitárias
```

## Scripts Disponíveis

No diretório do projeto, você pode executar:

### `npm start`

Executa o aplicativo no modo de desenvolvimento.\
Abra [http://localhost:3000](http://localhost:3000) para visualizá-lo no navegador.

### `npm test`

Inicia o executor de testes no modo de observação interativo.

### `npm run build`

Compila o aplicativo para produção na pasta `build`.\
Ele agrupa corretamente o React no modo de produção e otimiza a compilação para obter o melhor desempenho.

## Configuração da API

A comunicação com a API Laravel é configurada no arquivo `/src/api/config.js`. Por padrão, espera-se que a API esteja disponível em `http://localhost:8000/api`.

## Autenticação

O aplicativo implementa autenticação baseada em token usando Laravel Sanctum. Os tokens são armazenados no localStorage e gerenciados pelo contexto de autenticação.