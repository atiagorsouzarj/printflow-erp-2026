# API externa do PrintFlow

Base: `/api/external`

Autenticação obrigatória:

`Authorization: Bearer <EXTERNAL_API_TOKEN>`

## Consultar pedidos

`GET /api/external?resource=orders`

Retorna até 100 pedidos recentes com código, etapa, pagamento, entrega, prazo, total e cliente relacionado.

## Consultar clientes

`GET /api/external?resource=clients`

Retorna até 100 clientes recentes com identificação e canais de contato. Restrinja o token ao servidor parceiro e trafegue apenas por HTTPS.

## Enviar evento

`POST /api/external`

```json
{
  "source": "telefonia_externa",
  "event": "call.completed",
  "externalId": "call-123",
  "payload": {
    "phone": "5521999999999",
    "duration": 90
  }
}
```

`externalId` permite deduplicação.

## Criar pré-cadastro

```json
{
  "source": "telefonia_externa",
  "event": "lead.created",
  "externalId": "lead-123",
  "name": "Cliente",
  "phone": "5521999999999",
  "email": "cliente@example.com",
  "interest": "Banner",
  "message": "Solicitou retorno"
}
```

O registro entra em Pré-cadastros com origem `external_api`.

## Segurança

- Gere o token com `openssl rand -hex 32`.
- Nunca exponha o token no navegador.
- Use HTTPS.
- Restrinja IP/origem no proxy reverso.
- Rotacione periodicamente.
- Use `externalId` em todos os eventos.
