import { describe, expect, it } from "vitest";
import { IDIOMA_PADRAO, IDIOMAS_SUPORTADOS, normalizarIdioma } from "@/lib/i18n/idiomas";
import { IDIOMAS_REGISTRADOS, IDIOMAS_VISIVEIS } from "@/lib/i18n/registro";
import { traduzir } from "@/lib/i18n/dicionario";
import enCatalog from "@/lib/i18n/traducoes/en.json";

describe("Phase 8: AlienMatrix Global English Localization", () => {
  it("enforces English as the sole default system language", () => {
    expect(IDIOMA_PADRAO).toBe("en");
  });

  it("registers English as the only active visible language", () => {
    expect(IDIOMAS_REGISTRADOS).toHaveLength(1);
    expect(IDIOMAS_REGISTRADOS[0]?.codigo).toBe("en");
    expect(IDIOMAS_REGISTRADOS[0]?.completo).toBe(true);
    expect(IDIOMAS_VISIVEIS).toHaveLength(1);
    expect(IDIOMAS_VISIVEIS[0]?.codigo).toBe("en");
  });

  it("strictly normalizes all locales to English", () => {
    expect(normalizarIdioma("pt-BR")).toBe("en");
    expect(normalizarIdioma("pt")).toBe("en");
    expect(normalizarIdioma("es")).toBe("en");
    expect(normalizarIdioma("fr")).toBe("en");
    expect(normalizarIdioma("en-US")).toBe("en");
    expect(normalizarIdioma(null)).toBe("en");
    expect(normalizarIdioma(undefined)).toBe("en");
  });

  it("contains over 10,000 translation keys in en.json covering the entire codebase", () => {
    const keyCount = Object.keys(enCatalog).length;
    expect(keyCount).toBeGreaterThan(10000);
  });

  it("translates common core CRM and interface terms into English", () => {
    expect(traduzir("Salvar")).toBe("Save");
    expect(traduzir("Configurações")).toBe("Settings");
    expect(traduzir("Cancelar")).toBe("Cancel");
    expect(traduzir("Entrar com Google")).toBe("Sign in with Google");
    expect(traduzir("Todas as tags")).toBe("All tags");
  });

  it("returns the input text directly if already in English or not matching a PT key", () => {
    expect(traduzir("Executive Dashboard")).toBe("Executive Dashboard");
    expect(traduzir("Lead Scoring & Qualification")).toBe("Lead Scoring & Qualification");
  });
});
