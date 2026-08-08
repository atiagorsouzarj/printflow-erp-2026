# Integrações do PrintFlow

Todas começam desligadas. Ative no Painel de Controle somente após configurar as variáveis do servidor.

## SMTP

Configuração: Painel de Controle > Comunicação > E-mail SMTP.

Segredos: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

O worker `POST /api/jobs/notifications` processa a fila com `Authorization: Bearer CRON_SECRET`. PDFs são anexados ao e-mail e também aparecem como link.

## InfinitePay

Endpoint oficial: `POST https://api.checkout.infinitepay.io/links`.

Configuração: handle, retorno e webhook. Segredos: `INFINITEPAY_HANDLE`, `INFINITEPAY_WEBHOOK_SECRET`.

Webhook: `/api/integrations/infinitepay/webhook?token=...`.

O ERP valida pedido e valor antes de baixar financeiro e pagamento.

## Banco Inter / Pix

OAuth2 com mTLS. Segredos: `INTER_CLIENT_ID`, `INTER_CLIENT_SECRET`, `INTER_PIX_KEY`, `INTER_CERT_PATH`, `INTER_KEY_PATH`, `INTER_WEBHOOK_SECRET`.

Certificado e chave nunca entram no Git. Pix usa cobrança imediata e o webhook baixa o pedido somente se o valor coincidir.

## Aprovação de arte

Administrativo: `/artes`. Público: `/aprovar-arte/[token]`.

Cada envio cria uma versão. Aprovar move para Produção. Solicitar alteração exige nova versão. O Kanban bloqueia Produção quando a versão mais recente não está aprovada.

## SuperFrete

Endpoint: `/api/v0/calculator`, Bearer e User-Agent obrigatório.

Segredo: `SUPERFRETE_TOKEN`. Configuração: ambiente, CEP de origem e IDs de serviços.

A cotação fica em `/fretes` e a opção selecionada atualiza a logística.

## WhatsApp QR / Bridge

Configuração e código exclusivos: `WHATSAPP_BRIDGE_URL`, `WHATSAPP_BRIDGE_TOKEN`. Endpoint interno da bridge esperado: `/session` e `/messages`.

## WhatsApp Meta Cloud

Configuração e código exclusivos: `WHATSAPP_CLOUD_ACCESS_TOKEN`, `WHATSAPP_CLOUD_PHONE_NUMBER_ID`, `WHATSAPP_CLOUD_APP_SECRET`, `WHATSAPP_CLOUD_VERIFY_TOKEN`, `WHATSAPP_CLOUD_API_VERSION`.

Webhook: `/api/integrations/whatsapp-cloud/webhook`.

Ao ativar Cloud, QR é desligado. Ao ativar QR, Cloud é desligado. O ERP nunca executa os dois simultaneamente.

Para mensagens fora da janela de atendimento, configure um template aprovado pela Meta no Painel.

## Google Reviews

OAuth scope: `business.manage`. Configure Client ID, Client Secret, Refresh Token, Account ID e Location ID.

A sincronização usa a lista oficial de reviews, grava cache local e pode exibir avaliações na landing page.
