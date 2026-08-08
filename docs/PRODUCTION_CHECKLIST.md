# Checklist de produção — PrintFlow

## Obrigatório antes de publicar

- Definir `ADMIN_SETUP_TOKEN` e criar o primeiro administrador.
- Usar HTTPS com HSTS no proxy reverso.
- Trocar a senha padrão do PostgreSQL e usar usuário sem superuser.
- Definir `EXTERNAL_API_TOKEN` e `WHATSAPP_BRIDGE_TOKEN` com `openssl rand -hex 32`.
- Configurar SMTP e validar SPF, DKIM e DMARC.
- Configurar backup diário e testar restauração.
- Restringir `/api/external` por IP no proxy quando possível.
- Guardar sessões Baileys criptografadas e fora do Git.
- Configurar retenção de dados e política LGPD.
- Instalar monitoramento de erros, uptime e espaço em disco.
- Configurar limite de requisições no proxy para `/login`, `/cadastro`, webhooks e APIs.

## Financeiro

- Revisar saldos iniciais de Caixa, Banco Inter e InfinitePay.
- Mapear no PDV cada forma de pagamento para a conta correta.
- Abrir caixa antes de vendas em dinheiro.
- Conferir taxas InfinitePay e conciliação bancária.

## Documentos

- Validar impressora térmica em 80 mm.
- Validar etiqueta interna e ordem A4.
- Conferir PDFs de orçamento e pedido.
- Não ativar documento fiscal sem homologação do contador/SEFAZ/prefeitura.

## Integrações pendentes de credencial

- WhatsApp Bridge ou Meta Cloud API.
- SMTP.
- InfinitePay.
- SuperFrete.
- Google Business.
- API externa.
- Emissão fiscal futura.
