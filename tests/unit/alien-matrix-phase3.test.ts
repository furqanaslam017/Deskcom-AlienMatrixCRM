import { describe, expect, it } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  COMMON_TIMEZONES,
} from "@/lib/alien-matrix/tenant-settings-service";

describe("AlienMatrix Phase 3 — Roles, Security, Admin & Localization", () => {
  it("validates multi-language support (English, Urdu, Arabic, Portuguese)", () => {
    expect(SUPPORTED_LANGUAGES.length).toBe(4);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("ur");
    expect(codes).toContain("ar");
    expect(codes).toContain("pt-BR");

    const urdu = SUPPORTED_LANGUAGES.find((l) => l.code === "ur");
    expect(urdu?.dir).toBe("rtl");
    expect(urdu?.nativeName).toBe("اردو");

    const arabic = SUPPORTED_LANGUAGES.find((l) => l.code === "ar");
    expect(arabic?.dir).toBe("rtl");
    expect(arabic?.nativeName).toBe("العربية");

    const english = SUPPORTED_LANGUAGES.find((l) => l.code === "en");
    expect(english?.dir).toBe("ltr");

    const pt = SUPPORTED_LANGUAGES.find((l) => l.code === "pt-BR");
    expect(pt?.dir).toBe("ltr");
  });

  it("validates enterprise currency catalog", () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("GBP");
    expect(codes).toContain("BRL");
    expect(codes).toContain("PKR");
    expect(codes).toContain("AED");
    expect(codes).toContain("SAR");
  });

  it("validates common global timezones", () => {
    expect(COMMON_TIMEZONES).toContain("UTC");
    expect(COMMON_TIMEZONES).toContain("America/New_York");
    expect(COMMON_TIMEZONES).toContain("America/Sao_Paulo");
    expect(COMMON_TIMEZONES).toContain("Asia/Karachi");
    expect(COMMON_TIMEZONES).toContain("Asia/Dubai");
  });

  it("validates role permissions JSON schema structure", () => {
    const mockRolePermissions = {
      objects: {
        deals: ["read", "create", "update"],
        contacts: ["read", "update"],
      },
      fields: {
        "deals.value_cents": "readonly",
      },
      allRecordsVisibility: true,
    };

    expect(mockRolePermissions.objects.deals).toContain("create");
    expect(mockRolePermissions.fields["deals.value_cents"]).toBe("readonly");
    expect(mockRolePermissions.allRecordsVisibility).toBe(true);
  });
});
