# Auditoria final — PrintFlow ERP

## Estado validado

- CRM PF/PJ com CPF/CNPJ algorítmico, e-mail, telefone, CEP e nascimento.
- ViaCEP no CRM e cadastro público.
- Documento normalizado e bloqueio de duplicidade no CRM.
- Orçamento multi-item, PDF, aceite, pedido, prazo, financeiro e Kanban.
- PDV com conta de recebimento, caixa, cupom e produção opcional.
- Estoque, impressoras, serviços terceirizados, DTF e preço por m².
- Logística e acompanhamento público por token.
- Contas, transferências, abertura, sangria e fechamento de caixa.
- Login, sessão, bloqueio, ações protegidas, headers e uploads restritos.
- API externa autenticada e deduplicada.
- Dependências de produção sem vulnerabilidades conhecidas no npm audit.

## Gargalos corrigidos

- Orçamento aceitava somente um item.
- QR do WhatsApp podia ser consultado sem sessão.
- Documentos internos por ID não exigiam login.
- Token do webhook WhatsApp não usava comparação em tempo constante.
- CPF/CNPJ formatado podia contornar duplicidade.
- Upload aceitava qualquer image/*, incluindo SVG.
- PDV não direcionava recebimento para uma conta.
- Não havia caixa operacional, transferência ou API externa leve.

## Riscos residuais dependentes de infraestrutura

1. Rate limit deve ser configurado no Nginx/Cloudflare/Redis para login, cadastro e APIs.
2. A bridge WhatsApp é externa; segurança das credenciais e reconexão dependem desse serviço.
3. SMTP, InfinitePay, SuperFrete e Google Business exigem credenciais reais e testes de homologação.
4. Upload local exige volume persistente; em ambiente serverless, migrar para S3/R2.
5. Backup e restauração precisam ser automatizados e testados fora do servidor principal.
6. PDF usa fonte padrão sem acentos avançados incorporados; validar impressão final com dados reais.
7. Emissão fiscal depende de contador, certificado e homologação oficial.

## Módulos recomendados para próxima evolução

### Auditoria e permissões
- trilha de alterações por usuário;
- perfis Admin, Comercial, Produção, Financeiro e Logística;
- autenticação em dois fatores;
- gestão e revogação de sessões.

### Produção
- apontamento de início/fim por operador;
- QR ou código de barras na ordem;
- reserva e baixa automática de materiais ao iniciar produção;
- retrabalho, perda real e comparação com custo previsto;
- manutenção preventiva das máquinas.

### Compras e estoque
- solicitação e ordem de compra;
- cotação entre fornecedores;
- recebimento parcial;
- inventário e ajuste com aprovação;
- lotes, validade e localização física.

### Comercial
- histórico de versões do orçamento;
- follow-up automático sem resposta;
- contratos recorrentes;
- tabela de preço por cliente;
- comissão por vendedor.

### Financeiro
- conciliação por extrato OFX/CNAB;
- webhooks reais InfinitePay;
- DRE por competência;
- orçamento versus realizado;
- cobrança automática com régua e suspensão segura.

### Comunicação
- worker dedicado para processar filas;
- retentativas exponenciais e dead-letter queue;
- métricas de entrega, leitura e resposta;
- aprovação de campanha por usuário;
- Meta Cloud API para escala e conformidade.

### Operação e observabilidade
- testes E2E Playwright;
- Sentry/OpenTelemetry;
- métricas de fila e banco;
- health checks por integração;
- alertas de backup, disco e certificado.
