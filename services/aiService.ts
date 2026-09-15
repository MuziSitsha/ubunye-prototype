// AI service abstraction (spec §36). AI narrates; it never scores, ranks or decides
// (docs/decisions.md D8). MockAIService is the default in every environment and needs
// no network access at all — the whole Golden Demo works with it alone. ClaudeAIService
// is a drop-in replacement selected by AI_MODE=claude, used only server-side. Deliberately
// NOT prefixed NEXT_PUBLIC_ — nothing client-side ever needs to know which mode is active,
// so there's no reason to ship this value to the browser.

import { formatList } from "@/lib/format";
import type {
  AIService,
  RecommendationContext,
  SkillInterpretation,
  VentureContext,
} from "@/types/domain";

// ---------------------------------------------------------------------------
// Keyword map for MockAIService.interpretSkills — deterministic, not learned.
// Most names here match a row already seeded in supabase/seed.sql; a handful
// (welding, catering, web development, etc.) don't, and that's fine —
// skillInterpreterService resolves by name (case-insensitive) and creates a
// new skill row for anything that isn't already in the catalogue (see
// migration 20260915120000_open_catalogue_inserts.sql — the RLS policy that
// makes this actually work). Skills outside the original seeded set won't
// have opportunity-matching relationships yet, but the user is never blocked
// from recording what they can do.
// ---------------------------------------------------------------------------
const SKILL_KEYWORDS: Record<string, string[]> = {
  "Appliance Repair": [
    "fridge", "refrigerator", "washing machine", "appliance", "stove", "oven repair",
    "microwave", "dishwasher", "tumble dryer", "kettle repair", "repair machines",
    "fix appliances", "white goods",
  ],
  "Electrical Maintenance": [
    "electrical", "electrician", "wiring", "plugs", "circuit", "installing lights",
    "fuse", "rewiring", "electric fault", "dstv install", "db board",
  ],
  "Fault Diagnosis": [
    "diagnos", "troubleshoot", "fixing things", "figure out what's wrong", "fault finding",
    "good with my hands", "handyman", "handywoman", "problem solving", "fixing stuff",
  ],
  Driving: [
    "drive", "driving", "driver", "licence", "license", "code 10", "code 14",
    "pdp", "taxi", "chauffeur", "uber driver", "bolt driver",
  ],
  Logistics: [
    "logistics", "delivery", "deliveries", "courier", "transport", "dispatch",
    "supply chain", "stock control", "distribution",
  ],
  Sales: [
    "sales", "selling", "sell ", "salesperson", "sold ", "telesales", "door to door",
    "negotiating deals", "closing deals", "upsell",
  ],
  "Customer Service": [
    "customer service", "customer relations", "dealing with customers", "front desk",
    "call centre", "call center", "receptionist", "helping customers", "client relations",
  ],
  "Social Media Marketing": [
    "social media", "instagram", "facebook page", "tiktok", "content creation", "marketing",
    "whatsapp business", "online marketing", "digital marketing", "promoting my business",
    "growing followers",
  ],
  Administration: [
    "admin", "administration", "paperwork", "organising", "organizing", "scheduling",
    "filing", "data capturing", "data entry", "office work", "diary management",
  ],
  Bookkeeping: [
    "bookkeeping", "invoicing", "accounts", "accounting", "budgets", "payroll",
    "financial records", "keeping books", "reconciliations", "vat", "tax returns",
  ],
  Baking: ["bak", "cakes", "pastries", "bread", "cupcakes", "cake decorating", "confectionery"],
  "Food Preparation": [
    "cooking", "cook ", "food prep", "meal prep", "kitchen work", "chef", "catering",
    "preparing meals", "recipe", "kitchen assistant",
  ],
  "Food Safety": ["food safety", "food hygiene", "hygiene certificate", "haccp"],
  Cleaning: [
    "clean", "cleaning", "housekeeping", "domestic work", "laundry", "ironing",
    "washing clothes", "tidying", "sanitising", "deep cleaning",
  ],
  "Gardening & Landscaping": [
    "garden", "landscap", "lawn", "yard work", "mowing", "hedge trimming", "irrigation",
    "planting", "grass cutting",
  ],
  Childcare: [
    "childcare", "babysit", "child minding", "look after kids", "look after children",
    "nanny", "au pair", "creche", "early childhood",
  ],
  Tutoring: [
    "tutor", "teaching", "homework help", "extra lessons", "teacher", "lecturing",
    "mentoring students", "maths help", "matric",
  ],
  "Sewing & Tailoring": [
    "sewing", "tailor", "alterations", "dressmaking", "sew clothes", "fashion design",
    "making clothes", "pattern making",
  ],
  Carpentry: [
    "carpentry", "carpenter", "woodwork", "furniture making", "cabinet making",
    "building furniture", "joinery",
  ],
  Plumbing: [
    "plumb", "pipes", "geyser", "blocked drain", "leaking tap", "toilet installation",
    "drainage",
  ],
  "Construction Painting": [
    "painting walls", "house painting", "painter", "spray painting", "wall paint",
    "decorating houses",
  ],
  "Mobile Phone Repair": [
    "phone repair", "screen repair", "cellphone repair", "smartphone repair",
    "cracked screen", "battery replacement", "unlocking phones",
  ],
  "Basic Computer Literacy": [
    "computer literate", "microsoft office", "typing", "excel", "computer skills",
    "word processing", "email skills", "internet skills", "basic it",
  ],
  "Event Planning": [
    "event planning", "organising events", "organizing events", "weddings", "party planning",
    "function coordination", "decor setup",
  ],
  Photography: [
    "photography", "photographer", "taking photos", "videography", "video editing",
    "filming", "camera work",
  ],
  "Hairdressing & Beauty": [
    "hair", "hairdress", "braiding", "nails", "makeup", "beauty", "barber", "barbering",
    "weaves", "manicure", "pedicure", "lashes", "eyebrows", "spa",
  ],
  "Security Services": [
    "security guard", "patrol", "security services", "cctv", "bouncer", "gate guard",
    "armed response",
  ],
  "Agriculture & Farming": [
    "farming", "agricultur", "crops", "livestock", "vegetable garden", "poultry",
    "chickens", "cattle", "farm work", "harvesting",
  ],
  Welding: ["weld", "welding", "boilermaker", "fabrication", "metalwork"],
  "Bricklaying & Masonry": ["bricklay", "masonry", "plastering", "tiling", "paving", "building walls"],
  "Panel Beating & Spray Painting": ["panel beat", "spray paint car", "auto body", "car dent repair"],
  "Mechanic & Vehicle Repair": ["mechanic", "car repair", "engine repair", "vehicle service", "tyre fitting", "auto electrical"],
  Upholstery: ["upholstery", "reupholster", "furniture repair", "couch repair"],
  Catering: ["catering", "caterer", "bulk cooking", "function catering"],
  "Bartending & Waitering": ["bartend", "waiter", "waitress", "mixologist", "barista", "serving tables"],
  "Warehouse & Forklift Operations": ["forklift", "warehouse", "picking and packing", "stock taking"],
  "Caregiving & Home-Based Care": ["caregiver", "caregiving", "home-based care", "elderly care", "nursing assistant", "patient care"],
  "Graphic Design": ["graphic design", "logo design", "canva", "flyer design", "branding design"],
  "Web Development": ["web development", "coding", "programming", "website design", "app development", "software developer"],
  "Writing & Content Creation": ["writing", "copywriting", "blogging", "content writer", "proofreading", "translation"],
  "Music & Entertainment": ["dj", "music production", "singing", "musician", "sound engineer", "mc "],
  "Fitness Training": ["fitness training", "personal trainer", "gym instructor", "yoga instructor", "coaching sport"],
  "Retail & Cashier": ["cashier", "retail assistant", "till operator", "shop assistant", "merchandising"],
};

