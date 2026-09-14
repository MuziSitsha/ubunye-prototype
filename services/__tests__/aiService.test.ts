import { describe, expect, it } from "vitest";
import { MockAIService } from "@/services/aiService";
import type { RecommendationContext } from "@/types/domain";

describe("MockAIService.interpretSkills", () => {
  const ai = new MockAIService();

  it("extracts the expected skills from the Golden Demo's Sipho input (spec §55 step 1)", async () => {
    const result = await ai.interpretSkills(
      "I repair fridges and washing machines. I have worked with my uncle doing electrical work. I can drive and I'm good at fixing things."
    );
    const names = result.skills.map((s) => s.name);

    expect(names).toContain("Appliance Repair");
    expect(names).toContain("Electrical Maintenance");
    expect(names).toContain("Driving");
    for (const skill of result.skills) {
      expect(skill.confidence).toBeGreaterThan(0);
      expect(skill.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("returns no skills for input that matches nothing", async () => {
    const result = await ai.interpretSkills("asdkjhaskjdh qweoiqwe");
    expect(result.skills).toEqual([]);
  });

  it("is deterministic: identical input produces identical output", async () => {
    const a = await ai.interpretSkills("I bake cakes and do event planning.");
    const b = await ai.interpretSkills("I bake cakes and do event planning.");
    expect(a).toEqual(b);
  });
});

describe("MockAIService.explainRecommendation", () => {
  const ai = new MockAIService();

  it("never states a fact that isn't present in the components it was given", async () => {
    const context: RecommendationContext = {
      opportunityName: "Mobile Appliance Repair Service",
      opportunityDescription: "desc",
      total: 0.87,
      teamMemberNames: ["Sipho", "Thandi", "Kabelo", "Naledi"],
      components: {
        skill_coverage: { score: 1, matched: ["Appliance Repair", "Electrical Maintenance"], missing: [] },
        resource_coverage: { score: 1, matched: ["Tools", "Vehicle"], missing: [] },
        demand: { score: 0.84, signal_id: "opp-1" },
        location: { score: 1, basis: "same_city" },
        availability: { score: 0.75, basis: "part_time" },
      },
    };

    const explanation = await ai.explainRecommendation(context);

    expect(explanation).toContain("Appliance Repair");
    expect(explanation).toContain("Tools");
    expect(explanation).toContain("87%");
    // Must not claim a missing gap that doesn't exist.
    expect(explanation.toLowerCase()).not.toContain("gap right now");
  });

  it("surfaces missing skills/resources when they exist, so the explanation matches UBY-009's gap section", async () => {
    const context: RecommendationContext = {
      opportunityName: "Mobile Appliance Repair Service",
      opportunityDescription: "desc",
      total: 0.6,
      teamMemberNames: ["Sipho"],
      components: {
        skill_coverage: { score: 0.5, matched: ["Appliance Repair"], missing: ["Electrical Maintenance"] },
        resource_coverage: { score: 0.5, matched: ["Tools"], missing: ["Vehicle"] },
        demand: { score: 0.84, signal_id: "opp-1" },
        location: { score: 1, basis: "same_city" },
        availability: { score: 1, basis: "full_time" },
      },
    };

    const explanation = await ai.explainRecommendation(context);
    expect(explanation).toContain("Electrical Maintenance");
    expect(explanation).toContain("Vehicle");
  });
});
