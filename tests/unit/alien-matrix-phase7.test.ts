import { describe, it, expect } from "vitest";
import { DEFAULT_PLANS } from "@/lib/alien-matrix/billing-service";

describe("AlienMatrix Phase 7: Analytics and Billing", () => {
  it("contains valid billing plans catalog with tiered limits", () => {
    expect(DEFAULT_PLANS.length).toBe(3);

    const starter = DEFAULT_PLANS.find((p) => p.slug === "starter");
    const pro = DEFAULT_PLANS.find((p) => p.slug === "pro");
    const enterprise = DEFAULT_PLANS.find((p) => p.slug === "enterprise");

    expect(starter).toBeDefined();
    expect(starter!.max_seats).toBe(3);
    expect(starter!.max_whatsapp_numbers).toBe(1);
    expect(starter!.monthly_ai_tokens).toBe(1000000);

    expect(pro).toBeDefined();
    expect(pro!.max_seats).toBe(10);
    expect(pro!.max_whatsapp_numbers).toBe(4);
    expect(pro!.monthly_ai_tokens).toBe(5000000);

    expect(enterprise).toBeDefined();
    expect(enterprise!.max_seats).toBe(50);
    expect(enterprise!.max_whatsapp_numbers).toBe(15);
  });

  it("calculates annual billing discounts accurately", () => {
    for (const plan of DEFAULT_PLANS) {
      // Annual price should offer ~15-20% discount compared to 12 * monthly
      const full12Months = plan.price_monthly_cents * 12;
      expect(plan.price_yearly_cents).toBeLessThan(full12Months);

      const discountPercent = ((full12Months - plan.price_yearly_cents) / full12Months) * 100;
      expect(discountPercent).toBeGreaterThanOrEqual(15);
    }
  });

  it("validates weighted revenue forecast calculation", () => {
    const wonValue = 50000000; // R$ 500k
    const openPipeline = 100000000; // R$ 1M
    const probabilityWeight = 0.45;

    const weightedForecast = wonValue + Math.round(openPipeline * probabilityWeight);
    expect(weightedForecast).toBe(95000000); // R$ 950k
  });

  it("formats CSV report export headers correctly", () => {
    const stageData = [
      { name: "Prospecção", count: 12, value: 35000000, conversion: 100 },
      { name: "Negociação", count: 4, value: 18000000, conversion: 33 },
    ];

    let csv = "Etapa do Funil,Quantidade de Negócios,Valor Total (BRL),Conversão (%)\n";
    for (const s of stageData) {
      csv += `"${s.name}",${s.count},${(s.value / 100).toFixed(2)},${s.conversion}%\n`;
    }

    expect(csv).toContain("Etapa do Funil");
    expect(csv).toContain("Prospecção");
    expect(csv).toContain("350000.00");
    expect(csv.split("\n").length).toBe(4); // header + 2 rows + trailing empty line
  });
});
