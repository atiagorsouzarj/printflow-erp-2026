# PrintFlow ERP — Arquitetura operacional

## Fluxo principal
Compra de materiais → estoque/custo médio → categoria e equipamento → ficha técnica → preço → orçamento → aceite público → pedido → Kanban → financeiro → notificações.

## Precificação
O papel sempre é material de estoque. A impressora calcula somente equipamento e insumos próprios da impressão.

Custo direto unitário = materiais com perdas + impressão + hora-máquina + mão de obra + extras + setup/quantidade mínima.

Custo ajustado = custo direto / (1 - taxa de falha).

Preço de venda = custo ajustado / (1 - impostos - cartão - comissão - margem).

Para 3D considerar peso do slicer, custo por grama, suportes/perda, horas, energia, desgaste/depreciação, falhas, preparação e pós-processamento.

## Serviços terceirizados e aproveitamento
`outsourced_services` identifica DTF UV, DTF Têxtil e parceiros. `outsourced_service_tiers` mantém formatos e preços reajustáveis. Para uma arte L×A, o sistema calcula encaixes nos sentidos normal e rotacionado, usa o maior resultado e divide o preço da folha pela quantidade. A composição fica registrada em `product_outsourced_services` e pode ser somada a caneca, camisa ou outro material.

## Estoque especializado
Cada variação tem SKU próprio. Papel controla formato, linha, acabamento, gramatura, unidade de compra e folhas por resma; estoque e custo ficam normalizados por folha. Vestuário controla tamanho, cor, composição e unidade por embalagem. Outras categorias usam atributos extensíveis em JSON.

## Captação e relacionamento
Toda entrada pública, WhatsApp, balcão ou API externa entra em `leads`. A conversão cria `clients`. Clientes PF/PJ guardam identificação, endereço, canais, origem e consentimentos.

## WhatsApp
O Next.js é o ERP e a fila. Uma bridge persistente externa executará Baileys. A bridge deve:
- autenticar o webhook com `WHATSAPP_BRIDGE_TOKEN`;
- persistir credenciais criptografadas fora do Git;
- salvar eventos e mensagens no PostgreSQL;
- respeitar janela, intervalo, limite diário, opt-in e opt-out;
- reconectar apenas em quedas transitórias;
- transferir para humano em dúvida, preço negociado, reclamação ou pedido explícito;
- nunca fazer campanha fria.

Baileys é não oficial e pode causar bloqueio. Para operação comercial crítica, priorizar WhatsApp Business Cloud API.

## Eventos de automação
`enviado`, `aprovado`, `arte`, `producao`, `acabamento`, `concluido`. Templates ativos geram registros em `notifications`; o transporte externo processa a fila e devolve status.

## PDV e documentos
Venda cria `pos_sales`, `pos_sale_items` e entrada financeira. `/cupom/[id]` renderiza cupom não fiscal de 80 mm. NFC-e, NF-e e NFS-e permanecem desabilitadas até homologação fiscal.

## Impressoras e consumíveis
Cada equipamento é editável e pertence a uma tecnologia isolada: `laser`, `inkjet`, `cutter`, `thermal`, `sublimation`, `three_d` ou `custom`. A interface nunca mistura campos entre tecnologias.

### Konica Minolta C284e
Referência TN-321: K ≈ 27.000 páginas e C/M/Y ≈ 25.000 páginas a 5% de cobertura. Também são rateados cilindro K (≈120 mil), cilindros CMY (≈75 mil), reveladores, correia, fusor e resíduos. O preço pago é sempre informado pelo usuário. Custo técnico = soma de cada consumível/rendimento + manutenção/volume + depreciação/volume.

### Epson L18050
Seis tintas 057 de 70 ml: K, C, M, Y, LC e LM. Referência oficial de rendimento composto até 7.200 páginas coloridas ou aproximadamente 2.100 fotos 10×15, além da caixa de manutenção. O sistema permite custo distinto por A4, A3, A3+ e foto 10×15.

### Silhouette
Custo individual = minutos × custo/minuto + passes × custo/passe + lâmina/rendimento + base/rendimento + depreciação + energia. Pode ser adicionada como segundo processo do produto após a impressão Laser/Jato.

O papel permanece material de estoque e é somado na ficha técnica. Produtos podem combinar equipamento principal, processo secundário, vários materiais e serviço terceirizado.

### Cobertura
Toner/tinta com rendimento nominal a 5% usa: `custo variável real = custo nominal × cobertura real / 5`. Desgaste, manutenção e depreciação são somados sem multiplicação por cobertura. A ficha permite 5%, 30%, 50% e 100%.

