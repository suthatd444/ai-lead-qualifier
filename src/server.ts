import express from "express";
import { z } from "zod";
import { qualifyLead } from "./qualify.js";

export const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

const LeadBody = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(1),
});

// Direct API: POST a lead, get a score + suggested CRM stage.
app.post("/qualify", async (req, res) => {
  const body = LeadBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  res.json(await qualifyLead(body.data));
});

// WhatsApp Cloud API webhook verification (Meta calls this once when you set the webhook).
app.get("/webhook/whatsapp", (req, res) => {
  const ok = req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === (process.env.WHATSAPP_VERIFY_TOKEN ?? "change-me");
  if (ok) return res.status(200).send(String(req.query["hub.challenge"]));
  res.sendStatus(403);
});

// WhatsApp Cloud API incoming messages. Always 200 quickly so Meta does not retry.
app.post("/webhook/whatsapp", async (req, res) => {
  const results: unknown[] = [];
  for (const entry of req.body?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const names = new Map<string, string>(
        (change.value?.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name]),
      );
      for (const msg of change.value?.messages ?? []) {
        if (msg.type !== "text") continue;
        const lead = { name: names.get(msg.from), phone: msg.from, message: msg.text?.body ?? "" };
        results.push({ lead, qualification: await qualifyLead(lead) });
        // TODO: push to your CRM (e.g. POST /leads) and notify the assigned agent.
      }
    }
  }
  console.log(JSON.stringify(results));
  res.sendStatus(200);
});

if (process.argv[1]?.endsWith("server.ts")) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`Lead qualifier listening on :${port}`));
}
