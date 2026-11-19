import { z } from "zod";

export const STAGES = ["Inquiry", "Prospect", "Mature"] as const;
export type Stage = (typeof STAGES)[number];

export const QualificationSchema = z.object({
  score: z.number().int().min(0).max(100),
  stage: z.enum(STAGES),
  intent: z.enum(["buy", "rent", "invest", "unknown"]),
  budgetPkr: z.number().nullable(),
  propertyType: z.enum(["plot", "apartment", "shop", "house", "unknown"]),
  timeline: z.enum(["urgent", "soon", "later", "unknown"]),
  reasons: z.array(z.string()),
  nextAction: z.string(),
  source: z.enum(["llm", "rules"]),
});
export type Qualification = z.infer<typeof QualificationSchema>;

export interface Lead {
  name?: string;
  phone?: string;
  message: string;
}
