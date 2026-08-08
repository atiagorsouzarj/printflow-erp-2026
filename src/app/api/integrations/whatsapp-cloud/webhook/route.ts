import { db } from "@/db";
import { integrationLogs, leads, whatsappConversations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import { configs } from "@/lib/integrations";

type MetaStatus = { id?: string; status?: string; timestamp?: string; errors?: unknown[] };
type MetaMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};
type MetaValue = {
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
};
type MetaWebhook = { entry?: Array<{ changes?: Array<{ value?: MetaValue }> }> };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_CLOUD_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const { communications } = await configs();
  if (!communications.whatsapp_cloud?.enabled || communications.whatsapp_qr?.enabled) return Response.json({ error: "cloud provider disabled" }, { status: 409 });
  const raw = await request.text();
  const secret = process.env.WHATSAPP_CLOUD_APP_SECRET;
  const signature = request.headers.get("x-hub-signature-256") || "";
  if (!secret || !validSignature(raw, signature, secret)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }
  const body = JSON.parse(raw) as MetaWebhook;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const status of value.statuses || []) {
        await db.insert(integrationLogs).values({
          provider: "whatsapp_cloud",
          action: "message_status",
          status: status.status || "unknown",
          reference: status.id,
          metadata: { timestamp: status.timestamp, errors: status.errors },
        });
      }
      for (const message of value.messages || []) {
        const phone = message.from || value.contacts?.[0]?.wa_id;
        if (!phone) continue;
        const name = value.contacts?.[0]?.profile?.name;
        const text = message.text?.body || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || `Mensagem ${message.type || "desconhecida"}`;
        await db.insert(whatsappConversations).values({ phone, contactName: name, direction: "incoming", message: text, status: "received" });
        const [known] = await db.select().from(leads).where(eq(leads.phone, phone)).limit(1);
        if (!known) {
          await db.insert(leads).values({ protocol: `PR-META-${Date.now().toString().slice(-7)}`, name: name || "Contato WhatsApp", phone, interest: "Atendimento Meta Cloud", message: text, origin: "whatsapp", score: 75, status: "em atendimento", acceptsWhatsapp: true });
        }
      }
    }
  }
  return Response.json({ ok: true });
}

function validSignature(raw: string, signature: string, secret: string) {
  const expected = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
