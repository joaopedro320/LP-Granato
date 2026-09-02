# Integração Google Sheets + WhatsApp — Granato

## O que foi corrigido

- O formulário envia via POST para:
  `https://script.google.com/macros/s/AKfycbxhpEqcAkmSxiNGr69jR-0zcJBQk26TRAM5jMtrvenrmJrsLwFIMI8o-0l5KGw0qIiuNg/exec`
- O site só abre o WhatsApp depois de receber do Apps Script a confirmação de que a linha foi gravada.
- O token de integração já fica preenchido no HTML, então o POST não depende do JavaScript para esse campo.
- O Code.gs pode usar automaticamente a própria planilha quando ele foi criado em **Extensões > Apps Script** dentro dela.

## PASSO OBRIGATÓRIO NO GOOGLE APPS SCRIPT

A URL `/exec` já publicada NÃO é atualizada apenas porque o arquivo do site mudou.

1. Abra a planilha que deve receber os leads.
2. Vá em **Extensões > Apps Script**.
3. Abra `Code.gs`.
4. Apague o conteúdo e cole o conteúdo de `google-apps-script/Code.gs` deste projeto.
5. Salve.
6. No topo, selecione a função **testarPlanilha** e clique em **Executar**.
7. Autorize o acesso solicitado pelo Google.
8. Confira se apareceu uma linha `TESTE APPS SCRIPT` na aba `Leads do Site`.
9. Vá em **Implantar > Gerenciar implantações**.
10. Edite a implantação atual (ícone de lápis).
11. Em versão, escolha **Nova versão**.
12. Confirme:
    - Executar como: **Você**
    - Quem pode acessar: **Qualquer pessoa**
13. Clique em **Implantar**.

Se você editar a implantação existente, a URL `/exec` normalmente permanece a mesma, então o `index.html` já está configurado.

## Teste rápido

Depois da nova implantação, abra a URL `/exec` no navegador. Ela deve mostrar:

`Integração Granato ativa. Planilha conectada. Aba: Leads do Site`

Depois preencha o formulário no site. O WhatsApp só deve abrir se a gravação for confirmada.
