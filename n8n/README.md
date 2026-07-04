# n8n WhatsApp Automation for Syncra Society

## Quick start (local Docker)

1. **Start n8n**
   ```bash
   docker compose up -d n8n
   ```
   Open http://localhost:5679 and create your n8n owner account.

2. **Configure syncra-society `.env`**
   ```env
   N8N_WEBHOOK_URL=http://localhost:5679/webhook/syncra-society
   SYNCRA_AUTOMATION_SECRET=syncra-local-dev-secret
   ```

3. **Start syncra (Vite + serverless API on one port)**
   ```bash
   npm run dev
   ```
   This runs `vercel dev --listen 5173`, serving the SPA and `/api/*` routes together.

4. **Import workflow**
   - In n8n: **Workflows → Import from File**
   - Select `n8n/workflows/syncra-society-whatsapp.json`
   - **Activate** the workflow (toggle top-right)

5. **Test**
   - RWA Admin → **WhatsApp Automation** → **Send Test to n8n**
   - Check n8n **Executions** tab for the incoming event

## Event flow

```
Portal activity → POST /api/automation/events → n8n webhook
                                              → Format message
                                              → WhatsApp BSP (Twilio/Gupshup/Wati)
```

## Inbound (WhatsApp → Portal)

Configure your BSP in n8n to POST inbound messages to:

```
POST http://host.docker.internal:5173/api/automation/inbound
Header: x-syncra-automation-secret: syncra-local-dev-secret
```

Example body (ticket):
```json
{
  "societyId": "syncra-windsor-castle",
  "flatNumber": "402",
  "phone": "+919876543210",
  "messageType": "ticket",
  "subject": "Lift not working",
  "description": "Tower B lift stuck on 3rd floor"
}
```

Example body (payment receipt):
```json
{
  "societyId": "syncra-windsor-castle",
  "flatNumber": "402",
  "messageType": "payment_receipt",
  "amount": 3500,
  "reference": "UPI/123456"
}
```

## Connecting a real WhatsApp provider

In the n8n workflow, replace the **Mock WhatsApp** node with:
- **Twilio** node (WhatsApp Business)
- **HTTP Request** to Gupshup / Wati / Interakt API
- **WhatsApp Business Cloud** node (Meta)

Use approved templates for outbound messages outside the 24-hour window.

## Cloud deployment

When moving to production:
1. Production n8n is hosted at Hugging Face Spaces (`avishekreg-syncra-society.hf.space`)
2. Set `N8N_WEBHOOK_URL=https://avishekreg-syncra-society.hf.space/webhook/syncra-society` in Vercel env
3. Use HTTPS and rotate `SYNCRA_AUTOMATION_SECRET`
4. Point inbound n8n HTTP nodes at `https://syncra-society.vercel.app/api/automation/inbound`

## Event types

| Type | Trigger |
|------|---------|
| `notice.published` | New notice posted |
| `visitor.approved` | Visitor approved at gate |
| `payment.reminder` | Payment reminder |
| `payment.received` | Payment recorded |
| `survey.created` | Survey launched |
| `election.open` | Election opened / vote cast |
| `helpdesk.ticket` | Ticket opened |
| `helpdesk.resolved` | Ticket resolved |
| `system.test` | Admin test button |