function interpretSkillsDeterministically(input: string): SkillInterpretation {
  const lower = input.toLowerCase();
  const skills: { name: string; confidence: number }[] = [];

  for (const [skillName, keywords] of Object.entries(SKILL_KEYWORDS)) {
    const matches = keywords.filter((k) => lower.includes(k));
    if (matches.length > 0) {
      const confidence = Math.min(0.95, 0.75 + (matches.length - 1) * 0.05);
      skills.push({ name: skillName, confidence: Math.round(confidence * 100) / 100 });
    }
  }

  return { skills: skills.sort((a, b) => b.confidence - a.confidence) };
}

function explainRecommendationDeterministically(rec: RecommendationContext): string {
  const { components } = rec;
  const sentences: string[] = [];

  if (components.skill_coverage.matched.length > 0) {
    sentences.push(
      `Your team already covers ${formatList(components.skill_coverage.matched)}, which is what ${rec.opportunityName} needs most.`
    );
  }

  if (components.resource_coverage.matched.length > 0) {
    sentences.push(`You also have access to ${formatList(components.resource_coverage.matched)}.`);
  }

  if (components.demand.score >= 0.7) {
    sentences.push(
      `Demand for this kind of service is showing as strong in this demonstration area, which supports the case for pursuing it.`
    );
  } else if (components.demand.score >= 0.4) {
    sentences.push(`Demand in the demonstration signal set is moderate — worth validating with real customers early.`);
  }

  if (components.location.basis === "same_city" || components.location.basis === "national") {
    sentences.push(`This opportunity is a good geographic fit for where your team is based.`);
  } else if (components.location.basis === "same_province") {
    sentences.push(`Your team is spread across the same province, which still works for this opportunity.`);
  }

  const missingSkills = components.skill_coverage.missing;
  const missingResources = components.resource_coverage.missing;
  if (missingSkills.length > 0 || missingResources.length > 0) {
    const missing = [...missingSkills, ...missingResources];
    sentences.push(
      `The main gap right now is ${formatList(missing)} — Ubunye can point your team toward support and training to close that.`
    );
  }

  sentences.push(
    `Overall this scores ${Math.round(rec.total * 100)}% for your team based on skills, resources, demand, location and availability.`
  );

  return sentences.join(" ");
}

