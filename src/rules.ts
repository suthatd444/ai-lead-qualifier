import type { Lead, Qualification, Stage } from "./types.js";

/** Parse a budget like "1.5 crore", "80 lakh", "2 million", "50k" into PKR. */
export function parseBudgetPkr(text: string): number | null {
  const re = /(\d+(?:[.,]\d+)?)\s*(crore|cr|lakh|lac|lacs|million|mn|m|k|thousand)\b/i;
  const m = text.match(re);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toLowerCase();
  const mult: Record<string, number> = {
    crore: 1e7, cr: 1e7, lakh: 1e5, lac: 1e5, lacs: 1e5,
    million: 1e6, mn: 1e6, m: 1e6, k: 1e3, thousand: 1e3,
  };
  return Math.round(n * mult[unit]);
}

const has = (t: string, words: string[]) => words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(t));

export function ruleBasedQualify(lead: Lead): Qualification {
  const t = lead.message;
  const reasons: string[] = [];
  let score = 10;

  const intent = has(t, ["invest", "investment", "roi"]) ? "invest"
    : has(t, ["rent", "lease", "tenant"]) ? "rent"
    : has(t, ["buy", "purchase", "looking for", "need"]) ? "buy" : "unknown";
  if (intent !== "unknown") { score += 20; reasons.push(`Clear intent: ${intent}`); }

  const propertyType = has(t, ["plot", "marla", "kanal"]) ? "plot"
    : has(t, ["apartment", "flat"]) ? "apartment"
    : has(t, ["shop", "commercial", "office"]) ? "shop"
    : has(t, ["house", "villa"]) ? "house" : "unknown";
  if (propertyType !== "unknown") { score += 15; reasons.push(`Property type: ${propertyType}`); }

  const budgetPkr = parseBudgetPkr(t);
  if (budgetPkr) { score += 20; reasons.push(`Budget stated (~PKR ${budgetPkr.toLocaleString("en-US")})`); }

  const timeline = has(t, ["urgent", "urgently", "asap", "immediately", "today", "tomorrow"]) ? "urgent"
    : has(t, ["this month", "next week", "soon", "this week"]) ? "soon"
    : has(t, ["next year", "later", "maybe", "someday"]) ? "later" : "unknown";
  if (timeline === "urgent") { score += 25; reasons.push("Urgent timeline"); }
  else if (timeline === "soon") { score += 15; reasons.push("Short timeline"); }
  else if (timeline === "later") { score -= 5; }

  if (has(t, ["visit", "viewing", "meeting", "site"])) { score += 10; reasons.push("Wants a visit/meeting"); }
  if (lead.phone) { score += 5; reasons.push("Phone captured"); }

  score = Math.max(0, Math.min(100, score));
  const stage: Stage = score >= 70 ? "Mature" : score >= 40 ? "Prospect" : "Inquiry";
  const nextAction = stage === "Mature" ? "Call within 15 minutes and book a site visit"
    : stage === "Prospect" ? "Send matching inventory and schedule a follow-up"
    : "Send intro message and ask for budget, area and timeline";

  return { score, stage, intent, budgetPkr, propertyType, timeline, reasons, nextAction, source: "rules" };
}
