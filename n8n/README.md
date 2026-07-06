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
Portal activity → POST n8n webhook
               → Normalize Portal Event (Code — builds whatsappMessage once)
               → Mock WhatsApp Send (local) OR Twilio WhatsApp Send (production)
               → Respond to Syncra
```

**Removed:** legacy **Format WhatsApp Message** Set node and **Route by Event Type** switch (both caused multi-path loops and `=` spam).

**Re-import required:** Workflows → Import from File → `n8n/workflows/syncra-society-whatsapp.json` → deactivate/delete the old workflow copy in n8n.

**Important:** Do not use mixed `=` and `{{ }}` syntax in Set/Twilio message fields — n8n sends raw `=` characters. Twilio **Message** must be exactly `={{ $json.whatsappMessage }}`. Message text is built only inside **Normalize Portal Event** (Code node).

## Connecting a real WhatsApp provider

1. Add Twilio credentials in n8n (**Credentials → Twilio**).
2. Open **Twilio WhatsApp Send**, attach credentials, and **enable** the node.
3. **Disable Mock WhatsApp Send** so only one send path runs.
4. Message mapping:
   - **Message body:** `={{ $json.whatsappMessage }}`
   - **To:** `={{ $json.toPhone }}` (prefixed with `whatsapp:` inside the node expression)
   - **From:** society sender from `$json.sender_whatsapp` or your Twilio sandbox number

For local testing, keep **Mock WhatsApp Send** enabled and **Twilio WhatsApp Send** disabled.

Other BSP options:
- **HTTP Request** to Gupshup / Wati / Interakt API
- **WhatsApp Business Cloud** node (Meta)

## Inbound (WhatsApp → Portal)

Inbound payloads are merged in **Normalize Inbound Message** (single item) before forwarding.

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

Use approved WhatsApp templates for outbound messages outside the 24-hour window.

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
