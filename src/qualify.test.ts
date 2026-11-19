import test from "node:test";
import assert from "node:assert/strict";
import { parseBudgetPkr, ruleBasedQualify } from "./rules.js";
import { qualifyLead } from "./qualify.js";

test("parseBudgetPkr handles crore, lakh, million, k", () => {
  assert.equal(parseBudgetPkr("budget 1.5 crore"), 15_000_000);
  assert.equal(parseBudgetPkr("around 80 lakh"), 8_000_000);
  assert.equal(parseBudgetPkr("2 million max"), 2_000_000);
  assert.equal(parseBudgetPkr("no number here"), null);
});

test("hot lead becomes Mature", () => {
  const q = ruleBasedQualify({
    phone: "923001234567",
    message: "Need to buy a 10 marla plot urgently, budget 1.2 crore. Can I visit the site tomorrow?",
  });
  assert.equal(q.stage, "Mature");
  assert.equal(q.propertyType, "plot");
  assert.equal(q.budgetPkr, 12_000_000);
});

test("vague lead stays Inquiry", () => {
  assert.equal(ruleBasedQualify({ message: "hi, price?" }).stage, "Inquiry");
});

test("falls back to rules when no API key", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const q = await qualifyLead({ message: "Looking to invest in a shop, budget 3 crore" });
  assert.equal(q.source, "rules");
  assert.equal(q.intent, "invest");
});