function generateBusinessSummaryDeterministically(venture: VentureContext): string {
  const team = formatList(venture.teamMemberNames);
  const { whatWeSell, whoWillBuy, whyChooseUs } = venture.businessConcept;

  const parts: string[] = [
    `${venture.ventureName} is a team of ${venture.teamMemberNames.length} (${team}) pursuing the ${venture.opportunityName} opportunity through Ubunye.`,
  ];

  if (whatWeSell) parts.push(`They plan to offer: ${whatWeSell}.`);
  if (whoWillBuy) parts.push(`Their target customer: ${whoWillBuy}.`);
  if (whyChooseUs) parts.push(`What sets them apart: ${whyChooseUs}.`);

  parts.push(`The venture is currently at the "${venture.stage.replace(/_/g, " ")}" stage of the business journey.`);

  return parts.join(" ");
}

/**
 * Deterministic, zero-cost, zero-latency. Default AIService in every environment
 * (docs/decisions.md D8). Never calls out to a network.
 */
export class MockAIService implements AIService {
  async interpretSkills(input: string): Promise<SkillInterpretation> {
    return interpretSkillsDeterministically(input);
  }

  async explainRecommendation(recommendation: RecommendationContext): Promise<string> {
    return explainRecommendationDeterministically(recommendation);
  }

  async generateBusinessSummary(venture: VentureContext): Promise<string> {
    return generateBusinessSummaryDeterministically(venture);
  }
}

/**
 * Calls the Claude API to phrase the same content MockAIService phrases deterministically.
 * Server-side only — never import this from a Client Component. Selected via
 * AI_MODE=claude (build plan §4, Build 6). Falls back to the deterministic
 * mock output if the API call fails, so a flaky connection during a live demo degrades
 * gracefully instead of breaking the journey (spec §32, §50).
 */
export class ClaudeAIService implements AIService {
  private async client() {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async interpretSkills(input: string): Promise<SkillInterpretation> {
    try {
      const anthropic = await this.client();
      const message = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 512,
        system:
          "You extract a structured list of skills from a person's free-text description of " +
          "what they can do. Respond with ONLY a JSON object of the shape " +
          '{"skills":[{"name":string,"confidence":number between 0 and 1}]}. ' +
          "Use concise, title-case skill names (e.g. \"Appliance Repair\", not \"I can fix appliances\"). " +
          "Do not include any commentary outside the JSON.",
        messages: [{ role: "user", content: input }],
      });
      const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.skills)) return { skills: parsed.skills };
      return interpretSkillsDeterministically(input);
    } catch {
      return interpretSkillsDeterministically(input);
    }
  }

  async explainRecommendation(recommendation: RecommendationContext): Promise<string> {
    try {
      const anthropic = await this.client();
      const message = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 400,
        system:
          "You write a short, warm, plain-language explanation (3-5 sentences) of why a business " +
          "opportunity was recommended to a team. You are given the ONLY facts you may reference: a " +
          "structured scoring breakdown. Do not invent facts, numbers, or reasons that are not present " +
          "in the data you were given. Do not mention percentages you were not given. Write for someone " +
          "with limited business experience.",
        messages: [{ role: "user", content: JSON.stringify(recommendation) }],
      });
      return message.content.find((b) => b.type === "text")?.text ?? explainRecommendationDeterministically(recommendation);
    } catch {
      return explainRecommendationDeterministically(recommendation);
    }
  }

  async generateBusinessSummary(venture: VentureContext): Promise<string> {
    try {
      const anthropic = await this.client();
      const message = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 400,
        system:
          "You write a short (3-4 sentence), encouraging summary of an early-stage business venture " +
          "based only on the structured facts you are given. Do not invent details.",
        messages: [{ role: "user", content: JSON.stringify(venture) }],
      });
      return message.content.find((b) => b.type === "text")?.text ?? generateBusinessSummaryDeterministically(venture);
    } catch {
      return generateBusinessSummaryDeterministically(venture);
    }
  }
}

let cachedService: AIService | null = null;

/** Factory used by every service that needs AI narration. Server-side only. */
export function getAIService(): AIService {
  if (cachedService) return cachedService;
  cachedService =
    process.env.AI_MODE === "claude" ? new ClaudeAIService() : new MockAIService();
  return cachedService;
}