### Elgin L42 Pro Full
Ribbon é cadastrado em metros (normalmente 74 m; equipamento suporta até 100 m). `custo ribbon = preço do rolo ÷ metros × metros consumidos`. A etiqueta é material de estoque com SKU por formato/tamanho, quantidade e metragem do rolo. O produto informa metros de ribbon por unidade; a quantidade comercial escala o custo.

### 3D
A impressora não possui filamento na lista de consumíveis. Filamento/resina é material de estoque com custo por kg. O peso da peça em gramas é convertido para kg e somado à hora-máquina, energia, depreciação, falha e mão de obra.

### Sublimação L3150
Perfil CMYK com quatro tintas Genesis editáveis. Referência inicial: R$ 40 por cor, rendimento técnico da L3150 de 4.500 páginas para preto e 7.500 para o conjunto colorido; valores reais devem ser revisados conforme consumo da tinta compatível.

## PDV
Aceita desconto por item, desconto global fixo ou percentual, faixas automáticas por quantidade, acréscimo, parcelas, motivo e responsável pela autorização. O fechamento grava venda, itens e financeiro, abrindo o cupom não fiscal de 80 mm.

## Comunicação e QR
`/api/whatsapp/session` funciona como proxy da bridge definida por `WHATSAPP_BRIDGE_URL` e `WHATSAPP_BRIDGE_TOKEN`. A bridge deve expor GET/POST `/session` com `{status, qr, phone}`. O QR é convertido em imagem apenas no servidor. Campanhas consultam exclusivamente clientes liberados e consentidos.

## Pedidos, numeração e prazo
O Painel define prefixo, próximo número e padding. Aprovação de orçamento e PDV com produção bloqueiam a linha de settings durante a reserva, evitando duplicidade. Cada produto possui `lead_time_days`; o pedido usa o maior prazo entre os itens. O número e a previsão podem ser ajustados na carteira.

## Acompanhamento e logística
Cada pedido recebe token público e pode ser acompanhado em `/acompanhar/[token]` da aprovação à entrega. `deliveries` organiza Balcão, 99Entrega, Uber Entrega e SuperFrete com custo, motorista, coleta, rastreio e status. Mudanças geram notificações e a confirmação de entrega conclui o pedido.

## Página pública
`/cadastro` é isolada da administração. A aba Página pública permite editar textos, upload de banner, redes sociais e Google Reviews; o formulário PF/PJ permanece fixo. O bot envia esse link no primeiro atendimento.

## Documentos e canais
`/imprimir/[id]` gera ordem de produção A4. `/canais` consolida as origens dos pré-cadastros. E-mail e WhatsApp compartilham templates editáveis com preview vivo.

## Tesouraria e caixa do PDV
`financial_accounts` representa Caixa, Banco Inter, InfinitePay e novas contas. Todo recebimento pode apontar para uma conta. `financial_transfers` registra transferências com tarifa e cria partidas de saída/entrada. `cash_sessions` controla abertura e fechamento; `cash_movements` recebe vendas em dinheiro/PIX, suprimentos, sangrias e despesas. O fechamento calcula saldo esperado, valor contado e diferença.

## API externa
`/api/external` substitui integrações pesadas de telefonia dentro do ERP. Usa `EXTERNAL_API_TOKEN`, consulta clientes/pedidos e recebe eventos ou leads com deduplicação por `externalId`. Consulte `docs/EXTERNAL_API.md`.

## Configuração de módulos
O Painel de Controle guarda parâmetros não secretos por provedor em `settings.integrations` e `settings.communications`. Tokens, senhas SMTP, certificado A1, CSC e credenciais permanecem em variáveis de ambiente. Cada módulo possui configuração independente: ViaCEP, InfinitePay, SuperFrete, Google Business, API externa, fiscal, SMTP, WhatsApp, marketing e automações.

## Segurança
A área administrativa exige usuário e sessão PostgreSQL. Senhas usam bcrypt (cost 12), cookies são HttpOnly/SameSite Strict/Secure em produção, sessões expiram em 8 horas e contas bloqueiam por 15 minutos após 5 falhas. O primeiro administrador exige `ADMIN_SETUP_TOKEN` em produção. Uploads exigem sessão e aceitam apenas JPEG/PNG/WebP até 5 MB. Documentos internos por ID exigem login; páginas públicas usam tokens aleatórios. Webhook WhatsApp exige bearer token.

Antes do go-live: configurar TLS/reverse proxy, rotação de segredos, backup testado, observabilidade, política LGPD, restauração, sessão criptografada da bridge e usuário PostgreSQL sem privilégio de superusuário.
