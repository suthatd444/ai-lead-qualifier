# AI Lead Qualifier (real-estate CRM)

A small Express + TypeScript service that receives inbound leads (including **WhatsApp Cloud API** webhooks), scores them 0–100, and suggests a CRM pipeline stage (`Inquiry → Prospect → Mature`) plus the next action for the agent.

- **LLM scoring** with Claude (JSON output validated by `zod`)
- **Deterministic fallback** if no API key is set or the model returns something invalid, so it never fails a lead
- Understands Pakistani budgets (`1.5 crore`, `80 lakh`) and property types (marla plots, shops, apartments)
- WhatsApp webhook verification + message parsing included

## Run

```bash
npm install
cp .env.example .env      # optional: add ANTHROPIC_API_KEY
npm start
npm test
```

## API

```bash
curl -X POST localhost:3000/qualify -H 'content-type: application/json' \
  -d '{"phone":"923001234567","message":"Need to buy a 10 marla plot urgently, budget 1.2 crore, can visit tomorrow"}'
```

Returns `score`, `stage`, `intent`, `budgetPkr`, `propertyType`, `timeline`, `reasons`, `nextAction`, and `source` (`llm` or `rules`).

| Endpoint | Purpose |
|---|---|
| `POST /qualify` | Score one lead |
| `GET /webhook/whatsapp` | Meta webhook verification |
| `POST /webhook/whatsapp` | Receive WhatsApp text messages and qualify them |
| `GET /health` | Health check |

## Next steps for production
Persist leads in PostgreSQL, push qualified leads into the CRM, notify the assigned agent, and verify the `X-Hub-Signature-256` header on webhooks.
