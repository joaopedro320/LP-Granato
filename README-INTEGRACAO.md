# Integração do formulário — Granato Marmoraria

O projeto foi preparado para este fluxo:

1. O visitante preenche o formulário da landing page.
2. Todos os campos são enviados para um Google Apps Script.
3. O Apps Script grava uma nova linha na aba **Leads do Site** do Google Sheets.
4. Somente depois da gravação, a landing page redireciona para o WhatsApp.
5. Mensagem enviada ao WhatsApp: **Olá, vim pelo site no google e gostaria de mais informações.**

## 1. Criar/configurar a planilha

Crie uma planilha no Google Sheets ou use uma já existente. Copie o ID da planilha, que fica na URL entre `/d/` e `/edit`.

Exemplo:

`https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/edit`

Abra `google-apps-script/Code.gs` e substitua:

`COLE_AQUI_O_ID_DA_PLANILHA`

pelo ID real da sua planilha.

## 2. Criar o Apps Script

1. Acesse https://script.google.com/ e crie um projeto.
2. Apague o conteúdo padrão e cole o conteúdo de `google-apps-script/Code.gs`.
3. Salve.
4. Clique em **Implantar > Nova implantação**.
5. Escolha **Aplicativo da Web**.
6. Em **Executar como**, escolha sua conta.
7. Em **Quem tem acesso**, escolha **Qualquer pessoa**.
8. Autorize o acesso à planilha.
9. Copie a URL da implantação que termina em `/exec`.

## 3. Ligar o site ao Apps Script

Abra `js/config.js` e substitua:

`https://script.google.com/macros/s/AKfycbxhpEqcAkmSxiNGr69jR-0zcJBQk26TRAM5jMtrvenrmJrsLwFIMI8o-0l5KGw0qIiuNg/exec`

pela URL `/exec` copiada na etapa anterior.

O mesmo arquivo centraliza o número e a mensagem do WhatsApp:

- Número atual: `554497600121`
- Mensagem: `Olá, vim pelo site no google e gostaria de mais informações.`

Se o número correto for outro, altere apenas `whatsappNumber` diretamente no `index.html`.

## Dados enviados para o Google Sheets

Além dos campos visíveis do formulário, o site também envia dados de origem para facilitar a leitura dos leads:

- nome
- telefone
- cidade
- tipo_projeto
- material
- projeto_arquitetonico
- prazo
- mensagem
- lgpd_consentimento
- origem
- pagina
- referencia
- utm_source
- utm_medium
- utm_campaign
- utm_term
- utm_content
- gclid
- data_hora_cliente
- data_hora_servidor

O Apps Script também aceita novos campos no futuro e cria novas colunas automaticamente.

## Teste recomendado

Depois de publicar o site e implantar o Apps Script:

1. Abra a landing page com parâmetros de teste, por exemplo `?utm_source=google&utm_medium=cpc&utm_campaign=teste`.
2. Preencha e envie o formulário.
3. Confira se uma linha apareceu na aba **Leads do Site**.
4. Confirme se o WhatsApp abriu com a mensagem correta.

## Correção de compatibilidade do formulário

Nesta versão:
- a URL do Apps Script está diretamente no `action` do formulário no `index.html`;
- os caminhos de CSS, JavaScript e imagens são relativos (`./...`), funcionando em domínio raiz, subpasta e preview local;
- o POST é feito nativamente para um iframe oculto, evitando dependência de CORS;
- ao finalizar a requisição, o visitante é direcionado ao WhatsApp com a mensagem configurada;
- o botão continua sendo um submit nativo como fallback caso algum JavaScript deixe de carregar.
