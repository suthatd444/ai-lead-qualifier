import { complete } from "./llm.js";
import { ruleBasedQualify } from "./rules.js";
import { QualificationSchema, type Lead, type Qualification } from "./types.js";

const SYSTEM = `You qualify inbound real-estate leads for a Pakistani agency CRM.
Reply with ONLY a JSON object with keys: score (0-100 int), stage (Inquiry|Prospect|Mature),
intent (buy|rent|invest|unknown), budgetPkr (number|null), propertyType (plot|apartment|shop|house|unknown),
timeline (urgent|soon|later|unknown), reasons (string[]), nextAction (string), source ("llm").`;

/** LLM first (validated with zod); falls back to deterministic rules on any failure. */
export async function qualifyLead(lead: Lead): Promise<Qualification> {
  const raw = await complete(SYSTEM, `Lead message: ${lead.message}\nPhone: ${lead.phone ?? "n/a"}`);
  if (raw) {
    try {
      const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = QualificationSchema.safeParse({ ...JSON.parse(json), source: "llm" });
      if (parsed.success) return parsed.data;
    } catch { /* fall through to rules */ }
  }
  return ruleBasedQualify(lead);
}
